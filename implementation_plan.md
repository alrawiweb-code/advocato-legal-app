# Authentication, Routing & Portal Separation Audit

This document outlines the findings of the architectural audit regarding authentication, route protection, role detection, and portal separation in the Advocato application, along with a proposed implementation plan to resolve the identified security and UX flaws.

## User Review Required
> [!WARNING]
> Please review this audit report. Once you approve, I will begin implementing the fixes.

## Audit Findings: Root Causes

### 1. Unauthenticated Users Rendering as "Guest Client" (The Header Issue)
**Why it happens:** 
In `lib/context/RoleContext.tsx`, when no authenticated user is present, the context defaults to returning a mock "Guest" persona with `role: "client"`. 
Simultaneously, `components/navigation/Header.tsx` does **not** check the `isAuthenticated` boolean before rendering the user capsule. It blindly assumes the user is logged in, displaying the "Guest" avatar, "Client" role badge, and protected links (My Cases, Messages), even when the user is completely unauthenticated.

### 2. Missing Unauthenticated State UI
**Why it happens:**
Because `Header.tsx` assumes the user is always logged in, there is no "Sign In" or "Register" button in the navigation bar for unauthenticated visitors. They are trapped in a faux logged-in state.

### 3. Middleware Security Hole & Route Bypass
**Why it happens:**
In `lib/supabase/middleware.ts`, route protections for specific roles (e.g., blocking lawyers from `/intake`, or clients from `/lawyer/dashboard`) are wrapped inside an `if (user)` block.
Because unauthenticated users have no `user` object, they completely skip these role-based checks. Since routes like `/intake` are not explicitly listed in the strict `protectedPrefixes` array, unauthenticated users bypass the middleware entirely and can access `/intake` directly without being redirected to `/login`.

### 4. Lawyer/Client Identity Mixing & UI Flickering
**Why it happens:**
When a Lawyer navigates the site, the authentication state briefly loads (`isLoadingAuth: true`), during which `sessionUser` is `null`. Because `RoleContext.tsx` hardcodes the fallback role as `"client"`, the application briefly flashes the Client Dashboard and Client navigation links before snapping to the Lawyer Dashboard once hydration completes. This causes identities to appear mixed during navigation.

## Proposed Changes

### Fix `RoleContext.tsx`
- Remove the hardcoded "Guest" fallback persona.
- Ensure that if `isAuthenticated` is false, `currentUser` is `null` (or explicitly an unauthenticated stub that components can properly recognize).
- Prevent the `role` from defaulting to `"client"` when loading or unauthenticated. It should be `null` or `"public"`.

### Fix `components/navigation/Header.tsx`
- Wrap the user profile capsule, "My Cases", and "Messages" links in an `isAuthenticated` check.
- If `!isAuthenticated`, display a "Sign In" button and a "For Lawyers" link instead of the faux user profile.

### Fix `lib/supabase/middleware.ts`
- Move `/intake` into the `protectedPrefixes` array (if intake requires authentication). Alternatively, handle unauthenticated `/intake` access gracefully by prompting login before submission.
- Ensure that any path starting with `/lawyer/` (except `/lawyer/register` and `/lawyer/verify`) is strictly protected from unauthenticated users by adding it to `protectedPrefixes`.

### Fix `app/page.tsx`
- The `ClientHomeView` will remain the public landing page, but the header and navigation will now accurately reflect the unauthenticated state, providing clear entry points for clients (Sign In) and lawyers (Attorney Practice).

## Verification Plan

### Automated Tests
- N/A (Relying on manual verification)

### Manual Verification
1. Load `http://localhost:3000` in an Incognito window. Verify the header shows "Sign In" and no faux user profile.
2. Attempt to navigate to `/cases` and verify redirection to `/login`.
3. Attempt to navigate to `/intake` and verify behavior (either redirect to login or allow public access depending on design).
4. Log in as a Lawyer and verify there is no "Client UI" flicker during page loads.
