"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, IndianRupee, AlertCircle, Loader2 } from "lucide-react";
import { INDIAN_STATES } from "@/lib/data/lawyers";
import { useUserRole } from "@/lib/context/RoleContext";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { CaptchaWidget } from "@/components/ui/CaptchaWidget";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { createClient } from "@/lib/supabase/client";

export function LawyerRegistrationWizard({ onCancel }: { onCancel?: () => void }) {
  const { registerLawyer } = useUserRole();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    firmName: "",
    barNumber: "",
    stateBar: "Delhi (DL)",
    primaryPractice: "Employment & Labor Law",
    bio: "",
    password: "",
  });

  const handleGoogleLawyerSignUp = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?role=lawyer&mode=register&next=${encodeURIComponent("/lawyer/verify")}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) {
        setErrorMessage(error.message || "Failed to initiate Google authentication.");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (step === 3) {
      if (!formData.password || formData.password.length < 8) {
        setErrorMessage("Please enter a secure password of at least 8 characters.");
        return;
      }
      if (!captchaToken) {
        setErrorMessage("Please wait for CAPTCHA verification to complete.");
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await registerLawyer({
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          barNumber: formData.barNumber.trim(),
          stateBar: formData.stateBar,
          primaryPractice: formData.primaryPractice,
          bio: formData.bio.trim() || `Licensed advocate admitted to ${formData.stateBar} specializing in ${formData.primaryPractice}.`,
          password: formData.password,
          captchaToken: captchaToken ?? undefined,
        });

        if (res.success) {
          setStep(4);
        } else {
          setErrorMessage(res.error || "Attorney registration failed. Please try again.");
        }
      } catch (err: any) {
        setErrorMessage(err.message || "An unexpected error occurred.");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setStep((prev) => prev + 1);
    }
  };

  if (step === 4) {
    return (
      <div className="flex-1 flex items-center justify-center p-2 sm:p-6">
        <div className="bg-surface-container-lowest p-6 sm:p-10 rounded-2xl border border-hairline shadow-editorial max-w-lg w-full text-center space-y-5 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-brass/10 border border-brass/30 mx-auto flex items-center justify-center text-brass">
            <CheckCircle2 className="w-10 h-10 text-brass" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-800">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Email Verification Required</span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
              Check Your Inbox
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Thank you, <strong>{formData.fullName}</strong>. We've sent a verification link to your email address. Please click the link to verify your email and continue setting up your profile.
            </p>
          </div>

          <div className="p-4 bg-surface-container-low rounded-xl border border-hairline text-left text-xs space-y-2.5">
            <div className="flex justify-between pb-1.5 border-b border-hairline text-on-surface-variant">
              <span>Email Address</span>
              <span className="font-semibold text-primary">{formData.email}</span>
            </div>
            <div className="flex justify-between pb-1.5 border-b border-hairline text-on-surface-variant">
              <span>Practice Area</span>
              <span className="font-semibold text-primary">{formData.primaryPractice}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Verification Status</span>
              <span className="font-semibold text-amber-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                Pending Email Confirmation
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/login"
              className="flex-1 bg-brass hover:bg-brass-hover text-white py-3 px-4 rounded-lg text-xs font-semibold shadow-sm transition-all text-center flex items-center justify-center min-h-[44px]"
            >
              Go to Login
            </Link>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  fullName: "",
                  email: "",
                  firmName: "",
                  barNumber: "",
                  stateBar: "Delhi (DL)",
                  primaryPractice: "Employment & Labor Law",
                  bio: "",
                  password: "",
                });
                setStep(1);
              }}
              className="text-xs text-slate hover:underline font-medium"
            >
              Register Another Lawyer Profile &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-xl w-full mx-auto px-1 py-4 sm:px-5 sm:py-8 flex flex-col justify-center">
      <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl border border-hairline shadow-editorial">
        <div className="flex items-center justify-between text-xs text-on-surface-variant font-semibold mb-6">
          <span>Step {step} of 3</span>
          <span className="text-brass">
            {step === 1 ? "Contact Details" : step === 2 ? "License & State" : "Bio & Password"}
          </span>
        </div>
        <div className="w-full h-1 bg-surface-container rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-brass transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <form onSubmit={handleNext} className="space-y-4">
          {step === 1 && (
            <>
              <div className="mb-4 pb-4 border-b border-hairline/80 space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleLawyerSignUp}
                  disabled={isSubmitting}
                  className="w-full bg-surface-container-lowest hover:bg-surface-container-low text-primary font-semibold text-xs py-2.5 px-4 rounded-xl border border-hairline shadow-2xs transition-all flex items-center justify-center gap-2.5 min-h-[44px] active:scale-[0.99] disabled:opacity-50"
                >
                  <GoogleIcon className="w-4 h-4" />
                  <span>Authenticate with Google to Start Practice Application</span>
                </button>
                <p className="text-[11px] text-center text-on-surface-variant">
                  Authenticate your verified identity via Google, then provide your Bar enrollment details.
                </p>
              </div>

              <div className="relative flex items-center justify-center mb-4">
                <div className="border-t border-hairline/80 w-full" />
                <span className="bg-surface-container-lowest px-2.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant shrink-0">
                  Or enter details manually
                </span>
              </div>

              <h2 className="font-headline text-xl font-semibold text-primary mb-1">Contact Details</h2>
              <p className="text-xs text-on-surface-variant mb-4">Provide your legal practice contact information.</p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jonathan Vance"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:border-slate focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">
                  Law Firm Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vance & Partners"
                  value={formData.firmName}
                  onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                  className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:border-slate focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="lawyer@firm.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:border-slate focus:outline-none"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-headline text-xl font-semibold text-primary mb-1">License &amp; Practice Area</h2>
              <p className="text-xs text-on-surface-variant mb-4">We verify active licenses with state licensing authorities.</p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">
                  Licensed State / Bar Council
                </label>
                <select
                  value={formData.stateBar}
                  onChange={(e) => setFormData({ ...formData, stateBar: e.target.value })}
                  className="editorial-select w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:border-slate focus:outline-none font-medium"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">
                  State Bar Council / License Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bar Council #D/5198/2018"
                  value={formData.barNumber}
                  onChange={(e) => setFormData({ ...formData, barNumber: e.target.value })}
                  className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:border-slate focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">
                  Primary Practice Area
                </label>
                <select
                  value={formData.primaryPractice}
                  onChange={(e) => setFormData({ ...formData, primaryPractice: e.target.value })}
                  className="editorial-select w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:border-slate focus:outline-none font-medium"
                >
                  <option>Employment & Labor Law</option>
                  <option>Corporate & Commercial Law</option>
                  <option>Intellectual Property & Patents</option>
                  <option>Commercial Litigation</option>
                  <option>Technology Transactions</option>
                </select>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-headline text-xl font-semibold text-primary mb-1">Bio &amp; Password</h2>
              <p className="text-xs text-on-surface-variant mb-4">Provide a brief description for clients and secure your account.</p>

              <div className="mb-4">
                <div className="p-3 bg-surface-container-low border border-hairline rounded-lg flex items-start gap-2.5">
                  <IndianRupee className="w-4 h-4 text-brass mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-primary">Hourly Consultation Rate</p>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed">
                      Your official consultation rate will be assigned by the Admissions Desk during verification.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">
                  Short Bio / About You
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your background, years of experience, and types of cases you handle..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:border-slate focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">
                  Account Password
                </label>
                <PasswordInput
                  value={formData.password}
                  onChange={(v) => setFormData({ ...formData, password: v })}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  showStrength
                  inputClassName="w-full pl-9 pr-10 bg-surface border border-hairline rounded-lg py-2.5 text-sm text-on-surface focus:border-slate focus:outline-none"
                />
                <p className="text-[11px] text-on-surface-variant mt-1">
                  You will use this password to sign in to your attorney portal.
                </p>
              </div>

              <CaptchaWidget
                action="lawyer-signup"
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
              />
            </>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-xs text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-4 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setStep((prev) => prev - 1)}
                className="px-5 py-2.5 rounded-lg border border-hairline text-xs font-semibold text-on-surface hover:bg-surface-container-low btn-editorial-secondary min-h-[44px] disabled:opacity-50"
              >
                Back
              </button>
            ) : onCancel ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onCancel}
                className="px-5 py-2.5 rounded-lg border border-hairline text-xs font-semibold text-on-surface hover:bg-surface-container-low btn-editorial-secondary min-h-[44px] disabled:opacity-50"
              >
                Cancel
              </button>
            ) : <div />}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-brass hover:bg-brass-hover text-white text-xs font-semibold py-3 px-6 rounded-lg shadow-sm hover:shadow-md btn-editorial-brass flex items-center justify-center gap-2 ml-auto min-h-[44px] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>{step === 3 ? "Complete Registration" : "Continue"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
