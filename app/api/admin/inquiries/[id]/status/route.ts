import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateInquiryStatus } from "@/lib/supabase/suspension-inquiry";

async function verifyAdmin(supabase: any, user: any): Promise<boolean> {
  if (user.email?.toLowerCase() === "alrawiweb@gmail.com") return true;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await verifyAdmin(supabase, user))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: inquiryId } = await params;
  const body = await request.json();
  const { status } = body;

  if (!["OPEN", "RESOLVED", "CLOSED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status. Must be OPEN, RESOLVED, or CLOSED." }, { status: 400 });
  }

  const result = await updateInquiryStatus(inquiryId, status);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ success: true });
}
