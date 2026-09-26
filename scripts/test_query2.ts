import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function run() {
  const { data, error } = await supabase
    .from("lawyer_verification_applications")
    .select(`
      *,
      lawyer_profiles (
        title, headline, hourly_rate, practice_areas, bio,
        profiles (full_name, email, avatar_url)
      ),
      verification_documents (*)
    `);
  console.log('Error:', error);
  console.log('Data:', JSON.stringify(data, null, 2));
}
run();
