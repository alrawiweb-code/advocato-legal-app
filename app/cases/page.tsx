"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FolderOpen, ArrowRight, ShieldCheck, Clock, Plus, Scale, RefreshCw, Lock } from "lucide-react";
import { getStoredConsultations } from "@/lib/data/consultations";
import { Consultation } from "@/types";
import { useUserRole, getInitialsAvatar } from "@/lib/context/RoleContext";
import { getUserMatters } from "@/lib/supabase/matters";
import { VerificationModal } from "@/components/lawyer/VerificationModal";

export default function CasesPage() {
  const { role, activeLawyer, currentUser } = useUserRole();
  const [matters, setMatters] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const isLawyerVerified = Boolean(activeLawyer?.isVerified ?? currentUser.isVerified);
  const verificationStatus = activeLawyer?.verificationStatus || currentUser.verificationStatus || "NOT_VERIFIED";

  useEffect(() => {
    async function loadMatters() {
      setIsLoading(true);
      try {
        const { matters: dbMatters, error } = await getUserMatters();

        if (!error && dbMatters && dbMatters.length > 0) {
          const mapped: Consultation[] = dbMatters.map((m) => {
            const isLawyerRole = role === "lawyer";
            const counselorName = m.lawyer?.full_name || "Assigned Counsel";
            return {
              id: m.id,
              lawyer: {
                id: m.lawyer?.id || m.lawyer_id,
                name: counselorName,
                title: `${m.category} Attorney`,
                avatar: m.lawyer?.avatar_url || getInitialsAvatar(counselorName),
                rating: 5.0,
                reviewCount: 1,
                hourlyRate: 2500,
                isVerified: true,
                availability: "Available today",
                yearsExperience: 5,
                jurisdiction: m.jurisdiction || "Delhi (DL)",
                tags: [m.category],
                practiceAreas: [m.category],
                bio: "Licensed counsel managing active matter.",
                notableCases: [],
              },
              status: (m.status as any) || "active",
              caseTitle: m.case_title,
              matterNumber: m.matter_number,
              clientName: m.client?.full_name || currentUser.name,
              lastActive: "Active today",
              messages: [],
            };
          });

          setMatters(mapped);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Supabase matters load notice:", err);
      }

      // Fallback to local stored consultations for legacy/offline state
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
      <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 pb-16">
        {/* Header */}
        <div className="pb-6 border-b border-hairline mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-container-low border border-hairline text-xs font-semibold text-primary mb-2">
              <FolderOpen className="w-3.5 h-3.5 text-brass" />
              <span>{role === "lawyer" ? "Attorney Dashboard" : "My Cases"}</span>
            </div>
            <h1 className="font-headline text-2xl sm:text-4xl text-primary font-semibold tracking-tight">
              {role === "lawyer" ? "Client Cases & Dockets" : "My Active Legal Matters"}
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 max-w-xl leading-relaxed">
              {role === "lawyer"
                ? "Manage your active representation matters, client privileged briefs, and hearing dates."
                : "Confidential case dockets with your assigned verified attorneys."}
            </p>
          </div>

          {role === "client" ? (
            <Link
              href="/intake"
              className="bg-brass hover:bg-brass-hover text-white text-xs font-semibold px-5 py-3 rounded-lg shadow-xs hover:shadow-md btn-editorial-brass flex items-center justify-center gap-2 self-start sm:self-auto min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Consultation</span>
            </Link>
          ) : (
            <Link
              href="/lawyers"
              className="border border-hairline hover:bg-surface-container text-primary text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 self-start sm:self-auto min-h-[44px]"
            >
              <Scale className="w-4 h-4 text-brass" />
              <span>Browse Legal Marketplace</span>
            </Link>
          )}
        </div>

        {/* Content */}
        {role === "lawyer" && !isLawyerVerified ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-hairline p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 mb-4 shadow-2xs">
              <Lock className="w-8 h-8" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-3">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Bar Verification Required</span>
            </div>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-primary mb-2">
              Privileged Case Dockets Locked
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
              Under Bar Council standards and attorney confidentiality compliance, access to client matters, litigation briefs, and privileged documents is restricted until your credentials are verified.
            </p>
            <button
              onClick={() => setShowVerificationModal(true)}
              className="bg-brass hover:bg-brass-hover text-white text-xs font-semibold px-6 py-3 rounded-lg inline-flex items-center gap-2 shadow-xs hover:shadow-md btn-editorial-brass"
            >
              <Lock className="w-4 h-4" />
              <span>
                {verificationStatus === "PENDING" || verificationStatus === "SUBMITTED"
                  ? "View Verification Status"
                  : "Apply for Verification / Onboarding"}
              </span>
            </button>
            <VerificationModal
              isOpen={showVerificationModal}
              onClose={() => setShowVerificationModal(false)}
            />
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20 text-on-surface-variant">
            <RefreshCw className="w-6 h-6 animate-spin text-brass mr-3" />
            <span className="text-sm font-medium">Loading confidential case dockets...</span>
          </div>
        ) : matters.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl border border-hairline p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-low border border-hairline flex items-center justify-center mx-auto text-brass mb-4 shadow-2xs">
              <FolderOpen className="w-7 h-7" />
            </div>
            <h2 className="font-headline text-lg sm:text-xl font-semibold text-primary mb-2">
              {role === "lawyer" ? "No Client Inquiries Assigned Yet" : "No Active Legal Cases Yet"}
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mb-6 leading-relaxed">
              {role === "lawyer"
                ? "When clients choose your chambers or book consultations from the directory, their confidential case records will populate here."
                : "You have not started any legal matters yet. Use our 2-minute evaluation to explain what happened and get matched with top licensed counsel."}
            </p>
            {role === "client" ? (
              <Link
                href="/intake"
                className="bg-brass hover:bg-brass-hover text-white text-xs font-semibold px-6 py-3 rounded-lg inline-flex items-center gap-2 shadow-xs transition-colors"
              >
                <span>Explain Your Legal Issue</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href={`/lawyers/${activeLawyer?.id || ""}`}
                className="bg-brass hover:bg-brass-hover text-white text-xs font-semibold px-6 py-3 rounded-lg inline-flex items-center gap-2 shadow-xs transition-colors"
              >
                <span>View Public Profile</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
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
                      </div>

                      <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-2 flex-wrap">
                        <span className="font-semibold text-primary">
                          {role === "lawyer" ? `Client: ${matter.clientName}` : matter.lawyer.name}
                        </span>
                        <span>•</span>
                        <span>{matter.lawyer.jurisdiction}</span>
                        <span>•</span>
                        <span className="text-brass font-medium">{matter.lawyer.practiceAreas?.[0] || "General Counsel"}</span>
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
                      <Clock className="w-4 h-4 text-slate" /> Active Matter
                    </span>
                  </div>

                  <Link
                    href={`/messages?matterId=${matter.id}`}
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
