import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createSupabaseClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(request: Request) {
  // 1. Authorize: Ensure caller is an authenticated admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.email?.toLowerCase() !== "alrawiweb@gmail.com") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // 2. Fetch price requests using service role client
  const adminClient = getAdminClient();

  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");

    let query = adminClient
      .from("lawyer_price_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter && statusFilter !== "ALL") {
      query = query.eq("status", statusFilter);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error("Fetch admin price requests error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json({ requests: [] });
    }

    // 3. Hydrate with lawyer profile and account details
    const lawyerIds = Array.from(new Set(requests.map((r) => r.lawyer_id)));

    const [{ data: profiles }, { data: lawyerProfiles }] = await Promise.all([
      adminClient
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", lawyerIds),
      adminClient
        .from("lawyer_profiles")
        .select("id, bar_number, state_bar, jurisdiction, title, hourly_rate")
        .in("id", lawyerIds),
    ]);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    const lawyerProfileMap = new Map((lawyerProfiles || []).map((lp) => [lp.id, lp]));

    const enrichedRequests = requests.map((req) => {
      const p = profileMap.get(req.lawyer_id);
      const lp = lawyerProfileMap.get(req.lawyer_id);

      return {
        ...req,
        lawyer_name: p?.full_name || "Advocate",
        lawyer_email: p?.email || "",
        lawyer_avatar_url: p?.avatar_url || null,
        bar_number: lp?.bar_number || null,
        state_bar: lp?.state_bar || lp?.jurisdiction || null,
        current_official_rate: lp?.hourly_rate ?? null,
        // Backward-compatible lawyer object matching existing admin UI contract
        lawyer: {
          profiles: {
            full_name: p?.full_name || "Advocate",
            email: p?.email || "",
            avatar_url: p?.avatar_url || null,
          },
          title: lp?.title || "Advocate",
          bar_number: lp?.bar_number || null,
          state_bar: lp?.state_bar || lp?.jurisdiction || null,
          current_official_rate: lp?.hourly_rate ?? null,
        },
      };
    });

    return NextResponse.json({ requests: enrichedRequests });
  } catch (err: any) {
    console.error("Fetch admin price requests error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

