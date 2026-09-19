import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getLawyersForMatching, getAllLawyers, computeRatingSummary } from "@/lib/data/lawyers";
import { MarketplaceLawyerCard } from "@/types";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authorization: API must be authenticated (Marketplace Phase 2 constraint)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    const cookieStore = await cookies();
    const hasDemoAuth = cookieStore.has("advocato_demo_auth");

    if ((authError || !user) && !hasDemoAuth) {
      return NextResponse.json(
        { error: "Unauthorized. The Advocato marketplace requires authentication." },
        { status: 401 }
      );
    }

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
      let query = supabase.from("lawyer_marketplace_view").select("*", { count: "exact" });
      
      // Apply filters
      if (state !== "all") query = query.eq("state", state);
      if (practiceArea !== "all") query = query.contains("practice_areas", [practiceArea]);
      if (serviceId !== "all") query = query.contains("service_ids", [serviceId]);
      if (minExperience > 0) query = query.gte("years_experience", minExperience);
      if (maxExperience < 40) query = query.lte("years_experience", maxExperience);
      if (language !== "all") query = query.contains("languages", [language]);
      if (verifiedOnly) query = query.eq("is_verified", true);
      
      if (availability === "today") {
         query = query.eq("availability", "Available today");
      } else if (availability === "this_week") {
         query = query.in("availability", ["Available today", "This week"]);
      }
      
      if (search) {
         query = query.or(`name.ilike.%${search}%,title.ilike.%${search}%,headline.ilike.%${search}%`);
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
      // Fallback
      const allMockLawyers = getAllLawyers();
      let filtered = allMockLawyers.map(l => ({
        id: l.id,
        name: l.name,
        title: l.title,
        headline: l.headline,
        avatar: l.avatar,
        isVerified: l.isVerified,
        verificationStatus: l.verificationStatus,
        availability: l.availability,
        acceptingClients: l.acceptingClients,
        yearsExperience: l.yearsExperience,
        jurisdiction: l.jurisdiction,
        state: l.state,
        languages: l.languages,
        practiceAreas: l.practiceAreas,
        primaryServices: l.serviceIds ? l.serviceIds.slice(0, 3) : [],
        ratingSummary: l.ratingSummary || computeRatingSummary(l.rating, l.reviewCount, l.verifiedReviewCount),
        tags: l.tags
      })).filter(l => {
        if (state !== "all" && l.state !== state) return false;
        if (practiceArea !== "all" && !l.practiceAreas.includes(practiceArea)) return false;
        if (serviceId !== "all" && !l.primaryServices.includes(serviceId)) return false;
        if (l.yearsExperience < minExperience || l.yearsExperience > maxExperience) return false;
        if (language !== "all" && (!l.languages || !l.languages.includes(language))) return false;
        if (verifiedOnly && !l.isVerified) return false;
        if (availability === "today" && l.availability !== "Available today") return false;
        if (availability === "this_week" && l.availability !== "Available today" && l.availability !== "This week") return false;
        if (search) {
          const s = search.toLowerCase();
          const searchableText = `${l.name} ${l.title} ${l.headline || ""} ${l.tags.join(" ")}`.toLowerCase();
          if (!searchableText.includes(s)) return false;
        }
        return true;
      });

      switch (sort) {
        case "highest_rated":
          filtered.sort((a, b) => (b.ratingSummary.averageRating || 0) - (a.ratingSummary.averageRating || 0));
          break;
        case "most_experienced":
          filtered.sort((a, b) => b.yearsExperience - a.yearsExperience);
          break;
        case "available_now":
          filtered.sort((a, b) => {
            if (a.availability === "Available today" && b.availability !== "Available today") return -1;
            if (b.availability === "Available today" && a.availability !== "Available today") return 1;
            return 0;
          });
          break;
        case "recommended":
        default:
          filtered.sort((a, b) => {
            const scoreA = (a.isVerified ? 10 : 0) + (a.ratingSummary.averageRating || 0);
            const scoreB = (b.isVerified ? 10 : 0) + (b.ratingSummary.averageRating || 0);
            return scoreB - scoreA;
          });
          break;
      }

      total = filtered.length;
      const start = (page - 1) * limit;
      lawyers = filtered.slice(start, start + limit);
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
