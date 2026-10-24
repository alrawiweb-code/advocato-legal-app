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
  ShieldCheck,
  FileText,
  Share2,
  Edit3,
  Scale,
  Clock,
  X,
  MapPin,
  Globe,
  Briefcase,
  Sparkles,
  Lock,
  AlertTriangle,
  CheckCircle,
  ShieldAlert
} from "lucide-react";

import { createOrGetMatter } from "@/lib/supabase/matters";
import { Lawyer, IntakeAssessment, LawyerReview } from "@/types";
import { useUserRole, getInitialsAvatar } from "@/lib/context/RoleContext";
import StarRating from "@/components/marketplace/StarRating";
import ReviewsList from "@/components/marketplace/ReviewsList";
import { PriceRequestModal } from "@/components/lawyer/PriceRequestModal";
import { EditProfileModal } from "@/components/lawyer/EditProfileModal";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function LawyerProfileDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { role, activeLawyer, setMyLawyerProfile, currentUser } = useUserRole();
  
  const [lawyer, setLawyer] = useState<Lawyer | null | undefined>(undefined);
  const [reviews, setReviews] = useState<LawyerReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [intakeData, setIntakeData] = useState<IntakeAssessment | null>(null);

  // Profile status state — drives which screen to render
  type ProfileStatus = "loading" | "found" | "not_found" | "own_profile_pending";
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("loading");
  const [ownVerificationStatus, setOwnVerificationStatus] = useState<string | null>(null);

  // Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [consultationType, setConsultationType] = useState<"video" | "phone">("video");
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingSuccessNotice, setBookingSuccessNotice] = useState<string | null>(null);

  // Edit Profile Modal State (for lawyers)
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPriceRequestModal, setShowPriceRequestModal] = useState(false);

  useEffect(() => {
    const fetchLawyer = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/lawyers/${resolvedParams.id}`);
        if (res.ok) {
          // Profile data returned (or private preview for own unverified profile)
          const data = await res.json();
          setLawyer(data);
          setProfileStatus("found");
        } else if (res.status === 401) {
          // Unauthenticated — redirect to login
          router.push(`/login?redirect=/lawyers/${resolvedParams.id}`);
        } else if (res.status === 403) {
          // Case B: Own unverified profile — show pending screen
          const data = await res.json();
          if (data.error === "profile_not_public" && data.isOwnProfile) {
            setOwnVerificationStatus(data.verificationStatus);
            setProfileStatus("own_profile_pending");
          } else {
            setProfileStatus("not_found");
          }
        } else {
          // Case A: Genuine 404 — lawyer does not exist
          setProfileStatus("not_found");
        }
      } catch (e) {
        console.error("Failed to load lawyer", e);
        setLawyer(null);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await fetch(`/api/lawyers/${resolvedParams.id}/reviews`);
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews || []);
        }
      } catch (e) {
        console.error("Failed to load reviews", e);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchLawyer();
    fetchReviews();

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("advocato_latest_intake");
      if (saved) {
        try {
          setIntakeData(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, [resolvedParams.id, router]);

  const isOwnProfile = Boolean(
    activeLawyer?.id === lawyer?.id ||
    currentUser?.id === lawyer?.id ||
    (lawyer as any)?.isOwnProfile
  );

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert("Profile link copied to clipboard!");
    }
  };

  const handleOpenBooking = () => {
    if (role === "client") {
      if (!lawyer?.hourlyRate || lawyer.hourlyRate <= 0) {
        alert("This lawyer is currently unavailable for new bookings.");
        return;
      }
      setShowBookingModal(true);
    } else {
      alert("Only clients can book consultations.");
    }
  };

  const confirmBooking = async () => {
    if (!lawyer || !lawyer.hourlyRate || lawyer.hourlyRate <= 0) return;
    if (!selectedDate) {
      setBookingError("Please select a date and time for the consultation.");
      return;
    }

    setIsBookingSubmitting(true);
    setBookingError(null);

    try {
      // Convert browser datetime-local to canonical ISO 8601 string with timezone
      const appointmentDateIso = new Date(selectedDate).toISOString();

      const { matter, error } = await createOrGetMatter({
        lawyerId: lawyer.id,
        caseTitle: intakeData?.caseTitle || `Consultation with ${lawyer.name}`,
        category: intakeData?.category || lawyer.practiceAreas?.[0] || "General Legal Counsel",
        jurisdiction: intakeData?.jurisdiction || lawyer.jurisdiction || "Delhi (DL)",
        urgency: intakeData?.urgency || "Medium",
        appointmentDate: appointmentDateIso,
        consultationType: consultationType,
      });

      if (error || !matter) {
        setBookingError(error || "Failed to submit consultation request. Please try again.");
        setIsBookingSubmitting(false);
        return;
      }

      setBookingSuccessNotice(
        `Consultation Request Submitted — Awaiting confirmation from Advocate ${lawyer.name}`
      );

      // Brief delay so user sees confirmation before navigation
      setTimeout(() => {
        setShowBookingModal(false);
        router.push(`/messages?matterId=${matter.id}`);
      }, 1200);
    } catch (e: any) {
      setBookingError(e?.message || "An unexpected error occurred while processing your booking.");
      setIsBookingSubmitting(false);
    }
  };



  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-background pt-8 pb-32">
        <div className="max-w-[960px] w-full mx-auto px-4 md:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-40 bg-surface-container rounded-2xl"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-32 bg-surface-container rounded-2xl"></div>
                <div className="h-48 bg-surface-container rounded-2xl"></div>
              </div>
              <div className="h-64 bg-surface-container rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Case A: Lawyer genuinely does not exist or was deleted
  if (profileStatus === "not_found") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background py-20 px-4">
        <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-6">
          <Scale className="w-8 h-8 text-outline" />
        </div>
        <h1 className="text-2xl font-headline font-semibold text-primary mb-2">Lawyer Not Found</h1>
        <p className="text-on-surface-variant mb-6 text-center max-w-md">
          The lawyer profile you are looking for does not exist or has been removed from the platform.
        </p>
        <Link href="/lawyers" className="btn-editorial bg-primary text-white px-6 py-3 rounded-lg">
          Back to Directory
        </Link>
      </div>
    );
  }

  // Case B: Lawyer exists but their own profile is not yet publicly visible
  if (profileStatus === "own_profile_pending") {
    const vs = ownVerificationStatus;

    const headline =
      vs === "NOT_VERIFIED"
        ? "Verification Required"
        : vs === "PENDING" || vs === "SUBMITTED" || vs === "UNDER_REVIEW"
        ? "Verification Under Review"
        : vs === "DOCUMENTS_REQUIRED"
        ? "Documents Required"
        : vs === "REJECTED"
        ? "Application Requires Attention"
        : vs === "SUSPENDED"
        ? "Profile Suspended"
        : "Profile Not Yet Active";

    const body =
      vs === "NOT_VERIFIED"
        ? "You haven't yet completed your professional bar verification. Your public profile will go live once your credentials have been reviewed and approved by the Admissions desk."
        : vs === "PENDING" || vs === "SUBMITTED" || vs === "UNDER_REVIEW"
        ? "Your bar enrollment certificate and credentials are currently under review by the Advocato Admissions desk. Your public profile will become available upon approval."
        : vs === "DOCUMENTS_REQUIRED"
        ? "The Admissions desk has requested additional documents to complete your verification. Please check your dashboard for details and resubmit."
        : vs === "REJECTED"
        ? "Your verification application requires revision. Please review the feedback from the Admissions desk and resubmit your updated credentials."
        : vs === "SUSPENDED"
        ? "Your marketplace profile has been temporarily suspended. Please contact Advocato support for further assistance."
        : "Your public profile is not currently active. Please check your dashboard for more information.";

    const statusBadgeColor =
      vs === "NOT_VERIFIED"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : vs === "PENDING" || vs === "SUBMITTED" || vs === "UNDER_REVIEW"
        ? "bg-blue-50 text-blue-800 border-blue-200"
        : vs === "DOCUMENTS_REQUIRED"
        ? "bg-orange-50 text-orange-800 border-orange-200"
        : vs === "REJECTED"
        ? "bg-rose-50 text-rose-800 border-rose-200"
        : vs === "SUSPENDED"
        ? "bg-red-50 text-red-800 border-red-200"
        : "bg-surface-container text-on-surface-variant border-hairline";

    const IconComponent =
      vs === "REJECTED" || vs === "SUSPENDED" ? AlertTriangle
      : vs === "PENDING" || vs === "SUBMITTED" || vs === "UNDER_REVIEW" ? Clock
      : Lock;

    const iconColor =
      vs === "SUSPENDED" ? "text-red-600"
      : vs === "REJECTED" ? "text-rose-600"
      : vs === "PENDING" || vs === "SUBMITTED" || vs === "UNDER_REVIEW" ? "text-blue-500"
      : "text-brass";

    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background py-20 px-4">
        <div className="w-full max-w-md text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-surface-container-low border border-hairline mx-auto flex items-center justify-center">
            <IconComponent className={`w-9 h-9 ${iconColor}`} />
          </div>

          {/* Status Badge */}
          <div className="flex justify-center">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusBadgeColor}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
              {vs?.replace(/_/g, " ")}
            </span>
          </div>

          {/* Headline & Body */}
          <div className="space-y-3">
            <h1 className="font-headline text-2xl sm:text-3xl font-semibold text-primary tracking-tight">
              {headline}
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed max-w-sm mx-auto">
              {body}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-hairline" />

          {/* Trust Note */}
          <p className="text-xs text-on-surface-variant flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brass shrink-0" />
            Your profile data is secure and will be available once verified.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="w-full sm:w-auto btn-editorial bg-primary text-white px-6 py-3 rounded-lg text-sm font-semibold text-center"
            >
              Back to Dashboard
            </Link>
            {(vs === "NOT_VERIFIED" || vs === "DOCUMENTS_REQUIRED" || vs === "REJECTED") && (
              <Link
                href="/lawyer/verify"
                className="w-full sm:w-auto btn-editorial-brass bg-brass text-white px-6 py-3 rounded-lg text-sm font-semibold text-center"
              >
                {vs === "REJECTED" ? "Resubmit Credentials" : vs === "DOCUMENTS_REQUIRED" ? "Upload Documents" : "Apply for Verification"}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!lawyer) return null;

  const matchInfo = intakeData?.matchedLawyers?.find(m => m.lawyerId === lawyer.id);

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Administrator Inspection Banner */}
      {(role === "admin" || (lawyer as any)?.isAdminInspection) && lawyer && (
        <div className="bg-slate-900 text-white px-4 py-3 text-xs sm:text-sm sticky top-16 z-20 shadow-md">
          <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-bold uppercase tracking-wider text-[11px] border border-amber-500/30">
                <ShieldAlert className="w-3.5 h-3.5" /> Administrator Inspection View
              </span>
              <span className="text-slate-300">
                Verification: <strong className="text-white">{lawyer.verificationStatus || (lawyer.isVerified ? "VERIFIED" : "NOT_VERIFIED")}</strong>
              </span>
              {(lawyer as any)?.barNumber && (
                <span className="text-slate-300">
                  • Bar No: <strong className="font-mono text-white">{(lawyer as any).barNumber}</strong>
                </span>
              )}
              {(lawyer as any)?.suspensionReason && lawyer.verificationStatus === "SUSPENDED" && (
                <span className="text-orange-300">
                  • Suspension Reason: <em>{(lawyer as any).suspensionReason}</em>
                </span>
              )}
              {(lawyer as any)?.rejectionReason && lawyer.verificationStatus === "REJECTED" && (
                <span className="text-rose-300">
                  • Rejection Reason: <em>{(lawyer as any).rejectionReason}</em>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Queue
              </Link>
              {(lawyer as any)?.applicationId ? (
                <Link
                  href={`/admin/admissions/${(lawyer as any).applicationId}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" /> Open in Admissions
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 text-slate-400 text-xs font-medium border border-slate-700">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> No Dossier on File
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Private Profile Preview Banner (Shown to Owner when Unverified / Pending Review) */}
      {isOwnProfile && lawyer && (!lawyer.isVerified || lawyer.verificationStatus !== "VERIFIED") && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-3.5 text-xs sm:text-sm text-primary sticky top-16 z-20 backdrop-blur-md">
          <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <div>
                <span className="font-bold text-amber-900">Private Profile Preview</span> — Verification Status:{" "}
                <span className="font-bold uppercase tracking-wider text-amber-800">
                  {lawyer.verificationStatus?.replace(/_/g, " ") || "Pending Review"}
                </span>
                .{" "}
                <span className="text-on-surface-variant hidden md:inline">
                  This profile is private to you and excluded from public listings and client bookings until approved by the Admissions Desk.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brass hover:bg-brass-hover text-white text-xs font-semibold shadow-xs shrink-0 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Top Banner indicating match */}
      {matchInfo && (
        <div className="bg-brass text-white px-4 py-3 text-center text-sm font-medium flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-200" />
          <span>This lawyer is a <strong>{matchInfo.matchScore}% match</strong> for your case: {intakeData?.caseTitle}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 pb-16">
        
        {/* Back Link */}
        <Link 
          href={role === "admin" ? "/admin" : "/lawyers"} 
          className="inline-flex items-center gap-1.5 text-sm font-medium text-outline-variant hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {role === "admin" ? "Back to Admissions Queue" : "Back to Directory"}
        </Link>

        {/* Profile Header Card */}
        <div className="bg-surface-lowest rounded-2xl shadow-editorial border border-hairline overflow-hidden mb-8">
          <div className="h-32 sm:h-40 bg-gradient-to-r from-primary to-slate relative">
             <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          </div>
          <div className="px-6 sm:px-10 pb-8 relative">
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
              
              {/* Avatar */}
              <div className="relative -mt-16 sm:-mt-20 shrink-0">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-surface-lowest bg-surface-container-low overflow-hidden shadow-sm">
                  <img src={lawyer.avatar || getInitialsAvatar(lawyer.name)} alt={lawyer.name} className="w-full h-full object-cover" />
                </div>
                {lawyer.isVerified && (
                  <div className="absolute bottom-2 right-2 bg-white rounded-full p-0.5 shadow-sm">
                    <ShieldCheck className="w-8 h-8 text-brass" />
                  </div>
                )}
              </div>

              {/* Title & Headline */}
              <div className="pt-2 sm:pt-4 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className="font-headline-md text-3xl sm:text-4xl text-primary font-bold">
                      {lawyer.name}
                    </h1>
                    <p className="text-lg text-on-surface-variant font-medium mt-1">
                      {lawyer.title}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button onClick={handleShare} className="p-2.5 rounded-full border border-hairline text-outline hover:text-primary hover:bg-surface-container transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                    {isOwnProfile ? (
                      <button onClick={() => setShowEditModal(true)} className="flex items-center gap-2 bg-surface-container-low border border-hairline px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-surface-container transition-colors">
                        <Edit3 className="w-4 h-4" /> Edit Profile
                      </button>
                    ) : role === "admin" ? (
                      (lawyer as any)?.applicationId ? (
                        <Link
                          href={`/admin/admissions/${(lawyer as any).applicationId}`}
                          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-dark transition-colors shadow-sm"
                        >
                          <ShieldCheck className="w-4 h-4" /> Review Dossier
                        </Link>
                      ) : (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 bg-surface-container-low border border-hairline text-on-surface-variant hover:text-primary px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-surface-container transition-colors shadow-2xs"
                        >
                          <Clock className="w-4 h-4 text-brass" /> Admissions Queue
                        </Link>
                      )
                    ) : (
                      <button onClick={handleOpenBooking} className="flex items-center gap-2 bg-brass text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-brass-hover transition-colors shadow-sm">
                        <Calendar className="w-4 h-4" /> Book Consultation
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-primary mt-4 text-sm sm:text-base max-w-2xl leading-relaxed font-serif italic">
                  "{lawyer.headline || lawyer.bio.substring(0, 120) + "..."}"
                </p>

                <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-6">
                  {lawyer.ratingSummary && (
                    <StarRating ratingSummary={lawyer.ratingSummary} size="lg" />
                  )}
                  <div className="w-px h-4 bg-hairline hidden sm:block"></div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-on-surface">
                    <MapPin className="w-4 h-4 text-outline" />
                    {lawyer.city ? `${lawyer.city}, ${lawyer.state}` : lawyer.jurisdiction}
                  </div>
                  <div className="w-px h-4 bg-hairline hidden sm:block"></div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                    <span className={`w-2.5 h-2.5 rounded-full ${lawyer.availability === 'Available today' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                    {lawyer.availability}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Why this lawyer fits (if matched) */}
            {matchInfo?.matchReason && (
              <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl shadow-dossier border border-hairline relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-brass"></div>
                <h2 className="font-headline text-xl text-primary font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brass" /> Why {lawyer.name.split(',')[0]} fits your case
                </h2>
                <p className="text-on-surface-variant leading-relaxed">
                  {matchInfo.matchReason}
                </p>
              </section>
            )}

            {/* About / Bio */}
            <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl shadow-dossier border border-hairline">
              <h2 className="font-headline text-2xl text-primary font-semibold mb-4">About</h2>
              <div className="text-on-surface-variant leading-relaxed space-y-4 whitespace-pre-wrap font-body-lg">
                {lawyer.bio}
              </div>
            </section>

            {/* Legal Services & Expertise */}
            {lawyer.services && lawyer.services.length > 0 && (
              <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl shadow-dossier border border-hairline">
                <h2 className="font-headline text-2xl text-primary font-semibold mb-6">Expertise & Services</h2>
                
                {/* Group services by practice area (mocking this by just listing them for now) */}
                <div className="space-y-6">
                  {lawyer.practiceAreas.map((pa, idx) => {
                    const servicesInArea = lawyer.services?.filter(s => 
                      // Simple mock grouping, in reality relies on practiceAreaId
                      s.practiceAreaId ? true : true 
                    );
                    
                    if (!servicesInArea || servicesInArea.length === 0) return null;
                    
                    // For simplicity, just list all services under one block if we can't perfectly map them client-side
                    if (idx > 0) return null; 

                    return (
                      <div key={idx}>
                        <h3 className="font-semibold text-primary mb-3 flex items-center gap-2 text-lg">
                          <Briefcase className="w-5 h-5 text-outline" /> Specialized Services
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {lawyer.services?.map(service => (
                            <div key={service.id} className="flex items-start gap-2 p-3 rounded-lg border border-hairline bg-surface">
                              <Check className="w-4 h-4 text-brass shrink-0 mt-0.5" />
                              <span className="text-sm font-medium text-primary">{service.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Notable Cases */}
            {lawyer.notableCases && lawyer.notableCases.length > 0 && (
              <section className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl shadow-dossier border border-hairline">
                <h2 className="font-headline text-2xl text-primary font-semibold mb-6 flex items-center gap-2">
                  <Gavel className="w-6 h-6 text-slate" /> Representative Matters
                </h2>
                <div className="space-y-6">
                  {lawyer.notableCases.map((caseItem, idx) => (
                    <div key={idx} className="relative pl-6 sm:pl-8 border-l-2 border-surface-container">
                      <div className="absolute w-3 h-3 bg-brass rounded-full -left-[7px] top-1.5 ring-4 ring-surface-lowest"></div>
                      <div className="text-xs font-bold text-brass uppercase tracking-widest mb-1">{caseItem.year}</div>
                      <h3 className="text-base sm:text-lg font-semibold text-primary mb-2">{caseItem.title}</h3>
                      <p className="text-on-surface-variant text-sm leading-relaxed">{caseItem.summary}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Client Reviews */}
            <section id="reviews" className="bg-surface-container-lowest p-6 sm:p-8 rounded-2xl shadow-dossier border border-hairline">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-hairline">
                <div>
                  <h2 className="font-headline text-2xl text-primary font-semibold">Client Reviews</h2>
                  <p className="text-sm text-outline mt-1">Verified feedback from past matters.</p>
                </div>
                {lawyer.ratingSummary && (
                   <StarRating ratingSummary={lawyer.ratingSummary} size="lg" />
                )}
              </div>
              <ReviewsList reviews={reviews} isLoading={reviewsLoading} />
            </section>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Facts Card */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-dossier border border-hairline">
              <h3 className="font-headline-md text-lg text-primary font-semibold mb-5 pb-3 border-b border-hairline">At a Glance</h3>
              <ul className="space-y-4">
                <li className="flex justify-between items-center text-sm">
                  <span className="text-outline flex items-center gap-2"><Briefcase className="w-4 h-4"/> Experience</span>
                  <span className="font-semibold text-primary">{lawyer.yearsExperience} Years</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-outline flex items-center gap-2"><Scale className="w-4 h-4"/> Rate</span>
                  <span className="font-semibold text-primary">
                    {lawyer.hourlyRate ? `₹${lawyer.hourlyRate.toLocaleString("en-IN")}/hr` : "Pending Assignment"}
                  </span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-outline flex items-center gap-2"><Clock className="w-4 h-4"/> Avg. Response</span>
                  <span className="font-semibold text-primary">{lawyer.responseTimeHours || 24} hours</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                  <span className="text-outline flex items-center gap-2"><Globe className="w-4 h-4"/> Languages</span>
                  <span className="font-semibold text-primary text-right max-w-[120px] truncate" title={lawyer.languages?.join(", ")}>
                    {lawyer.languages?.join(", ") || "English"}
                  </span>
                </li>
              </ul>

              {isOwnProfile && (
                <button 
                  onClick={() => setShowPriceRequestModal(true)} 
                  className="w-full mt-4 bg-surface hover:bg-surface-container-low border border-hairline text-primary py-2.5 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                >
                  Request Rate Change
                </button>
              )}

              {!isOwnProfile && role !== "admin" && (
                <button onClick={handleOpenBooking} className="w-full mt-6 bg-brass text-white py-3 rounded-lg text-sm font-semibold hover:bg-brass-hover transition-colors shadow-sm btn-editorial-brass">
                  Request Consultation
                </button>
              )}
              {role === "admin" && (
                (lawyer as any)?.applicationId ? (
                  <Link
                    href={`/admin/admissions/${(lawyer as any).applicationId}`}
                    className="w-full mt-6 bg-primary text-white py-3 rounded-lg text-sm font-semibold hover:bg-slate-dark transition-colors shadow-sm btn-editorial flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Review Admissions Dossier
                  </Link>
                ) : (
                  <Link
                    href="/admin"
                    className="w-full mt-6 bg-surface-container-low border border-hairline text-on-surface-variant hover:text-primary py-3 rounded-lg text-sm font-semibold hover:bg-surface-container transition-colors shadow-2xs flex items-center justify-center gap-2"
                  >
                    <Clock className="w-4 h-4 text-brass" />
                    Admissions Queue (No Dossier)
                  </Link>
                )
              )}
            </div>

            {/* Credentials Card */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-dossier border border-hairline">
              <h3 className="font-headline-md text-lg text-primary font-semibold mb-5 pb-3 border-b border-hairline">Credentials</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs uppercase tracking-wider font-semibold text-outline mb-1">State Bar License</div>
                  <div className="text-sm font-medium text-primary flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{lawyer.jurisdiction}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider font-semibold text-outline mb-1">Background Check</div>
                  <div className="text-sm font-medium text-primary flex items-center gap-2">
                    {lawyer.isVerified ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Verified via Advocato Trust
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-amber-500" />
                        Verification Pending
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Practice Areas Summary */}
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-dossier border border-hairline">
              <h3 className="font-headline-md text-lg text-primary font-semibold mb-4">Focus Areas</h3>
              <div className="flex flex-wrap gap-2">
                {lawyer.practiceAreas.map((pa, idx) => (
                  <span key={idx} className="bg-surface-container-low px-2.5 py-1 rounded text-xs font-medium text-primary border border-hairline">
                    {pa}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Booking Modal (Preserved logic) */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-hairline shadow-editorial w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-5 pb-4 border-b border-hairline">
              <img
                src={lawyer.avatar || getInitialsAvatar(lawyer.name)}
                alt={lawyer.name}
                className="w-14 h-14 rounded-full object-cover border border-hairline"
              />
              <div>
                <h3 className="font-headline text-lg font-semibold text-primary">{lawyer.name}</h3>
                <span className="text-xs text-on-surface-variant">{lawyer.title}</span>
                <div className="text-xs font-semibold text-brass mt-0.5">
                  {lawyer.hourlyRate ? `₹${lawyer.hourlyRate.toLocaleString("en-IN")}/hr consultation` : "Rate pending assignment"}
                </div>
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
                  Propose a Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)}
                  className="w-full px-3 py-2.5 rounded-lg border border-hairline bg-surface-container-lowest text-xs text-primary focus:outline-none focus:border-brass transition-colors"
                />
                <p className="text-[11px] text-on-surface-variant mt-1.5">
                  The lawyer will confirm or suggest an alternative time via chat.
                </p>
              </div>

              <div className="p-3 bg-surface-container-low rounded-lg border border-hairline text-xs text-on-surface-variant space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-primary">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brass" />
                    <span>Consultation Request</span>
                  </div>
                  <span className="text-brass">
                    {lawyer.hourlyRate ? `₹${lawyer.hourlyRate.toLocaleString("en-IN")} / hr` : "Pending Assignment"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
                  <ShieldCheck className="w-3.5 h-3.5 text-brass shrink-0" />
                  <span>Payment arranged directly with counsel after confirmation.</span>
                </div>
              </div>

              {bookingError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              {bookingSuccessNotice && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{bookingSuccessNotice}</span>
                </div>
              )}

              <button
                type="button"
                onClick={confirmBooking}
                disabled={!selectedDate || isBookingSubmitting || !!bookingSuccessNotice}
                className="w-full bg-brass hover:bg-brass-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-3.5 rounded-lg shadow-editorial transition-transform active:scale-95 flex items-center justify-center gap-2 min-h-[44px]"
              >
                {isBookingSubmitting ? (
                  <span>Submitting Request...</span>
                ) : bookingSuccessNotice ? (
                  <span>Request Submitted!</span>
                ) : (
                  <>
                    <span>Confirm &amp; Open Chat</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && lawyer && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          lawyer={lawyer}
          onProfileUpdated={(updated) => {
            setLawyer(updated);
            setMyLawyerProfile(updated);
          }}
        />
      )}

      {/* Price Request Modal */}
      {showPriceRequestModal && lawyer && (
        <PriceRequestModal
          isOpen={showPriceRequestModal}
          onClose={() => setShowPriceRequestModal(false)}
          currentRate={lawyer.hourlyRate}
        />
      )}
    </div>
  );
}
