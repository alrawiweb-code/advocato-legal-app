"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  FileText,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Scale,
  Calendar,
  Clock,
  User,
  Building,
} from "lucide-react";
import {
  getAdminApplicationDetail,
  approveLawyerApplication,
  rejectLawyerApplication,
  LawyerApplicationRecord,
} from "@/lib/supabase/verification";
import { useUserRole } from "@/lib/context/RoleContext";

interface ApplicationReviewModalProps {
  applicationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function ApplicationReviewModal({
  applicationId,
  isOpen,
  onClose,
  onUpdated,
}: ApplicationReviewModalProps) {
  const { currentUser } = useUserRole();
  const [appDetail, setAppDetail] = useState<LawyerApplicationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Rejection Form state
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!isOpen || !applicationId) return;

    let isMounted = true;
    async function loadDetail() {
      setIsLoading(true);
      setActionError(null);
      setShowRejectForm(false);
      setRejectReason("");
      try {
        const data = await getAdminApplicationDetail(applicationId!);
        if (isMounted) {
          setAppDetail(data);
        }
      } catch (err) {
        console.error("Error loading application detail:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDetail();
    return () => {
      isMounted = false;
    };
  }, [isOpen, applicationId]);

  if (!isOpen) return null;

  const handleApprove = async () => {
    if (!appDetail) return;
    setIsProcessing(true);
    setActionError(null);

    try {
      const res = await approveLawyerApplication(
        appDetail.id,
        appDetail.lawyer_id,
        currentUser.id
      );

      if (!res.success) {
        setActionError(res.error || "Failed to approve application");
        setIsProcessing(false);
        return;
      }

      onUpdated();
      onClose();
    } catch (err: any) {
      setActionError(err.message || "An unexpected error occurred");
      setIsProcessing(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appDetail) return;

    if (!rejectReason.trim()) {
      setActionError("Please state a clear reason for rejecting or requesting changes.");
      return;
    }

    setIsProcessing(true);
    setActionError(null);

    try {
      const res = await rejectLawyerApplication(
        appDetail.id,
        appDetail.lawyer_id,
        currentUser.id,
        rejectReason.trim()
      );

      if (!res.success) {
        setActionError(res.error || "Failed to reject application");
        setIsProcessing(false);
        return;
      }

      onUpdated();
      onClose();
    } catch (err: any) {
      setActionError(err.message || "An unexpected error occurred");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-hairline rounded-2xl shadow-editorial w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-hairline flex items-center justify-between bg-surface-container-low/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-brass shadow-2xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline text-lg sm:text-xl font-bold text-primary">
                  Review Admissions Dossier
                </h2>
                {appDetail && (
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                      appDetail.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : appDetail.status === "REJECTED"
                        ? "bg-rose-50 text-rose-800 border-rose-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {appDetail.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Bar Council accreditation, identity verification, and statutory enrollment check
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dossier review modal"
            className="w-8 h-8 rounded-lg border border-hairline flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-sm">
          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 text-brass animate-spin mb-3" />
              <p className="text-xs text-on-surface-variant">Retrieving encrypted application dossier...</p>
            </div>
          ) : !appDetail ? (
            <div className="py-16 text-center text-on-surface-variant text-xs">
              Unable to locate the specified application.
            </div>
          ) : (
            <>
              {actionError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Attorney Overview Grid */}
              <div className="p-5 bg-surface-container-low rounded-xl border border-hairline grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant block">
                    Applicant Attorney
                  </span>
                  <h3 className="font-headline text-base font-bold text-primary">
                    {appDetail.lawyer_profile?.full_name || "Counsel"}
                  </h3>
                  <p className="text-xs text-on-surface-variant font-mono">
                    {appDetail.lawyer_profile?.email}
                  </p>
                </div>

                <div className="space-y-1 sm:text-right">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant block">
                    State Bar Council &amp; Enrollment
                  </span>
                  <p className="text-sm font-semibold text-primary">
                    {appDetail.state_bar || "Not specified"}
                  </p>
                  <p className="text-xs font-mono font-bold text-brass bg-brass/10 px-2 py-0.5 rounded inline-block">
                    {appDetail.bar_number || "Bar No. Pending"}
                  </p>
                </div>

                <div className="pt-3 border-t border-hairline flex items-center gap-4 text-xs text-on-surface-variant col-span-1 sm:col-span-2">
                  <div>
                    <span className="font-semibold text-primary">Practice Areas: </span>
                    <span>{appDetail.lawyer_profile?.practice_areas?.join(", ") || "General Practice"}</span>
                  </div>
                  <div>•</div>
                  <div>
                    <span className="font-semibold text-primary">Experience: </span>
                    <span>{appDetail.years_experience || 5} Years</span>
                  </div>
                  <div>•</div>
                  <div>
                    <span className="font-semibold text-primary">Rate: </span>
                    <span>₹{appDetail.lawyer_profile?.hourly_rate || 2500}/hr</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Uploaded Enrollment Documents ({appDetail.documents?.length || 0})
                </h4>

                {(!appDetail.documents || appDetail.documents.length === 0) ? (
                  <div className="p-6 bg-surface-container-low rounded-xl border border-hairline text-center text-xs text-on-surface-variant">
                    No documents attached to this submission.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appDetail.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-4 bg-surface-container-low/60 rounded-xl border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-surface border border-hairline flex items-center justify-center text-brass shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-semibold text-xs text-primary truncate">
                              {doc.document_requirement_id === "bar_certificate"
                                ? "Bar Council Enrollment Certificate"
                                : doc.document_requirement_id === "gov_id"
                                ? "Government Photo Identification"
                                : "Proof of Practice / Vakalatnama"}
                            </h5>
                            <p className="text-[11px] text-on-surface-variant truncate">
                              {doc.original_filename} • {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>

                        {doc.signedUrl ? (
                          <a
                            href={doc.signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-surface hover:bg-surface-container-low border border-hairline text-primary text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-2xs shrink-0 self-start sm:self-auto"
                          >
                            <span>Inspect Document</span>
                            <ExternalLink className="w-3.5 h-3.5 text-brass" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-on-surface-variant italic">
                            Signed link unavailable
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rejection Form Drawer */}
              {showRejectForm && (
                <form
                  onSubmit={handleReject}
                  className="p-5 bg-rose-50/50 border border-rose-200 rounded-xl space-y-3 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>Specify Reason for Rejection / Revision</span>
                    </h5>
                    <button
                      type="button"
                      onClick={() => setShowRejectForm(false)}
                      className="text-xs text-on-surface-variant hover:text-primary"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Bar Certificate image is blurred; or enrollment number does not match Bar Council records..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full bg-white border border-rose-200 rounded-lg p-3 text-xs text-primary focus:border-rose-400 focus:outline-none resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-5 py-2 rounded-lg shadow-xs flex items-center gap-1.5"
                    >
                      {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>Confirm Rejection</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* Modal Footer / Actions */}
        {appDetail && (
          <div className="p-6 border-t border-hairline bg-surface-container-low/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brass" />
              <span>
                Submitted: {appDetail.submitted_at ? new Date(appDetail.submitted_at).toLocaleDateString() : "Pending"}
              </span>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              {!showRejectForm && appDetail.status !== "REJECTED" && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setShowRejectForm(true)}
                  className="px-4 py-2.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center gap-1.5 min-h-[40px]"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject / Need Info</span>
                </button>
              )}

              {appDetail.status !== "APPROVED" && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleApprove}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-6 py-2.5 rounded-lg shadow-xs hover:shadow-md flex items-center gap-2 min-h-[40px]"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Admitting Attorney...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Approve &amp; Admit to Roster</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
