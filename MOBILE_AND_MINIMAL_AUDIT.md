# Advocato: Mobile-Native Experience & Minimal Production Data Blueprint

This audit identifies the exact deficiencies preventing Advocato from looking and feeling like a first-class mobile application, and details the blueprint for purging prototype dummy data into a clean, minimal, production-grade state.

---

## 1. Mobile-App Feel vs. Desktop Web Incoherence

While the application is nominally responsive, its user experience resembles a compressed desktop website rather than a dedicated mobile app (PWA/native container).

### A. Viewport and Layout Sizing Faults
- **Static Height Breakages (`100vh` vs. `100dvh`):** In [app/messages/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/messages/page.tsx) and [app/intake/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/intake/page.tsx), layout containers use `calc(100vh - 4rem)`. On mobile Safari and Chrome, dynamic address bar expansions cause content to jump, clip underneath browser chrome, or create double scrollbars.
- **Over-Padding on Mobile Viewports:** Containers throughout the app apply desktop-oriented horizontal gutters (`px-6 sm:p-8`), consuming up to 35% of horizontal real estate on 375px–390px screens (iPhone SE, iPhone 15) and forcing horizontal overflow or excessive line wrapping.
- **Scroll Bouncing:** Pages lack `overscroll-behavior-y: none`, causing rubber-banding that reveals white browser background behind dark headers or bottom bars.

### B. Navigation & Navigation Bar Polish
- **Cluttered Bottom Bar Role-Switcher:** In [components/navigation/BottomNav.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/components/navigation/BottomNav.tsx#L75-L88), a two-tiered bar displays a prototype banner: `"Active View: Client (Alex Mercer) Switch to Lawyer"`. In a production consumer/attorney app, an administrative role toggle must never sit on top of the primary navigation bar. It must reside inside the Profile/Settings sheet.
- **Absence of Native Bottom Sheets:** Modals (such as the document preview, call modal, and consultation picker) render as desktop-style centered floating boxes with black backdrops. Native mobile applications use swipeable **bottom sheets** with drag handles that slide in from the bottom edge (`translate-y-full` to `translate-y-0`).
- **Keyboard Viewport Obscuration:** In [app/messages/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/messages/page.tsx), the message input is locked with `fixed inset-x-0 bottom-16`. When the mobile virtual keyboard triggers, the input gets covered by the keyboard or overlaps mobile nav controls due to missing `visualViewport` resize listeners.

### C. Hero & Editorial Scale
- **Oversized Display Type:** In [app/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/page.tsx), the hero title reaches `text-5xl sm:text-6xl`, pushing the primary intake call to action completely off the first mobile screenfold. Mobile-first apps maintain high-density hierarchy (e.g., `text-2xl sm:text-3xl` max on phones) with action buttons immediately accessible without scrolling.

---

## 2. Dummy Data Audit & Production Purge Checklist

The application currently carries heavy layers of prototype mock data across multiple files that undermine credibility:

### A. Intake Page ([app/intake/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/intake/page.tsx))
1. **Pre-Seeded Mock File:** Lines 73–80 inject a dummy document `severance_agreement_draft.pdf (1.4 MB)` by default. When a client opens intake, they are presented with a pre-existing fake file they did not upload.
   - *Fix:* Initialize `documents` as an empty array (`[]`).
2. **Dense Wall of Preset Scenarios:** Lines 29–54 display four verbose sample prompts ("Executive Severance & 2-Year Non-Compete Review", etc.). While helpful for demos, this clutters the interface and screams "prototype template".
   - *Fix:* Replace preset text cards with clean, minimal category selector chips (*Severance*, *Contract*, *Dispute*, *Advisory*).

### B. Messages & Consultations ([lib/data/consultations.ts](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/lib/data/consultations.ts))
1. **Hardcoded Mock Matter Dockets:** `INITIAL_CONSULTATIONS` seeds 4 hardcoded conversations with pre-baked messages ("Good morning Alex. I've completed the preliminary audit...", fake matter numbers `ADV-2024-8842`, `AI-TRIAGE-004`).
   - *Fix:* Remove hardcoded consultations. When a new user logs in, query Supabase `matters`. If empty, render a minimal, dignified zero-state:
     *"Your confidential matter vault is clear. Submit an intake to connect with licensed counsel."*
2. **Hardcoded Client Identity "Alex Mercer":** The entire app assumes the user is named "Alex Mercer".
   - *Fix:* Derive client identity dynamically from Supabase Auth (`user.user_metadata?.full_name || user.email`).

### C. Lawyer Roster ([lib/data/lawyers.ts](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/lib/data/lawyers.ts))
1. **Consumer-Grade Star Ratings:** Elena Rostova and Marcus Sterling carry consumer-style ratings (`★ 4.9 (124 reviews)`, `★ 4.8 (89 reviews)`). Serious legal marketplaces for senior commercial counsel prioritize State Bar admission and credential verification over consumer star ratings.
   - *Fix:* Remove Yelp/Amazon star counters. Display verified bar status, admission year, and practice specialization.
2. **Hardcoded Portrait URLs:** Avatars point to temporary Google usercontent URLs (`lh3.googleusercontent.com/aida-public/...`) that can expire or break.
   - *Fix:* Standardize on clean, SVG architectural monograms or persistent CDN assets.
3. **Database-Driven Lawyer Directory:** When Supabase is configured, fetch lawyers directly from the `lawyer_profiles` table populated during migrations, with zero hardcoded in-memory state.

### D. Active Matters Page ([app/cases/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/cases/page.tsx))
- The docket page renders mock appointment times (*"Next Session: Tomorrow 2:00 PM"*) and mock draft indicators (*"1 Redline Draft Ready"*).
- *Fix:* Wire matter cards to real Supabase `matters` table records with clean empty states.

---

## 3. The Minimalist Production Architecture

A high-end legal platform (reminiscent of Linear, Clerky, or Stripe) succeeds through restrained elegance, zero clutter, and instantaneous utility:

```
┌─────────────────────────────────────────────────────────┐
│ [Advocato]                                [Account AM]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Confidential Counsel Intake                            │
│  Brief your situation. Matched in minutes.             │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ What occurred? (e.g. severance deadline, dispute) │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  [+] Attach Agreement (PDF, DOCX)                       │
│                                                         │
│  [ Begin Privileged Evaluation → ]                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [Home]       [Intake]       [Matters]      [Messages]  │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Prioritized Execution Plan

1. **Purge Dummy State:**
   - Empty default document list in [app/intake/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/intake/page.tsx).
   - Empty default consultation seed list in [lib/data/consultations.ts](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/lib/data/consultations.ts).
   - Add clean zero-states for `/cases` and `/messages`.
   - Strip fake star ratings in [lib/data/lawyers.ts](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/lib/data/lawyers.ts).
2. **Native Mobile App Layout Restyling:**
   - Streamline [components/navigation/BottomNav.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/components/navigation/BottomNav.tsx) into a sleek 4-tab iOS/Android style bar without the bulky role switcher banner.
   - Move persona/role switcher cleanly into the Profile view [app/profile/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/profile/page.tsx).
   - Convert desktop dialog modals into mobile bottom sheets.
   - Adjust typography and padding scales for `390px` viewports using `100dvh`.
