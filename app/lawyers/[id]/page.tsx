"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Gavel,
  Award,
  ShieldCheck,
  Mail,
  Phone,
  FileText,
  Share2,
  Edit3,
  Scale,
  Clock,
  X,
} from "lucide-react";
import { getLawyerById } from "@/lib/data/lawyers";
import { getOrCreateConsultationForLawyer } from "@/lib/data/consultations";
import { Lawyer, IntakeAssessment } from "@/types";
import { useUserRole } from "@/lib/context/RoleContext";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LawyerProfileDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { role, activeLawyer, setMyLawyerProfile, currentUser } = useUserRole();
  const [lawyer, setLawyer] = useState<Lawyer | null | undefined>(undefined);
  const [intakeData, setIntakeData] = useState<IntakeAssessment | null>(null);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("Tomorrow, 10:00 AM IST");
  const [consultationType, setConsultationType] = useState<"video" | "phone">("video");

  // Edit Profile Modal State (for lawyers)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    title: "",
    hourlyRate: 2500,
    jurisdiction: "",
    bio: "",
  });

  useEffect(() => {
    const found = getLawyerById(resolvedParams.id);
    setLawyer(found || null);
    if (found) {
      setEditForm({
        name: found.name,
        title: found.title,
        hourlyRate: found.hourlyRate,
        jurisdiction: found.jurisdiction,
        bio: found.bio,
      });
    }

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("advocato_latest_intake");
      if (saved) {
        try {
          setIntakeData(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, [resolvedParams.id]);

  const isOwnProfile = role === "lawyer" && (activeLawyer?.id === lawyer?.id || !activeLawyer);

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert("Profile link copied to clipboard!");
    }
  };

  const handleOpenBooking = () => {
    setShowBookingModal(true);
  };

  const confirmBooking = () => {
    if (!lawyer) return;
    const consultation = getOrCreateConsultationForLawyer({
      lawyerId: lawyer.id,
      clientName: currentUser.name,
      caseTitle: intakeData?.caseTitle,
      intakeBrief: intakeData?.rawText || intakeData?.summary,
      opposingParty: intakeData?.opposingParty,
      jurisdiction: intakeData?.jurisdiction,
      appointmentDate: selectedDate,
      consultationType: consultationType,
      documents: intakeData?.documents,
    });
    setShowBookingModal(false);
    router.push(`/messages?id=${consultation.id}`);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lawyer) return;

    const updatedLawyer: Lawyer = {
      ...lawyer,
      name: editForm.name,
      title: editForm.title,
      hourlyRate: Number(editForm.hourlyRate),
      jurisdiction: editForm.jurisdiction,
      bio: editForm.bio,
    };

    setLawyer(updatedLawyer);
    setMyLawyerProfile(updatedLawyer);
    setShowEditModal(false);
  };

  if (lawyer === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-xs text-on-surface-variant animate-pulse">Loading profile...</div>
      </div>
    );
  }

  if (lawyer === null) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh] max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-brass mb-3">
          <Scale className="w-6 h-6" />
        </div>
        <h1 className="font-headline text-xl font-semibold text-primary mb-1">Attorney Profile Not Found</h1>
        <p className="text-xs text-on-surface-variant mb-6">
          The lawyer profile you are looking for may have been updated or removed.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/lawyers"
            className="bg-primary hover:bg-slate-dark text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-xs"
          >
            Browse Directory
          </Link>
          <Link
            href="/lawyer/register"
            className="border border-hairline hover:bg-surface-container text-primary text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Join as a Lawyer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background pb-24 md:pb-16">
      {/* Top Back Navigation Bar */}
      <div className="bg-surface/80 backdrop-blur-md border-b border-hairline py-3 px-4 sm:px-6 md:px-8 sticky top-16 z-20">
        <div className="max-w-[1240px] mx-auto flex items-center justify-between">
          <Link
            href={role === "lawyer" ? "/" : "/lawyers"}
            className="inline-flex items-center gap-2 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{role === "lawyer" ? "Back to Dashboard" : "Back to Lawyers"}</span>
          </Link>

          <div className="flex items-center gap-3">
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brass text-white text-xs font-semibold hover:bg-brass-hover transition-colors shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit My Profile</span>
              </button>
            )}
            <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
              {isOwnProfile ? "My Public Listing" : "Attorney Profile"}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1240px] w-full mx-auto px-4 sm:px-6 md:px-8 pt-6 flex flex-col gap-8">
        {/* Editorial Profile Header Card */}
        <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl border border-hairline shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-hairline shadow-sm shrink-0">
              <img src={lawyer.avatar} alt={lawyer.name} className="w-full h-full object-cover" />
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl text-primary font-semibold tracking-tight">
                  {lawyer.name}
                </h1>
                {lawyer.isVerified && (
                  <div className="flex items-center gap-1.5 bg-surface-container-low rounded-md px-3 py-1 border border-hairline">
                    <Check className="w-3.5 h-3.5 text-brass stroke-[2.5]" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">Verified Lawyer</span>
                  </div>
                )}
              </div>
              <p className="text-sm sm:text-base text-on-surface-variant font-medium">{lawyer.title}</p>
              <div className="flex items-center gap-3 text-xs text-on-surface-variant pt-1 flex-wrap">
                <span className="flex items-center gap-1.5 text-slate font-semibold">
                  <ShieldCheck className="w-4 h-4 text-brass" />
                  <span>Licensed in {lawyer.jurisdiction}</span>
                </span>
                <span>•</span>
                <span>{lawyer.yearsExperience}+ Years Experience</span>
                <span>•</span>
                <span className="text-emerald-700 font-medium">In Good Standing with State Bar</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
            <button
              onClick={handleShare}
              className="p-2.5 rounded-lg border border-hairline hover:bg-surface-container text-on-surface-variant transition-colors"
              title="Share profile link"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <Link
              href={`/messages?lawyerId=${lawyer.id}`}
              className="bg-primary hover:bg-slate-dark text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-xs min-h-[40px]"
            >
              <Mail className="w-4 h-4" />
              <span>Send Message</span>
            </Link>
          </div>
        </div>

        {/* Main Profile Grid: 8 cols bio/cases, 4 cols booking sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Main Column */}
          <div className="lg:col-span-8 space-y-6 sm:space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-surface-container-lowest border border-hairline rounded-xl shadow-xs">
                <div className="flex items-center gap-1.5 text-brass mb-1">
                  <ShieldCheck className="w-4 h-4 text-brass" />
                  <span className="font-headline text-base sm:text-lg font-bold text-primary">Verified</span>
                </div>
                <span className="text-xs text-on-surface-variant text-center font-medium">Active Bar License</span>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-surface-container-lowest border border-hairline rounded-xl shadow-xs">
                <span className="font-headline text-base sm:text-lg font-bold text-primary mb-1 tabular-nums">
                  {lawyer.yearsExperience}+ Years
                </span>
                <span className="text-xs text-on-surface-variant text-center font-medium">Practice Experience</span>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-surface-container-lowest border border-hairline rounded-xl shadow-xs">
                <Gavel className="w-4 h-4 text-primary mb-1" />
                <span className="text-xs text-on-surface-variant text-center font-medium">{lawyer.jurisdiction}</span>
              </div>
            </div>

            {/* Biography Section */}
            <section className="bg-surface-container-lowest p-6 sm:p-7 rounded-2xl border border-hairline shadow-xs space-y-3">
              <h2 className="font-headline text-lg sm:text-xl text-primary font-semibold">About the Attorney</h2>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed font-normal">{lawyer.bio}</p>
            </section>

            {/* Practice Areas */}
            <section className="bg-surface-container-lowest p-6 sm:p-7 rounded-2xl border border-hairline shadow-xs space-y-3">
              <h2 className="font-headline text-lg sm:text-xl text-primary font-semibold">Practice Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {lawyer.practiceAreas.map((area, idx) => (
                  <span
                    key={idx}
                    className="bg-surface-container text-primary px-3 py-1.5 rounded-md text-xs font-semibold border border-hairline"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </section>

            {/* Notable Case Outcomes */}
            <section className="bg-surface-container-lowest p-6 sm:p-7 rounded-2xl border border-hairline shadow-xs space-y-4">
              <h2 className="font-headline text-lg sm:text-xl text-primary font-semibold">
                Past Case Results &amp; Experience
              </h2>
              <div className="flex flex-col divide-y divide-hairline">
                {lawyer.notableCases.map((outcome, idx) => (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-semibold text-primary">{outcome.title}</h3>
                      <span className="text-xs font-semibold text-brass tabular-nums">{outcome.year}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{outcome.summary}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sticky Booking Sidebar (4 cols on desktop) */}
          <div className="hidden lg:flex lg:col-span-4 flex-col gap-4 sticky top-24">
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-hairline shadow-editorial space-y-5">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant block">
                  Consultation Rate
                </span>
                <div className="text-3xl font-bold text-primary tabular-nums mt-0.5">
                  ₹{lawyer.hourlyRate.toLocaleString("en-IN")} <span className="text-xs font-normal text-on-surface-variant">/ hour</span>
                </div>
                <p className="text-xs text-emerald-700 font-medium mt-1">✓ Available today • 100% Confidential</p>
              </div>

              <div className="border-t border-hairline pt-4 space-y-2.5 text-xs text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brass shrink-0" />
                  <span>30-Minute Initial Private Consultation</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brass shrink-0" />
                  <span>Protected by Attorney-Client Privilege</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brass shrink-0" />
                  <span>Document Review Included</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenBooking}
                className="w-full bg-brass hover:bg-brass-hover text-white text-sm font-semibold py-3.5 px-6 rounded-lg shadow-sm hover:shadow-md btn-editorial-brass flex items-center justify-center gap-2 min-h-[48px]"
              >
                <Calendar className="w-4 h-4" />
                <span>Book a Consultation</span>
              </button>

              <Link
                href={`/messages?lawyerId=${lawyer.id}`}
                className="block text-center text-xs font-medium text-slate hover:text-primary transition-all duration-150 active:scale-95 py-1"
              >
                Send Private Message &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Floating Bar on Mobile */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 p-4 bg-surface/95 backdrop-blur-xl border-t border-hairline z-30 shadow-editorial">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-on-surface-variant">Rate</span>
            <span className="text-sm font-bold text-primary">₹{lawyer.hourlyRate.toLocaleString("en-IN")} / hr</span>
          </div>
          <button
            type="button"
            onClick={handleOpenBooking}
            className="bg-brass hover:bg-brass-hover text-white text-xs font-semibold px-6 py-3 rounded-lg shadow-sm hover:shadow-md btn-editorial-brass flex items-center gap-2 min-h-[44px]"
          >
            <span>Book a Consultation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Booking Slot Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-hairline shadow-editorial w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-hairline">
              <img
                src={lawyer.avatar}
                alt={lawyer.name}
                className="w-12 h-12 rounded-full object-cover border border-hairline"
              />
              <div>
                <h3 className="font-headline text-lg font-semibold text-primary">{lawyer.name}</h3>
                <span className="text-xs text-on-surface-variant">{lawyer.title}</span>
                <div className="text-xs font-semibold text-brass mt-0.5">₹{lawyer.hourlyRate.toLocaleString("en-IN")}/hr consultation</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-2">
                  Consultation Format
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
                    <span className="block text-[10px] font-normal opacity-70 mt-0.5">Direct dial-in conference</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-2">
                  Choose an Appointment Time
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
                  <span className="text-brass">₹{lawyer.hourlyRate.toLocaleString("en-IN")} / hr</span>
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

      {/* Edit Profile Modal (for lawyers) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-hairline shadow-editorial w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-hairline mb-4">
              <h3 className="font-headline text-lg font-semibold text-primary">Edit Attorney Profile</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-on-surface-variant hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-primary mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-slate"
                />
              </div>

              <div>
                <label className="block font-semibold text-primary mb-1">Professional Title / Headline</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-slate"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-primary mb-1">Hourly Consultation Rate (₹ INR)</label>
                  <input
                    type="number"
                    required
                    value={editForm.hourlyRate}
                    onChange={(e) => setEditForm({ ...editForm, hourlyRate: Number(e.target.value) })}
                    className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-slate"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-primary mb-1">Jurisdiction / State Bar Council</label>
                  <input
                    type="text"
                    required
                    value={editForm.jurisdiction}
                    onChange={(e) => setEditForm({ ...editForm, jurisdiction: e.target.value })}
                    className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-slate"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-primary mb-1">Attorney Biography</label>
                <textarea
                  rows={4}
                  required
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full bg-surface border border-hairline rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-slate resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg border border-hairline text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-brass text-white font-semibold hover:bg-brass-hover shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
