import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { computeRatingSummary } from "@/lib/data/lawyers";
import { getServicesForPracticeArea } from "@/lib/data/practice-areas";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ error: "Lawyer ID is required" }, { status: 400 });
    }

    // 1. Session check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError && authError.name !== "AuthSessionMissingError") {
      console.error("Auth session lookup error:", authError);
      return NextResponse.json({ error: "Authentication service error" }, { status: 500 });
    }
    const isAuthenticated = Boolean(user);

    const isSupabaseConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    if (isSupabaseConfigured) {
      const { data: l, error } = await supabase
        .from("lawyer_marketplace_view")
        .select("*")
        .eq("id", id)
        .single();
        
      if (error || !l) {
        return NextResponse.json({ error: "Lawyer not found" }, { status: 404 });
      }

      // Check public marketplace eligibility
      const isEligible = Boolean(l.is_verified && l.verification_status === "VERIFIED" && l.hourly_rate && l.hourly_rate > 0);

      // Determine caller's authoritative role (fail-closed, zero hardcoded email)
      let callerRole: string | null = null;
      if (isAuthenticated && user) {
        const { data: callerProfile, error: profileErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileErr) {
          console.error("Authoritative role lookup error:", profileErr);
          return NextResponse.json({ error: "Failed to resolve user authorization role" }, { status: 500 });
        }
        if (callerProfile) {
          callerRole = callerProfile.role;
        }
      }

      const isAdmin = callerRole === "admin";
      const isOwnProfile = isAuthenticated && user?.id === id && callerRole === "lawyer";

      // If lawyer is not eligible for public discovery:
      if (!isEligible) {
        // Unauthenticated callers and ordinary clients receive 404 (strictly preserving privacy)
        if (!isAuthenticated || !user || (!isAdmin && !isOwnProfile)) {
          return NextResponse.json({ error: "Lawyer not found" }, { status: 404 });
        }
      } else {
        // If lawyer is eligible, require authentication for marketplace browsing per platform rule
        if (!isAuthenticated || !user) {
          return NextResponse.json(
            { error: "Unauthorized. The Advocato marketplace requires authentication." },
            { status: 401 }
          );
        }
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

      // Base professional profile fields
      const baseProfile = {
        id: l.id,
        name: l.name,
        title: l.title || "Advocate",
        headline: l.headline || "",
        avatar: l.avatar,
        jurisdiction: l.jurisdiction || l.state || "Delhi (DL)",
        state: l.state,
        city: l.city,
        yearsExperience: l.years_experience || 1,
        hourlyRate: l.hourly_rate,
        languages: l.languages || [],
        practiceAreas: l.practice_areas || [],
        serviceIds: l.service_ids || [],
        services: populatedServices,
        ratingSummary: computeRatingSummary(l.computed_rating, l.total_review_count, l.total_verified_review_count),
        tags: l.tags || [],
        bio: l.bio || "",
        notableCases: l.notable_cases || [],
        isVerified: Boolean(l.is_verified),
        verificationStatus: l.verification_status,
        acceptingClients: Boolean(l.accepting_clients),
        availability: l.availability || "Available today",
        createdAt: l.created_at,
      };

      // Fetch restricted credentials (bar number, suspension details) from lawyer_profiles for authorized viewers only
      let barNumber = "Not set";
      let suspensionReason: string | null = null;
      let suspendedAt: string | null = null;

      if (isAdmin || isOwnProfile) {
        const { data: lpDetails } = await supabase
          .from("lawyer_profiles")
          .select("bar_number, suspension_reason, suspended_at")
          .eq("id", id)
          .single();

        if (lpDetails) {
          barNumber = lpDetails.bar_number || "Not set";
          suspensionReason = lpDetails.suspension_reason || null;
          suspendedAt = lpDetails.suspended_at || null;
        }
      }

      if (isAdmin) {
        // Explicit query for latest admissions verification application using authoritative admin client
        const adminClient = process.env.SUPABASE_SERVICE_ROLE_KEY
          ? createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY)
          : supabase;

        const { data: latestApp, error: appErr } = await adminClient
          .from("lawyer_verification_applications")
          .select("id, status, rejection_reason")
          .eq("lawyer_id", id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (appErr) {
          console.error("Admissions registry lookup error:", appErr);
          return NextResponse.json(
            { error: "Failed to resolve admissions application registry" },
            { status: 500 }
          );
        }

        const applicationId = latestApp ? latestApp.id : null;
        const applicationStatus = latestApp ? latestApp.status : null;
        const rejectionReason = latestApp ? latestApp.rejection_reason : null;

        // Administrator inspection: expose status metadata, bar number, application metadata, and inspection flag
        return NextResponse.json({
          ...baseProfile,
          barNumber,
          suspensionReason,
          suspendedAt,
          applicationId,
          applicationStatus,
          rejectionReason,
          isAdminInspection: true,
          isOwnProfile: false,
        });
      }

      if (isOwnProfile) {
        // Own profile view: strictly expose editing fields; omit administrative flags
        return NextResponse.json({
          ...baseProfile,
          barNumber,
          isOwnProfile: true,
          isAdminInspection: false,
        });
      }

      // Public eligible view for clients
      return NextResponse.json({
        ...baseProfile,
        isOwnProfile: false,
        isAdminInspection: false,
      });
    } else {
      // Platform requires Supabase
      console.warn("Supabase not configured. No mock data available.");
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
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

    // Strict ownership check: lawyers can only edit their own profile
    if (user.id !== id) {
      return NextResponse.json({ error: "Forbidden: You cannot edit another lawyer's profile." }, { status: 403 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string | null;
    const title = formData.get("title") as string | null;
    const headline = formData.get("headline") as string | null;
    const jurisdiction = formData.get("jurisdiction") as string | null;
    const bio = formData.get("bio") as string | null;
    const avatarFile = formData.get("avatar") as File | null;
    const removeAvatar = formData.get("removeAvatar") === "true";

    // Parse and validate years of experience
    const yearsExperienceRaw = formData.get("yearsExperience");
    let yearsExperience: number | undefined = undefined;
    if (yearsExperienceRaw !== null && yearsExperienceRaw !== "") {
      const parsed = parseInt(yearsExperienceRaw as string, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 65) {
        yearsExperience = parsed;
      }
    }

    let avatarUrl: string | null | undefined = undefined;

    if (removeAvatar) {
      avatarUrl = null;
    } else if (avatarFile && avatarFile.size > 0) {
      // Validate file size (max 5 MB) and MIME types
      if (avatarFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "Avatar file size must be less than 5MB." }, { status: 400 });
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(avatarFile.type)) {
        return NextResponse.json({ error: "Invalid image format. Allowed formats: JPEG, PNG, WebP." }, { status: 400 });
      }

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

    // Update profiles table (personal credentials)
    const profileUpdates: any = {};
    if (name) profileUpdates.full_name = name.trim();
    if (avatarUrl !== undefined) profileUpdates.avatar_url = avatarUrl;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileErr } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", id);
      if (profileErr) {
        console.error("Profile table update error:", profileErr);
        return NextResponse.json({ error: "Failed to update profile identity." }, { status: 500 });
      }
    }

    // Update lawyer_profiles table (permitted professional credentials only)
    // Strictly whitelisted: hourly_rate, is_verified, and verification_status are excluded.
    const lawyerUpdates: any = {};
    if (title !== null) lawyerUpdates.title = title.trim();
    if (headline !== null) lawyerUpdates.headline = headline.trim();
    if (jurisdiction !== null) lawyerUpdates.jurisdiction = jurisdiction.trim();
    if (bio !== null) lawyerUpdates.bio = bio.trim();
    if (yearsExperience !== undefined) lawyerUpdates.years_experience = yearsExperience;

    if (Object.keys(lawyerUpdates).length > 0) {
      const { error: lawyerErr } = await supabase
        .from("lawyer_profiles")
        .update(lawyerUpdates)
        .eq("id", id);
      if (lawyerErr) {
        console.error("Lawyer profile table update error:", lawyerErr);
        return NextResponse.json({ error: "Failed to update lawyer profile." }, { status: 500 });
      }
    }

    // Reflect changes to years of experience consistently in pending verification applications
    if (yearsExperience !== undefined) {
      await supabase
        .from("lawyer_verification_applications")
        .update({ years_experience: yearsExperience })
        .eq("lawyer_id", id)
        .in("status", ["PENDING", "SUBMITTED", "UNDER_REVIEW"]);
    }

    return NextResponse.json({
      success: true,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
      yearsExperience,
      name,
      title,
      headline,
      jurisdiction,
      bio,
    });
  } catch (error: any) {
    console.error("Error in PATCH /api/lawyers/[id]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
