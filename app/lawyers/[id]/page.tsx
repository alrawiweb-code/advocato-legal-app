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
  Briefcase
} from "lucide-react";

import { getOrCreateConsultationForLawyer } from "@/lib/data/consultations";
import { Lawyer, IntakeAssessment, LawyerReview } from "@/types";
import { useUserRole } from "@/lib/context/RoleContext";
import StarRating from "@/components/marketplace/StarRating";
import ReviewsList from "@/components/marketplace/ReviewsList";

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
    headline: "",
  });

  useEffect(() => {
    const fetchLawyer = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/lawyers/${resolvedParams.id}`);
        if (res.ok) {
          const data = await res.json();
          setLawyer(data);
          setEditForm({
            name: data.name,
            title: data.title,
            hourlyRate: data.hourlyRate,
            jurisdiction: data.jurisdiction,
            bio: data.bio,
            headline: data.headline || "",
          });
        } else if (res.status === 401) {
          router.push(`/login?redirect=/lawyers/${resolvedParams.id}`);
        } else {
          setLawyer(null);
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

  const isOwnProfile = role === "lawyer" && (activeLawyer?.id === lawyer?.id || !activeLawyer);

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert("Profile link copied to clipboard!");
    }
  };

  const handleOpenBooking = () => {
    if (role === "client") {
      setShowBookingModal(true);
    } else {
      alert("Only clients can book consultations.");
    }
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

  const handleSaveProfile = () => {
    if (lawyer) {
      const updatedLawyer = {
        ...lawyer,
        ...editForm,
      };
      setLawyer(updatedLawyer);
      setMyLawyerProfile(updatedLawyer);
      setShowEditModal(false);
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

  if (lawyer === null) {
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

  if (!lawyer) return null;

  const matchInfo = intakeData?.matchedLawyers?.find(m => m.lawyerId === lawyer.id);

  return (
    <div className="flex-1 flex flex-col bg-background">
      
      {/* Top Banner indicating match */}
      {matchInfo && (
        <div className="bg-brass text-white px-4 py-3 text-center text-sm font-medium flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-200" />
          <span>This lawyer is a <strong>{matchInfo.matchScore}% match</strong> for your case: {intakeData?.caseTitle}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-[1100px] w-full mx-auto px-4 sm:px-6 md:px-8 pt-6 pb-32">
        
        {/* Back Link */}
        <Link href="/lawyers" className="inline-flex items-center gap-1.5 text-sm font-medium text-outline-variant hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
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
                  <img src={lawyer.avatar} alt={lawyer.name} className="w-full h-full object-cover" />
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
                  <span className="font-semibold text-primary">₹{lawyer.hourlyRate.toLocaleString("en-IN")}/hr</span>
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

              {!isOwnProfile && (
                <button onClick={handleOpenBooking} className="w-full mt-6 bg-brass text-white py-3 rounded-lg text-sm font-semibold hover:bg-brass-hover transition-colors shadow-sm btn-editorial-brass">
                  Request Consultation
                </button>
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
                src={lawyer.avatar}
                alt={lawyer.name}
                className="w-14 h-14 rounded-full object-cover border border-hairline"
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
                  <span className="text-brass">₹{lawyer.hourlyRate.toLocaleString("en-IN")} / hr</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Pre-authorized via Escrow • Zero fee until consultation concludes</span>
                </div>
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

      {/* Edit Profile Modal */}
      {showEditModal && isOwnProfile && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-hairline shadow-editorial w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowEditModal(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-primary">
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-headline font-semibold text-primary mb-6">Edit Professional Profile</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1.5">Full Name</label>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full bg-surface-container border border-hairline rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-brass" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1.5">Professional Title</label>
                  <input type="text" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="w-full bg-surface-container border border-hairline rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-brass" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">Profile Tagline / Headline</label>
                <input type="text" value={editForm.headline} onChange={(e) => setEditForm({...editForm, headline: e.target.value})} placeholder="e.g. Protecting workplace rights across Delhi" className="w-full bg-surface-container border border-hairline rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-brass" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1.5">Hourly Rate (₹)</label>
                  <input type="number" value={editForm.hourlyRate} onChange={(e) => setEditForm({...editForm, hourlyRate: Number(e.target.value)})} className="w-full bg-surface-container border border-hairline rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-brass" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1.5">Jurisdiction / State Bar</label>
                  <input type="text" value={editForm.jurisdiction} onChange={(e) => setEditForm({...editForm, jurisdiction: e.target.value})} className="w-full bg-surface-container border border-hairline rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-brass" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">Full Biography</label>
                <textarea value={editForm.bio} onChange={(e) => setEditForm({...editForm, bio: e.target.value})} rows={5} className="w-full bg-surface-container border border-hairline rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:border-brass resize-none" />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm font-medium text-on-surface hover:text-primary">Cancel</button>
              <button onClick={handleSaveProfile} className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-slate-dark btn-editorial">Save Changes</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
