import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminInquiries } from "@/lib/supabase/suspension-inquiry";

async function verifyAdmin(supabase: any, user: any): Promise<boolean> {
  if (user.email?.toLowerCase() === "alrawiweb@gmail.com") return true;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin";
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await verifyAdmin(supabase, user))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const typeFilter = (searchParams.get("type") || "ALL") as any;
  const statusFilter = (searchParams.get("status") || "ALL") as any;

  const inquiries = await getAdminInquiries(typeFilter, statusFilter);
  return NextResponse.json({ inquiries });
}
