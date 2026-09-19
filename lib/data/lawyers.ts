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

export const LAWYERS: Lawyer[] = [
  // --- 1. Sarah Jenkins — Employment Law, Delhi, Verified, 14y
  {
    id: "1",
    name: "Sarah Jenkins, Adv.",
    title: "Senior Employment & Labor Counsel",
    headline: "Protecting workplace rights across Delhi and national tribunals for 14 years.",
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400",
    rating: 4.9,
    reviewCount: 48,
    verifiedReviewCount: 34,
    hourlyRate: 3500,
    isVerified: true,
    verificationStatus: "VERIFIED",
    availability: "Available today",
    acceptingClients: true,
    responseTimeHours: 2,
    yearsExperience: 14,
    jurisdiction: "Delhi (DL) • Bar Council #D/4921/2012",
    state: "Delhi (DL)",
    city: "New Delhi",
    languages: ["English", "Hindi"],
    tags: ["Employment Law", "Severance Negotiation", "Non-Competes", "Wrongful Termination"],
    practiceAreas: ["Employment & Labour Law", "Civil Litigation"],
    serviceIds: ["emp-severance", "emp-termination", "emp-noncompete", "emp-wages", "emp-discrimination", "emp-contract"],
    bio: "Sarah Jenkins is a seasoned employment advocate with 14 years of dedicated practice across the Delhi High Court and labour tribunals. She specializes in corporate severance negotiations, executive employment agreements, and non-compete enforceability. Sarah has represented clients ranging from junior employees facing wrongful dismissal to C-suite executives negotiating complex exit packages.",
    notableCases: [
      {
        year: "2025",
        title: "Executive Severance Package Enhancement",
        summary:
          "Negotiated a 4.2x enhanced severance settlement for an enterprise VP following contested restructuring.",
      },
      {
        year: "2024",
        title: "Non-Compete Invalidation Relief",
        summary:
          "Secured immediate ad-interim injunction restraining enforcement of an unconscionable 24-month restrictive covenant.",
      },
    ],
    createdAt: "2022-01-15",
  },

  // --- 2. Marcus Vance — Corporate Law, Maharashtra, Verified, 18y
  {
    id: "2",
    name: "Marcus Vance, Adv.",
    title: "Partner & Commercial Litigation Counsel",
    headline: "Resolving complex corporate disputes and protecting business interests across Mumbai.",
    avatar:
      "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=400",
    rating: 5.0,
    reviewCount: 62,
    verifiedReviewCount: 51,
    hourlyRate: 4500,
    isVerified: true,
    verificationStatus: "VERIFIED",
    availability: "Available today",
    acceptingClients: true,
    responseTimeHours: 3,
    yearsExperience: 18,
    jurisdiction: "Maharashtra (MH) • Bar Council #MAH/8291/2008",
    state: "Maharashtra (MH)",
    city: "Mumbai",
    languages: ["English", "Hindi", "Marathi"],
    tags: ["Corporate Law", "Contract Structuring", "Commercial Disputes", "Startup Advisory"],
    practiceAreas: ["Corporate & Commercial Law", "Dispute Resolution & Arbitration"],
    serviceIds: ["corp-incorporation", "corp-contract", "corp-review", "corp-shareholder", "corp-compliance", "corp-diligence", "corp-startup", "arb-commercial"],
    bio: "Marcus Vance leads complex commercial litigation, startup governance, and corporate contract disputes for clients across Mumbai and nationwide before the Bombay High Court and NCLT. He brings 18 years of experience to shareholder deadlocks, M&A transactions, and cross-border commercial disputes.",
    notableCases: [
      {
        year: "2025",
        title: "Commercial Contract Royalty Settlement",
        summary:
          "Recovered ₹1.85 Cr in unpaid software distribution fees and IP licensing royalties for a private technology vendor.",
      },
      {
        year: "2023",
        title: "Shareholder Deadlock Dissolution",
        summary:
          "Successfully restructured ownership terms avoiding prolonged corporate insolvency proceedings.",
      },
    ],
    createdAt: "2021-06-01",
  },

  // --- 3. Elena Rostova — Employment Law, Karnataka, Verified, 11y
  {
    id: "3",
    name: "Elena Rostova, Adv.",
    title: "Workplace Rights & Civil Litigator",
    headline: "Advocating for IT employees and workplace fairness in Bengaluru's tech sector.",
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400",
    rating: 4.85,
    reviewCount: 39,
    verifiedReviewCount: 27,
    hourlyRate: 2500,
    isVerified: true,
    verificationStatus: "VERIFIED",
    availability: "Available today",
    acceptingClients: true,
    responseTimeHours: 4,
    yearsExperience: 11,
    jurisdiction: "Karnataka (KA) • Bar Council #KAR/6391/2015",
    state: "Karnataka (KA)",
    city: "Bengaluru",
    languages: ["English", "Hindi", "Kannada"],
    tags: ["Wage & Hour", "Workplace Discrimination", "Severance", "Civil Litigation"],
    practiceAreas: ["Employment & Labour Law", "Civil Litigation"],
    serviceIds: ["emp-severance", "emp-wages", "emp-discrimination", "emp-harassment", "emp-contract"],
    bio: "Elena Rostova is an acclaimed workplace rights counsel in Bengaluru focusing on IT employee statutory protection, severance review, and executive workplace disputes. She has represented clients in Karnataka Labour Court, Bengaluru Civil Courts, and High Court.",
    notableCases: [
      {
        year: "2024",
        title: "Multi-Plaintiff Unpaid Compensation Resolution",
        summary:
          "Achieved full statutory back-pay settlement with statutory damages for 12 misclassified technology leads.",
      },
    ],
    createdAt: "2022-03-10",
  },

  // --- 4. David Chen — Intellectual Property, Telangana, Verified, 12y
  {
    id: "4",
    name: "David Chen, Adv.",
    title: "Technology & Intellectual Property Counsel",
    headline: "Safeguarding innovation, brands, and software across Hyderabad's technology ecosystem.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
    rating: 4.95,
    reviewCount: 51,
    verifiedReviewCount: 40,
    hourlyRate: 3000,
    isVerified: true,
    verificationStatus: "VERIFIED",
    availability: "Available today",
    acceptingClients: true,
    responseTimeHours: 3,
    yearsExperience: 12,
    jurisdiction: "Telangana (TS) • Bar Council #TS/5109/2014",
    state: "Telangana (TS)",
    city: "Hyderabad",
    languages: ["English", "Hindi", "Telugu"],
    tags: ["Trademarks", "Technology Licensing", "Trade Secrets", "Software Contracts"],
    practiceAreas: ["Intellectual Property", "Corporate & Commercial Law"],
    serviceIds: ["ip-trademark", "ip-patent", "ip-copyright", "ip-licensing", "ip-secret", "ip-infringement", "corp-contract"],
    bio: "David Chen assists technology founders, creators, and established corporations with brand protection, software licensing compliance, and trade secret safeguarding across Hyderabad and pan-India. He regularly appears before the IP Appellate Board and advises startups on IP strategy.",
    notableCases: [
      {
        year: "2025",
        title: "SaaS Licensing Breach & Copyright Defense",
        summary:
          "Defended enterprise developer against unauthorized code fork and enforced perpetual licensing royalties.",
      },
    ],
    createdAt: "2021-11-20",
  },

  // --- 5. Priya Nair — Family Law, Kerala, Verified, 8y
  {
    id: "5",
    name: "Priya Nair, Adv.",
    title: "Family Law & Matrimonial Specialist",
    headline: "Compassionate and effective legal representation in family and matrimonial matters.",
    avatar:
      "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&q=80&w=400",
    rating: 4.8,
    reviewCount: 31,
    verifiedReviewCount: 22,
    hourlyRate: 2000,
    isVerified: true,
    verificationStatus: "VERIFIED",
    availability: "This week",
    acceptingClients: true,
    responseTimeHours: 6,
    yearsExperience: 8,
    jurisdiction: "Kerala (KL) • Bar Council #KL/3821/2018",
    state: "Kerala (KL)",
    city: "Kochi",
    languages: ["English", "Malayalam", "Hindi"],
    tags: ["Divorce", "Child Custody", "Maintenance", "Matrimonial Law"],
    practiceAreas: ["Family Law", "Civil Litigation"],
    serviceIds: ["fam-divorce", "fam-mutual", "fam-custody", "fam-maintenance", "fam-adoption"],
    bio: "Priya Nair practices family law with a client-first philosophy across Kerala Family Courts and the High Court of Kerala. She handles divorce, custody, maintenance, and domestic matters with empathy and discretion.",
    notableCases: [
      {
        year: "2024",
        title: "Child Custody Favorable Award",
        summary:
          "Secured primary custody for mother in contested proceedings with full visitation protocol.",
      },
    ],
    createdAt: "2023-01-08",
  },

  // --- 6. Rahul Sharma — Property Law, UP, Verified, 16y
  {
    id: "6",
    name: "Rahul Sharma, Adv.",
    title: "Senior Property & Real Estate Counsel",
    headline: "Protecting real estate investments and resolving property disputes across North India.",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
    rating: 4.7,
    reviewCount: 57,
    verifiedReviewCount: 41,
    hourlyRate: 2800,
    isVerified: true,
    verificationStatus: "VERIFIED",
    availability: "Available today",
    acceptingClients: true,
    responseTimeHours: 5,
    yearsExperience: 16,
    jurisdiction: "Uttar Pradesh (UP) • Bar Council #UP/7129/2010",
    state: "Uttar Pradesh (UP)",
    city: "Lucknow",
    languages: ["English", "Hindi", "Urdu"],
    tags: ["Property Title", "Sale Agreement", "Property Disputes", "RERA"],
    practiceAreas: ["Property & Real Estate Law", "Civil Litigation"],
    serviceIds: ["prop-title", "prop-agreement", "prop-diligence", "prop-registration", "prop-dispute", "prop-tenant"],
    bio: "Rahul Sharma is a senior property lawyer based in Lucknow with 16 years of experience handling residential and commercial property disputes, RERA matters, title verifications, and registration across Uttar Pradesh.",
    notableCases: [
      {
        year: "2024",
        title: "RERA Delayed Possession Compensation",
        summary:
          "Obtained full compensation and penalty from a builder for 3-year delayed possession of residential units.",
      },
    ],
    createdAt: "2021-04-15",
  },

  // --- 7. Arjun Mehta — Criminal Law, Gujarat, Verified, 20y
  {
    id: "7",
    name: "Arjun Mehta, Adv.",
    title: "Criminal Defense Specialist",
    headline: "Two decades of criminal defense advocacy across Gujarat High Court and Sessions Courts.",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400",
    rating: 4.75,
    reviewCount: 44,
    verifiedReviewCount: 29,
    hourlyRate: 3200,
    isVerified: true,
    verificationStatus: "VERIFIED",
    availability: "This week",
    acceptingClients: true,
    responseTimeHours: 8,
    yearsExperience: 20,
    jurisdiction: "Gujarat (GJ) • Bar Council #GJ/2291/2006",
    state: "Gujarat (GJ)",
    city: "Ahmedabad",
    languages: ["English", "Hindi", "Gujarati"],
    tags: ["Criminal Defense", "Bail Applications", "FIR Matters", "Sessions Court"],
    practiceAreas: ["Criminal Law"],
    serviceIds: ["crim-consultation", "crim-bail", "crim-anticipatory", "crim-fir", "crim-defense"],
    bio: "Arjun Mehta is one of Ahmedabad's most experienced criminal defense advocates with 20 years of practice across Sessions Courts and the Gujarat High Court. He handles bail matters, anticipatory bail, white-collar defense, and trial representation.",
    notableCases: [
      {
        year: "2023",
        title: "Anticipatory Bail in White-Collar Matter",
        summary:
          "Secured anticipatory bail for a senior executive accused in a corporate fraud investigation.",
      },
    ],
    createdAt: "2020-09-01",
  },

  // --- 8. Amitha Rao — Tax Law, Telangana, Pending Verification, 6y
  {
    id: "8",
    name: "Amitha Rao, Adv.",
    title: "Tax & GST Advisory Counsel",
    headline: "Clear, practical tax guidance for individuals and businesses in Hyderabad.",
    avatar:
      "https://images.unsplash.com/photo-1614644147798-f8c0fc9da7f6?auto=format&fit=crop&q=80&w=400",
    rating: 4.6,
    reviewCount: 18,
    verifiedReviewCount: 11,
    hourlyRate: 2200,
    isVerified: false,
    verificationStatus: "PENDING",
    availability: "Available today",
    acceptingClients: true,
    responseTimeHours: 4,
    yearsExperience: 6,
    jurisdiction: "Telangana (TS) • Bar Council #TS/9183/2020",
    state: "Telangana (TS)",
    city: "Hyderabad",
    languages: ["English", "Telugu", "Hindi"],
    tags: ["Income Tax", "GST", "Tax Appeals", "Corporate Tax"],
    practiceAreas: ["Tax Law"],
    serviceIds: ["tax-income", "tax-gst", "tax-dispute", "tax-appeal", "tax-compliance"],
    bio: "Amitha Rao advises individuals and corporate clients on income tax compliance, GST assessments, and tax dispute resolution before the Income Tax Appellate Tribunal and GST Authority.",
    notableCases: [
      {
        year: "2024",
        title: "GST Demand Dismissal",
        summary:
          "Successfully contested a ₹28L GST demand before the Hyderabad GST Authority citing procedural irregularities.",
      },
    ],
    createdAt: "2023-07-20",
  },

  // --- 9. Vikram Bose — Consumer Law + Cyber Law, West Bengal, Verified, 9y
  {
    id: "9",
    name: "Vikram Bose, Adv.",
    title: "Consumer Rights & Cyber Law Advocate",
    headline: "Helping individuals fight online fraud, defective products, and service failures.",
    avatar:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400",
    rating: 4.65,
    reviewCount: 26,
    verifiedReviewCount: 18,
    hourlyRate: 1800,
    isVerified: true,
    verificationStatus: "VERIFIED",
    availability: "Next week",
    acceptingClients: true,
    responseTimeHours: 12,
    yearsExperience: 9,
    jurisdiction: "West Bengal (WB) • Bar Council #WB/4471/2017",
    state: "West Bengal (WB)",
    city: "Kolkata",
    languages: ["English", "Bengali", "Hindi"],
    tags: ["Consumer Rights", "Cyber Fraud", "Online Defamation", "Data Privacy"],
    practiceAreas: ["Consumer Law", "Cyber Law & Technology"],
    serviceIds: ["cons-dispute", "cons-defective", "cons-service", "cyber-fraud", "cyber-privacy", "cyber-defamation"],
    bio: "Vikram Bose practices consumer rights law and cyber law in Kolkata with appearances before Consumer Disputes Redressal Commissions and Cyber Crime Cells across West Bengal.",
    notableCases: [
      {
        year: "2024",
        title: "Online Fraud Recovery",
        summary:
          "Assisted victim in recovering ₹4.2L from an e-commerce fraudster through parallel civil and police proceedings.",
      },
    ],
    createdAt: "2023-05-15",
  },

  // --- 10. Kavitha Subramaniam — Family Law, Tamil Nadu
  {
    id: "10",
    name: "Kavitha Subramaniam, Adv.",
    title: "Family & Property Law Counsel",
    headline: "Dedicated legal support for families and property matters in Tamil Nadu.",
    avatar:
      "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?auto=format&fit=crop&q=80&w=400",
    rating: 0,
    reviewCount: 0,
    verifiedReviewCount: 0,
    hourlyRate: 1500,
    isVerified: true,
    verificationStatus: "VERIFIED",
    availability: "Available today",
    acceptingClients: true,
    responseTimeHours: 6,
    yearsExperience: 3,
    jurisdiction: "Tamil Nadu (TN) • Bar Council #TN/8821/2023",
    state: "Tamil Nadu (TN)",
    city: "Chennai",
    languages: ["English", "Tamil"],
    tags: ["Family Law", "Property Law", "New Advocate", "Chennai Courts"],
    practiceAreas: ["Family Law", "Property & Real Estate Law"],
    serviceIds: ["fam-divorce", "fam-custody", "fam-maintenance", "prop-title", "prop-agreement", "prop-dispute"],
    bio: "Kavitha Subramaniam is a dedicated lawyer based in Chennai with 3 years of practice specializing in family and property matters before Chennai City Civil Court, Family Courts, and Revenue Courts.",
    notableCases: [],
    createdAt: "2024-02-01",
  },

  // --- 11. Rohit Desai — Banking & Finance Law, Maharashtra, Verified, 15y
  {
    id: "11",
    name: "Rohit Desai, Adv.",
    title: "Banking & Financial Disputes Lawyer",
    headline: "Specializing in debt recovery, insolvency, and banking litigations in Mumbai.",
    avatar:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400",
    rating: 4.85,
    reviewCount: 75,
    verifiedReviewCount: 50,
    hourlyRate: 4000,
    isVerified: true,
    verificationStatus: "VERIFIED",
    availability: "Next week",
    acceptingClients: true,
    responseTimeHours: 4,
    yearsExperience: 15,
    jurisdiction: "Maharashtra (MH) • Bar Council #MAH/3421/2011",
    state: "Maharashtra (MH)",
    city: "Mumbai",
    languages: ["English", "Hindi", "Gujarati"],
    tags: ["Banking Law", "Debt Recovery", "Insolvency", "NCLT"],
    practiceAreas: ["Corporate & Commercial Law"],
    serviceIds: ["corp-compliance", "arb-commercial"],
    bio: "Rohit Desai is a leading expert in banking and financial law in Mumbai. He frequently represents financial institutions and corporate debtors before the DRT, NCLT, and Bombay High Court.",
    notableCases: [
      {
        year: "2023",
        title: "Debt Recovery Tribunal Resolution",
        summary: "Successfully restructured a ₹15 Cr debt for a mid-sized manufacturing company, avoiding liquidation.",
      }
    ],
    createdAt: "2021-08-10",
  },

  // --- 12. Neha Kapoor — Immigration Law, Delhi, Verified, 10y
  {
    id: "12",
    name: "Neha Kapoor, Adv.",
    title: "Immigration & Global Mobility Counsel",
    headline: "Expert guidance for business and family immigration matters.",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
    rating: 4.9,
    reviewCount: 88,
    verifiedReviewCount: 65,
    hourlyRate: 3000,
    isVerified: true,
    verificationStatus: "VERIFIED",
    availability: "Available today",
    acceptingClients: true,
    responseTimeHours: 2,
    yearsExperience: 10,
    jurisdiction: "Delhi (DL) • Bar Council #D/2104/2016",
    state: "Delhi (DL)",
    city: "New Delhi",
    languages: ["English", "Hindi", "Punjabi"],
    tags: ["Immigration", "Visas", "Citizenship", "Global Mobility"],
    practiceAreas: ["General Advisory"],
    serviceIds: ["cons-consultation"],
    bio: "Neha Kapoor assists individuals and corporations with complex immigration processes, work visas, and residency applications. She is highly sought after for her deep understanding of cross-border mobility issues.",
    notableCases: [],
    createdAt: "2022-10-05",
  },

  // --- 13. Samuel D'Souza — Media & Entertainment, Goa, Pending Verification, 7y
  {
    id: "13",
    name: "Samuel D'Souza, Adv.",
    title: "Media & Entertainment Lawyer",
    headline: "Protecting creative rights and structuring deals for artists and production houses.",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400",
    rating: 4.5,
    reviewCount: 22,
    verifiedReviewCount: 15,
    hourlyRate: 2500,
    isVerified: false,
    verificationStatus: "PENDING",
    availability: "This week",
    acceptingClients: true,
    responseTimeHours: 12,
    yearsExperience: 7,
    jurisdiction: "Goa (GA) • Bar Council #GA/102/2019",
    state: "Goa (GA)",
    city: "Panaji",
    languages: ["English", "Konkani", "Hindi"],
    tags: ["Entertainment Law", "Copyrights", "Contracts", "Media"],
    practiceAreas: ["Intellectual Property", "Corporate & Commercial Law"],
    serviceIds: ["ip-copyright", "corp-contract", "ip-licensing"],
    bio: "Samuel advises artists, influencers, and production companies on talent agreements, copyright issues, and media disputes. His background in the arts gives him unique insight into the creative industry's legal needs.",
    notableCases: [],
    createdAt: "2023-11-12",
  },

  // --- 14. Ananya Reddy — Environmental Law, Karnataka, Verified, 13y
  {
    id: "14",
    name: "Ananya Reddy, Adv.",
    title: "Environmental Law & Policy Advocate",
    headline: "Championing sustainable practices and environmental compliance.",
    avatar:
      "https://images.unsplash.com/photo-1531123897727-8f129e1baf8a?auto=format&fit=crop&q=80&w=400",
    rating: 4.8,
    reviewCount: 41,
    verifiedReviewCount: 30,
    hourlyRate: 3500,
    isVerified: true,
    verificationStatus: "VERIFIED",
    availability: "Next week",
    acceptingClients: false,
    responseTimeHours: 24,
    yearsExperience: 13,
    jurisdiction: "Karnataka (KA) • Bar Council #KAR/9382/2013",
    state: "Karnataka (KA)",
    city: "Bengaluru",
    languages: ["English", "Kannada", "Telugu"],
    tags: ["Environmental Law", "Compliance", "NGT", "Policy"],
    practiceAreas: ["Civil Litigation"],
    serviceIds: ["prop-dispute"],
    bio: "Ananya Reddy is a leading voice in environmental law, regularly appearing before the National Green Tribunal (NGT). She advises corporations on environmental compliance and represents citizens' groups in conservation litigations.",
    notableCases: [
      {
        year: "2022",
        title: "Lake Encroachment PIL",
        summary: "Successfully petitioned the High Court to halt illegal construction on a major urban lakebed.",
      }
    ],
    createdAt: "2021-02-18",
  },

  // --- 15. Rajesh Kumar — Medical Negligence, Bihar, Verified, 22y
  {
    id: "15",
    name: "Rajesh Kumar, Adv.",
    title: "Medical Malpractice & Negligence Attorney",
    headline: "Fighting for patients' rights and securing compensation in medical negligence cases.",
    avatar:
      "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&q=80&w=400",
    rating: 4.9,
    reviewCount: 112,
    verifiedReviewCount: 95,
    hourlyRate: 2000,
    isVerified: true,
    verificationStatus: "VERIFIED",
    availability: "Available today",
    acceptingClients: true,
    responseTimeHours: 5,
    yearsExperience: 22,
    jurisdiction: "Bihar (BR) • Bar Council #BR/542/2004",
    state: "Bihar (BR)",
    city: "Patna",
    languages: ["English", "Hindi", "Bhojpuri"],
    tags: ["Medical Negligence", "Consumer Protection", "Personal Injury"],
    practiceAreas: ["Consumer Law", "Civil Litigation"],
    serviceIds: ["cons-dispute", "cons-defective"],
    bio: "With over two decades of experience, Rajesh Kumar is a fierce advocate for victims of medical malpractice. He handles complex litigation involving hospital negligence and diagnostic errors across Bihar and Jharkhand.",
    notableCases: [
      {
        year: "2021",
        title: "Surgical Error Compensation",
        summary: "Won a landmark ₹50L compensation from a private hospital for gross negligence during a routine surgery.",
      }
    ],
    createdAt: "2020-12-05",
  },
  
  // --- 16. Fatima Sheikh — Arbitration, Delhi, Verified, 17y
  {
    id: "16",
    name: "Fatima Sheikh, Adv.",
    title: "Arbitration & Dispute Resolution Counsel",
    headline: "Specializing in high-stakes domestic and international arbitration.",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
    rating: 5.0,
    reviewCount: 35,
    verifiedReviewCount: 30,
    hourlyRate: 6000,
    isVerified: true,
    verificationStatus: "VERIFIED",
    availability: "This week",
    acceptingClients: true,
    responseTimeHours: 2,
    yearsExperience: 17,
    jurisdiction: "Delhi (DL) • Bar Council #D/112/2009",
    state: "Delhi (DL)",
    city: "New Delhi",
    languages: ["English", "Hindi", "Urdu"],
    tags: ["Arbitration", "Mediation", "Commercial Disputes", "International Law"],
    practiceAreas: ["Dispute Resolution & Arbitration", "Corporate & Commercial Law"],
    serviceIds: ["arb-commercial", "corp-contract"],
    bio: "Fatima Sheikh is a distinguished arbitration counsel. She represents multinational corporations in complex commercial disputes, construction arbitrations, and cross-border litigations.",
    notableCases: [],
    createdAt: "2022-05-22",
  },

  // --- 17. Aditya Singh — Startup Law, Haryana, Verified, 5y
  {
    id: "17",
    name: "Aditya Singh, Adv.",
    title: "Startup & Venture Capital Advisor",
    headline: "Navigating founders through incorporation, funding, and growth.",
    avatar:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=400",
    rating: 4.7,
    reviewCount: 28,
    verifiedReviewCount: 20,
    hourlyRate: 2500,
    isVerified: true,
    verificationStatus: "VERIFIED",
    availability: "Available today",
    acceptingClients: true,
    responseTimeHours: 1,
    yearsExperience: 5,
    jurisdiction: "Haryana (HR) • Bar Council #P&H/4321/2021",
    state: "Haryana (HR)",
    city: "Gurugram",
    languages: ["English", "Hindi"],
    tags: ["Startups", "Venture Capital", "Founders Agreement", "ESOPs"],
    practiceAreas: ["Corporate & Commercial Law"],
    serviceIds: ["corp-startup", "corp-incorporation", "corp-contract", "corp-shareholder"],
    bio: "Aditya Singh is a dynamic lawyer based in Gurugram, specializing in the startup ecosystem. He assists early-stage companies with term sheets, founder agreements, ESOP structuring, and compliance.",
    notableCases: [],
    createdAt: "2023-09-15",
  },

  // --- 18. Lakshmi Menon — Constitutional Law, Kerala, Verified, 25y
  {
    id: "18",
    name: "Lakshmi Menon, Sr. Adv.",
    title: "Senior Advocate & Constitutional Law Expert",
    headline: "Fierce defender of fundamental rights and constitutional liberties.",
    avatar:
      "https://images.unsplash.com/photo-1589317578322-3860086c757c?auto=format&fit=crop&q=80&w=400",
    rating: 4.95,
    reviewCount: 150,
    verifiedReviewCount: 120,
    hourlyRate: 8000,
    isVerified: true,
    verificationStatus: "VERIFIED",
    availability: "Next week",
    acceptingClients: false,
    responseTimeHours: 48,
    yearsExperience: 25,
    jurisdiction: "Kerala (KL) • Bar Council #KL/12/2001",
    state: "Kerala (KL)",
    city: "Thiruvananthapuram",
    languages: ["English", "Malayalam"],
    tags: ["Constitutional Law", "Writ Petitions", "Human Rights", "High Court"],
    practiceAreas: ["Civil Litigation"],
    serviceIds: ["civil-writ"],
    bio: "Senior Advocate Lakshmi Menon is a towering figure in the Kerala High Court, known for her landmark arguments in constitutional writ petitions and human rights advocacy.",
    notableCases: [
      {
        year: "2018",
        title: "Landmark Privacy Judgment",
        summary: "Argued successfully for the protection of citizen data privacy against intrusive state surveillance measures.",
      }
    ],
    createdAt: "2020-11-11",
  },

  // --- 19. Chetan Patel — Real Estate, Gujarat, PENDING, 8y
  {
    id: "19",
    name: "Chetan Patel, Adv.",
    title: "Real Estate & Conveyancing Lawyer",
    headline: "Ensuring smooth property transactions and resolving land disputes in Gujarat.",
    avatar:
      "https://images.unsplash.com/photo-1600874130080-60b5435aebfb?auto=format&fit=crop&q=80&w=400",
    rating: 4.4,
    reviewCount: 12,
    verifiedReviewCount: 8,
    hourlyRate: 1800,
    isVerified: false,
    verificationStatus: "PENDING",
    availability: "Available today",
    acceptingClients: true,
    responseTimeHours: 4,
    yearsExperience: 8,
    jurisdiction: "Gujarat (GJ) • Bar Council #GJ/872/2018",
    state: "Gujarat (GJ)",
    city: "Surat",
    languages: ["English", "Gujarati", "Hindi"],
    tags: ["Real Estate", "Conveyancing", "Property Disputes", "RERA"],
    practiceAreas: ["Property & Real Estate Law"],
    serviceIds: ["prop-title", "prop-agreement", "prop-registration", "prop-diligence"],
    bio: "Chetan Patel focuses on property law in Surat. He handles title due diligence, drafting of sale deeds, lease agreements, and represents clients in RERA disputes.",
    notableCases: [],
    createdAt: "2024-01-05",
  },

  // --- 20. Meera Chopra — Cyber Law, Maharashtra, Verified, 11y
  {
    id: "20",
    name: "Meera Chopra, Adv.",
    title: "Data Privacy & Cyber Security Attorney",
    headline: "Advising tech companies on data protection laws and cyber compliance.",
    avatar:
      "https://images.unsplash.com/photo-1542596594-649edbc13630?auto=format&fit=crop&q=80&w=400",
    rating: 4.8,
    reviewCount: 45,
    verifiedReviewCount: 38,
    hourlyRate: 3500,
    isVerified: true,
    verificationStatus: "VERIFIED",
    availability: "This week",
    acceptingClients: true,
    responseTimeHours: 3,
    yearsExperience: 11,
    jurisdiction: "Maharashtra (MH) • Bar Council #MAH/5643/2015",
    state: "Maharashtra (MH)",
    city: "Pune",
    languages: ["English", "Hindi", "Marathi"],
    tags: ["Cyber Law", "Data Privacy", "DPDP Act", "IT Compliance"],
    practiceAreas: ["Cyber Law & Technology", "Corporate & Commercial Law"],
    serviceIds: ["cyber-privacy", "corp-compliance", "ip-secret"],
    bio: "Meera Chopra is a leading voice in data privacy in Pune. She helps IT companies and startups navigate the complexities of the DPDP Act, GDPR, and other global data protection regulations.",
    notableCases: [],
    createdAt: "2022-08-20",
  }
];

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
