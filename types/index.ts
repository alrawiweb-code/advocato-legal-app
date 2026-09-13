export interface CaseOutcome {
  year: string;
  title: string;
  summary: string;
}

export interface Lawyer {
  id: string;
  name: string;
  title: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  isVerified: boolean;
  availability: "Available today" | "Next week" | "This week";
  yearsExperience: number;
  jurisdiction: string;
  tags: string[];
  practiceAreas: string[];
  bio: string;
  notableCases: CaseOutcome[];
}

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
