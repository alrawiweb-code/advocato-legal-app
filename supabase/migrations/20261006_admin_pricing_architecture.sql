-- Migration: 20261006_admin_pricing_architecture.sql
-- Description: Implements the DB schema and RLS requirements for centralized admin pricing.

-- 1. Create lawyer_price_requests table
CREATE TABLE public.lawyer_price_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lawyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_rate INT, -- nullable in case they didn't have one
    requested_rate INT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rejection_reason TEXT
);

-- Enable RLS for the new table
ALTER TABLE public.lawyer_price_requests ENABLE ROW LEVEL SECURITY;

-- Lawyers can view and create their own requests
CREATE POLICY "Lawyers can view own price requests" ON public.lawyer_price_requests 
  FOR SELECT USING (auth.uid() = lawyer_id);
  
CREATE POLICY "Lawyers can create own price requests" ON public.lawyer_price_requests 
  FOR INSERT WITH CHECK (auth.uid() = lawyer_id);

-- Admins can view and update all requests (admin policy managed by backend service role or specific RLS)
-- Since admin API uses service_role key, it bypasses RLS, so no explicit admin policy is strictly needed here for the API.

-- 2. Modify lawyer_profiles to make hourly_rate nullable and remove default
ALTER TABLE public.lawyer_profiles ALTER COLUMN hourly_rate DROP DEFAULT;
ALTER TABLE public.lawyer_profiles ALTER COLUMN hourly_rate DROP NOT NULL;

-- 3. Trigger to prevent lawyers from directly updating their hourly_rate
CREATE OR REPLACE FUNCTION public.prevent_lawyer_rate_update()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_email text;
BEGIN
  -- If hourly_rate didn't change, allow the update
  IF (OLD.hourly_rate IS NOT DISTINCT FROM NEW.hourly_rate) THEN
    RETURN NEW;
  END IF;

  -- Get current user's role from profiles
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  
  -- Check if user is admin by email from JWT (fallback)
  v_email := current_setting('request.jwt.claims', true)::json->>'email';
  
  -- If user is admin (by role or email), allow the update
  IF (v_role = 'admin' OR v_email = 'alrawiweb@gmail.com') THEN
    RETURN NEW;
  END IF;

  -- Otherwise, block the update
  RAISE EXCEPTION 'Unauthorized: Lawyers cannot directly modify their hourly_rate. Must request a price change.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow re-running
DROP TRIGGER IF EXISTS enforce_admin_pricing ON public.lawyer_profiles;

CREATE TRIGGER enforce_admin_pricing
  BEFORE UPDATE ON public.lawyer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_lawyer_rate_update();
