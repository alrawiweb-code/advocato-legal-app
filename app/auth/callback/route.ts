import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const intentRole = searchParams.get("role"); // "client" | "lawyer" | null
  const intentMode = searchParams.get("mode"); // "signin" | "register" | null
  const rawNext = searchParams.get("next");

  // Determine target origin (respects reverse proxy / load balancer on Vercel, falls back to URL origin)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const targetOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin;

  // Sanitize next path to prevent open redirect vulnerabilities
  const safeNext = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
    ? rawNext
    : null;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;

      // 1. Fetch current profile from database
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role, created_at, full_name, avatar_url, phone")
        .eq("id", user.id)
        .maybeSingle();

      // 2. Fetch existing lawyer profile (if any)
      const { data: lawyerProfile } = await supabase
        .from("lawyer_profiles")
        .select("id, is_verified, verification_status")
        .eq("id", user.id)
        .maybeSingle();

      // 3. Fetch active/past matters involving this user as client
      const { data: clientMatters } = await supabase
        .from("matters")
        .select("id")
        .eq("client_id", user.id)
        .limit(1);

      const existingRole = profile?.role;
      const isLawyer = existingRole === "lawyer" || lawyerProfile !== null;
      const hasClientMatters = Boolean(clientMatters && clientMatters.length > 0);
      const hasMultipleIdentities = Boolean(user.identities && user.identities.length > 1);
      const hasEmailIdentity = Boolean(user.identities?.some((i) => i.provider === "email"));
      const hasCompletedClientOnboarding = Boolean(
        user.user_metadata?.onboarding_completed === true ||
        (profile as any)?.is_onboarded === true ||
        Boolean(profile?.phone)
      );

      const isEstablishedClient =
        existingRole === "client" &&
        (hasClientMatters || hasMultipleIdentities || hasEmailIdentity || hasCompletedClientOnboarding);


      // --- SCENARIO A: User is an established Lawyer ---
      if (isLawyer) {
        // Strict Cross-Portal Guard: If attorney attempts Client Portal, explain and redirect
        if (intentRole === "client") {
          return NextResponse.redirect(
            `${targetOrigin}/login?tab=lawyer&error=already_lawyer`
          );
        }

        // Lawyer remains lawyer; route unverified lawyers to verify, verified to dashboard/next
        const defaultLawyerDest = lawyerProfile?.verification_status === "NOT_VERIFIED"
          ? "/lawyer/verify"
          : "/";
        const destination = (safeNext && safeNext !== "/") ? safeNext : defaultLawyerDest;
        return NextResponse.redirect(`${targetOrigin}${destination}`);
      }

      // --- SCENARIO B: User is an established Client ---
      if (isEstablishedClient) {
        // Strict Cross-Portal & Anti-Promotion Guard: Client cannot register or sign in as Lawyer
        if (intentRole === "lawyer") {
          return NextResponse.redirect(
            `${targetOrigin}/login?tab=client&error=already_client`
          );
        }

        // Established client on Client portal: if incomplete onboarding, complete it; else go to destination
        if (!hasCompletedClientOnboarding) {
          return NextResponse.redirect(`${targetOrigin}/client/onboarding`);
        }

        const destination = safeNext && !safeNext.startsWith("/lawyer") ? safeNext : "/";
        return NextResponse.redirect(`${targetOrigin}${destination}`);
      }


      // --- SCENARIO C: Brand-New User Registering as Lawyer ---
      // Requires explicit lawyer role intent, not an established client, and no existing lawyer profile
      if (
        intentRole === "lawyer" &&
        !isEstablishedClient &&
        !isLawyer
      ) {
        const advocateName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Advocate";

        const avatarUrl =
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          null;

        // Set role to 'lawyer'
        await supabase
          .from("profiles")
          .update({
            role: "lawyer",
            full_name: profile?.full_name || advocateName,
            avatar_url: profile?.avatar_url || avatarUrl,
          })
          .eq("id", user.id);

        // Ensure unverified lawyer_profiles stub exists
        await supabase
          .from("lawyer_profiles")
          .upsert({
            id: user.id,
            title: "Advocate",
            bar_number: "PENDING",
            state_bar: "Delhi (DL)",
            years_experience: 0,
            hourly_rate: null,
            is_verified: false,
            verification_status: "NOT_VERIFIED",
            availability: "Pending verification",
            jurisdiction: "Pending",
            practice_areas: ["General Legal Counsel"],
            tags: [],
            bio: "",
          });

        // Route new lawyer directly to Bar verification dossier
        const lawyerDestination = (safeNext && safeNext !== "/") ? safeNext : "/lawyer/verify";
        return NextResponse.redirect(`${targetOrigin}${lawyerDestination}`);
      }

      // --- SCENARIO D: Default New or Incomplete Client ---
      // If user had no profile at all, ensure client profile exists
      if (!profile) {
        await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            email: user.email,
            full_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "User",
            role: "client",
            avatar_url:
              user.user_metadata?.avatar_url ||
              user.user_metadata?.picture ||
              null,
          });
      }

      // If client has not completed onboarding, route them to complete profile
      if (!hasCompletedClientOnboarding) {
        return NextResponse.redirect(`${targetOrigin}/client/onboarding`);
      }

      const clientDestination = safeNext ?? "/";
      return NextResponse.redirect(`${targetOrigin}${clientDestination}`);
    } else {
      // Exchange failed (code invalid/expired)
      console.error("Auth callback error:", error?.message);
      return NextResponse.redirect(
        `${targetOrigin}/auth/verify-success?error=${encodeURIComponent(
          error?.message || "Authentication failed"
        )}`
      );
    }
  }

  // If there's no code, redirect with an error
  return NextResponse.redirect(
    `${targetOrigin}/auth/verify-success?error=missing_code`
  );
}


