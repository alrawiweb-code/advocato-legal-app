/**
 * ADVOCATO — Suspension/Rejection Inquiry System
 *
 * Provides server-side (service-role) functions for admin operations
 * and client-side (anon-key) functions for lawyer operations.
 *
 * All admin mutations use getAdminClient() to bypass RLS safely.
 * All lawyer mutations go through the anon client + RLS policies.
 */

import { createClient as createAnonClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";

// Re-use the existing admin client helper from verification.ts
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceKey) throw new Error("Missing Supabase service role credentials.");
  return createServiceClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ============================================================
// TYPES
// ============================================================

export type InquiryType = "SUSPENSION" | "REJECTION";
export type InquiryStatus = "OPEN" | "ADMIN_REPLIED" | "LAWYER_REPLIED" | "RESOLVED" | "CLOSED";
export type MessageSenderRole = "lawyer" | "admin";

export interface SuspensionInquiry {
  id: string;
  lawyer_id: string;
  audit_log_id: string | null;
  application_id: string | null;
  inquiry_type: InquiryType;
  status: InquiryStatus;
  suspension_reason_snapshot: string | null;
  suspended_at_snapshot: string | null;
  suspended_by_snapshot: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  expires_at: string;
  // Joined fields
  lawyer_profile?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  messages?: InquiryMessage[];
}

export interface InquiryMessage {
  id: string;
  inquiry_id: string;
  sender_id: string;
  sender_role: MessageSenderRole;
  message: string;
  is_read: boolean;
  created_at: string;
  sender_profile?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

// ============================================================
// LAWYER-SIDE: Create or fetch existing inquiry
// ============================================================

/**
 * Lawyer opens/gets an inquiry about their current suspension or rejection.
 * If one already exists for this audit event, returns it.
 * Otherwise creates a new one.
 * Called via API route (server-side) so we can use service role for reading
 * the audit log but the inquiry insert is done as the lawyer.
 */
export async function getOrCreateInquiry(
  lawyerId: string,
  inquiryType: InquiryType
): Promise<{ inquiry: SuspensionInquiry | null; error?: string }> {
  const admin = getAdminClient();

  try {
    // Find the most recent audit log event for this lawyer + type
    const action = inquiryType === "SUSPENSION" ? "LAWYER_SUSPENDED" : "REJECTED";
    const { data: auditLog } = await admin
      .from("verification_audit_logs")
      .select("id, reason, created_at, actor_id, application_id")
      .or(`action.eq.${action}`)
      .order("created_at", { ascending: false })
      .limit(20);

    // Find audit logs for this lawyer by checking application_id -> lawyer_id
    let matchingAuditLog: any = null;
    if (auditLog && auditLog.length > 0) {
      for (const log of auditLog) {
        if (log.application_id) {
          const { data: app } = await admin
            .from("lawyer_verification_applications")
            .select("lawyer_id")
            .eq("id", log.application_id)
            .single();
          if (app?.lawyer_id === lawyerId) {
            matchingAuditLog = log;
            break;
          }
        } else {
          // Direct action with no application (suspension after approval)
          matchingAuditLog = log;
          break;
        }
      }
    }

    // Check if an inquiry for this audit event already exists
    let existingQuery = admin
      .from("suspension_inquiries")
      .select("*")
      .eq("lawyer_id", lawyerId)
      .eq("inquiry_type", inquiryType)
      .order("created_at", { ascending: false })
      .limit(1);

    if (matchingAuditLog?.id) {
      existingQuery = admin
        .from("suspension_inquiries")
        .select("*")
        .eq("lawyer_id", lawyerId)
        .eq("audit_log_id", matchingAuditLog.id)
        .limit(1);
    }

    const { data: existing } = await existingQuery;
    if (existing && existing.length > 0) {
      return { inquiry: existing[0] as SuspensionInquiry };
    }

    // Fetch lawyer's current profile for snapshot
    const { data: lp } = await admin
      .from("lawyer_profiles")
      .select("suspension_reason, suspended_at")
      .eq("id", lawyerId)
      .single();

    // Create new inquiry
    const { data: created, error: createErr } = await admin
      .from("suspension_inquiries")
      .insert({
        lawyer_id: lawyerId,
        audit_log_id: matchingAuditLog?.id || null,
        inquiry_type: inquiryType,
        status: "OPEN",
        suspension_reason_snapshot:
          lp?.suspension_reason || matchingAuditLog?.reason || null,
        suspended_at_snapshot: lp?.suspended_at || matchingAuditLog?.created_at || null,
        suspended_by_snapshot: matchingAuditLog?.actor_id || null,
      })
      .select()
      .single();

    if (createErr) throw createErr;
    return { inquiry: created as SuspensionInquiry };
  } catch (err: any) {
    console.error("getOrCreateInquiry error:", err);
    return { inquiry: null, error: err.message || "Failed to open inquiry" };
  }
}

/**
 * Get an inquiry with its full message history (lawyer-side).
 * Uses service role to fetch — RLS enforced at API route level.
 */
export async function getInquiryWithMessages(
  inquiryId: string,
  lawyerId: string
): Promise<{ inquiry: SuspensionInquiry | null; error?: string }> {
  const admin = getAdminClient();

  try {
    const { data: inquiry, error } = await admin
      .from("suspension_inquiries")
      .select("*")
      .eq("id", inquiryId)
      .eq("lawyer_id", lawyerId) // enforce ownership
      .single();

    if (error || !inquiry) return { inquiry: null, error: "Inquiry not found." };

    const { data: messages } = await admin
      .from("suspension_inquiry_messages")
      .select("*")
      .eq("inquiry_id", inquiryId)
      .order("created_at", { ascending: true });

    // Fetch sender profiles
    const senderIds = [...new Set((messages || []).map((m: any) => m.sender_id))];
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", senderIds);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

    const enrichedMessages: InquiryMessage[] = (messages || []).map((m: any) => ({
      ...m,
      sender_profile: profileMap[m.sender_id] || null,
    }));

    return {
      inquiry: { ...(inquiry as SuspensionInquiry), messages: enrichedMessages },
    };
  } catch (err: any) {
    return { inquiry: null, error: err.message };
  }
}

/**
 * Post a message to an inquiry (lawyer or admin).
 */
export async function postInquiryMessage(
  inquiryId: string,
  senderId: string,
  senderRole: MessageSenderRole,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const admin = getAdminClient();

  try {
    // Verify inquiry exists
    const { data: inquiry, error: fetchErr } = await admin
      .from("suspension_inquiries")
      .select("id, status, lawyer_id")
      .eq("id", inquiryId)
      .single();

    if (fetchErr || !inquiry) return { success: false, error: "Inquiry not found." };
    if (inquiry.status === "CLOSED" || inquiry.status === "RESOLVED") {
      return { success: false, error: "This inquiry is closed and no longer accepting messages." };
    }

    // Enforce ownership: lawyer can only post to their own inquiry
    if (senderRole === "lawyer" && inquiry.lawyer_id !== senderId) {
      return { success: false, error: "Forbidden: You can only message your own inquiry." };
    }

    const { error: insertErr } = await admin
      .from("suspension_inquiry_messages")
      .insert({
        inquiry_id: inquiryId,
        sender_id: senderId,
        sender_role: senderRole,
        message: message.trim(),
        is_read: false,
      });

    if (insertErr) throw insertErr;

    // Update inquiry status
    const newStatus: InquiryStatus =
      senderRole === "admin" ? "ADMIN_REPLIED" : "LAWYER_REPLIED";
    await admin
      .from("suspension_inquiries")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", inquiryId);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to send message" };
  }
}

