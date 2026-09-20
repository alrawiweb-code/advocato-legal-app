"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  RefreshCw,
  Scale,
  CheckCircle2,
  XCircle,
  MoreVertical,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
  created_at: string;
}

export default function AdminLawyersPage() {
  const [lawyers, setLawyers] = useState<LawyerRosterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVerified, setFilterVerified] = useState<"ALL" | "VERIFIED" | "UNVERIFIED">("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const supabase = createClient();

  async function loadLawyers() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("lawyer_profiles")
        .select(`
          id,
          bar_number,
          state_bar,
          practice_areas,
          hourly_rate,
          is_verified,
          verification_status,
          created_at,
          profiles:id(full_name, email, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const mapped: LawyerRosterItem[] = data.map((d: any) => ({
          id: d.id,
          name: d.profiles?.full_name || "Advocate",
          email: d.profiles?.email || "",
          avatar_url: d.profiles?.avatar_url || null,
          bar_number: d.bar_number || "Not set",
          state_bar: d.state_bar || "Delhi (DL)",
          practice_areas: d.practice_areas || [],
          hourly_rate: d.hourly_rate || 2500,
          is_verified: Boolean(d.is_verified),
          verification_status: d.verification_status || (d.is_verified ? "VERIFIED" : "NOT_VERIFIED"),
          created_at: d.created_at,
        }));
        setLawyers(mapped);
      }
    } catch (e) {
      console.error("Error loading lawyer roster:", e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadLawyers();
  }, []);

  const handleToggleVerification = async (lawyer: LawyerRosterItem) => {
    setUpdatingId(lawyer.id);
    const newStatus = !lawyer.is_verified;
    try {
      const { error } = await supabase
        .from("lawyer_profiles")
        .update({
          is_verified: newStatus,
          verification_status: newStatus ? "VERIFIED" : "NOT_VERIFIED",
        })
        .eq("id", lawyer.id);

      if (!error) {
        setLawyers((prev) =>
          prev.map((l) =>
            l.id === lawyer.id
              ? {
                  ...l,
                  is_verified: newStatus,
                  verification_status: newStatus ? "VERIFIED" : "NOT_VERIFIED",
                }
              : l
          )
        );
      }
    } catch (e) {
      console.error("Toggle error:", e);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = lawyers.filter((l) => {
    if (filterVerified === "VERIFIED" && !l.is_verified) return false;
    if (filterVerified === "UNVERIFIED" && l.is_verified) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.bar_number.toLowerCase().includes(q) ||
      l.state_bar.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col bg-surface p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-[1360px] mx-auto space-y-8">
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
              Oversee attorney marketplace status, bar enrollment numbers, and manually toggle verified credentials.
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
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {(["ALL", "VERIFIED", "UNVERIFIED"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterVerified(status)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterVerified === status
                    ? "bg-primary text-white shadow-2xs"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                {status === "ALL" ? "All Attorneys" : status === "VERIFIED" ? "Verified" : "Unverified"}
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
              <h3 className="font-headline text-base font-bold text-primary mb-1">
                No Attorneys Found
              </h3>
              <p className="text-xs text-on-surface-variant">
                No lawyers matched your search query or status filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-hairline bg-surface-container-low/40 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    <th className="py-3.5 px-4 sm:px-6">Attorney Name &amp; Email</th>
                    <th className="py-3.5 px-4">State Bar Council</th>
                    <th className="py-3.5 px-4">Bar Reg. No</th>
                    <th className="py-3.5 px-4">Rate</th>
                    <th className="py-3.5 px-4">Verification Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filtered.map((lawyer) => (
                    <tr key={lawyer.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-headline font-bold text-sm text-primary">
                          {lawyer.name}
                        </div>
                        <div className="text-[11px] text-on-surface-variant font-mono">
                          {lawyer.email}
                        </div>
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

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            lawyer.is_verified
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              lawyer.is_verified ? "bg-emerald-600" : "bg-amber-600"
                            }`}
                          />
                          {lawyer.is_verified ? "Verified" : "Unverified"}
                        </span>
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-right space-x-2">
                        <button
                          onClick={() => handleToggleVerification(lawyer)}
                          disabled={updatingId === lawyer.id}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            lawyer.is_verified
                              ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {updatingId === lawyer.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : lawyer.is_verified ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          <span>{lawyer.is_verified ? "Revoke Verification" : "Verify Counsel"}</span>
                        </button>

                        <Link
                          href={`/lawyers/${lawyer.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-hairline text-primary hover:bg-surface-container-low transition-colors shadow-2xs"
                        >
                          <span>Profile</span>
                          <ExternalLink className="w-3 h-3 text-brass" />
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
    </div>
  );
}
