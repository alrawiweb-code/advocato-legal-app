import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // "next" is the final destination, typically /auth/verify-success
  const next = searchParams.get("next") ?? "/auth/verify-success";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Successful code exchange, redirect to success/verify-success page
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      // Exchange failed (code invalid/expired)
      console.error("Auth callback error:", error.message);
      return NextResponse.redirect(`${origin}/auth/verify-success?error=${encodeURIComponent(error.message)}`);
    }
  }

  // If there's no code, redirect with an error
  return NextResponse.redirect(`${origin}/auth/verify-success?error=missing_code`);
}
