# Advocato: Complete Screen-by-Screen UI Audit & Plain-English Copy Overhaul

## 1. Executive Summary & Core Diagnoses

This audit inspects every screen in the Advocato application across four critical dimensions: **Sizing**, **Colouring**, **Layout**, and **Text Overload / Jargon**. 

### The Core Problem: The "Legal Text Wall"
A layman who downloads or opens this app is usually experiencing stress—they may have been terminated from their job, faced with a sudden non-compete threat, or shortchanged on wages. Instead of quick reassurance and simple directions, the prototype was treating them like an appellate court clerk:
- Complex Latinate and statutory terminology (*"Privileged Case Briefing Dossier"*, *"Restrictive Covenant Enforceability"*, *"Pre-Engagement Privilege"*, *"Objective Counsel Alignment Ledger"*).
- Walls of explanatory text that push essential action buttons beneath the screen fold.
- Microscopic subtexts (`text-[9px]`, `text-[10px]`) that are difficult to read on mobile viewports.
- Monochromatic or low-contrast brass/slate labels that fail accessibility guidelines.

---

## 2. Global Layman Translation Glossary

| Intimidating Legal Jargon (Old) | Simple Layman Language (New) |
|---|---|
| Privileged Case Briefing Dossier | Quick Case Review |
| Confidential Matter Intake | Tell Us What Happened |
| Pre-Engagement Privilege | 100% Private & Confidential |
| Case Classification & Venue | Step 1: The Basics |
| Primary Practice Domain | What type of legal problem is this? |
| Governing State Jurisdiction | Which state are you in? |
| Statutory Urgency & Deadlines | How urgent is this? |
| Statement of Facts & Timeline | Step 2: What happened? |
| Evidentiary Document Locker | Step 3: Attach documents (optional) |
| Evaluate Case & Rank Counsel | Match Me With a Lawyer |
| Case Alignment Memo | Why this lawyer is a great fit |
| Case-Calibrated Ledger | Your Case Summary |
| Counsel Roster / Peer Network | Find a Lawyer |
| Active Matters / Client Engagements | My Cases |
| Evidentiary Case Exhibit | Case Document |
| Good Standing • State Bar Unified Court | Verified & Licensed |
| Tamper-Evident Custody Verification | Safe & Encrypted File |
| Standard Fee Schedule | Clear Hourly Price |

---

## 3. Screen-by-Screen Audit Matrix

### Screen 1: Homepage (`/` — [app/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/page.tsx))
- **Sizing Issues:** Hero container had heavy vertical padding (`pt-12 md:pt-20 pb-16`), forcing users to scroll before seeing the main buttons. Button heights were inconsistent.
- **Colouring Issues:** The eyebrow badge had very low contrast (`bg-surface-container-low` with subtle hairline border). Brass icons against cream background lacked visual punch.
- **Layout Issues:** The 3-step "Methodology" section took up 7 grid columns with dense 3-sentence blocks per step, overwhelming first-time visitors.
- **Text Size Issues:** Titles were reaching `text-6xl`, while supporting bullet descriptions dropped to `text-xs`.
- **Text Overload & Jargon:**
  - *"Confidential Legal Triage • State Bar Alliance"* &rarr; Confusing to a consumer.
  - *"Statutory Cross-Referencing"* &rarr; Sounds like a law school exam.
  - *"Pre-Engagement Privilege"* &rarr; Needs to simply say *"Everything you share is strictly private"*.

---

### Screen 2: Case Intake (`/intake` — [app/intake/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/intake/page.tsx))
- **Sizing Issues:** Form fields had excessive spacing between headers and inputs. Dropzone was tall with redundant helper sentences.
- **Colouring Issues:** Badge with *"Pre-Engagement Privilege"* in gray slate looked like a disabled system warning rather than reassuring security.
- **Layout Issues:** Three large boxed parts stacked with heavy card borders and inner shadows, creating high cognitive load.
- **Text Size Issues:** Labels were uppercase `text-[11px] font-semibold tracking-wider`, making quick scanning harder for casual users.
- **Text Overload & Jargon:**
  - Header: *"Privileged Case Briefing Dossier"* &rarr; Replace with *"Find the Right Lawyer"*.
  - Part 1: *"Case Classification & Venue"* &rarr; Replace with *"1. Basic Information"*.
  - Part 2: *"Statement of Facts & Timeline"* &rarr; Replace with *"2. Tell your story"*.
  - Textarea placeholder: *"Detail what transpired chronologically: What terms were presented? Were promises or covenants breached?..."* &rarr; Replace with *"Explain what happened in plain English. What went wrong, and how would you like it fixed? No legal words needed."*.
  - Part 3: *"Evidentiary Document Locker"* &rarr; Replace with *"3. Attach files (optional)"*.
  - Action Button: *"Evaluate Case & Rank Counsel"* &rarr; Replace with *"Find Matching Lawyers &rarr;"*.

---

