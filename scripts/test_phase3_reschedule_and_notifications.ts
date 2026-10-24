import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runPhase3Tests() {
  console.log("=== PHASE 3: NOTIFICATIONS & ATOMIC RESCHEDULE TRANSITIONS TEST SUITE ===\n");

  // Fetch verified lawyer and client
  const { data: lawyers } = await supabase
    .from("lawyer_profiles")
    .select("id, hourly_rate")
    .eq("is_verified", true)
    .gt("hourly_rate", 0)
    .limit(1);

  const { data: clients } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "client")
    .limit(1);

  if (!lawyers?.length || !clients?.length) {
    console.error("❌ Test setup failed: missing verified lawyer or client.");
    process.exit(1);
  }

  const testLawyer = lawyers[0];
  const testClient = clients[0];
  const createdMatterIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Accept Pending Booking
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Lawyer accepts pending consultation request ---");
    const origDateA = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    const { data: m1, error: m1Err } = await supabase
      .from("matters")
      .insert({
        matter_number: `PH3-TEST-${Date.now()}-1`,
        client_id: testClient.id,
        lawyer_id: testLawyer.id,
        case_title: "Phase 3 Test Matter",
        category: "Corporate & Commercial Law",
        jurisdiction: "Delhi (DL)",
        urgency: "Medium",
        status: "pending",
        appointment_date: origDateA,
        duration_minutes: 45,
        reschedule_status: "none",
        consultation_type: "video",
      })
      .select("*")
      .single();

    if (m1Err || !m1) {
      throw new Error(`Failed to create test matter: ${m1Err?.message}`);
    }
    createdMatterIds.push(m1.id);
    console.log(`✅ Test matter created with status='pending'`);

    // Transition: Accept booking
    const { data: acceptedM1, error: accErr } = await supabase
      .from("matters")
      .update({
        status: "confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", m1.id)
      .eq("status", "pending")
      .select()
      .single();

    if (accErr || !acceptedM1 || acceptedM1.status !== "confirmed") {
      throw new Error(`Accept booking failed: ${accErr?.message}`);
    }
    console.log(`✅ Matter transitioned to status='confirmed'`);

    // -------------------------------------------------------------------------
    // TEST 2: Propose Reschedule (Decoupled architecture)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Propose reschedule decouples Date B without modifying Date A ---");
    const proposedDateB = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

    const { data: propM1, error: propErr } = await supabase
      .from("matters")
      .update({
        proposed_reschedule_date: proposedDateB,
        reschedule_requested_by: testLawyer.id,
        reschedule_status: "pending_client",
        reschedule_reason: "Hearing rescheduled by High Court",
        original_appointment_date: acceptedM1.appointment_date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", m1.id)
      .eq("status", "confirmed")
      .eq("reschedule_status", "none")
      .select()
      .single();

    if (propErr || !propM1) {
      throw new Error(`Propose reschedule failed: ${propErr?.message}`);
    }

    if (new Date(propM1.appointment_date).getTime() !== new Date(origDateA).getTime()) {
      throw new Error(`CRITICAL: appointment_date was altered prematurely! Expected ${origDateA}, got ${propM1.appointment_date}`);
    }
    if (new Date(propM1.proposed_reschedule_date).getTime() !== new Date(proposedDateB).getTime()) {
      throw new Error(`Proposed date not stored properly`);
    }
    if (propM1.reschedule_status !== "pending_client") {
      throw new Error(`Expected reschedule_status 'pending_client', got ${propM1.reschedule_status}`);
    }
    console.log("✅ Verified: Original appointment_date (Date A) preserved strictly while proposal pending.");

    // -------------------------------------------------------------------------
    // TEST 3: Counter-party Accepts Reschedule
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Counter-party accepts reschedule -> appointment_date updates to Date B ---");
    const { data: accResM1, error: accResErr } = await supabase
      .from("matters")
      .update({
        appointment_date: propM1.proposed_reschedule_date,
        proposed_reschedule_date: null,
        reschedule_status: "accepted",
        status: "confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", m1.id)
      .eq("status", "confirmed")
      .eq("reschedule_status", "pending_client")
      .select()
      .single();

    if (accResErr || !accResM1) {
      throw new Error(`Accept reschedule failed: ${accResErr?.message}`);
    }

    if (new Date(accResM1.appointment_date).getTime() !== new Date(proposedDateB).getTime()) {
      throw new Error(`Expected appointment_date to become Date B (${proposedDateB}), got ${accResM1.appointment_date}`);
    }
    if (accResM1.proposed_reschedule_date !== null) {
      throw new Error("proposed_reschedule_date was not cleared");
    }
    if (accResM1.reschedule_status !== "accepted") {
      throw new Error(`Expected reschedule_status 'accepted', got ${accResM1.reschedule_status}`);
    }
    console.log("✅ Verified: appointment_date updated to Date B upon counter-party acceptance.");

    // -------------------------------------------------------------------------
    // TEST 4: Decline Booking with Reason
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Lawyer declines pending booking with recorded reason ---");
    const { data: m2, error: m2Err } = await supabase
      .from("matters")
      .insert({
        matter_number: `PH3-TEST-${Date.now()}-2`,
        client_id: testClient.id,
        lawyer_id: testLawyer.id,
        case_title: "Phase 3 Test Matter 2",
        category: "Corporate & Commercial Law",
        jurisdiction: "Delhi (DL)",
        urgency: "Medium",
        status: "pending",
        appointment_date: origDateA,
        duration_minutes: 45,
        reschedule_status: "none",
        consultation_type: "phone",
      })
      .select("*")
      .single();

    if (m2Err || !m2) {
      throw new Error(`Failed to create test matter 2: ${m2Err?.message}`);
    }
    createdMatterIds.push(m2.id);

    const declineReason = "Practice area conflict with opposing firm";
    const { data: decM2, error: decErr } = await supabase
      .from("matters")
      .update({
        status: "declined",
        decline_reason: declineReason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", m2.id)
      .eq("status", "pending")
      .select()
      .single();

    if (decErr || !decM2 || decM2.status !== "declined" || decM2.decline_reason !== declineReason) {
      throw new Error(`Decline booking failed: ${decErr?.message}`);
    }
    console.log(`✅ Verified: Matter declined with recorded reason: "${decM2.decline_reason}"`);

    // -------------------------------------------------------------------------
    // TEST 5: Lawyer Notification Generation & Querying
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Lawyer notification persistence and querying ---");
    const { data: notif, error: notifErr } = await supabase
      .from("lawyer_notifications")
      .insert({
        lawyer_id: testLawyer.id,
        title: "New Consultation Request",
        message: "You have a new consultation request awaiting confirmation.",
        type: "BOOKING",
        is_read: false,
        action_url: `/messages?matterId=${m1.id}`,
      })
      .select("*")
      .single();

    if (notifErr || !notif) {
      throw new Error(`Notification insert failed: ${notifErr?.message}`);
    }

    const { count: unreadCount, error: countErr } = await supabase
      .from("lawyer_notifications")
      .select("id", { count: "exact", head: true })
      .eq("lawyer_id", testLawyer.id)
      .eq("is_read", false);

    if (countErr) {
      throw new Error(`Notification query failed: ${countErr.message}`);
    }
    console.log(`✅ Verified: Lawyer notification inserted and unread count query works (${unreadCount} unread).`);

    // Cleanup notification
    await supabase.from("lawyer_notifications").delete().eq("id", notif.id);

    console.log("\n🎉 ALL PHASE 3 TESTS PASSED SUCCESSFULLY!");
  } finally {
    console.log("\nCleaning up test matters...");
    for (const id of createdMatterIds) {
      await supabase.from("matters").delete().eq("id", id);
    }
    console.log("Cleanup complete.");
  }
}

runPhase3Tests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
