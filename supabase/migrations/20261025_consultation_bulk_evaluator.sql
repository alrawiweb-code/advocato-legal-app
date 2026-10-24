-- Migration: 20261025_consultation_bulk_evaluator.sql
-- Implements Phase 6: Idempotent Attendance Evaluation & Outcome Resolution

CREATE OR REPLACE FUNCTION public.evaluate_consultation_outcomes(
  p_batch_size INT DEFAULT 100
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_missed_count INT := 0;
  v_completed_count INT := 0;
BEGIN
  -- Input validation: Reject invalid batch sizes before touching data
  IF p_batch_size IS NULL OR p_batch_size < 1 OR p_batch_size > 1000 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'INVALID_BATCH_SIZE',
      'message', 'p_batch_size must be an integer between 1 and 1000.',
      'received', p_batch_size
    );
  END IF;

  -- Operation 1: Classify unjoined consultations as MISSED
  WITH eligible_missed AS (
    SELECT id
    FROM public.matters
    WHERE status = 'confirmed'
      AND reschedule_status = 'none'
      AND client_joined_at IS NULL
      AND lawyer_joined_at IS NULL
      AND appointment_date IS NOT NULL
      AND v_now > (appointment_date + COALESCE(duration_minutes, 45) * INTERVAL '1 minute' + INTERVAL '15 minutes')
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  ),
  updated_missed AS (
    UPDATE public.matters m
    SET 
      status = 'missed',
      updated_at = v_now
    FROM eligible_missed em
    WHERE m.id = em.id
    RETURNING m.id
  )
  SELECT COUNT(*) INTO v_missed_count FROM updated_missed;

  -- Operation 2: Mark attended consultations as COMPLETED
  WITH eligible_completed AS (
    SELECT id
    FROM public.matters
    WHERE status = 'in_progress'
      AND reschedule_status = 'none'
      AND (client_joined_at IS NOT NULL OR lawyer_joined_at IS NOT NULL)
      AND appointment_date IS NOT NULL
      AND v_now > (appointment_date + COALESCE(duration_minutes, 45) * INTERVAL '1 minute' + INTERVAL '15 minutes')
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  ),
  updated_completed AS (
    UPDATE public.matters m
    SET 
      status = 'completed',
      updated_at = v_now
    FROM eligible_completed ec
    WHERE m.id = ec.id
    RETURNING m.id
  )
  SELECT COUNT(*) INTO v_completed_count FROM updated_completed;

  RETURN jsonb_build_object(
    'success', true,
    'evaluated_at', v_now,
    'missed_updated', v_missed_count,
    'completed_updated', v_completed_count
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error_code', SQLSTATE,
    'message', SQLERRM,
    'evaluated_at', v_now
  );
END;
$$;

-- Least-Privilege Execution Permissions
REVOKE ALL ON FUNCTION public.evaluate_consultation_outcomes(INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.evaluate_consultation_outcomes(INT) FROM anon;
REVOKE ALL ON FUNCTION public.evaluate_consultation_outcomes(INT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.evaluate_consultation_outcomes(INT) TO service_role;
