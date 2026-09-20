import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { LawyerReview } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // 1. Authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. The Advocato marketplace requires authentication." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { id: lawyerId } = resolvedParams;

    if (!lawyerId) {
      return NextResponse.json({ error: "Lawyer ID is required" }, { status: 400 });
    }

    // PHASE 3 TODO: Query actual reviews from `lawyer_reviews` table.
    // For Phase 2 UI development, we return some mock reviews if the lawyer has a review count > 0.
    
    const isSupabaseConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("lawyer_reviews")
        .select(`
          id,
          lawyer_id,
          reviewer_name,
          rating,
          review_text,
          verification_status,
          created_at
        `)
        .eq("lawyer_id", lawyerId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase query error:", error);
        throw error;
      }
      
      const mappedReviews = (data || []).map((r: any) => ({
        id: r.id,
        lawyerId: r.lawyer_id,
        reviewerName: r.reviewer_name,
        rating: r.rating,
        reviewText: r.review_text,
        verificationStatus: r.verification_status,
        createdAt: r.created_at
      }));

      return NextResponse.json({ reviews: mappedReviews });
    } else {
      const mockReviews: LawyerReview[] = [
        {
          id: "rev-1",
          lawyerId,
          reviewerName: "Priya S.",
          rating: 5,
          reviewText: "Exceptional representation during a very difficult time. Clear communication and strategic approach.",
          verificationStatus: "VERIFIED",
          createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        },
        {
          id: "rev-2",
          lawyerId,
          reviewerName: "Arun K.",
          rating: 4,
          reviewText: "Very knowledgeable and responsive. Only docking a star because scheduling was occasionally tricky.",
          verificationStatus: "VERIFIED",
          createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
        },
        {
          id: "rev-3",
          lawyerId,
          reviewerName: "Corporate Client",
          rating: 5,
          reviewText: "Resolved our commercial dispute effectively. Highly recommended for complex negotiations.",
          verificationStatus: "UNVERIFIED",
          createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
        }
      ];

      // Simulate empty state for lawyers we know have 0 reviews (e.g. ID "10")
      if (lawyerId === "10" || lawyerId.startsWith("lawyer-")) {
        return NextResponse.json({ reviews: [] });
      }

      return NextResponse.json({ reviews: mockReviews });
    }

  } catch (error: any) {
    console.error(`Error in GET /api/lawyers/[id]/reviews:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // 1. Authorization Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Must be logged in to leave a review." },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { id: lawyerId } = resolvedParams;
    const body = await request.json();
    const { rating, reviewText, matterId } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    // PHASE 3 TODO: Insert into `lawyer_reviews` table.
    // Must verify that this client actually worked with this lawyer on this matter.
    // For Phase 2, we simulate success.

    const isSupabaseConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("lawyer_reviews")
        .insert({
          lawyer_id: lawyerId,
          reviewer_id: user?.id || "demo-client-id",
          matter_id: matterId || null,
          reviewer_name: user?.user_metadata?.full_name || "Client",
          rating,
          review_text: reviewText,
          verification_status: matterId ? "VERIFIED" : "UNVERIFIED"
        })
        .select()
        .single();
        
      if (error) {
        if (error.code === '23505') { // Unique constraint violation (one review per matter)
          return NextResponse.json({ error: "You have already reviewed this lawyer for this matter." }, { status: 400 });
        }
        console.error("Supabase insert error:", error);
        throw error;
      }
      
      const newReview: LawyerReview = {
        id: data.id,
        lawyerId: data.lawyer_id,
        reviewerId: data.reviewer_id,
        reviewerName: data.reviewer_name,
        matterId: data.matter_id,
        rating: data.rating,
        reviewText: data.review_text,
        verificationStatus: data.verification_status,
        createdAt: data.created_at
      };
      
      return NextResponse.json(newReview, { status: 201 });
    } else {
      const newReview: LawyerReview = {
        id: `rev-${Date.now()}`,
        lawyerId,
        reviewerId: user?.id || "demo-client-id",
        reviewerName: user?.user_metadata?.full_name || "Client",
        matterId,
        rating,
        reviewText,
        verificationStatus: matterId ? "VERIFIED" : "UNVERIFIED",
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json(newReview, { status: 201 });
    }

  } catch (error: any) {
    console.error(`Error in POST /api/lawyers/[id]/reviews:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
