import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { computeRatingSummary } from "@/lib/data/lawyers";
import { MarketplaceLawyerCard } from "@/types";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Public read endpoint: guests and authenticated clients can browse directory
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Parse Query Parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const practiceArea = searchParams.get("practiceArea") || "all";
    const serviceId = searchParams.get("serviceId") || "all";
    const state = searchParams.get("state") || "all";
    const minExperience = parseInt(searchParams.get("minExperience") || "0");
    const maxExperience = parseInt(searchParams.get("maxExperience") || "40");
    const language = searchParams.get("language") || "all";
    const availability = searchParams.get("availability") || "all";
    const verifiedOnly = searchParams.get("verifiedOnly") === "true";
    const sort = searchParams.get("sort") || "recommended";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    // 3. Check Supabase configuration
    const isSupabaseConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    let lawyers: MarketplaceLawyerCard[] = [];
    let total = 0;

    if (isSupabaseConfigured) {
      let query = supabase.from("lawyer_marketplace_view")
        .select("*", { count: "exact" })
        .eq("is_verified", true)
        .eq("verification_status", "VERIFIED");
      
      // Apply filters
      if (state !== "all") query = query.eq("state", state);
      if (practiceArea !== "all") query = query.contains("practice_areas", [practiceArea]);
      if (serviceId !== "all") query = query.contains("service_ids", [serviceId]);
      if (minExperience > 0) query = query.gte("years_experience", minExperience);
      if (maxExperience < 40) query = query.lte("years_experience", maxExperience);
      if (language !== "all") query = query.contains("languages", [language]);
      // verifiedOnly is now implied, no need to add another filter
      
      if (availability === "today") {
         query = query.eq("availability", "Available today");
      } else if (availability === "this_week") {
         query = query.in("availability", ["Available today", "This week"]);
      }
      
      if (search) {
        let cleanSearch = search.trim();
        const lowerSearch = cleanSearch.toLowerCase();
        if (lowerSearch.startsWith("adv. ")) {
          cleanSearch = cleanSearch.substring(5).trim();
        } else if (lowerSearch.startsWith("adv ")) {
          cleanSearch = cleanSearch.substring(4).trim();
        }
        
        query = query.or(`name.ilike.%${cleanSearch}%,title.ilike.%${cleanSearch}%,headline.ilike.%${cleanSearch}%`);
      }
      
      // Apply sorting
      switch (sort) {
        case "highest_rated":
          query = query.order("computed_rating", { ascending: false, nullsFirst: false });
          break;
        case "most_experienced":
          query = query.order("years_experience", { ascending: false });
          break;
        case "available_now":
          query = query.order("availability", { ascending: true });
          break;
        case "recommended":
        default:
          query = query.order("is_verified", { ascending: false }).order("computed_rating", { ascending: false, nullsFirst: false });
          break;
      }
      
      // Pagination
      const start = (page - 1) * limit;
      query = query.range(start, start + limit - 1);
      
      const { data, count, error } = await query;
      
      if (error) {
        console.error("Supabase query error:", error);
        throw error;
      }

      total = count || 0;
      lawyers = (data || []).map((l: any) => ({
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
        languages: l.languages,
        practiceAreas: l.practice_areas,
        primaryServices: l.service_ids ? l.service_ids.slice(0, 3) : [],
        ratingSummary: computeRatingSummary(l.computed_rating, l.total_review_count, l.total_verified_review_count),
        tags: l.tags
      }));

    } else {
      // Platform requires Supabase
      console.warn("Supabase not configured. No mock data available.");
      lawyers = [];
      total = 0;
    }

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      lawyers,
      total,
      page,
      limit,
      totalPages
    });

  } catch (error: any) {
    console.error("Error in GET /api/lawyers:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
