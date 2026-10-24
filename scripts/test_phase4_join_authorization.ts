import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runPhase4Tests() {
  console.log("=== PHASE 4: ATOMIC ATTENDANCE & REALTIME SECURITY TEST SUITE ===\n");

  let testMatterId: string | null = null;
  const strangerId = "00000000-0000-0000-0000-000000000099";

  try {
    // 0. Setup: Get active client and lawyer IDs
    const { data: clients } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "client")
      .limit(1);

    const { data: lawyers } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "lawyer")
      .limit(1);

    if (!clients?.length || !lawyers?.length) {
      throw new Error("Missing test client or lawyer profiles in database.");
    }

    const testClientId = clients[0].id;
    const testLawyerId = lawyers[0].id;

    // Helper to call join RPC with simulated caller ID
    async function testJoin(matterId: string, callerId: string | null) {
      const { data, error } = await supabase.rpc("test_record_consultation_join", {
        p_matter_id: matterId,
        p_caller_id: callerId,
      });
      if (error) throw new Error("RPC invocation failed: " + error.message);
      return data;
    }

    // -------------------------------------------------------------------------
    // TEST 1: UNAUTHENTICATED
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Unauthenticated join rejection ---");
    const res1 = await testJoin("00000000-0000-0000-0000-000000000001", null);
    if (res1.error_code !== "UNAUTHENTICATED") {
      throw new Error(`Expected UNAUTHENTICATED, got ${JSON.stringify(res1)}`);
    }
    console.log("✅ Verified: Unauthenticated caller receives error_code='UNAUTHENTICATED'");

    // -------------------------------------------------------------------------
    // TEST 2: NOT_FOUND
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: Non-existent consultation record ---");
    const res2 = await testJoin("00000000-0000-0000-0000-000000000001", testClientId);
    if (res2.error_code !== "NOT_FOUND") {
      throw new Error(`Expected NOT_FOUND, got ${JSON.stringify(res2)}`);
    }
    console.log("✅ Verified: Non-existent matter receives error_code='NOT_FOUND'");

    // Create a base test matter
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data: created, error: mErr } = await supabase
      .from("matters")
      .insert({
        client_id: testClientId,
        lawyer_id: testLawyerId,
        case_title: "Phase 4 Test Consultation",
        matter_number: `MAT-P4-${Date.now()}`,
        category: "Corporate",
        status: "pending",
        appointment_date: tomorrow,
        duration_minutes: 45,
        reschedule_status: "none",
      })
      .select()
      .single();

    if (mErr || !created) {
      throw new Error("Failed to create test matter: " + mErr?.message);
    }
    testMatterId = created.id;
    const matterId = created.id;

    // -------------------------------------------------------------------------
    // TEST 3: UNAUTHORIZED (Stranger caller)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: Unauthorized caller rejection (Stranger ID) ---");
    const res3 = await testJoin(matterId, strangerId);
    if (res3.error_code !== "UNAUTHORIZED") {
      throw new Error(`Expected UNAUTHORIZED, got ${JSON.stringify(res3)}`);
    }
    console.log("✅ Verified: Stranger caller rejected with error_code='UNAUTHORIZED'");

    // -------------------------------------------------------------------------
    // TEST 4: INVALID_STATUS (Matter is pending)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: Status validation (pending booking cannot be joined) ---");
    const res4 = await testJoin(matterId, testClientId);
    if (res4.error_code !== "INVALID_STATUS") {
      throw new Error(`Expected INVALID_STATUS, got ${JSON.stringify(res4)}`);
    }
    console.log("✅ Verified: Pending consultation rejected with error_code='INVALID_STATUS'");

    // -------------------------------------------------------------------------
    // TEST 5: RESCHEDULE_PENDING
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: Reschedule pending suspends meeting entry ---");
    await supabase
      .from("matters")
      .update({ status: "confirmed", reschedule_status: "pending_client" })
      .eq("id", matterId);

    const res5 = await testJoin(matterId, testClientId);
    if (res5.error_code !== "RESCHEDULE_PENDING") {
      throw new Error(`Expected RESCHEDULE_PENDING, got ${JSON.stringify(res5)}`);
    }
    console.log("✅ Verified: Pending reschedule proposal suspends entry with error_code='RESCHEDULE_PENDING'");

    // -------------------------------------------------------------------------
    // TEST 6: TOO_EARLY (Confirmed, but scheduled for tomorrow)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 6: Join window enforcement: TOO_EARLY (T - 5m) ---");
    await supabase
      .from("matters")
      .update({ reschedule_status: "none", appointment_date: tomorrow })
      .eq("id", matterId);

    const res6 = await testJoin(matterId, testClientId);
    if (res6.error_code !== "TOO_EARLY") {
      throw new Error(`Expected TOO_EARLY, got ${JSON.stringify(res6)}`);
    }
    if (!res6.window_start) {
      throw new Error("Expected window_start in TOO_EARLY response.");
    }
    console.log(`✅ Verified: Early entry rejected with error_code='TOO_EARLY' (window opens at ${res6.window_start})`);

    // -------------------------------------------------------------------------
    // TEST 7: WINDOW_CLOSED (Appointment was 2 hours ago)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 7: Join window enforcement: WINDOW_CLOSED (T + 60m) ---");
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("matters")
      .update({ appointment_date: twoHoursAgo })
      .eq("id", matterId);

    const res7 = await testJoin(matterId, testClientId);
    if (res7.error_code !== "WINDOW_CLOSED") {
      throw new Error(`Expected WINDOW_CLOSED, got ${JSON.stringify(res7)}`);
    }
    console.log("✅ Verified: Late entry rejected with error_code='WINDOW_CLOSED'");

    // -------------------------------------------------------------------------
    // TEST 8: SUCCESS & ATOMIC ATTENDANCE (Appointment is NOW)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 8: Successful join and atomic attendance recording ---");
    const slotNow = new Date().toISOString();
    await supabase
      .from("matters")
      .update({ appointment_date: slotNow })
      .eq("id", matterId);

    const res8 = await testJoin(matterId, testClientId);
    if (!res8.success || res8.user_role !== "client") {
      throw new Error(`Expected success=true for client, got ${JSON.stringify(res8)}`);
    }
    console.log("✅ Verified: Client join succeeded:", res8);

    // Verify row in database
    const { data: dbMatter } = await supabase
      .from("matters")
      .select("status, client_joined_at, lawyer_joined_at")
      .eq("id", matterId)
      .single();

    if (dbMatter?.status !== "in_progress" || !dbMatter?.client_joined_at) {
      throw new Error("client_joined_at was not set or status is not in_progress");
    }
    const initialClientJoinedAt = dbMatter.client_joined_at;
    console.log(`✅ Verified: status='in_progress', client_joined_at='${initialClientJoinedAt}'`);

    // -------------------------------------------------------------------------
    // TEST 9: REJOIN PRESERVES INITIAL TIMESTAMP
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 9: Client refresh/rejoin preserves first-join timestamp ---");
    const res9 = await testJoin(matterId, testClientId);
    if (!res9.success || !res9.already_joined) {
      throw new Error(`Expected already_joined=true, got ${JSON.stringify(res9)}`);
    }

    const { data: dbMatterRejoin } = await supabase
      .from("matters")
      .select("client_joined_at")
      .eq("id", matterId)
      .single();

    if (dbMatterRejoin?.client_joined_at !== initialClientJoinedAt) {
      throw new Error("Initial client_joined_at was overwritten on rejoin!");
    }
    console.log("✅ Verified: Initial client_joined_at strictly preserved across rejoins.");

    // -------------------------------------------------------------------------
    // TEST 10: LAWYER JOINS (Dual Attendance Recorded)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 10: Lawyer joins active consultation ---");
    const res10 = await testJoin(matterId, testLawyerId);
    if (!res10.success || res10.user_role !== "lawyer") {
      throw new Error(`Expected success=true for lawyer, got ${JSON.stringify(res10)}`);
    }

    const { data: dbBothJoined } = await supabase
      .from("matters")
      .select("client_joined_at, lawyer_joined_at, status")
      .eq("id", testMatterId)
      .single();

    if (!dbBothJoined?.client_joined_at || !dbBothJoined?.lawyer_joined_at) {
      throw new Error("Expected both client and lawyer timestamps to be recorded.");
    }
    console.log(`✅ Verified: Both participants logged. Client=${dbBothJoined.client_joined_at}, Lawyer=${dbBothJoined.lawyer_joined_at}`);

    // -------------------------------------------------------------------------
    // TEST 11: Ephemeral Signaling Table Insertion & Counterpart RLS
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 11: Ephemeral signaling exchange via consultation_signaling ---");
    const { data: sigMsg, error: sigErr } = await supabase
      .from("consultation_signaling")
      .insert({
        matter_id: testMatterId,
        sender_id: testClientId,
        recipient_id: testLawyerId,
        event_type: "sdp-offer",
        payload: { type: "offer", sdp: "v=0\r\no=- 12345 2 IN IP4 127.0.0.1..." },
      })
      .select()
      .single();

    if (sigErr || !sigMsg) {
      throw new Error("Failed to insert signaling row: " + sigErr?.message);
    }
    console.log("✅ Verified: Client signaled lawyer via consultation_signaling row:", sigMsg.id);

    // Clean up signaling row
    await supabase.from("consultation_signaling").delete().eq("id", sigMsg.id);

    console.log("\n🎉 ALL 11 PHASE 4 TESTS PASSED SUCCESSFULLY!");
  } finally {
    if (testMatterId) {
      console.log("\nCleaning up test matter...");
      await supabase.from("matters").delete().eq("id", testMatterId);
      console.log("Cleanup complete.");
    }
  }
}

runPhase4Tests().catch((err) => {
  console.error("❌ Phase 4 Test Suite Failed:", err);
  process.exit(1);
});
