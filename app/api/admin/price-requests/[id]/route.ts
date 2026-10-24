import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { setLawyerConsultationFee } from "@/lib/supabase/verification";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createSupabaseClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Authorize: Ensure caller is an authenticated admin
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

  const adminClient = getAdminClient();

  try {
    const { action, rejectionReason } = await request.json(); // action: "APPROVE" or "REJECT"
    const { id } = await params;

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be APPROVE or REJECT." }, { status: 400 });
    }

    if (action === "REJECT" && (!rejectionReason || rejectionReason.trim() === "")) {
      return NextResponse.json({ error: "Rejection reason is required." }, { status: 400 });
    }

    // 2. Fetch the request to verify it's PENDING and get details
    const { data: priceRequest, error: fetchErr } = await adminClient
      .from("lawyer_price_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !priceRequest) {
      return NextResponse.json({ error: "Fee increase request not found." }, { status: 404 });
    }

    if (priceRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: `This request has already been processed as ${priceRequest.status}.` },
        { status: 400 }
      );
    }

    // Fetch the latest verification application for audit trail linkage
    const { data: latestApp } = await adminClient
      .from("lawyer_verification_applications")
      .select("id")
      .eq("lawyer_id", priceRequest.lawyer_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3. Process the action
    if (action === "APPROVE") {
      // Step A: Update lawyer profile official fee via setLawyerConsultationFee
      const feeResult = await setLawyerConsultationFee(
        priceRequest.lawyer_id,
        user.id,
        priceRequest.requested_rate
      );

      if (!feeResult.success) {
        console.error("Failed to update lawyer profile rate:", feeResult.error);
        return NextResponse.json(
          { error: feeResult.error || "Failed to update lawyer consultation fee" },
          { status: 500 }
        );
      }

      // Step B: Update request status
      const { error: updateReqErr } = await adminClient
        .from("lawyer_price_requests")
        .update({
          status: "APPROVED",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", id);

      if (updateReqErr) {
        console.error("Failed to update price request status:", updateReqErr);
        return NextResponse.json({ error: "Failed to update request record" }, { status: 500 });
      }

      // Step C: Log approval audit event
      await adminClient.from("verification_audit_logs").insert({
        application_id: latestApp?.id || null,
        actor_id: user.id,
        actor_role: "admin",
        action: "APPROVE_PRICE_REQUEST",
        previous_status: "PENDING",
        new_status: "APPROVED",
        reason: `Approved fee increase from ₹${priceRequest.current_rate?.toLocaleString("en-IN") || "unassigned"} to ₹${priceRequest.requested_rate.toLocaleString("en-IN")}/hr. Lawyer request message: "${priceRequest.reason}".`,
      });

      return NextResponse.json({
        success: true,
        status: "APPROVED",
        new_rate: priceRequest.requested_rate,
      });
    } else {
      // Reject: Update status, recorded rejection reason and reviewer ID
      const { error: rejectErr } = await adminClient
        .from("lawyer_price_requests")
        .update({
          status: "REJECTED",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          rejection_reason: rejectionReason.trim(),
        })
        .eq("id", id);

      if (rejectErr) {
        console.error("Failed to reject price request:", rejectErr);
        return NextResponse.json({ error: "Failed to record rejection" }, { status: 500 });
      }

      // Log rejection audit event
      await adminClient.from("verification_audit_logs").insert({
        application_id: latestApp?.id || null,
        actor_id: user.id,
        actor_role: "admin",
        action: "REJECT_PRICE_REQUEST",
        previous_status: "PENDING",
        new_status: "REJECTED",
        reason: `Rejected fee increase request (Requested: ₹${priceRequest.requested_rate.toLocaleString("en-IN")}/hr). Feedback: "${rejectionReason.trim()}". Lawyer request message: "${priceRequest.reason}".`,
      });

      return NextResponse.json({
        success: true,
        status: "REJECTED",
      });
    }
  } catch (err: any) {
    console.error("Process price request error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

