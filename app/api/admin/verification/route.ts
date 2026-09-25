import { NextRequest, NextResponse } from "next/server";
import { getAdminApplications } from "@/lib/supabase/verification";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filterStatus = searchParams.get("status") || "ALL";

  // Authorize: Ensure caller is an admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  if (user.email?.toLowerCase() !== "alrawiweb@gmail.com") {
    // Also check profiles.role if we want generic admins
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const applications = await getAdminApplications(filterStatus);
  return NextResponse.json({ applications });
}
