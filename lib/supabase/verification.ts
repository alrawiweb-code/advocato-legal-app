import { createClient } from "./client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { VerificationStatus } from "@/types";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createSupabaseClient(supabaseUrl, supabaseServiceKey);
}

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
  is_active?: boolean;
  replaced_document_id?: string | null;
  rejection_reason?: string | null;
  signedUrl?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface VerificationAuditLogRecord {
  id: string;
  application_id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  previous_status?: string | null;
  new_status?: string | null;
  reason?: string | null;
  created_at: string;
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
    verification_status?: VerificationStatus;
    is_verified?: boolean;
    suspension_reason?: string | null;
    suspended_at?: string | null;
  };
  documents?: VerificationDocumentRecord[];
  audit_logs?: VerificationAuditLogRecord[];
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
 * Get current lawyer's verification application with signed URLs for documents
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

  if (!data) return null;

  // Generate signed preview URLs for documents
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

  // Sort: active documents first, then newest
  docsWithSignedUrls.sort((a, b) => {
    if (a.is_active === false && b.is_active !== false) return 1;
    if (a.is_active !== false && b.is_active === false) return -1;
    return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
  });

  return {
    ...data,
    documents: docsWithSignedUrls,
  } as LawyerApplicationRecord;
}

/**
 * Replace a single verification document safely.
 * Keeps the old document record for audit purposes while marking the new document as active.
 * If the lawyer is suspended, the lawyer account remains suspended (never auto-verified),
 * and the application transitions to UNDER_REVIEW for admin re-verification.
 */