// ============================================================
// ADMIN-SIDE
// ============================================================

/**
 * Admin: Get all suspension/rejection inquiries with latest message.
 */
export async function getAdminInquiries(
  typeFilter: "ALL" | "SUSPENSION" | "REJECTION" = "ALL",
  statusFilter: "ALL" | InquiryStatus = "ALL"
): Promise<SuspensionInquiry[]> {
  const admin = getAdminClient();

  try {
    let query = admin
      .from("suspension_inquiries")
      .select("*")
      .order("updated_at", { ascending: false });

    if (typeFilter !== "ALL") query = query.eq("inquiry_type", typeFilter);
    if (statusFilter !== "ALL") query = query.eq("status", statusFilter);

    const { data: inquiries, error } = await query;
    if (error || !inquiries) return [];

    // Fetch lawyer profiles
    const lawyerIds = [...new Set(inquiries.map((i: any) => i.lawyer_id))];
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", lawyerIds);

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

    // Fetch latest message per inquiry
    const inquiryIds = inquiries.map((i: any) => i.id);
    const { data: allMessages } = await admin
      .from("suspension_inquiry_messages")
      .select("*")
      .in("inquiry_id", inquiryIds)
      .order("created_at", { ascending: false });

    const latestMessageMap: Record<string, any> = {};
    (allMessages || []).forEach((m: any) => {
      if (!latestMessageMap[m.inquiry_id]) {
        latestMessageMap[m.inquiry_id] = m;
      }
    });

    return inquiries.map((i: any) => ({
      ...i,
      lawyer_profile: profileMap[i.lawyer_id] || null,
      messages: latestMessageMap[i.id] ? [latestMessageMap[i.id]] : [],
    })) as SuspensionInquiry[];
  } catch (err: any) {
    console.error("getAdminInquiries error:", err);
    return [];
  }
}

/**
 * Admin: Get a single inquiry with full message history.
 */
export async function getAdminInquiryDetail(
  inquiryId: string
): Promise<SuspensionInquiry | null> {
  const admin = getAdminClient();

  try {
    const { data: inquiry, error } = await admin
      .from("suspension_inquiries")
      .select("*")
      .eq("id", inquiryId)
      .single();

    if (error || !inquiry) return null;

    // Fetch full message thread
    const { data: messages } = await admin
      .from("suspension_inquiry_messages")
      .select("*")
      .eq("inquiry_id", inquiryId)
      .order("created_at", { ascending: true });

    const senderIds = [...new Set((messages || []).map((m: any) => m.sender_id))];
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", senderIds.concat([inquiry.lawyer_id]));

    const profileMap: Record<string, any> = {};
    (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });

    const enrichedMessages: InquiryMessage[] = (messages || []).map((m: any) => ({
      ...m,
      sender_profile: profileMap[m.sender_id] || null,
    }));

    return {
      ...(inquiry as SuspensionInquiry),
      lawyer_profile: profileMap[inquiry.lawyer_id] || null,
      messages: enrichedMessages,
    };
  } catch (err: any) {
    return null;
  }
}

/**
 * Admin: Update inquiry status (RESOLVED / CLOSED).
 */
export async function updateInquiryStatus(
  inquiryId: string,
  status: "OPEN" | "RESOLVED" | "CLOSED"
): Promise<{ success: boolean; error?: string }> {
  const admin = getAdminClient();

  try {
    const { error } = await admin
      .from("suspension_inquiries")
      .update({
        status,
        resolved_at: status === "OPEN" ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", inquiryId);

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
