-- Migration: 20261010_fix_handle_new_user_trigger.sql
-- Description: Updates the handle_new_user trigger to insert NULL for hourly_rate instead of the hardcoded 2500,
-- aligning with the new admin pricing architecture. Also backfills affected unverified lawyers.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
BEGIN
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'client');
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  -- Upsert profiles
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    new.id,
    new.email,
    v_full_name,
    v_role,
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

  -- Create lawyer_profiles stub if role is lawyer
  IF v_role = 'lawyer' THEN
    INSERT INTO public.lawyer_profiles (
      id,
      title,
      bar_number,
      state_bar,
      years_experience,
      hourly_rate,
      is_verified,
      verification_status,
      availability,
      jurisdiction,
      practice_areas,
      tags,
      bio,
      notable_cases,
      rating,
      review_count
    )
    VALUES (
      new.id,
      'Advocate',
      COALESCE(new.raw_user_meta_data->>'bar_number', 'PENDING'),
      COALESCE(new.raw_user_meta_data->>'jurisdiction', 'Pending'),
      0,
      NULL, -- Fixed: Replaced hardcoded 2500 with NULL to enforce admin pricing
      false,
      'NOT_VERIFIED',
      'Pending verification',
      COALESCE(new.raw_user_meta_data->>'jurisdiction', 'Pending'),
      '{}'::text[],
      '{}'::text[],
      '',
      '[]'::jsonb,
      5.0,
      0
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Targeted backfill for affected records only
-- This nullifies the hourly_rate only for unverified lawyers who were incorrectly assigned 2500 by the faulty trigger.
-- Verified lawyers are untouched to avoid disrupting legit admin-assigned rates if they happen to be 2500.
UPDATE public.lawyer_profiles
SET hourly_rate = NULL
WHERE hourly_rate = 2500 
  AND verification_status != 'VERIFIED';
