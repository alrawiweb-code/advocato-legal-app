# Advocato MVP Readiness Audit: Transitioning from Prototype to Production

## Executive Summary

The Advocato Legal Marketplace contains a production-ready UI design system, an active Supabase Postgres schema with Row-Level Security policies, live Storage buckets, and an active OpenRouter LLM intake engine. However, the client application currently operates with a **split-brain architecture**: critical user interactions—including authentication bypasses, case creation, and consultation chat—rely on mock demo accounts and browser `localStorage`. 

To transition this platform into a functioning Minimum Viable Product (MVP) where real clients and licensed attorneys can register, communicate, and test live workflows across separate devices, four core architectural subsystems must be addressed.

---

## 1. Authentication & Identity Consolidation

### Current State
* **Demo Accounts & 1-Click Login:** [app/login/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/login/page.tsx#L495-L570) displays three simulated demo personas (`Alex Mercer`, `Sarah Jenkins, Adv.`, `Marcus Vance`).
* **Bypass Cookie:** Clicking a demo persona sets `advocato_demo_auth=true` in `document.cookie`. [lib/supabase/middleware.ts](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/lib/supabase/middleware.ts#L38) and API routes ([app/api/lawyers/route.ts](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/api/lawyers/route.ts#L15), [app/api/practice-areas/route.ts](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/api/practice-areas/route.ts#L14)) accept this cookie as authenticated, completely bypassing Supabase Auth.
* **Ephemeral Client IDs:** When a client registers with email/password in [lib/context/RoleContext.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/lib/context/RoleContext.tsx#L340-L372), the code triggers `supabase.auth.signUp`, but immediately constructs a local session with a synthetic timestamp ID (`client-${Date.now()}`) and saves it to `localStorage` instead of binding to the authenticated Supabase user UUID.

### Action Items for MVP
1. **Remove Demo Accounts & Bypass Hooks:** Delete the `advocato_demo_auth` cookie logic from [lib/supabase/middleware.ts](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/lib/supabase/middleware.ts) and all API routes. Strip the 1-click persona grid from [app/login/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/login/page.tsx).
2. **Unified Supabase Session Pipeline:** Refactor [lib/context/RoleContext.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/lib/context/RoleContext.tsx) to rely strictly on `supabase.auth.onAuthStateChange` and `supabase.auth.getUser()`. User profile data should load from `public.profiles` using the verified `auth.uid()`.
3. **Lawyer Admission Ingestion:** Wire [registerLawyer](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/lib/context/RoleContext.tsx#L374-L476) directly to `public.profiles` and `public.lawyer_profiles` so newly registered attorneys instantly enter the database and become searchable in the marketplace.
4. **Auth Flow Handling:** Ensure Supabase email confirmation configuration is aligned with the frontend (e.g. either auto-confirm emails for staging testing or display a "Check your email for confirmation" banner).

---

## 2. Replacing LocalStorage with Database Persistence

### Current State
* **Case Intake Silo:** When a client completes the AI legal assessment in [app/intake/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/intake/page.tsx#L309-L310), the analysis is written only to `advocato_latest_intake` and `advocato_intake_data` in browser `localStorage`. It is never persisted to the `public.intake_assessments` table.
* **Consultation Booking Silo:** When a user initiates a consultation in [app/lawyers/[id]/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/lawyers/%5Bid%5D/page.tsx#L138), [lib/data/consultations.ts](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/lib/data/consultations.ts#L22-L30) stores the consultation record in `localStorage` under `advocato_consultations`.
* **Zero Cross-Device Visibility:** Because `public.matters` is not populated on booking, an attorney logging into another browser sees zero cases, zero leads, and zero client inquiries.

### Action Items for MVP
1. **Intake Record Creation:** On AI triage completion in [app/intake/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/intake/page.tsx), insert a record into `public.intake_assessments` referencing the client's `auth.uid()`.
2. **Server-Side Matter Generation:** When a client selects "Book Consultation" or "Message Attorney", invoke a server action or API route to insert a new row in `public.matters` with `client_id`, `lawyer_id`, `case_title`, `urgency`, and `status = 'active'`.
3. **Cases Docket Integration:** Update [app/cases/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/cases/page.tsx) to exclusively query `public.matters` with joined lawyer/client profile records, removing `getStoredConsultations()` fallbacks.

---

## 3. Real-Time Chat & Evidentiary Documents

### Current State
* **Simulated Messaging:** [app/messages/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/messages/page.tsx) operates entirely off `getStoredConsultations()`. New messages are appended to an array in `localStorage`. There are zero calls to Supabase in this component.
* **Realtime Broadcast Inactive:** While `public.messages` is configured in `supabase_realtime` publication, no client subscribes to real-time database changes.
* **File Uploads:** While [lib/storage/documents.ts](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/lib/storage/documents.ts) contains the cryptographic hash computation and Supabase Storage client, chat messages do not link uploaded files to `public.documents` rows.

### Action Items for MVP
1. **Supabase Messages Backend:** Refactor [app/messages/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/messages/page.tsx) to query `public.messages` where `matter_id = activeMatter.id`.
2. **Realtime Subscription:** Implement `supabase.channel('messages')` to listen for new `INSERT` events, giving clients and lawyers instantaneous two-way messaging.
3. **Document Tracking:** Link uploaded file metadata directly to `public.documents` referencing `matter_id`, storing binaries in the private `case-documents` bucket.

---

## 4. UI/UX Prototype Scrubbing & Hardcoded Roles

### Current State
* **Hardcoded Avatars & Fallbacks:** Fallback avatars across [RoleContext.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/lib/context/RoleContext.tsx#L175) reference demo image URLs rather than generated SVG initials or uploaded avatars.
* **Lawyer Directory Sync:** [lib/data/lawyers.ts](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/lib/data/lawyers.ts) maintains a 700-line static array of `MOCK_LAWYERS`. While the directory endpoint [app/api/lawyers/route.ts](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/api/lawyers/route.ts) reads from Supabase `lawyer_marketplace_view`, several client components still import `MOCK_LAWYERS` directly for initial state.
* **Profile Role Switching:** [app/profile/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/profile/page.tsx) and navigation components must strictly derive capabilities from the authenticated user's database role (`client` vs `lawyer`), prohibiting clients from impersonating attorneys without bar credentials.

### Action Items for MVP
1. **Purge Static Mock Arrays:** Remove imports of `MOCK_LAWYERS` from pages in favor of API fetching or Server Components.
2. **Default Avatar Generator:** Implement deterministic initials-based avatars for any user without an `avatar_url`.
3. **Enforce Role Boundaries:** Ensure navigation menus and routes strictly reflect the user's role from `public.profiles.role`.

---

## 5. Execution Roadmap

| Milestone | Scope | Dependencies | Est. Complexity |
| :--- | :--- | :--- | :--- |
| **Phase 1: Pure Supabase Auth** | Remove demo personas, remove `advocato_demo_auth`, connect [RoleContext.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/lib/context/RoleContext.tsx) to Supabase Auth and `public.profiles`. | Supabase Auth | Low |
| **Phase 2: Database Matters & Booking** | Wire intake completion and consultation booking to `public.matters` and `public.intake_assessments`. | Phase 1 | Medium |
| **Phase 3: Realtime Database Chat** | Wire [app/messages/page.tsx](file:///c:/Users/Unleashed/Desktop/Work/Alrawi/Legal%20app/app/messages/page.tsx) to `public.messages` and enable Supabase Realtime channel. | Phase 2 | Medium |
| **Phase 4: Production Cleanup** | Remove `localStorage` keys, purge `MOCK_LAWYERS` fallbacks, and verify multi-browser cross-testing. | Phase 3 | Low |
