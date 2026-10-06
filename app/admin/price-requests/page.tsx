"use client";

import React, { useState, useEffect } from "react";
import { Loader2, IndianRupee, CheckCircle2, XCircle, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { useUserRole } from "@/lib/context/RoleContext";
import Link from "next/link";

interface PriceRequest {
  id: string;
  lawyer_id: string;
  current_rate: number;
  requested_rate: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
  lawyer?: {
    profiles: {
      full_name: string;
      email: string;
    };
  };
}

export default function AdminPriceRequestsPage() {
  const { currentUser } = useUserRole();
  const [requests, setRequests] = useState<PriceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/price-requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (id: string, action: "APPROVE" | "REJECT") => {
    let rejectionReason = "";
    if (action === "REJECT") {
      const reason = window.prompt("Enter reason for rejection:");
      if (!reason || reason.trim() === "") return;
      rejectionReason = reason;
    }

    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this rate change request?`)) return;

    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/price-requests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason, adminId: currentUser.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process request");
      }

      await fetchRequests();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(r => filter === "ALL" || r.status === filter);

  return (
    <div className="flex-1 flex flex-col bg-background h-screen overflow-hidden">
      <div className="bg-surface border-b border-hairline px-8 py-5 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-primary">Price Change Requests</h1>
          <p className="text-sm text-on-surface-variant mt-1">Review and authorize lawyer hourly rate adjustments.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-2 border-b border-hairline pb-4">
            {["PENDING", "APPROVED", "REJECTED", "ALL"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  filter === f 
                    ? "bg-primary text-white" 
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {f === "ALL" ? "All Requests" : f}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 text-brass animate-spin" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-20 bg-surface-container-lowest rounded-2xl border border-hairline border-dashed">
              <IndianRupee className="w-10 h-10 text-outline mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-primary mb-1">No {filter !== "ALL" ? filter.toLowerCase() : ""} requests</h3>
              <p className="text-sm text-on-surface-variant">There are currently no rate change requests in this category.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((req) => (
                <div key={req.id} className="bg-surface-container-lowest rounded-xl border border-hairline p-5 shadow-sm flex flex-col sm:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Link href={`/lawyers/${req.lawyer_id}`} className="font-semibold text-primary hover:underline">
                          {req.lawyer?.profiles?.full_name || "Unknown Lawyer"}
                        </Link>
                        <p className="text-xs text-on-surface-variant">{req.lawyer?.profiles?.email}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(req.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="bg-surface-container-low border border-hairline rounded-lg p-4 mb-4 flex items-center gap-6">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-outline mb-1">Current Rate</p>
                        <p className="text-lg font-semibold text-primary">₹{req.current_rate?.toLocaleString("en-IN") || 0}/hr</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-outline shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-brass mb-1">Requested Rate</p>
                        <p className="text-lg font-bold text-brass">₹{req.requested_rate.toLocaleString("en-IN")}/hr</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-on-surface mb-1">Justification:</p>
                      <p className="text-sm text-on-surface-variant leading-relaxed italic border-l-2 border-brass pl-3">
                        "{req.reason}"
                      </p>
                    </div>
                  </div>

                  <div className="sm:w-48 flex flex-col justify-center gap-3 border-t sm:border-t-0 sm:border-l border-hairline pt-4 sm:pt-0 sm:pl-6">
                    {req.status === "PENDING" ? (
                      <>
                        <button
                          onClick={() => handleAction(req.id, "APPROVE")}
                          disabled={processingId === req.id}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                          {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          Authorize
                        </button>
                        <button
                          onClick={() => handleAction(req.id, "REJECT")}
                          disabled={processingId === req.id}
                          className="w-full bg-surface-container hover:bg-rose-50 text-rose-700 border border-transparent hover:border-rose-200 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </>
                    ) : (
                      <div className={`flex flex-col items-center justify-center h-full p-4 rounded-lg border ${
                        req.status === "APPROVED" 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                          : "bg-rose-50 border-rose-200 text-rose-700"
                      }`}>
                        {req.status === "APPROVED" ? (
                          <CheckCircle2 className="w-8 h-8 mb-2 opacity-80" />
                        ) : (
                          <XCircle className="w-8 h-8 mb-2 opacity-80" />
                        )}
                        <span className="font-bold text-sm">{req.status}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
