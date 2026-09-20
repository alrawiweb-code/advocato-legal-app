// ============================================================
// CORE ENTITIES
// ============================================================

export interface CaseOutcome {
  year: string;
  title: string;
  summary: string;
}

// Verification status enum — Phase 3 (KYC) will plug into this
export type VerificationStatus =
  | "NOT_VERIFIED"
  | "PENDING"
  | "VERIFIED"
  | "APPROVED"
  | "SUSPENDED"
  | "REJECTED"
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "DOCUMENTS_REQUIRED";

// ============================================================
// PRACTICE AREAS & SERVICES (Phase 2 — Normalized Taxonomy)
// ============================================================

export interface LegalService {
  id: string;
  name: string;
  practiceAreaId: string;
  description?: string;
}

export interface PracticeArea {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  services: LegalService[];
}

// ============================================================
// REVIEWS (Phase 2 — Real rating data, no fake scores)
// ============================================================

export type ReviewVerificationStatus = "UNVERIFIED" | "VERIFIED" | "FLAGGED";

export interface LawyerReview {
  id: string;
  lawyerId: string;
  reviewerName: string;
  reviewerId?: string;
  matterId?: string;           // Links review to a real matter/consultation
  rating: number;              // 1–5
  reviewText?: string;
  verificationStatus: ReviewVerificationStatus;
  createdAt: string;
}

export interface RatingSummary {
  averageRating: number | null; // null means no reviews yet
  reviewCount: number;
  verifiedReviewCount: number;
}

// ============================================================
// LAWYER — Extended for Phase 2 Marketplace
// ============================================================

export interface Lawyer {
  id: string;
  name: string;
  title: string;
  headline?: string;           // Phase 2: Professional tagline
  avatar: string;
  rating: number;
  reviewCount: number;
  verifiedReviewCount?: number; // Phase 2: Separately tracked
  hourlyRate: number;
  isVerified: boolean;
  verificationStatus?: VerificationStatus; // Phase 2: Richer status
  availability: "Available today" | "Next week" | "This week" | "Not accepting";
  acceptingClients?: boolean;  // Phase 2
  responseTimeHours?: number;  // Phase 2: avg response time
  yearsExperience: number;
  jurisdiction: string;
  state?: string;              // Phase 2: Normalized state
  city?: string;               // Phase 2
  languages?: string[];        // Phase 2
  tags: string[];
  practiceAreas: string[];
  serviceIds?: string[];       // Phase 2: Links to LegalService.id
  services?: LegalService[];   // Phase 2: Populated on profile fetch
  bio: string;
  notableCases: CaseOutcome[];
  ratingSummary?: RatingSummary; // Phase 2: Computed, not stored raw
  createdAt?: string;          // Phase 2: For "Recently joined" sort
}

// ============================================================
// MARKETPLACE — What the directory API returns
// ============================================================

export interface MarketplaceLawyerCard {
  id: string;
  name: string;
  title: string;
  headline?: string;
  avatar: string;
  isVerified: boolean;
  verificationStatus?: VerificationStatus;
  availability: string;
  acceptingClients?: boolean;
  yearsExperience: number;
  jurisdiction: string;
  state?: string;
  city?: string;
  languages?: string[];
  practiceAreas: string[];
  primaryServices: string[];   // Top 3 services for card display
  ratingSummary: RatingSummary;
  tags: string[];
}

// ============================================================
// AI MATCHING — Structured data for the matching engine
// ============================================================

export interface LawyerMatchData {
  id: string;
  name: string;
  title: string;
  practiceAreas: string[];
  tags: string[];
  jurisdiction: string;
  state?: string;
  yearsExperience: number;
  isVerified: boolean;
  availability: string;
  acceptingClients?: boolean;
  ratingSummary: RatingSummary;
  bio: string;
  hourlyRate: number;
}

// ============================================================
// INTAKE & MATCHING (Existing — preserved)
// ============================================================

export interface MatchedLawyerResult {
  lawyerId: string;
  matchScore: number;
  matchReason: string;
  highlights?: string[];
}

export interface IntakeAssessment {
  id: string;
  caseTitle?: string;
  rawText: string;
  category: string;
  subCategory: string;
  jurisdiction: string;
  opposingParty?: string;
  urgency: "High" | "Medium" | "Low";
  summary: string;
  extractedKeyPoints: string[];
  recommendedLawyerIds: string[];
  matchedLawyers?: MatchedLawyerResult[];
  documents?: DocumentAttachment[];
  createdAt: string;
}

// ============================================================
// DOCUMENTS (Existing — preserved)
// ============================================================

export interface DocumentAttachment {
  id?: string;
  name: string;
  size: string;
  category: string;
  previewUrl?: string;
  downloadUrl?: string;
  storagePath?: string;
  sha256Hash?: string;
  isReviewed?: boolean;
}

// ============================================================
// MESSAGING & CONSULTATIONS (Existing — preserved)
// ============================================================

export interface ConsultationMessage {
  id: string;
  senderRole: "lawyer" | "client";
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  attachment?: DocumentAttachment;
  status?: "sent" | "delivered" | "read";
  isVoiceNote?: boolean;
  audioDuration?: string;
  audioUrl?: string;
  audioStoragePath?: string;
  reactions?: string[];
}

export interface Consultation {
  id: string;
  lawyer: Lawyer;
  status: "active" | "scheduled" | "review";
  caseTitle: string;
  matterNumber: string;
  clientName: string;
  lastActive: string;
  messages: ConsultationMessage[];
  opposingParty?: string;
  appointmentDate?: string;
  consultationType?: "video" | "phone";
  paymentStatus?: "pre_authorized" | "held_in_escrow" | "completed";
  conflictStatus?: "pending" | "cleared" | "flagged";
  documents?: DocumentAttachment[];
  intakeBrief?: string;
  jurisdiction?: string;
  upcomingSession?: {
    date: string;
    time: string;
    platform: string;
  };
}

// ============================================================
// REGISTRATION (Existing — preserved)
// ============================================================

export interface LawyerRegistrationForm {
  fullName: string;
  email: string;
  phone: string;
  barNumber: string;
  stateBar: string;
  yearsOfPractice: number;
  primaryPracticeArea: string;
  secondaryPracticeAreas: string[];
  hourlyRate: number;
  bio: string;
}

// ============================================================
// MARKETPLACE FILTER STATE
// ============================================================

export interface MarketplaceFilters {
  search: string;
  practiceArea: string;       // practice area id or "all"
  serviceId: string;          // legal service id or "all"
  state: string;              // Indian state or "all"
  minExperience: number;
  maxExperience: number;
  language: string;           // "all" or specific language
  availability: "all" | "today" | "this_week";
  verifiedOnly: boolean;
  sort: "recommended" | "highest_rated" | "most_experienced" | "recently_joined" | "available_now";
  page: number;
  limit: number;
}

export const DEFAULT_FILTERS: MarketplaceFilters = {
  search: "",
  practiceArea: "all",
  serviceId: "all",
  state: "all",
  minExperience: 0,
  maxExperience: 40,
  language: "all",
  availability: "all",
  verifiedOnly: false,
  sort: "recommended",
  page: 1,
  limit: 12,
};

export interface PaginatedLawyers {
  lawyers: MarketplaceLawyerCard[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
