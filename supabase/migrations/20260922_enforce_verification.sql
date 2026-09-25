

-- Set defaults to ensure new lawyers are NOT verified out of the box
ALTER TABLE public.lawyer_profiles
ALTER COLUMN is_verified SET DEFAULT FALSE;

ALTER TABLE public.lawyer_profiles
ALTER COLUMN verification_status SET DEFAULT 'NOT_VERIFIED'::verification_status;

-- Update existing lawyers who were automatically verified but don't actually have an application
UPDATE public.lawyer_profiles lp
SET is_verified = FALSE,
    verification_status = 'NOT_VERIFIED'
WHERE is_verified = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM public.lawyer_verification_applications lva
    WHERE lva.lawyer_id = lp.id
      AND (lva.status = 'APPROVED' OR lva.status = 'VERIFIED')
  );
