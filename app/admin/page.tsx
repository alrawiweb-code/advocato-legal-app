"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { FileCheck, Search, Filter, ArrowRight, Clock, AlertCircle } from "lucide-react";

export default function AdminAdmissionsQueue() {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/verification?status=${filter}`);
      const data = await res.json();
      if (data.applications) {
        setApplications(data.applications);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string, app?: any) => {
    // 1. Rejected always displays as Rejected (never overridden by old suspension data)
    if (status === "REJECTED" || app?.lawyer_profile?.verification_status === "REJECTED") {
      return (
        <span className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs font-semibold">
          Rejected
        </span>
      );
    }

    // 2. Reopened and awaiting resubmission
    if (status === "DOCUMENTS_REQUIRED" || app?.lawyer_profile?.verification_status === "DOCUMENTS_REQUIRED") {
      return (
        <span className="px-2 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded text-xs font-semibold inline-flex items-center gap-1">
          <Clock className="w-3 h-3 text-sky-600" />
          Awaiting Resubmission
        </span>
      );
    }

    const isSuspended =
      status === "SUSPENDED" ||
      app?.lawyer_profile?.verification_status === "SUSPENDED";

    if (isSuspended && (status === "UNDER_REVIEW" || status === "PENDING" || status === "SUBMITTED")) {
      return (
        <span className="px-2 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded text-xs font-semibold inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
          Pending Re-Verification
        </span>
      );
    }

    if (isSuspended && status !== "APPROVED") {
      return <span className="px-2 py-1 bg-orange-50 text-orange-800 border border-orange-300 rounded text-xs font-semibold">Suspended</span>;
    }

    switch (status) {
      case "SUBMITTED":
      case "PENDING":
      case "UNDER_REVIEW":
        return <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-semibold">Under Review</span>;
      case "APPROVED":
      case "VERIFIED":
        return <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold">Verified</span>;
      case "SUSPENDED":
        return <span className="px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded text-xs font-semibold">Suspended</span>;
      case "REJECTED":
        return <span className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded text-xs font-semibold">Rejected</span>;
      case "DOCUMENTS_REQUIRED":
        return (
          <span className="px-2 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded text-xs font-semibold inline-flex items-center gap-1">
            <Clock className="w-3 h-3 text-sky-600" />
            Awaiting Resubmission
          </span>
        );
      default:
        return <span className="px-2 py-1 bg-gray-50 text-gray-700 border border-gray-200 rounded text-xs font-semibold">{status}</span>;
    }
  };

  return (
    <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            <FileCheck className="w-8 h-8 text-brass" />
            Admissions Queue
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Review pending attorney verification applications and compliance documents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search by name or bar #"
              className="pl-9 pr-4 py-2 bg-surface border border-hairline rounded-lg text-sm focus:border-brass focus:ring-1 focus:ring-brass outline-none"
            />
          </div>
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2 bg-surface border border-hairline rounded-lg text-sm font-semibold focus:border-brass focus:ring-1 focus:ring-brass outline-none cursor-pointer"
            >
              <option value="ALL">All Applications</option>
              <option value="PENDING">Pending Review</option>
              <option value="DOCUMENTS_REQUIRED">Awaiting Resubmission</option>
              <option value="REVERIFICATION">Pending Re-Verification</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brass" />
          </div>
        </div>
      </div>

      <div className="bg-surface border border-hairline rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-on-surface-variant flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-brass/30 border-t-brass rounded-full animate-spin mb-4" />
            <p className="font-semibold text-sm">Loading Admissions Queue...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <FileCheck className="w-12 h-12 mx-auto text-on-surface-variant/50 mb-3" />
            <p className="font-semibold text-primary">No applications found</p>
            <p className="text-sm mt-1">The admissions queue is currently empty.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-lowest border-b border-hairline text-xs uppercase text-on-surface-variant">
                <tr>
                  <th className="px-6 py-4 font-semibold">Applicant</th>
                  <th className="px-6 py-4 font-semibold">Bar Number</th>
                  <th className="px-6 py-4 font-semibold">Jurisdiction</th>
                  <th className="px-6 py-4 font-semibold">Submitted</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-brass font-bold border border-hairline">
                          {app.lawyer_profile?.full_name?.charAt(0) || "A"}
                        </div>
                        <div>
                          <div className="font-semibold text-primary">{app.lawyer_profile?.full_name}</div>
                          <div className="text-xs text-on-surface-variant">{app.lawyer_profile?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{app.bar_number}</td>
                    <td className="px-6 py-4">{app.state_bar}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-on-surface-variant">
                        <Clock className="w-3.5 h-3.5" />
                        {app.submitted_at ? format(new Date(app.submitted_at), "MMM d, yyyy") : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(app.status, app)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/admissions/${app.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-container-low hover:bg-brass hover:text-white text-primary text-xs font-semibold transition-all border border-hairline hover:border-brass"
                      >
                        Review
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
