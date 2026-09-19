-- ==============================================================================
-- ADVOCATO LEGAL MARKETPLACE — PHASE 2 MIGRATION
-- Structured Marketplace Data: Taxonomy, Services, Verification & Reviews
-- ==============================================================================

-- 1. Lawyer Verification Status Enum
DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('NOT_VERIFIED', 'PENDING', 'VERIFIED', 'SUSPENDED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Alter existing lawyer_profiles to add Phase 2 fields
ALTER TABLE public.lawyer_profiles 
  ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS headline TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS accepting_clients BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS response_time_hours INT,
  ADD COLUMN IF NOT EXISTS verified_review_count INT DEFAULT 0;

-- Update existing verify status to use the enum
UPDATE public.lawyer_profiles 
SET verification_status = 'VERIFIED' 
WHERE is_verified = TRUE;

-- 3. Practice Areas Taxonomy
CREATE TABLE IF NOT EXISTS public.practice_area_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Legal Services Taxonomy
CREATE TABLE IF NOT EXISTS public.legal_services (
  id TEXT PRIMARY KEY,
  practice_area_id TEXT NOT NULL REFERENCES public.practice_area_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Lawyer Services Junction Table
CREATE TABLE IF NOT EXISTS public.lawyer_services (
  lawyer_id UUID NOT NULL REFERENCES public.lawyer_profiles(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL REFERENCES public.legal_services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (lawyer_id, service_id)
);

-- 6. Review Verification Status Enum
DO $$ BEGIN
    CREATE TYPE review_verification_status AS ENUM ('UNVERIFIED', 'VERIFIED', 'FLAGGED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 7. Lawyer Reviews Table
CREATE TABLE IF NOT EXISTS public.lawyer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lawyer_id UUID NOT NULL REFERENCES public.lawyer_profiles(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  matter_id UUID REFERENCES public.matters(id) ON DELETE SET NULL,
  reviewer_name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  verification_status review_verification_status NOT NULL DEFAULT 'UNVERIFIED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure a client can only review a lawyer once per matter
CREATE UNIQUE INDEX IF NOT EXISTS unique_review_per_matter ON public.lawyer_reviews (lawyer_id, reviewer_id, matter_id) WHERE matter_id IS NOT NULL;

-- 8. Computed View for the Marketplace Directory
-- This view pre-aggregates services and handles rating calculations so the API can query it efficiently
CREATE OR REPLACE VIEW public.lawyer_marketplace_view AS
SELECT 
  lp.id,
  p.full_name as name,
  lp.title,
  lp.headline,
  p.avatar_url as avatar,
  lp.is_verified,
  lp.verification_status,
  lp.availability,
  lp.accepting_clients,
  lp.years_experience,
  lp.jurisdiction,
  lp.state,
  lp.city,
  lp.hourly_rate,
  lp.languages,
  lp.practice_areas,
  lp.tags,
  lp.bio,
  COALESCE(
    (SELECT array_agg(service_id) FROM public.lawyer_services WHERE lawyer_id = lp.id), 
    '{}'::TEXT[]
  ) as service_ids,
  -- Compute actual rating from reviews, fallback to legacy rating if no reviews yet but legacy count exists
  COALESCE(
    (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.lawyer_reviews WHERE lawyer_id = lp.id),
    CASE WHEN lp.review_count > 0 THEN lp.rating ELSE NULL END
  ) as computed_rating,
  -- Real review count from new table + legacy count
  (SELECT COUNT(*) FROM public.lawyer_reviews WHERE lawyer_id = lp.id) + lp.review_count as total_review_count,
  -- Verified review count
  (SELECT COUNT(*) FROM public.lawyer_reviews WHERE lawyer_id = lp.id AND verification_status = 'VERIFIED') + lp.verified_review_count as total_verified_review_count,
  lp.created_at
FROM 
  public.lawyer_profiles lp
JOIN 
  public.profiles p ON lp.id = p.id;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- practice_area_categories: Readable by all, writeable by admin
ALTER TABLE public.practice_area_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Practice areas are viewable by everyone" ON public.practice_area_categories FOR SELECT USING (true);

-- legal_services: Readable by all, writeable by admin
ALTER TABLE public.legal_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Legal services are viewable by everyone" ON public.legal_services FOR SELECT USING (true);

-- lawyer_services: Readable by all, writeable by the specific lawyer
ALTER TABLE public.lawyer_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lawyer services are viewable by everyone" ON public.lawyer_services FOR SELECT USING (true);
CREATE POLICY "Lawyers can insert their own services" ON public.lawyer_services FOR INSERT WITH CHECK (auth.uid() = lawyer_id);
CREATE POLICY "Lawyers can update their own services" ON public.lawyer_services FOR UPDATE USING (auth.uid() = lawyer_id);
CREATE POLICY "Lawyers can delete their own services" ON public.lawyer_services FOR DELETE USING (auth.uid() = lawyer_id);

-- lawyer_reviews: Readable by all, writeable by authenticated clients
ALTER TABLE public.lawyer_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lawyer reviews are viewable by everyone" ON public.lawyer_reviews FOR SELECT USING (true);
CREATE POLICY "Clients can create reviews" ON public.lawyer_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
-- Only the reviewer can update/delete their own review
CREATE POLICY "Reviewers can update their own reviews" ON public.lawyer_reviews FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Reviewers can delete their own reviews" ON public.lawyer_reviews FOR DELETE USING (auth.uid() = reviewer_id);

-- Add missing policies for lawyer_profiles (if they didn't exist)
ALTER TABLE public.lawyer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lawyer profiles are viewable by everyone" ON public.lawyer_profiles FOR SELECT USING (true);
CREATE POLICY "Lawyers can update their own profile" ON public.lawyer_profiles FOR UPDATE USING (auth.uid() = id);

-- Note: We do NOT need RLS policies on the View (`lawyer_marketplace_view`) because it executes with the privileges of its creator, 
-- or we can ensure it's accessed securely via the API routes. 
-- In Supabase, standard views bypass RLS of the underlying tables unless created with `WITH (security_invoker = true)`.
-- Since all underlying data for this view is meant to be public, bypassing is acceptable.
