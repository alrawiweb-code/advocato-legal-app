"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Scale,
  ShieldCheck,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RotateCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { CaptchaWidget } from "@/components/ui/CaptchaWidget";

type ResetStep = "request" | "verify" | "reset";

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [step, setStep] = useState<ResetStep>("request");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // Bot Protection (Cloudflare Turnstile)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // 60-second cooldown timer for OTP resend
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const prefillEmail = searchParams.get("email");
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [searchParams]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Step 1: Request 6-digit OTP
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!captchaToken) {
      setErrorMessage("Please complete the security verification challenge before continuing.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      // 1. Verify Cloudflare Turnstile token via server API
      const captchaRes = await fetch("/api/verify-captcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: captchaToken,
          action: "forgot-password",
        }),
      });

      const captchaData = await captchaRes.json();
      if (!captchaRes.ok || !captchaData.success) {
        setErrorMessage(
          captchaData.error || "Security verification failed. Please refresh the page and try again."
        );
        setIsSubmitting(false);
        return;
      }

      // 2. Request OTP from Supabase Auth
      // Note: resetPasswordForEmail generates the 6-digit {{ .Token }} sent to the user's email
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

      if (error) {
        // If Supabase returns rate-limit error, present it clearly
        if (error.message.toLowerCase().includes("rate limit") || error.message.toLowerCase().includes("too many requests")) {
          setErrorMessage("Too many password reset requests. Please wait a few minutes before trying again.");
          setIsSubmitting(false);
          return;
        }
        console.warn("[forgot-password] resetPasswordForEmail notice:", error.message);
      }

      // 3. Anti-Enumeration: Always proceed to Step 2 with the same message
      setSuccessInfo(
        "If an account is associated with this email address, a 6-digit verification code has been dispatched."
      );
      setStep("verify");
      setCooldown(60);
      setCaptchaToken(null);
    } catch (err: any) {
      console.error("[forgot-password] Request error:", err);
      // Gracefully advance to prevent enumeration while logging
      setSuccessInfo(
        "If an account is associated with this email address, a 6-digit verification code has been dispatched."
      );
      setStep("verify");
      setCooldown(60);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim().replace(/\s+/g, "");
    if (cleanCode.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code sent to your email.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      // Verify OTP code with recovery type to establish an active recovery session
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: cleanCode,
        type: "recovery",
      });

      if (error) {
        if (error.message.toLowerCase().includes("expired")) {
          setErrorMessage("This verification code has expired. Please click 'Resend Code' to receive a new one.");
        } else if (error.message.toLowerCase().includes("invalid") || error.message.toLowerCase().includes("token")) {
          setErrorMessage("Incorrect verification code. Please check your email and enter the 6-digit code again.");
        } else {
          setErrorMessage(error.message || "Verification failed. Please check the code and try again.");
        }
        setIsSubmitting(false);
        return;
      }

      if (data?.session) {
        setSuccessInfo("Verification successful. Please choose a strong new password.");
        setStep("reset");
      } else {
        setErrorMessage("Could not establish a recovery session. Please request a new code.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during verification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Set New Password & Sign Out
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setErrorMessage("Your new password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("The new passwords do not match. Please verify both fields.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      // Update password for the currently established recovery session user
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMessage(error.message || "Failed to update password. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Security requirement: Terminate the recovery session so the user signs in fresh
      await supabase.auth.signOut();

      // Redirect cleanly to login page with success notification
      router.push("/login?reset=success");
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while updating your password.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-surface min-h-[calc(100dvh-4rem)]">
      <div className="w-full max-w-[480px] space-y-6">
        {/* Masthead Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-brass mb-1 shadow-xs">
            <Scale className="w-6 h-6 text-brass" />
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            Advocato Portal
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mx-auto">
            Privileged account recovery &amp; password security service.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl border border-hairline shadow-sm space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between text-[11px] font-semibold text-on-surface-variant border-b border-hairline/60 pb-3">
            <span className={step === "request" ? "text-primary font-bold" : "text-on-surface-variant"}>
              1. Request Code
            </span>
            <span className="text-outline/40">→</span>
            <span className={step === "verify" ? "text-primary font-bold" : "text-on-surface-variant"}>
              2. Verify OTP
            </span>
            <span className="text-outline/40">→</span>
            <span className={step === "reset" ? "text-primary font-bold" : "text-on-surface-variant"}>
              3. New Password
            </span>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Informational / Success Alert */}
          {successInfo && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1 leading-relaxed">{successInfo}</div>
            </div>
          )}

          {/* STEP 1: Email & Turnstile */}
          {step === "request" && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary block">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-on-surface-variant absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="counsel@lawpractice.com or client@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-hairline bg-surface text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50"
                  />
                </div>
                <p className="text-[11px] text-on-surface-variant pt-0.5">
                  We will send a 6-digit one-time verification code to this address.
                </p>
              </div>

              {/* Bot Protection Widget */}
              <div className="pt-1">
                <CaptchaWidget
                  action="forgot-password"
                  onVerify={(token) => {
                    setCaptchaToken(token);
                    setErrorMessage(null);
                  }}
                  onExpire={() => setCaptchaToken(null)}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !captchaToken}
                className="w-full bg-primary hover:bg-primary/95 text-white font-semibold text-xs py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 min-h-[44px]"
              >
                {isSubmitting ? (
                  <span>Sending Code...</span>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: 6-Digit OTP Verification */}
          {step === "verify" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-primary block">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("request");
                      setErrorMessage(null);
                      setSuccessInfo(null);
                    }}
                    className="text-[11px] text-brass hover:underline font-semibold"
                  >
                    Change Email
                  </button>
                </div>

                <div className="relative">
                  <KeyRound className="w-4 h-4 text-on-surface-variant absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setOtpCode(val);
                    }}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-hairline bg-surface text-primary text-base font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/40 placeholder:tracking-normal"
                  />
                </div>
                <p className="text-[11px] text-on-surface-variant pt-0.5">
                  Enter the code sent to <strong>{email}</strong>. Codes expire within 60 minutes.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otpCode.length !== 6}
                className="w-full bg-primary hover:bg-primary/95 text-white font-semibold text-xs py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 min-h-[44px]"
              >
                {isSubmitting ? (
                  <span>Verifying Code...</span>
                ) : (
                  <>
                    <span>Verify Code &amp; Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend OTP with Cooldown */}
              <div className="pt-2 border-t border-hairline/60 flex items-center justify-between text-xs text-on-surface-variant">
                <span>Didn't receive a code?</span>
                {cooldown > 0 ? (
                  <span className="text-[11px] text-outline font-medium">
                    Resend available in {cooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setStep("request");
                      setErrorMessage(null);
                      setSuccessInfo(null);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-brass hover:underline font-semibold"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Resend Code</span>
                  </button>
                )}
              </div>
            </form>
          )}

          {/* STEP 3: Set New Password */}
          {step === "reset" && (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary block">
                  New Password
                </label>
                <PasswordInput
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="Min. 8 characters"
                  required
                  showStrength={true}
                  minLength={8}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary block">
                  Confirm New Password
                </label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Re-enter new password"
                  required
                  minLength={8}
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-red-600 font-medium">
                    Passwords do not match.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  newPassword.length < 8 ||
                  newPassword !== confirmPassword
                }
                className="w-full bg-brass hover:bg-brass-hover text-white font-semibold text-xs py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 min-h-[44px]"
              >
                {isSubmitting ? (
                  <span>Saving New Password...</span>
                ) : (
                  <>
                    <span>Save Password &amp; Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Return to Sign In */}
          <div className="pt-2 border-t border-hairline/60 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Sign In</span>
            </Link>
          </div>
        </div>

        {/* Footer Security Badging */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-on-surface-variant">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-Bit SSL Encrypted Recovery Session</span>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[calc(100dvh-4rem)]">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
