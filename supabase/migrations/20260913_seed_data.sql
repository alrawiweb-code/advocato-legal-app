-- ==============================================================================
-- ADVOCATO LEGAL MARKETPLACE — SEED DATA
-- Default Verified Counsel Profiles & Demo Matter
-- ==============================================================================

-- Seed Sample Client Alex Mercer
DO $$
DECLARE
  v_client_id UUID := '11111111-1111-1111-1111-111111111111';
  v_elena_id UUID  := '22222222-2222-2222-2222-222222222222';
  v_marcus_id UUID := '33333333-3333-3333-3333-333333333333';
  v_aisha_id UUID  := '44444444-4444-4444-4444-444444444444';
  v_matter_id UUID := '55555555-5555-5555-5555-555555555555';
BEGIN
  -- Insert Profiles
  INSERT INTO public.profiles (id, email, role, full_name, avatar_url)
  VALUES
    (v_client_id, 'alex.mercer@company.com', 'client', 'Alex Mercer', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'),
    (v_elena_id, 'elena.rostova@advocato.legal', 'lawyer', 'Elena Rostova', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAT0jy27MeqdpHot9_MNICBhLw0qoZSi5rV8TekjFHGhgZzHULXVmLPifAyzsO0FGYz4ArmSDjd9ywwLTpi89X8bwGsLypGUqKKXDUewBsYo3K__PvUMHbj85fiEA_yXZeH_-d-W71psf9aIvvm1QAdcDyWcX2g1eFDWVllt6AGlKVSKSsQGnmPLhABtsFXliDcdOmcAjqgGyXEnrnkEJE6bY8HNy6tHDP9MRQFZyKc4mxellYlck3z'),
    (v_marcus_id, 'marcus.sterling@advocato.legal', 'lawyer', 'Marcus Sterling', 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8u3MVAtZo5HXS8BItoNhaEdoIX6QjYLFAQV5hJuAQgVyhnQjzzATypvw13_SQxP40nk7G49GfmLBPUJ_sbOljQwlN0XKgMmKpxQrDmv1qt9s31-JBlOm6Qh-SCk0vm81k2A0r6gGfjhfR1J7qqVr3EZdSGOFHWnmFt5ZRmU4hl51PrkgqT-DcF8EkWgDLSPyU8rqSISke396JC5P--VWZE0AU5e1MlD54hUTFTT_UxWfvBsuurddz'),
    (v_aisha_id, 'aisha.patel@advocato.legal', 'lawyer', 'Aisha Patel', 'https://lh3.googleusercontent.com/aida-public/AB6AXuClXH7X6R57I0rr6Tb4ILciXpL-BfIfVz6Yj7gZgabVY6TSL120vJLjeeYeXJgtF3k8BwVhxvcJNL_9pMBHtVv9H2zy4MzrJSUXf_obWIX36SuVRU1yN9j3xgmLDDKmW0CVBHajVlpRlkhMnmi6WgyjSdaB6uwVUeXwfk12EoLUJKHeJpjeyRV4sRc5-3vNq-jqAgdNPDF9kXtDjptJaG6p1QfV6GlD88SFBw4W_hYEJzcRwM86uWPO')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  -- Insert Lawyer Profiles
  INSERT INTO public.lawyer_profiles (
    id, title, bar_number, state_bar, years_experience, hourly_rate, is_verified, availability, jurisdiction, practice_areas, tags, bio, notable_cases, rating, review_count
  ) VALUES
    (
      v_elena_id,
      'Employment & Labor Law Specialist',
      'NY-5829104',
      'New York (NY)',
      12,
      350,
      TRUE,
      'Available today',
      'Licensed in NY',
      ARRAY['Employment Law', 'Severance Agreements', 'Executive Compensation', 'Non-Compete Enforceability'],
      ARRAY['Practices employment law', 'Licensed in NY', 'Severance negotiation'],
      'Elena Rostova is a distinguished Employment & Labor Law Specialist with over a decade of experience representing executives and professionals in complex workplace disputes.',
      '[{"year":"2023","title":"Settled: Discrimination Claim","summary":"Negotiated a significant confidential settlement for a senior executive facing systemic age discrimination."}]'::jsonb,
      4.9,
      124
    ),
    (
      v_marcus_id,
      'Corporate Defense & Employment Counsel',
      'NY-3918274',
      'New York (NY)',
      22,
      420,
      TRUE,
      'Next week',
      'Licensed in NY, NJ',
      ARRAY['Corporate Defense', 'Executive Contracts', 'Arbitration & Mediation'],
      ARRAY['Practices employment law', 'Licensed in NY, NJ', 'Corporate Defense'],
      'Marcus Sterling brings over twenty years of elite corporate litigation and employment dispute leadership.',
      '[{"year":"2024","title":"Dismissed: Whistleblower Retaliation Action","summary":"Obtained summary judgment dismissal of multimillion dollar claims for a leading medical group."}]'::jsonb,
      4.8,
      89
    ),
    (
      v_aisha_id,
      'Workplace Rights & Compensation Attorney',
      'NY-6192837',
      'New York (NY)',
      8,
      295,
      TRUE,
      'Available today',
      'Licensed in NY',
      ARRAY['Employment Discrimination', 'Wage & Overtime Claims', 'Tech Startup Employment'],
      ARRAY['Practices employment law', 'Licensed in NY', 'Wage & Hour'],
      'Aisha Patel blends modern legal tech agility with fierce advocacy for client rights.',
      '[{"year":"2024","title":"Recovered: Unpaid Commission Settlement","summary":"Successfully recovered $380,000 in withheld sales incentive compensation."}]'::jsonb,
      5.0,
      42
    )
  ON CONFLICT (id) DO NOTHING;

  -- Insert Demo Matter
  INSERT INTO public.matters (
    id, matter_number, client_id, lawyer_id, case_title, category, jurisdiction, urgency, status
  ) VALUES (
    v_matter_id,
    'ADV-2026-8842',
    v_client_id,
    v_elena_id,
    'Employment Agreement & NDA Review',
    'Employment & Labor Law',
    'New York (NY)',
    'High',
    'active'
  ) ON CONFLICT (id) DO NOTHING;

  -- Insert Demo Initial Messages
  INSERT INTO public.messages (matter_id, sender_id, sender_role, text, status)
  VALUES
    (v_matter_id, v_elena_id, 'lawyer', 'Good morning Alex. I have completed the preliminary audit of your draft NDA and severance agreement. There are two non-compete covenants requiring modification.', 'read'),
    (v_matter_id, v_client_id, 'client', 'Thank you Elena. Do these clauses restrict advisory work for early-stage startups in New York?', 'read')
  ON CONFLICT DO NOTHING;
END $$;
