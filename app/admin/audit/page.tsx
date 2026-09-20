"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  ShieldCheck,
  XCircle,
  Clock,
  RefreshCw,
  Scale,
  FileCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AuditLogEntry {
  id: string;
  application_id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  previous_status: string | null;
  new_status: string | null;
  reason: string | null;
  created_at: string;
  actor_profile?: {
    full_name: string;
    email: string;
  };
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  async function loadAuditLogs() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("verification_audit_logs")
        .select(`
          *,
          actor:actor_id(full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!error && data) {
        const mapped = data.map((d: any) => ({
          ...d,
          actor_profile: d.actor || null,
        }));
        setLogs(mapped);
      }
    } catch (e) {
      console.error("Error loading audit logs:", e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAuditLogs();
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-surface p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-[1360px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-hairline">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-container-low border border-hairline text-xs font-semibold text-primary mb-2">
              <History className="w-3.5 h-3.5 text-brass" />
              <span>Regulatory Compliance Trail</span>
            </div>
            <h1 className="font-headline text-2xl sm:text-3xl font-bold text-primary tracking-tight">
              Admissions Audit Ledger
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Immutable ledger of all bar credential evaluations, review decisions, and authorization actions.
            </p>
          </div>

          <button
            onClick={() => loadAuditLogs()}
            className="self-start sm:self-auto border border-hairline hover:bg-surface-container-low text-primary text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brass ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>

        {/* Audit Log Table */}
        <div className="bg-surface-container-lowest rounded-2xl border border-hairline shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <RefreshCw className="w-8 h-8 text-brass animate-spin mb-3" />
              <p className="text-xs text-on-surface-variant">Querying compliance ledger...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center max-w-md mx-auto p-4">
              <History className="w-12 h-12 text-on-surface-variant mx-auto mb-3 opacity-40" />
              <h3 className="font-headline text-base font-bold text-primary mb-1">
                No Audit Records Yet
              </h3>
              <p className="text-xs text-on-surface-variant">
                When lawyer verification dossiers are submitted, approved, or rejected, entries will be recorded here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-hairline bg-surface-container-low/40 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    <th className="py-3.5 px-4 sm:px-6">Timestamp</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Actor</th>
                    <th className="py-3.5 px-4">Status Transition</th>
                    <th className="py-3.5 px-4 sm:px-6">Compliance Reason / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="py-4 px-4 sm:px-6 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-semibold text-primary">{log.action}</span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-primary">
                          {log.actor_profile?.full_name || log.actor_role}
                        </div>
                        <div className="text-[11px] text-on-surface-variant font-mono">
                          {log.actor_profile?.email}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono text-[11px]">
                        <span className="text-on-surface-variant">{log.previous_status || "N/A"}</span>
                        <span className="mx-1 text-brass">➔</span>
                        <span className="font-bold text-primary">{log.new_status}</span>
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-on-surface-variant max-w-md truncate">
                        {log.reason || "—"}
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
