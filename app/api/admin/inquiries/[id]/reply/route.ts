import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { postInquiryMessage, getAdminInquiryDetail } from "@/lib/supabase/suspension-inquiry";

async function verifyAdmin(supabase: any, user: any): Promise<boolean> {
  if (user.email?.toLowerCase() === "alrawiweb@gmail.com") return true;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await verifyAdmin(supabase, user))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: inquiryId } = await params;
  const body = await request.json();
  const { message } = body;

  if (!message || !message.trim()) {
    return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  }

  // Verify the inquiry exists before admin replies
  const inquiry = await getAdminInquiryDetail(inquiryId);
  if (!inquiry) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });

  const result = await postInquiryMessage(inquiryId, user.id, "admin", message);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ success: true });
}
