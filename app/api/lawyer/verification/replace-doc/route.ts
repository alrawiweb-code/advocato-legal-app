import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { replaceLawyerVerificationDocument } from "@/lib/supabase/verification";
import { validateVerificationFile } from "@/lib/utils/file-validation";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const requirementId = formData.get("requirementId") as string | null;

    if (!file || !requirementId) {
      return NextResponse.json(
        { error: "Both 'file' and 'requirementId' are required." },
        { status: 400 }
      );
    }

    // 3. Binary Magic-Byte & Size Validation
    const validation = await validateVerificationFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || "Invalid file format." },
        { status: 400 }
      );
    }

    // 4. Execute replacement
    const result = await replaceLawyerVerificationDocument({
      lawyerId: user.id,
      requirementId: requirementId.trim(),
      file,
      filename: file.name,
      mimeType: validation.detectedMime || file.type || "application/octet-stream",
      fileSize: file.size,
    });

    if (!result.success) {
      const isLocked = result.error?.includes("rejected and locked");
      return NextResponse.json({ error: result.error }, { status: isLocked ? 403 : 500 });
    }

    return NextResponse.json({ success: true, document: result.document });
  } catch (err: any) {
    console.error("Replace document route error:", err);
    return NextResponse.json({ error: err.message || "Failed to replace document." }, { status: 500 });
  }
}
