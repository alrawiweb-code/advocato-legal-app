import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: dbLawyers, error } = await supabase.from('profiles').select('id').eq('role', 'lawyer');
  if (error) {
    console.error("DB Error:", error);
    return;
  }
  
  const dbIds = new Set(dbLawyers.map(l => l.id));
  
  // From lib/data/lawyers.ts
  const demoIds = Array.from({length: 20}, (_, i) => String(i + 1));
  const missing = demoIds.filter(id => !dbIds.has(id));
  
  console.log("Missing Demo Lawyers IDs:", missing);
}
main();
