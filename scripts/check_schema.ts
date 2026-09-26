import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const tablesToCheck = [
    'profiles',
    'lawyer_profiles',
    'verification_applications',
    'lawyer_verification_applications',
    'verification_documents',
    'verification_document_requirements',
    'verification_audit_logs'
  ];

  for (const table of tablesToCheck) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table ${table} ERROR/MISSING:`, error.message);
    } else {
      console.log(`Table ${table} EXISTS.`);
    }
  }
}

checkSchema();
