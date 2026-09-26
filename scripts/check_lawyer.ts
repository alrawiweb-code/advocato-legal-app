import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const { data: p } = await supabase.from('profiles').select('*').eq('email', 'rosancva@gmail.com').single();
  console.log('Profile:', p);
  if (p) {
    const { data: lp } = await supabase.from('lawyer_profiles').select('*').eq('id', p.id).single();
    console.log('Lawyer Profile:', lp);
  }
}
run();
