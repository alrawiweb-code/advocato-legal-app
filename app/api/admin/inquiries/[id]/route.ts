import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminInquiryDetail } from "@/lib/supabase/suspension-inquiry";

async function verifyAdmin(supabase: any, user: any): Promise<boolean> {
  if (user.email?.toLowerCase() === "alrawiweb@gmail.com") return true;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await verifyAdmin(supabase, user))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const inquiry = await getAdminInquiryDetail(id);
  if (!inquiry) return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });

  return NextResponse.json({ inquiry });
}
