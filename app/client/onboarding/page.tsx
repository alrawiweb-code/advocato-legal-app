"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Scale,
  ShieldCheck,
  User,
  Phone,
  MapPin,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useUserRole } from "@/lib/context/RoleContext";
import { INDIAN_STATES } from "@/lib/data/lawyers";
import { createClient } from "@/lib/supabase/client";

const PRACTICE_INTERESTS = [
  "Employment & Labor Law",
  "Corporate & Commercial Law",
  "Civil Litigation",
  "Property & Real Estate",
  "Family & Matrimonial Law",
  "Criminal Defense",
  "Consumer Protection",
  "Intellectual Property",
];

export default function ClientOnboardingPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, isLoadingAuth, role, refreshUser } = useUserRole();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("Delhi (DL)");
  const [primaryInterest, setPrimaryInterest] = useState("Employment & Labor Law");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize form from current user metadata/profile
  useEffect(() => {
    if (currentUser?.name && !fullName) {
      setFullName(currentUser.name === "User" ? "" : currentUser.name);
    }
  }, [currentUser, fullName]);

  // Route protection
  useEffect(() => {
    if (!isLoadingAuth) {
      if (!isAuthenticated) {
        router.push("/login?tab=client");
      } else if (role === "lawyer") {
        router.push("/");
      }
    }
  }, [isAuthenticated, isLoadingAuth, role, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage("Please enter your full legal name.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // 1. Update Auth metadata to record onboarding completion
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          onboarding_completed: true,
          preferred_state: state,
          preferred_category: primaryInterest,
        },
      });

      if (authError) {
        console.warn("Auth metadata update notice:", authError.message);
      }

      // 2. Update public profile record
      // Attempt with is_onboarded flag, fallback to standard columns if column not yet migrated
      if (currentUser?.id) {
        const { error: profileErrorWithFlag } = await supabase
          .from("profiles")
          .update({
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            is_onboarded: true,
          } as any)
          .eq("id", currentUser.id);

        if (profileErrorWithFlag) {
          // Fallback if is_onboarded column does not exist yet
          await supabase
            .from("profiles")
            .update({
              full_name: fullName.trim(),
              phone: phone.trim() || null,
            })
            .eq("id", currentUser.id);
        }
      }

      // 3. Refresh user session state
      await refreshUser();

      // 4. Proceed to client marketplace dashboard
      router.push("/");
    } catch (err: any) {
      console.error("Client onboarding error:", err);
      setErrorMessage(err.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100dvh-4rem)] bg-surface">
        <Loader2 className="w-6 h-6 animate-spin text-brass" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-surface min-h-[calc(100dvh-4rem)] p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-xl mx-auto py-8">
        {/* Masthead Header */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low border border-hairline text-xs font-semibold text-primary">
            <Sparkles className="w-3.5 h-3.5 text-brass" />
            <span>Welcome to Advocato</span>
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl font-semibold text-primary tracking-tight">
            Complete Your Client Profile
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
            Confirm your details to connect privately with Bar Council verified advocates across India.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl border border-hairline shadow-editorial">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1.5">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-surface border border-hairline rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-on-surface focus:border-slate focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1">
                Used to issue confidential consultation appointment dockets.
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1.5">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-surface border border-hairline rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-on-surface focus:border-slate focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1">
                Receive SMS hearing reminders and privileged lawyer appointment notices.
              </p>
            </div>

            {/* State / Jurisdiction */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1.5">
                Your State / Jurisdiction
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-on-surface-variant absolute left-3.5 top-3.5" />
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-surface border border-hairline rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-on-surface focus:border-slate focus:outline-none"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1">
                Ensures you are matched with counsel actively licensed in your jurisdiction.
              </p>
            </div>

            {/* Primary Area of Interest */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1.5">
                Primary Legal Topic (Optional)
              </label>
              <select
                value={primaryInterest}
                onChange={(e) => setPrimaryInterest(e.target.value)}
                className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm text-on-surface focus:border-slate focus:outline-none"
              >
                {PRACTICE_INTERESTS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brass hover:bg-brass-hover text-white py-3.5 px-6 rounded-lg font-semibold text-sm transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Finalizing Setup...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Client Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Privacy Footnote */}
          <div className="mt-6 pt-4 border-t border-hairline flex items-center justify-center gap-2 text-xs text-on-surface-variant text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>256-Bit Encrypted • Attorney-Client Privileged Communications</span>
          </div>
        </div>
      </div>
    </div>
  );
}
