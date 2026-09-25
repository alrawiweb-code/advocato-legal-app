"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";

interface LawyerRosterItem {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  bar_number: string;
  state_bar: string;
  practice_areas: string[];
  hourly_rate: number;
  is_verified: boolean;
  verification_status: string;
  suspension_reason: string | null;
  suspended_at: string | null;
  created_at: string;
}

type FilterType = "ALL" | "VERIFIED" | "SUSPENDED" | "UNVERIFIED";

interface ConfirmationModal {
  type: "suspend" | "reactivate";
  lawyer: LawyerRosterItem;
}

export default function AdminLawyersPage() {
  const [lawyers, setLawyers] = useState<LawyerRosterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterType>("ALL");
  const [modal, setModal] = useState<ConfirmationModal | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const supabase = createClient();

  async function loadLawyers() {
    setIsLoading(true);
    try {
      // Step 1: Fetch all lawyer_profiles
      const { data: lpData, error: lpError } = await supabase
        .from("lawyer_profiles")
        .select(
          "id, bar_number, state_bar, practice_areas, hourly_rate, is_verified, verification_status, suspension_reason, suspended_at, created_at"
        )
        .order("created_at", { ascending: false });

      if (lpError) {
        console.error("Error loading lawyer_profiles:", lpError);
        setIsLoading(false);
        return;
      }

      if (!lpData || lpData.length === 0) {
        setLawyers([]);
        setIsLoading(false);
        return;
      }

      // Step 2: Fetch matching profiles
      const ids = lpData.map((lp: any) => lp.id);
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", ids);

      if (profileError) {
        console.error("Error loading profiles:", profileError);
      }

      // Step 3: Merge
      const profileMap: Record<string, any> = {};
      (profileData || []).forEach((p: any) => {
        profileMap[p.id] = p;
      });

      const mapped: LawyerRosterItem[] = lpData.map((d: any) => {
        const profile = profileMap[d.id] || {};
        return {
          id: d.id,
          name: profile.full_name || "Advocate",
          email: profile.email || "",
          avatar_url: profile.avatar_url || null,
          bar_number: d.bar_number || "Not set",
          state_bar: d.state_bar || "Delhi (DL)",
          practice_areas: d.practice_areas || [],
          hourly_rate: d.hourly_rate || 2500,
          is_verified: Boolean(d.is_verified),
          verification_status:
            d.verification_status || (d.is_verified ? "VERIFIED" : "NOT_VERIFIED"),
          suspension_reason: d.suspension_reason || null,
          suspended_at: d.suspended_at || null,
          created_at: d.created_at,
        };
      });
      setLawyers(mapped);
    } catch (e) {
      console.error("Error loading lawyer roster:", e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadLawyers();
  }, []);

  const filtered = lawyers.filter((l) => {
    if (filterStatus === "VERIFIED" && l.verification_status !== "VERIFIED") return false;
    if (filterStatus === "SUSPENDED" && l.verification_status !== "SUSPENDED") return false;
    if (filterStatus === "UNVERIFIED" && l.verification_status === "VERIFIED") return false;
    if (filterStatus === "UNVERIFIED" && l.verification_status === "SUSPENDED") return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.bar_number.toLowerCase().includes(q) ||
      l.state_bar.toLowerCase().includes(q)
    );
  });

  const openSuspend = (lawyer: LawyerRosterItem) => {
    setModal({ type: "suspend", lawyer });
    setReason("");
    setActionError(null);
  };

  const openReactivate = (lawyer: LawyerRosterItem) => {
    setModal({ type: "reactivate", lawyer });
    setReason("");
    setActionError(null);
  };

  const closeModal = () => {
    setModal(null);
    setReason("");
    setActionError(null);
  };

  const handleConfirm = async () => {
    if (!modal) return;
    if (!reason.trim()) {
      setActionError("A reason is required before proceeding.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const endpoint =
        modal.type === "suspend"
          ? `/api/admin/lawyers/${modal.lawyer.id}/suspend`
          : `/api/admin/lawyers/${modal.lawyer.id}/reactivate`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setActionError(data.error || "Operation failed. Please try again.");
        return;
      }

      // Success — close modal and reload
      closeModal();
      await loadLawyers();
    } catch (e: any) {
      setActionError(e.message || "Unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (lawyer: LawyerRosterItem) => {
    switch (lawyer.verification_status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-emerald-50 text-emerald-800 border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Verified
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-orange-50 text-orange-800 border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
            Suspended
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-rose-50 text-rose-800 border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-amber-50 text-amber-800 border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            {lawyer.verification_status || "Unverified"}
          </span>
        );
    }
  };

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "ALL", label: "All Attorneys" },
    { key: "VERIFIED", label: "Verified" },
    { key: "SUSPENDED", label: "Suspended" },
    { key: "UNVERIFIED", label: "Other" },
  ];

  return (
    <div className="flex-1 flex flex-col bg-surface p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-[1280px] mx-auto space-y-8">
        {/* Masthead */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-hairline">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-container-low border border-hairline text-xs font-semibold text-primary mb-2">
              <Users className="w-3.5 h-3.5 text-brass" />
              <span>Attorney Directory Roster</span>
            </div>
            <h1 className="font-headline text-2xl sm:text-3xl font-bold text-primary tracking-tight">
              Manage Enrolled Lawyers
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Oversee attorney marketplace status, bar enrollment, and administrative controls.
            </p>
          </div>

          <button
            onClick={() => loadLawyers()}
            className="self-start sm:self-auto border border-hairline hover:bg-surface-container-low text-primary text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brass ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Roster</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-hairline flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === key
                    ? key === "SUSPENDED"
                      ? "bg-orange-600 text-white shadow-2xs"
                      : "bg-primary text-white shadow-2xs"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                {label}
                {key === "SUSPENDED" && lawyers.filter(l => l.verification_status === "SUSPENDED").length > 0 && (
                  <span className="ml-1.5 bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {lawyers.filter(l => l.verification_status === "SUSPENDED").length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, email, bar no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-hairline rounded-lg pl-9 pr-3.5 py-2 text-xs text-primary focus:border-slate focus:outline-none"
            />
          </div>
        </div>

        {/* Lawyers Table */}
        <div className="bg-surface-container-lowest rounded-2xl border border-hairline shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 text-brass animate-spin mb-3" />
              <p className="text-xs text-on-surface-variant">Loading attorney roster...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center max-w-md mx-auto p-4">
              <Users className="w-12 h-12 text-on-surface-variant mx-auto mb-3 opacity-40" />
              <h3 className="font-headline text-base font-bold text-primary mb-1">No Attorneys Found</h3>
              <p className="text-xs text-on-surface-variant">
                No lawyers matched your search query or status filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-hairline bg-surface-container-low/40 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    <th className="py-3.5 px-4 sm:px-6">Attorney Name & Email</th>
                    <th className="py-3.5 px-4">State Bar</th>
                    <th className="py-3.5 px-4">Bar No.</th>
                    <th className="py-3.5 px-4">Rate</th>
                    <th className="py-3.5 px-4">Marketplace Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filtered.map((lawyer) => (
                    <tr
                      key={lawyer.id}
                      className={`hover:bg-surface-container-low/30 transition-colors ${
                        lawyer.verification_status === "SUSPENDED" ? "bg-orange-50/30" : ""
                      }`}
                    >
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-headline font-bold text-sm text-primary">{lawyer.name}</div>
                        <div className="text-[11px] text-on-surface-variant font-mono">{lawyer.email}</div>
                        {lawyer.verification_status === "SUSPENDED" && lawyer.suspension_reason && (
                          <div className="mt-1 text-[10px] text-orange-700 bg-orange-50 border border-orange-200 rounded px-2 py-0.5 max-w-[220px] truncate">
                            ⚠ {lawyer.suspension_reason}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-semibold text-primary">{lawyer.state_bar}</span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-mono text-brass font-bold bg-brass/10 px-2 py-0.5 rounded">
                          {lawyer.bar_number}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-semibold text-primary">
                        ₹{lawyer.hourly_rate.toLocaleString("en-IN")}/hr
                      </td>

                      <td className="py-4 px-4">{getStatusBadge(lawyer)}</td>

                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {/* SUSPEND BUTTON — Only for VERIFIED lawyers */}
                          {lawyer.verification_status === "VERIFIED" && (
                            <button
                              onClick={() => openSuspend(lawyer)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
                            >
                              <ShieldOff className="w-3 h-3" />
                              Suspend
                            </button>
                          )}

                          {/* REACTIVATE BUTTON — Only for SUSPENDED lawyers */}
                          {lawyer.verification_status === "SUSPENDED" && (
                            <button
                              onClick={() => openReactivate(lawyer)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              Reactivate
                            </button>
                          )}

                          {/* UNVERIFIED — direct to admissions queue */}
                          {lawyer.verification_status !== "VERIFIED" &&
                            lawyer.verification_status !== "SUSPENDED" && (
                              <Link
                                href="/admin"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                              >
                                <ShieldAlert className="w-3 h-3" />
                                Review Queue
                              </Link>
                            )}

                          <Link
                            href={`/lawyers/${lawyer.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-hairline text-primary hover:bg-surface-container-low transition-colors shadow-2xs"
                          >
                            <span>Profile</span>
                            <ExternalLink className="w-3 h-3 text-brass" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* Confirmation Modal — Suspend / Reactivate                     */}
      {/* ============================================================ */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-hairline rounded-2xl shadow-editorial w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div
              className={`px-6 py-5 border-b border-hairline flex items-start justify-between gap-4 rounded-t-2xl ${
                modal.type === "suspend" ? "bg-orange-50" : "bg-emerald-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {modal.type === "suspend" ? (
                  <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center">
                    <ShieldOff className="w-5 h-5 text-orange-700" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  </div>
                )}
                <div>
                  <h3 className="font-headline font-bold text-primary text-sm">
                    {modal.type === "suspend" ? "Suspend Lawyer" : "Reactivate Lawyer"}
                  </h3>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    {modal.lawyer.name} • {modal.lawyer.bar_number}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-7 h-7 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Context warning */}
              <div
                className={`p-3.5 rounded-xl text-xs leading-relaxed border ${
                  modal.type === "suspend"
                    ? "bg-orange-50 border-orange-200 text-orange-800"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                }`}
              >
                {modal.type === "suspend" ? (
                  <>
                    <strong>⚠ Warning:</strong> This will immediately remove{" "}
                    <strong>{modal.lawyer.name}</strong> from the active Advocato marketplace.
                    They will no longer appear in search results, directory listings, or
                    AI-powered lawyer matching. Existing client matters will not be deleted.
                  </>
                ) : (
                  <>
                    <strong>✓ Reactivation:</strong> This will restore{" "}
                    <strong>{modal.lawyer.name}</strong> to active marketplace status. They will
                    immediately become discoverable again in search, directory, and AI matching.
                  </>
                )}
              </div>

              {/* New Status display */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-semibold">Status transition:</span>
                <div className="flex items-center gap-2 font-mono">
                  <span
                    className={`px-2 py-0.5 rounded font-bold border ${
                      modal.type === "suspend"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-orange-50 text-orange-700 border-orange-200"
                    }`}
                  >
                    {modal.type === "suspend" ? "VERIFIED" : "SUSPENDED"}
                  </span>
                  <span className="text-brass">→</span>
                  <span
                    className={`px-2 py-0.5 rounded font-bold border ${
                      modal.type === "suspend"
                        ? "bg-orange-50 text-orange-700 border-orange-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {modal.type === "suspend" ? "SUSPENDED" : "VERIFIED"}
                  </span>
                </div>
              </div>

              {/* Reason field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary block">
                  {modal.type === "suspend" ? "Suspension Reason" : "Reactivation Note"}
                  <span className="text-rose-500 ml-0.5">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    modal.type === "suspend"
                      ? "e.g. Pending disciplinary investigation by Bar Council. Access suspended pending outcome."
                      : "e.g. Disciplinary investigation concluded. Lawyer cleared and reinstated."
                  }
                  className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:ring-2 resize-none ${
                    modal.type === "suspend"
                      ? "border-orange-200 bg-orange-50/50 focus:ring-orange-300 focus:border-orange-400"
                      : "border-emerald-200 bg-emerald-50/50 focus:ring-emerald-300 focus:border-emerald-400"
                  } text-primary`}
                />
                <p className="text-[10px] text-on-surface-variant">
                  This reason will be shown to the lawyer on their dashboard and recorded in the audit ledger.
                </p>
              </div>

              {/* Error */}
              {actionError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {actionError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-hairline flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting || !reason.trim()}
                className={`px-6 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50 flex items-center gap-2 transition-colors ${
                  modal.type === "suspend"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isSubmitting ? (
                  <span>Processing...</span>
                ) : modal.type === "suspend" ? (
                  <>
                    <ShieldOff className="w-3.5 h-3.5" />
                    Confirm Suspension
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirm Reactivation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
