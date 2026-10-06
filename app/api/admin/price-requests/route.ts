import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = getAdminClient();

  try {
    const { data: requests, error } = await supabase
      .from("lawyer_price_requests")
      .select(`
        *,
        lawyer:lawyer_profiles!lawyer_id (
          profiles!id (full_name, email)
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch admin price requests error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ requests: requests || [] });
  } catch (err: any) {
    console.error("Fetch admin price requests error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
