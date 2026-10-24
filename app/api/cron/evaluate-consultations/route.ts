import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  // 1. Authorize: Check CRON_SECRET authorization header
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Initialize Supabase Admin client with service_role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 3. Execute bulk evaluator RPC
  const { data, error } = await supabase.rpc("evaluate_consultation_outcomes", {
    p_batch_size: 100,
  });

  if (error) {
    console.error("[cron/evaluate-consultations] RPC execution failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    result: data,
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
