import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getLawyerById, computeRatingSummary } from "@/lib/data/lawyers";
import { getServicesForPracticeArea } from "@/lib/data/practice-areas";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // 1. Authorization: API must be authenticated
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

      // Suspended lawyers are not publicly accessible
      if (l.verification_status === "SUSPENDED" || !l.is_verified) {
        return NextResponse.json(
          { error: "This lawyer profile is not currently available." },
          { status: 404 }
        );
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string | null;
    const title = formData.get("title") as string | null;
    const headline = formData.get("headline") as string | null;
    const hourlyRate = formData.get("hourlyRate") as string | null;
    const jurisdiction = formData.get("jurisdiction") as string | null;
    const bio = formData.get("bio") as string | null;
    const avatarFile = formData.get("avatar") as File | null;

    let avatarUrl = undefined;

    if (avatarFile && avatarFile.size > 0) {
      const sanitizedName = avatarFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${id}/${Date.now()}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(storagePath, avatarFile, { upsert: true, contentType: avatarFile.type });

      if (uploadError) {
        console.error("Avatar upload error:", uploadError);
        return NextResponse.json({ error: "Failed to upload avatar" }, { status: 500 });
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(storagePath);
        
      avatarUrl = publicUrlData.publicUrl;
    }

    // Update profiles table
    if (name || avatarUrl) {
      const updates: any = {};
      if (name) updates.full_name = name;
      if (avatarUrl) updates.avatar_url = avatarUrl;
      
      await supabase.from("profiles").update(updates).eq("id", id);
    }

    // Update lawyer_profiles table
    const lawyerUpdates: any = {};
    if (title !== null) lawyerUpdates.title = title;
    if (headline !== null) lawyerUpdates.headline = headline;
    if (hourlyRate !== null) lawyerUpdates.hourly_rate = Number(hourlyRate);
    if (jurisdiction !== null) lawyerUpdates.jurisdiction = jurisdiction;
    if (bio !== null) lawyerUpdates.bio = bio;

    if (Object.keys(lawyerUpdates).length > 0) {
      await supabase.from("lawyer_profiles").update(lawyerUpdates).eq("id", id);
    }

    return NextResponse.json({ success: true, avatarUrl });
  } catch (error: any) {
    console.error("Error in PATCH /api/lawyers/[id]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
