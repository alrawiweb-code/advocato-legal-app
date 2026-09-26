import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { PRACTICE_AREAS } from "@/lib/data/practice-areas";

export async function GET() {
  try {
    const supabase = await createClient();

    // Public read endpoint: guests and authenticated clients can browse taxonomy
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Fetch Practice Areas Taxonomy from Supabase
    const { data: categories, error: catError } = await supabase
      .from("practice_area_categories")
      .select("*")
      .order("name");
      
    if (catError) throw catError;

    const { data: services, error: servError } = await supabase
      .from("legal_services")
      .select("*")
      .order("name");

    if (servError) throw servError;

    // Group services into categories to match PracticeArea[] type
    const practiceAreas = categories.map((cat: any) => {
      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        description: cat.description,
        services: services
          .filter((s: any) => s.practice_area_id === cat.id)
          .map((s: any) => ({
            id: s.id,
            name: s.name,
            practiceAreaId: s.practice_area_id,
          })),
      };
    });

    return NextResponse.json(practiceAreas);

  } catch (error: any) {
    console.error("Error in GET /api/practice-areas:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
