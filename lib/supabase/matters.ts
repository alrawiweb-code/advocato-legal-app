import { createClient } from "@/lib/supabase/client";

export interface CreateMatterOptions {
  lawyerId: string;
  caseTitle?: string;
  category?: string;
  jurisdiction?: string;
  urgency?: "High" | "Medium" | "Low";
  appointmentDate?: string;
  consultationType?: "video" | "phone";
}

export interface MatterRecord {
  id: string;
  matter_number: string;
  client_id: string;
  lawyer_id: string;
  case_title: string;
  category: string;
  jurisdiction: string;
  urgency: string;
  status: string;
  created_at: string;
  updated_at: string;
  appointment_date?: string | null;
  consultation_type?: string | null;
  duration_minutes?: number;
  client_joined_at?: string | null;
  lawyer_joined_at?: string | null;
  decline_reason?: string | null;
  proposed_reschedule_date?: string | null;
  reschedule_requested_by?: string | null;
  reschedule_status?: "none" | "pending_client" | "pending_lawyer" | "accepted" | "rejected" | "expired";
  reschedule_reason?: string | null;
  original_appointment_date?: string | null;
  client?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
  lawyer?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    lawyer_profiles?: {
      hourly_rate?: number | null;
      years_experience?: number;
      bio?: string;
      title?: string;
      rating?: number;
      review_count?: number;
    } | {
      hourly_rate?: number | null;
      years_experience?: number;
      bio?: string;
      title?: string;
      rating?: number;
      review_count?: number;
    }[];
  };
  intake_assessments?: {
    summary?: string;
    extracted_key_points?: any;
  }[] | {
    summary?: string;
    extracted_key_points?: any;
  };
}

export async function createOrGetMatter(options: CreateMatterOptions): Promise<{ matter: MatterRecord | null; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { matter: null, error: "Must be logged in to create or view a matter." };
  }

  try {
    // If NO appointmentDate is requested (e.g. general discussion or case inquiry),
    // check if an active (non-terminal) matter already exists between this client and lawyer
    if (!options.appointmentDate) {
      const { data: existing, error: searchError } = await supabase
        .from("matters")
        .select(`
          *,
          client:profiles!matters_client_id_fkey(id, full_name, email, avatar_url),
          lawyer:profiles!matters_lawyer_id_fkey(id, full_name, email, avatar_url)
        `)
        .eq("client_id", user.id)
        .eq("lawyer_id", options.lawyerId)
        .not("status", "in", '("completed","cancelled","missed","declined","closed")')
        .order("created_at", { ascending: false })
        .limit(1);

      if (!searchError && existing && existing.length > 0) {
        return { matter: existing[0] as MatterRecord };
      }
    }

    // Verify lawyer eligibility before creating a new consultation
    const { data: lawyerProfile, error: lawyerErr } = await supabase
      .from("lawyer_profiles")
      .select("is_verified, verification_status, hourly_rate")
      .eq("id", options.lawyerId)
      .single();

    if (
      lawyerErr ||
      !lawyerProfile ||
      !lawyerProfile.is_verified ||
      lawyerProfile.verification_status !== "VERIFIED" ||
      !lawyerProfile.hourly_rate ||
      lawyerProfile.hourly_rate <= 0
    ) {
      return { matter: null, error: "This lawyer is not eligible for new consultations." };
    }

    // Generate unique matter number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    const matterNumber = `MAT-${timestamp}-${random}`;

    const title = options.caseTitle || "Legal Consultation Matter";
    const category = options.category || "General Legal Counsel";
    const jurisdiction = options.jurisdiction || "Delhi (DL)";
    const urgency = options.urgency || "Medium";

    const { data: created, error: insertError } = await supabase
      .from("matters")
      .insert({
        matter_number: matterNumber,
        client_id: user.id,
        lawyer_id: options.lawyerId,
        case_title: title,
        category: category,
        jurisdiction: jurisdiction,
        urgency: urgency,
        status: options.appointmentDate ? "pending" : "active",
        appointment_date: options.appointmentDate || null,
        duration_minutes: 45,
        reschedule_status: "none",
        consultation_type: options.consultationType || "video",
      })
      .select(`
        *,
        client:profiles!matters_client_id_fkey(id, full_name, email, avatar_url),
        lawyer:profiles!matters_lawyer_id_fkey(id, full_name, email, avatar_url)
      `)
      .single();

    if (insertError) {
      return { matter: null, error: insertError.message };
    }

    // Insert initial request/system message if booking an appointment
    if (options.appointmentDate && created) {
      try {
        const formattedDate = new Date(options.appointmentDate).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        });
        const typeLabel = options.consultationType === "phone" ? "Phone" : "Video";
        await supabase.from("messages").insert({
          matter_id: created.id,
          sender_id: user.id,
          sender_role: "client",
          text: `Consultation requested for ${formattedDate} via ${typeLabel}. Status: Pending Advocate Confirmation.`,
        });
      } catch (msgErr) {
        console.warn("Could not insert initial booking message:", msgErr);
      }
    }

    return { matter: created as MatterRecord };
  } catch (err: any) {
    return { matter: null, error: err.message || "Failed to create matter." };
  }
}

export async function saveIntakeAssessment(assessment: {
  rawText: string;
  category: string;
  subCategory?: string;
  jurisdiction: string;
  urgency: "High" | "Medium" | "Low";
  summary: string;
  extractedKeyPoints?: string[];
  matchedLawyers?: any[];
  caseTitle?: string;
  matterId?: string;
}): Promise<{ id: string | null; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { id: null, error: "Must be authenticated to save intake assessment." };
  }

  try {
    const { data, error } = await supabase
      .from("intake_assessments")
      .insert({
        client_id: user.id,
        matter_id: assessment.matterId || null,
        case_title: assessment.caseTitle || "Legal Assessment",
        raw_text: assessment.rawText,
        category: assessment.category,
        sub_category: assessment.subCategory || assessment.category,
        jurisdiction: assessment.jurisdiction,
        urgency: assessment.urgency,
        summary: assessment.summary,
        extracted_key_points: assessment.extractedKeyPoints || [],
        matched_lawyers: assessment.matchedLawyers || [],
        source: "openrouter",
      })
      .select("id")
      .single();

    if (error) {
      return { id: null, error: error.message };
    }

    return { id: data.id };
  } catch (err: any) {
    return { id: null, error: err.message || "Failed to save assessment" };
  }
}

export async function getUserMatters(): Promise<{ matters: MatterRecord[]; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { matters: [], error: "Unauthenticated" };
  }

  try {
    const { data, error } = await supabase
      .from("matters")
      .select(`
        *,
        client:profiles!matters_client_id_fkey(id, full_name, email, avatar_url),
        lawyer:profiles!matters_lawyer_id_fkey(
          id, full_name, email, avatar_url,
          lawyer_profiles(hourly_rate, years_experience, bio, title, rating, review_count)
        ),
        intake_assessments(summary, extracted_key_points)
      `)
      .or(`client_id.eq.${user.id},lawyer_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (error) {
      return { matters: [], error: error.message };
    }

    return { matters: (data || []) as MatterRecord[] };
  } catch (err: any) {
    return { matters: [], error: err.message || "Failed to load matters" };
  }
}
