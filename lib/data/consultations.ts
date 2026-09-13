import { Consultation, ConsultationMessage, DocumentAttachment } from "@/types";
import { getAllLawyers } from "./lawyers";

export const INITIAL_CONSULTATIONS: Consultation[] = [];

export const CONSULTATION_STORAGE_KEY = "advocato_consultations";

export function getStoredConsultations(): Consultation[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(CONSULTATION_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load consultations from storage", e);
    }
  }
  return INITIAL_CONSULTATIONS;
}

export function saveStoredConsultations(consultations: Consultation[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CONSULTATION_STORAGE_KEY, JSON.stringify(consultations));
    } catch (e) {
      console.error("Failed to save consultations to storage", e);
    }
  }
}

export interface CreateConsultationOptions {
  lawyerId: string;
  clientName?: string;
  caseTitle?: string;
  intakeBrief?: string;
  opposingParty?: string;
  jurisdiction?: string;
  appointmentDate?: string;
  consultationType?: "video" | "phone";
  documents?: DocumentAttachment[];
}

export function getOrCreateConsultationForLawyer(
  lawyerIdOrOptions: string | CreateConsultationOptions,
  clientNameOverride?: string
): Consultation {
  const options: CreateConsultationOptions =
    typeof lawyerIdOrOptions === "string"
      ? { lawyerId: lawyerIdOrOptions, clientName: clientNameOverride }
      : lawyerIdOrOptions;

  const lawyerId = options.lawyerId;
  const current = getStoredConsultations();
  const existingIndex = current.findIndex((c) => c.lawyer.id === lawyerId);

  // If already exists, optionally update booking / intake metadata if newly provided
  if (existingIndex !== -1) {
    const existing = current[existingIndex];
    let hasUpdates = false;

    if (options.appointmentDate && existing.appointmentDate !== options.appointmentDate) {
      existing.appointmentDate = options.appointmentDate;
      existing.consultationType = options.consultationType || "video";
      existing.status = "scheduled";
      hasUpdates = true;

      // Append booking confirmation message if not already present
      existing.messages.push({
        id: `msg-sys-booking-${Date.now()}`,
        senderRole: "lawyer",
        senderName: existing.lawyer.name,
        senderAvatar: existing.lawyer.avatar,
        text: `Consultation confirmed for ${options.appointmentDate} via ${options.consultationType === "phone" ? "Phone" : "Video"}. The consultation fee (₹${existing.lawyer.hourlyRate.toLocaleString("en-IN")}/hr) is pre-authorized in escrow.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "delivered",
      });
    }

    if (hasUpdates) {
      current[existingIndex] = existing;
      saveStoredConsultations(current);
    }
    return existing;
  }

  // Look up lawyer from all lawyers (including newly registered lawyers)
  const allLawyers = getAllLawyers();
  const lawyer = allLawyers.find((l) => l.id === lawyerId) || {
    id: lawyerId,
    name: "Lawyer",
    title: "Advocate at Law",
    avatar: "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=400",
    rating: 5.0,
    reviewCount: 0,
    hourlyRate: 3500,
    isVerified: true,
    availability: "Available today" as const,
    yearsExperience: 10,
    jurisdiction: "Pending Verification",
    tags: ["General Practice"],
    practiceAreas: ["General Practice"],
    bio: "Licensed advocate providing privileged counsel.",
    notableCases: [],
  };

  // Attempt to read intake data from localStorage if not explicitly supplied
  let resolvedCaseTitle = options.caseTitle;
  let resolvedBrief = options.intakeBrief;
  let resolvedOpposingParty = options.opposingParty;
  let resolvedJurisdiction = options.jurisdiction;
  let resolvedDocs = options.documents || [];

  if (typeof window !== "undefined") {
    try {
      const storedIntake = localStorage.getItem("advocato_latest_intake") || localStorage.getItem("advocato_intake_data");
      if (storedIntake) {
        const parsed = JSON.parse(storedIntake);
        if (!resolvedCaseTitle) resolvedCaseTitle = parsed.caseTitle || `${parsed.category} Review`;
        if (!resolvedBrief) resolvedBrief = parsed.rawText || parsed.summary;
        if (!resolvedOpposingParty) resolvedOpposingParty = parsed.opposingParty;
        if (!resolvedJurisdiction) resolvedJurisdiction = parsed.jurisdiction;
        if (resolvedDocs.length === 0 && parsed.documents) {
          resolvedDocs = parsed.documents;
        }
      }
    } catch (e) {}
  }

  const resolvedClientName = options.clientName || "Alex Mercer";
  const finalTitle = resolvedCaseTitle || `Consultation with ${lawyer.name}`;

  // Seed messages with initial privileged case dossier
  const initialMessages: ConsultationMessage[] = [];

  if (options.appointmentDate) {
    initialMessages.push({
      id: `msg-sys-booking-${Date.now()}`,
      senderRole: "lawyer",
      senderName: lawyer.name,
      senderAvatar: lawyer.avatar,
      text: `Hello ${resolvedClientName}, thank you for reaching out. I have reserved our privileged ${options.consultationType === "phone" ? "Phone" : "Video"} Consultation for ${options.appointmentDate}. Your consultation fee (₹${lawyer.hourlyRate.toLocaleString("en-IN")}/hr) is pre-authorized in escrow. I am reviewing your case brief below.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "delivered",
    });
  }

  if (resolvedBrief) {
    initialMessages.push({
      id: `msg-brief-${Date.now() + 1}`,
      senderRole: "client",
      senderName: resolvedClientName,
      text: `📋 Case Dossier & Summary:\n\n• Legal Issue: ${finalTitle}\n${resolvedOpposingParty ? `• Opposing Party / Employer: ${resolvedOpposingParty}\n` : ""}• Jurisdiction: ${resolvedJurisdiction || "State Bar"}\n\nClient Statement:\n"${resolvedBrief}"`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "read",
    });
  }

  if (resolvedDocs && resolvedDocs.length > 0) {
    resolvedDocs.forEach((doc, idx) => {
      initialMessages.push({
        id: `msg-doc-${Date.now() + 2 + idx}`,
        senderRole: "client",
        senderName: resolvedClientName,
        text: `Attached document for review: ${doc.name}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "read",
        attachment: doc,
      });
    });
  }

  const newConsultation: Consultation = {
    id: `matter-${lawyer.id}-${Date.now().toString().slice(-4)}`,
    lawyer: lawyer,
    status: options.appointmentDate ? "scheduled" : "active",
    caseTitle: finalTitle,
    matterNumber: `ADV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    clientName: resolvedClientName,
    lastActive: "online",
    messages: initialMessages,
    opposingParty: resolvedOpposingParty,
    appointmentDate: options.appointmentDate,
    consultationType: options.consultationType || "video",
    paymentStatus: "pre_authorized",
    conflictStatus: "pending",
    documents: resolvedDocs,
    intakeBrief: resolvedBrief,
    jurisdiction: resolvedJurisdiction,
    upcomingSession: options.appointmentDate
      ? {
          date: options.appointmentDate,
          time: options.appointmentDate.split(",")[1]?.trim() || "10:00 AM",
          platform: options.consultationType === "phone" ? "Phone Call" : "Video Room",
        }
      : undefined,
  };

  const updated = [newConsultation, ...current];
  saveStoredConsultations(updated);
  return newConsultation;
}
