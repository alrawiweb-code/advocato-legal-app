# Advocato User & Lawyer Interaction Flows

This document outlines the end-to-end user journeys for both prospective clients seeking legal assistance and licensed attorneys managing client matters within the Advocato platform.

---

## 1. Client User Flow (Legal Help Seeker)

The client experience is engineered to eliminate legal friction, remove anxiety, and match clients directly with verified state bar attorneys without high upfront retainer barriers.

### Stage 1: Discovery & Value Orientation
- **Landing Surface ([app/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/page.tsx))**: The client enters the homepage and is greeted with clear, layman-friendly copy addressing common legal dilemmas (workplace disputes, employment contracts, severance agreements). Trust markers highlight attorney-client privilege protection, 100% confidentiality, and state bar verification.
- **Orientation & Transparency**: The client reviews the 3-step explanation (Describe your issue &rarr; Review matched attorneys &rarr; Connect directly) and verified attorney highlights before taking action.

### Stage 2: Free Case Review & Intake
- **Intake Entry ([app/intake/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/intake/page.tsx))**: Accessed via "Start Free Case Review" or the persistent "Get Legal Help" header call-to-action.
- **Topic Shortcuts**: The client can tap quick-topic presets (Severance Agreement, Non-Compete Clause, Wrongful Termination, Unpaid Wages, Contract Review, Discrimination) to pre-fill their legal category.
- **Narrative Explanation & Dictation**: The client explains what occurred in their own words. Users on mobile or desktop who prefer speaking can engage the built-in continuous voice dictation tool, which transcribes speech in real time with duplicate elimination.
- **Jurisdiction & Evidence Uploads**: The client designates the governing state (e.g. New York, California, Texas) to ensure bar licensing compliance, and drags or attaches relevant documents (employment contracts, termination letters, pay records).
- **Automated Matching Analysis**: Clicking "Find Matching Lawyers" runs an intelligent matching simulation that tags the case and saves the brief into local state and Supabase.

### Stage 3: Attorney Matches & Vetting
- **Curated Matches Directory ([app/lawyers/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/lawyers/page.tsx))**: Clients are redirected to their personalized matches. A case brief summary card reinforces their selected category, jurisdiction, and matter requirements.
- **Filtering & Comparative Analysis**: The client filters by immediate availability ("Available Today") or specific practice categories, and sorts by match quality, trial experience, or transparent hourly pricing.
- **Detailed Attorney Profile ([app/lawyers/[id]/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/lawyers/%5Bid%5D/page.tsx))**: Clicking an attorney displays verified state bar admission numbers, practice background, years in practice, and historical case outcomes.

### Stage 4: Booking & Privileged Consultation
- **Consultation Scheduling**: The client initiates "Book Consultation", selects an open calendar date and time slot, and confirms their preferred meeting channel (Video Consultation or Phone).
- **Automated Matter Assignment**: The platform creates a confidential matter number (e.g. `MAT-2026-0891`) and initializes the consultation record in [lib/data/consultations.ts](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/lib/data/consultations.ts).

### Stage 5: Active Matter Management & Communication
- **Case Dashboard ([app/cases/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/cases/page.tsx))**: The client tracks all ongoing matters, assigned counsel, and unread communication counts.
- **Direct Encrypted Chat ([app/messages/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/messages/page.tsx))**: The client exchanges messages and supplementary documents with assigned counsel in real time with typing indicators and delivery statuses.
- **Video Consultation Room ([components/consultation/VideoConsultationRoom.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/components/consultation/VideoConsultationRoom.tsx))**: At the appointed time, the client launches the privileged video room directly inside the browser with screen sharing and meeting notes.

---

## 2. Lawyer User Flow (Licensed Attorney)

The attorney experience is structured around rapid matter evaluation, conflict-free client triage, and friction-free direct consultations.

### Stage 1: Registration & Bar Verification
- **Attorney Onboarding ([app/lawyer/register/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/lawyer/register/page.tsx))**: A 3-step wizard collects primary contact details, law firm affiliation, state bar admission details, verified bar license number, and years of courtroom experience.
- **Rate Publication & Specialization**: The attorney defines their published hourly consultation rate and biographical summary. Submitting the wizard registers the lawyer profile, stores credentials in [lib/data/lawyers.ts](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/lib/data/lawyers.ts) and Supabase, and automatically sets the active role to "lawyer" via [lib/context/RoleContext.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/lib/context/RoleContext.tsx).

### Stage 2: Practice Dashboard & Operations
- **Attorney Command Center ([app/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/page.tsx) in Lawyer View)**: The lawyer dashboard provides immediate visibility into:
  1. Active bar license and roster status banner.
  2. Core operational metrics: count of assigned active client cases, unread messages awaiting counsel response, and current consultation billing rate.
  3. Direct shortcut to review or edit their public-facing attorney profile.
  4. Client Consultations List: Real-time matter queue displaying client names, assigned matter numbers, matter subject lines, and one-click chat triggers.

### Stage 3: Client Case Triage & Document Examination
- **Client Cases Overview ([app/cases/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/cases/page.tsx))**: The attorney reviews all submitted matters assigned to their practice area and jurisdiction.
- **Privileged Dossier Review**: The attorney inspects the client's original narrative statement, jurisdiction details, and uploaded contracts, severance clauses, or employment correspondence under attorney-client privilege.

### Stage 4: Counsel Communication & Consultation Execution
- **Secure Messaging Suite ([app/messages/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/messages/page.tsx))**: The attorney conducts confidential legal discussions, answers preliminary client questions, requests additional supporting documentation, or confirms upcoming consultation times.
- **Privileged Video Consultation ([components/consultation/VideoConsultationRoom.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/components/consultation/VideoConsultationRoom.tsx))**: The attorney conducts initial consultations with real-time video, screen sharing for document markups, and integrated consultation notes.

### Stage 5: Role Switching & Profile Governance
- **Global Perspective Switcher ([components/navigation/Header.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/components/navigation/Header.tsx) and [app/profile/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/profile/page.tsx))**: Attorneys can toggle instantaneously between Lawyer View and Client View to test intake flows, inspect how their public profile appears in directory searches, and audit client-facing pricing cards.
