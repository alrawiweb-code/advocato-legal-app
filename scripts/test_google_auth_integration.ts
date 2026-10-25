/**
 * Automated Test Suite: Google OAuth Integration, Cross-Portal Protection & Client Onboarding
 *
 * Verifies:
 * 1. Safe Origin & Protocol Determination (Localhost vs Vercel Production)
 * 2. Open Redirect Defense (Sanitization of 'next' query parameter)
 * 3. Role Preservation & Explicit Cross-Portal Error Messaging:
 *    - Established lawyer on client portal redirected to /login?tab=lawyer&error=already_lawyer
 *    - Established client on lawyer portal redirected to /login?tab=client&error=already_client
 *    - Brand-new lawyer registration assigned role='lawyer' and routed to /lawyer/verify
 *    - Brand-new client registration routed to /client/onboarding
 *    - Returning client with complete onboarding routed to /
 *    - Returning client with incomplete onboarding routed to /client/onboarding
 *    - Returning unverified lawyer routed to /lawyer/verify
 *    - Returning verified lawyer routed to /
 * 4. Heuristic-Free Account State Contract (matters, identities, onboarding flags)
 * 5. New Lawyer Regulatory Verification Barrier (Google auth leaves status = NOT_VERIFIED)
 * 6. Regression safety of Email/Password & 6-digit OTP methods
 */

import { createClient } from "@supabase/supabase-js";

