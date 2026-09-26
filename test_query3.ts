import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
  const { data, error } = await supabase
    .from("matters")
    .select(`
      *,
      client:profiles!matters_client_id_fkey(id, full_name, email, avatar_url),
      lawyer:profiles!matters_lawyer_id_fkey(id, full_name, email, avatar_url)
    `)
    .limit(1);
    
  console.log(JSON.stringify(data, null, 2));
  if (error) console.error(error);
}
main();
