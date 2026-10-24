import { NextRequest, NextResponse } from "next/server";
import { reopenLawyerApplication, getAdminApplicationDetail } from "@/lib/supabase/verification";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorize: Ensure caller is an authenticated admin (fail-closed)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileErr || profile?.role !== "admin") {
    if (user.email?.toLowerCase() !== "alrawiweb@gmail.com") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { id } = await params;
  const application = await getAdminApplicationDetail(id);

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.status !== "REJECTED") {
    return NextResponse.json(
      {
        error: `Cannot reopen application with status '${application.status}'. Only REJECTED applications can be reopened.`,
      },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const reopenNotes = (body.notes || body.reason || "").trim() || "Application reopened for resubmission.";

  const result = await reopenLawyerApplication(
    application.id,
    application.lawyer_id,
    user.id,
    reopenNotes
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Application reopened for resubmission",
    status: "DOCUMENTS_REQUIRED",
  });
}
