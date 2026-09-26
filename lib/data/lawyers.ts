import { Lawyer, RatingSummary } from "@/types";

// ============================================================
// INDIAN STATES
// ============================================================
export const INDIAN_STATES: string[] = [
  "Delhi (DL)",
  "Maharashtra (MH)",
  "Karnataka (KA)",
  "Tamil Nadu (TN)",
  "Uttar Pradesh (UP)",
  "Gujarat (GJ)",
  "West Bengal (WB)",
  "Telangana (TS)",
  "Kerala (KL)",
  "Rajasthan (RJ)",
  "Punjab (PB)",
  "Haryana (HR)",
  "Madhya Pradesh (MP)",
  "Bihar (BR)",
  "Andhra Pradesh (AP)",
  "Odisha (OD)",
  "Assam (AS)",
  "Goa (GA)",
  "Jharkhand (JH)",
  "Chhattisgarh (CG)",
  "Uttarakhand (UK)",
  "Himachal Pradesh (HP)",
  "Jammu & Kashmir (JK)",
  "Chandigarh (CH)",
  "All India / Supreme Court",
];

// ============================================================
// UTILITY
// ============================================================
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function computeRatingSummary(
  rating: number,
  reviewCount: number,
  verifiedReviewCount?: number
): RatingSummary {
  if (reviewCount === 0) {
    return { averageRating: null, reviewCount: 0, verifiedReviewCount: 0 };
  }
  return {
    averageRating: rating,
    reviewCount,
    verifiedReviewCount: verifiedReviewCount ?? Math.floor(reviewCount * 0.7),
  };
}

// ============================================================
// SEED LAWYERS — Development/Demo data
// These are obviously fictional profiles for platform testing.
// They are never presented as real verified lawyers in production.
// ============================================================

export const LAWYERS: Lawyer[] = [];

// ============================================================
// CUSTOM LAWYER PERSISTENCE (localStorage — existing behavior)
// ============================================================

export const LAWYER_STORAGE_KEY = "advocato_registered_lawyers";
let inMemoryCustomLawyers: Lawyer[] = [];

export function getCustomLawyers(): Lawyer[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(LAWYER_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to load registered lawyers from storage", e);
    }
  }
  return inMemoryCustomLawyers;
}

export function getAllLawyers(): Lawyer[] {
  const custom = getCustomLawyers();
  const customIds = new Set(custom.map((l) => l.id));
  const base = LAWYERS.filter((l) => !customIds.has(l.id));
  return [...custom, ...base];
}

export function registerNewLawyer(data: {
  fullName: string;
  firmName?: string;
  email: string;
  barNumber: string;
  stateBar: string;
  yearsExperience?: string | number;
  primaryPractice: string;
  hourlyRate: number | string;
  bio: string;
}): Lawyer {
  const id = `lawyer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const years =
    typeof data.yearsExperience === "string"
      ? parseInt(data.yearsExperience.replace(/\D/g, ""), 10) || 10
      : data.yearsExperience || 10;
  const rate =
    typeof data.hourlyRate === "string"
      ? parseFloat(data.hourlyRate.replace(/[^0-9.]/g, "")) || 2500
      : data.hourlyRate;

  const defaultAvatar =
    "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=400";

  const newLawyer: Lawyer = {
    id,
    name: data.fullName,
    title: `${data.primaryPractice} Attorney`,
    headline: `${data.primaryPractice} attorney licensed in ${data.stateBar}.`,
    avatar: defaultAvatar,
    rating: 0,
    reviewCount: 0,
    verifiedReviewCount: 0,
    hourlyRate: rate,
    isVerified: false,
    verificationStatus: "PENDING",
    availability: "Available today",
    acceptingClients: true,
    yearsExperience: years,
    jurisdiction: `Licensed in ${data.stateBar}`,
    state: data.stateBar,
    languages: ["English", "Hindi"],
    tags: [`${data.primaryPractice}`, `Licensed in ${data.stateBar}`, "New Member"],
    practiceAreas: [data.primaryPractice, "General Advisory"],
    bio:
      data.bio ||
      `${data.fullName} is an attorney licensed in ${data.stateBar} specializing in ${data.primaryPractice}.`,
    notableCases: [
      {
        year: `${new Date().getFullYear()}`,
        title: "Admitted to Advocato Network",
        summary: `Successfully credentialed in ${data.stateBar} with specialization in ${data.primaryPractice}.`,
      },
    ],
    createdAt: new Date().toISOString().split("T")[0],
  };

  inMemoryCustomLawyers = [newLawyer, ...inMemoryCustomLawyers];

  if (typeof window !== "undefined") {
    try {
      const existing = getCustomLawyers();
      const updated = [newLawyer, ...existing.filter((l) => l.id !== id)];
      localStorage.setItem(LAWYER_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save registered lawyer to storage", e);
    }
  }

  return newLawyer;
}

export function getLawyerById(id: string): Lawyer | undefined {
  return getAllLawyers().find((l) => l.id === id);
}

// ============================================================
// MATCHING DATA — Structured for AI matching engine
// ============================================================
export function getLawyersForMatching() {
  return getAllLawyers().map((l) => ({
    id: l.id,
    name: l.name,
    title: l.title,
    practiceAreas: l.practiceAreas,
    tags: l.tags,
    jurisdiction: l.jurisdiction,
    state: l.state,
    yearsExperience: l.yearsExperience,
    isVerified: l.isVerified,
    availability: l.availability,
    acceptingClients: l.acceptingClients ?? true,
    hourlyRate: l.hourlyRate,
    bio: l.bio,
  }));
}
