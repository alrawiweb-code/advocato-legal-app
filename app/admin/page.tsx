"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck,
  ShieldCheck,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  FolderOpen,
  Filter,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import {
  getAdminApplications,
  getAdminPlatformMetrics,
  LawyerApplicationRecord,
} from "@/lib/supabase/verification";
import { ApplicationReviewModal } from "@/components/admin/ApplicationReviewModal";

export default function AdminAdmissionsQueuePage() {
  const [applications, setApplications] = useState<LawyerApplicationRecord[]>([]);
  const [metrics, setMetrics] = useState({
    pendingApplications: 0,
    verifiedLawyers: 0,
    rejectedApplications: 0,
    totalMatters: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Review modal state
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  async function loadData() {
    setIsLoading(true);
    try {
      const [apps, m] = await Promise.all([
        getAdminApplications(statusFilter === "ALL" ? undefined : statusFilter),
        getAdminPlatformMetrics(),
      ]);
      setApplications(apps);
      setMetrics(m);
    } catch (err) {
      console.error("Error loading admissions queue:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const filteredApplications = applications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = app.lawyer_profile?.full_name?.toLowerCase() || "";
    const email = app.lawyer_profile?.email?.toLowerCase() || "";
    const bar = app.bar_number?.toLowerCase() || "";
    const state = app.state_bar?.toLowerCase() || "";
    return name.includes(q) || email.includes(q) || bar.includes(q) || state.includes(q);
  });

  const handleOpenReview = (appId: string) => {
    setSelectedAppId(appId);
    setIsReviewModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col bg-surface p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-[1360px] mx-auto space-y-8">
        {/* Page Title & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-hairline">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-container-low border border-hairline text-xs font-semibold text-primary mb-2">
              <FileCheck className="w-3.5 h-3.5 text-brass" />
              <span>Admissions Verification Queue</span>
            </div>
            <h1 className="font-headline text-2xl sm:text-3xl font-bold text-primary tracking-tight">
              Lawyer Credentials Review
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Verify advocate bar enrollment certificates, government identities, and authorize roster admission.
            </p>
          </div>

          <button
            onClick={() => loadData()}
            className="self-start sm:self-auto border border-hairline hover:bg-surface-container-low text-primary text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brass ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-hairline shadow-xs">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Review</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="font-headline text-2xl sm:text-3xl font-bold text-amber-600">
              {metrics.pendingApplications}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">Awaiting admissions verification</p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-xl border border-hairline shadow-xs">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Verified Attorneys</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="font-headline text-2xl sm:text-3xl font-bold text-primary">
              {metrics.verifiedLawyers}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">Active on public lawyer marketplace</p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-xl border border-hairline shadow-xs">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Rejected / Revision</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="font-headline text-2xl sm:text-3xl font-bold text-primary">
              {metrics.rejectedApplications}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">Returned for document changes</p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-xl border border-hairline shadow-xs">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Platform Matters</span>
              <FolderOpen className="w-4 h-4 text-slate" />
            </div>
            <div className="font-headline text-2xl sm:text-3xl font-bold text-primary">
              {metrics.totalMatters}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">Total client legal matters created</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-hairline flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            {[
              { id: "ALL", label: "All Submissions" },
              { id: "PENDING", label: "Pending Review" },
              { id: "APPROVED", label: "Approved" },
              { id: "REJECTED", label: "Rejected" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === tab.id
                    ? "bg-primary text-white shadow-2xs"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, bar no, state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-hairline rounded-lg pl-9 pr-3.5 py-2 text-xs text-primary focus:border-slate focus:outline-none"
            />
          </div>
        </div>

        {/* Applications Queue Table */}
        <div className="bg-surface-container-lowest rounded-2xl border border-hairline shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 text-brass animate-spin mb-3" />
              <p className="text-xs text-on-surface-variant">Loading verification dossier queue...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="py-16 text-center max-w-md mx-auto p-4">
              <div className="w-12 h-12 rounded-xl bg-surface-container-low border border-hairline flex items-center justify-center text-brass mx-auto mb-3">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="font-headline text-base font-bold text-primary mb-1">
                No Applications Found
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {statusFilter !== "ALL"
                  ? `There are currently no verification applications matching status "${statusFilter}".`
                  : "No lawyer verification dossiers have been submitted yet. Newly registered attorneys will appear here when they submit their Bar credentials."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-hairline bg-surface-container-low/40 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    <th className="py-3.5 px-4 sm:px-6">Attorney</th>
                    <th className="py-3.5 px-4">State Bar &amp; Number</th>
                    <th className="py-3.5 px-4">Practice &amp; Exp</th>
                    <th className="py-3.5 px-4">Documents</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredApplications.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-surface-container-low/30 transition-colors"
                    >
                      {/* Attorney */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-headline font-bold text-sm text-primary">
                          {app.lawyer_profile?.full_name || "Counsel"}
                        </div>
                        <div className="text-[11px] text-on-surface-variant font-mono">
                          {app.lawyer_profile?.email}
                        </div>
                      </td>

                      {/* Bar Info */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-primary">{app.state_bar || "Unspecified"}</div>
                        <div className="text-[11px] font-mono text-brass font-bold">
                          {app.bar_number || "Bar No. Pending"}
                        </div>
                      </td>

                      {/* Practice */}
                      <td className="py-4 px-4">
                        <div className="text-primary truncate max-w-[180px]">
                          {app.lawyer_profile?.practice_areas?.[0] || "General Practice"}
                        </div>
                        <div className="text-[11px] text-on-surface-variant">
                          {app.years_experience || 5} Years Experience
                        </div>
                      </td>

                      {/* Documents */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container-low border border-hairline font-semibold text-[11px] text-primary">
                          <FileText className="w-3 h-3 text-brass" />
                          <span>{app.documents?.length || 0} Files</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            app.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : app.status === "REJECTED"
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              app.status === "APPROVED"
                                ? "bg-emerald-600"
                                : app.status === "REJECTED"
                                ? "bg-rose-600"
                                : "bg-amber-600 animate-pulse"
                            }`}
                          />
                          {app.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <button
                          onClick={() => handleOpenReview(app.id)}
                          className="inline-flex items-center gap-1.5 bg-surface hover:bg-surface-container-low border border-hairline text-primary font-semibold text-xs px-3.5 py-1.5 rounded-lg transition-colors shadow-2xs"
                        >
                          <span>Review Dossier</span>
                          <ChevronRight className="w-3.5 h-3.5 text-brass" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ApplicationReviewModal
        applicationId={selectedAppId}
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedAppId(null);
        }}
        onUpdated={loadData}
      />
    </div>
  );
}
