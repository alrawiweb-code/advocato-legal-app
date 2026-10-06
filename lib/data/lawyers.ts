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


