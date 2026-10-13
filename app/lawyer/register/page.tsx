"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Scale, FileCheck, IndianRupee, Building2, Gavel, AlertCircle, Loader2 } from "lucide-react";
import { INDIAN_STATES } from "@/lib/data/lawyers";
import { LawyerRegistrationWizard } from "@/components/auth/LawyerRegistrationWizard";

export default function LawyerRegistrationPage() {
  const [step, setStep] = useState<number>(0); // 0 = Landing, 1 = Wizard

  return (
    <div className="flex-1 flex flex-col bg-surface">
      {step === 0 ? (
        /* Gateway Landing */
        <div className="flex-1 flex flex-col justify-between max-w-[1280px] w-full mx-auto px-5 md:px-8 py-8">
          <div className="flex flex-col gap-6 max-w-[650px] mx-auto text-center mt-8 md:mt-16">
            <div className="inline-flex items-center justify-center gap-2 self-center px-3.5 py-1.5 rounded-full bg-surface-container-low border border-hairline text-xs font-semibold text-primary">
              <Gavel className="w-4 h-4 text-brass" />
              <span>Join as a Lawyer</span>
            </div>

            <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl text-on-surface font-semibold tracking-tight leading-tight">
              Connect with clients who need your expertise
            </h1>
            <p className="text-base md:text-lg text-on-surface-variant font-normal leading-relaxed">
              Create your profile in 2 minutes. When clients describe legal situations matching your practice area and state, we connect them directly to you.
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5 mt-6 w-full max-w-[480px] mx-auto">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="bg-brass hover:bg-brass-hover text-white py-3.5 px-6 rounded-lg font-semibold text-sm transition-all shadow-[0_12px_32px_rgba(20,33,61,0.08)] flex-1 text-center hover:translate-y-[-1px] min-h-[44px]"
              >
                Create Lawyer Profile
              </button>
              <Link
                href="/lawyers"
                className="bg-transparent border border-primary text-primary py-3 px-6 rounded-lg font-semibold text-sm hover:bg-surface-container-low transition-colors flex-1 text-center flex items-center justify-center min-h-[44px]"
              >
                Browse Directory
              </Link>
            </div>

            <div className="text-center mt-8">
              <Link
                href="/"
                className="text-slate font-medium text-sm hover:underline inline-flex items-center gap-1.5"
              >
                <span>Looking for legal help instead?</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto my-16 pt-12 border-t border-hairline">
            <div className="p-6 rounded-xl bg-surface-container-lowest border border-hairline flex flex-col gap-2">
              <FileCheck className="w-6 h-6 text-brass mb-1" />
              <h3 className="font-headline text-base font-semibold text-primary">Clear Case Summaries</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Receive organized summaries of client situations, timelines, and attached documents upfront.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-surface-container-lowest border border-hairline flex flex-col gap-2">
              <IndianRupee className="w-6 h-6 text-brass mb-1" />
              <h3 className="font-headline text-base font-semibold text-primary">No Upfront Fees</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Set your own hourly rates and consultation availability with upfront transparent pricing.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-surface-container-lowest border border-hairline flex flex-col gap-2">
              <ShieldCheck className="w-6 h-6 text-brass mb-1" />
              <h3 className="font-headline text-base font-semibold text-primary">Verified Credibility</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Display your verified license, practice areas, and background to earn immediate client trust.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8 border-t border-hairline">
            <div className="flex items-center justify-between py-4">
              <span className="font-headline text-lg font-bold text-on-surface">ADVOCATO</span>
              <div className="flex gap-4">
                <Link href="/" className="text-on-surface-variant hover:text-primary transition-colors text-xs">
                  Home
                </Link>
                <Link href="/intake" className="text-on-surface-variant hover:text-primary transition-colors text-xs">
                  Get Help
                </Link>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-on-surface-variant opacity-70 pb-4">
              <div className="flex gap-4">
                <a href="#terms" className="hover:underline">Terms of Service</a>
                <a href="#privacy" className="hover:underline">Privacy Policy</a>
              </div>
              <p>&copy; 2026 Advocato. All rights reserved.</p>
            </div>
          </div>
        </div>
      ) : (
        <LawyerRegistrationWizard onCancel={() => setStep(0)} />
      )}
    </div>
  );
}
