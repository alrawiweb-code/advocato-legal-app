"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  ShieldCheck,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Scale,
  Clock,
  ShieldAlert,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Lock,
} from "lucide-react";
import { useUserRole } from "@/lib/context/RoleContext";
import { INDIAN_STATES } from "@/lib/data/lawyers";
import {
  getVerificationRequirements,
  getLawyerApplication,
  VerificationRequirement,
  LawyerApplicationRecord,
  VerificationDocumentRecord,
} from "@/lib/supabase/verification";
import { compressVerificationFile } from "@/lib/utils/document-compression";
import { validateVerificationFile } from "@/lib/utils/file-validation";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function VerificationModal({ isOpen, onClose, onSuccess }: VerificationModalProps) {
  const { currentUser, activeLawyer, refreshUser } = useUserRole();

  const [requirements, setRequirements] = useState<VerificationRequirement[]>([]);
  const [existingApp, setExistingApp] = useState<LawyerApplicationRecord | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  const [barNumber, setBarNumber] = useState(
    currentUser.barNumber || activeLawyer?.jurisdiction
      ? `${activeLawyer?.jurisdiction?.slice(0, 2).toUpperCase()}/1234/${new Date().getFullYear()}`
      : ""
  );
  const [stateBar, setStateBar] = useState(
    activeLawyer?.state || currentUser.jurisdiction || "Delhi (DL)"
  );
  const [yearsExperience, setYearsExperience] = useState(activeLawyer?.yearsExperience || 5);

  const [selectedFiles, setSelectedFiles] = useState<{ [requirementId: string]: File }>({});
  const [compressionNotes, setCompressionNotes] = useState<{ [requirementId: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const errorBannerRef = useRef<HTMLDivElement>(null);

  const isSuspended =
    activeLawyer?.verificationStatus === "SUSPENDED" ||
    currentUser.verificationStatus === "SUSPENDED" ||
    existingApp?.status === "SUSPENDED";

  const isRejected =
    (existingApp?.status === "REJECTED" ||
      currentUser.verificationStatus === "REJECTED" ||
      activeLawyer?.verificationStatus === "REJECTED") &&
    existingApp?.status !== "DOCUMENTS_REQUIRED" &&
    existingApp?.status !== "UNDER_REVIEW";

  const isReopened =
    existingApp?.status === "DOCUMENTS_REQUIRED" ||
    currentUser.verificationStatus === "DOCUMENTS_REQUIRED" ||
    activeLawyer?.verificationStatus === "DOCUMENTS_REQUIRED";

  const suspensionReason =
    (activeLawyer as any)?.suspensionReason ||
    (currentUser as any)?.suspensionReason ||
    "Action required by Advocato Admissions Desk";

  const rejectionReason =
    existingApp?.rejection_reason ||
    "Bar verification dossier did not meet statutory admission criteria.";

  const reopeningGuidance =
    existingApp?.requested_changes ||
    "Please update your credentials according to the admissions feedback and resubmit.";

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadData() {
      setIsLoadingInitial(true);
      setErrorMsg(null);
      try {
        const [reqs, app] = await Promise.all([
          getVerificationRequirements(),
          currentUser.id ? getLawyerApplication(currentUser.id) : Promise.resolve(null),
        ]);

        if (isMounted) {
          setRequirements(reqs);
          setExistingApp(app);
          if (app?.bar_number) setBarNumber(app.bar_number);
          if (app?.state_bar) setStateBar(app.state_bar);
          if (app?.years_experience) setYearsExperience(app.years_experience);
        }
      } catch (err) {
        console.error("Error loading verification requirements:", err);
      } finally {
        if (isMounted) setIsLoadingInitial(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser.id, activeLawyer]);

  if (!isOpen) return null;

  const handleFileSelect = async (requirementId: string, rawFile: File | null) => {
    if (!rawFile) {
      setSelectedFiles((prev) => {
        const copy = { ...prev };
        delete copy[requirementId];
        return copy;
      });
      setCompressionNotes((prev) => {
        const copy = { ...prev };
        delete copy[requirementId];
        return copy;
      });
      return;
    }

    setErrorMsg(null);

    // 1. Initial size check before compression
    if (rawFile.size > 25 * 1024 * 1024) {
      setErrorMsg("File exceeds maximum allowed size of 25MB.");
      errorBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    // 2. Client-side compression for images (preserves PDFs untouched)
    const compression = await compressVerificationFile(rawFile);
    const fileToValidate = compression.file;

    // 3. Binary validation
    const validation = await validateVerificationFile(fileToValidate);
    if (!validation.valid) {
      setErrorMsg(validation.error || "Invalid file format. Please upload PDF, JPG, or PNG.");
      errorBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    setSelectedFiles((prev) => ({
      ...prev,
      [requirementId]: fileToValidate,
    }));

    if (compression.wasCompressed) {
      setCompressionNotes((prev) => ({
        ...prev,
        [requirementId]: `Optimized (${compression.reductionPercentage}% size reduction, ${(compression.compressedSize / 1024).toFixed(0)} KB)`,
      }));
    } else if (fileToValidate.type === "application/pdf") {
      setCompressionNotes((prev) => ({
        ...prev,
        [requirementId]: `Original PDF preserved (${(fileToValidate.size / 1024).toFixed(0)} KB)`,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);

    if (!barNumber.trim()) {
      setErrorMsg("Bar enrollment number is required.");
      errorBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    // Ensure all required requirements have either a newly selected file or an existing active document
    const requiredReqs = requirements.filter((r) => r.is_required);
    for (const req of requiredReqs) {
      const hasNewFile = Boolean(selectedFiles[req.id]);
      const hasExistingDoc = existingApp?.documents?.some(
        (d) => d.document_requirement_id === req.id && (d as any).is_active !== false
      );

      if (!hasNewFile && !hasExistingDoc) {
        setErrorMsg(`Please attach your ${req.name}.`);
        errorBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
      }
    }

    setIsSubmitting(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s network timeout

    try {
      const formData = new FormData();
      formData.append("lawyerId", currentUser.id);
      formData.append("barNumber", barNumber.trim());
      formData.append("stateBar", stateBar);
      formData.append("yearsExperience", String(yearsExperience));

      Object.entries(selectedFiles).forEach(([requirementId, file]) => {
        formData.append(`file_${requirementId}`, file);
      });

      // Submit application via authenticated server API route
      const response = await fetch("/api/lawyer/verification/submit", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        const errorText =
          result?.error ||
          (response.status === 401
            ? "Session expired. Please log in again."
            : response.status === 403
            ? "Unauthorized to submit this verification application."
            : "Submission failed. Please try again.");
        setErrorMsg(errorText);
        errorBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
      }

      setSubmittedSuccess(true);
      setSelectedFiles({});
      setCompressionNotes({});
      await refreshUser();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      if (err.name === "AbortError") {
        setErrorMsg("Submission timed out. Please check your network connection and try again.");
      } else {
        setErrorMsg(err.message || "An unexpected error occurred during submission.");
      }
      errorBannerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } finally {
      clearTimeout(timeoutId);
      setIsSubmitting(false);
    }
  };

  // Is application actively under review and NOT in suspended re-submission mode?
  const isPendingReview =
    !isSuspended &&
    (existingApp?.status === "PENDING" ||
      existingApp?.status === "SUBMITTED" ||
      existingApp?.status === "UNDER_REVIEW");

  // If suspended lawyer already submitted re-verification dossier and hasn't changed files:
  const isSuspendedUnderReview =
    isSuspended &&
    existingApp?.status === "UNDER_REVIEW" &&
    Object.keys(selectedFiles).length === 0 &&
    !submittedSuccess;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-hairline rounded-2xl shadow-editorial w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-hairline flex items-center justify-between bg-surface-container-low/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brass/10 border border-brass/30 flex items-center justify-center text-brass">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-headline text-lg sm:text-xl font-bold text-primary">
                {isSuspended
                  ? "Re-Verification & Document Replacement"
                  : isRejected
                  ? "Application Verification Notice"
                  : isReopened
                  ? "Application Reopened for Revision"
                  : "Advocato Bar Admissions & Verification"}
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {isSuspended
                  ? "Replace required credentials for admissions review and reinstatement"
                  : isRejected
                  ? "Admissions review has concluded. This application is locked."
                  : isReopened
                  ? "Upload updated credentials according to admissions guidance to resubmit"
                  : "Credential verification required to unlock client case dockets & intake matters"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg border border-hairline flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-sm">
          {isLoadingInitial ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-brass animate-spin mb-3" />
              <p className="text-xs text-on-surface-variant">Loading verification dossier...</p>
            </div>
          ) : submittedSuccess || isPendingReview || isSuspendedUnderReview ? (
            <div className="py-8 text-center space-y-4 max-w-md mx-auto animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center text-amber-600">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {isSuspended ? "Re-Verification Dossier Under Review" : "Application Under Review"}
                </span>
                <h3 className="font-headline text-2xl font-bold text-primary">
                  {isSuspended ? "Documents Submitted for Reinstatement" : "Dossier Submitted to Admissions Desk"}
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
                  {isSuspended
                    ? "Thank you, Counsel. Your corrected credentials have been routed to the Admissions Panel. Your account remains safely suspended until an authorized admin completes verification."
                    : "Thank you, Counsel. Your Bar Council credentials and enrollment verification documents have been received by our regulatory compliance desk."}
                </p>
              </div>

              <div className="bg-surface-container-low p-4 rounded-xl border border-hairline text-left text-xs space-y-2">
                <div className="flex justify-between pb-1.5 border-b border-hairline">
                  <span className="text-on-surface-variant">State Bar Council:</span>
                  <span className="font-semibold text-primary">{existingApp?.state_bar || stateBar}</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-hairline">
                  <span className="text-on-surface-variant">Bar Enrollment No:</span>
                  <span className="font-semibold text-primary">{existingApp?.bar_number || barNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Estimated Review Time:</span>
                  <span className="font-semibold text-brass">12 – 24 Business Hours</span>
                </div>
              </div>

              {isSuspendedUnderReview && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setSubmittedSuccess(false)}
                    className="text-xs text-brass hover:underline inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Upload Additional Document Corrections
                  </button>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full bg-primary text-white text-xs font-semibold py-3 px-6 rounded-lg hover:bg-primary-container transition-all"
              >
                Close &amp; Return to Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rejection Notice Banner */}
              {isRejected && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-950">
                  <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-xs text-rose-900">
                      Application Verification Rejected
                    </p>
                    <p className="text-xs text-rose-800 leading-relaxed">
                      Reason: <span className="font-medium">{rejectionReason}</span>
                    </p>
                    <p className="text-[11px] text-rose-700 mt-1">
                      This application is locked. Only an administrator can reopen it. You cannot upload, replace, or resubmit documents at this time. You may submit an inquiry to ask why your application was rejected.
                    </p>
                  </div>
                </div>
              )}

              {/* Reopened Guidance Banner */}
              {isReopened && (
                <div className="p-4 bg-sky-500/10 border border-sky-500/30 rounded-xl flex items-start gap-3 text-sky-950">
                  <Clock className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <p className="font-semibold text-xs text-sky-900">
                      Application Reopened for Resubmission
                    </p>
                    <div className="text-xs text-sky-900 leading-relaxed bg-sky-100/60 p-2.5 rounded-md border border-sky-200">
                      <span className="font-bold">Admissions Guidance:</span> {reopeningGuidance}
                    </div>
                    {existingApp?.rejection_reason && (
                      <p className="text-[11px] text-sky-800 mt-1">
                        <span className="font-medium">Original Rejection Reason (Preserved):</span> <em>{existingApp.rejection_reason}</em>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Suspension Reason Notice Banner */}
              {isSuspended && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-start gap-3 text-orange-950">
                  <ShieldAlert className="w-5 h-5 text-orange-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-xs text-orange-900">
                      Marketplace Suspension Notice
                    </p>
                    <p className="text-xs text-orange-800 leading-relaxed">
                      Reason: <span className="font-medium">{suspensionReason}</span>
                    </p>
                    <p className="text-[11px] text-orange-700 mt-1">
                      Please replace the required documents below. Existing approved documents do not need to be re-uploaded. Your account remains suspended until an authorized administrator explicitly approves re-verification.
                    </p>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Bar Credentials Section */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-3">
                  1. State Bar Admissions Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1">
                      State Bar Council <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={stateBar}
                      disabled={isSubmitting || isRejected}
                      onChange={(e) => setStateBar(e.target.value)}
                      className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-xs text-primary focus:border-slate focus:outline-none disabled:opacity-60"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1">
                      Bar Registration Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isSubmitting || isRejected}
                      placeholder="e.g. D/4921/2014"
                      value={barNumber}
                      onChange={(e) => setBarNumber(e.target.value)}
                      className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-xs text-primary focus:border-slate focus:outline-none disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1">
                      Years of Active Practice
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      disabled={isSubmitting || isRejected}
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(Number(e.target.value))}
                      className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-xs text-primary focus:border-slate focus:outline-none disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* Required Documents Section with Selective Replacement */}
              <div className="border-t border-hairline pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    2. Verification Documents &amp; Replacement
                  </h4>
                  <span className="text-[11px] text-on-surface-variant">
                    PDF, PNG, JPG (Auto-optimized)
                  </span>
                </div>

                <div className="space-y-4">
                  {requirements.map((req) => {
                    const selectedFile = selectedFiles[req.id];
                    const compressionNote = compressionNotes[req.id];

                    // Find active existing document for this requirement
                    const existingDoc = existingApp?.documents?.find(
                      (d) => d.document_requirement_id === req.id && d.is_active !== false
                    );

                    return (
                      <div
                        key={req.id}
                        className={`p-4 rounded-xl border transition-colors ${
                          selectedFile
                            ? "bg-emerald-50/20 border-emerald-300"
                            : existingDoc?.status === "REJECTED" || existingDoc?.status === "REPLACEMENT_REQUIRED"
                            ? "bg-rose-50/30 border-rose-300"
                            : "bg-surface-container-low/40 border-hairline"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-brass shrink-0" />
                              <span className="font-semibold text-xs text-primary">
                                {req.name} {req.is_required && <span className="text-rose-500">*</span>}
                              </span>

                              {/* Status Badge */}
                              {selectedFile ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                  <Sparkles className="w-3 h-3" /> Ready to Replace
                                </span>
                              ) : existingDoc ? (
                                existingDoc.status === "APPROVED" ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                    <CheckCircle2 className="w-3 h-3" /> Approved
                                  </span>
                                ) : existingDoc.status === "REJECTED" || existingDoc.status === "REPLACEMENT_REQUIRED" ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                                    <AlertCircle className="w-3 h-3" /> Needs Replacement
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                    Submitted
                                  </span>
                                )
                              ) : null}
                            </div>

                            {req.description && (
                              <p className="text-[11px] text-on-surface-variant pl-6">{req.description}</p>
                            )}

                            {/* Existing Document Info */}
                            {existingDoc && !selectedFile && (
                              <div className="pl-6 pt-1 text-xs flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-primary">{existingDoc.original_filename}</span>
                                <span className="text-on-surface-variant text-[11px]">
                                  ({(existingDoc.file_size / 1024).toFixed(0)} KB)
                                </span>
                                {existingDoc.signedUrl && (
                                  <a
                                    href={existingDoc.signedUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-brass text-[11px] hover:underline inline-flex items-center gap-1"
                                  >
                                    View File <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            )}

                            {/* Itemized Rejection Feedback */}
                            {existingDoc?.rejection_reason && !selectedFile && (
                              <div className="ml-6 mt-1 p-2 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-800">
                                <span className="font-semibold">Reviewer Note: </span>
                                {existingDoc.rejection_reason}
                              </div>
                            )}

                            {/* Compression Notice */}
                            {compressionNote && (
                              <p className="text-[11px] text-emerald-700 pl-6 flex items-center gap-1 font-medium">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                {compressionNote} &bull; <span className="underline">Pending final submission</span>
                              </p>
                            )}
                          </div>

                          <div className="sm:shrink-0 pl-6 sm:pl-0">
                            {selectedFile ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-emerald-800 font-semibold truncate max-w-[160px]">
                                  {selectedFile.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleFileSelect(req.id, null)}
                                  className="text-[11px] text-rose-600 hover:underline"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1.5 bg-surface-container-low border border-hairline text-on-surface-variant text-xs font-medium px-3.5 py-1.5 rounded-lg opacity-70">
                                <Lock className="w-3.5 h-3.5" />
                                Locked
                              </span>
                            ) : (
                              <label className="cursor-pointer inline-flex items-center gap-2 bg-surface hover:bg-surface-container-low border border-hairline text-primary text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-2xs">
                                <Upload className="w-3.5 h-3.5 text-brass" />
                                <span>{existingDoc ? "Replace Document" : "Select Document"}</span>
                                <input
                                  type="file"
                                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                                  className="hidden"
                                  disabled={isSubmitting || isRejected}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    handleFileSelect(req.id, file);
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Privilege Statement */}
              <div className="p-3.5 bg-surface-container-low rounded-xl border border-hairline text-[11px] text-on-surface-variant flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-brass shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Advocato adheres to statutory bar admission standards. All uploaded identity credentials are encrypted and accessed solely by the Bar Verification Panel. Pre-existing valid documents are preserved.
                </p>
              </div>

              {/* Action-Area Error Banner (guaranteed visible to user near the submit button) */}
              {errorMsg && (
                <div
                  ref={errorBannerRef}
                  className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs animate-in fade-in"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              {/* Submit Action */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-lg border border-hairline text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                {isRejected ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      const inquiryEl = document.getElementById("inquiry");
                      if (inquiryEl) {
                        inquiryEl.scrollIntoView({ behavior: "smooth" });
                      } else {
                        window.location.hash = "inquiry";
                      }
                    }}
                    className="bg-primary hover:bg-slate-dark text-white text-xs font-semibold px-6 py-2.5 rounded-lg shadow-xs hover:shadow-md flex items-center gap-2 min-h-[42px] cursor-pointer"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Ask Why My Application Was Rejected</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-brass hover:bg-brass-hover disabled:opacity-50 text-white text-xs font-semibold px-6 py-2.5 rounded-lg shadow-xs hover:shadow-md btn-editorial-brass flex items-center gap-2 min-h-[42px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>
                          {isSuspended
                            ? "Encrypting & Submitting..."
                            : isReopened
                            ? "Resubmitting Credentials..."
                            : "Submitting Dossier..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {isSuspended
                            ? "Submit Documents for Re-Verification"
                            : isReopened
                            ? "Resubmit Application for Review"
                            : "Submit Application for Approval"}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
