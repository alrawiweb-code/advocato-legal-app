"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, User, ShieldCheck, Scale, X, LogOut, Lock } from "lucide-react";
import { useUserRole } from "@/lib/context/RoleContext";
import { getStoredConsultations } from "@/lib/data/consultations";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, activeLawyer, currentUser, isAuthenticated, logout } = useUserRole();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasIntake, setHasIntake] = useState(false);

  useEffect(() => {
    // For production, this should fetch actual unread counts and intake status from Supabase
    // instead of relying on localStorage overrides.
    setHasIntake(false);
    setUnreadCount(0);
  }, [role, pathname]);

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <header className="fixed top-0 left-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-hairline/60 transition-all">
        <div className="max-w-[1280px] mx-auto h-16 px-4 sm:px-6 md:px-8 flex items-center justify-between pt-safe">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-brass shadow-sm">
              <Scale className="w-4 h-4 text-brass" />
            </div>
            <span className="font-headline text-xl md:text-2xl font-bold text-primary tracking-tighter">
              ADVOCATO
            </span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline font-medium">Privileged Legal Portal • 256-Bit SSL Encrypted</span>
            <span className="sm:hidden font-medium">Privileged Portal</span>
          </div>
        </div>
      </header>
    );
  }

  const userInitials = currentUser.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "US";

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-hairline/60 transition-all">
        <div className="max-w-[1280px] mx-auto h-16 px-4 sm:px-6 md:px-8 flex items-center justify-between pt-safe">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-brass group-hover:bg-primary-container transition-colors shadow-sm">
              <Scale className="w-4 h-4 text-brass" />
            </div>
            <span className="font-headline text-xl md:text-2xl font-bold text-primary tracking-tighter">
              ADVOCATO
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-2">
            {role === "admin" ? (
              <>
                <Link
                  href="/admin"
                  className={`text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    pathname === "/admin"
                      ? "bg-surface-container-low text-primary font-bold shadow-2xs"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low/60"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-brass" />
                  <span>Admissions Queue</span>
                </Link>
                <Link
                  href="/admin/lawyers"
                  className={`text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-md transition-all ${
                    pathname.startsWith("/admin/lawyers")
                      ? "bg-surface-container-low text-primary font-bold shadow-2xs"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low/60"
                  }`}
                >
                  Lawyers
                </Link>
                <Link
                  href="/admin/inquiries"
                  className={`text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-md transition-all ${
                    pathname.startsWith("/admin/inquiries")
                      ? "bg-surface-container-low text-primary font-bold shadow-2xs"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low/60"
                  }`}
                >
                  Inquiries
                </Link>
                <Link
                  href="/admin/matters"
                  className={`text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-md transition-all ${
                    pathname.startsWith("/admin/matters")
                      ? "bg-surface-container-low text-primary font-bold shadow-2xs"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low/60"
                  }`}
                >
                  Matters
                </Link>
                <Link
                  href="/admin/audit"
                  className={`text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-md transition-all ${
                    pathname.startsWith("/admin/audit")
                      ? "bg-surface-container-low text-primary font-bold shadow-2xs"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low/60"
                  }`}
                >
                  Audit Trail
                </Link>
              </>
            ) : role === "client" ? (
              <>
                <Link
                  href="/intake"
                  className={`text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-md transition-all ${
                    pathname.startsWith("/intake")
                      ? "bg-surface-container-low text-primary font-bold shadow-2xs"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low/60"
                  }`}
                >
                  Case Review
                </Link>
                <Link
                  href="/lawyers"
                  className={`text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-md transition-all ${
                    pathname.startsWith("/lawyers")
                      ? "bg-surface-container-low text-primary font-bold shadow-2xs"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low/60"
                  }`}
                >
                  {hasIntake ? "My Matches" : "Find a Lawyer"}
                </Link>
                <Link
                  href="/cases"
                  className={`text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-md transition-all ${
                    pathname.startsWith("/cases")
                      ? "bg-surface-container-low text-primary font-bold shadow-2xs"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low/60"
                  }`}
                >
                  My Cases
                </Link>
                <Link
                  href="/messages"
                  className={`text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    pathname.startsWith("/messages")
                      ? "bg-surface-container-low text-primary font-bold shadow-2xs"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low/60"
                  }`}
                >
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className="bg-brass text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </>
            ) : role === "lawyer" ? (
              <>
                <Link
                  href="/"
                  className={`text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-md transition-all duration-150 active:scale-95 ${
                    pathname === "/"
                      ? "bg-surface-container-low text-primary font-bold shadow-2xs"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low/60"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/cases"
                  className={`text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-md transition-all duration-150 active:scale-95 ${
                    pathname.startsWith("/cases")
                      ? "bg-surface-container-low text-primary font-bold shadow-2xs"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low/60"
                  }`}
                >
                  Client Cases
                </Link>
                <Link
                  href="/messages"
                  className={`text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-md transition-all duration-150 active:scale-95 flex items-center gap-1.5 ${
                    pathname.startsWith("/messages")
                      ? "bg-surface-container-low text-primary font-bold shadow-2xs"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low/60"
                  }`}
                >
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className="bg-brass text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                {activeLawyer && (
                  <Link
                    href={`/lawyers/${activeLawyer.id}`}
                    className={`text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-md transition-all duration-150 active:scale-95 ${
                      pathname === `/lawyers/${activeLawyer.id}`
                        ? "bg-surface-container-low text-primary font-bold shadow-2xs"
                        : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low/60"
                    }`}
                  >
                    Public Profile
                  </Link>
                )}
                {!activeLawyer?.isVerified && (
                  <Link
                    href="/lawyer/verify"
                    className="text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-800 border border-amber-500/30 flex items-center gap-1.5 hover:bg-amber-500/20 transition-all"
                  >
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>Verify Account</span>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/intake"
                  className={`text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-md transition-all ${
                    pathname.startsWith("/intake")
                      ? "bg-surface-container-low text-primary font-bold shadow-2xs"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low/60"
                  }`}
                >
                  Case Review
                </Link>
                <Link
                  href="/lawyers"
                  className={`text-xs font-semibold tracking-wider uppercase px-3 py-1.5 rounded-md transition-all ${
                    pathname.startsWith("/lawyers")
                      ? "bg-surface-container-low text-primary font-bold shadow-2xs"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low/60"
                  }`}
                >
                  Find a Lawyer
                </Link>
              </>
            )}
          </nav>

          {/* Actions & Authenticated Account */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setShowSearchModal(true)}
              aria-label="Search lawyers or cases"
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-hairline hover:bg-surface-container-low text-on-surface-variant transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Search className="w-4 h-4 text-on-surface-variant" />
            </button>

            {/* Authenticated User Capsule */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-surface-container-low border border-hairline">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  title="View Profile Settings"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {userInitials}
                  </div>
                  <div className="hidden lg:flex flex-col text-left leading-none">
                    <span className="text-xs font-bold text-primary truncate max-w-[120px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-brass font-medium capitalize mt-0.5">
                      {role === "admin" ? "Regulatory Admin" : role === "lawyer" ? "Attorney" : "Client"}
                    </span>
                  </div>
                </Link>

                {/* Sign Out Button */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-7 h-7 rounded-lg hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-red-600 transition-colors ml-1"
                  title="Sign Out of Advocato"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-2 sm:px-3 py-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/login?tab=lawyer"
                  className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-brass hover:text-brass-hover transition-colors px-3 py-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>For Lawyers</span>
                </Link>
              </div>
            )}

            {/* Quick Admin Access Link */}
            {(role === "admin" || currentUser.email === "alrawiweb@gmail.com") && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 bg-brass hover:bg-brass-hover text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-2xs hover:shadow-xs transition-all whitespace-nowrap"
                title="Access Admissions Admin Panel"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </Link>
            )}

            {role === "client" && currentUser.email !== "alrawiweb@gmail.com" ? (
              <Link
                href="/intake"
                className="hidden md:inline-flex items-center gap-1.5 bg-primary hover:bg-slate-dark text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md min-h-[40px] whitespace-nowrap btn-editorial"
              >
                <span>Get Legal Help</span>
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {/* Global Search Dialog Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
          <div className="bg-surface rounded-xl border border-hairline shadow-editorial w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-hairline flex items-center gap-3">
              <Search className="w-5 h-5 text-on-surface-variant shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search by legal issue, state, or lawyer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none text-on-surface placeholder:text-outline-variant"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low"
              >
                <X className="w-4 h-4 text-on-surface-variant" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <p className="text-xs uppercase tracking-wider text-on-surface-variant font-medium">Quick Suggestions</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href="/lawyers?q=employment"
                  onClick={() => setShowSearchModal(false)}
                  className="px-3 py-1.5 rounded bg-surface-container-low text-xs text-primary hover:bg-surface-container transition-colors"
                >
                  Employment & Severance
                </Link>
                <Link
                  href="/lawyers?q=corporate"
                  onClick={() => setShowSearchModal(false)}
                  className="px-3 py-1.5 rounded bg-surface-container-low text-xs text-primary hover:bg-surface-container transition-colors"
                >
                  Corporate Defense
                </Link>
                <Link
                  href="/lawyers?q=unpaid"
                  onClick={() => setShowSearchModal(false)}
                  className="px-3 py-1.5 rounded bg-surface-container-low text-xs text-primary hover:bg-surface-container transition-colors flex items-center gap-1"
                >
                  <Scale className="w-3.5 h-3.5 text-brass" /> Unpaid Wages &amp; Overtime
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
