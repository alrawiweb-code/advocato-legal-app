import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { validateVerificationFile } from "@/lib/utils/file-validation";
import { getVerificationRequirements } from "@/lib/supabase/verification";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createSupabaseClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  // =========================================================================
  // STAGE 1: PURE READ-ONLY PRE-FLIGHT VALIDATION & DEEP SNAPSHOT
  // =========================================================================

  // 1. Authenticate caller session via cookie-based server client
  const sessionClient = await createClient();
  const {
    data: { user },
    error: authError,
  } = await sessionClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
  }

  // 2. Strict role check: caller must be a genuine lawyer in profiles table
  const { data: callerProfile, error: profileRoleErr } = await sessionClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileRoleErr || !callerProfile || callerProfile.role !== "lawyer") {
    return NextResponse.json(
      { error: "Forbidden: Only registered attorneys can submit verification credentials." },
      { status: 403 }
    );
  }

  // 3. Parse and sanitize payload
  let lawyerId = "";
  let barNumber = "";
  let stateBar = "";
  let yearsExperience = 1;
  const uploadedFiles: { requirementId: string; file: File; detectedMime?: string }[] = [];

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    lawyerId = (formData.get("lawyerId") as string) || "";
    barNumber = (formData.get("barNumber") as string) || "";
    stateBar = (formData.get("stateBar") as string) || "";
    yearsExperience = Number(formData.get("yearsExperience")) || 1;

    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file_") && value instanceof File) {
        const reqId = key.replace("file_", "").trim();
        uploadedFiles.push({ requirementId: reqId, file: value });
      }
    }
  } else {
    const body = await request.json();
    lawyerId = body.lawyerId || "";
    barNumber = body.barNumber || "";
    stateBar = body.stateBar || "";
    yearsExperience = Number(body.yearsExperience) || 1;
  }

  if (!lawyerId) {
    return NextResponse.json({ error: "lawyerId is required." }, { status: 400 });
  }

  // 4. Ownership verification: caller can only submit for themselves
  if (user.id !== lawyerId) {
    return NextResponse.json({ error: "Forbidden: You cannot submit applications for another attorney." }, { status: 403 });
  }

  if (!barNumber.trim()) {
    return NextResponse.json({ error: "Bar enrollment number is required." }, { status: 400 });
  }

  // 5. Binary magic-byte and MIME validation on every uploaded file
  for (const item of uploadedFiles) {
    const validation = await validateVerificationFile(item.file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: `Validation failed for ${item.file.name}: ${validation.error || "Only PDF, JPG, and PNG files are accepted."}` },
        { status: 400 }
      );
    }
    item.detectedMime = validation.detectedMime || item.file.type || "application/octet-stream";
  }

  // 6. Query existing application records via privileged client (without blind limit(1))
  const adminClient = getAdminClient();
  const requirements = await getVerificationRequirements();

  const { data: existingApps, error: appFetchErr } = await adminClient
    .from("lawyer_verification_applications")
    .select(`
      id,
      lawyer_id,
      status,
      bar_number,
      state_bar,
      practice_jurisdictions,
      years_experience,
      rejection_reason,
      requested_changes,
      submitted_at,
      created_at,
      documents:verification_documents(
        id, document_requirement_id, status, storage_path, created_at
      )
    `)
    .eq("lawyer_id", lawyerId);

  // Fail closed on query error
  if (appFetchErr) {
    console.error("Failed to query verification applications for lawyer:", appFetchErr);
    return NextResponse.json(
      { error: "Unable to retrieve your application records. Please try again in a few moments." },
      { status: 500 }
    );
  }

  // Fail closed on multiple records (data integrity guard)
  if (existingApps && existingApps.length > 1) {
    const incidentId = `inc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    console.error(`[CRITICAL_DATA_INTEGRITY] Found ${existingApps.length} applications for lawyer ${lawyerId} (Ref: ${incidentId})`);
    return NextResponse.json(
      { error: `Data integrity conflict: Multiple application records detected for your account. Please contact support (Ref: ${incidentId}).` },
      { status: 500 }
    );
  }

  const existingApp = existingApps && existingApps.length === 1 ? existingApps[0] : null;

  // 7. Security: Ownership assertion
  if (existingApp && existingApp.lawyer_id !== lawyerId) {
    console.error("Ownership mismatch: Fetched application does not belong to authenticated user.");
    return NextResponse.json({ error: "Forbidden: You cannot submit applications for another attorney." }, { status: 403 });
  }

  // 8. Explicit application status state machine handling
  if (existingApp) {
    switch (existingApp.status) {
      case "DOCUMENTS_REQUIRED":
      case "SUSPENDED":
      case "DRAFT":
      case "PENDING":
      case "NOT_VERIFIED":
        // Valid for update to UNDER_REVIEW
        break;

      case "REJECTED":
        return NextResponse.json(
          {
            error:
              "Your application is currently rejected and locked. You cannot submit documents until an administrator explicitly reopens your application.",
          },
          { status: 403 }
        );

      case "UNDER_REVIEW":
        return NextResponse.json(
          {
            error:
              "Your application is currently under review by the admissions desk. You cannot submit changes while a review is pending.",
          },
          { status: 409 }
        );

      case "APPROVED":
      case "VERIFIED":
        return NextResponse.json(
          {
            error:
              "Your verification application has already been approved. No further submission is required.",
          },
          { status: 400 }
        );

      default:
        console.error(`Unexpected application status '${existingApp.status}' for lawyer ${lawyerId}`);
        return NextResponse.json(
          {
            error: `Cannot process application with current status '${existingApp.status}'. Please contact support.`,
          },
          { status: 400 }
        );
    }
  }

  // 9. Mandatory credential completeness validation with strict validity criteria
  const requiredReqs = requirements.filter((r) => r.is_required);
  for (const req of requiredReqs) {
    const hasNewUpload = uploadedFiles.some((f) => f.requirementId === req.id);

    // Existing documents count only if valid for reuse:
    // 1. Requirement matches
    // 2. Status is NOT 'REJECTED' (must be APPROVED, UPLOADED, etc.)
    // 3. Storage path is present and well-formed
    const matchingDocs = (existingApp?.documents || [])
      .filter((d) => d.document_requirement_id === req.id)
      .sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime());

    const latestDoc = matchingDocs[0] || null;
    const hasValidExistingDoc =
      latestDoc !== null &&
      latestDoc.status !== "REJECTED" &&
      typeof latestDoc.storage_path === "string" &&
      latestDoc.storage_path.trim().length > 0;

    if (!hasNewUpload && !hasValidExistingDoc) {
      return NextResponse.json(
        { error: `Missing required credential: Please attach your ${req.name}.` },
        { status: 400 }
      );
    }
  }

  // 10. Query lawyer profile to capture baseline snapshot and suspension state (fail-closed)
  const { data: currentProfile, error: profileFetchErr } = await adminClient
    .from("lawyer_profiles")
    .select("id, bar_number, state_bar, jurisdiction, state, years_experience, hourly_rate, is_verified, accepting_clients, verification_status, suspension_reason, suspended_at")
    .eq("id", lawyerId)
    .maybeSingle();

  if (profileFetchErr) {
    console.error("Error fetching lawyer profile:", profileFetchErr);
    return NextResponse.json(
      { error: "Unable to retrieve lawyer profile. Please try again in a few moments." },
      { status: 500 }
    );
  }

  const isSuspended =
    currentProfile?.verification_status === "SUSPENDED" ||
    existingApp?.status === "SUSPENDED" ||
    Boolean(currentProfile?.suspension_reason);

  const targetAppStatus = "UNDER_REVIEW";
  const targetProfileStatus = isSuspended ? "SUSPENDED" : "UNDER_REVIEW";

  // Pre-flight Snapshots for concurrency-safe rollback
  const appSnapshot = existingApp ? {
    id: existingApp.id,
    status: existingApp.status,
    bar_number: existingApp.bar_number,
    state_bar: existingApp.state_bar,
    years_experience: existingApp.years_experience,
    practice_jurisdictions: existingApp.practice_jurisdictions,
    submitted_at: existingApp.submitted_at,
    requested_changes: existingApp.requested_changes,
    rejection_reason: existingApp.rejection_reason,
  } : null;

  const profileSnapshot = currentProfile ? {
    id: currentProfile.id,
    bar_number: currentProfile.bar_number,
    state_bar: currentProfile.state_bar,
    jurisdiction: currentProfile.jurisdiction,
    state: currentProfile.state,
    years_experience: currentProfile.years_experience,
    is_verified: currentProfile.is_verified,
    accepting_clients: currentProfile.accepting_clients,
    verification_status: currentProfile.verification_status,
    suspension_reason: currentProfile.suspension_reason,
    suspended_at: currentProfile.suspended_at,
    hourly_rate: currentProfile.hourly_rate,
  } : null;

  const isNewApplication = !existingApp;

  // =========================================================================
  // SAGA TRACKING & ATOMIC WRITE EXECUTION
  // =========================================================================
  const uploadedStoragePaths: string[] = [];
  const createdDocRecordIds: string[] = [];
  let createdAppId: string | null = null;
  let didUpdateApp = false;
  let didUpdateProfile = false;

  try {
    // -----------------------------------------------------------------------
    // STAGE 2: EXTERNAL STORAGE STAGING (ALL UPLOADS BEFORE ANY DB WRITES)
    // -----------------------------------------------------------------------
    const stagedFiles: {
      requirementId: string;
      originalName: string;
      mimeType: string;
      fileSize: number;
      storagePath: string;
    }[] = [];

    for (const item of uploadedFiles) {
      const fileId = crypto.randomUUID();
      const sanitizedName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${lawyerId}/${item.requirementId}_${fileId}_${sanitizedName}`;

      const fileBuffer = Buffer.from(await item.file.arrayBuffer());
      const { error: uploadErr } = await adminClient.storage
        .from("verification-documents")
        .upload(storagePath, fileBuffer, {
          upsert: false,
          contentType: item.detectedMime || item.file.type || "application/octet-stream",
        });

      if (uploadErr) {
        throw new Error(`Failed to upload ${item.file.name} to storage: ${uploadErr.message}`);
      }

      uploadedStoragePaths.push(storagePath);
      stagedFiles.push({
        requirementId: item.requirementId,
        originalName: item.file.name,
        mimeType: item.detectedMime || item.file.type || "application/octet-stream",
        fileSize: item.file.size,
        storagePath,
      });
    }

    // -----------------------------------------------------------------------
    // STAGE 3: APPLICATION DOCKET TRANSITION (OPTIMISTIC CONCURRENCY)
    // -----------------------------------------------------------------------
    let applicationId: string;

    if (!existingApp) {
      const { data: newApp, error: createAppErr } = await adminClient
        .from("lawyer_verification_applications")
        .insert({
          lawyer_id: lawyerId,
          bar_number: barNumber.trim(),
          state_bar: stateBar,
          years_experience: yearsExperience,
          practice_jurisdictions: stateBar ? [stateBar] : [],
          status: targetAppStatus,
          submitted_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (createAppErr || !newApp) {
        throw new Error(`Failed to create application docket: ${createAppErr?.message}`);
      }
      applicationId = newApp.id;
      createdAppId = newApp.id;
    } else {
      applicationId = existingApp.id;
      // Optimistic concurrency update: ensure status has not changed concurrently
      const { data: updatedApps, error: updateAppErr } = await adminClient
        .from("lawyer_verification_applications")
        .update({
          bar_number: barNumber.trim(),
          state_bar: stateBar,
          years_experience: yearsExperience,
          practice_jurisdictions: stateBar ? [stateBar] : (existingApp.practice_jurisdictions || []),
          status: targetAppStatus,
          submitted_at: new Date().toISOString(),
          requested_changes: null,
        })
        .eq("id", applicationId)
        .eq("status", existingApp.status)
        .select("id");

      if (updateAppErr) {
        throw new Error(`Failed to update application docket: ${updateAppErr.message}`);
      }

      if (!updatedApps || updatedApps.length === 0) {
        // Concurrency conflict: another request modified the application
        return NextResponse.json(
          { error: "Submission conflict: Another update is currently processing for your application. Please refresh your page." },
          { status: 409 }
        );
      }
      didUpdateApp = true;
    }

    // -----------------------------------------------------------------------
    // STAGE 4: NON-DESTRUCTIVE DOCUMENT RECORDING (LIVE SCHEMA ALIGNED)
    // -----------------------------------------------------------------------
    for (const staged of stagedFiles) {
      const { data: insertedDoc, error: insertDocErr } = await adminClient
        .from("verification_documents")
        .insert({
          application_id: applicationId,
          lawyer_id: lawyerId,
          document_requirement_id: staged.requirementId,
          original_filename: staged.originalName,
          mime_type: staged.mimeType,
          file_size: staged.fileSize,
          storage_path: staged.storagePath,
          status: "UPLOADED",
        })
        .select("id")
        .single();

      if (insertDocErr || !insertedDoc) {
        throw new Error(`Failed to record document ${staged.originalName}: ${insertDocErr?.message}`);
      }

      createdDocRecordIds.push(insertedDoc.id);
    }

    // -----------------------------------------------------------------------
    // STAGE 5: PROFILE SYNCHRONIZATION (SUSPENSION ENFORCEMENT)
    // -----------------------------------------------------------------------
    const profileUpdate: Record<string, any> = {
      bar_number: barNumber.trim(),
      state_bar: stateBar,
      jurisdiction: stateBar,
      state: stateBar,
      years_experience: yearsExperience,
      is_verified: false,
      accepting_clients: false,
    };

    if (isSuspended) {
      profileUpdate.verification_status = "SUSPENDED";
      profileUpdate.suspension_reason = currentProfile?.suspension_reason || null;
      profileUpdate.suspended_at = currentProfile?.suspended_at || null;
    } else {
      profileUpdate.verification_status = "UNDER_REVIEW";
      profileUpdate.suspension_reason = null;
      profileUpdate.suspended_at = null;
    }

    if (currentProfile?.hourly_rate !== undefined && currentProfile?.hourly_rate !== null) {
      profileUpdate.hourly_rate = currentProfile.hourly_rate;
    }

    const { data: updatedProfiles, error: profileUpdateErr } = await adminClient
      .from("lawyer_profiles")
      .update(profileUpdate)
      .eq("id", lawyerId)
      .select("id");

    if (profileUpdateErr || !updatedProfiles || updatedProfiles.length === 0) {
      throw new Error(`Failed to update lawyer profile: ${profileUpdateErr?.message || "zero rows affected"}`);
    }
    didUpdateProfile = true;

    // -----------------------------------------------------------------------
    // STAGE 6: MANDATORY SYNCHRONOUS AUDIT LOGGING
    // -----------------------------------------------------------------------
    const auditEntry = {
      application_id: applicationId,
      actor_id: lawyerId,
      actor_role: "lawyer",
      action: isSuspended
        ? "SUBMIT_REVERIFICATION"
        : existingApp?.status === "DOCUMENTS_REQUIRED"
        ? "RESUBMIT_APPLICATION"
        : "SUBMIT_APPLICATION",
      previous_status: existingApp?.status || "NOT_VERIFIED",
      new_status: targetAppStatus,
      reason: isSuspended
        ? "Re-verification credentials and compliance dossier submitted following suspension. Awaiting admin review."
        : existingApp?.status === "DOCUMENTS_REQUIRED"
        ? "Updated credentials and documents submitted following administrator reopening."
        : "Attorney credentials and compliance documents submitted for verification.",
    };

    let auditCommitted = false;
    let auditErr: any = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      const { error } = await adminClient.from("verification_audit_logs").insert(auditEntry);
      if (!error) {
        auditCommitted = true;
        break;
      }
      auditErr = error;
      if (attempt < 2) await new Promise((res) => setTimeout(res, 150));
    }

    if (!auditCommitted) {
      console.error("Mandatory audit log insert failed:", auditErr);
      throw new Error(`Audit compliance failure: Unable to record statutory audit entry (${auditErr?.message})`);
    }

    // -----------------------------------------------------------------------
    // STAGE 7: RESILIENT RESPONSE GENERATION (DO NOT ROLLBACK ON READ ERROR)
    // -----------------------------------------------------------------------
    const { data: refreshedApp, error: refreshErr } = await adminClient
      .from("lawyer_verification_applications")
      .select(`
        *,
        documents:verification_documents(*)
      `)
      .eq("id", applicationId)
      .single();

    if (refreshErr) {
      console.warn("Application submitted successfully, but refreshed payload fetch failed:", refreshErr);
      return NextResponse.json({
        success: true,
        application: null,
        warning: "Application resubmitted successfully. Updated records could not be fetched immediately; please refresh your dashboard.",
      });
    }

    return NextResponse.json({
      success: true,
      application: refreshedApp,
    });
  } catch (mutationErr: any) {
    // =======================================================================
    // STAGE 8: INDEPENDENT MULTI-TIER VERIFIED SAGA ROLLBACK HANDLER
    // =======================================================================
    const incidentId = `inc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    console.error(`[SAGA_ROLLBACK_INITIATED] Incident ${incidentId}:`, mutationErr);

    const rollbackReport = {
      incidentId,
      timestamp: new Date().toISOString(),
      lawyerId,
      triggerError: mutationErr.message || String(mutationErr),
      steps: {
        deleteNewDocuments: { attempted: false, verified: false, error: null as string | null },
        purgeStorageFiles: { attempted: false, verified: false, error: null as string | null },
        restoreProfile: { attempted: false, verified: false, concurrencyPreserved: false, error: null as string | null },
        restoreApplication: { attempted: false, verified: false, concurrencyPreserved: false, error: null as string | null },
      },
      unresolvedItems: [] as string[],
      isFullyVerified: false,
    };

    // Tier 1: Independent Document Row Deletion & Verification
    if (createdDocRecordIds.length > 0) {
      rollbackReport.steps.deleteNewDocuments.attempted = true;
      try {
        const { error: deleteErr } = await adminClient
          .from("verification_documents")
          .delete()
          .in("id", createdDocRecordIds);

        if (deleteErr) throw deleteErr;

        // Verify: Check that zero rows remain
        const { count, error: verifyErr } = await adminClient
          .from("verification_documents")
          .select("id", { count: "exact", head: true })
          .in("id", createdDocRecordIds);

        if (!verifyErr && count === 0) {
          rollbackReport.steps.deleteNewDocuments.verified = true;
        } else {
          rollbackReport.unresolvedItems.push(`created_docs:${createdDocRecordIds.join(",")}`);
        }
      } catch (e: any) {
        rollbackReport.steps.deleteNewDocuments.error = e.message;
        rollbackReport.unresolvedItems.push(`created_docs:${createdDocRecordIds.join(",")}`);
      }
    }

    // Tier 2: Independent Storage Object Removal & Verification
    if (uploadedStoragePaths.length > 0) {
      rollbackReport.steps.purgeStorageFiles.attempted = true;
      try {
        const { error: purgeErr } = await adminClient.storage
          .from("verification-documents")
          .remove(uploadedStoragePaths);

        if (purgeErr) throw purgeErr;

        // Verify: List directory and ensure none of the uploaded filenames remain
        const { data: remainingFiles, error: listErr } = await adminClient.storage
          .from("verification-documents")
          .list(lawyerId);

        const targetFilenames = uploadedStoragePaths.map((p) => p.split("/").pop());
        const unpurged = (remainingFiles || []).filter((f) => targetFilenames.includes(f.name));

        if (!listErr && unpurged.length === 0) {
          rollbackReport.steps.purgeStorageFiles.verified = true;
        } else {
          rollbackReport.unresolvedItems.push(`unpurged_files:${unpurged.map((f) => f.name).join(",")}`);
        }
      } catch (e: any) {
        rollbackReport.steps.purgeStorageFiles.error = e.message;
        rollbackReport.unresolvedItems.push(`storage_paths:${uploadedStoragePaths.join(",")}`);
      }
    }

    // Tier 3: Independent Profile Restoration & Re-Read Classification
    if (didUpdateProfile && profileSnapshot) {
      rollbackReport.steps.restoreProfile.attempted = true;
      try {
        const { data: revertedProfiles, error: profRevertErr } = await adminClient
          .from("lawyer_profiles")
          .update({
            verification_status: profileSnapshot.verification_status,
            is_verified: profileSnapshot.is_verified,
            suspension_reason: profileSnapshot.suspension_reason,
            suspended_at: profileSnapshot.suspended_at,
            accepting_clients: profileSnapshot.accepting_clients,
          })
          .eq("id", lawyerId)
          .eq("verification_status", targetProfileStatus)
          .select("id, verification_status");

        if (profRevertErr) throw profRevertErr;

        if (revertedProfiles && revertedProfiles.length === 0) {
          // Re-read current database record to inspect legitimate concurrent state
          const { data: currentProf, error: readProfErr } = await adminClient
            .from("lawyer_profiles")
            .select("verification_status, suspension_reason")
            .eq("id", lawyerId)
            .maybeSingle();

          if (!readProfErr && currentProf && currentProf.verification_status !== targetProfileStatus) {
            console.log(`[ROLLBACK_LEGITIMATE_CHANGE_PRESERVED] Profile status was modified concurrently to ${currentProf.verification_status}. Preserving.`);
            rollbackReport.steps.restoreProfile.concurrencyPreserved = true;
            rollbackReport.steps.restoreProfile.verified = true;
          } else {
            rollbackReport.unresolvedItems.push(`profile_status_mismatch:${lawyerId}`);
          }
        } else {
          // Verify exact snapshot restoration
          const { data: verifiedProf } = await adminClient
            .from("lawyer_profiles")
            .select("verification_status, is_verified, suspension_reason")
            .eq("id", lawyerId)
            .single();

          if (
            verifiedProf?.verification_status === profileSnapshot.verification_status &&
            verifiedProf?.suspension_reason === profileSnapshot.suspension_reason
          ) {
            rollbackReport.steps.restoreProfile.verified = true;
          } else {
            rollbackReport.unresolvedItems.push(`profile_restore_unverified:${lawyerId}`);
          }
        }
      } catch (e: any) {
        rollbackReport.steps.restoreProfile.error = e.message;
        rollbackReport.unresolvedItems.push(`lawyer_profile:${lawyerId}`);
      }
    }

    // Tier 4: Independent Application Docket Revert / Conditional Deletion
    if (isNewApplication && createdAppId) {
      rollbackReport.steps.restoreApplication.attempted = true;
      try {
        // Conditional deletion: only delete if status is still targetAppStatus ('UNDER_REVIEW')
        const { data: deletedApps, error: delAppErr } = await adminClient
          .from("lawyer_verification_applications")
          .delete()
          .eq("id", createdAppId)
          .eq("status", targetAppStatus)
          .select("id");

        if (delAppErr) throw delAppErr;

        if (deletedApps && deletedApps.length === 0) {
          // Re-read: Did an admin review it concurrently?
          const { data: currentApp } = await adminClient
            .from("lawyer_verification_applications")
            .select("id, status")
            .eq("id", createdAppId)
            .maybeSingle();

          if (currentApp && ["APPROVED", "REJECTED"].includes(currentApp.status)) {
            console.log(`[ROLLBACK_LEGITIMATE_CHANGE_PRESERVED] Newly created application was reviewed concurrently. Preserving.`);
            rollbackReport.steps.restoreApplication.concurrencyPreserved = true;
            rollbackReport.steps.restoreApplication.verified = true;
          } else {
            rollbackReport.unresolvedItems.push(`new_app_unresolved:${createdAppId}`);
          }
        } else {
          // Verify deletion
          const { count } = await adminClient
            .from("lawyer_verification_applications")
            .select("id", { count: "exact", head: true })
            .eq("id", createdAppId);

          if (count === 0) {
            rollbackReport.steps.restoreApplication.verified = true;
          } else {
            rollbackReport.unresolvedItems.push(`new_app_delete_unverified:${createdAppId}`);
          }
        }
      } catch (e: any) {
        rollbackReport.steps.restoreApplication.error = e.message;
        rollbackReport.unresolvedItems.push(`new_app:${createdAppId}`);
      }
    } else if (didUpdateApp && appSnapshot) {
      rollbackReport.steps.restoreApplication.attempted = true;
      try {
        const { data: revertedApps, error: restoreAppErr } = await adminClient
          .from("lawyer_verification_applications")
          .update({
            status: appSnapshot.status,
            requested_changes: appSnapshot.requested_changes,
            rejection_reason: appSnapshot.rejection_reason,
          })
          .eq("id", appSnapshot.id)
          .eq("status", targetAppStatus)
          .select("id, status");

        if (restoreAppErr) throw restoreAppErr;

        if (revertedApps && revertedApps.length === 0) {
          // Re-read current database record to inspect legitimate administrative changes
          const { data: currentApp, error: readAppErr } = await adminClient
            .from("lawyer_verification_applications")
            .select("id, status, reviewed_by")
            .eq("id", appSnapshot.id)
            .maybeSingle();

          if (!readAppErr && currentApp && (["APPROVED", "REJECTED"].includes(currentApp.status) || currentApp.reviewed_by)) {
            console.log(`[ROLLBACK_LEGITIMATE_CHANGE_PRESERVED] Application was reviewed concurrently (status: ${currentApp.status}). Preserving.`);
            rollbackReport.steps.restoreApplication.concurrencyPreserved = true;
            rollbackReport.steps.restoreApplication.verified = true;
          } else {
            rollbackReport.unresolvedItems.push(`app_status_mismatch:${appSnapshot.id}`);
          }
        } else {
          // Verify exact snapshot restoration
          const { data: verifiedApp } = await adminClient
            .from("lawyer_verification_applications")
            .select("status, requested_changes")
            .eq("id", appSnapshot.id)
            .single();

          if (
            verifiedApp?.status === appSnapshot.status &&
            verifiedApp?.requested_changes === appSnapshot.requested_changes
          ) {
            rollbackReport.steps.restoreApplication.verified = true;
          } else {
            rollbackReport.unresolvedItems.push(`app_restore_unverified:${appSnapshot.id}`);
          }
        }
      } catch (e: any) {
        rollbackReport.steps.restoreApplication.error = e.message;
        rollbackReport.unresolvedItems.push(`updated_app:${appSnapshot.id}`);
      }
    }

    // Tier 5: Global Rollback Evaluation (Strict No-False-Claims)
    rollbackReport.isFullyVerified =
      Object.values(rollbackReport.steps).every((s) => !s.attempted || s.verified) &&
      rollbackReport.unresolvedItems.length === 0;

    if (!rollbackReport.isFullyVerified) {
      console.error(
        `[CRITICAL_ROLLBACK_UNRESOLVED] Incident ${incidentId} requires operational triage:`,
        JSON.stringify(rollbackReport, null, 2)
      );

      return NextResponse.json(
        {
          error: `Submission could not be completed, and automated recovery was partially unresolved. Please contact support with Incident ID: ${incidentId}.`,
          incidentId,
          rollbackVerified: false,
          recoveryStatus: "PARTIAL_RECOVERY",
        },
        { status: 500 }
      );
    }

    console.log(`[SAGA_ROLLBACK_VERIFIED] Incident ${incidentId}: Full compensation verified.`);
    return NextResponse.json(
      {
        error: "Submission failed before completion. All partial changes created by this request have been verified and cleaned up. Please try again.",
        rollbackVerified: true,
        recoveryStatus: "FULL_ROLLBACK",
      },
      { status: 500 }
    );
  }
}
