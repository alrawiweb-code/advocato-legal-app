import { createClient } from "./client";
import { VerificationStatus } from "@/types";

export interface VerificationRequirement {
  id: string;
  name: string;
  description: string | null;
  is_required: boolean;
  country_code: string;
}

export interface VerificationDocumentRecord {
  id: string;
  application_id: string;
  lawyer_id: string;
  document_requirement_id: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  status: string;
  rejection_reason?: string | null;
  signedUrl?: string | null;
}

export interface LawyerApplicationRecord {
  id: string;
  lawyer_id: string;
  status: VerificationStatus;
  bar_number: string | null;
  state_bar: string | null;
  practice_jurisdictions: string[];
  years_experience: number | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  requested_changes: string | null;
  created_at: string;
  updated_at: string;
  lawyer_profile?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
    title?: string;
    headline?: string;
    hourly_rate?: number;
    practice_areas?: string[];
  };
  documents?: VerificationDocumentRecord[];
}

/**
 * Fetch required verification documents config
 */
export async function getVerificationRequirements(): Promise<VerificationRequirement[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("verification_document_requirements")
    .select("*")
    .order("is_required", { ascending: false });

  if (error) {
    console.error("Error fetching verification requirements:", error);
    return [];
  }
  return data || [];
}

/**
 * Get current lawyer's verification application
 */
export async function getLawyerApplication(lawyerId: string): Promise<LawyerApplicationRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lawyer_verification_applications")
    .select(`
      *,
      documents:verification_documents(*)
    `)
    .eq("lawyer_id", lawyerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching lawyer application:", error);
    return null;
  }
  return data as LawyerApplicationRecord | null;
}

/**
 * Submit lawyer verification application with documents
 */
