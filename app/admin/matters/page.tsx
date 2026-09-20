"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Search,
  RefreshCw,
  Scale,
  Calendar,
  MessageSquare,
  Clock,
  User,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AdminMatterItem {
  id: string;
  matter_number: string;
  case_title: string;
  category: string;
  status: string;
  created_at: string;
  client?: {
    full_name: string;
    email: string;
  };
  lawyer?: {
    full_name: string;
    email: string;
    jurisdiction?: string;
  };
}

export default function AdminMattersPage() {
  const [matters, setMatters] = useState<AdminMatterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = createClient();

  async function loadMatters() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("matters")
        .select(`
          id,
          matter_number,
          case_title,
          category,
          status,
          created_at,
          client:client_id(full_name, email),
          lawyer:lawyer_id(full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setMatters(data as any);
      }
    } catch (e) {
      console.error("Error loading matters:", e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMatters();
  }, []);

  const filtered = matters.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = m.case_title?.toLowerCase() || "";
    const num = m.matter_number?.toLowerCase() || "";
    const cat = m.category?.toLowerCase() || "";
    const client = m.client?.full_name?.toLowerCase() || "";
    const lawyer = m.lawyer?.full_name?.toLowerCase() || "";
    return title.includes(q) || num.includes(q) || cat.includes(q) || client.includes(q) || lawyer.includes(q);
  });

  return (
    <div className="flex-1 flex flex-col bg-surface p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-[1360px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-hairline">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-container-low border border-hairline text-xs font-semibold text-primary mb-2">
              <FolderOpen className="w-3.5 h-3.5 text-brass" />
              <span>Platform Legal Matters</span>
            </div>
            <h1 className="font-headline text-2xl sm:text-3xl font-bold text-primary tracking-tight">
              Case Dockets &amp; Client Inquiries
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Real-time oversight of all client legal situations, assigned attorneys, and consultation progress.
            </p>
          </div>

          <button
            onClick={() => loadMatters()}
            className="self-start sm:self-auto border border-hairline hover:bg-surface-container-low text-primary text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brass ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Matters</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-hairline flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by case title, matter no, client, or attorney..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-hairline rounded-lg pl-9 pr-3.5 py-2 text-xs text-primary focus:border-slate focus:outline-none"
            />
          </div>
          <div className="text-xs text-on-surface-variant font-medium">
            Total Matters: <span className="font-bold text-primary">{matters.length}</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface-container-lowest rounded-2xl border border-hairline shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 text-brass animate-spin mb-3" />
              <p className="text-xs text-on-surface-variant">Loading platform case dockets...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center max-w-md mx-auto p-4">
              <FolderOpen className="w-12 h-12 text-on-surface-variant mx-auto mb-3 opacity-40" />
              <h3 className="font-headline text-base font-bold text-primary mb-1">
                No Legal Matters Found
              </h3>
              <p className="text-xs text-on-surface-variant">
                No active case records matched your filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-hairline bg-surface-container-low/40 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    <th className="py-3.5 px-4 sm:px-6">Matter &amp; Topic</th>
                    <th className="py-3.5 px-4">Client</th>
                    <th className="py-3.5 px-4">Assigned Counsel</th>
                    <th className="py-3.5 px-4">Practice Category</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filtered.map((matter) => (
                    <tr key={matter.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-headline font-bold text-sm text-primary">
                          {matter.case_title}
                        </div>
                        <span className="font-mono text-[11px] text-brass font-bold bg-brass/10 px-1.5 py-0.2 rounded">
                          {matter.matter_number}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-primary">{matter.client?.full_name || "Client"}</div>
                        <div className="text-[11px] text-on-surface-variant font-mono">{matter.client?.email}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-primary">{matter.lawyer?.full_name || "Assigned Counsel"}</div>
                        <div className="text-[11px] text-on-surface-variant font-mono">{matter.lawyer?.email}</div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container-low border border-hairline text-primary font-medium text-[11px]">
                          {matter.category}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          {matter.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-right text-on-surface-variant font-mono text-[11px]">
                        {new Date(matter.created_at).toLocaleDateString()}
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
