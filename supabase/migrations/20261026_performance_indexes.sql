-- ==============================================================================
-- ADVOCATO PERFORMANCE OPTIMIZATION: TARGETED INDEXES MIGRATION
-- High-impact, non-breaking indexes matching verified query & RLS patterns
-- ==============================================================================

-- 1. Index for Messages query & realtime subscription by matter docket
-- Used by: /messages and consultation chat views:
--   .from("messages").select("*, document:documents(*)").eq("matter_id", matterId).order("created_at", { ascending: true })
CREATE INDEX IF NOT EXISTS idx_messages_matter_created 
  ON public.messages(matter_id, created_at ASC);

-- 2. Index for Matter docket queries by Client and Lawyer
-- Used by: RLS policies, /cases, /messages:
--   WHERE client_id = auth.uid() OR lawyer_id = auth.uid() ORDER BY updated_at DESC
CREATE INDEX IF NOT EXISTS idx_matters_client_updated 
  ON public.matters(client_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_matters_lawyer_updated 
  ON public.matters(lawyer_id, updated_at DESC);

-- 3. Filter index for verified lawyers directory & marketplace
-- Used by: /api/lawyers:
--   WHERE is_verified = true AND verification_status = 'VERIFIED' AND hourly_rate > 0
CREATE INDEX IF NOT EXISTS idx_lawyer_profiles_verified 
  ON public.lawyer_profiles(is_verified, verification_status, hourly_rate) 
  WHERE is_verified = true;

-- 4. Covering index for Lawyer Reviews aggregation in lawyer_marketplace_view
-- Eliminates sequential scans during subquery aggregation of rating & review count:
--   (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.lawyer_reviews WHERE lawyer_id = lp.id)
--   (SELECT COUNT(*) FROM public.lawyer_reviews WHERE lawyer_id = lp.id)
CREATE INDEX IF NOT EXISTS idx_lawyer_reviews_lawyer_stats 
  ON public.lawyer_reviews(lawyer_id, rating, verification_status);

-- 5. Foreign key index for matter evidentiary documents
-- Used by: Document joins in messages and RLS lookups:
CREATE INDEX IF NOT EXISTS idx_documents_matter_id 
  ON public.documents(matter_id);
