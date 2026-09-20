-- ==============================================================================
-- ADVOCATO: Promote Account to Regulatory Admin
-- ==============================================================================
-- Run this in your Supabase SQL Editor to grant admin access to any account.

-- 1. Promote by email (e.g. alrawiweb@gmail.com)
UPDATE public.profiles
SET role = 'admin', updated_at = now()
WHERE email = 'alrawiweb@gmail.com';

-- 2. Verify role update
SELECT id, email, role, full_name
FROM public.profiles
WHERE role = 'admin';
