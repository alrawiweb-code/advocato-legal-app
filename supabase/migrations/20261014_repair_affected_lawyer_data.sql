-- ==============================================================================
-- ADVOCATO — DATA REPAIR FOR AFFECTED LAWYER (PENDING APPROVAL)
-- Migration: 20261014_repair_affected_lawyer_data.sql
-- Description: Synchronizes state for lawyer 25c19700-edde-41b0-8766-b94e8f65f88d:
--   1. Deactivates pre-existing duplicate documents created before re-submission.
--   2. Updates application status from APPROVED -> UNDER_REVIEW.
--   3. Ensures lawyer_profiles.verification_status remains SUSPENDED.
-- NOTE: DO NOT APPLY UNTIL SEPARATELY APPROVED BY THE USER.
-- ==============================================================================

-- 1. Deactivate older duplicate documents (created before 2026-10-13 16:00:00) so only latest uploads are active
UPDATE public.verification_documents
SET is_active = false
WHERE lawyer_id = '25c19700-edde-41b0-8766-b94e8f65f88d'
  AND created_at < '2026-10-13 16:00:00+00';

-- 2. Synchronize application status for suspended lawyer who re-submitted documents
UPDATE public.lawyer_verification_applications
SET status = 'UNDER_REVIEW'::verification_status,
    submitted_at = '2026-10-13 16:52:11+00'
WHERE lawyer_id = '25c19700-edde-41b0-8766-b94e8f65f88d'
  AND status = 'APPROVED';

-- 3. Ensure profile verification_status remains SUSPENDED until admin explicitly re-approves
UPDATE public.lawyer_profiles
SET verification_status = 'SUSPENDED'::verification_status,
    is_verified = false,
    accepting_clients = false
WHERE id = '25c19700-edde-41b0-8766-b94e8f65f88d'
  AND suspension_reason IS NOT NULL;
