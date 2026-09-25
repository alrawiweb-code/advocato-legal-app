import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getInquiryWithMessages, postInquiryMessage } from "@/lib/supabase/suspension-inquiry";

// GET: Fetch inquiry + full message history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: inquiryId } = await params;
  const { inquiry, error } = await getInquiryWithMessages(inquiryId, user.id);

  if (error || !inquiry) {
    return NextResponse.json({ error: error || "Inquiry not found." }, { status: 404 });
  }

  return NextResponse.json({ inquiry });
}

// POST: Send a message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: inquiryId } = await params;
  const body = await request.json();
  const { message } = body;

  if (!message || !message.trim()) {
    return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  }

  const result = await postInquiryMessage(inquiryId, user.id, "lawyer", message);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
