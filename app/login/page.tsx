"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Scale,
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Key,
} from "lucide-react";
import { useUserRole } from "@/lib/context/RoleContext";
import { INDIAN_STATES } from "@/lib/data/lawyers";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/";

  const { login, registerClient, registerLawyer } = useUserRole();

  // Tab: "client" | "lawyer"
  const [selectedRoleTab, setSelectedRoleTab] = useState<"client" | "lawyer">("client");
  // Mode: "signin" | "register"
  const [authMode, setAuthMode] = useState<"signin" | "register">("signin");

  // Sign-in state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Client registration state
  const [clientName, setClientName] = useState("");

  // Lawyer registration state
  const [lawyerName, setLawyerName] = useState("");
  const [barNumber, setBarNumber] = useState("");
  const [stateBar, setStateBar] = useState("Delhi (DL)");
  const [primaryPractice, setPrimaryPractice] = useState("Employment & Labor Law");
  const [hourlyRate, setHourlyRate] = useState("2500");
  const [bio, setBio] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await login({
        email: email.trim(),
        password: password,
        role: selectedRoleTab,
      });

      if (res.success) {
        router.push(redirectTarget);
      } else {
        setErrorMessage(res.error || "Authentication failed. Please verify your credentials.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !email.trim() || !password) {
      setErrorMessage("Please complete all required registration fields.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await registerClient({
        name: clientName.trim(),
        email: email.trim(),
        password: password,
      });
      if (res.success) {
        setSuccessMessage("Client account registered successfully! Redirecting...");
        setTimeout(() => {
          router.push(redirectTarget);
        }, 1200);
      } else {
        setErrorMessage(res.error || "Client registration failed.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Client registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterLawyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lawyerName.trim() || !email.trim() || !barNumber.trim() || !password) {
      setErrorMessage("Please fill in your name, email, bar number, and password.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await registerLawyer({
        name: lawyerName.trim(),
        email: email.trim(),
        barNumber: barNumber.trim(),
        stateBar,
        primaryPractice,
        hourlyRate: Number(hourlyRate) || 2500,
        bio: bio.trim() || `Licensed attorney admitted to ${stateBar} specializing in ${primaryPractice}.`,
        password: password,
      });
      if (res.success) {
        setSuccessMessage("Attorney profile created and admitted! Redirecting to dashboard...");
        setTimeout(() => {
          router.push(redirectTarget);
        }, 1200);
      } else {
        setErrorMessage(res.error || "Lawyer registration failed.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Lawyer registration failed.");
    } finally {
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
            Privileged legal marketplace &amp; case management platform.
          </p>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl border border-hairline shadow-sm space-y-6">
          {/* Dual Role Selector: Client vs Lawyer */}
          <div className="grid grid-cols-2 p-1 bg-surface-container-low rounded-xl border border-hairline gap-1">
            <button
              type="button"
              onClick={() => {
                setSelectedRoleTab("client");
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                selectedRoleTab === "client"
                  ? "bg-surface-container-lowest text-primary shadow-xs"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Client Portal</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRoleTab("lawyer");
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                selectedRoleTab === "lawyer"
                  ? "bg-surface-container-lowest text-primary shadow-xs"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-brass" />
              <span>Attorney Practice</span>
            </button>
          </div>

          {/* Mode Switcher: Sign In vs Register */}
          <div className="flex border-b border-hairline text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMode("signin");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 pb-3 text-center transition-colors relative ${
                authMode === "signin"
                  ? "text-primary border-b-2 border-primary"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 pb-3 text-center transition-colors relative ${
                authMode === "register"
                  ? "text-primary border-b-2 border-primary"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {selectedRoleTab === "client" ? "Create Account" : "Register as Lawyer"}
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Success Message Alert */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Mode 1: Sign In (Client or Lawyer) */}
          {authMode === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-on-surface-variant absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      selectedRoleTab === "client"
                        ? "client@example.com"
                        : "counsel@lawpractice.com"
                    }
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-hairline bg-surface text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-on-surface-variant absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-hairline bg-surface text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/95 text-white font-semibold text-xs py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to {selectedRoleTab === "client" ? "Client Portal" : "Practice Portal"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Mode 2: Client Registration */}
          {authMode === "register" && selectedRoleTab === "client" && (
            <form onSubmit={handleRegisterClient} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-on-surface-variant absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-hairline bg-surface text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-on-surface-variant absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-hairline bg-surface text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-on-surface-variant absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-hairline bg-surface text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/95 text-white font-semibold text-xs py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Create Client Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Mode 2: Lawyer Registration */}
          {authMode === "register" && selectedRoleTab === "lawyer" && (
            <form onSubmit={handleRegisterLawyer} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary block">
                  Full Name &amp; Title
                </label>
                <input
                  type="text"
                  required
                  value={lawyerName}
                  onChange={(e) => setLawyerName(e.target.value)}
                  placeholder="e.g. Adv. Priya Sen"
                  className="w-full px-3 py-2.5 rounded-xl border border-hairline bg-surface text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-primary block">
                    Bar Council Number
                  </label>
                  <input
                    type="text"
                    required
                    value={barNumber}
                    onChange={(e) => setBarNumber(e.target.value)}
                    placeholder="D/1234/2015"
                    className="w-full px-3 py-2.5 rounded-xl border border-hairline bg-surface text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-primary block">
                    State Bar Council
                  </label>
                  <select
                    value={stateBar}
                    onChange={(e) => setStateBar(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-hairline bg-surface text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-primary block">
                    Primary Practice Area
                  </label>
                  <select
                    value={primaryPractice}
                    onChange={(e) => setPrimaryPractice(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-hairline bg-surface text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="Corporate & M&A">Corporate &amp; M&amp;A</option>
                    <option value="Employment & Labor Law">Employment &amp; Labor Law</option>
                    <option value="Criminal Defense">Criminal Defense</option>
                    <option value="Real Estate & Property">Real Estate &amp; Property</option>
                    <option value="Intellectual Property">Intellectual Property</option>
                    <option value="Family & Matrimonial">Family &amp; Matrimonial</option>
                    <option value="Commercial Litigation">Commercial Litigation</option>
                    <option value="Constitutional Law">Constitutional Law</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-primary block">
                    Hourly Fee (₹)
                  </label>
                  <input
                    type="number"
                    min={500}
                    step={100}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="2500"
                    className="w-full px-3 py-2.5 rounded-xl border border-hairline bg-surface text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary block">
                  Professional Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="counsel@chambers.in"
                  className="w-full px-3 py-2.5 rounded-xl border border-hairline bg-surface text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary block">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2.5 rounded-xl border border-hairline bg-surface text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary block">
                  Brief Bio / Trial Credentials
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief summary of trial experience, court appearances, and advisory specialization."
                  className="w-full px-3 py-2 rounded-xl border border-hairline bg-surface text-primary text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brass hover:bg-brass-hover text-white font-semibold text-xs py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Registering Bar Admission...</span>
                ) : (
                  <>
                    <span>Submit Attorney Admission</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Privileged Security Disclosure */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-on-surface-variant text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Protected by Attorney-Client Privilege • 256-Bit SSL Encrypted</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
