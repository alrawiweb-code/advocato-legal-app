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

  const path = request.nextUrl.pathname;

  // Protected routes that require real authenticated session
  const protectedPrefixes = ["/cases", "/messages", "/profile", "/admin", "/lawyer/verify", "/client/onboarding"];
  const isProtected = protectedPrefixes.some((prefix) => path.startsWith(prefix));

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", path);
    const redirectRes = NextResponse.redirect(loginUrl);
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirectRes.cookies.set(c.name, c.value);
    });
    return redirectRes;
  }

  // Only resolve role if the path actually enforces role restrictions (/admin, /lawyer/*, /intake)
  const requiresRoleCheck =
    path.startsWith("/admin") ||
    (path.startsWith("/lawyer/") && path !== "/lawyer/register") ||
    path.startsWith("/intake");

  if (requiresRoleCheck) {
    let userRole = "public";
    if (user) {
      if (user.email?.toLowerCase() === "alrawiweb@gmail.com") {
        userRole = "admin";
      } else {
        // Fast path: check auth token metadata first before querying database
        const metaRole = (user.app_metadata as any)?.role || user.user_metadata?.role;
        if (metaRole) {
          userRole = metaRole;
        } else {
          // Slow path fallback: query database
          const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
          userRole = profile?.role || "client";
        }
      }
    }

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
  }

  return supabaseResponse;
}
