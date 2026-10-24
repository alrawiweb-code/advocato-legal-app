import { NextRequest, NextResponse } from "next/server";
import { setLawyerConsultationFee } from "@/lib/supabase/verification";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorize: Ensure caller is an admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.email?.toLowerCase() !== "alrawiweb@gmail.com") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const rateInput = body.hourlyRate ?? body.assignedRate;
  const hourlyRate = parseInt(rateInput, 10);

  if (isNaN(hourlyRate) || hourlyRate <= 0) {
    return NextResponse.json(
      { error: "A valid positive consultation fee is required (₹/hr)." },
      { status: 400 }
    );
  }

  const result = await setLawyerConsultationFee(id, user.id, hourlyRate);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, hourly_rate: hourlyRate });
}
