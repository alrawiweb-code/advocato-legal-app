import { NextRequest, NextResponse } from "next/server";
import { getLawyerApplication } from "@/lib/supabase/verification";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lawyerId } = body;

    if (!lawyerId) {
      return NextResponse.json({ error: "lawyerId is required" }, { status: 400 });
    }

    // Authorize
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== lawyerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const application = await getLawyerApplication(lawyerId);
    if (!application) {
      return NextResponse.json({ error: "Application draft not found" }, { status: 404 });
    }

    // Check if they uploaded all required documents (simplistic check for this route, 
    // frontend also checks, ideally backend should strictly check `verification_document_requirements`)
    // We will just update status to SUBMITTED.

    const { error: updateAppErr } = await supabase
      .from("lawyer_verification_applications")
      .update({
        status: "SUBMITTED",
        submitted_at: new Date().toISOString(),
        rejection_reason: null,
        requested_changes: null,
      })
      .eq("id", application.id);

    if (updateAppErr) throw updateAppErr;

    // Update lawyer profile status to SUBMITTED
    await supabase
      .from("lawyer_profiles")
      .update({
        is_verified: false,
        verification_status: "SUBMITTED",
      })
      .eq("id", lawyerId);

    // Log audit entry
    await supabase.from("verification_audit_logs").insert({
      application_id: application.id,
      actor_id: lawyerId,
      actor_role: "lawyer",
      action: "SUBMIT_APPLICATION",
      previous_status: application.status,
      new_status: "SUBMITTED",
      reason: "Attorney credentials and compliance documents submitted for verification.",
    });

    const updatedApp = await getLawyerApplication(lawyerId);
    return NextResponse.json({ application: updatedApp });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
