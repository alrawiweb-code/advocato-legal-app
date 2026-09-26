import { getAdminApplications } from "../lib/supabase/verification";

async function run() {
  const apps = await getAdminApplications();
  console.log('Admin Apps:', JSON.stringify(apps, null, 2));
}
run();
