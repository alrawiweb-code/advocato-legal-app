import { NextRequest, NextResponse } from "next/server";
import { getVerificationRequirements, getLawyerApplication } from "@/lib/supabase/verification";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lawyerId = searchParams.get("lawyerId");

  if (!lawyerId) {
    return NextResponse.json({ error: "lawyerId is required" }, { status: 400 });
  }

  // Authorize: Ensure caller is the same lawyer
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== lawyerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [requirements, application] = await Promise.all([
    getVerificationRequirements(),
    getLawyerApplication(lawyerId),
  ]);

  return NextResponse.json({ requirements, application });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lawyerId, barNumber, stateBar, yearsExperience } = body;

    if (!lawyerId) {
      return NextResponse.json({ error: "lawyerId is required" }, { status: 400 });
    }

    // Authorize
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== lawyerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if application exists
    const application = await getLawyerApplication(lawyerId);
    let newApp;

    if (!application) {
      // Create new DRAFT
      const { data, error } = await supabase
        .from("lawyer_verification_applications")
        .insert({
          lawyer_id: lawyerId,
          bar_number: barNumber,
          state_bar: stateBar,
          years_experience: yearsExperience,
          practice_jurisdictions: stateBar ? [stateBar] : [],
          status: "DRAFT",
        })
        .select()
        .single();

      if (error) throw error;
      newApp = data;
    } else {
      // Update existing
      const { data, error } = await supabase
        .from("lawyer_verification_applications")
        .update({
          bar_number: barNumber,
          state_bar: stateBar,
          years_experience: yearsExperience,
          practice_jurisdictions: stateBar ? [stateBar] : application.practice_jurisdictions,
        })
        .eq("id", application.id)
        .select()
        .single();

      if (error) throw error;
      newApp = data;
    }

    // Return the updated application with documents
    const updatedApp = await getLawyerApplication(lawyerId);
    return NextResponse.json({ application: updatedApp });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
