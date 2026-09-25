import { NextRequest, NextResponse } from "next/server";
import { approveLawyerApplication, getAdminApplicationDetail } from "@/lib/supabase/verification";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Authorize: Ensure caller is an admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.email?.toLowerCase() !== "alrawiweb@gmail.com") {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { id } = await params;
  const application = await getAdminApplicationDetail(id);

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const result = await approveLawyerApplication(application.id, application.lawyer_id, user.id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
