-- Migration: Auto-create lawyer profile on signup & backfill
-- This ensures newly registered lawyers immediately have an active row in public.lawyer_profiles

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
  v_bar_number TEXT;
  v_jurisdiction TEXT;
  v_practice TEXT;
BEGIN
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'client');
  v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  v_bar_number := COALESCE(new.raw_user_meta_data->>'bar_number', 'PENDING');
  v_jurisdiction := COALESCE(new.raw_user_meta_data->>'jurisdiction', 'Delhi (DL)');
  v_practice := COALESCE(new.raw_user_meta_data->>'primary_practice', 'General Practice');

  -- Upsert profiles
  INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
  VALUES (
    new.id,
    new.email,
    v_full_name,
    v_role,
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=400')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

  -- If lawyer, automatically upsert into lawyer_profiles as well
  IF v_role = 'lawyer' THEN
    INSERT INTO public.lawyer_profiles (
      id,
      title,
      headline,
      bar_number,
      state_bar,
      years_experience,
      hourly_rate,
      is_verified,
      verification_status,
      availability,
      jurisdiction,
      state,
      practice_areas,
      tags,
      bio,
      rating,
      review_count
    ) VALUES (
      new.id,
      'Advocate',
      v_practice || ' Specialist',
      v_bar_number,
      v_jurisdiction,
      5,
      2500,
      false,
      'NOT_VERIFIED',
      'Available today',
      v_jurisdiction,
      v_jurisdiction,
      ARRAY[v_practice],
      ARRAY[v_practice, v_jurisdiction],
      'Licensed attorney admitted to the Bar Council of ' || v_jurisdiction || '.',
      5.0,
      0
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill any existing lawyers who exist in profiles but are missing from lawyer_profiles
INSERT INTO public.lawyer_profiles (
  id,
  title,
  headline,
  bar_number,
  state_bar,
  years_experience,
  hourly_rate,
  is_verified,
  verification_status,
  availability,
  jurisdiction,
  state,
  practice_areas,
  tags,
  bio,
  rating,
  review_count
)
SELECT 
  p.id,
  'Advocate',
  'Legal Specialist',
  COALESCE(u.raw_user_meta_data->>'bar_number', 'PENDING'),
  COALESCE(u.raw_user_meta_data->>'jurisdiction', 'Delhi (DL)'),
  5,
  2500,
  false,
  'NOT_VERIFIED',
  'Available today',
  COALESCE(u.raw_user_meta_data->>'jurisdiction', 'Delhi (DL)'),
  COALESCE(u.raw_user_meta_data->>'jurisdiction', 'Delhi (DL)'),
  ARRAY['General Practice'],
  ARRAY['Advocate'],
  'Licensed attorney admitted to the Bar Council.',
  5.0,
  0
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
LEFT JOIN public.lawyer_profiles lp ON p.id = lp.id
WHERE p.role = 'lawyer' AND lp.id IS NULL
ON CONFLICT (id) DO NOTHING;
