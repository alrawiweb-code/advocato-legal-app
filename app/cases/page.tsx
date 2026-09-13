"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FolderOpen, ArrowRight, ShieldCheck, Clock, Plus, Scale, RefreshCw, UserCheck } from "lucide-react";
import { getStoredConsultations } from "@/lib/data/consultations";
import { Consultation } from "@/types";
import { useUserRole } from "@/lib/context/RoleContext";
import { createClient } from "@/lib/supabase/client";

export default function CasesPage() {
  const { role, activeLawyer, currentUser } = useUserRole();
  const [matters, setMatters] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMatters() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data: dbMatters, error } = await supabase
          .from("matters")
          .select("*, lawyer:lawyer_profiles(*)")
          .order("created_at", { ascending: false });

        if (!error && dbMatters && dbMatters.length > 0) {
          // Transform Supabase records to Consultation format
          const mapped: Consultation[] = dbMatters.map((m: any) => ({
            id: m.id,
            lawyer: {
              id: m.lawyer?.id || m.lawyer_id,
              name: m.lawyer?.full_name || "Assigned Counsel",
              title: m.lawyer?.headline || `${m.category} Attorney`,
              avatar: m.lawyer?.avatar_url || "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=400",
              rating: 5.0,
              reviewCount: 0,
              hourlyRate: m.lawyer?.hourly_rate_usd || 3500,
              isVerified: true,
              availability: "Available today",
              yearsExperience: m.lawyer?.years_experience || 10,
              jurisdiction: m.jurisdiction || "Bar Council Licensed",
              tags: [m.category],
              practiceAreas: [m.category],
              bio: m.lawyer?.bio || "Licensed counsel managing active matter.",
              notableCases: [],
            },
            status: m.status || "active",
            caseTitle: m.case_title,
            matterNumber: m.matter_number,
            clientName: currentUser.name,
            lastActive: "online",
            messages: [],
          }));
          const filtered = (role === "lawyer" && activeLawyer)
            ? mapped.filter((m) => m.lawyer.id === activeLawyer.id)
            : mapped;
          setMatters(filtered);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Supabase matters load fallback:", err);
      }

      // Fallback to local stored consultations
      const local = getStoredConsultations();
      const filteredLocal = (role === "lawyer" && activeLawyer)
        ? local.filter((m) => m.lawyer.id === activeLawyer.id)
        : local;
      setMatters(filteredLocal);
      setIsLoading(false);
    }

    loadMatters();
  }, [currentUser.name, role, activeLawyer]);

  return (
    <div className="flex-1 flex flex-col bg-background min-h-[calc(100dvh-4rem)]">
      <div className="max-w-[1240px] w-full mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 pb-24 md:pb-12">
        {/* Header */}
        <div className="pb-6 border-b border-hairline mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-container-low border border-hairline text-xs font-semibold text-primary mb-2">
              <FolderOpen className="w-3.5 h-3.5 text-brass" />
              <span>{role === "lawyer" ? "Attorney Dashboard" : "My Cases"}</span>
            </div>
            <h1 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
              {role === "lawyer" ? "Client Cases" : "My Cases"}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              {role === "lawyer"
                ? "Review client submissions, schedule calls, and message your clients directly."
                : "Track your ongoing cases, consult with your lawyer, and view shared documents."}
            </p>
          </div>

          {role === "lawyer" ? (
            <Link
              href={activeLawyer ? `/lawyers/${activeLawyer.id}` : "/lawyer/register"}
              className="bg-brass hover:bg-brass-hover text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5 self-start sm:self-auto transition-colors min-h-[44px]"
            >
              <UserCheck className="w-4 h-4" />
              <span>{activeLawyer ? "View Public Profile" : "Register Profile"}</span>
            </Link>
          ) : (
            <Link
              href="/intake"
              className="bg-brass hover:bg-brass-hover text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5 self-start sm:self-auto transition-colors min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Case</span>
            </Link>
          )}
        </div>

        {/* Matters List or Zero-State */}
        {isLoading ? (
          <div className="py-16 text-center text-xs text-on-surface-variant">
            Loading your cases...
          </div>
        ) : matters.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-hairline p-8 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center max-w-xl mx-auto my-6 sm:my-10">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-low border border-hairline flex items-center justify-center text-brass mb-4 shadow-2xs">
              <Scale className="w-7 h-7" />
            </div>
            <h2 className="font-headline text-lg sm:text-xl font-semibold text-primary mb-2">
              {role === "lawyer" ? "No Client Cases Yet" : "No Active Cases Yet"}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6 max-w-md">
              {role === "lawyer"
                ? "You don't have any client cases right now. When a client submits an intake matching your practice area or messages you, their case will appear here."
                : "Tell us what happened to get connected with a verified lawyer licensed in your state."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {role === "lawyer" ? (
                <Link
                  href={activeLawyer ? `/lawyers/${activeLawyer.id}` : "/profile"}
                  className="bg-primary hover:bg-slate-dark text-white font-semibold text-xs px-6 py-3 rounded-lg flex items-center justify-center gap-2 shadow-sm hover:shadow-md btn-editorial min-h-[44px]"
                >
                  <UserCheck className="w-4 h-4 text-brass" />
                  <span>View My Profile &amp; Practice Details</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/intake"
                    className="bg-primary hover:bg-slate-dark text-white font-semibold text-xs px-6 py-3 rounded-lg flex items-center justify-center gap-2 shadow-sm hover:shadow-md btn-editorial min-h-[44px]"
                  >
                    <span>Tell Us What Happened</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/lawyers"
                    className="border border-hairline hover:bg-surface-container text-primary font-semibold text-xs px-6 py-3 rounded-lg flex items-center justify-center btn-editorial-secondary min-h-[44px]"
                  >
                    <span>Browse All Lawyers</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {matters.map((matter) => (
              <div
                key={matter.id}
                className="bg-surface-container-lowest rounded-2xl border border-hairline p-5 sm:p-6 md:p-7 shadow-xs hover:shadow-editorial transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b border-hairline">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border border-hairline shrink-0 flex items-center justify-center bg-primary/10">
                      {role === "lawyer" ? (
                        <span className="text-base font-bold text-primary">
                          {(matter.clientName || "CL").slice(0, 2).toUpperCase()}
                        </span>
                      ) : (
                        <img
                          src={matter.lawyer.avatar}
                          alt={matter.lawyer.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="font-headline text-base md:text-xl font-semibold text-primary">{matter.caseTitle}</h2>
                        <span className="text-[10px] md:text-xs font-semibold text-brass bg-brass/10 px-2.5 py-0.5 rounded-md font-mono">
                          {matter.matterNumber}
                        </span>
                        {matter.opposingParty && (
                          <span className="text-[10px] md:text-xs font-medium text-on-surface-variant bg-surface-container-low border border-hairline px-2 py-0.5 rounded">
                            v. {matter.opposingParty}
                          </span>
                        )}
                        {matter.appointmentDate && (
                          <span className="text-[10px] md:text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            {matter.appointmentDate}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs md:text-sm text-on-surface-variant mt-1.5 flex-wrap">
                        {role === "lawyer" ? (
                          <span>Client: <strong className="text-primary">{matter.clientName || "Client"}</strong></span>
                        ) : (
                          <>
                            <span>Assigned Counsel: <strong className="text-primary">{matter.lawyer.name}</strong></span>
                            <span className="text-hairline hidden sm:inline">•</span>
                            <span className="text-slate font-medium">{matter.lawyer.title}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold self-start md:self-center shrink-0 border border-emerald-200/60">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span>Active Case</span>
                  </div>
                </div>

                {/* Status and Action bar */}
                <div className="pt-4 md:pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs md:text-sm">
                  <div className="flex items-center gap-5 text-on-surface-variant flex-wrap">
                    <span className="flex items-center gap-1.5 font-medium text-primary">
                      <ShieldCheck className="w-4 h-4 text-brass" /> 100% Private &amp; Confidential
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate" /> {matter.messages?.length || 0} message{(matter.messages?.length || 0) === 1 ? "" : "s"}
                    </span>
                  </div>

                  <Link
                    href={`/messages?id=${matter.id}`}
                    className="bg-primary hover:bg-slate-dark text-white font-semibold px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-sm hover:shadow-md btn-editorial min-h-[42px]"
                  >
                    <span>Open Case Chat</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