export async function replaceLawyerVerificationDocument(payload: {
  lawyerId: string;
  requirementId: string;
  file: File | Blob;
  filename: string;
  mimeType: string;
  fileSize: number;
}): Promise<{ success: boolean; error?: string; document?: VerificationDocumentRecord }> {
  const supabase = getAdminClient();

  try {
    // 1. Fetch current application & profile state
    const [appRes, profileRes] = await Promise.all([
      supabase
        .from("lawyer_verification_applications")
        .select("id, status")
        .eq("lawyer_id", payload.lawyerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("lawyer_profiles")
        .select("verification_status, is_verified")
        .eq("id", payload.lawyerId)
        .maybeSingle(),
    ]);

    if (appRes.error || !appRes.data) {
      return { success: false, error: "Verification application record not found." };
    }

    const app = appRes.data;

    if (app.status === "REJECTED") {
      return {
        success: false,
        error: "Application is currently rejected and locked. You cannot replace documents until an administrator explicitly reopens your application.",
      };
    }

    const isSuspended = profileRes.data?.verification_status === "SUSPENDED" || app.status === "SUSPENDED";

    // 2. Upload file to Supabase storage
    const sanitizedName = payload.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${payload.lawyerId}/${payload.requirementId}_${Date.now()}_${sanitizedName}`;

    const { error: uploadErr } = await supabase.storage
      .from("verification-documents")
      .upload(storagePath, payload.file, {
        upsert: true,
        contentType: payload.mimeType,
      });

    if (uploadErr) {
      console.error("Storage upload error during replacement:", uploadErr);
      return { success: false, error: `Storage upload failed: ${uploadErr.message}` };
    }

    // 3. Find existing documents for this requirement
    const { data: existingDocs } = await supabase
      .from("verification_documents")
      .select("id, status")
      .eq("lawyer_id", payload.lawyerId)
      .eq("document_requirement_id", payload.requirementId)
      .order("created_at", { ascending: false });

    // 4. Defensive schema check for is_active column
    let hasIsActiveColumn = true;
    const { error: testColErr } = await supabase
      .from("verification_documents")
      .select("is_active")
      .limit(1);

    if (testColErr) {
      if (testColErr.code === "42703" || testColErr.message?.includes("is_active")) {
        hasIsActiveColumn = false;
      } else {
        throw testColErr;
      }
    }

    const activeOldDoc = existingDocs?.[0];

    // 5. Mark existing documents as superseded if is_active column exists
    if (hasIsActiveColumn && existingDocs && existingDocs.length > 0) {
      await supabase
        .from("verification_documents")
        .update({ is_active: false })
        .eq("lawyer_id", payload.lawyerId)
        .eq("document_requirement_id", payload.requirementId);
    }

    // 6. Insert new document record
    const insertPayload: Record<string, any> = {
      application_id: app.id,
      lawyer_id: payload.lawyerId,
      document_requirement_id: payload.requirementId,
      original_filename: payload.filename,
      mime_type: payload.mimeType,
      file_size: payload.fileSize,
      storage_path: storagePath,
      status: "UPLOADED",
    };

    if (hasIsActiveColumn) {
      insertPayload.is_active = true;
      insertPayload.replaced_document_id = activeOldDoc?.id || null;
    }

    const { data: newDoc, error: insertErr } = await supabase
      .from("verification_documents")
      .insert(insertPayload)
      .select()
      .single();

    if (insertErr) {
      console.error("Document insert error during replacement:", insertErr);
      return { success: false, error: `Database insert failed: ${insertErr.message}` };
    }

    // 7. Transition application status:
    // If lawyer was suspended, the application becomes 'UNDER_REVIEW' for re-verification.
    // The lawyer's profile status REMAINS 'SUSPENDED' (never auto-verify!).
    if (isSuspended || app.status === "APPROVED" || app.status === "DOCUMENTS_REQUIRED") {
      await supabase
        .from("lawyer_verification_applications")
        .update({
          status: "UNDER_REVIEW",
          submitted_at: new Date().toISOString(),
          requested_changes: null,
        })
        .eq("id", app.id);
    }

    // 8. Write audit log
    await supabase.from("verification_audit_logs").insert({
      application_id: app.id,
      actor_id: payload.lawyerId,
      actor_role: "lawyer",
      action: isSuspended ? "SUBMIT_REVERIFICATION_DOC" : "REPLACE_DOCUMENT",
      reason: `Uploaded replacement document for ${payload.requirementId}: ${payload.filename}.`,
    });

    return { success: true, document: newDoc };
  } catch (err: any) {
    console.error("Replace document error:", err);
    return { success: false, error: err.message || "Failed to replace document." };
  }
}

/**
 * Submit or resubmit lawyer verification application with documents
 */
export async function submitVerificationApplication(payload: {
  lawyerId: string;
  barNumber: string;
  stateBar: string;
  yearsExperience: number;
  practiceJurisdictions?: string[];
  documents: { requirementId: string; file: File }[];
}): Promise<{ success: boolean; error?: string; application?: LawyerApplicationRecord }> {
  // If running in browser environment, route through the authenticated server API
  if (typeof window !== "undefined") {
    try {
      const formData = new FormData();
      formData.append("lawyerId", payload.lawyerId);
      formData.append("barNumber", payload.barNumber);
      formData.append("stateBar", payload.stateBar);
      formData.append("yearsExperience", String(payload.yearsExperience));
      for (const doc of payload.documents) {
        formData.append(`file_${doc.requirementId}`, doc.file);
      }

      const res = await fetch("/api/lawyer/verification/submit", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        return { success: false, error: data?.error || `Submission failed with status ${res.status}` };
      }
      return { success: true, application: data.application };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error during submission." };
    }
  }

  // Server-side execution
  const supabase = getAdminClient();

  try {
    // 0. Check current lawyer profile to preserve suspension status if suspended
    const { data: currentProfile } = await supabase
      .from("lawyer_profiles")
      .select("verification_status, is_verified, suspension_reason, hourly_rate")
      .eq("id", payload.lawyerId)
      .maybeSingle();

    const isSuspended = currentProfile?.verification_status === "SUSPENDED";

    // Upsert lawyer profile while strictly maintaining SUSPENDED state if currently suspended
    const profileUpdate: Record<string, any> = {
      id: payload.lawyerId,
      title: "Advocate",
      headline: `${payload.practiceJurisdictions?.[0] || payload.stateBar} Specialist`,
      jurisdiction: payload.stateBar,
      state: payload.stateBar,
      practice_areas: [payload.practiceJurisdictions?.[0] || "General Practice"],
      is_verified: false,
      verification_status: isSuspended ? "SUSPENDED" : "UNDER_REVIEW",
      bar_number: payload.barNumber.trim(),
      state_bar: payload.stateBar,
      years_experience: payload.yearsExperience,
      availability: "Available today",
      bio: `Licensed attorney admitted to the Bar Council of ${payload.stateBar}.`,
    };

    if (isSuspended && currentProfile?.suspension_reason) {
      profileUpdate.suspension_reason = currentProfile.suspension_reason;
    } else if (!isSuspended) {
      profileUpdate.suspension_reason = null;
      profileUpdate.suspended_at = null;
    }
    if (currentProfile?.hourly_rate !== undefined && currentProfile?.hourly_rate !== null) {
      profileUpdate.hourly_rate = currentProfile.hourly_rate;
    }

    const { data: updatedProfiles, error: profileErr } = await supabase
      .from("lawyer_profiles")
      .upsert(profileUpdate)
      .select();

    if (profileErr) throw profileErr;
    if (!updatedProfiles || updatedProfiles.length === 0) {
      throw new Error("Lawyer profile update failed: zero rows affected.");
    }

    // 1. Check existing draft or pending application
    const { data: existingApp } = await supabase
      .from("lawyer_verification_applications")
      .select("id, status")
      .eq("lawyer_id", payload.lawyerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let applicationId = existingApp?.id;

    if (existingApp?.status === "REJECTED") {
      throw new Error(
        "Application is currently rejected and locked. You cannot submit documents until an administrator explicitly reopens your application."
      );
    }

    const targetAppStatus = "UNDER_REVIEW";

    if (!applicationId) {
      const { data: newApp, error: createAppErr } = await supabase
        .from("lawyer_verification_applications")
        .insert({
          lawyer_id: payload.lawyerId,
          bar_number: payload.barNumber.trim(),
          state_bar: payload.stateBar,
          years_experience: payload.yearsExperience,
          practice_jurisdictions: payload.practiceJurisdictions || [payload.stateBar],
          status: targetAppStatus,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createAppErr) throw createAppErr;
      applicationId = newApp.id;
    } else {
      const { data: updatedApps, error: updateAppErr } = await supabase
        .from("lawyer_verification_applications")
        .update({
          bar_number: payload.barNumber.trim(),
          state_bar: payload.stateBar,
          years_experience: payload.yearsExperience,
          practice_jurisdictions: payload.practiceJurisdictions || [payload.stateBar],
          status: targetAppStatus,
          submitted_at: new Date().toISOString(),
          // Preserve rejection_reason for historical audit integrity
          requested_changes: null,
        })
        .eq("id", applicationId)
        .select();

      if (updateAppErr) throw updateAppErr;
      if (!updatedApps || updatedApps.length === 0) {
        throw new Error("Application record update failed: zero rows affected.");
      }
    }

    // 2. Upload documents to bucket 'verification-documents' with active tracking
    if (payload.documents.length > 0) {
      // Defensive schema check: does column is_active exist in verification_documents?
      let hasIsActiveColumn = true;
      const { error: testColErr } = await supabase
        .from("verification_documents")
        .select("is_active")
        .limit(1);

      if (testColErr) {
        if (testColErr.code === "42703" || testColErr.message?.includes("is_active")) {
          hasIsActiveColumn = false;
        } else {
          throw testColErr;
        }
      }

      for (const doc of payload.documents) {
        const sanitizedName = doc.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `${payload.lawyerId}/${doc.requirementId}_${Date.now()}_${sanitizedName}`;

        const fileBuffer = Buffer.from(await doc.file.arrayBuffer());
        const { error: uploadErr } = await supabase.storage
          .from("verification-documents")
          .upload(storagePath, fileBuffer, {
            upsert: true,
            contentType: doc.file.type || "application/octet-stream",
          });

        if (uploadErr) {
          console.error("Storage upload error for doc:", doc.requirementId, uploadErr);
          throw new Error(`Failed to upload ${doc.file.name}: ${uploadErr.message}`);
        }

        if (hasIsActiveColumn) {
          // Mark older versions for this requirement as superseded
          const { data: oldActive } = await supabase
            .from("verification_documents")
            .select("id")
            .eq("lawyer_id", payload.lawyerId)
            .eq("document_requirement_id", doc.requirementId)
            .eq("is_active", true)
            .maybeSingle();

          if (oldActive) {
            await supabase
              .from("verification_documents")
              .update({ is_active: false })
              .eq("id", oldActive.id);
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
              is_active: true,
              replaced_document_id: oldActive?.id || null,
            });

          if (docInsertErr) throw docInsertErr;
        } else {
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

          if (docInsertErr) throw docInsertErr;
        }
      }
    }

    // 4. Log audit entry
    await supabase.from("verification_audit_logs").insert({
      application_id: applicationId,
      actor_id: payload.lawyerId,
      actor_role: "lawyer",
      action: isSuspended ? "SUBMIT_REVERIFICATION" : "SUBMIT_APPLICATION",
      previous_status: existingApp?.status || "NOT_VERIFIED",
      new_status: targetAppStatus,
      reason: isSuspended
        ? "Re-verification credentials and compliance dossier submitted following suspension."
        : "Attorney credentials and compliance documents submitted for verification.",
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
  const supabase = getAdminClient();
  let query = supabase
    .from("lawyer_verification_applications")
    .select(`
      *,
      lawyer_profiles (
        title, headline, hourly_rate, practice_areas,
        is_verified, verification_status, suspension_reason, suspended_at,
        profiles (full_name, email, avatar_url)
      ),
      documents:verification_documents(*)
    `)
    .order("created_at", { ascending: false });

  if (filterStatus && filterStatus !== "ALL") {
    if (filterStatus === "REVERIFICATION") {
      query = query.eq("status", "UNDER_REVIEW");
    } else {
      query = query.eq("status", filterStatus);
    }
  }

  const { data, error } = await query;
  if (error) {
    console.error("Admin applications query error:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    ...row,
    lawyer_profile: {
      full_name: row.lawyer_profiles?.profiles?.full_name || "Advocate",
      email: row.lawyer_profiles?.profiles?.email || "",
      avatar_url: row.lawyer_profiles?.profiles?.avatar_url || null,
      title: row.lawyer_profiles?.title || "Advocate",
      headline: row.lawyer_profiles?.headline || "",
      hourly_rate: row.lawyer_profiles?.hourly_rate,
      practice_areas: row.lawyer_profiles?.practice_areas || [],
      is_verified: row.lawyer_profiles?.is_verified,
      verification_status: row.lawyer_profiles?.verification_status,
      suspension_reason: row.lawyer_profiles?.suspension_reason,
      suspended_at: row.lawyer_profiles?.suspended_at,
    },
  }));
}

/**
 * Fetch single application details with pre-generated secure signed URLs for all documents,
 * and include complete audit logs for transparency.
 */
export async function getAdminApplicationDetail(applicationId: string): Promise<LawyerApplicationRecord | null> {
  const supabase = getAdminClient();
  const [appRes, auditRes] = await Promise.all([
    supabase
      .from("lawyer_verification_applications")
      .select(`
        *,
        lawyer_profiles (
          title, headline, hourly_rate, practice_areas, bio,
          is_verified, verification_status, suspension_reason, suspended_at,
          profiles (full_name, email, avatar_url)
        ),
        documents:verification_documents(*)
      `)
      .eq("id", applicationId)
      .single(),
    supabase
      .from("verification_audit_logs")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false }),
  ]);

  if (appRes.error || !appRes.data) {
    console.error("Error fetching application detail:", appRes.error);
    return null;
  }

  const data = appRes.data;

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

  // Sort: active documents first, then newest
  docsWithSignedUrls.sort((a, b) => {
    if (a.is_active === false && b.is_active !== false) return 1;
    if (a.is_active !== false && b.is_active === false) return -1;
    return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
  });

  return {
    ...data,
    lawyer_profile: {
      full_name: data.lawyer_profiles?.profiles?.full_name || "Advocate",
      email: data.lawyer_profiles?.profiles?.email || "",
      avatar_url: data.lawyer_profiles?.profiles?.avatar_url || null,
      title: data.lawyer_profiles?.title || "Advocate",
      headline: data.lawyer_profiles?.headline || "",
      hourly_rate: data.lawyer_profiles?.hourly_rate,
      practice_areas: data.lawyer_profiles?.practice_areas || [],
      is_verified: data.lawyer_profiles?.is_verified,
      verification_status: data.lawyer_profiles?.verification_status,
      suspension_reason: data.lawyer_profiles?.suspension_reason,
      suspended_at: data.lawyer_profiles?.suspended_at,
    },
    documents: docsWithSignedUrls,
    audit_logs: auditRes.data || [],
  };
}

/**
 * Admin: Approve verification or re-verification application.
 * Lifts suspension, marks status VERIFIED, and preserves any existing consultation fee.
 */
export async function approveLawyerApplication(
  applicationId: string,
  lawyerId: string,
  adminId: string,
  assignedRate?: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = getAdminClient();

  try {
    // 0. Inspect previous state to identify re-verification
    const [appRes, profileRes] = await Promise.all([
      supabase
        .from("lawyer_verification_applications")
        .select("status")
        .eq("id", applicationId)
        .single(),
      supabase
        .from("lawyer_profiles")
        .select("verification_status, hourly_rate, suspension_reason")
        .eq("id", lawyerId)
        .single(),
    ]);

    const wasSuspended =
      appRes.data?.status === "SUSPENDED" ||
      profileRes.data?.verification_status === "SUSPENDED" ||
      Boolean(profileRes.data?.suspension_reason);

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
    // Clear suspension fields!
    // Preserve existing hourly_rate unless an explicit positive rate was assigned.
    const lawyerUpdate: {
      is_verified: boolean;
      verification_status: string;
      accepting_clients: boolean;
      suspension_reason: string | null;
      suspended_at: string | null;
      hourly_rate?: number;
    } = {
      is_verified: true,
      verification_status: "VERIFIED",
      accepting_clients: true,
      suspension_reason: null,
      suspended_at: null,
    };

    if (typeof assignedRate === "number" && assignedRate > 0) {
      lawyerUpdate.hourly_rate = assignedRate;
    }

    const { error: lawyerErr } = await supabase
      .from("lawyer_profiles")
      .update(lawyerUpdate)
      .eq("id", lawyerId);

    if (lawyerErr) throw lawyerErr;

    // 3. Mark active documents as approved
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
      action: wasSuspended ? "LAWYER_REVERIFIED" : "APPROVE_APPLICATION",
      previous_status: appRes.data?.status || "PENDING",
      new_status: "APPROVED",
      reason: wasSuspended
        ? "Re-verification approved after document review. Suspension lifted."
        : "Credentials verified, enrollment verified with Bar Council.",
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
  const supabase = getAdminClient();

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
    // Clear any stale suspension data so rejected lawyer is never labeled as suspended
    const { error: lawyerErr } = await supabase
      .from("lawyer_profiles")
      .update({
        is_verified: false,
        verification_status: "REJECTED",
        accepting_clients: false,
        suspension_reason: null,
        suspended_at: null,
      })
      .eq("id", lawyerId);

    if (lawyerErr) throw lawyerErr;

    // 3. Record in audit logs
    await supabase.from("verification_audit_logs").insert({
      application_id: applicationId,
      actor_id: adminId,
      actor_role: "admin",
      action: "REJECT_APPLICATION",
      previous_status: "UNDER_REVIEW",
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
 * Admin: Reopen a REJECTED lawyer application for resubmission.
 * Transitions REJECTED → DOCUMENTS_REQUIRED.
 * PRESERVES original rejection_reason and audit history.
 * Records admin's reopening guidance in requested_changes and logs REOPEN_APPLICATION.
 */
export async function reopenLawyerApplication(
  applicationId: string,
  lawyerId: string,
  adminId: string,
  reopenNotes: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getAdminClient();

  try {
    // 0. Verify the application exists and is currently in REJECTED status
    const { data: app, error: appFetchErr } = await supabase
      .from("lawyer_verification_applications")
      .select("id, status, rejection_reason")
      .eq("id", applicationId)
      .single();

    if (appFetchErr || !app) {
      return { success: false, error: "Verification application not found." };
    }

    if (app.status !== "REJECTED") {
      return {
        success: false,
        error: `Cannot reopen application with status '${app.status}'. Only REJECTED applications can be reopened.`,
      };
    }

    // 1. Update application status to DOCUMENTS_REQUIRED
    // NOTE: rejection_reason is STRICTLY PRESERVED (not erased/nullified).
    // Admin's reopening guidance is stored in requested_changes.
    const { error: appUpdateErr } = await supabase
      .from("lawyer_verification_applications")
      .update({
        status: "DOCUMENTS_REQUIRED",
        requested_changes: reopenNotes.trim() || "Application reopened for resubmission.",
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (appUpdateErr) throw appUpdateErr;

    // 2. Update lawyer profile to DOCUMENTS_REQUIRED, is_verified: false
    // Clear any stale suspension fields
    const { error: profileUpdateErr } = await supabase
      .from("lawyer_profiles")
      .update({
        is_verified: false,
        verification_status: "DOCUMENTS_REQUIRED",
        accepting_clients: false,
        suspension_reason: null,
        suspended_at: null,
      })
      .eq("id", lawyerId);

    if (profileUpdateErr) throw profileUpdateErr;

    // 3. Insert audit log entry
    await supabase.from("verification_audit_logs").insert({
      application_id: applicationId,
      actor_id: adminId,
      actor_role: "admin",
      action: "REOPEN_APPLICATION",
      previous_status: "REJECTED",
      new_status: "DOCUMENTS_REQUIRED",
      reason: reopenNotes.trim() || "Application reopened by administrator for resubmission.",
    });

    return { success: true };
  } catch (err: any) {
    console.error("Reopen application error:", err);
    return { success: false, error: err.message || "Failed to reopen application." };
  }
}

/**
 * Admin: Assign or update official consultation fee for an attorney.
 * Decoupled from verification: setting a rate does NOT alter verification status.
 */
export async function setLawyerConsultationFee(
  lawyerId: string,
  adminId: string,
  hourlyRate: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = getAdminClient();

  if (typeof hourlyRate !== "number" || isNaN(hourlyRate) || hourlyRate <= 0) {
    return { success: false, error: "A valid positive consultation rate is required." };
  }

  try {
    const { error: updateErr } = await supabase
      .from("lawyer_profiles")
      .update({ hourly_rate: hourlyRate })
      .eq("id", lawyerId);

    if (updateErr) throw updateErr;

    const { data: latestApp } = await supabase
      .from("lawyer_verification_applications")
      .select("id")
      .eq("lawyer_id", lawyerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestApp?.id) {
      await supabase.from("verification_audit_logs").insert({
        application_id: latestApp.id,
        actor_id: adminId,
        actor_role: "admin",
        action: "SET_CONSULTATION_RATE",
        reason: `Assigned official consultation fee of ₹${hourlyRate.toLocaleString("en-IN")}/hr.`,
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error("Set consultation fee error:", err);
    return { success: false, error: err.message || "Failed to set consultation fee" };
  }
}

/**
 * Admin: Suspend a VERIFIED lawyer — transitions VERIFIED → SUSPENDED
 * Synchronizes BOTH lawyer_profiles and lawyer_verification_applications.
 */
export async function suspendLawyer(
  lawyerId: string,
  adminId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getAdminClient();

  try {
    // 1. Verify the lawyer exists and is VERIFIED
    const { data: currentProfile, error: fetchErr } = await supabase
      .from("lawyer_profiles")
      .select("is_verified, verification_status")
      .eq("id", lawyerId)
      .single();

    if (fetchErr || !currentProfile) {
      return { success: false, error: "Lawyer profile not found." };
    }

    if (currentProfile.verification_status !== "VERIFIED") {
      return {
        success: false,
        error: `Cannot suspend: lawyer is currently ${currentProfile.verification_status}, not VERIFIED.`,
      };
    }

    // 2. Transition: VERIFIED → SUSPENDED on lawyer_profiles
    const { error: updateErr } = await supabase
      .from("lawyer_profiles")
      .update({
        is_verified: false,
        verification_status: "SUSPENDED",
        accepting_clients: false,
        suspension_reason: reason.trim(),
        suspended_at: new Date().toISOString(),
      })
      .eq("id", lawyerId);

    if (updateErr) throw updateErr;

    // 3. CRITICAL SYNCHRONIZATION: Update lawyer_verification_applications to SUSPENDED as well!
    const { data: latestApp } = await supabase
      .from("lawyer_verification_applications")
      .select("id")
      .eq("lawyer_id", lawyerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestApp?.id) {
      await supabase
        .from("lawyer_verification_applications")
        .update({
          status: "SUSPENDED",
          rejection_reason: reason.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", latestApp.id);
    }

    // 4. Write audit log
    await supabase.from("verification_audit_logs").insert({
      application_id: latestApp?.id || null,
      actor_id: adminId,
      actor_role: "admin",
      action: "LAWYER_SUSPENDED",
      previous_status: "VERIFIED",
      new_status: "SUSPENDED",
      reason: reason.trim(),
    });

    return { success: true };
  } catch (err: any) {
    console.error("Suspend lawyer error:", err);
    return { success: false, error: err.message || "Failed to suspend lawyer" };
  }
}

/**
 * Admin: Reactivate a SUSPENDED lawyer — transitions SUSPENDED → VERIFIED
 * Synchronizes BOTH lawyer_profiles and lawyer_verification_applications.
 */
export async function reactivateLawyer(
  lawyerId: string,
  adminId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getAdminClient();

  try {
    const { data: currentProfile, error: fetchErr } = await supabase
      .from("lawyer_profiles")
      .select("is_verified, verification_status")
      .eq("id", lawyerId)
      .single();

    if (fetchErr || !currentProfile) {
      return { success: false, error: "Lawyer profile not found." };
    }

    if (currentProfile.verification_status !== "SUSPENDED") {
      return {
        success: false,
        error: "Lawyer is not suspended. Only suspended lawyers can be reactivated.",
      };
    }

    // 2. Transition: SUSPENDED → VERIFIED
    const { error: updateErr } = await supabase
      .from("lawyer_profiles")
      .update({
        is_verified: true,
        verification_status: "VERIFIED",
        accepting_clients: true,
        suspension_reason: null,
        suspended_at: null,
      })
      .eq("id", lawyerId);

    if (updateErr) throw updateErr;

    // 3. Find and update the application
    const { data: latestApp } = await supabase
      .from("lawyer_verification_applications")
      .select("id")
      .eq("lawyer_id", lawyerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestApp?.id) {
      await supabase
        .from("lawyer_verification_applications")
        .update({
          status: "APPROVED",
          rejection_reason: null,
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", latestApp.id);
    }

    // 4. Write audit log
    await supabase.from("verification_audit_logs").insert({
      application_id: latestApp?.id || null,
      actor_id: adminId,
      actor_role: "admin",
      action: "LAWYER_REACTIVATED",
      previous_status: currentProfile.verification_status,
      new_status: "VERIFIED",
      reason: reason.trim(),
    });

    return { success: true };
  } catch (err: any) {
    console.error("Reactivate lawyer error:", err);
    return { success: false, error: err.message || "Failed to reactivate lawyer" };
  }
}

/**
 * Fetch high-level admin metrics
 */
export async function getAdminPlatformMetrics(): Promise<{
  pendingApplications: number;
  verifiedLawyers: number;
  suspendedLawyers: number;
  rejectedApplications: number;
  totalMatters: number;
}> {
  const supabase = getAdminClient();

  const [
    { count: pendingCount },
    { count: verifiedCount },
    { count: suspendedCount },
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
      .from("lawyer_profiles")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "SUSPENDED"),
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
    suspendedLawyers: suspendedCount || 0,
    rejectedApplications: rejectedCount || 0,
    totalMatters: mattersCount || 0,
  };
}
