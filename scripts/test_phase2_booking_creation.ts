import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runPhase2Tests() {
  console.log("=== PHASE 2: RELIABLE BOOKING CREATION TEST SUITE ===\n");

  // 1. Fetch an existing verified lawyer and client profile to test against
  const { data: lawyers, error: lErr } = await supabase
    .from("lawyer_profiles")
    .select("id, hourly_rate, is_verified, verification_status")
    .eq("is_verified", true)
    .gt("hourly_rate", 0)
    .limit(1);

  if (lErr || !lawyers || lawyers.length === 0) {
    console.error("❌ No verified lawyer found for testing:", lErr?.message);
    process.exit(1);
  }
  const testLawyer = lawyers[0];

  const { data: clients, error: cErr } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("role", "client")
    .limit(1);

  if (cErr || !clients || clients.length === 0) {
    console.error("❌ No client profile found for testing:", cErr?.message);
    process.exit(1);
  }
  const testClient = clients[0];

  console.log(`Testing with Client: ${testClient.id.slice(0, 8)}... Lawyer: ${testLawyer.id.slice(0, 8)}...`);

  const createdMatterIds: string[] = [];

  try {
    // TEST 1: Creation of booking with appointmentDate, consultationType, timezone
    console.log("\n--- TEST 1: Booking creation produces status='pending' and duration=45 ---");
    const testAppointmentDate = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    const matterNumber1 = `TEST-MAT-${Date.now()}-1`;

    const { data: m1, error: m1Err } = await supabase
      .from("matters")
      .insert({
        matter_number: matterNumber1,
        client_id: testClient.id,
        lawyer_id: testLawyer.id,
        case_title: "Phase 2 Test Matter 1",
        category: "Corporate & Commercial Law",
        jurisdiction: "Delhi (DL)",
        urgency: "Medium",
        status: "pending",
        appointment_date: testAppointmentDate,
        duration_minutes: 45,
        reschedule_status: "none",
        consultation_type: "video",
      })
      .select("*")
      .single();

    if (m1Err || !m1) {
      console.error("❌ Test 1 insert failed:", m1Err?.message);
      process.exit(1);
    }
    createdMatterIds.push(m1.id);

    console.log(`✅ Matter 1 created: id=${m1.id}, status=${m1.status}, duration=${m1.duration_minutes}, type=${m1.consultation_type}`);
    if (m1.status !== "pending") {
      throw new Error(`Expected status 'pending', got '${m1.status}'`);
    }
    if (m1.duration_minutes !== 45) {
      throw new Error(`Expected duration_minutes 45, got ${m1.duration_minutes}`);
    }
    if (m1.reschedule_status !== "none") {
      throw new Error(`Expected reschedule_status 'none', got '${m1.reschedule_status}'`);
    }

    // TEST 2: Message insertion for booking request
    console.log("\n--- TEST 2: System request message insertion ---");
    const { data: msg1, error: msg1Err } = await supabase
      .from("messages")
      .insert({
        matter_id: m1.id,
        sender_id: testClient.id,
        sender_role: "client",
        text: `Consultation requested for ${new Date(testAppointmentDate).toLocaleString("en-US")} via Video. Status: Pending Advocate Confirmation.`,
      })
      .select("*")
      .single();

    if (msg1Err || !msg1) {
      console.error("❌ Test 2 message insert failed:", msg1Err?.message);
      process.exit(1);
    }
    console.log(`✅ Request message logged: id=${msg1.id}, text="${msg1.text.slice(0, 50)}..."`);

    // TEST 3: Repeat booking support (new appointment creates NEW matter)
    console.log("\n--- TEST 3: Repeat booking produces a separate distinct matter ---");
    const testAppointmentDate2 = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
    const matterNumber2 = `TEST-MAT-${Date.now()}-2`;

    const { data: m2, error: m2Err } = await supabase
      .from("matters")
      .insert({
        matter_number: matterNumber2,
        client_id: testClient.id,
        lawyer_id: testLawyer.id,
        case_title: "Phase 2 Test Matter 2 (Repeat)",
        category: "Corporate & Commercial Law",
        jurisdiction: "Delhi (DL)",
        urgency: "High",
        status: "pending",
        appointment_date: testAppointmentDate2,
        duration_minutes: 45,
        reschedule_status: "none",
        consultation_type: "phone",
      })
      .select("*")
      .single();

    if (m2Err || !m2) {
      console.error("❌ Test 3 insert failed:", m2Err?.message);
      process.exit(1);
    }
    createdMatterIds.push(m2.id);

    console.log(`✅ Matter 2 created: id=${m2.id}, status=${m2.status}, type=${m2.consultation_type}`);
    if (m2.id === m1.id) {
      throw new Error("Repeat booking collided with existing matter!");
    }
    console.log("✅ Repeat booking successfully created separate matter record with distinct UUID.");

    console.log("\n🎉 ALL PHASE 2 TESTS PASSED SUCCESSFULLY!");
  } finally {
    // Cleanup test records
    console.log("\nCleaning up test matters...");
    for (const id of createdMatterIds) {
      await supabase.from("matters").delete().eq("id", id);
    }
    console.log("Cleanup complete.");
  }
}

runPhase2Tests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
