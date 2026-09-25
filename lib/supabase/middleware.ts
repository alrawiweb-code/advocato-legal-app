import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh auth token
  const { data: { user } } = await supabase.auth.getUser();

  // Protected routes that require real authenticated session
  const protectedPrefixes = ["/cases", "/messages", "/profile", "/admin", "/lawyer/verify"];
  const isProtected = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    const redirectRes = NextResponse.redirect(loginUrl);
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirectRes.cookies.set(c.name, c.value);
    });
    return redirectRes;
  }

  let userRole = "public";
  if (user) {
    if (user.email?.toLowerCase() === "alrawiweb@gmail.com") {
      userRole = "admin";
    } else {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      userRole = profile?.role || user.user_metadata?.role || "client";
    }
  }

  const path = request.nextUrl.pathname;
  
  // Admin route protection
  if (path.startsWith("/admin") && userRole !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  
  // Lawyer route protection
  if (path.startsWith("/lawyer/") && path !== "/lawyer/register" && userRole !== "lawyer" && userRole !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  
  // Client route protection
  if (path.startsWith("/intake") && userRole !== "client" && userRole !== "admin" && userRole !== "public") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}
