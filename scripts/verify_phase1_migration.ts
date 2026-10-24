import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  console.log("=== PHASE 1 POST-MIGRATION VERIFICATION ===\n");

  // 1. Verify all new columns exist on matters
  const { data: colsData, error: colsError } = await supabase
    .from("matters")
    .select(`
      id,
      status,
      appointment_date,
      duration_minutes,
      client_joined_at,
      lawyer_joined_at,
      decline_reason,
      proposed_reschedule_date,
      reschedule_requested_by,
      reschedule_status,
      reschedule_reason,
      original_appointment_date
    `)
    .limit(5);

  if (colsError) {
    console.error("❌ Column check failed:", colsError.message);
    return false;
  }
  console.log("✅ All new columns successfully queried from public.matters.");

  // 2. Verify existing historical matters are intact
  const { data: allMatters, error: allErr } = await supabase
    .from("matters")
    .select("id, status, appointment_date, duration_minutes, reschedule_status");

  if (allErr) {
    console.error("❌ Failed to query existing matters:", allErr.message);
    return false;
  }

  console.log(`✅ Historical matters count: ${allMatters.length}`);
  for (const m of allMatters) {
    console.log(`   - Matter ${m.id.slice(0, 8)}... status=${m.status}, duration=${m.duration_minutes}, reschedule_status=${m.reschedule_status}`);
    if (m.reschedule_status !== "none") {
      console.error(`❌ Matter ${m.id} has invalid reschedule_status: expected 'none', got '${m.reschedule_status}'`);
      return false;
    }
    if (m.duration_minutes !== 45) {
      console.error(`❌ Matter ${m.id} has invalid duration_minutes: expected 45, got ${m.duration_minutes}`);
      return false;
    }
  }
  console.log("✅ Verified: Every existing matter has default duration_minutes = 45 and reschedule_status = 'none'.");

  return true;
}

verifyMigration().then((success) => {
  if (success) {
    console.log("\n🎉 PHASE 1 VERIFICATION COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } else {
    console.error("\n❌ Phase 1 verification failed. Migration not yet applied.");
    process.exit(1);
  }
}).catch((err) => {
  console.error("Fatal verification error:", err);
  process.exit(1);
});
