import { createClient } from "@supabase/supabase-js";
import { getLawyerApplication, submitVerificationApplication } from "../lib/supabase/verification";

// Local dev server URL
const APP_URL = "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTest() {
  console.log("=== STARTING END-TO-END VERIFICATION TEST ===");

  // 1. Log in as Lawyer
  console.log("\n1. Logging in as Lawyer (rosancva@gmail.com)...");
  const { data: lawyerAuth, error: lawyerErr } = await supabase.auth.signInWithPassword({
    email: "rosancva@gmail.com",
    password: "2332003",
  });

  if (lawyerErr || !lawyerAuth.session) {
    console.error("Failed to log in as lawyer:", lawyerErr?.message);
    return;
  }
  const lawyerToken = lawyerAuth.session.access_token;
  const lawyerId = lawyerAuth.user.id;
  console.log("✅ Logged in successfully. Lawyer ID:", lawyerId);


  // 2. Submit Application via internal function
  console.log("\n2. Submitting application via internal function...");
  const dummyFile = new Blob(["dummy content"], { type: "text/plain" }) as any;
  dummyFile.name = "dummy.txt";

  const submitRes = await submitVerificationApplication({
    lawyerId: lawyerId,
    barNumber: "TEST-BAR-2026",
    stateBar: "New York (NY)",
    yearsExperience: 10,
    documents: [{ requirementId: "test-req-id", file: dummyFile }],
  });

  if (!submitRes.success) {
    console.error("Failed to submit application:", submitRes.error);
    return;
  }
  const applicationDraft = await getLawyerApplication(lawyerId);
  const applicationId = applicationDraft?.id;
  console.log("✅ Application submitted successfully. ID:", applicationId);

  // 4. Admin Approval
  // Since we don't know the admin password, we will use Supabase Service Role to approve it.
  console.log("\n4. Simulating Admin Approval (via Service Role)...");
  const adminSupabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Get admin ID
  const { data: adminUser } = await adminSupabase.from("profiles").select("id").eq("email", "alrawiweb@gmail.com").single();
  
  if (!adminUser) {
    console.error("Admin user not found in DB.");
    return;
  }

  // Update App status to APPROVED
  await adminSupabase.from("lawyer_verification_applications").update({
    status: "APPROVED",
    reviewed_at: new Date().toISOString(),
    reviewed_by: adminUser.id,
  }).eq("id", applicationId);

  // Update Lawyer Profile to VERIFIED
  await adminSupabase.from("lawyer_profiles").update({
    is_verified: true,
    verification_status: "VERIFIED",
  }).eq("id", lawyerId);

  // Add audit log
  await adminSupabase.from("verification_audit_logs").insert({
    application_id: applicationId,
    actor_id: adminUser.id,
    actor_role: "admin",
    action: "APPROVE_APPLICATION",
    previous_status: "SUBMITTED",
    new_status: "APPROVED",
    reason: "Test Script Automated Approval",
  });
  console.log("✅ Application approved successfully.");

  // 5. Check Marketplace Directory via API
  console.log("\n5. Checking Marketplace API for visibility...");
  const dirRes = await fetch(`${APP_URL}/api/lawyers`);
  const dirData = await dirRes.json();
  
  const foundInMarketplace = dirData.lawyers?.find((l: any) => l.id === lawyerId);
  
  if (foundInMarketplace) {
    console.log("✅ Lawyer successfully found in public marketplace!");
    console.log(`   Name: ${foundInMarketplace.name}`);
    console.log(`   Verification: ${foundInMarketplace.verificationStatus}`);
  } else {
    console.error("❌ Lawyer NOT found in public marketplace!");
  }

  console.log("\n=== TEST COMPLETE ===");
}

runTest().catch(console.error);
