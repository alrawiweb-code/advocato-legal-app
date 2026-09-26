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
  };
}

export async function createOrGetMatter(options: CreateMatterOptions): Promise<{ matter: MatterRecord | null; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { matter: null, error: "Must be logged in to create or view a matter." };
  }

  try {
    // Check if an active matter already exists between this client and lawyer
    const { data: existing, error: searchError } = await supabase
      .from("matters")
      .select(`
        *,
        client:profiles!matters_client_id_fkey(id, full_name, email, avatar_url),
        lawyer:profiles!matters_lawyer_id_fkey(id, full_name, email, avatar_url)
      `)
      .eq("client_id", user.id)
      .eq("lawyer_id", options.lawyerId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!searchError && existing && existing.length > 0) {
      return { matter: existing[0] as MatterRecord };
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
        status: options.appointmentDate ? "scheduled" : "active",
        appointment_date: options.appointmentDate || null,
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
        lawyer:profiles!matters_lawyer_id_fkey(id, full_name, email, avatar_url)
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
