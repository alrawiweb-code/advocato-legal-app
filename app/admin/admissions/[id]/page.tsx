"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle, XCircle, FileText, AlertTriangle, ExternalLink, Calendar, MapPin, Scale } from "lucide-react";

export default function ApplicationReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [app, setApp] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      const res = await fetch(`/api/admin/verification/${id}`);
      if (!res.ok) throw new Error("Failed to load application");
      const data = await res.json();
      setApp(data.application);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm("Are you sure you want to approve this attorney and verify them in the marketplace?")) return;
    setIsApproving(true);
    try {
      const res = await fetch(`/api/admin/verification/${id}/approve`, { method: "POST" });
      if (!res.ok) throw new Error("Approval failed");
      router.push("/admin");
    } catch (e: any) {
      alert(e.message);
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
      if (!res.ok) throw new Error("Rejection failed");
      router.push("/admin");
    } catch (e: any) {
      alert(e.message);
      setIsRejecting(false);
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

  return (
    <div className="max-w-[1000px] w-full mx-auto px-4 py-8 space-y-6">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Admissions Queue
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Application Review</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Submitted on {format(new Date(app.submitted_at || app.created_at), "PPP 'at' p")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
            app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
            app.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
            'bg-amber-100 text-amber-800'
          }`}>
            {app.status}
          </span>
        </div>
      </div>

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
                    <span className="text-2xl font-bold text-brass">{app.lawyer_profile?.full_name?.charAt(0) || "A"}</span>
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
                  <span className="font-mono bg-surface-container-low px-1.5 py-0.5 rounded text-primary">{app.bar_number}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs block mb-0.5">Primary Jurisdiction</span>
                  <span className="font-medium text-primary">{app.state_bar}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-xs block mb-0.5">Years of Experience</span>
                  <span className="font-medium text-primary">{app.years_experience} years</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Documents and Actions */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface border border-hairline rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-hairline bg-surface-container-lowest">
              <h3 className="font-semibold text-primary flex items-center gap-2">
                <FileText className="w-4 h-4 text-brass" />
                Submitted Documents
              </h3>
            </div>
            
            <div className="p-6">
              {app.documents && app.documents.length > 0 ? (
                <div className="space-y-4">
                  {app.documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border border-hairline bg-surface-container-lowest">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-brass/10 flex items-center justify-center text-brass">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-primary">{doc.original_filename}</p>
                          <p className="text-xs text-on-surface-variant">{(doc.file_size / 1024 / 1024).toFixed(2)} MB • {doc.mime_type}</p>
                        </div>
                      </div>
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
                        <span className="text-xs text-rose-500 font-semibold">Unavailable</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-on-surface-variant">
                  <p className="text-sm">No documents were uploaded with this application.</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {(app.status === 'PENDING' || app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW') && (
            <div className="bg-surface border border-hairline rounded-xl p-6 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-end">
              {!showRejectModal ? (
                <>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-semibold text-sm transition-colors"
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="w-full sm:w-auto px-8 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {isApproving ? "Approving..." : <><CheckCircle className="w-4 h-4" /> Approve & Verify</>}
                  </button>
                </>
              ) : (
                <div className="w-full space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1">Reason for Rejection</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this application is being rejected (sent to the attorney)..."
                      className="w-full p-3 bg-surface-container-lowest border border-hairline rounded-lg text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none min-h-[100px]"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowRejectModal(false)}
                      className="px-4 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low font-semibold text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={isRejecting || !rejectionReason.trim()}
                      className="px-6 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {isRejecting ? "Rejecting..." : "Confirm Rejection"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
