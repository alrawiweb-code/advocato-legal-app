-- ==============================================================================
-- ADVOCATO — LAWYER SUSPENSION SYSTEM MIGRATION
-- Adds suspension_reason and suspended_at fields to lawyer_profiles
-- ==============================================================================

ALTER TABLE public.lawyer_profiles
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

-- Ensure data consistency: any SUSPENDED lawyer must have is_verified = false
UPDATE public.lawyer_profiles
SET is_verified = false
WHERE verification_status = 'SUSPENDED' AND is_verified = true;

COMMENT ON COLUMN public.lawyer_profiles.verification_status IS 
  'Authoritative verification state. VERIFIED = active marketplace. SUSPENDED = removed by admin. REJECTED = application denied.';

COMMENT ON COLUMN public.lawyer_profiles.suspension_reason IS 
  'Admin-provided reason for marketplace suspension. Visible to the suspended lawyer on their dashboard.';

COMMENT ON COLUMN public.lawyer_profiles.suspended_at IS 
  'Timestamp when the lawyer was suspended from the marketplace by an admin.';
