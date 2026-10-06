import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getAdminClient();

  try {
    const { action, rejectionReason, adminId } = await request.json(); // action: "APPROVE" or "REJECT"
    const { id } = params;

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (action === "REJECT" && (!rejectionReason || rejectionReason.trim() === "")) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    // 1. Fetch the request to verify it's PENDING and get details
    const { data: priceRequest, error: fetchErr } = await supabase
      .from("lawyer_price_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !priceRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (priceRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Request has already been processed" }, { status: 400 });
    }

    // 2. Perform server-side transaction-like update
    if (action === "APPROVE") {
      // Approve: Update lawyer profile hourly_rate AND request status
      const { error: profileUpdateErr } = await supabase
        .from("lawyer_profiles")
        .update({ hourly_rate: priceRequest.requested_rate })
        .eq("id", priceRequest.lawyer_id);

      if (profileUpdateErr) {
        console.error("Failed to update lawyer profile rate:", profileUpdateErr);
        return NextResponse.json({ error: "Failed to update lawyer profile" }, { status: 500 });
      }

      await supabase
        .from("lawyer_price_requests")
        .update({
          status: "APPROVED",
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
        })
        .eq("id", id);
    } else {
      // Reject: Just update the request status and reason
      await supabase
        .from("lawyer_price_requests")
        .update({
          status: "REJECTED",
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
          rejection_reason: rejectionReason.trim(),
        })
        .eq("id", id);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Process price request error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
