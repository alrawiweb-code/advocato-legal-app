import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createSupabaseClient(supabaseUrl, supabaseServiceKey);
}

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
