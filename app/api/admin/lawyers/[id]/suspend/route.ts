import { NextRequest, NextResponse } from "next/server";
import { suspendLawyer } from "@/lib/supabase/verification";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Authenticate
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Authorize: must be admin
  const isAdminEmail = user.email?.toLowerCase() === "alrawiweb@gmail.com";
  if (!isAdminEmail) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }
  }

  // 3. Parse body
  const body = await request.json();
  const { reason } = body;

  if (!reason || !reason.trim()) {
    return NextResponse.json(
      { error: "A suspension reason is required." },
      { status: 400 }
    );
  }

  const { id: lawyerId } = await params;

  // 4. Execute suspension (server-side with service role)
  const result = await suspendLawyer(lawyerId, user.id, reason.trim());

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
