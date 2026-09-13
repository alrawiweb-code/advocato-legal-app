"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Scale,
  FileText,
  CheckCircle2,
  Lock,
  UserPlus,
  ArrowUpRight,
  FolderOpen,
  MessageSquare,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { getAllLawyers } from "@/lib/data/lawyers";
import { getStoredConsultations } from "@/lib/data/consultations";
import { useUserRole } from "@/lib/context/RoleContext";
import { Lawyer, Consultation } from "@/types";

function LawyerDashboardView() {
  const { activeLawyer, currentUser } = useUserRole();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const list = getStoredConsultations();
    const lawyerMatters = activeLawyer
      ? list.filter((c) => c.lawyer.id === activeLawyer.id)
      : list;
    setConsultations(lawyerMatters);
    let count = 0;
    lawyerMatters.forEach((c) => {
      c.messages?.forEach((m) => {
        if (m.senderRole === "client" && m.status !== "read") count++;
      });
    });
    setUnreadMessages(count);
  }, [activeLawyer]);

  const attorneyName = activeLawyer?.name || currentUser.name || "Counsel";
  const jurisdiction = activeLawyer?.jurisdiction || "State Bar Licensed";
  const practiceArea = activeLawyer?.practiceAreas?.[0] || activeLawyer?.title || "General Legal Counsel";

  return (
    <div className="flex-1 flex flex-col items-center bg-surface w-full">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 pt-8 sm:pt-12 pb-16">
        {/* Masthead Banner */}
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl border border-hairline shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-surface-container-low border border-hairline text-xs font-semibold text-primary mb-3">
              <Scale className="w-3.5 h-3.5 text-brass" />
              <span>Attorney Practice Dashboard</span>
            </div>
            <h1 className="font-headline text-2xl sm:text-4xl text-primary font-semibold tracking-tight">
              Welcome, {attorneyName}
            </h1>
            <div className="text-xs sm:text-sm text-on-surface-variant mt-2 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Active Roster
              </span>
              <span>•</span>
              <span>{jurisdiction}</span>
              <span>•</span>
              <span className="text-primary font-medium">{practiceArea}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={activeLawyer ? `/lawyers/${activeLawyer.id}` : "/cases"}
              className="bg-brass hover:bg-brass-hover text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-xs hover:shadow-md btn-editorial-brass flex items-center gap-2 min-h-[42px]"
            >
              <UserCheck className="w-4 h-4" />
              <span>{activeLawyer ? "View Public Profile" : "Active Matters"}</span>
            </Link>
            <Link
              href="/cases"
              className="border border-hairline hover:bg-surface-container text-primary text-xs font-semibold px-5 py-2.5 rounded-lg btn-editorial-secondary flex items-center gap-2 min-h-[42px]"
            >
              <FolderOpen className="w-3.5 h-3.5 text-brass" />
              <span>Manage Cases</span>
            </Link>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-hairline shadow-xs">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Client Cases</span>
              <FolderOpen className="w-4 h-4 text-slate" />
            </div>
            <div className="font-headline text-2xl sm:text-3xl font-bold text-primary">
              {consultations.length}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">Cases currently assigned to you</p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-xl border border-hairline shadow-xs">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Unread Messages</span>
              <MessageSquare className="w-4 h-4 text-brass" />
            </div>
            <div className="font-headline text-2xl sm:text-3xl font-bold text-primary">
              {unreadMessages}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">Client messages requiring attention</p>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-xl border border-hairline shadow-xs">
            <div className="flex items-center justify-between text-on-surface-variant mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Consultation Rate</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="font-headline text-2xl sm:text-3xl font-bold text-primary">
              ₹{(activeLawyer?.hourlyRate || 3500).toLocaleString("en-IN")} <span className="text-xs font-normal text-on-surface-variant">/ hr</span>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">Your published consultation rate</p>
          </div>
        </div>

        {/* Recent Client Consultations List */}
        <div className="bg-surface-container-lowest rounded-2xl border border-hairline p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-hairline mb-6">
            <div>
              <h2 className="font-headline text-lg sm:text-xl font-semibold text-primary">
                Client Consultations &amp; Inquiries
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Review case matters, message clients directly, and conduct privileged video consultations.
              </p>
            </div>
            <Link
              href="/cases"
              className="text-xs font-semibold text-brass hover:underline flex items-center gap-1"
            >
              <span>All Cases</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {consultations.length === 0 ? (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-xl bg-surface-container-low border border-hairline flex items-center justify-center text-brass mb-3 shadow-2xs">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="font-headline text-base font-semibold text-primary mb-1">
                No Client Inquiries Yet
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
                When a client submits a legal situation matching your practice area in {jurisdiction}, their case will appear here for your review.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link
                  href="/cases"
                  className="bg-primary hover:bg-slate-dark text-white font-semibold text-xs px-6 py-3 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors btn-editorial"
                >
                  <FolderOpen className="w-4 h-4 text-brass" />
                  <span>View All Case Dockets</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-hairline">
              {/* Desktop Data Grid Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-4 pb-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant px-2">
                <span className="col-span-4">Client</span>
                <span className="col-span-4">Case Topic</span>
                <span className="col-span-2">Activity</span>
                <span className="col-span-2 text-right">Actions</span>
              </div>

              {consultations.map((c) => (
                <div
                  key={c.id}
                  className="py-4 px-2 hover:bg-surface-container-low/40 rounded-lg transition-colors flex flex-col md:grid md:grid-cols-12 md:gap-4 md:items-center justify-between gap-3"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                      {(c.clientName || "CL").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-headline text-sm font-semibold text-primary truncate">
                        {c.clientName || "Client"}
                      </h4>
                      <span className="text-[10px] font-mono text-brass bg-brass/10 px-1.5 py-0.5 rounded font-semibold">
                        {c.matterNumber}
                      </span>
                    </div>
                  </div>

                  <div className="col-span-4 min-w-0">
                    <p className="text-xs font-semibold text-primary truncate">{c.caseTitle}</p>
                    <span className="text-[11px] text-on-surface-variant block truncate">Employment / Contract Matter</span>
                  </div>

                  <div className="col-span-2 text-xs text-on-surface-variant">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {c.messages?.length || 0} messages
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <Link
                      href={`/messages?id=${c.id}`}
                      className="bg-primary hover:bg-slate-dark text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs hover:shadow-md btn-editorial min-h-[36px]"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClientHomeView() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);

  useEffect(() => {
    setLawyers(getAllLawyers());
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center bg-surface">
      {/* Editorial Masthead Hero Container */}
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 md:px-8 pt-8 sm:pt-14 md:pt-20 pb-12 sm:pb-18 flex flex-col items-center">
        {/* Reassuring Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-low border border-hairline mb-5 sm:mb-8 text-[11px] font-semibold tracking-wider uppercase text-primary shadow-2xs">
          <Scale className="w-3.5 h-3.5 text-brass" />
          <span>Trusted Legal Help • 100% Confidential • Licensed State Bar Attorneys</span>
        </div>

        {/* Hero Typography */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-primary font-semibold tracking-tight leading-[1.12]">
            Have a problem at work
            <br />
            <span className="text-on-surface-variant font-normal text-xl sm:text-2xl md:text-3xl lg:text-4xl">
              or with a contract?
            </span>
          </h1>
          <p className="text-on-surface-variant text-xs sm:text-sm md:text-base max-w-2xl mx-auto pt-1 sm:pt-2 font-normal leading-relaxed">
            Explain what happened in plain English. We match you with verified, licensed attorneys ready to help today. Free consultation matching, zero commitment.
          </p>
        </div>

        {/* Streamlined Action Buttons */}
        <div className="w-full max-w-md mx-auto flex flex-col sm:flex-row gap-3.5 pt-6 sm:pt-8">
          <Link
            href="/intake"
            className="flex-1 bg-primary hover:bg-slate-dark text-white font-semibold text-xs sm:text-sm rounded-lg py-3.5 px-7 flex items-center justify-center gap-2 shadow-sm hover:shadow-md btn-editorial group min-h-[48px]"
          >
            <span>Start Free Case Review</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/#how-it-works"
            className="flex-1 bg-surface border border-hairline hover:bg-surface-container text-primary font-semibold text-xs sm:text-sm rounded-lg py-3.5 px-7 flex items-center justify-center gap-1.5 btn-editorial-secondary min-h-[48px]"
          >
            <span>How Matching Works</span>
            <ArrowRight className="w-4 h-4 text-on-surface-variant" />
          </Link>
        </div>

        <div className="text-center mt-4 sm:mt-5">
          <Link
            href="/lawyer/register"
            className="inline-flex items-center gap-1 text-xs font-medium text-on-surface-variant hover:text-primary transition-colors underline underline-offset-4"
          >
            <span>Are you a licensed attorney? Join our verified network &rarr;</span>
          </Link>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="w-full max-w-5xl mt-14 sm:mt-16 pt-10 sm:pt-12 border-t border-hairline">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column (7 cols): How It Works */}
            <div className="lg:col-span-7 bg-surface-container-lowest p-6 sm:p-8 rounded-lg border border-hairline shadow-dossier flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-hairline mb-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brass block">
                      HOW IT WORKS
                    </span>
                    <h2 className="font-headline text-xl font-semibold text-primary mt-0.5">
                      3 Simple Steps to Get Help
                    </h2>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-surface-container-low border border-hairline text-slate">
                    Fast &amp; Free
                  </span>
                </div>

                <div className="space-y-5">
                  <div className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-md bg-surface-container flex items-center justify-center text-primary font-semibold text-xs shrink-0 mt-0.5 border border-hairline">
                      01
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">
                        Tell us what happened
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                        Explain your situation in plain English. Attach any contracts, letters, or emails if you have them. No legal knowledge needed.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-md bg-surface-container flex items-center justify-center text-primary font-semibold text-xs shrink-0 mt-0.5 border border-hairline">
                      02
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">
                        We find the right lawyer
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                        Our system reviews your situation and matches you with verified attorneys who specialize in your exact issue in your state.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-7 h-7 rounded-md bg-surface-container flex items-center justify-center text-primary font-semibold text-xs shrink-0 mt-0.5 border border-hairline">
                      03
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">
                        Connect and talk directly
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                        See upfront hourly prices, read why each lawyer is a great fit, and start a private chat or video call right from your phone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-hairline flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">Takes only 2 minutes.</span>
                <Link
                  href="/intake"
                  className="text-xs font-semibold text-brass hover:text-brass-hover inline-flex items-center gap-1"
                >
                  <span>Start now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Column (5 cols): Trust & Safety */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-surface-container-lowest p-6 rounded-lg border border-hairline shadow-xs flex-1 flex flex-col justify-center">
                <div className="w-9 h-9 rounded-md bg-surface-container flex items-center justify-center text-brass mb-3 border border-hairline">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-headline text-base font-semibold text-primary">100% Verified Lawyers</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                  Every attorney is actively licensed, in good standing with their state bar, and background-checked for quality.
                </p>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-lg border border-hairline shadow-xs flex-1 flex flex-col justify-center">
                <div className="w-9 h-9 rounded-md bg-surface-container flex items-center justify-center text-brass mb-3 border border-hairline">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-headline text-base font-semibold text-primary">Completely Private</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                  Everything you share is strictly confidential between you and the lawyers. Your information is never sold or shared.
                </p>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-lg border border-hairline shadow-xs flex-1 flex flex-col justify-center">
                <div className="w-9 h-9 rounded-md bg-surface-container flex items-center justify-center text-brass mb-3 border border-hairline">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-headline text-base font-semibold text-primary">Clear, Upfront Prices</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                  See exact hourly rates and fees before you book a consultation. Zero hidden charges or unexpected bills.
                </p>
              </div>
            </div>
          </div>

          {/* Featured Lawyers Strip */}
          <div className="mt-14 sm:mt-16 pt-10 sm:pt-12 border-t border-hairline">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-brass block">
                  FEATURED ATTORNEYS
                </span>
                <h2 className="font-headline text-xl font-semibold text-primary mt-0.5">
                  {lawyers.length > 0
                    ? `Available Lawyers Ready to Help (${lawyers.length})`
                    : "No Lawyers Available Yet"}
                </h2>
              </div>
              {lawyers.length > 0 && (
                <Link
                  href="/lawyers"
                  className="text-xs font-semibold text-slate hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  <span>View All Lawyers</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {lawyers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {lawyers.slice(0, 3).map((lawyer) => (
                  <Link
                    key={lawyer.id}
                    href={`/lawyers/${lawyer.id}`}
                    className="bg-surface-container-lowest p-5 rounded-lg border border-hairline hover:border-slate/40 transition-all shadow-xs flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-3.5 pb-3 border-b border-hairline">
                        <img
                          src={lawyer.avatar}
                          alt={lawyer.name}
                          className="w-12 h-12 rounded-full object-cover border border-hairline"
                        />
                        <div className="min-w-0">
                          <span className="font-headline text-base font-semibold text-primary block truncate group-hover:text-slate">
                            {lawyer.name}
                          </span>
                          <span className="text-[11px] text-on-surface-variant font-medium block truncate">
                            {lawyer.jurisdiction}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 space-y-1">
                        <div className="text-xs font-medium text-on-surface line-clamp-1">
                          {lawyer.title}
                        </div>
                        <div className="text-[11px] text-on-surface-variant">
                          {lawyer.yearsExperience}+ years trial &amp; negotiation experience
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-hairline flex items-center justify-between text-xs">
                      <span className="font-semibold text-primary tabular-nums">
                        ₹{lawyer.hourlyRate.toLocaleString("en-IN")} <span className="text-[10px] text-on-surface-variant font-normal">/ hr</span>
                      </span>
                      <span className="text-xs font-medium text-slate group-hover:underline inline-flex items-center gap-0.5">
                        <span>Profile</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-xl border border-hairline p-8 sm:p-10 text-center shadow-xs flex flex-col items-center max-w-xl mx-auto">
                <div className="w-12 h-12 rounded-xl bg-surface-container-low border border-hairline flex items-center justify-center text-brass mb-3 shadow-2xs">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="font-headline text-base font-semibold text-primary mb-1.5">
                  Be the First Lawyer on Advocato
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-5 max-w-sm">
                  Licensed attorneys can join our verified network and connect with clients who need legal help. Registration takes under 3 minutes.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Link
                    href="/lawyer/register"
                    className="bg-brass hover:bg-brass-hover text-white font-semibold text-xs px-5 py-3 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors min-h-[44px]"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Register as a Lawyer</span>
                  </Link>
                  <Link
                    href="/intake"
                    className="border border-hairline hover:bg-surface-container text-primary font-semibold text-xs px-5 py-3 rounded-lg flex items-center justify-center transition-colors min-h-[44px]"
                  >
                    <span>I Need Legal Help</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { role } = useUserRole();

  if (role === "lawyer") {
    return <LawyerDashboardView />;
  }

  return <ClientHomeView />;
}
