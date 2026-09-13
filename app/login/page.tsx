"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Sparkles,
} from "lucide-react";
import { useUserRole, DEMO_CLIENT, DEMO_LAWYER_SARAH, DEMO_LAWYER_MARCUS } from "@/lib/context/RoleContext";
import { INDIAN_STATES } from "@/lib/data/lawyers";

export default function LoginPage() {
  const router = useRouter();
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
    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await login({
        email: email.trim(),
        password: password || undefined,
        role: selectedRoleTab,
      });

      if (res.success) {
        router.push("/");
      } else {
        setErrorMessage(res.error || "Authentication failed. Please verify credentials.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle1ClickLogin = async (personaId: string) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const res = await login({ personaId });
      if (res.success) {
        router.push("/");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Quick sign-in failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !email.trim()) {
      setErrorMessage("Please enter your name and email.");
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await registerClient({
        name: clientName.trim(),
        email: email.trim(),
        password: password || undefined,
      });
      if (res.success) {
        router.push("/");
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
    if (!lawyerName.trim() || !email.trim() || !barNumber.trim()) {
      setErrorMessage("Please fill in all required bar admission fields.");
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await registerLawyer({
        name: lawyerName.trim(),
        email: email.trim(),
        barNumber: barNumber.trim(),
        stateBar,
        primaryPractice,
        hourlyRate: Number(hourlyRate) || 350,
        bio: bio.trim() || `Licensed attorney in ${stateBar} specializing in ${primaryPractice}.`,
        password: password || undefined,
      });
      if (res.success) {
        router.push("/");
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
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-surface">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-brass shadow-md mb-1">
            <Scale className="w-6 h-6" />
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            ADVOCATO
          </h1>
          <p className="text-xs text-on-surface-variant font-medium">
            Intelligence-Driven Legal Marketplace • Privileged Client Portal
          </p>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-surface-container-lowest rounded-2xl border border-hairline shadow-editorial overflow-hidden">
          {/* Persona Tabs: Client vs Attorney */}
          <div className="grid grid-cols-2 border-b border-hairline bg-surface-container-low p-1.5 gap-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setSelectedRoleTab("client");
                setErrorMessage(null);
              }}
              className={`py-2.5 px-3 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 ${
                selectedRoleTab === "client"
                  ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              <User className="w-4 h-4 text-brass" />
              <span>Client Portal</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRoleTab("lawyer");
                setErrorMessage(null);
              }}
              className={`py-2.5 px-3 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 ${
                selectedRoleTab === "lawyer"
                  ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              <Briefcase className="w-4 h-4 text-brass" />
              <span>Attorney Practice</span>
            </button>
          </div>

          <div className="p-6 sm:p-7 space-y-5">
            {/* Header Subtitle */}
            <div className="border-b border-hairline pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-primary">
                  {selectedRoleTab === "client"
                    ? authMode === "signin"
                      ? "Sign In as Client"
                      : "Create Client Account"
                    : authMode === "signin"
                    ? "Attorney Practice Sign In"
                    : "Apply for Directory Admission"}
                </h2>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  {selectedRoleTab === "client"
                    ? "Access your case docket, attorney matches, and confidential chats."
                    : "Review incoming client submissions, consultations, and privileged files."}
                </p>
              </div>
            </div>

            {/* Error Message Banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* SIGN-IN FORM */}
            {authMode === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    {selectedRoleTab === "client" ? "Email Address" : "Bar Association Email"}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={
                        selectedRoleTab === "client"
                          ? "alex.mercer@company.com"
                          : "sarah.jenkins@jenkinslaw.com"
                      }
                      className="w-full bg-surface-container-low border border-hairline rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-primary placeholder:text-outline-variant focus:outline-none focus:border-brass transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      Password
                    </label>
                    <span className="text-[10px] text-on-surface-variant italic">
                      (Demo default: any password)
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-surface-container-low border border-hairline rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-primary placeholder:text-outline-variant focus:outline-none focus:border-brass transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all duration-150 min-h-[44px] ${
                    selectedRoleTab === "lawyer"
                      ? "bg-brass hover:bg-brass-hover btn-editorial-brass"
                      : "bg-primary hover:bg-slate-dark btn-editorial"
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>
                    {isSubmitting
                      ? "Verifying Session..."
                      : selectedRoleTab === "client"
                      ? "Sign In to Client Portal"
                      : "Sign In as Admitted Counsel"}
                  </span>
                </button>
              </form>
            ) : selectedRoleTab === "client" ? (
              /* CLIENT REGISTRATION FORM */
              <form onSubmit={handleRegisterClient} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Jordan Lee"
                    className="w-full bg-surface-container-low border border-hairline rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-primary placeholder:text-outline-variant focus:outline-none focus:border-brass transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jordan.lee@example.com"
                    className="w-full bg-surface-container-low border border-hairline rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-primary placeholder:text-outline-variant focus:outline-none focus:border-brass transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Create Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-surface-container-low border border-hairline rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-primary placeholder:text-outline-variant focus:outline-none focus:border-brass transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-primary hover:bg-slate-dark text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm btn-editorial min-h-[44px]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-brass" />
                  <span>{isSubmitting ? "Creating Account..." : "Create Client Account"}</span>
                </button>
              </form>
            ) : (
              /* LAWYER REGISTRATION FORM */
              <form onSubmit={handleRegisterLawyer} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Full Name &amp; Title
                  </label>
                  <input
                    type="text"
                    value={lawyerName}
                    onChange={(e) => setLawyerName(e.target.value)}
                    placeholder="e.g. Rachel Adams, Esq."
                    className="w-full bg-surface-container-low border border-hairline rounded-xl px-3.5 py-2 text-xs text-primary placeholder:text-outline-variant focus:outline-none focus:border-brass transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Bar Number
                    </label>
                    <input
                      type="text"
                      value={barNumber}
                      onChange={(e) => setBarNumber(e.target.value)}
                      placeholder="D/5930/2018"
                      className="w-full bg-surface-container-low border border-hairline rounded-xl px-3 py-2 text-xs text-primary placeholder:text-outline-variant focus:outline-none focus:border-brass transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      State Bar Council
                    </label>
                    <select
                      value={stateBar}
                      onChange={(e) => setStateBar(e.target.value)}
                      className="w-full bg-surface-container-low border border-hairline rounded-xl px-2 py-2 text-xs text-primary focus:outline-none focus:border-brass transition-all"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Practice Focus
                    </label>
                    <input
                      type="text"
                      value={primaryPractice}
                      onChange={(e) => setPrimaryPractice(e.target.value)}
                      placeholder="Employment Law"
                      className="w-full bg-surface-container-low border border-hairline rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-brass transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Hourly Rate (₹/hr)
                    </label>
                    <input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="2500"
                      className="w-full bg-surface-container-low border border-hairline rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-brass transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="counsel@firm.com"
                    className="w-full bg-surface-container-low border border-hairline rounded-xl px-3.5 py-2 text-xs text-primary placeholder:text-outline-variant focus:outline-none focus:border-brass transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-brass hover:bg-brass-hover text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm btn-editorial-brass min-h-[44px]"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Registering Profile..." : "Register Attorney Practice"}</span>
                </button>
              </form>
            )}

            {/* Toggle Between Sign In & Register */}
            <div className="pt-2 text-center text-xs text-on-surface-variant border-t border-hairline">
              {authMode === "signin" ? (
                <div>
                  <span>Need an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setErrorMessage(null);
                    }}
                    className="text-brass hover:underline font-bold"
                  >
                    {selectedRoleTab === "client" ? "Create Client Account" : "Apply as Attorney"}
                  </button>
                </div>
              ) : (
                <div>
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signin");
                      setErrorMessage(null);
                    }}
                    className="text-brass hover:underline font-bold"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 1-CLICK VERIFIED EVALUATION PERSONAS */}
        <div className="bg-surface-container-low p-4 sm:p-5 rounded-2xl border border-hairline space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-brass" />
            <span>1-Click Verified Demo Accounts</span>
          </div>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Click any verified profile to authenticate instantly and evaluate scoped data and role capabilities:
          </p>

          <div className="space-y-2">
            {/* Alex Mercer - Client */}
            <button
              type="button"
              onClick={() => handle1ClickLogin(DEMO_CLIENT.id)}
              disabled={isSubmitting}
              className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-hairline hover:border-slate hover:bg-surface-container text-left transition-all flex items-center justify-between group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                  AM
                </div>
                <div>
                  <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <span>{DEMO_CLIENT.name}</span>
                    <span className="text-[10px] font-semibold bg-slate/10 text-slate px-1.5 py-0.2 rounded">
                      Client
                    </span>
                  </h4>
                  <span className="text-[10px] text-on-surface-variant block">
                    Client Account • {DEMO_CLIENT.email}
                  </span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Sarah Jenkins - Employment Counsel */}
            <button
              type="button"
              onClick={() => handle1ClickLogin(DEMO_LAWYER_SARAH.id)}
              disabled={isSubmitting}
              className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-hairline hover:border-brass hover:bg-surface-container text-left transition-all flex items-center justify-between group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <img
                  src={DEMO_LAWYER_SARAH.avatar}
                  alt={DEMO_LAWYER_SARAH.name}
                  className="w-8 h-8 rounded-full object-cover border border-brass/30"
                />
                <div>
                  <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <span>{DEMO_LAWYER_SARAH.name}</span>
                    <span className="text-[10px] font-semibold bg-brass/10 text-brass px-1.5 py-0.2 rounded">
                      Attorney
                    </span>
                  </h4>
                  <span className="text-[10px] text-on-surface-variant block">
                    Senior Employment Counsel • Delhi Bar #D/4921/2012
                  </span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-brass group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* Marcus Vance - Corporate Counsel */}
            <button
              type="button"
              onClick={() => handle1ClickLogin(DEMO_LAWYER_MARCUS.id)}
              disabled={isSubmitting}
              className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-hairline hover:border-brass hover:bg-surface-container text-left transition-all flex items-center justify-between group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <img
                  src={DEMO_LAWYER_MARCUS.avatar}
                  alt={DEMO_LAWYER_MARCUS.name}
                  className="w-8 h-8 rounded-full object-cover border border-brass/30"
                />
                <div>
                  <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <span>{DEMO_LAWYER_MARCUS.name}</span>
                    <span className="text-[10px] font-semibold bg-brass/10 text-brass px-1.5 py-0.2 rounded">
                      Attorney
                    </span>
                  </h4>
                  <span className="text-[10px] text-on-surface-variant block">
                    Corporate Partner • Bombay Bar #MAH/8291/2008
                  </span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-brass group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
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
