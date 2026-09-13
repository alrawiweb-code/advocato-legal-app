import { Lawyer } from "@/types";

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

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export const LAWYERS: Lawyer[] = [
  {
    id: "1",
    name: "Sarah Jenkins, Adv.",
    title: "Senior Employment & Labor Counsel",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
    rating: 4.9,
    reviewCount: 48,
    hourlyRate: 3500,
    isVerified: true,
    availability: "Available today",
    yearsExperience: 14,
    jurisdiction: "Delhi (DL) • Bar Council #D/4921/2012",
    tags: ["Employment Law", "Severance Negotiation", "Non-Competes", "Wrongful Termination"],
    practiceAreas: ["Employment & Labor Law", "Executive Compensation", "Workplace Disputes"],
    bio: "Sarah Jenkins is a seasoned employment advocate with 14 years of dedicated practice across the Delhi High Court and labor tribunals. She specializes in corporate severance negotiations, executive employment agreements, and non-compete enforceability.",
    notableCases: [
      {
        year: "2025",
        title: "Executive Severance Package Enhancement",
        summary: "Negotiated a 4.2x enhanced severance settlement for an enterprise VP following contested restructuring.",
      },
      {
        year: "2024",
        title: "Non-Compete Invalidation Relief",
        summary: "Secured immediate ad-interim injunction restraining enforcement of an unconscionable 24-month restrictive covenant.",
      },
    ],
  },
  {
    id: "2",
    name: "Marcus Vance, Adv.",
    title: "Partner & Commercial Litigation Counsel",
    avatar: "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=400",
    rating: 5.0,
    reviewCount: 62,
    hourlyRate: 4500,
    isVerified: true,
    availability: "Available today",
    yearsExperience: 18,
    jurisdiction: "Maharashtra (MH) • Bar Council #MAH/8291/2008",
    tags: ["Corporate Law", "Contract Structuring", "Commercial Disputes", "Startup Advisory"],
    practiceAreas: ["Corporate & Commercial Law", "Partnership Disputes", "Commercial Leasing"],
    bio: "Marcus Vance leads complex commercial litigation, startup governance, and corporate contract disputes for clients across Mumbai and nationwide before the Bombay High Court and NCLT.",
    notableCases: [
      {
        year: "2025",
        title: "Commercial Contract Royalty Settlement",
        summary: "Recovered ₹1.85 Cr in unpaid software distribution fees and IP licensing royalties for a private technology vendor.",
      },
      {
        year: "2023",
        title: "Shareholder Deadlock Dissolution",
        summary: "Successfully restructured ownership terms avoiding prolonged corporate insolvency proceedings.",
      },
    ],
  },
  {
    id: "3",
    name: "Elena Rostova, Adv.",
    title: "Workplace Rights & Civil Litigator",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
    rating: 4.85,
    reviewCount: 39,
    hourlyRate: 2500,
    isVerified: true,
    availability: "Available today",
    yearsExperience: 11,
    jurisdiction: "Karnataka (KA) • Bar Council #KAR/6391/2015",
    tags: ["Wage & Hour", "Workplace Discrimination", "Severance", "Civil Litigation"],
    practiceAreas: ["Employment & Labor Law", "Civil Rights", "Class Actions"],
    bio: "Elena Rostova is an acclaimed workplace rights counsel in Bengaluru focusing on IT employee statutory protection, severance review, and executive workplace disputes.",
    notableCases: [
      {
        year: "2024",
        title: "Multi-Plaintiff Unpaid Compensation Resolution",
        summary: "Achieved full statutory back-pay settlement with statutory damages for 12 misclassified technology leads.",
      },
    ],
  },
  {
    id: "4",
    name: "David Chen, Adv.",
    title: "Technology & Intellectual Property Counsel",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
    rating: 4.95,
    reviewCount: 51,
    hourlyRate: 3000,
    isVerified: true,
    availability: "Available today",
    yearsExperience: 12,
    jurisdiction: "Telangana (TS) • Bar Council #TS/5109/2014",
    tags: ["Trademarks", "Technology Licensing", "Trade Secrets", "Software Contracts"],
    practiceAreas: ["Intellectual Property", "Software Licensing", "Corporate Counsel"],
    bio: "David Chen assists technology founders, creators, and established corporations with brand protection, software licensing compliance, and trade secret safeguarding across Hyderabad and pan-India.",
    notableCases: [
      {
        year: "2025",
        title: "SaaS Licensing Breach & Copyright Defense",
        summary: "Defended enterprise developer against unauthorized code fork and enforced perpetual licensing royalties.",
      },
    ],
  },
];

export const LAWYER_STORAGE_KEY = "advocato_registered_lawyers";

let inMemoryCustomLawyers: Lawyer[] = [];

export function getCustomLawyers(): Lawyer[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(LAWYER_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load registered lawyers from storage", e);
    }
  }
  return inMemoryCustomLawyers;
}

export function getAllLawyers(): Lawyer[] {
  const custom = getCustomLawyers();
  // Filter duplicates if any
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
  const years = typeof data.yearsExperience === "string" 
    ? parseInt(data.yearsExperience.replace(/\D/g, ""), 10) || 10 
    : (data.yearsExperience || 10);
  const rate = typeof data.hourlyRate === "string" 
    ? parseFloat(data.hourlyRate.replace(/[^0-9.]/g, "")) || 2500 
    : data.hourlyRate;

  // Curated professional lawyer avatar
  const defaultAvatar = "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=400";

  const newLawyer: Lawyer = {
    id,
    name: data.fullName,
    title: `${data.primaryPractice} Attorney`,
    avatar: defaultAvatar,
    rating: 5.0,
    reviewCount: 1,
    hourlyRate: rate,
    isVerified: true,
    availability: "Available today",
    yearsExperience: years,
    jurisdiction: `Licensed in ${data.stateBar}`,
    tags: [`Practices ${data.primaryPractice}`, `Licensed in ${data.stateBar}`, "New Member"],
    practiceAreas: [data.primaryPractice, "General Advisory"],
    bio: data.bio || `${data.fullName} is an attorney licensed in ${data.stateBar} specializing in ${data.primaryPractice}.`,
    notableCases: [
      {
        year: `${new Date().getFullYear()}`,
        title: "Admitted to Advocato Network",
        summary: `Successfully credentialed in ${data.stateBar} with specialization in ${data.primaryPractice}.`,
      },
    ],
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

