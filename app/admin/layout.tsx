"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Scale,
  ShieldAlert,
  ShieldCheck,
  FolderOpen,
  Users,
  FileCheck,
  History,
  ArrowLeft,
  Lock,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useUserRole } from "@/lib/context/RoleContext";
import { createClient } from "@/lib/supabase/client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, isLoadingAuth, refreshUser } = useUserRole();
  const [isPromoting, setIsPromoting] = useState(false);

  const supabase = createClient();

  // Helper to promote current user to admin in case they aren't marked as admin yet
  const handlePromoteCurrent = async () => {
    if (!currentUser?.id) return;
    setIsPromoting(true);
    try {
      const res = await fetch("/api/admin/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, role: "admin" }),
      });
      if (res.ok) {
        await refreshUser();
      }
    } catch (e) {
      console.error("Promote error:", e);
    } finally {
      setIsPromoting(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-primary">
        <Loader2 className="w-8 h-8 text-brass animate-spin mb-3" />
        <p className="text-xs text-on-surface-variant font-medium">
          Verifying administrative credentials...
        </p>
      </div>
    );
  }

  const isAdmin = currentUser?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
        <div className="bg-surface-container-lowest border border-hairline rounded-2xl p-8 sm:p-10 max-w-lg w-full text-center space-y-5 shadow-editorial">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 mx-auto flex items-center justify-center text-rose-600">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Restricted Access Protocol</span>
            </span>
            <h1 className="font-headline text-2xl font-bold text-primary">
              Admissions Console Restricted
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              This area is strictly restricted to Advocato regulatory officers and admissions panel administrators. Your current account role is{" "}
              <strong className="text-primary font-mono">{currentUser?.role || "guest"}</strong>.
            </p>
          </div>

          <div className="p-4 bg-surface-container-low rounded-xl border border-hairline text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Logged in as:</span>
              <span className="font-semibold text-primary">{currentUser?.email || "Anonymous"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Permission Level:</span>
              <span className="font-mono text-rose-600 font-bold uppercase">{currentUser?.role || "Client"}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={handlePromoteCurrent}
              disabled={isPromoting}
              className="w-full bg-brass hover:bg-brass-hover text-white py-3 px-4 rounded-lg text-xs font-semibold shadow-sm transition-all text-center flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              {isPromoting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Granting Admin Access...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Promote {currentUser?.email || "My Account"} to Admin</span>
                </>
              )}
            </button>

            <Link
              href="/"
              className="w-full bg-transparent border border-hairline text-primary hover:bg-surface-container-low py-2.5 px-4 rounded-lg text-xs font-semibold transition-colors text-center"
            >
              Exit to Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: "Admissions Queue", href: "/admin", icon: FileCheck },
    { label: "Lawyer Directory", href: "/admin/lawyers", icon: Users },
    { label: "Platform Matters", href: "/admin/matters", icon: FolderOpen },
    { label: "Audit Ledger", href: "/admin/audit", icon: History },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      {/* Admin Masthead Bar */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-hairline">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-brass shadow-2xs">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-headline text-base font-bold text-primary tracking-tight">
                  ADVOCATO
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-brass/15 text-brass font-bold border border-brass/30">
                  Admissions Console
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-surface-container-low text-primary font-bold shadow-2xs border border-hairline"
                      : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-brass" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low border border-hairline text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-primary font-semibold text-[11px] truncate max-w-[150px]">
                {currentUser?.email}
              </span>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary border border-hairline px-3 py-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit Console</span>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Sub-bar */}
        <div className="md:hidden flex items-center justify-around border-t border-hairline px-2 py-2 bg-surface-container-lowest overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${
                  isActive
                    ? "bg-surface-container-low text-primary font-bold border border-hairline"
                    : "text-on-surface-variant"
                }`}
              >
                <Icon className="w-3 h-3 text-brass" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Admin Content View */}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
