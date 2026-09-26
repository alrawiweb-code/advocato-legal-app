import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const { error } = await supabase.from('lawyer_profiles').insert({
    id: '90e29ea0-2eba-4edb-a227-21f40c3173b4',
    title: 'Advocate',
    headline: 'General Practice',
    bar_number: 'DL/123/2026',
    state_bar: 'Delhi (DL)',
    years_experience: 5,
    hourly_rate: 2500,
    is_verified: false,
    verification_status: 'NOT_VERIFIED',
    availability: 'Available today',
    jurisdiction: 'Delhi (DL)',
    state: 'Delhi (DL)',
    practice_areas: ['General Practice'],
    bio: 'Test lawyer profile.',
    rating: 5.0,
    review_count: 0
  });
  console.log('Inserted:', error ? error : 'Success');
}
run();
