"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Bell,
  Lock,
  Smartphone,
  Scale,
  ArrowRight,
  CheckCircle2,
  UserCheck,
  LogOut,
  Briefcase,
  User,
} from "lucide-react";
import { useUserRole } from "@/lib/context/RoleContext";

export default function ProfilePage() {
  const router = useRouter();
  const { role, currentUser, isSupabaseConnected, activeLawyer, logout } = useUserRole();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const initials = currentUser.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "US";

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="flex-1 flex flex-col bg-background min-h-[calc(100dvh-4rem)]">
      <div className="max-w-[1240px] w-full mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-10 pb-24 md:pb-12">
        <div className="pb-6 border-b border-hairline mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-surface-container-low border border-hairline text-[11px] font-semibold text-primary mb-2">
            <Scale className="w-3.5 h-3.5 text-brass" />
            <span>Account &amp; Preferences</span>
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">Account &amp; Security</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Manage your authenticated profile, privileged privacy settings, and active session.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Column: Identity & Session */}
          <div className="lg:col-span-5 space-y-5 sm:space-y-6">
            {/* Authenticated Identity Card */}
            <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-hairline shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg sm:text-xl shrink-0 shadow-xs">
                  {initials}
                </div>
                <div className="min-w-0">
                  <h2 className="font-headline text-base sm:text-lg font-semibold text-primary truncate">{currentUser.name}</h2>
                  <p className="text-xs text-on-surface-variant truncate">{currentUser.email}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-brass font-medium mt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-brass shrink-0" />
                    <span>{role === "client" ? "Verified Client Account" : `Verified Attorney (${activeLawyer?.jurisdiction || "Active License"})`}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              </div>
            </div>

            {/* Authenticated Session Management */}
            <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-hairline shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {role === "lawyer" ? (
                    <Briefcase className="w-4 h-4 text-brass" />
                  ) : (
                    <User className="w-4 h-4 text-brass" />
                  )}
                  <h3 className="text-xs uppercase font-bold tracking-wider text-primary">
                    Active Session: <span className="text-brass">{role === "client" ? "Client Account" : "Attorney Practice Account"}</span>
                  </h3>
                </div>
              </div>

              <div className="bg-surface-container-low p-3.5 rounded-xl border border-hairline space-y-2 text-xs">
                <div className="flex justify-between pb-1 border-b border-hairline text-on-surface-variant">
                  <span>Signed In As</span>
                  <span className="font-semibold text-primary">{currentUser.name}</span>
                </div>
                <div className="flex justify-between pb-1 border-b border-hairline text-on-surface-variant">
                  <span>Account Role</span>
                  <span className="font-semibold text-primary capitalize">{role}</span>
                </div>
                {role === "lawyer" && activeLawyer && (
                  <div className="flex justify-between pb-1 border-b border-hairline text-on-surface-variant">
                    <span>Bar Admission</span>
                    <span className="font-semibold text-primary">{activeLawyer.jurisdiction}</span>
                  </div>
                )}
                <div className="flex justify-between text-on-surface-variant">
                  <span>Session Security</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 256-Bit Encrypted
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/80 text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-colors min-h-[44px]"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Advocato</span>
              </button>
            </div>

            {/* Privileged Security Banner */}
            <div className="bg-surface-container-low p-4 rounded-xl border border-hairline/80 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-brass shrink-0 mt-0.5" />
              <div className="text-xs text-on-surface-variant leading-relaxed">
                <span className="font-semibold text-primary block mb-0.5">Attorney-Client Privilege Protected</span>
                All uploaded documents, case briefs, and direct messages sent on Advocato are encrypted and restricted to assigned counsel.
              </div>
            </div>
          </div>

          {/* Right Column: Settings & Navigation */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            {/* Settings */}
            <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-hairline shadow-xs space-y-4">
              <h3 className="text-xs uppercase font-semibold tracking-wider text-on-surface-variant">
                Notifications &amp; Cloud Infrastructure
              </h3>

              <div className="flex items-center justify-between py-2.5 border-b border-hairline">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-slate shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-primary">Message &amp; Case Alerts</div>
                    <div className="text-[11px] text-on-surface-variant">Get notified when counsel or client replies to your matter</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                  className="w-4 h-4 text-brass rounded border-hairline accent-brass cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-hairline">
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-slate shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-primary">Cloud Storage &amp; Database</div>
                    <div className="text-[11px] text-on-surface-variant">
                      {isSupabaseConnected ? "Connected securely to encrypted database & storage" : "Running in offline mode"}
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${isSupabaseConnected ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : "text-amber-700 bg-amber-50 border border-amber-200"}`}>
                  {isSupabaseConnected ? "Connected" : "Local Mode"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-slate shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-primary">Mobile Web &amp; Desktop PWA</div>
                    <div className="text-[11px] text-on-surface-variant">Encrypted progressive web app enabled</div>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Ready
                </span>
              </div>
            </div>

            {/* Quick Links Scoped to Current Role */}
            <div className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-hairline shadow-xs space-y-3">
              <h3 className="text-xs uppercase font-semibold tracking-wider text-on-surface-variant">
                {role === "lawyer" ? "Practice Navigation" : "Client Portal Navigation"}
              </h3>
              {role === "lawyer" ? (
                <>
                  <Link
                    href="/"
                    className="flex items-center justify-between text-xs font-semibold text-primary hover:text-brass py-2.5 border-b border-hairline transition-colors"
                  >
                    <span>Attorney Practice Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/cases"
                    className="flex items-center justify-between text-xs font-semibold text-primary hover:text-brass py-2.5 border-b border-hairline transition-colors"
                  >
                    <span>Client Consultations &amp; Inquiries</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/messages"
                    className="flex items-center justify-between text-xs font-semibold text-primary hover:text-brass py-2.5 border-b border-hairline transition-colors"
                  >
                    <span>Client Messages &amp; Video Consultations</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  {activeLawyer && (
                    <Link
                      href={`/lawyers/${activeLawyer.id}`}
                      className="flex items-center justify-between text-xs font-semibold text-primary hover:text-brass py-2.5 transition-colors"
                    >
                      <span>Public Lawyer Profile</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    href="/cases"
                    className="flex items-center justify-between text-xs font-semibold text-primary hover:text-brass py-2.5 border-b border-hairline transition-colors"
                  >
                    <span>My Active Cases</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/lawyers"
                    className="flex items-center justify-between text-xs font-semibold text-primary hover:text-brass py-2.5 border-b border-hairline transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-brass" />
                      <span>Browse All Verified Lawyers</span>
                    </div>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/intake"
                    className="flex items-center justify-between text-xs font-semibold text-primary hover:text-brass py-2.5 border-b border-hairline transition-colors"
                  >
                    <span>Tell Us What Happened (New Intake)</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/messages"
                    className="flex items-center justify-between text-xs font-semibold text-primary hover:text-brass py-2.5 transition-colors"
                  >
                    <span>Attorney Consultation Messages</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
