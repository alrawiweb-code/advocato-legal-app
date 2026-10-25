-- Migration: 20261026_shield_profile_roles_on_oauth.sql
-- Description: Protects existing user roles and profiles against downgrades or overwrites
-- when signing in via OAuth (e.g. Google Sign-In) or account linking.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
BEGIN
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'client');
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  -- Upsert profiles with role shield: never overwrite an existing user's role on OAuth login/linking
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    new.id,
    new.email,
    v_full_name,
    v_role,
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
    role = COALESCE(profiles.role, EXCLUDED.role),
    avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url);

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
      NULL,
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
