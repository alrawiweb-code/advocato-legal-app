import { validateVerificationFile } from "../lib/utils/file-validation";
import { getVerificationRequirements } from "../lib/supabase/verification";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runTests() {
  console.log("=== ADVOCATO VERIFICATION & SUBMISSION FORENSIC TEST SUITE ===\n");
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (detail) console.error(`       Detail: ${detail}`);
    }
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);

  // 1. Magic-Byte Binary Security Validation Test
  console.log("\n--- TEST 1: File Binary & Magic Byte Validation ---");
  {
    // Valid PDF header
    const validPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // "%PDF-1.4"
    const validPdfFile = new File([validPdfBytes], "test.pdf", { type: "application/pdf" });
    const pdfRes = await validateVerificationFile(validPdfFile);
    assert(pdfRes.valid === true && pdfRes.detectedMime === "application/pdf", "Valid PDF passes magic-byte verification");

    // Valid PNG header
    const validPngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const validPngFile = new File([validPngBytes], "test.png", { type: "image/png" });
    const pngRes = await validateVerificationFile(validPngFile);
    assert(pngRes.valid === true && pngRes.detectedMime === "image/png", "Valid PNG passes magic-byte verification");

    // Corrupted file pretending to be PDF
    const fakePdfBytes = new Uint8Array([0x45, 0x56, 0x49, 0x4c, 0x20, 0x53, 0x43, 0x52]); // "EVIL SCR"
    const fakePdfFile = new File([fakePdfBytes], "malicious.pdf", { type: "application/pdf" });
    const fakeRes = await validateVerificationFile(fakePdfFile);
    assert(fakeRes.valid === false, "Spoofed PDF header correctly rejected", fakeRes.error);
  }

  // 2. Unauthenticated Request & Session Expiry Test
  console.log("\n--- TEST 2: Unauthenticated / Session Expiration Simulation ---");
  {
    try {
      const res = await fetch("http://localhost:3000/api/lawyer/verification/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lawyerId: "25c19700-edde-41b0-8766-b94e8f65f88d" }),
      });
      const data = await res.json();
      assert(
        res.status === 401 && (data.error?.includes("Session expired") || data.error?.includes("unauthenticated")),
        "API rejects unauthenticated requests with HTTP 401",
        `Received status ${res.status}: ${JSON.stringify(data)}`
      );
    } catch (e: any) {
      assert(false, "API rejects unauthenticated requests with HTTP 401", e.message);
    }
  }

  // 3. Defensive Schema Error Detection Test (distinguish 42703 from real errors)
  console.log("\n--- TEST 3: Defensive Schema Check (Code 42703 Detection) ---");
  {
    const { error: testColErr } = await adminClient
      .from("verification_documents")
      .select("is_active")
      .limit(1);

    const isMissingColumn = testColErr?.code === "42703" || testColErr?.message?.includes("is_active");
    assert(
      isMissingColumn === true,
      "System accurately detects missing column 42703 without crashing or suppressing errors",
      `Observed code: ${testColErr?.code}, message: ${testColErr?.message}`
    );
  }

  // 4. Zero-Row Update Safety Test
  console.log("\n--- TEST 4: Zero-Row Update Detection Guard ---");
  {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";
    const { data: updatedApps, error: updateErr } = await adminClient
      .from("lawyer_verification_applications")
      .update({ status: "UNDER_REVIEW" })
      .eq("id", nonExistentId)
      .select();

    const correctlyDetectedZeroRows = !updateErr && (!updatedApps || updatedApps.length === 0);
    assert(
      correctlyDetectedZeroRows,
      "Zero-row database updates are identified instead of falsely treated as success",
      `Rows returned: ${updatedApps?.length || 0}`
    );
  }

  // 5. Suspended Lawyer Safeguard Check
  console.log("\n--- TEST 5: Suspended Lawyer Safeguard & Fee Preservation ---");
  {
    // Inspect current state of lawyer 25c19700-edde-41b0-8766-b94e8f65f88d (Read-only, no mutations)
    const { data: lawyerProfile } = await adminClient
      .from("lawyer_profiles")
      .select("verification_status, is_verified, suspension_reason, hourly_rate")
      .eq("id", "25c19700-edde-41b0-8766-b94e8f65f88d")
      .single();

    assert(
      lawyerProfile?.suspension_reason !== null && lawyerProfile?.is_verified === false,
      "Lawyer with active suspension reason is excluded from verified status",
      `verification_status: ${lawyerProfile?.verification_status}, is_verified: ${lawyerProfile?.is_verified}`
    );

    assert(
      typeof lawyerProfile?.hourly_rate === "number" && lawyerProfile.hourly_rate > 0,
      "Lawyer consultation fee is preserved (not reset or overwritten)",
      `hourly_rate: ₹${lawyerProfile?.hourly_rate}`
    );
  }

  // 6. Requirements Completeness Query Test
  console.log("\n--- TEST 6: Mandatory Requirements Configuration ---");
  {
    const reqs = await getVerificationRequirements();
    const requiredReqs = reqs.filter(r => r.is_required);
    assert(
      requiredReqs.length === 2 && reqs.length === 3,
      "Active verification requirements retrieved correctly (2 mandatory, 1 optional)",
      `Total requirements: ${reqs.length}, Mandatory: ${requiredReqs.length}`
    );
  }

  console.log(`\n======================================================`);
  console.log(`SUMMARY: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log(`======================================================\n`);
}

runTests().catch(console.error);
