import { PracticeArea, LegalService } from "@/types";

// ============================================================
// LEGAL PRACTICE AREA TAXONOMY
// Normalized structure used by filters, intake, and AI matching
// ============================================================

export const PRACTICE_AREAS: PracticeArea[] = [
  {
    id: "employment",
    name: "Employment & Labour Law",
    icon: "Briefcase",
    description: "Workplace rights, wrongful termination, severance, non-competes, and labour disputes.",
    services: [
      { id: "emp-severance", name: "Severance Agreement Review", practiceAreaId: "employment" },
      { id: "emp-termination", name: "Wrongful Termination Claim", practiceAreaId: "employment" },
      { id: "emp-noncompete", name: "Non-Compete / NDA Dispute", practiceAreaId: "employment" },
      { id: "emp-wages", name: "Unpaid Wages & Overtime", practiceAreaId: "employment" },
      { id: "emp-discrimination", name: "Workplace Discrimination", practiceAreaId: "employment" },
      { id: "emp-harassment", name: "Workplace Harassment", practiceAreaId: "employment" },
      { id: "emp-contract", name: "Employment Contract Review", practiceAreaId: "employment" },
    ],
  },
  {
    id: "corporate",
    name: "Corporate & Commercial Law",
    icon: "Building2",
    description: "Company formation, contracts, shareholder disputes, compliance, and M&A.",
    services: [
      { id: "corp-incorporation", name: "Company Incorporation", practiceAreaId: "corporate" },
      { id: "corp-contract", name: "Commercial Contract Drafting", practiceAreaId: "corporate" },
      { id: "corp-review", name: "Contract Review", practiceAreaId: "corporate" },
      { id: "corp-shareholder", name: "Shareholder Agreement", practiceAreaId: "corporate" },
      { id: "corp-compliance", name: "Business Compliance", practiceAreaId: "corporate" },
      { id: "corp-diligence", name: "Due Diligence", practiceAreaId: "corporate" },
      { id: "corp-ma", name: "M&A Advisory", practiceAreaId: "corporate" },
      { id: "corp-startup", name: "Startup Legal Advisory", practiceAreaId: "corporate" },
    ],
  },
  {
    id: "ip",
    name: "Intellectual Property",
    icon: "Lightbulb",
    description: "Trademarks, patents, copyrights, trade secrets, and technology licensing.",
    services: [
      { id: "ip-trademark", name: "Trademark Registration", practiceAreaId: "ip" },
      { id: "ip-patent", name: "Patent Filing Advisory", practiceAreaId: "ip" },
      { id: "ip-copyright", name: "Copyright Protection", practiceAreaId: "ip" },
      { id: "ip-licensing", name: "Technology Licensing", practiceAreaId: "ip" },
      { id: "ip-secret", name: "Trade Secret Protection", practiceAreaId: "ip" },
      { id: "ip-infringement", name: "IP Infringement Dispute", practiceAreaId: "ip" },
    ],
  },
  {
    id: "property",
    name: "Property & Real Estate Law",
    icon: "Home",
    description: "Property purchase, title verification, disputes, registration, and tenant rights.",
    services: [
      { id: "prop-title", name: "Property Title Verification", practiceAreaId: "property" },
      { id: "prop-agreement", name: "Sale Agreement Review", practiceAreaId: "property" },
      { id: "prop-diligence", name: "Property Due Diligence", practiceAreaId: "property" },
      { id: "prop-registration", name: "Registration Assistance", practiceAreaId: "property" },
      { id: "prop-dispute", name: "Property Dispute Consultation", practiceAreaId: "property" },
      { id: "prop-tenant", name: "Tenant / Landlord Rights", practiceAreaId: "property" },
    ],
  },
  {
    id: "family",
    name: "Family Law",
    icon: "Users",
    description: "Divorce, custody, maintenance, adoption, and matrimonial disputes.",
    services: [
      { id: "fam-divorce", name: "Divorce Consultation", practiceAreaId: "family" },
      { id: "fam-mutual", name: "Mutual Divorce Documentation", practiceAreaId: "family" },
      { id: "fam-custody", name: "Child Custody Consultation", practiceAreaId: "family" },
      { id: "fam-maintenance", name: "Maintenance / Alimony", practiceAreaId: "family" },
      { id: "fam-adoption", name: "Adoption Advisory", practiceAreaId: "family" },
    ],
  },
  {
    id: "criminal",
    name: "Criminal Law",
    icon: "Shield",
    description: "Bail, FIR, criminal defense, anticipatory bail, and trial representation.",
    services: [
      { id: "crim-consultation", name: "Criminal Consultation", practiceAreaId: "criminal" },
      { id: "crim-bail", name: "Bail Application", practiceAreaId: "criminal" },
      { id: "crim-anticipatory", name: "Anticipatory Bail", practiceAreaId: "criminal" },
      { id: "crim-fir", name: "FIR Assistance", practiceAreaId: "criminal" },
      { id: "crim-defense", name: "Criminal Defense", practiceAreaId: "criminal" },
    ],
  },
  {
    id: "tax",
    name: "Tax Law",
    icon: "Calculator",
    description: "Income tax, GST, tax disputes, assessments, and appeals.",
    services: [
      { id: "tax-income", name: "Income Tax Advisory", practiceAreaId: "tax" },
      { id: "tax-gst", name: "GST Advisory", practiceAreaId: "tax" },
      { id: "tax-dispute", name: "Tax Dispute Resolution", practiceAreaId: "tax" },
      { id: "tax-appeal", name: "Tax Appeals", practiceAreaId: "tax" },
      { id: "tax-compliance", name: "Corporate Tax Compliance", practiceAreaId: "tax" },
    ],
  },
  {
    id: "cyber",
    name: "Cyber Law & Technology",
    icon: "Monitor",
    description: "Online fraud, data privacy, cybercrime, and digital contracts.",
    services: [
      { id: "cyber-fraud", name: "Cyber Fraud Consultation", practiceAreaId: "cyber" },
      { id: "cyber-privacy", name: "Data Privacy & DPDP Act", practiceAreaId: "cyber" },
      { id: "cyber-defamation", name: "Online Defamation", practiceAreaId: "cyber" },
      { id: "cyber-contract", name: "Digital Contract Review", practiceAreaId: "cyber" },
    ],
  },
  {
    id: "banking",
    name: "Banking & Finance Law",
    icon: "Landmark",
    description: "Loan recovery, NPA, SARFAESI, financial agreements, and RBI compliance.",
    services: [
      { id: "bank-recovery", name: "Loan Recovery", practiceAreaId: "banking" },
      { id: "bank-npa", name: "NPA / SARFAESI Advisory", practiceAreaId: "banking" },
      { id: "bank-agreement", name: "Financial Agreement Review", practiceAreaId: "banking" },
      { id: "bank-compliance", name: "RBI Compliance", practiceAreaId: "banking" },
    ],
  },
  {
    id: "consumer",
    name: "Consumer Law",
    icon: "ShoppingBag",
    description: "Consumer disputes, defective products, service complaints, and NCDRC matters.",
    services: [
      { id: "cons-dispute", name: "Consumer Dispute Filing", practiceAreaId: "consumer" },
      { id: "cons-defective", name: "Defective Product Claim", practiceAreaId: "consumer" },
      { id: "cons-service", name: "Service Deficiency Claim", practiceAreaId: "consumer" },
    ],
  },
  {
    id: "immigration",
    name: "Immigration Law",
    icon: "Globe",
    description: "Visas, work permits, OCI/PIO, and immigration disputes.",
    services: [
      { id: "imm-visa", name: "Visa Advisory", practiceAreaId: "immigration" },
      { id: "imm-permit", name: "Work Permit Advisory", practiceAreaId: "immigration" },
      { id: "imm-oci", name: "OCI / PIO Advisory", practiceAreaId: "immigration" },
      { id: "imm-nri", name: "NRI Legal Matters", practiceAreaId: "immigration" },
    ],
  },
  {
    id: "arbitration",
    name: "Dispute Resolution & Arbitration",
    icon: "Scale",
    description: "Arbitration, mediation, and alternative dispute resolution.",
    services: [
      { id: "arb-commercial", name: "Commercial Arbitration", practiceAreaId: "arbitration" },
      { id: "arb-mediation", name: "Mediation", practiceAreaId: "arbitration" },
      { id: "arb-international", name: "International Arbitration", practiceAreaId: "arbitration" },
    ],
  },
  {
    id: "environmental",
    name: "Environmental Law",
    icon: "Leaf",
    description: "NGT matters, pollution disputes, environmental clearance, and compliance.",
    services: [
      { id: "env-ngt", name: "NGT Matter Filing", practiceAreaId: "environmental" },
      { id: "env-compliance", name: "Environmental Compliance", practiceAreaId: "environmental" },
      { id: "env-clearance", name: "Environmental Clearance Advisory", practiceAreaId: "environmental" },
    ],
  },
  {
    id: "constitutional",
    name: "Constitutional & Administrative Law",
    icon: "BookOpen",
    description: "Writ petitions, fundamental rights, PIL, and government/regulatory matters.",
    services: [
      { id: "const-writ", name: "Writ Petition Filing", practiceAreaId: "constitutional" },
      { id: "const-pil", name: "PIL Advisory", practiceAreaId: "constitutional" },
      { id: "const-rights", name: "Fundamental Rights Matters", practiceAreaId: "constitutional" },
    ],
  },
];

// Flat lookup map for efficient O(1) service lookup
export const SERVICE_MAP: Map<string, LegalService> = new Map(
  PRACTICE_AREAS.flatMap((pa) => pa.services.map((s) => [s.id, s]))
);

// Flat lookup map for practice area
export const PRACTICE_AREA_MAP: Map<string, PracticeArea> = new Map(
  PRACTICE_AREAS.map((pa) => [pa.id, pa])
);

export function getPracticeAreaByName(name: string): PracticeArea | undefined {
  return PRACTICE_AREAS.find(
    (pa) => pa.name.toLowerCase() === name.toLowerCase()
  );
}

export function getServicesForPracticeArea(practiceAreaId: string): LegalService[] {
  return PRACTICE_AREA_MAP.get(practiceAreaId)?.services || [];
}

export function getServiceById(serviceId: string): LegalService | undefined {
  return SERVICE_MAP.get(serviceId);
}

// All languages supported on the platform
export const SUPPORTED_LANGUAGES = [
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Bengali",
  "Marathi",
  "Gujarati",
  "Punjabi",
  "Urdu",
  "Odia",
  "Assamese",
  "Rajasthani",
];
