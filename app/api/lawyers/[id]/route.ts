import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLawyerById, computeRatingSummary } from "@/lib/data/lawyers";
import { getServicesForPracticeArea } from "@/lib/data/practice-areas";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // 1. Authorization: API must be authenticated (Marketplace Phase 2 constraint)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. The Advocato marketplace requires authentication." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ error: "Lawyer ID is required" }, { status: 400 });
    }

    const isSupabaseConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    if (isSupabaseConfigured) {
      const { data: l, error } = await supabase
        .from("lawyer_marketplace_view")
        .select("*")
        .eq("id", id)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json({ error: "Lawyer not found" }, { status: 404 });
        }
        console.error("Supabase query error:", error);
        throw error;
      }

      // Fetch actual services if we have service_ids
      let populatedServices: any[] = [];
      if (l.service_ids && l.service_ids.length > 0) {
        const { data: servicesData } = await supabase
          .from("legal_services")
          .select("id, name, practice_area_id")
          .in("id", l.service_ids);
          
        if (servicesData) {
          populatedServices = servicesData.map((s: any) => ({
            id: s.id,
            name: s.name,
            practiceAreaId: s.practice_area_id
          }));
        }
      }

      const fullProfile = {
        id: l.id,
        name: l.name,
        title: l.title,
        headline: l.headline,
        avatar: l.avatar,
        isVerified: l.is_verified,
        verificationStatus: l.verification_status,
        availability: l.availability,
        acceptingClients: l.accepting_clients,
        yearsExperience: l.years_experience,
        jurisdiction: l.jurisdiction,
        state: l.state,
        city: l.city,
        hourlyRate: l.hourly_rate,
        languages: l.languages,
        practiceAreas: l.practice_areas,
        serviceIds: l.service_ids,
        services: populatedServices,
        ratingSummary: computeRatingSummary(l.computed_rating, l.total_review_count, l.total_verified_review_count),
        tags: l.tags,
        bio: l.bio,
        notableCases: l.notable_cases,
        createdAt: l.created_at
      };
      
      return NextResponse.json(fullProfile);
    } else {
      // Fallback to mock data
      const lawyer = getLawyerById(id);
      if (!lawyer) {
        return NextResponse.json({ error: "Lawyer not found" }, { status: 404 });
      }

      let populatedServices = lawyer.services || [];
      if (populatedServices.length === 0 && lawyer.serviceIds) {
         const taxonomyServices = lawyer.practiceAreas.flatMap(paName => {
           const paId = paName.toLowerCase().split(' ')[0];
           return getServicesForPracticeArea(paId);
         });
         
         if (taxonomyServices.length > 0) {
             populatedServices = taxonomyServices.filter(s => lawyer.serviceIds?.includes(s.id));
         }
      }

      const fullProfile = {
        ...lawyer,
        services: populatedServices,
        ratingSummary: lawyer.ratingSummary || computeRatingSummary(lawyer.rating, lawyer.reviewCount, lawyer.verifiedReviewCount)
      };

      return NextResponse.json(fullProfile);
    }

  } catch (error: any) {
    console.error(`Error in GET /api/lawyers/[id]:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
