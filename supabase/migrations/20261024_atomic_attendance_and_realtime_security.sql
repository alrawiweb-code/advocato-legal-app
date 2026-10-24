-- Migration: 20261024_atomic_attendance_and_realtime_security.sql
-- Implements Phase 4: Atomic Attendance Operation & Realtime Security Architecture

-- 1. Database-side Atomic Function: record_consultation_join
-- Security: Takes ONLY p_matter_id. Derives identity strictly from auth.uid().
CREATE OR REPLACE FUNCTION public.record_consultation_join(
  p_matter_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_matter RECORD;
  v_is_client BOOLEAN;
  v_is_lawyer BOOLEAN;
  v_now TIMESTAMPTZ := NOW();
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
  v_rows_updated INT;
BEGIN
  -- 1. Derive caller identity strictly from verified authentication context
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error_code', 'UNAUTHENTICATED', 
      'message', 'A valid authenticated session is required to join a consultation.'
    );
  END IF;

  -- 2. Read matter row with row-level lock (FOR UPDATE) to serialize concurrent joins
  SELECT 
    id, client_id, lawyer_id, status, appointment_date, 
    duration_minutes, client_joined_at, lawyer_joined_at, reschedule_status
  INTO v_matter
  FROM public.matters
  WHERE id = p_matter_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'NOT_FOUND', 'message', 'Consultation record not found.');
  END IF;

  -- 3. Strict participant check against verified auth.uid() (Fail-closed authorization)
  v_is_client := (v_matter.client_id = v_caller_id);
  v_is_lawyer := (v_matter.lawyer_id = v_caller_id);

  IF NOT (v_is_client OR v_is_lawyer) THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'UNAUTHORIZED', 'message', 'Caller is not an assigned participant in this consultation.');
  END IF;

  -- 4. Reschedule status check: Suspend entry while reschedule proposal is pending
  IF v_matter.reschedule_status IN ('pending_client', 'pending_lawyer') THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'RESCHEDULE_PENDING', 'message', 'Consultation reschedule proposal is pending confirmation.');
  END IF;

  -- 5. Booking status validation: Confirmed or In-Progress only
  IF v_matter.status NOT IN ('confirmed', 'in_progress') THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error_code', 'INVALID_STATUS', 
      'message', 'Consultation is not in an active or confirmed state.',
      'current_status', v_matter.status
    );
  END IF;

  -- 6. Permitted time window validation
  v_window_start := v_matter.appointment_date - INTERVAL '5 minutes';
  v_window_end := v_matter.appointment_date + COALESCE(v_matter.duration_minutes, 45) * INTERVAL '1 minute' + INTERVAL '15 minutes';

  IF v_now < v_window_start THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error_code', 'TOO_EARLY', 
      'message', 'Meeting opens 5 minutes before scheduled start.',
      'window_start', v_window_start,
      'window_end', v_window_end,
      'server_time', v_now
    );
  END IF;

  IF v_now > v_window_end THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error_code', 'WINDOW_CLOSED', 
      'message', 'The 15-minute late joining window for this consultation has closed.',
      'window_start', v_window_start,
      'window_end', v_window_end,
      'server_time', v_now
    );
  END IF;

  -- 7. Atomic Attendance Recording:
  -- Preserves existing first join timestamps using COALESCE; does NOT overwrite on rejoin/refresh
  UPDATE public.matters
  SET 
    client_joined_at = CASE WHEN v_is_client THEN COALESCE(client_joined_at, v_now) ELSE client_joined_at END,
    lawyer_joined_at = CASE WHEN v_is_lawyer THEN COALESCE(lawyer_joined_at, v_now) ELSE lawyer_joined_at END,
    status = 'in_progress',
    updated_at = v_now
  WHERE id = p_matter_id
    AND status IN ('confirmed', 'in_progress');

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    RETURN jsonb_build_object('success', false, 'error_code', 'CONCURRENT_CONFLICT', 'message', 'Consultation status changed concurrently.');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user_role', CASE WHEN v_is_client THEN 'client' ELSE 'lawyer' END,
    'appointment_date', v_matter.appointment_date,
    'duration_minutes', COALESCE(v_matter.duration_minutes, 45),
    'already_joined', CASE WHEN v_is_client THEN (v_matter.client_joined_at IS NOT NULL) ELSE (v_matter.lawyer_joined_at IS NOT NULL) END,
    'window_start', v_window_start,
    'window_end', v_window_end,
    'server_time', v_now
  );
END;
$$;

-- Least-Privilege Grants
REVOKE ALL ON FUNCTION public.record_consultation_join(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_consultation_join(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.record_consultation_join(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_consultation_join(UUID) TO service_role;

-- 2. Database-Backed Ephemeral Signaling Table (Option B)
CREATE TABLE IF NOT EXISTS public.consultation_signaling (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID NOT NULL REFERENCES public.matters(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('peer-joined', 'peer-ready', 'sdp-offer', 'sdp-answer', 'ice-candidate', 'peer-left')),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signaling_matter_recipient 
  ON public.consultation_signaling(matter_id, recipient_id, created_at);

ALTER TABLE public.consultation_signaling ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'consultation_signaling'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_signaling;
  END IF;
END $$;

-- Policy 1: RECEIVE — A participant may only read messages addressed specifically to them.
CREATE POLICY "Signaling receive: recipient only" ON public.consultation_signaling
  FOR SELECT TO authenticated
  USING (
    recipient_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.matters m
      WHERE m.id = consultation_signaling.matter_id
        AND (m.client_id = auth.uid() OR m.lawyer_id = auth.uid())
        AND m.status IN ('confirmed', 'in_progress')
    )
  );

-- Policy 2: SEND — Sender must be authenticated caller; recipient must be the OTHER assigned participant.
CREATE POLICY "Signaling send: participant to counter-party" ON public.consultation_signaling
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_id <> recipient_id
    AND EXISTS (
      SELECT 1 FROM public.matters m
      WHERE m.id = consultation_signaling.matter_id
        AND (m.client_id = auth.uid() OR m.lawyer_id = auth.uid())
        AND (
          (m.client_id = auth.uid() AND m.lawyer_id = consultation_signaling.recipient_id)
          OR
          (m.lawyer_id = auth.uid() AND m.client_id = consultation_signaling.recipient_id)
        )
        AND m.status IN ('confirmed', 'in_progress')
    )
  );

-- Policy 3: Service role full access
CREATE POLICY "Signaling service role full access" ON public.consultation_signaling
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