### Screen 3: Lawyer Directory (`/lawyers` — [app/lawyers/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/lawyers/page.tsx))
- **Sizing Issues:** Lawyer cards were cluttered with too many competing micro-elements (Match %, Bar Verified badge, availability pill, tags, memo box, buttons).
- **Colouring Issues:** Muted brass background on the match score pill (`bg-brass/10 border-brass/30`) lacked punch.
- **Layout Issues:** If intake summary was present, it showed a verbose italic paragraph that took up a large block above the cards.
- **Text Size Issues:** Meta tags used `text-[10px]` and `text-[9px]`.
- **Text Overload & Jargon:**
  - *"Case-Calibrated Ledger"* &rarr; Replace with *"Your Case Details"*.
  - *"Case Alignment Memo"* &rarr; Replace with *"Why this lawyer matches"*.
  - *"Bar Verified"* &rarr; Replace with *"Licensed & Verified"*.
  - *"Schedule Case Consultation"* &rarr; Replace with *"Book a Consultation"*.

---

### Screen 4: Lawyer Profile (`/lawyers/[id]` — [app/lawyers/[id]/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/lawyers/%5Bid%5D/page.tsx))
- **Sizing Issues:** The top hero photo was 420px tall on desktop and took up almost the entire mobile viewport, requiring two full swipes to reach the lawyer's bio.
- **Colouring Issues:** Quick stats boxes were identical gray squares with weak focal hierarchy.
- **Layout Issues:** The price and book button were shoved to the top-right in desktop and stacked awkwardly on mobile.
- **Text Size Issues:** Quick stats used 3 different mismatched type sizes (`text-2xl`, `text-lg`, `text-xs`).
- **Text Overload & Jargon:**
  - *"Matter Profile View"* &rarr; Replace with *"Lawyer Profile"*.
  - *"Good Standing • State Bar Unified Court System"* &rarr; Replace with *"Active License • Verified by State Bar"*.
  - *"Core Practice Specialties"* &rarr; Replace with *"Practice Areas"*.
  - *"Professional Biography"* &rarr; Replace with *"About"*.

---

### Screen 5: Active Cases (`/cases` — [app/cases/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/cases/page.tsx))
- **Sizing Issues:** Empty state box had large desktop padding (`p-12`). Card rows were verbose with multiple bullet separators.
- **Colouring Issues:** Status badge green (`emerald-50`) was clean, but surrounding metadata was uniformly muted gray.
- **Layout Issues:** Case title, lead counsel, and matter numbers competed on the same visual line.
- **Text Size Issues:** Matter number was small and hard to read.
- **Text Overload & Jargon:**
  - *"Attorney Case Docket / Client Matter Repository"* &rarr; Replace with *"My Cases"*.
  - *"Active Client Engagements / Active Legal Matters"* &rarr; Replace with *"Your Active Cases"*.
  - *"Privileged Attorney-Client Channel"* &rarr; Replace with *"Private & Secure Chat"*.

---

### Screen 6: Messages & Chat (`/messages` — [app/messages/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/messages/page.tsx))
- **Sizing Issues:** Input bar was cramped on smaller phones with emoji, paperclip, mic, and send buttons all competing in a 360px row.
- **Colouring Issues:** Typing indicator was in brass, looking like an alert instead of a conversational presence indicator.
- **Layout Issues:** Header was dense with matter number, lawyer title, verification badge, and status dot.
- **Text Size Issues:** Timestamps and matter IDs were `text-[9px]`.
- **Text Overload & Jargon:**
  - *"Matter Dossier"* &rarr; Replace with *"Case Info"*.
  - *"Privileged Channel • End-to-End"* &rarr; Replace with *"Private & Confidential"*.
  - *"Tamper-Evident Custody Verification SHA-256"* &rarr; Replace with *"Verified Authentic File"*.
  - *"Evidentiary intake record verified under Attorney-Client Privilege Rule 1.6"* &rarr; Replace with *"Protected by Attorney-Client Privacy"*.
  - Placeholder: *"Respond as Counsel to..."* &rarr; Replace with *"Type a message..."*.

---

### Screen 7: Account & Settings (`/profile` — [app/profile/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/profile/page.tsx))
- **Sizing Issues:** Settings toggles were spaced too tightly without touch padding.
- **Colouring Issues:** Background containers were uniformly light gray with no color emphasis on account status.
- **Layout Issues:** Single stacked list without clear sections for Identity vs Security.
- **Text Overload & Jargon:**
  - *"Institutional Settings & Credentials"* &rarr; Replace with *"My Account"*.
  - *"Manage your authenticated identity, cryptographic vault, and client-attorney role perspective"* &rarr; Replace with *"Manage your account info, privacy settings, and active cases."*.
  - *"Supabase Cryptographic Vault: Synchronized with private case-documents bucket"* &rarr; Replace with *"Secure Document Storage: Active & Encrypted"*.

---

### Screen 8: Header & Bottom Navigation ([Header.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/components/navigation/Header.tsx), [BottomNav.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/components/navigation/BottomNav.tsx))
- **Sizing Issues:** Header had multiple desktop text links that wrapped or crowded on medium screens.
- **Colouring Issues:** Bottom nav active color was subtle.
- **Text Overload & Jargon:**
  - Desktop nav: *"Case Intake"* &rarr; *"Get Help"* / *"Start Case"*.
  - Desktop nav: *"Counsel Directory"* &rarr; *"Find a Lawyer"*.
  - Desktop nav: *"Active Matters"* &rarr; *"My Cases"*.
  - Desktop nav: *"Peer Network"* &rarr; *"Browse Lawyers"*.
  - Desktop nav: *"Begin Case Briefing"* &rarr; *"Get Legal Help"*.
  - Bottom bar tabs: Standardized to **Home**, **Start Case**, **Lawyers**, **Messages**.
