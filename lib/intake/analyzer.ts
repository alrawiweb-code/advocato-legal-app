import { IntakeAssessment } from "@/types";
import { getAllLawyers } from "@/lib/data/lawyers";

export function analyzeLegalSituation(text: string): IntakeAssessment {
  const lower = text.toLowerCase();

  let category = "Employment & Labor Law";
  let subCategory = "Severance & Workplace Rights";
  let urgency: "High" | "Medium" | "Low" = "Medium";
  let jurisdiction = "Delhi (DL)";

  if (
    lower.includes("fired") ||
    lower.includes("severance") ||
    lower.includes("boss") ||
    lower.includes("salary") ||
    lower.includes("wage") ||
    lower.includes("employer") ||
    lower.includes("overtime") ||
    lower.includes("laid off")
  ) {
    category = "Employment & Labor Law";
    subCategory = lower.includes("severance") ? "Severance Agreement & Release" : "Workplace Termination & Rights";
  } else if (
    lower.includes("patent") ||
    lower.includes("trademark") ||
    lower.includes("copyright") ||
    lower.includes("intellectual property") ||
    lower.includes("ip")
  ) {
    category = "Intellectual Property";
    subCategory = "Trademarks & Licensing";
  } else if (
    lower.includes("contract") ||
    lower.includes("incorporate") ||
    lower.includes("partner") ||
    lower.includes("llc") ||
    lower.includes("startup")
  ) {
    category = "Corporate & Commercial Law";
    subCategory = "Contract Structuring & Entity Governance";
  }

  // Detect urgency
  if (
    lower.includes("urgent") ||
    lower.includes("tomorrow") ||
    lower.includes("immediately") ||
    lower.includes("deadline") ||
    lower.includes("court") ||
    lower.includes("signed")
  ) {
    urgency = "High";
  } else if (lower.includes("next month") || lower.includes("planning") || lower.includes("exploring")) {
    urgency = "Low";
  }

  // Detect Indian jurisdiction
  if (lower.includes("mumbai") || lower.includes("maharashtra") || lower.includes("pune")) {
    jurisdiction = "Maharashtra (MH)";
  } else if (lower.includes("bangalore") || lower.includes("bengaluru") || lower.includes("karnataka")) {
    jurisdiction = "Karnataka (KA)";
  } else if (lower.includes("delhi") || lower.includes("ncr") || lower.includes("new delhi")) {
    jurisdiction = "Delhi (DL)";
  } else if (lower.includes("hyderabad") || lower.includes("telangana")) {
    jurisdiction = "Telangana (TS)";
  } else if (lower.includes("chennai") || lower.includes("tamil nadu")) {
    jurisdiction = "Tamil Nadu (TN)";
  } else if (lower.includes("gurgaon") || lower.includes("gurugram") || lower.includes("haryana") || lower.includes("noida")) {
    jurisdiction = "Haryana (HR)";
  } else if (lower.includes("kolkata") || lower.includes("west bengal")) {
    jurisdiction = "West Bengal (WB)";
  }

  const keyPoints: string[] = [];
  if (lower.includes("salary") || lower.includes("final") || lower.includes("pay") || lower.includes("severance")) {
    keyPoints.push("Potential unpaid compensation or severance negotiation opportunity identified");
  }
  if (lower.includes("non-compete") || lower.includes("nda") || lower.includes("clause")) {
    keyPoints.push("Restrictive covenants and confidentiality scope review required");
  }
  if (keyPoints.length === 0) {
    keyPoints.push("Matter involves potential breach of contract and regulatory compliance");
    keyPoints.push("Client seeks expedited confidential legal assessment");
  }

  // Pick matching lawyers
  const matchedLawyerIds = getAllLawyers().map((l) => l.id);

  return {
    id: `intake-${Date.now()}`,
    rawText: text,
    category,
    subCategory,
    jurisdiction,
    urgency,
    summary:
      text.length > 120
        ? text.slice(0, 117) + "..."
        : text || "Client requested preliminary assessment for employment and contractual matter.",
    extractedKeyPoints: keyPoints,
    recommendedLawyerIds: matchedLawyerIds,
    createdAt: new Date().toISOString(),
  };
}
