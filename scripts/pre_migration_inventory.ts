import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runInventory() {
  console.log("=== PRE-MIGRATION INVENTORY: public.matters ===\n");
  
  const { data, error } = await supabase
    .from("matters")
    .select("id, status, appointment_date, created_at");

  if (error) {
    console.error("Query Error:", error);
    process.exit(1);
  }

  console.log(`Total matters fetched: ${data.length}`);

  const summary: Record<string, {
    total: number;
    withAppointment: number;
    withoutAppointment: number;
    earliest: string | null;
    latest: string | null;
  }> = {};

  for (const row of data) {
    const status = row.status;
    if (!summary[status]) {
      summary[status] = {
        total: 0,
        withAppointment: 0,
        withoutAppointment: 0,
        earliest: null,
        latest: null,
      };
    }

    const s = summary[status];
    s.total++;
    if (row.appointment_date) {
      s.withAppointment++;
    } else {
      s.withoutAppointment++;
    }

    if (!s.earliest || (row.created_at && row.created_at < s.earliest)) {
      s.earliest = row.created_at;
    }
    if (!s.latest || (row.created_at && row.created_at > s.latest)) {
      s.latest = row.created_at;
    }
  }

  console.table(
    Object.entries(summary).map(([status, stats]) => ({
      status,
      total_count: stats.total,
      with_appointment: stats.withAppointment,
      without_appointment: stats.withoutAppointment,
      earliest_record: stats.earliest,
      latest_record: stats.latest,
    }))
  );

  const allowedLegacyStatuses = new Set(["active", "scheduled", "review", "closed"]);
  const unexpected = Object.keys(summary).filter((st) => !allowedLegacyStatuses.has(st));

  if (unexpected.length > 0) {
    console.error("\n❌ UNEXPECTED STATUS VALUES DETECTED:", unexpected);
  } else {
    console.log("\n✅ ALL EXISTING STATUS VALUES ARE VALID LEGACY STATUSES ('active', 'scheduled', 'review', 'closed').");
  }
}

runInventory().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
