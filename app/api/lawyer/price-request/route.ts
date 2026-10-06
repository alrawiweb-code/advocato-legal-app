import { NextResponse } from "next/server";
import { getAuthClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = getAuthClient();

  try {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current lawyer profile to find current rate
    const { data: lawyerProfile, error: profileErr } = await supabase
      .from("lawyer_profiles")
      .select("hourly_rate")
      .eq("id", user.id)
      .single();

    if (profileErr || !lawyerProfile) {
      return NextResponse.json({ error: "Lawyer profile not found" }, { status: 404 });
    }

    const { requestedRate, reason } = await request.json();

    if (!requestedRate || requestedRate <= 0) {
      return NextResponse.json({ error: "Valid requested rate is required" }, { status: 400 });
    }
    if (!reason || reason.trim() === "") {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }

    // Insert request
    const { error: insertErr } = await supabase
      .from("lawyer_price_requests")
      .insert({
        lawyer_id: user.id,
        current_rate: lawyerProfile.hourly_rate,
        requested_rate: requestedRate,
        reason: reason.trim(),
        status: "PENDING",
      });

    if (insertErr) {
      console.error("Error creating price request:", insertErr);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Price request error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  const supabase = getAuthClient();

  try {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: requests, error } = await supabase
      .from("lawyer_price_requests")
      .select("*")
      .eq("lawyer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ requests: requests || [] });
  } catch (err: any) {
    console.error("Fetch price requests error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
