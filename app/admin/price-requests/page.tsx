"use client";

import React, { useState, useEffect } from "react";
import {
  Loader2,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  User,
  ShieldCheck,
  AlertCircle,
  X,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface PriceRequest {
  id: string;
  lawyer_id: string;
  current_rate: number | null;
  requested_rate: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  rejection_reason?: string | null;
  lawyer_name?: string;
  lawyer_email?: string;
  lawyer_avatar_url?: string | null;
  bar_number?: string | null;
  state_bar?: string | null;
  lawyer?: {
    profiles?: {
      full_name: string;
      email: string;
      avatar_url?: string | null;
    };
    title?: string;
    bar_number?: string | null;
    state_bar?: string | null;
    current_official_rate?: number | null;
  };
}

export default function AdminPriceRequestsPage() {
  const [requests, setRequests] = useState<PriceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modal States
  const [rejectModalRequest, setRejectModalRequest] = useState<PriceRequest | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [approveModalRequest, setApproveModalRequest] = useState<PriceRequest | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/price-requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      } else {
        const err = await res.json();
        setActionError(err.error || "Failed to load fee increase requests.");
      }
    } catch (e: any) {
      console.error(e);
      setActionError(e.message || "Failed to load fee increase requests.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approveModalRequest) return;
    const req = approveModalRequest;

    setProcessingId(req.id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/price-requests/${req.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to authorize fee increase.");
      }

      setApproveModalRequest(null);
      await fetchRequests();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModalRequest) return;
    const req = rejectModalRequest;

    if (!rejectionReasonInput.trim()) {
      setActionError("Please provide a reason or constructive feedback for rejection.");
      return;
    }

    setProcessingId(req.id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/price-requests/${req.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REJECT",
          rejectionReason: rejectionReasonInput.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reject fee increase request.");
      }

      setRejectModalRequest(null);
      setRejectionReasonInput("");
      await fetchRequests();
    } catch (e: any) {
      setActionError(e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = requests.filter((r) => r.status === "REJECTED").length;
  const allCount = requests.length;

  const filteredRequests = requests.filter((r) => filter === "ALL" || r.status === filter);

  return (
    <div className="flex-1 flex flex-col bg-background min-h-screen">
      {/* Top Banner */}
      <div className="bg-surface border-b border-hairline px-6 sm:px-8 py-5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-brass/10 border border-brass/20 flex items-center justify-center text-brass">
              <IndianRupee className="w-4 h-4" />
            </span>
            <h1 className="font-headline text-2xl font-bold text-primary">
              Lawyer Fee Increase Requests
            </h1>
            {pendingCount > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-200">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Review attorney consultation rate increase requests, justifications, and authorize official updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRequests}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-surface-container-low hover:bg-surface-container border border-hairline text-primary transition-colors disabled:opacity-50"
            title="Refresh Requests"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div className="max-w-5xl mx-auto w-full px-6 sm:px-8 pt-6">
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 p-6 sm:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Status Tabs with Live Badges */}
          <div className="flex items-center gap-2 border-b border-hairline pb-4 overflow-x-auto no-scrollbar">
            {[
              { key: "PENDING", label: "Pending", count: pendingCount },
              { key: "APPROVED", label: "Approved", count: approvedCount },
              { key: "REJECTED", label: "Rejected", count: rejectedCount },
              { key: "ALL", label: "All Requests", count: allCount },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
                  filter === tab.key
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                    filter === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-on-surface-variant">
              <Loader2 className="w-8 h-8 text-brass animate-spin mb-3" />
              <p className="text-xs font-semibold">Loading fee increase requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-20 bg-surface-container-lowest rounded-2xl border border-hairline border-dashed">
              <IndianRupee className="w-12 h-12 text-outline mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-semibold text-primary mb-1">
                No {filter !== "ALL" ? filter.toLowerCase() : ""} requests found
              </h3>
              <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
                {filter === "PENDING"
                  ? "There are currently no pending consultation fee increase requests awaiting admin review."
                  : "No rate adjustment records match the selected filter category."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((req) => {
                const lawyerName =
                  req.lawyer_name || req.lawyer?.profiles?.full_name || "Advocate";
                const lawyerEmail =
                  req.lawyer_email || req.lawyer?.profiles?.email || "";
                const avatarUrl =
                  req.lawyer_avatar_url || req.lawyer?.profiles?.avatar_url;
                const barNumber = req.bar_number || req.lawyer?.bar_number;
                const stateBar = req.state_bar || req.lawyer?.state_bar;
                const rateDifference =
                  req.current_rate != null
                    ? req.requested_rate - req.current_rate
                    : null;

                return (
                  <div
                    key={req.id}
                    className="bg-surface-container-lowest rounded-xl border border-hairline p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row gap-6 transition-all hover:border-hairline/80"
                  >
                    <div className="flex-1 space-y-4">
                      {/* Lawyer Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={lawyerName}
                              className="w-11 h-11 rounded-full object-cover border border-hairline shadow-2xs"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-surface-container-low border border-hairline flex items-center justify-center font-bold text-sm text-primary">
                              {lawyerName.slice(0, 2).toUpperCase()}
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Link
                                href={`/lawyers/${req.lawyer_id}`}
                                className="font-semibold text-primary hover:underline flex items-center gap-1 group"
                              >
                                <span>{lawyerName}</span>
                                <ExternalLink className="w-3.5 h-3.5 text-outline opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                              {barNumber && (
                                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant border border-hairline">
                                  Bar: {barNumber}
                                </span>
                              )}
                              {stateBar && (
                                <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant border border-hairline">
                                  {stateBar}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              {lawyerEmail}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant shrink-0">
                          <Clock className="w-3.5 h-3.5 text-outline" />
                          <span>
                            {new Date(req.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Fee Comparison Card */}
                      <div className="bg-surface-container-low/70 border border-hairline rounded-xl p-4 flex flex-wrap items-center gap-4 sm:gap-8">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-outline mb-1">
                            Current Official Fee
                          </p>
                          <div className="flex items-center gap-1">
                            {req.current_rate != null ? (
                              <p className="text-lg font-bold text-primary">
                                ₹{req.current_rate.toLocaleString("en-IN")}
                                <span className="text-xs font-normal text-on-surface-variant">/hr</span>
                              </p>
                            ) : (
                              <span className="text-xs font-semibold px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                Not Assigned
                              </span>
                            )}
                          </div>
                        </div>

                        <ArrowRight className="w-5 h-5 text-outline shrink-0 hidden sm:block" />

                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-brass mb-1">
                            Requested Consultation Fee
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xl font-bold text-brass">
                              ₹{req.requested_rate.toLocaleString("en-IN")}
                              <span className="text-xs font-normal text-brass/80">/hr</span>
                            </p>
                            {rateDifference != null && rateDifference > 0 && (
                              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                +₹{rateDifference.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lawyer's Message */}
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-on-surface">
                          Lawyer's Submitted Justification &amp; Message:
                        </p>
                        <div className="bg-surface-container-lowest border-l-2 border-brass pl-3.5 py-1.5 rounded-r text-xs sm:text-sm text-on-surface-variant italic leading-relaxed">
                          "{req.reason}"
                        </div>
                      </div>

                      {/* Rejection Feedback Note (if rejected) */}
                      {req.status === "REJECTED" && req.rejection_reason && (
                        <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-3 text-xs space-y-1">
                          <span className="font-semibold text-rose-800 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Admin Rejection Feedback:
                          </span>
                          <p className="text-rose-900 leading-relaxed italic pl-5">
                            "{req.rejection_reason}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Column */}
                    <div className="lg:w-52 flex flex-col justify-center gap-2.5 border-t lg:border-t-0 lg:border-l border-hairline pt-4 lg:pt-0 lg:pl-6">
                      {req.status === "PENDING" ? (
                        <>
                          <button
                            onClick={() => setApproveModalRequest(req)}
                            disabled={processingId === req.id}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Authorize Rate</span>
                          </button>
                          <button
                            onClick={() => {
                              setRejectModalRequest(req);
                              setRejectionReasonInput("");
                            }}
                            disabled={processingId === req.id}
                            className="w-full bg-surface-container hover:bg-rose-50 text-rose-700 border border-transparent hover:border-rose-200 py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject Request</span>
                          </button>
                        </>
                      ) : req.status === "APPROVED" ? (
                        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center">
                          <CheckCircle2 className="w-7 h-7 mb-1.5 text-emerald-600" />
                          <span className="font-bold text-xs uppercase tracking-wider">
                            Authorized
                          </span>
                          <span className="text-[11px] text-emerald-700 mt-0.5">
                            Rate updated to ₹{req.requested_rate.toLocaleString("en-IN")}/hr
                          </span>
                          {req.reviewed_at && (
                            <span className="text-[10px] text-emerald-600/80 mt-1">
                              {new Date(req.reviewed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-center">
                          <XCircle className="w-7 h-7 mb-1.5 text-rose-600" />
                          <span className="font-bold text-xs uppercase tracking-wider">
                            Rejected
                          </span>
                          <span className="text-[11px] text-rose-700 mt-0.5">
                            Fee left unchanged
                          </span>
                          {req.reviewed_at && (
                            <span className="text-[10px] text-rose-600/80 mt-1">
                              {new Date(req.reviewed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Approval Confirmation Modal */}
      {approveModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl shadow-editorial w-full max-w-md border border-hairline overflow-hidden">
            <div className="p-5 border-b border-hairline flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-headline text-base font-bold text-primary">
                  Authorize Fee Increase
                </h3>
              </div>
              <button
                onClick={() => setApproveModalRequest(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-surface-container-low text-on-surface-variant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                You are about to authorize the consultation fee increase for{" "}
                <strong className="text-primary font-semibold">
                  {approveModalRequest.lawyer_name ||
                    approveModalRequest.lawyer?.profiles?.full_name ||
                    "Advocate"}
                </strong>
                .
              </p>

              <div className="bg-surface-container-low p-4 rounded-xl border border-hairline space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Current Official Fee:</span>
                  <span className="font-bold text-primary">
                    {approveModalRequest.current_rate != null
                      ? `₹${approveModalRequest.current_rate.toLocaleString("en-IN")}/hr`
                      : "Not Assigned"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brass font-semibold">New Authorized Fee:</span>
                  <span className="font-bold text-brass text-sm">
                    ₹{approveModalRequest.requested_rate.toLocaleString("en-IN")}/hr
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-outline">
                This will immediately update the lawyer's official consultation fee across the directory and client booking workflows.
              </p>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setApproveModalRequest(null)}
                  disabled={processingId !== null}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-hairline hover:bg-surface-container text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={processingId !== null}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-2"
                >
                  {processingId === approveModalRequest.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Confirm Authorization</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl shadow-editorial w-full max-w-lg border border-hairline overflow-hidden">
            <div className="p-5 border-b border-hairline flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <h3 className="font-headline text-base font-bold text-primary">
                  Reject Fee Increase Request
                </h3>
              </div>
              <button
                onClick={() => setRejectModalRequest(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-surface-container-low text-on-surface-variant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Please provide feedback for{" "}
                <strong className="text-primary font-semibold">
                  {rejectModalRequest.lawyer_name ||
                    rejectModalRequest.lawyer?.profiles?.full_name ||
                    "Advocate"}
                </strong>{" "}
                explaining why their requested fee of{" "}
                <strong className="text-brass">
                  ₹{rejectModalRequest.requested_rate.toLocaleString("en-IN")}/hr
                </strong>{" "}
                cannot be authorized at this time.
              </p>

              <div>
                <label className="block text-xs font-semibold text-primary mb-1.5">
                  Rejection Reason &amp; Feedback for Attorney <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Standard consultation fees for 2-3 years PQE in this jurisdiction are capped at ₹2,500/hr. Additional case history required before rate review..."
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  className="w-full bg-surface-container-low border border-hairline rounded-lg p-3 text-xs sm:text-sm text-primary focus:outline-none focus:border-brass resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRejectModalRequest(null)}
                  disabled={processingId !== null}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-hairline hover:bg-surface-container text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={processingId !== null || !rejectionReasonInput.trim()}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {processingId === rejectModalRequest.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span>Reject Request</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