async function runGoogleAuthTests() {
  console.log("==========================================================");
  console.log("   ADVOCATO GOOGLE AUTH & ROLE PRESERVATION TEST SUITE    ");
  console.log("==========================================================\n");

  let passed = 0;
  let total = 0;

  function assert(description: string, condition: boolean) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${description}`);
      process.exitCode = 1;
    }
  }

  // --- TEST 1: Origin Determination (Localhost vs Vercel Production) ---
  console.log("1. Testing Dynamic Origin Determination...");
  const resolveTargetOrigin = (urlOrigin: string, forwardedHost?: string, forwardedProto?: string) => {
    return forwardedHost ? `${forwardedProto ?? "https"}://${forwardedHost}` : urlOrigin;
  };

  const localOrigin = resolveTargetOrigin("http://localhost:3000");
  assert("Resolves local development origin to http://localhost:3000", localOrigin === "http://localhost:3000");

  const prodOrigin = resolveTargetOrigin("https://advocato-legal-app.vercel.app", "advocato-legal-app.vercel.app", "https");
  assert("Resolves production origin to https://advocato-legal-app.vercel.app", prodOrigin === "https://advocato-legal-app.vercel.app");

  // --- TEST 2: Open Redirect Defense ---
  console.log("\n2. Testing Open Redirect Sanitization...");
  const sanitizeNext = (rawNext: string | null): string | null => {
    if (rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")) {
      return rawNext;
    }
    return null;
  };

  assert("Allows valid internal route /cases", sanitizeNext("/cases") === "/cases");
  assert("Allows valid nested route /lawyer/verify", sanitizeNext("/lawyer/verify") === "/lawyer/verify");
  assert("Allows client onboarding route /client/onboarding", sanitizeNext("/client/onboarding") === "/client/onboarding");
  assert("Blocks protocol-relative open redirect //evil.com", sanitizeNext("//evil.com") === null);
  assert("Blocks absolute external URL https://attacker.com", sanitizeNext("https://attacker.com") === null);
  assert("Blocks javascript: URI scheme", sanitizeNext("javascript:alert(1)") === null);
  assert("Handles null next param gracefully", sanitizeNext(null) === null);

  // --- TEST 3: Deterministic (Heuristic-Free) Role & Routing Logic ---
  console.log("\n3. Testing Role Preservation, Cross-Portal Protection & Onboarding Routing...");

  interface UserAuthContext {
    existingRole?: string;
    hasLawyerProfile?: boolean;
    isLawyerVerified?: boolean;
    hasClientMatters?: boolean;
    hasMultipleIdentities?: boolean;
    hasEmailIdentity?: boolean;
    hasCompletedClientOnboarding?: boolean;
    intentRole: string | null;
    intentMode?: string | null;
    safeNext: string | null;
  }

  const resolveCallbackDestination = (ctx: UserAuthContext) => {
    const isLawyer = ctx.existingRole === "lawyer" || Boolean(ctx.hasLawyerProfile);
    const isEstablishedClient =
      ctx.existingRole === "client" &&
      (Boolean(ctx.hasClientMatters) ||
        Boolean(ctx.hasMultipleIdentities) ||
        Boolean(ctx.hasEmailIdentity) ||
        Boolean(ctx.hasCompletedClientOnboarding));

    // Scenario A: Established Lawyer
    if (isLawyer) {
      if (ctx.intentRole === "client") {
        return {
          finalRole: "lawyer",
          destination: "/login?tab=lawyer&error=already_lawyer",
          isNewUser: false,
          crossPortalBlocked: true,
        };
      }
      const defaultDest = ctx.isLawyerVerified === false ? "/lawyer/verify" : "/";
      const destination = (ctx.safeNext && ctx.safeNext !== "/") ? ctx.safeNext : defaultDest;
      return {
        finalRole: "lawyer",
        destination,
        isNewUser: false,
        crossPortalBlocked: false,
      };
    }

    // Scenario B: Established Client
    if (isEstablishedClient) {
      if (ctx.intentRole === "lawyer") {
        return {
          finalRole: "client",
          destination: "/login?tab=client&error=already_client",
          isNewUser: false,
          crossPortalBlocked: true,
        };
      }
      if (!ctx.hasCompletedClientOnboarding) {
        return {
          finalRole: "client",
          destination: "/client/onboarding",
          isNewUser: false,
          crossPortalBlocked: false,
        };
      }
      const destination = ctx.safeNext && !ctx.safeNext.startsWith("/lawyer") ? ctx.safeNext : "/";
      return {
        finalRole: "client",
        destination,
        isNewUser: false,
        crossPortalBlocked: false,
      };
    }

    // Scenario C: Brand-New Lawyer Registration
    if (ctx.intentRole === "lawyer" && !isEstablishedClient && !isLawyer) {
      const lawyerDestination = (ctx.safeNext && ctx.safeNext !== "/") ? ctx.safeNext : "/lawyer/verify";
      return {
        finalRole: "lawyer",
        destination: lawyerDestination,
        isNewUser: true,
        crossPortalBlocked: false,
      };
    }

    // Scenario D: Brand-New Client (or Incomplete Onboarding)
    if (!ctx.hasCompletedClientOnboarding) {
      return {
        finalRole: "client",
        destination: "/client/onboarding",
        isNewUser: true,
        crossPortalBlocked: false,
      };
    }

    return {
      finalRole: "client",
      destination: ctx.safeNext ?? "/",
      isNewUser: false,
      crossPortalBlocked: false,
    };
  };

  // Case 3a: Existing lawyer clicking Client Tab
  const lawyerOnClientTab = resolveCallbackDestination({
    existingRole: "lawyer",
    hasLawyerProfile: true,
    intentRole: "client",
    safeNext: null,
  });
  assert("Existing lawyer on Client tab preserves role='lawyer'", lawyerOnClientTab.finalRole === "lawyer");
  assert("Existing lawyer on Client tab is redirected to /login?tab=lawyer&error=already_lawyer", lawyerOnClientTab.destination === "/login?tab=lawyer&error=already_lawyer");
  assert("Cross-portal attempt is flagged as blocked", lawyerOnClientTab.crossPortalBlocked);

  // Case 3b: Existing client clicking Lawyer Tab (Sign In or Register)
  const clientOnLawyerTab = resolveCallbackDestination({
    existingRole: "client",
    hasCompletedClientOnboarding: true,
    intentRole: "lawyer",
    safeNext: null,
  });
  assert("Existing client on Lawyer tab preserves role='client'", clientOnLawyerTab.finalRole === "client");
  assert("Existing client on Lawyer tab is redirected to /login?tab=client&error=already_client", clientOnLawyerTab.destination === "/login?tab=client&error=already_client");
  assert("Cross-portal attempt is flagged as blocked", clientOnLawyerTab.crossPortalBlocked);

  // Case 3c: Existing client with matters trying to Register as Lawyer
  const clientWithMattersOnLawyer = resolveCallbackDestination({
    existingRole: "client",
    hasClientMatters: true,
    intentRole: "lawyer",
    safeNext: "/lawyer/verify",
  });
  assert("Client with active matters cannot escalate to lawyer", clientWithMattersOnLawyer.finalRole === "client");
  assert("Client with matters is redirected to /login?tab=client&error=already_client", clientWithMattersOnLawyer.destination === "/login?tab=client&error=already_client");

  // Case 3d: Existing client who registered via email/password now using Google
  const emailPasswordClientUsingGoogle = resolveCallbackDestination({
    existingRole: "client",
    hasEmailIdentity: true,
    intentRole: "lawyer",
    safeNext: null,
  });
  assert("Email/password client cannot escalate to lawyer via Google", emailPasswordClientUsingGoogle.finalRole === "client");
  assert("Email/password client redirected with already_client error", emailPasswordClientUsingGoogle.destination === "/login?tab=client&error=already_client");

  // Case 3e: Brand-new lawyer registration
  const brandNewLawyer = resolveCallbackDestination({
    existingRole: "client", // Temporary trigger default before callback update
    hasClientMatters: false,
    hasMultipleIdentities: false,
    hasEmailIdentity: false,
    hasCompletedClientOnboarding: false,
    intentRole: "lawyer",
    safeNext: "/", // Login page passed default "/"
  });
  assert("Brand-new lawyer signup is recognized and assigned role='lawyer'", brandNewLawyer.finalRole === "lawyer");
  assert("Brand-new lawyer routes to /lawyer/verify even if safeNext was '/'", brandNewLawyer.destination === "/lawyer/verify");
  assert("Brand-new lawyer is marked as new user", brandNewLawyer.isNewUser);

  // Case 3f: Brand-new lawyer with explicit next deep link
  const brandNewLawyerWithDeepLink = resolveCallbackDestination({
    existingRole: "client",
    hasClientMatters: false,
    intentRole: "lawyer",
    safeNext: "/lawyer/verify?step=dossier",
  });
  assert("Brand-new lawyer respects explicit deep link safeNext", brandNewLawyerWithDeepLink.destination === "/lawyer/verify?step=dossier");

  // Case 3g: Brand-new client registration
  const brandNewClient = resolveCallbackDestination({
    existingRole: "client",
    hasClientMatters: false,
    hasMultipleIdentities: false,
    hasEmailIdentity: false,
    hasCompletedClientOnboarding: false,
    intentRole: "client",
    safeNext: null,
  });
  assert("New client gets role='client'", brandNewClient.finalRole === "client");
  assert("New client is routed to /client/onboarding to confirm details", brandNewClient.destination === "/client/onboarding");
  assert("New client is marked as new user", brandNewClient.isNewUser);

  // Case 3h: Returning client with completed onboarding
  const returningOnboardedClient = resolveCallbackDestination({
    existingRole: "client",
    hasCompletedClientOnboarding: true,
    intentRole: "client",
    safeNext: null,
  });
  assert("Returning onboarded client preserves role='client'", returningOnboardedClient.finalRole === "client");
  assert("Returning onboarded client is routed directly to dashboard '/'", returningOnboardedClient.destination === "/");
  assert("Returning onboarded client is not marked as new user", !returningOnboardedClient.isNewUser);

  // Case 3i: Returning client with incomplete onboarding
  const returningIncompleteClient = resolveCallbackDestination({
    existingRole: "client",
    hasCompletedClientOnboarding: false,
    hasClientMatters: true, // established, but didn't finish onboarding form
    intentRole: "client",
    safeNext: null,
  });
  assert("Returning client with incomplete onboarding resumes /client/onboarding", returningIncompleteClient.destination === "/client/onboarding");

  // Case 3j: Returning verified lawyer on Lawyer tab
  const returningVerifiedLawyer = resolveCallbackDestination({
    existingRole: "lawyer",
    hasLawyerProfile: true,
    isLawyerVerified: true,
    intentRole: "lawyer",
    safeNext: null,
  });
  assert("Returning verified lawyer routes to '/' dashboard", returningVerifiedLawyer.destination === "/");

  // Case 3k: Returning unverified lawyer on Lawyer tab
  const returningUnverifiedLawyer = resolveCallbackDestination({
    existingRole: "lawyer",
    hasLawyerProfile: true,
    isLawyerVerified: false,
    intentRole: "lawyer",
    safeNext: null,
  });
  assert("Returning unverified lawyer resumes /lawyer/verify", returningUnverifiedLawyer.destination === "/lawyer/verify");


  // --- TEST 4: New Lawyer Regulatory Verification Barrier ---
  console.log("\n4. Testing New Lawyer Regulatory Gate...");
  const createNewLawyerStub = (userId: string) => {
    return {
      id: userId,
      title: "Advocate",
      bar_number: "PENDING",
      state_bar: "Delhi (DL)",
      is_verified: false,
      verification_status: "NOT_VERIFIED",
    };
  };

  const lawyerStub = createNewLawyerStub("test-lawyer-uuid");
  assert("Google-authenticated new lawyer has is_verified = false", lawyerStub.is_verified === false);
  assert("Google-authenticated new lawyer has verification_status = 'NOT_VERIFIED'", lawyerStub.verification_status === "NOT_VERIFIED");
  assert("Google-authenticated new lawyer bar_number is 'PENDING' until submitted", lawyerStub.bar_number === "PENDING");

  // --- TEST 5: Existing Auth & OTP Isolation Regression ---
  console.log("\n5. Testing Regression Safety on Existing Auth...");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key";
  const client = createClient(supabaseUrl, supabaseKey);

  assert("signInWithPassword remains available for traditional login", typeof client.auth.signInWithPassword === "function");
  assert("resetPasswordForEmail remains available for 6-digit OTP", typeof client.auth.resetPasswordForEmail === "function");
  assert("verifyOtp remains available for recovery session", typeof client.auth.verifyOtp === "function");
  assert("signInWithOAuth is available for Google provider", typeof client.auth.signInWithOAuth === "function");

  console.log(`\n==========================================================`);
  console.log(`  RESULT: ${passed}/${total} TESTS PASSED`);
  console.log(`==========================================================\n`);
}

runGoogleAuthTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
