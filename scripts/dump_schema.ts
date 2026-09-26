import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function dumpSchema() {
  const tables = [
    'lawyer_profiles',
    'lawyer_verification_applications',
    'verification_documents',
    'verification_document_requirements',
    'verification_audit_logs'
  ];

  for (const table of tables) {
    console.log(`\n--- ${table} ---`);
    // fetch 1 row to see keys
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (data && data.length > 0) {
      console.log(Object.keys(data[0]));
    } else {
      console.log('No data found, cannot infer schema via data.');
    }
  }
}
dumpSchema();
