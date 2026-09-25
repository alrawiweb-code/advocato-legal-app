"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  MessageSquare,
  ShieldOff,
  XCircle,
  RefreshCw,
  ArrowRight,
  Search,
  Filter
} from "lucide-react";
import { SuspensionInquiry } from "@/lib/supabase/suspension-inquiry";

const STATUS_META: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Open", color: "text-amber-700 bg-amber-50 border-amber-200" },
  ADMIN_REPLIED: { label: "Admin Replied", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  LAWYER_REPLIED: { label: "Lawyer Replied", color: "text-blue-700 bg-blue-50 border-blue-200" },
  RESOLVED: { label: "Resolved", color: "text-slate-700 bg-slate-50 border-slate-200" },
  CLOSED: { label: "Closed", color: "text-slate-500 bg-slate-50 border-slate-200" },
};

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<SuspensionInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "SUSPENSION" | "REJECTION">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadInquiries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/inquiries?type=${typeFilter}&status=${statusFilter}`);
      const data = await res.json();
      if (res.ok) setInquiries(data.inquiries || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, [typeFilter, statusFilter]);

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 pb-16">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-surface-container-low border border-hairline text-[10px] font-bold uppercase tracking-widest text-brass mb-3">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Admin Communications</span>
        </div>
        <h1 className="font-headline text-2xl sm:text-3xl text-primary font-semibold tracking-tight">
          Suspension & Rejection Inquiries
        </h1>
        <p className="text-xs text-on-surface-variant mt-1.5 max-w-3xl">
          Direct communication channel for lawyers who have been suspended from the marketplace or whose verification applications have been rejected.
        </p>
      </div>

      <div className="bg-surface-container-lowest border border-hairline rounded-2xl overflow-hidden shadow-xs">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
            {["ALL", "OPEN", "LAWYER_REPLIED", "ADMIN_REPLIED", "RESOLVED", "CLOSED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition-colors ${
                  statusFilter === status
                    ? "bg-primary text-white border-primary"
                    : "bg-surface border-hairline text-on-surface-variant hover:text-primary"
                }`}
              >
                {status === "ALL" ? "All Inquiries" : status.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-surface border border-hairline rounded-lg text-[11px] font-semibold px-3 py-2 text-primary focus:outline-none focus:border-slate"
            >
              <option value="ALL">All Types</option>
              <option value="SUSPENSION">Suspensions Only</option>
              <option value="REJECTION">Rejections Only</option>
            </select>

            <button
              onClick={loadInquiries}
              disabled={isLoading}
              className="p-2 rounded-lg bg-surface-container border border-hairline hover:bg-surface-container-high text-primary transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-on-surface-variant">
              <RefreshCw className="w-6 h-6 animate-spin mb-3 text-brass" />
              <span className="text-xs font-semibold">Loading inquiries...</span>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-on-surface-variant">
              <MessageSquare className="w-10 h-10 mb-3 opacity-20" />
              <h3 className="font-headline font-semibold text-primary mb-1">No Inquiries Found</h3>
              <p className="text-xs">There are no inquiries matching the current filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-hairline">
              <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-surface-container-lowest text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                <div className="col-span-3">Lawyer</div>
                <div className="col-span-3">Inquiry Type / Status</div>
                <div className="col-span-4">Latest Message</div>
                <div className="col-span-2 text-right">Action</div>
              </div>

              {inquiries.map((inq) => (
                <div key={inq.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 md:px-6 py-4 items-center hover:bg-surface-container-low/30 transition-colors">
                  <div className="col-span-3 flex items-center gap-3">
                    <img
                      src={inq.lawyer_profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(inq.lawyer_profile?.full_name || 'Lawyer')}`}
                      alt=""
                      className="w-10 h-10 rounded-full border border-hairline object-cover"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-primary text-sm truncate">
                        {inq.lawyer_profile?.full_name || "Unknown Lawyer"}
                      </div>
                      <div className="text-[11px] text-on-surface-variant truncate">
                        {inq.lawyer_profile?.email || ""}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-3 flex flex-col items-start gap-1.5">
                    <div className="flex items-center gap-1.5">
                      {inq.inquiry_type === "SUSPENSION" ? (
                        <ShieldOff className="w-3.5 h-3.5 text-orange-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      )}
                      <span className="text-xs font-semibold text-primary">
                        {inq.inquiry_type === "SUSPENSION" ? "Suspension" : "Rejection"}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_META[inq.status]?.color || ""}`}>
                      {STATUS_META[inq.status]?.label || inq.status}
                    </span>
                  </div>

                  <div className="col-span-4 min-w-0">
                    {inq.messages && inq.messages.length > 0 ? (
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-[10px] font-bold text-slate uppercase">
                            {inq.messages[0].sender_role === "admin" ? "Admin" : "Lawyer"}
                          </span>
                          <span className="text-[10px] text-on-surface-variant">
                            {format(new Date(inq.messages[0].created_at), "MMM d, HH:mm")}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant truncate">
                          {inq.messages[0].message}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-on-surface-variant italic">No messages</span>
                    )}
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <Link
                      href={`/admin/inquiries/${inq.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-hairline rounded-lg text-xs font-semibold text-primary shadow-xs hover:bg-surface-container hover:border-slate/40 transition-all"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
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
