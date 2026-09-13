"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, Calendar, ArrowRight, Filter, ShieldCheck, Clock, X, FileText, Scale, Sparkles, RefreshCw } from "lucide-react";
import { getAllLawyers } from "@/lib/data/lawyers";
import { getOrCreateConsultationForLawyer } from "@/lib/data/consultations";
import { Lawyer, IntakeAssessment } from "@/types";
import { useUserRole } from "@/lib/context/RoleContext";

function MatchedLawyersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role, currentUser } = useUserRole();
  const [selectedPractice, setSelectedPractice] = useState<string>("all");
  const [selectedAvailability, setSelectedAvailability] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recommended");
  const [intakeData, setIntakeData] = useState<IntakeAssessment | null>(null);
  const [lawyersList, setLawyersList] = useState<Lawyer[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Booking modal state
  const [bookingLawyer, setBookingLawyer] = useState<Lawyer | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("Tomorrow, 10:00 AM EST");
  const [consultationType, setConsultationType] = useState<string>("video");

  useEffect(() => {
    setLawyersList(getAllLawyers());
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("advocato_latest_intake");
      if (saved) {
        try {
          setIntakeData(JSON.parse(saved));
        } catch (e) {}
      }
    }
    setIsLoaded(true);
  }, []);

  const matchMap = new Map(
    intakeData?.matchedLawyers?.map((m) => [m.lawyerId, m]) || []
  );

  // Filter: In client mode with an intake assessment, ONLY show lawyers who qualify for this case!
  const candidateLawyers = (role === "client" && intakeData)
    ? lawyersList.filter((l) => {
        const match = matchMap.get(l.id);
        if (match && match.matchScore >= 75) return true;
        if (l.practiceAreas?.some((p) => p.toLowerCase().includes(intakeData.category.toLowerCase()))) {
          return true;
        }
        return false;
      })
    : lawyersList;

  const filteredLawyers = candidateLawyers.filter((l) => {
    if (selectedAvailability === "today" && l.availability !== "Available today") return false;
    if (selectedPractice !== "all" && !l.tags.some((t) => t.toLowerCase().includes(selectedPractice.toLowerCase()))) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "recommended") {
      const scoreA = matchMap.get(a.id)?.matchScore ?? 75;
      const scoreB = matchMap.get(b.id)?.matchScore ?? 75;
      return scoreB - scoreA;
    }
    if (sortBy === "experience") return b.yearsExperience - a.yearsExperience;
    if (sortBy === "rate-asc") return a.hourlyRate - b.hourlyRate;
    if (sortBy === "rate-desc") return b.hourlyRate - a.hourlyRate;
    return 0;
  });

  const confirmBooking = () => {
    if (!bookingLawyer) return;
    const consultation = getOrCreateConsultationForLawyer({
      lawyerId: bookingLawyer.id,
      clientName: currentUser.name,
      caseTitle: intakeData?.caseTitle,
      intakeBrief: intakeData?.rawText || intakeData?.summary,
      opposingParty: intakeData?.opposingParty,
      jurisdiction: intakeData?.jurisdiction,
      appointmentDate: selectedDate,
      consultationType: consultationType as "video" | "phone",
      documents: intakeData?.documents,
    });
    setBookingLawyer(null);
    router.push(`/messages?id=${consultation.id}`);
  };

  const handleClearCaseReview = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("advocato_latest_intake");
      localStorage.removeItem("advocato_intake_data");
    }
    setIntakeData(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 md:px-8 pt-8 pb-32 md:pb-16">
        {/* Header Section */}
        <div className="pb-5 border-b border-hairline mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brass mb-2 px-2.5 py-1 rounded-md bg-surface-container-low border border-hairline">
                <Scale className="w-3.5 h-3.5 text-brass" />
                <span>{role === "lawyer" ? "Lawyer Network Directory" : (intakeData ? "Matched Legal Counsel" : "Available Legal Counsel")}</span>
              </div>
              <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl text-primary font-semibold tracking-tight">
                {role === "lawyer"
                  ? `${filteredLawyers.length} Attorneys in Network`
                  : (intakeData
                      ? `${filteredLawyers.length} ${filteredLawyers.length === 1 ? "Attorney" : "Attorneys"} Matched to Your Case`
                      : `Available Lawyers Ready to Help (${filteredLawyers.length})`)}
              </h1>
              <p className="text-on-surface-variant text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
                {role === "lawyer"
                  ? "Attorney roster & peer network — visible in Lawyer View."
                  : (intakeData
                      ? `Verified counsel licensed in ${intakeData.jurisdiction} specializing in ${intakeData.subCategory || intakeData.category}.`
                      : "Browse verified, state-bar licensed attorneys ready to assist you. Start a free case review anytime for automated matching.")}
              </p>
            </div>

            {/* Desktop Sort Dropdown */}
            <div className="hidden md:flex items-center gap-2 shrink-0 bg-surface-container-low p-1 rounded-lg border border-hairline">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant px-2">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="editorial-select bg-surface-container-lowest border border-hairline rounded-md px-3 py-1.5 text-xs text-primary focus:outline-none focus:border-slate font-semibold"
              >
                <option value="recommended">Best Match</option>
                <option value="experience">Most Experienced</option>
                <option value="rate-asc">Price: Low to High</option>
                <option value="rate-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Unified Desktop Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-5">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 max-w-full">
              <button
                onClick={() => setSelectedAvailability("all")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                  selectedAvailability === "all"
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface-container-low text-primary border border-hairline hover:bg-surface-container"
                }`}
              >
                {role === "lawyer" || !intakeData ? `All Lawyers (${filteredLawyers.length})` : `All Matches (${filteredLawyers.length})`}
              </button>
              <button
                onClick={() => setSelectedAvailability(selectedAvailability === "today" ? "all" : "today")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                  selectedAvailability === "today"
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface-container-low text-primary border border-hairline hover:bg-surface-container"
                }`}
              >
                Available Today
              </button>
              <button
                onClick={() => setSelectedPractice(selectedPractice === "severance" ? "all" : "severance")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                  selectedPractice === "severance"
                    ? "bg-brass text-white shadow-xs"
                    : "bg-surface-container-low text-primary border border-hairline hover:bg-surface-container"
                }`}
              >
                Job &amp; Severance
              </button>
              <button
                onClick={() => setSelectedPractice(selectedPractice === "defense" ? "all" : "defense")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                  selectedPractice === "defense"
                    ? "bg-brass text-white shadow-xs"
                    : "bg-surface-container-low text-primary border border-hairline hover:bg-surface-container"
                }`}
              >
                Business &amp; Contracts
              </button>
            </div>

            {/* Mobile Sort */}
            <div className="flex md:hidden items-center gap-2 w-full justify-between pt-1">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="editorial-select bg-surface-container-lowest border border-hairline rounded-lg px-3 py-1.5 text-xs text-primary focus:outline-none focus:border-slate font-medium"
              >
                <option value="recommended">Best Match</option>
                <option value="experience">Most Experienced</option>
                <option value="rate-asc">Price: Low to High</option>
                <option value="rate-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Clean Prompt Banner when no intake submitted */}
          {!intakeData && role === "client" && (
            <div className="mt-5 p-4 rounded-xl bg-surface-container-lowest border border-hairline shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brass/10 border border-brass/20 flex items-center justify-center text-brass shrink-0">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-primary">Looking for counsel matched to your exact legal issue?</div>
                  <div className="text-[11px] text-on-surface-variant">
                    Explain what happened in plain English to automatically match with verified specialists in your state.
                  </div>
                </div>
              </div>
              <Link
                href="/intake"
                className="text-xs font-semibold text-white bg-brass hover:bg-brass-hover px-4 py-2 rounded-lg shadow-2xs inline-flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <span>Start Free Case Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Case Assessment Summary Banner */}
          {intakeData && (
            <div className="mt-5 p-5 rounded-2xl bg-surface-container-lowest border border-hairline shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-5 animate-in fade-in duration-300">
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-brass/10 border border-brass/20 text-brass uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-brass" /> Case Brief
                  </span>
                  {intakeData.caseTitle && (
                    <span className="text-sm font-bold text-primary">
                      {intakeData.caseTitle}
                    </span>
                  )}
                  <span className="text-xs text-on-surface-variant font-medium">
                    • {intakeData.category} • {intakeData.jurisdiction}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-on-surface leading-relaxed italic font-serif">
                  "{intakeData.summary}"
                </p>

                {/* Document Badges */}
                {intakeData.documents && intakeData.documents.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1.5">
                    <span className="text-[11px] uppercase font-semibold text-on-surface-variant tracking-wider">
                      Attached Files:
                    </span>
                    {intakeData.documents.map((d, dIdx) => (
                      <span
                        key={dIdx}
                        className="inline-flex items-center gap-1.5 bg-surface-container-low border border-hairline px-2.5 py-1 rounded-md text-xs font-medium text-primary shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-brass" />
                        <span>{d.name}</span>
                        <span className="text-[10px] text-on-surface-variant">({d.size})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                <Link
                  href="/intake"
                  className="text-xs font-semibold text-brass hover:text-brass-hover inline-flex items-center gap-1.5 bg-surface-container-low border border-hairline px-3.5 py-2 rounded-lg shadow-2xs hover:shadow-xs transition-all min-h-[38px]"
                >
                  <span>Edit Case</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={handleClearCaseReview}
                  className="text-xs font-medium text-on-surface-variant hover:text-red-700 inline-flex items-center gap-1 bg-surface-container-low border border-hairline px-3.5 py-2 rounded-lg transition-colors min-h-[38px]"
                  title="Clear this case review from local storage"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lawyer Cards Grid */}
        {filteredLawyers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLawyers.map((lawyer, idx) => {
              const matchInfo = matchMap.get(lawyer.id);
              const isTopMatch = idx === 0 && sortBy === "recommended" && Boolean(intakeData && matchInfo && matchInfo.matchScore >= 80);

              return (
                <div
                  key={lawyer.id}
                  className={`bg-surface-container-lowest rounded-xl border p-5 sm:p-6 flex flex-col justify-between relative transition-all duration-300 hover:shadow-editorial group ${
                    isTopMatch
                      ? "border-brass/40 shadow-editorial ring-1 ring-brass/20 bg-gradient-to-b from-brass/5 to-surface-container-lowest"
                      : "border-hairline"
                  }`}
                >
                  {/* Top Best Match Ribbon */}
                  {isTopMatch && matchInfo && (
                    <div className="bg-brass text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-t-xl -mx-5 -mt-5 mb-4 sm:-mx-6 sm:-mt-6 flex items-center justify-between shadow-2xs">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                        <span>Best Match for Your Situation</span>
                      </span>
                      <span>{matchInfo.matchScore}% Fit</span>
                    </div>
                  )}

                  <div>
                    {/* Header Profile Photo and Summary */}
                    <div className="flex gap-3.5 sm:gap-4 items-start">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex-shrink-0 overflow-hidden relative border border-hairline shadow-xs">
                        <img
                          src={lawyer.avatar}
                          alt={lawyer.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              href={`/lawyers/${lawyer.id}`}
                              className="font-headline text-base sm:text-lg text-primary font-semibold hover:text-slate transition-colors leading-snug block"
                            >
                              {lawyer.name}
                            </Link>
                            <div className="text-xs text-on-surface-variant font-medium mt-0.5">
                              {lawyer.title}
                            </div>
                          </div>

                          {!isTopMatch && (
                            <div className="shrink-0 pt-0.5">
                              {matchInfo ? (
                                <span className="inline-flex items-center gap-1 bg-brass/10 border border-brass/30 px-2 py-0.5 rounded text-[10px] font-semibold text-brass">
                                  <ShieldCheck className="w-3 h-3 text-brass" />
                                  <span>{matchInfo.matchScore}% Match</span>
                                </span>
                              ) : lawyer.isVerified ? (
                                <span className="inline-flex items-center gap-1 bg-surface-container-low px-2 py-0.5 rounded border border-hairline text-[10px] font-semibold text-primary uppercase tracking-wider">
                                  <Check className="w-3 h-3 text-brass stroke-[2.5]" />
                                  <span>Verified</span>
                                </span>
                              ) : null}
                            </div>
                          )}
                        </div>

                        {/* Jurisdiction & Bar Council */}
                        <div className="text-xs font-medium text-primary mt-1.5 flex items-center gap-1.5 text-wrap">
                          <Scale className="w-3.5 h-3.5 text-brass shrink-0" />
                          <span>{lawyer.jurisdiction}</span>
                        </div>
                      </div>
                    </div>

                    {/* Experience, Rate, and Availability */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs mt-3 pt-2.5 border-t border-hairline/60 text-on-surface">
                      <span className="text-slate font-medium text-[11px] whitespace-nowrap">
                        {lawyer.yearsExperience}+ yrs exp
                      </span>
                      <span className="text-hairline">•</span>
                      <div className="flex items-baseline gap-0.5 whitespace-nowrap">
                        <span className="tabular-nums font-semibold text-primary text-xs sm:text-sm">
                          ₹{lawyer.hourlyRate.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">/ hr</span>
                      </div>
                      <span className="text-hairline">•</span>
                      <span className="text-emerald-700 font-medium text-[11px] flex items-center gap-1 whitespace-nowrap">
                        <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{lawyer.availability}</span>
                      </span>
                    </div>

                    {/* Plain English "Why this lawyer fits" explanation */}
                    {matchInfo?.matchReason && (
                      <div className="mt-3.5 p-3 rounded-lg bg-surface-container-low border border-hairline text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-primary text-[10px] uppercase tracking-wider mb-1">
                          <FileText className="w-3 h-3 text-brass" /> Why this lawyer fits your situation
                        </div>
                        <p className="text-on-surface-variant leading-relaxed text-xs">
                          {matchInfo.matchReason}
                        </p>
                      </div>
                    )}

                    {/* Streamlined Specialties: max 2 tags to avoid badge soup */}
                    <div className="flex flex-wrap gap-1.5 mt-4 pt-3.5 border-t border-hairline">
                      {lawyer.tags.slice(0, 2).map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="bg-surface-container-low text-primary text-[11px] font-medium px-2.5 py-1 rounded-md border border-hairline/60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Clear, Consistent Primary and Secondary Actions */}
                  <div className="mt-5 pt-3 border-t border-hairline/60 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingLawyer(lawyer)}
                      className="w-full bg-brass hover:bg-brass-hover text-white text-xs font-semibold py-3 px-4 rounded-lg shadow-sm hover:shadow-md btn-editorial-brass flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book Consultation (₹{lawyer.hourlyRate.toLocaleString("en-IN")}/hr)</span>
                    </button>
                    <div className="flex items-center justify-center gap-3 text-xs pt-0.5">
                      <Link
                        href={`/messages?lawyerId=${lawyer.id}`}
                        className="font-medium text-brass hover:underline flex items-center gap-1 transition-all duration-150 active:scale-95"
                      >
                        <span>Send Message</span> &rarr;
                      </Link>
                      <span className="text-hairline">•</span>
                      <Link
                        href={`/lawyers/${lawyer.id}`}
                        className="text-on-surface-variant hover:text-primary transition-all duration-150 active:scale-95 font-medium"
                      >
                        Full Profile
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl border border-hairline p-8 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center max-w-xl mx-auto my-6 sm:my-10">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-low border border-hairline flex items-center justify-center text-brass mb-4 shadow-2xs">
              <Scale className="w-7 h-7" />
            </div>
            <h2 className="font-headline text-lg sm:text-xl font-semibold text-primary mb-2">
              No Lawyers Found
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6 max-w-md">
              {lawyersList.length === 0
                ? "No lawyers have joined the network yet. Are you a licensed attorney? Be the first to register."
                : "No lawyers match your current filters. Try adjusting your search or browse all lawyers."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href="/lawyer/register"
                className="bg-primary hover:bg-slate-dark text-white font-semibold text-xs px-6 py-3 rounded-lg flex items-center justify-center gap-2 shadow-sm hover:shadow-md btn-editorial min-h-[44px]"
              >
                <span>Register as a Lawyer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/intake"
                className="border border-hairline hover:bg-surface-container text-primary font-semibold text-xs px-6 py-3 rounded-lg flex items-center justify-center btn-editorial-secondary min-h-[44px]"
              >
                <span>I Need Legal Help</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Booking Slot Modal */}
      {bookingLawyer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-hairline shadow-editorial w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setBookingLawyer(null)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-5 pb-4 border-b border-hairline">
              <img
                src={bookingLawyer.avatar}
                alt={bookingLawyer.name}
                className="w-14 h-14 rounded-full object-cover border border-hairline"
              />
              <div>
                <h3 className="font-headline text-lg font-semibold text-primary">{bookingLawyer.name}</h3>
                <span className="text-xs text-on-surface-variant">{bookingLawyer.title}</span>
                <div className="text-xs font-semibold text-brass mt-0.5">₹{bookingLawyer.hourlyRate.toLocaleString("en-IN")}/hr consultation</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-2">
                  How would you like to talk?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConsultationType("video")}
                    className={`p-3 rounded-lg border text-xs font-semibold text-left transition-all ${
                      consultationType === "video"
                        ? "border-slate bg-surface-container text-primary shadow-xs"
                        : "border-hairline bg-surface-container-lowest text-on-surface-variant"
                    }`}
                  >
                    Video Call
                    <span className="block text-[10px] font-normal opacity-70 mt-0.5">Secure private video</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsultationType("phone")}
                    className={`p-3 rounded-lg border text-xs font-semibold text-left transition-all ${
                      consultationType === "phone"
                        ? "border-slate bg-surface-container text-primary shadow-xs"
                        : "border-hairline bg-surface-container-lowest text-on-surface-variant"
                    }`}
                  >
                    Phone Call
                    <span className="block text-[10px] font-normal opacity-70 mt-0.5">Direct phone call</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-2">
                  Choose a Time
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Tomorrow, 10:00 AM IST",
                    "Tomorrow, 2:30 PM IST",
                    "Thursday, 11:00 AM IST",
                    "Thursday, 4:00 PM IST",
                  ].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedDate(slot)}
                      className={`p-2.5 rounded-lg border text-xs font-medium text-left flex items-center justify-between ${
                        selectedDate === slot
                          ? "border-brass bg-brass/10 text-primary font-semibold"
                          : "border-hairline bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                      }`}
                    >
                      <span>{slot}</span>
                      {selectedDate === slot && <Check className="w-3.5 h-3.5 text-brass" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-surface-container-low rounded-lg border border-hairline text-xs text-on-surface-variant space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-primary">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brass" />
                    <span>30-Minute Consultation</span>
                  </div>
                  <span className="text-brass">₹{bookingLawyer.hourlyRate.toLocaleString("en-IN")} / hr</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Pre-authorized via Escrow • Zero fee until consultation concludes</span>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">
                  100% private and protected by attorney-client confidentiality. Free cancellation up to 2 hours prior to call.
                </p>
              </div>

              <button
                type="button"
                onClick={confirmBooking}
                className="w-full bg-brass hover:bg-brass-hover text-white text-sm font-semibold py-3.5 rounded-lg shadow-editorial transition-transform active:scale-95 flex items-center justify-center gap-2 min-h-[44px]"
              >
                <span>Confirm &amp; Open Chat</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MatchedLawyersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Loading lawyers...</div>}>
      <MatchedLawyersContent />
    </Suspense>
  );
}
