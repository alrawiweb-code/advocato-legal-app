"use client";

import { useState } from "react";
import Link from "next/link";
import { Scale, ArrowLeft, Lock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { VerificationModal } from "@/components/lawyer/VerificationModal";
import { useUserRole } from "@/lib/context/RoleContext";

export default function LawyerVerifyPage() {
  const { currentUser, activeLawyer } = useUserRole();
  const [modalOpen, setModalOpen] = useState(true);

  return (
    <div className="flex-1 flex flex-col items-center bg-surface min-h-[calc(100dvh-4rem)] p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-3xl mx-auto pt-4 sm:pt-8 pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Masthead Banner */}
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl border border-hairline shadow-xs mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-surface-container-low border border-hairline text-xs font-semibold text-primary mb-3">
            <Lock className="w-3.5 h-3.5 text-brass" />
            <span>Advocato Bar Verification Portal</span>
          </div>

          <h1 className="font-headline text-2xl sm:text-4xl text-primary font-semibold tracking-tight">
            Apply for Bar Verification &amp; Onboarding
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-2 max-w-xl leading-relaxed">
            To view privileged client matters, communicate with matched clients, and receive direct consultation inquiries, your credentials must be verified with the State Bar Council by Advocato Admissions.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="bg-brass hover:bg-brass-hover text-white text-xs font-semibold px-6 py-3 rounded-lg shadow-xs hover:shadow-md btn-editorial-brass flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Open Verification Dossier</span>
            </button>
          </div>
        </div>

        {/* Verification Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-hairline shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-brass mb-3">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="font-headline text-sm font-semibold text-primary mb-1">
              1. Bar Enrollment
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Verify your active advocate enrollment with your State Bar Council.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-xl border border-hairline shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-brass mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-headline text-sm font-semibold text-primary mb-1">
              2. Identity Verification
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Upload a valid government-issued photo identity document.
            </p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-xl border border-hairline shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-brass mb-3">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="font-headline text-sm font-semibold text-primary mb-1">
              3. Unrestricted Access
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Once approved by admin, full docket visibility and matching unlock immediately.
            </p>
          </div>
        </div>
      </div>

      <VerificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
