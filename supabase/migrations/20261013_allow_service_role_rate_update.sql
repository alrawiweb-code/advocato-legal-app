-- Migration: 20261013_allow_service_role_rate_update.sql
-- Description: Updates prevent_lawyer_rate_update trigger function to permit backend service_role
-- and postgres superuser operations, allowing authorized admin rate assignments while continuing
-- to block direct rate mutations from ordinary lawyers.

CREATE OR REPLACE FUNCTION public.prevent_lawyer_rate_update()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_email text;
  v_jwt_role text;
BEGIN
  -- If hourly_rate didn't change, allow the update
  IF (OLD.hourly_rate IS NOT DISTINCT FROM NEW.hourly_rate) THEN
    RETURN NEW;
  END IF;

  -- Allow backend service_role or superuser operations
  BEGIN
    v_jwt_role := COALESCE(
      auth.role(),
      current_setting('request.jwt.claims', true)::json->>'role'
    );
  EXCEPTION WHEN OTHERS THEN
    v_jwt_role := NULL;
  END;

  IF (v_jwt_role = 'service_role' OR current_user = 'postgres') THEN
    RETURN NEW;
  END IF;

  -- Get current user's role from profiles
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  
  -- Check if user is admin by email from JWT (fallback)
  BEGIN
    v_email := current_setting('request.jwt.claims', true)::json->>'email';
  EXCEPTION WHEN OTHERS THEN
    v_email := NULL;
  END;
  
  -- If user is admin (by role or email), allow the update
  IF (v_role = 'admin' OR v_email = 'alrawiweb@gmail.com') THEN
    RETURN NEW;
  END IF;

  -- Otherwise, block direct updates from lawyers
  RAISE EXCEPTION 'Unauthorized: Lawyers cannot directly modify their hourly_rate. Must request a price change.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
