import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Service role client for system operations (such as notifications)
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { matterId, action, reason, proposedDate } = body;

    if (!matterId || !action) {
      return NextResponse.json(
        { error: "matterId and action are required parameters." },
        { status: 400 }
      );
    }

    // Fetch the matter record with client & lawyer details
    const { data: matter, error: fetchErr } = await supabase
      .from("matters")
      .select(`
        *,
        client:profiles!matters_client_id_fkey(id, full_name, email),
        lawyer:profiles!matters_lawyer_id_fkey(id, full_name, email)
      `)
      .eq("id", matterId)
      .single();

    if (fetchErr || !matter) {
      return NextResponse.json({ error: "Matter not found." }, { status: 404 });
    }

    const isClient = user.id === matter.client_id;
    const isLawyer = user.id === matter.lawyer_id;

    if (!isClient && !isLawyer) {
      return NextResponse.json(
        { error: "Forbidden: You are not a participant on this matter." },
        { status: 403 }
      );
    }

    const now = new Date();
    const admin = getAdminClient();

    // =========================================================================
    // ACTION 1: ACCEPT PENDING BOOKING (Lawyer Only)
    // =========================================================================
    if (action === "accept_booking") {
      if (!isLawyer) {
        return NextResponse.json(
          { error: "Forbidden: Only the assigned lawyer can accept this consultation." },
          { status: 403 }
        );
      }

      if (matter.status !== "pending") {
        return NextResponse.json(
          { error: `Cannot accept booking in '${matter.status}' status.` },
          { status: 409 }
        );
      }

      const { data: updated, error: updErr } = await supabase
        .from("matters")
        .update({
          status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", matterId)
        .eq("status", "pending")
        .eq("lawyer_id", user.id)
        .select()
        .single();

      if (updErr || !updated) {
        return NextResponse.json(
          { error: "Failed to confirm booking. It may have already been updated." },
          { status: 409 }
        );
      }

      // Insert system/chat confirmation message
      const formattedDate = matter.appointment_date
        ? new Date(matter.appointment_date).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "scheduled time";

      await supabase.from("messages").insert({
        matter_id: matterId,
        sender_id: user.id,
        sender_role: "lawyer",
        text: `Consultation request accepted by Advocate ${matter.lawyer?.full_name || ""}. Appointment confirmed for ${formattedDate}.`,
      });

      return NextResponse.json({ success: true, matter: updated });
    }

    // =========================================================================
    // ACTION 2: DECLINE PENDING BOOKING (Lawyer Only)
    // =========================================================================
    if (action === "decline_booking") {
      if (!isLawyer) {
        return NextResponse.json(
          { error: "Forbidden: Only the assigned lawyer can decline this consultation." },
          { status: 403 }
        );
      }

      if (matter.status !== "pending") {
        return NextResponse.json(
          { error: `Cannot decline booking in '${matter.status}' status.` },
          { status: 409 }
        );
      }

      const { data: updated, error: updErr } = await supabase
        .from("matters")
        .update({
          status: "declined",
          decline_reason: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", matterId)
        .eq("status", "pending")
        .eq("lawyer_id", user.id)
        .select()
        .single();

      if (updErr || !updated) {
        return NextResponse.json(
          { error: "Failed to decline booking. It may have already been updated." },
          { status: 409 }
        );
      }

      await supabase.from("messages").insert({
        matter_id: matterId,
        sender_id: user.id,
        sender_role: "lawyer",
        text: `Consultation request declined by Advocate.${reason ? ` Reason: ${reason}` : ""}`,
      });

      return NextResponse.json({ success: true, matter: updated });
    }

    // =========================================================================
    // ACTION 3: PROPOSE RESCHEDULE (Client or Lawyer on Confirmed Booking)
    // =========================================================================
    if (action === "propose_reschedule") {
      if (!proposedDate) {
        return NextResponse.json(
          { error: "proposedDate is required for rescheduling." },
          { status: 400 }
        );
      }

      const newDateObj = new Date(proposedDate);
      if (isNaN(newDateObj.getTime()) || newDateObj <= now) {
        return NextResponse.json(
          { error: "Proposed date must be a valid future datetime." },
          { status: 400 }
        );
      }

      if (matter.status !== "confirmed" && matter.status !== "scheduled") {
        return NextResponse.json(
          { error: `Cannot propose reschedule on a matter in '${matter.status}' status.` },
          { status: 409 }
        );
      }

      if (matter.reschedule_status !== "none" && matter.reschedule_status !== "expired" && matter.reschedule_status !== "rejected") {
        return NextResponse.json(
          { error: "A reschedule proposal is already active on this consultation." },
          { status: 409 }
        );
      }

      const newRescheduleStatus = isLawyer ? "pending_client" : "pending_lawyer";
      const targetPartyName = isLawyer ? (matter.client?.full_name || "Client") : `Advocate ${matter.lawyer?.full_name || ""}`;
      const initiatorName = isLawyer ? `Advocate ${matter.lawyer?.full_name || ""}` : (matter.client?.full_name || "Client");

      const { data: updated, error: updErr } = await supabase
        .from("matters")
        .update({
          proposed_reschedule_date: newDateObj.toISOString(),
          reschedule_requested_by: user.id,
          reschedule_status: newRescheduleStatus,
          reschedule_reason: reason || null,
          original_appointment_date: matter.original_appointment_date || matter.appointment_date,
          updated_at: new Date().toISOString(),
        })
        .eq("id", matterId)
        .in("status", ["confirmed", "scheduled"])
        .select()
        .single();

      if (updErr || !updated) {
        return NextResponse.json(
          { error: "Failed to submit reschedule proposal." },
          { status: 409 }
        );
      }

      const formattedNewDate = newDateObj.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      await supabase.from("messages").insert({
        matter_id: matterId,
        sender_id: user.id,
        sender_role: isLawyer ? "lawyer" : "client",
        text: `${initiatorName} proposed rescheduling to ${formattedNewDate}.${reason ? ` Reason: ${reason}` : ""}`,
      });

      // If client proposed to lawyer, create notification row for lawyer
      if (isClient) {
        await admin.from("lawyer_notifications").insert({
          lawyer_id: matter.lawyer_id,
          title: "Reschedule Proposal Received",
          message: `${matter.client?.full_name || "A client"} requested to reschedule consultation to ${formattedNewDate}.`,
          type: "BOOKING",
          action_url: `/messages?matterId=${matter.id}`,
        });
      }

      return NextResponse.json({ success: true, matter: updated });
    }

    // =========================================================================
    // ACTION 4: ACCEPT RESCHEDULE (Counter-Party Only)
    // =========================================================================
    if (action === "accept_reschedule") {
      const isPendingClient = matter.reschedule_status === "pending_client";
      const isPendingLawyer = matter.reschedule_status === "pending_lawyer";

      if (!isPendingClient && !isPendingLawyer) {
        return NextResponse.json(
          { error: "No pending reschedule proposal to accept." },
          { status: 409 }
        );
      }

      // Enforce strict counter-party validation
      if (isPendingClient && !isClient) {
        return NextResponse.json(
          { error: "Forbidden: Only the client can accept this reschedule proposal." },
          { status: 403 }
        );
      }
      if (isPendingLawyer && !isLawyer) {
        return NextResponse.json(
          { error: "Forbidden: Only the lawyer can accept this reschedule proposal." },
          { status: 403 }
        );
      }

      if (!matter.proposed_reschedule_date || new Date(matter.proposed_reschedule_date) <= now) {
        return NextResponse.json(
          { error: "Cannot accept an expired reschedule proposal." },
          { status: 409 }
        );
      }

      const { data: updated, error: updErr } = await supabase
        .from("matters")
        .update({
          appointment_date: matter.proposed_reschedule_date,
          proposed_reschedule_date: null,
          reschedule_status: "accepted",
          status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", matterId)
        .eq("reschedule_status", matter.reschedule_status)
        .select()
        .single();

      if (updErr || !updated) {
        return NextResponse.json(
          { error: "Failed to accept proposal. It may have already been resolved or expired." },
          { status: 409 }
        );
      }

      const formattedNewDate = new Date(updated.appointment_date!).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      await supabase.from("messages").insert({
        matter_id: matterId,
        sender_id: user.id,
        sender_role: isLawyer ? "lawyer" : "client",
        text: `Reschedule proposal accepted. Consultation confirmed for ${formattedNewDate}.`,
      });

      return NextResponse.json({ success: true, matter: updated });
    }

    // =========================================================================
    // ACTION 5: DECLINE RESCHEDULE (Counter-Party Only)
    // =========================================================================
    if (action === "decline_reschedule") {
      const isPendingClient = matter.reschedule_status === "pending_client";
      const isPendingLawyer = matter.reschedule_status === "pending_lawyer";

      if (!isPendingClient && !isPendingLawyer) {
        return NextResponse.json(
          { error: "No pending reschedule proposal to decline." },
          { status: 409 }
        );
      }

      if (isPendingClient && !isClient) {
        return NextResponse.json(
          { error: "Forbidden: Only the client can decline this reschedule proposal." },
          { status: 403 }
        );
      }
      if (isPendingLawyer && !isLawyer) {
        return NextResponse.json(
          { error: "Forbidden: Only the lawyer can decline this reschedule proposal." },
          { status: 403 }
        );
      }

      const origDatePassed = new Date(matter.appointment_date) <= now;
      let newStatus = "confirmed";
      if (origDatePassed) {
        newStatus = matter.reschedule_requested_by === matter.lawyer_id ? "declined" : "cancelled";
      }

      const { data: updated, error: updErr } = await supabase
        .from("matters")
        .update({
          proposed_reschedule_date: null,
          reschedule_status: "rejected",
          status: newStatus,
          reschedule_reason: (matter.reschedule_reason || "") + " [Proposal declined by counter-party]",
          updated_at: new Date().toISOString(),
        })
        .eq("id", matterId)
        .eq("reschedule_status", matter.reschedule_status)
        .select()
        .single();

      if (updErr || !updated) {
        return NextResponse.json(
          { error: "Failed to decline proposal. It may have already been resolved." },
          { status: 409 }
        );
      }

      const msgText = origDatePassed
        ? "Reschedule proposal declined. Because the original appointment time has already passed, the consultation request is concluded."
        : `Reschedule proposal declined. Original appointment time remains confirmed.`;

      await supabase.from("messages").insert({
        matter_id: matterId,
        sender_id: user.id,
        sender_role: isLawyer ? "lawyer" : "client",
        text: msgText,
      });

      return NextResponse.json({ success: true, matter: updated });
    }

    // =========================================================================
    // ACTION 6: CANCEL BOOKING (Client Only)
    // =========================================================================
    if (action === "cancel_booking") {
      if (!isClient) {
        return NextResponse.json(
          { error: "Forbidden: Only the client can cancel this consultation request." },
          { status: 403 }
        );
      }

      if (matter.status !== "pending" && matter.status !== "confirmed" && matter.status !== "scheduled") {
        return NextResponse.json(
          { error: `Cannot cancel booking in '${matter.status}' status.` },
          { status: 409 }
        );
      }

      const { data: updated, error: updErr } = await supabase
        .from("matters")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", matterId)
        .in("status", ["pending", "confirmed", "scheduled"])
        .select()
        .single();

      if (updErr || !updated) {
        return NextResponse.json(
          { error: "Failed to cancel booking." },
          { status: 409 }
        );
      }

      await supabase.from("messages").insert({
        matter_id: matterId,
        sender_id: user.id,
        sender_role: "client",
        text: `Consultation cancelled by client.${reason ? ` Reason: ${reason}` : ""}`,
      });

      return NextResponse.json({ success: true, matter: updated });
    }

    return NextResponse.json({ error: `Unknown action: '${action}'` }, { status: 400 });
  } catch (err: any) {
    console.error("Booking action error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
