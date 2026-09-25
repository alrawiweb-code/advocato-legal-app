import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateInquiry } from "@/lib/supabase/suspension-inquiry";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the caller is a lawyer with SUSPENDED or REJECTED status
  const { data: lp } = await supabase
    .from("lawyer_profiles")
    .select("id, verification_status")
    .eq("id", user.id)
    .single();

  if (!lp) {
    return NextResponse.json({ error: "Lawyer profile not found." }, { status: 404 });
  }

  const allowedStatuses = ["SUSPENDED", "REJECTED"];
  if (!allowedStatuses.includes(lp.verification_status)) {
    return NextResponse.json(
      { error: "Inquiries are only available for suspended or rejected lawyers." },
      { status: 403 }
    );
  }

  const inquiryType = lp.verification_status === "SUSPENDED" ? "SUSPENSION" : "REJECTION";

  const { inquiry, error } = await getOrCreateInquiry(user.id, inquiryType);

  if (error || !inquiry) {
    return NextResponse.json({ error: error || "Failed to open inquiry." }, { status: 500 });
  }

  return NextResponse.json({ inquiry });
}