export async function submitVerificationApplication(payload: {
  lawyerId: string;
  barNumber: string;
  stateBar: string;
  yearsExperience: number;
  practiceJurisdictions?: string[];
  documents: { requirementId: string; file: File }[];
}): Promise<{ success: boolean; error?: string; application?: LawyerApplicationRecord }> {
  const supabase = createClient();

  try {
    // 1. Check existing draft or pending application
    const { data: existingApp } = await supabase
      .from("lawyer_verification_applications")
      .select("id, status")
      .eq("lawyer_id", payload.lawyerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let applicationId = existingApp?.id;

    if (!applicationId) {
      const { data: newApp, error: createAppErr } = await supabase
        .from("lawyer_verification_applications")
        .insert({
          lawyer_id: payload.lawyerId,
          bar_number: payload.barNumber.trim(),
          state_bar: payload.stateBar,
          years_experience: payload.yearsExperience,
          practice_jurisdictions: payload.practiceJurisdictions || [payload.stateBar],
          status: "PENDING",
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createAppErr) throw createAppErr;
      applicationId = newApp.id;
    } else {
      const { error: updateAppErr } = await supabase
        .from("lawyer_verification_applications")
        .update({
          bar_number: payload.barNumber.trim(),
          state_bar: payload.stateBar,
          years_experience: payload.yearsExperience,
          practice_jurisdictions: payload.practiceJurisdictions || [payload.stateBar],
          status: "PENDING",
          submitted_at: new Date().toISOString(),
          rejection_reason: null,
          requested_changes: null,
        })
        .eq("id", applicationId);

      if (updateAppErr) throw updateAppErr;
    }

    // 2. Upload documents to bucket 'verification-documents'
    for (const doc of payload.documents) {
      const sanitizedName = doc.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${payload.lawyerId}/${Date.now()}_${sanitizedName}`;

      const { error: uploadErr } = await supabase.storage
        .from("verification-documents")
        .upload(storagePath, doc.file, {
          upsert: true,
          contentType: doc.file.type,
        });

      if (uploadErr) {
        console.error("Storage upload error for doc:", doc.requirementId, uploadErr);
        throw new Error(`Failed to upload ${doc.file.name}: ${uploadErr.message}`);
      }

      // Record in verification_documents
      const { error: docInsertErr } = await supabase
        .from("verification_documents")
        .insert({
          application_id: applicationId,
          lawyer_id: payload.lawyerId,
          document_requirement_id: doc.requirementId,
          original_filename: doc.file.name,
          mime_type: doc.file.type || "application/octet-stream",
          file_size: doc.file.size,
          storage_path: storagePath,
          status: "UPLOADED",
        });

      if (docInsertErr) {
        console.error("Document record error:", docInsertErr);
      }
    }

    // 3. Update lawyer profile status to PENDING
    await supabase
      .from("lawyer_profiles")
      .update({
        is_verified: false,
        verification_status: "PENDING",
        bar_number: payload.barNumber.trim(),
        state_bar: payload.stateBar,
      })
      .eq("id", payload.lawyerId);

    // 4. Log audit entry
    await supabase.from("verification_audit_logs").insert({
      application_id: applicationId,
      actor_id: payload.lawyerId,
      actor_role: "lawyer",
      action: "SUBMIT_APPLICATION",
      previous_status: existingApp?.status || "NOT_VERIFIED",
      new_status: "PENDING",
      reason: "Attorney credentials and compliance documents submitted for verification.",
    });

    return { success: true };
  } catch (err: any) {
    console.error("Submit application error:", err);
    return { success: false, error: err.message || "Failed to submit application" };
  }
}

/**
 * Fetch all applications for Admin review
 */
export async function getAdminApplications(filterStatus?: string): Promise<LawyerApplicationRecord[]> {
  const supabase = createClient();
  let query = supabase
    .from("lawyer_verification_applications")
    .select(`
      *,
      profiles:lawyer_id(full_name, email, avatar_url),
      lawyer_profiles:lawyer_id(title, headline, hourly_rate, practice_areas),
      documents:verification_documents(*)
    `)
    .order("created_at", { ascending: false });

  if (filterStatus && filterStatus !== "ALL") {
    query = query.eq("status", filterStatus);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Admin applications query error:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    ...row,
    lawyer_profile: {
      full_name: row.profiles?.full_name || "Advocate",
      email: row.profiles?.email || "",
      avatar_url: row.profiles?.avatar_url || null,
      title: row.lawyer_profiles?.title || "Advocate",
      headline: row.lawyer_profiles?.headline || "",
      hourly_rate: row.lawyer_profiles?.hourly_rate || 2500,
      practice_areas: row.lawyer_profiles?.practice_areas || [],
    },
  }));
}

/**
 * Fetch single application details with pre-generated secure signed URLs for all documents
 */
export async function getAdminApplicationDetail(applicationId: string): Promise<LawyerApplicationRecord | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lawyer_verification_applications")
    .select(`
      *,
      profiles:lawyer_id(full_name, email, avatar_url),
      lawyer_profiles:lawyer_id(title, headline, hourly_rate, practice_areas, bio),
      documents:verification_documents(*)
    `)
    .eq("id", applicationId)
    .single();

  if (error || !data) {
    console.error("Error fetching application detail:", error);
    return null;
  }

  // Generate signed URLs (1 hour expiry) for each document
  const docsWithSignedUrls: VerificationDocumentRecord[] = [];
  if (data.documents && Array.isArray(data.documents)) {
    for (const doc of data.documents) {
      try {
        const { data: signedData } = await supabase.storage
          .from("verification-documents")
          .createSignedUrl(doc.storage_path, 3600);

        docsWithSignedUrls.push({
          ...doc,
          signedUrl: signedData?.signedUrl || null,
        });
      } catch (e) {
        docsWithSignedUrls.push({ ...doc, signedUrl: null });
      }
    }
  }

  return {
    ...data,
    lawyer_profile: {
      full_name: data.profiles?.full_name || "Advocate",
      email: data.profiles?.email || "",
      avatar_url: data.profiles?.avatar_url || null,
      title: data.lawyer_profiles?.title || "Advocate",
      headline: data.lawyer_profiles?.headline || "",
      hourly_rate: data.lawyer_profiles?.hourly_rate || 2500,
      practice_areas: data.lawyer_profiles?.practice_areas || [],
    },
    documents: docsWithSignedUrls,
  };
}

/**
 * Admin: Approve verification application
 */
export async function approveLawyerApplication(
  applicationId: string,
  lawyerId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // 1. Update application status
    const { error: appErr } = await supabase
      .from("lawyer_verification_applications")
      .update({
        status: "APPROVED",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        rejection_reason: null,
      })
      .eq("id", applicationId);

    if (appErr) throw appErr;

    // 2. Update lawyer profile to is_verified: true, status: 'VERIFIED'
    const { error: lawyerErr } = await supabase
      .from("lawyer_profiles")
      .update({
        is_verified: true,
        verification_status: "VERIFIED",
      })
      .eq("id", lawyerId);

    if (lawyerErr) throw lawyerErr;

    // 3. Mark documents as approved
    await supabase
      .from("verification_documents")
      .update({
        status: "APPROVED",
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("application_id", applicationId);

    // 4. Record in audit logs
    await supabase.from("verification_audit_logs").insert({
      application_id: applicationId,
      actor_id: adminId,
      actor_role: "admin",
      action: "APPROVE_APPLICATION",
      previous_status: "PENDING",
      new_status: "APPROVED",
      reason: "Credentials verified, enrollment verified with Bar Council.",
    });

    return { success: true };
  } catch (err: any) {
    console.error("Approve application error:", err);
    return { success: false, error: err.message || "Failed to approve application" };
  }
}

/**
 * Admin: Reject verification application with specific reason
 */
export async function rejectLawyerApplication(
  applicationId: string,
  lawyerId: string,
  adminId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // 1. Update application status
    const { error: appErr } = await supabase
      .from("lawyer_verification_applications")
      .update({
        status: "REJECTED",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        rejection_reason: reason.trim(),
      })
      .eq("id", applicationId);

    if (appErr) throw appErr;

    // 2. Update lawyer profile to is_verified: false, status: 'REJECTED'
    const { error: lawyerErr } = await supabase
      .from("lawyer_profiles")
      .update({
        is_verified: false,
        verification_status: "REJECTED",
      })
      .eq("id", lawyerId);

    if (lawyerErr) throw lawyerErr;

    // 3. Record in audit logs
    await supabase.from("verification_audit_logs").insert({
      application_id: applicationId,
      actor_id: adminId,
      actor_role: "admin",
      action: "REJECT_APPLICATION",
      previous_status: "PENDING",
      new_status: "REJECTED",
      reason: reason.trim(),
    });

    return { success: true };
  } catch (err: any) {
    console.error("Reject application error:", err);
    return { success: false, error: err.message || "Failed to reject application" };
  }
}

/**
 * Fetch high-level admin metrics
 */
export async function getAdminPlatformMetrics(): Promise<{
  pendingApplications: number;
  verifiedLawyers: number;
  rejectedApplications: number;
  totalMatters: number;
}> {
  const supabase = createClient();

  const [
    { count: pendingCount },
    { count: verifiedCount },
    { count: rejectedCount },
    { count: mattersCount },
  ] = await Promise.all([
    supabase
      .from("lawyer_verification_applications")
      .select("*", { count: "exact", head: true })
      .in("status", ["PENDING", "SUBMITTED", "UNDER_REVIEW"]),
    supabase
      .from("lawyer_profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_verified", true),
    supabase
      .from("lawyer_verification_applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "REJECTED"),
    supabase
      .from("matters")
      .select("*", { count: "exact", head: true }),
  ]);

  return {
    pendingApplications: pendingCount || 0,
    verifiedLawyers: verifiedCount || 0,
    rejectedApplications: rejectedCount || 0,
    totalMatters: mattersCount || 0,
  };
}
