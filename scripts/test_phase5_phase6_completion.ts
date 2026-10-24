import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runPhase5Phase6Tests() {
  console.log("=== PHASE 5 & 6: WEBRTC RELIABILITY, DOSSIER INTEGRATION & BULK EVALUATOR TEST SUITE ===\n");

  const cleanupMatterIds: string[] = [];

  try {
    // 0. Setup: Get active client and lawyer IDs
    const { data: clients } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "client")
      .limit(1);

    const { data: lawyers } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "lawyer")
      .limit(1);

    if (!clients?.length || !lawyers?.length) {
      throw new Error("Missing test client or lawyer profiles in database.");
    }

    const testClientId = clients[0].id;
    const testLawyerId = lawyers[0].id;

    // -------------------------------------------------------------------------
    // TEST 1: Phase 5 - WebRTC Signaling & Candidate Queue Delivery
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: WebRTC Signaling message exchange (Option B table) ---");
    const { data: testMatter, error: tmErr } = await supabase
      .from("matters")
      .insert({
        client_id: testClientId,
        lawyer_id: testLawyerId,
        case_title: "Signaling Protocol Test",
        matter_number: `MAT-P5-${Date.now()}`,
        category: "Corporate",
        status: "in_progress",
        appointment_date: new Date().toISOString(),
        duration_minutes: 45,
        reschedule_status: "none",
      })
      .select()
      .single();

    if (tmErr || !testMatter) throw new Error("Failed to create test matter: " + tmErr?.message);
    cleanupMatterIds.push(testMatter.id);

    // Client sends offer
    const { data: sig1, error: sErr1 } = await supabase
      .from("consultation_signaling")
      .insert({
        matter_id: testMatter.id,
        sender_id: testClientId,
        recipient_id: testLawyerId,
        event_type: "sdp-offer",
        payload: { sdp: "v=0\r\no=client 1 1 IN IP4...", type: "offer" },
      })
      .select()
      .single();

    if (sErr1) throw new Error("Failed to insert sdp-offer: " + sErr1.message);
    console.log("✅ Verified: Client transmitted SDP offer to lawyer:", sig1.id);

    // Early ICE Candidate from lawyer arrives before answer
    const { data: sig2, error: sErr2 } = await supabase
      .from("consultation_signaling")
      .insert({
        matter_id: testMatter.id,
        sender_id: testLawyerId,
        recipient_id: testClientId,
        event_type: "ice-candidate",
        payload: { candidate: { candidate: "candidate:1 1 UDP...", sdpMid: "0" } },
      })
      .select()
      .single();

    if (sErr2) throw new Error("Failed to insert early ice-candidate: " + sErr2.message);
    console.log("✅ Verified: Early ICE candidate transmitted without schema error:", sig2.id);

    // Lawyer sends answer
    const { data: sig3, error: sErr3 } = await supabase
      .from("consultation_signaling")
      .insert({
        matter_id: testMatter.id,
        sender_id: testLawyerId,
        recipient_id: testClientId,
        event_type: "sdp-answer",
        payload: { sdp: "v=0\r\no=lawyer 2 2 IN IP4...", type: "answer" },
      })
      .select()
      .single();

    if (sErr3) throw new Error("Failed to insert sdp-answer: " + sErr3.message);
    console.log("✅ Verified: Lawyer transmitted SDP answer to client:", sig3.id);

    // Clean up signaling rows
    await supabase.from("consultation_signaling").delete().eq("matter_id", testMatter.id);

    // -------------------------------------------------------------------------
    // TEST 2: Phase 6 - [F-08] Chat Creation Produces Valid PostgreSQL UUIDs
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2: [F-08] Chat creation persistence with valid UUIDs ---");
    const { data: uuidMatter, error: uErr } = await supabase
      .from("matters")
      .insert({
        client_id: testClientId,
        lawyer_id: testLawyerId,
        case_title: `Direct Conversation with ${lawyers[0].full_name}`,
        matter_number: `MAT-P6-${Date.now()}`,
        category: "General Practice",
        status: "active",
        reschedule_status: "none",
      })
      .select()
      .single();

    if (uErr || !uuidMatter) throw new Error("Failed to create UUID conversation: " + uErr?.message);
    cleanupMatterIds.push(uuidMatter.id);

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(uuidMatter.id)) {
      throw new Error(`CRITICAL: Generated conversation ID is not a valid UUID: ${uuidMatter.id}`);
    }
    console.log("✅ Verified: Conversation created with valid PostgreSQL UUID:", uuidMatter.id);

    // Verify messages table accepts insert for this matter
    const { data: chatMsg, error: chatErr } = await supabase
      .from("messages")
      .insert({
        matter_id: uuidMatter.id,
        sender_id: testClientId,
        sender_role: "client",
        text: "Hello counsel, following up on our active matter.",
      })
      .select()
      .single();

    if (chatErr || !chatMsg) {
      throw new Error("Failed to insert message into UUID matter: " + chatErr?.message);
    }
    console.log("✅ Verified: Message inserted without PostgreSQL UUID syntax errors:", chatMsg.id);

    // -------------------------------------------------------------------------
    // TEST 3: Phase 6 - [F-09] Dossier Details & Escrow Rates in Database Joins
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 3: [F-09] Dossier hourlyRate & intakeBrief join resolution ---");
    // Ensure lawyer profile has hourly rate set
    await supabase
      .from("lawyer_profiles")
      .upsert({ id: testLawyerId, hourly_rate: 6500, years_experience: 10, bio: "Senior Advocate." });

    // Ensure matter has intake assessment
    const { data: intakeAss, error: iaErr } = await supabase
      .from("intake_assessments")
      .insert({
        matter_id: uuidMatter.id,
        client_id: testClientId,
        raw_text: "Need consultation regarding corporate agreement redlines.",
        category: "Corporate",
        sub_category: "Corporate Law",
        jurisdiction: "Delhi (DL)",
        urgency: "High",
        summary: "Corporate client seeking redline review of shareholder agreement.",
        source: "test_suite",
      })
      .select()
      .single();

    if (iaErr) throw new Error("Failed to insert test intake assessment: " + iaErr.message);

    // Query matters with nested lawyer_profiles and intake_assessments
    const { data: queriedMatters, error: qmErr } = await supabase
      .from("matters")
      .select(`
        id,
        case_title,
        lawyer:profiles!matters_lawyer_id_fkey(
          id, full_name,
          lawyer_profiles(hourly_rate, years_experience, bio)
        ),
        intake_assessments(summary)
      `)
      .eq("id", uuidMatter.id)
      .single();

    if (qmErr || !queriedMatters) throw new Error("Failed to query matter details: " + qmErr?.message);

    const lawyerData = Array.isArray(queriedMatters.lawyer) ? queriedMatters.lawyer[0] : (queriedMatters.lawyer as any);
    const lawyerProf = Array.isArray(lawyerData?.lawyer_profiles)
      ? lawyerData.lawyer_profiles[0]
      : lawyerData?.lawyer_profiles;

    const intakeSumm = Array.isArray(queriedMatters.intake_assessments)
      ? queriedMatters.intake_assessments[0]?.summary
      : (queriedMatters.intake_assessments as any)?.summary;

    if (!lawyerProf?.hourly_rate || lawyerProf.hourly_rate <= 0) {
      throw new Error(`Expected positive hourlyRate, got ${lawyerProf?.hourly_rate}`);
    }
    if (!intakeSumm) {
      throw new Error("Expected intake summary to be populated in dossier query.");
    }
    console.log(`✅ Verified: Dossier populated hourlyRate=₹${lawyerProf.hourly_rate}/hr and intakeBrief="${intakeSumm}"`);

    // -------------------------------------------------------------------------
    // TEST 4: Phase 6 - Bulk Evaluator Marks Unjoined Consultations MISSED
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4: evaluate_consultation_outcomes marks unjoined booking MISSED ---");
    // Create consultation 2 hours in the past, confirmed, no attendees
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: missedMatter, error: mmErr } = await supabase
      .from("matters")
      .insert({
        client_id: testClientId,
        lawyer_id: testLawyerId,
        case_title: "Missed Consultation Test",
        matter_number: `MAT-MISSED-${Date.now()}`,
        category: "Corporate",
        status: "confirmed",
        appointment_date: twoHoursAgo,
        duration_minutes: 45,
        reschedule_status: "none",
        client_joined_at: null,
        lawyer_joined_at: null,
      })
      .select()
      .single();

    if (mmErr || !missedMatter) throw new Error("Failed to create missed matter: " + mmErr?.message);
    cleanupMatterIds.push(missedMatter.id);

    // Call evaluator RPC
    const { data: evalResult1, error: evErr1 } = await supabase.rpc("evaluate_consultation_outcomes", {
      p_batch_size: 100,
    });

    if (evErr1) throw new Error("Evaluator RPC failed: " + evErr1.message);
    console.log("Evaluator Output 1:", evalResult1);

    // Check status in DB
    const { data: checkMissed } = await supabase
      .from("matters")
      .select("status")
      .eq("id", missedMatter.id)
      .single();

    if (checkMissed?.status !== "missed") {
      throw new Error(`Expected status='missed', got '${checkMissed?.status}'`);
    }
    console.log("✅ Verified: Unjoined past consultation successfully transitioned to status='missed'");

    // -------------------------------------------------------------------------
    // TEST 5: Phase 6 - Bulk Evaluator Marks Attended Consultations COMPLETED
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 5: evaluate_consultation_outcomes marks attended booking COMPLETED ---");
    const { data: completedMatter, error: cmErr } = await supabase
      .from("matters")
      .insert({
        client_id: testClientId,
        lawyer_id: testLawyerId,
        case_title: "Completed Consultation Test",
        matter_number: `MAT-COMP-${Date.now()}`,
        category: "Corporate",
        status: "in_progress",
        appointment_date: twoHoursAgo,
        duration_minutes: 45,
        reschedule_status: "none",
        client_joined_at: twoHoursAgo,
        lawyer_joined_at: twoHoursAgo,
      })
      .select()
      .single();

    if (cmErr || !completedMatter) throw new Error("Failed to create completed matter: " + cmErr?.message);
    cleanupMatterIds.push(completedMatter.id);

    const { data: evalResult2, error: evErr2 } = await supabase.rpc("evaluate_consultation_outcomes", {
      p_batch_size: 100,
    });

    if (evErr2) throw new Error("Evaluator RPC failed: " + evErr2.message);
    console.log("Evaluator Output 2:", evalResult2);

    const { data: checkCompleted } = await supabase
      .from("matters")
      .select("status")
      .eq("id", completedMatter.id)
      .single();

    if (checkCompleted?.status !== "completed") {
      throw new Error(`Expected status='completed', got '${checkCompleted?.status}'`);
    }
    console.log("✅ Verified: Attended past consultation successfully transitioned to status='completed'");

    // -------------------------------------------------------------------------
    // TEST 6: Reschedule Protection (Pending Reschedules NOT Marked Missed)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 6: Pending reschedule exempt from missed classification ---");
    const { data: reschMatter, error: rmErr } = await supabase
      .from("matters")
      .insert({
        client_id: testClientId,
        lawyer_id: testLawyerId,
        case_title: "Protected Reschedule Test",
        matter_number: `MAT-RESCH-${Date.now()}`,
        category: "Corporate",
        status: "confirmed",
        appointment_date: twoHoursAgo,
        duration_minutes: 45,
        reschedule_status: "pending_client",
        proposed_reschedule_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (rmErr || !reschMatter) throw new Error("Failed to create reschedule matter: " + rmErr?.message);
    cleanupMatterIds.push(reschMatter.id);

    await supabase.rpc("evaluate_consultation_outcomes", { p_batch_size: 100 });

    const { data: checkResch } = await supabase
      .from("matters")
      .select("status")
      .eq("id", reschMatter.id)
      .single();

    if (checkResch?.status !== "confirmed") {
      throw new Error(`CRITICAL: Reschedule matter was prematurely altered to '${checkResch?.status}'`);
    }
    console.log("✅ Verified: Matter with active reschedule proposal preserved status='confirmed'");

    console.log("\n🎉 ALL PHASE 5 & PHASE 6 TESTS PASSED SUCCESSFULLY!");
  } finally {
    if (cleanupMatterIds.length > 0) {
      console.log(`\nCleaning up ${cleanupMatterIds.length} test matters...`);
      await supabase.from("matters").delete().in("id", cleanupMatterIds);
      console.log("Cleanup complete.");
    }
  }
}

runPhase5Phase6Tests().catch((err) => {
  console.error("❌ Phase 5/6 Test Suite Failed:", err);
  process.exit(1);
});
