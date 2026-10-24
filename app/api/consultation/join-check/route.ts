import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized session", code: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  try {
    const { matterId } = await req.json();
    if (!matterId) {
      return NextResponse.json(
        { error: "Missing matter ID", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    // Call RPC with ONLY matterId; user identity is derived strictly from verified auth.uid()
    const { data, error } = await supabase.rpc("record_consultation_join", {
      p_matter_id: matterId,
    });

    if (error) {
      console.error("[join-check] RPC execution failure:", error.message);
      return NextResponse.json(
        { error: "Database execution error: " + error.message, code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }

    if (!data || !data.success) {
      const code = data?.error_code || "INTERNAL_ERROR";
      const statusMap: Record<string, number> = {
        UNAUTHENTICATED: 401,
        UNAUTHORIZED: 403,
        INVALID_STATUS: 409,
        RESCHEDULE_PENDING: 409,
        TOO_EARLY: 425,
        WINDOW_CLOSED: 410,
        NOT_FOUND: 404,
        CONCURRENT_CONFLICT: 409,
      };

      return NextResponse.json(
        {
          error: data?.message || "Join validation failed",
          code,
          window_start: data?.window_start,
          window_end: data?.window_end,
          current_status: data?.current_status,
          server_time: data?.server_time,
        },
        { status: statusMap[code] || 500 }
      );
    }

    // Success: Return join authorization and metadata
    return NextResponse.json({
      success: true,
      userRole: data.user_role,
      clientId: data.client_id,
      lawyerId: data.lawyer_id,
      counterpartId: data.counterpart_id,
      appointmentDate: data.appointment_date,
      durationMinutes: data.duration_minutes,
      alreadyJoined: data.already_joined,
      windowStart: data.window_start,
      windowEnd: data.window_end,
      serverTime: data.server_time,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      { error: message, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
