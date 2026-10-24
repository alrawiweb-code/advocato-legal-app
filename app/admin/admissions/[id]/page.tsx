"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
  ExternalLink,
  Calendar,
  MapPin,
  Scale,
  IndianRupee,
  Loader2,
  Check,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  History,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RotateCcw,
  Clock,
} from "lucide-react";

const REQUIREMENT_NAMES: Record<string, string> = {
  gov_id: "Government Issued Photo ID",
  bar_certificate: "Bar Council Certificate of Enrollment",
  practice_proof: "Proof of Active Practice",
};

export default function ApplicationReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [app, setApp] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showReplacedHistory, setShowReplacedHistory] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [isNotFound, setIsNotFound] = useState(false);

  // Reopen state
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [reopenNotes, setReopenNotes] = useState("");
  const [reopenError, setReopenError] = useState<string | null>(null);

  // Step 2: Consultation Fee state
  const [showRateForm, setShowRateForm] = useState(false);
  const [newRate, setNewRate] = useState<string>("");
  const [isSavingRate, setIsSavingRate] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [rateSuccess, setRateSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      const res = await fetch(`/api/admin/verification/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setIsNotFound(true);
          return;
        }
        throw new Error("Failed to load application");
      }
      const data = await res.json();
      setApp(data.application);
      if (data.application?.lawyer_profile?.hourly_rate) {
        setNewRate(String(data.application.lawyer_profile.hourly_rate));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Approve application (Decoupled from pricing, supports re-verification)
  const handleApprove = async () => {
    const isSuspended =
      app.lawyer_profile?.verification_status === "SUSPENDED" ||
      app.status === "SUSPENDED" ||
      Boolean(app.lawyer_profile?.suspension_reason);

    const confirmMsg = isSuspended
      ? "Are you sure you want to approve this attorney's updated documents and lift the suspension?"
      : "Are you sure you want to approve this attorney's credentials and verify them?";

    if (!confirm(confirmMsg)) return;

    setIsApproving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/verification/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Approval failed");
      }
      await fetchApplication();
    } catch (e: any) {
      alert(e.message || "Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    setIsRejecting(true);
    try {
      const res = await fetch(`/api/admin/verification/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rejection failed");
      router.push("/admin");
    } catch (e: any) {
      alert(e.message || "Rejection failed");
      setIsRejecting(false);
    }
  };

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app) return;
    setIsReopening(true);
    setReopenError(null);

    try {
      const res = await fetch(`/api/admin/verification/${app.id}/reopen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: reopenNotes }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setReopenError(data.error || "Failed to reopen application.");
        return;
      }

      setShowReopenModal(false);
      setReopenNotes("");
      await fetchApplication();
    } catch (err: any) {
      setReopenError(err.message || "An unexpected error occurred.");
    } finally {
      setIsReopening(false);
    }
  };

  // Step 2: Assign or edit consultation fee
  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setRateError(null);
    setRateSuccess(null);

    const parsedRate = parseInt(newRate, 10);
    if (isNaN(parsedRate) || parsedRate <= 0) {
      setRateError("Please enter a valid positive hourly consultation fee (₹/hr).");
      return;
    }

    if (!app?.lawyer_id) {
      setRateError("Lawyer profile record not found.");
      return;
    }

    setIsSavingRate(true);
    try {
      const res = await fetch(`/api/admin/lawyers/${app.lawyer_id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hourlyRate: parsedRate }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to set consultation fee");
      }

      setRateSuccess(`Consultation fee set to ₹${parsedRate.toLocaleString("en-IN")}/hr successfully.`);
      setShowRateForm(false);
      await fetchApplication();
    } catch (err: any) {
      setRateError(err.message || "Failed to assign consultation fee.");
    } finally {
      setIsSavingRate(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-on-surface-variant flex flex-col items-center">
        <div className="w-8 h-8 border-4 border-brass/30 border-t-brass rounded-full animate-spin mb-4" />
        <p className="font-semibold text-sm">Loading Application Record...</p>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="max-w-[800px] w-full mx-auto px-4 py-16 text-center">
        <div className="bg-surface-container-lowest p-8 md:p-12 rounded-2xl shadow-dossier border border-hairline flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-outline mb-4">
            <FileText className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-headline font-bold text-primary mb-2">Application Not Found</h2>
          <p className="text-on-surface-variant max-w-md mx-auto text-sm leading-relaxed mb-2">
            The verification application record could not be located in the admissions registry.
          </p>
          <p className="text-xs font-mono text-outline mb-6">
            Identifier: {id}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-slate-dark transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Admissions Queue
            </Link>
            <Link
              href="/admin/lawyers"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface-container-low border border-hairline text-primary text-sm font-semibold hover:bg-surface-container transition-colors"
            >
              Attorney Roster
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="p-12 text-center text-rose-600">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <h2 className="text-xl font-bold">Failed to load</h2>
        <p className="text-sm mt-1">{error}</p>
        <Link href="/admin" className="text-brass font-semibold hover:underline mt-4 inline-block">
          Return to Queue
        </Link>
      </div>
    );
  }

  const isLawyerSuspended =
    app.status !== "REJECTED" &&
    app.status !== "DOCUMENTS_REQUIRED" &&
    (app.lawyer_profile?.verification_status === "SUSPENDED" ||
      app.status === "SUSPENDED");

  const isPendingReverification =
    isLawyerSuspended && (app.status === "UNDER_REVIEW" || app.status === "PENDING" || app.status === "SUBMITTED");

  // An application is considered approved only if verified AND not currently suspended
  const isApproved = app.status === "APPROVED" && !isLawyerSuspended;
  const hasRate = typeof app.lawyer_profile?.hourly_rate === "number" && app.lawyer_profile.hourly_rate > 0;

  // Separate active documents vs superseded historical documents
  const allDocs = app.documents || [];
  const activeDocs = allDocs.filter((d: any) => d.is_active !== false);
  const supersededDocs = allDocs.filter((d: any) => d.is_active === false);

  return (
    <div className="max-w-[1000px] w-full mx-auto px-4 py-8 space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Admissions Queue
      </Link>

      {/* Header with Title and Status Badges */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Application Review</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Submitted on {format(new Date(app.submitted_at || app.created_at), "PPP 'at' p")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isPendingReverification ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              Pending Re-Verification
            </span>
          ) : isLawyerSuspended ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-orange-100 text-orange-900 border border-orange-300 flex items-center gap-1.5">
              <ShieldOff className="w-3.5 h-3.5 text-orange-700" />
              Suspended
            </span>
          ) : isApproved ? (
            hasRate ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Verified &amp; Active
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                Verified — Price Not Assigned
              </span>
            )
          ) : app.status === "DOCUMENTS_REQUIRED" ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              Awaiting Resubmission
            </span>
          ) : app.status === "REJECTED" ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300">
              Rejected
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
              Pending Review
            </span>
          )}
        </div>
      </div>

      {/* Prominent Banner when Application is Rejected */}
      {app.status === "REJECTED" && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-headline font-bold text-rose-950 text-base">
                  Application Has Been Rejected
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 border border-rose-300">
                  REJECTED
                </span>
              </div>
              <p className="text-xs text-rose-900 mt-1">
                Reason: <span className="font-semibold">{app.rejection_reason || "Credentials did not meet admissions criteria."}</span>
              </p>
              {app.reviewed_at && (
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Rejected on {format(new Date(app.reviewed_at), "PPP 'at' p")}
                </p>
              )}
            </div>
          </div>
          <div>
            <button
              onClick={() => setShowReopenModal(true)}
              className="px-4 py-2 bg-primary hover:bg-slate-dark text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reopen for Resubmission</span>
            </button>
          </div>
        </div>
      )}

      {/* Banner when Application is Reopened & Awaiting Resubmission */}
      {app.status === "DOCUMENTS_REQUIRED" && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-700 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-headline font-bold text-sky-950 text-base">
                  Application Reopened — Awaiting Lawyer Resubmission
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-200 text-sky-900 border border-sky-300">
                  DOCUMENTS_REQUIRED
                </span>
              </div>
              <p className="text-xs text-sky-900">
                The attorney has been authorized to resubmit their credentials. Adjudication buttons will unlock once the attorney submits updated documents.
              </p>
              {app.requested_changes && (
                <div className="text-xs text-sky-950 font-medium bg-sky-100/70 border border-sky-200/80 rounded-md p-2.5 mt-1">
                  <span className="font-bold text-sky-900">Reopening Guidance:</span> {app.requested_changes}
                </div>
              )}
              {app.rejection_reason && (
                <p className="text-[11px] text-sky-800">
                  <span className="font-semibold">Original Rejection Reason (Preserved):</span> <em>{app.rejection_reason}</em>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prominent Suspension Banner if Lawyer is Suspended */}
      {isLawyerSuspended && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-700 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-headline font-bold text-orange-950 text-base">
                  Marketplace Access is Currently Suspended
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-200 text-orange-900 border border-orange-300">
                  SUSPENDED
                </span>
              </div>
              <p className="text-xs text-orange-900 mt-1">
                Reason: <span className="font-semibold">{app.lawyer_profile?.suspension_reason || app.rejection_reason || "Administrative suspension"}</span>
              </p>
              {app.lawyer_profile?.suspended_at && (
                <p className="text-[11px] text-orange-700 mt-0.5">
                  Suspended on {format(new Date(app.lawyer_profile.suspended_at), "PPP 'at' p")}
                </p>
              )}
            </div>
          </div>
          {isPendingReverification && (
            <div className="sm:self-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                Updated credentials ready for review
              </span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Lawyer Profile */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-surface border border-hairline rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
              <Scale className="w-4 h-4 text-brass" />
              Attorney Profile
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-surface-container-low border border-hairline overflow-hidden flex items-center justify-center">
                  {app.lawyer_profile?.avatar_url ? (
                    <img src={app.lawyer_profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-brass">
                      {app.lawyer_profile?.full_name?.charAt(0) || "A"}
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-primary">{app.lawyer_profile?.full_name}</div>
                  <div className="text-xs text-on-surface-variant">{app.lawyer_profile?.email}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-hairline space-y-3 text-sm">
                <div>
                  <span className="text-on-surface-variant text-xs block mb-0.5">Headline</span>
                  <span className="font-medium text-primary">{app.lawyer_profile?.headline || "Not provided"}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs block mb-0.5">Bar Number</span>
                  <span className="font-mono bg-surface-container-low px-1.5 py-0.5 rounded text-primary">
                    {app.bar_number}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs block mb-0.5">Primary Jurisdiction</span>
                  <span className="font-medium text-primary">{app.state_bar}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs block mb-0.5">Years of Experience</span>
                  <span className="font-medium text-primary">{app.years_experience} years</span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs block mb-0.5">Consultation Rate</span>
                  <span className="font-semibold text-primary">
                    {hasRate ? (
                      `₹${app.lawyer_profile.hourly_rate.toLocaleString("en-IN")}/hr`
                    ) : (
                      <span className="text-amber-700 font-medium">Pending Admin Assignment</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Documents, Approval Actions & Pricing */}
        <div className="md:col-span-2 space-y-6">
          {/* Active Documents Grouped by Requirement */}
          <div className="bg-surface border border-hairline rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-hairline bg-surface-container-lowest flex items-center justify-between">
              <h3 className="font-semibold text-primary flex items-center gap-2">
                <FileText className="w-4 h-4 text-brass" />
                Submitted Documents
              </h3>
              <span className="text-xs text-on-surface-variant">
                {activeDocs.length} Active Document{activeDocs.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="p-6 space-y-4">
              {activeDocs.length > 0 ? (
                activeDocs.map((doc: any) => {
                  const requirementTitle =
                    REQUIREMENT_NAMES[doc.document_requirement_id] ||
                    doc.document_requirement_id?.replace(/_/g, " ").toUpperCase() ||
                    "Supporting Document";

                  // Check if there are superseded historical versions of this document
                  const priorVersions = supersededDocs.filter(
                    (sd: any) => sd.document_requirement_id === doc.document_requirement_id
                  );

                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl border border-hairline bg-surface-container-lowest space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-brass/10 flex items-center justify-center text-brass shrink-0 mt-0.5">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-xs text-primary">{requirementTitle}</span>
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Active Version
                              </span>
                            </div>
                            <p className="text-xs text-on-surface font-medium mt-0.5">{doc.original_filename}</p>
                            <p className="text-[11px] text-on-surface-variant">
                              {(doc.file_size / 1024).toFixed(0)} KB • {doc.mime_type} • Uploaded{" "}
                              {doc.created_at ? format(new Date(doc.created_at), "MMM d, yyyy") : "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {doc.signedUrl ? (
                            <a
                              href={doc.signedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-container-low hover:bg-surface-container text-primary text-xs font-semibold border border-hairline transition-colors"
                            >
                              View File <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-xs text-rose-500 font-semibold">File Unavailable</span>
                          )}
                        </div>
                      </div>

                      {/* Accordion for Superseded Replaced Versions */}
                      {priorVersions.length > 0 && (
                        <div className="pt-2 border-t border-hairline/60">
                          <button
                            type="button"
                            onClick={() =>
                              setShowReplacedHistory((prev) => ({
                                ...prev,
                                [doc.id]: !prev[doc.id],
                              }))
                            }
                            className="text-[11px] font-semibold text-on-surface-variant hover:text-primary flex items-center gap-1 transition-colors"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>
                              {priorVersions.length} Replaced Version{priorVersions.length !== 1 ? "s" : ""} (Audit Log)
                            </span>
                            {showReplacedHistory[doc.id] ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>

                          {showReplacedHistory[doc.id] && (
                            <div className="mt-2 space-y-2 pl-4 border-l-2 border-hairline">
                              {priorVersions.map((pDoc: any) => (
                                <div
                                  key={pDoc.id}
                                  className="flex items-center justify-between text-xs p-2 bg-surface-container-low/50 rounded"
                                >
                                  <div>
                                    <span className="font-mono text-[11px] text-on-surface-variant">
                                      {pDoc.original_filename}
                                    </span>
                                    <span className="text-[10px] text-on-surface-variant/80 ml-2">
                                      (Replaced • {(pDoc.file_size / 1024).toFixed(0)} KB •{" "}
                                      {pDoc.created_at ? format(new Date(pDoc.created_at), "MMM d, yyyy") : ""})
                                    </span>
                                  </div>
                                  {pDoc.signedUrl && (
                                    <a
                                      href={pDoc.signedUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-brass hover:underline text-[11px] inline-flex items-center gap-1"
                                    >
                                      View <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-on-surface-variant">
                  <p className="text-sm">No documents were uploaded with this application.</p>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* STEP 1 ACTIONS: Approve or Reject                            */}
          {/* Enabled whenever lawyer is not verified and not waiting for lawyer resubmission */}
          {/* ============================================================ */}
          {(!isApproved || isLawyerSuspended) && app.status !== "REJECTED" && app.status !== "DOCUMENTS_REQUIRED" && (
            <div className="bg-surface border border-hairline rounded-xl p-6 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider">
                  {isLawyerSuspended ? "Admissions Re-Verification Action" : "Step 1: Credential Verification"}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {isLawyerSuspended
                    ? "Approve corrected documents to reinstate attorney marketplace access. Existing rates are preserved."
                    : "Approve bar credentials and license validity. Fee can be assigned separately in Step 2."}
                </p>
              </div>

              {!showRejectModal ? (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-semibold text-xs transition-colors"
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{isLawyerSuspended ? "Approve & Re-Verify" : "Approve & Verify"}</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="w-full space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1">Reason for Rejection</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this application is being rejected (sent to the attorney)..."
                      className="w-full p-3 bg-surface-container-lowest border border-hairline rounded-lg text-xs focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none min-h-[90px]"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowRejectModal(false)}
                      className="px-4 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low font-semibold text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={isRejecting || !rejectionReason.trim()}
                      className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      {isRejecting ? "Rejecting..." : "Confirm Rejection"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2 ACTIONS: Assign / Edit Consultation Fee                */}
          {/* ============================================================ */}
          {isApproved && (
            <div className="bg-surface border border-hairline rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-hairline">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-surface-container-low border border-hairline text-[11px] font-bold text-brass mb-1">
                    <IndianRupee className="w-3 h-3 text-brass" />
                    <span>Step 2: Consultation Pricing</span>
                  </div>
                  <h3 className="text-base font-bold text-primary">Official Consultation Fee</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {hasRate
                      ? "This attorney is currently eligible for marketplace listings and new client bookings."
                      : "Attorney credentials are verified. Assign a consultation fee to make them eligible for bookings and public listings."}
                  </p>
                </div>

                {!showRateForm && (
                  <button
                    onClick={() => {
                      setShowRateForm(true);
                      setRateError(null);
                      setRateSuccess(null);
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all ${
                      hasRate
                        ? "bg-surface-container-low hover:bg-surface-container border border-hairline text-primary"
                        : "bg-brass hover:bg-brass-hover text-white shadow-sm"
                    }`}
                  >
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>{hasRate ? "Edit Consultation Fee" : "Assign Consultation Fee"}</span>
                  </button>
                )}
              </div>

              {rateSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{rateSuccess}</span>
                </div>
              )}

              {rateError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{rateError}</span>
                </div>
              )}

              {/* Current Status Display */}
              {!showRateForm && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-surface-container-lowest border border-hairline">
                  <span className="text-xs font-medium text-on-surface-variant">Active Rate</span>
                  <span className="text-sm font-bold text-primary">
                    {hasRate ? (
                      `₹${app.lawyer_profile.hourly_rate.toLocaleString("en-IN")} / hr`
                    ) : (
                      <span className="text-amber-700 text-xs font-semibold">Pending Admin Assignment</span>
                    )}
                  </span>
                </div>
              )}

              {/* Rate Form */}
              {showRateForm && (
                <form onSubmit={handleSaveRate} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1">
                      Official Rate (₹ / hr) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative max-w-xs">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm font-semibold">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        placeholder="e.g. 2500"
                        value={newRate}
                        onChange={(e) => setNewRate(e.target.value)}
                        className="w-full pl-8 pr-12 py-2 bg-surface-container-lowest border border-hairline rounded-lg text-sm text-primary font-semibold focus:border-brass focus:ring-1 focus:ring-brass outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">
                        / hr
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-1.5">
                      Must be a positive amount. This fee will be pre-authorized upon client booking.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowRateForm(false)}
                      className="px-4 py-2 rounded-lg border border-hairline text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingRate || !newRate || Number(newRate) <= 0}
                      className="px-5 py-2 rounded-lg bg-brass hover:bg-brass-hover disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-2"
                    >
                      {isSavingRate ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Official Rate...</span>
                        </>
                      ) : (
                        <span>Save Official Rate</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* AUDIT LOG TIMELINE                                           */}
          {/* ============================================================ */}
          {app.audit_logs && app.audit_logs.length > 0 && (
            <div className="bg-surface border border-hairline rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-hairline bg-surface-container-lowest flex items-center gap-2">
                <History className="w-4 h-4 text-brass" />
                <h3 className="font-semibold text-primary text-sm">Regulatory Audit Log</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {app.audit_logs.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-brass mt-1.5 shrink-0" />
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-semibold text-primary font-mono text-[11px]">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-on-surface-variant">
                            {format(new Date(log.created_at), "PP 'at' p")}
                          </span>
                        </div>
                        <p className="text-on-surface-variant leading-relaxed">{log.reason}</p>
                        {log.previous_status && log.new_status && (
                          <p className="text-[10px] text-on-surface-variant/80 font-mono">
                            Status change: {log.previous_status} → {log.new_status}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reopen Application Confirmation Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface rounded-2xl border border-hairline shadow-editorial max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-primary text-base">Reopen Application</h3>
                <p className="text-xs text-on-surface-variant">Allow the attorney to revise credentials and resubmit.</p>
              </div>
            </div>

            <div className="p-3 bg-surface-container-low rounded-lg border border-hairline text-xs space-y-1">
              <p className="font-semibold text-primary">Original Rejection Preserved</p>
              <p className="text-on-surface-variant italic">"{app.rejection_reason || 'Rejection record on file'}"</p>
            </div>

            {reopenError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{reopenError}</span>
              </div>
            )}

            <form onSubmit={handleReopen} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-primary mb-1">
                  Resubmission Guidance / Instructions for Attorney <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reopenNotes}
                  onChange={(e) => setReopenNotes(e.target.value)}
                  placeholder="e.g. Please upload an updated Bar Certificate issued within the last 6 months."
                  className="w-full bg-surface border border-hairline rounded-lg p-3 text-xs text-primary focus:border-brass focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-4 py-2 rounded-lg border border-hairline text-xs font-semibold hover:bg-surface-container-low cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReopening}
                  className="px-5 py-2 rounded-lg bg-primary hover:bg-slate-dark text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isReopening ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Reopening...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Reopen</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
