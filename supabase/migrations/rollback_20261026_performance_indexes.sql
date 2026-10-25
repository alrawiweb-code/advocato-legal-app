-- ==============================================================================
-- ADVOCATO ROLLBACK: TARGETED INDEXES
-- Safe reversal of performance indexes created in 20261026_performance_indexes.sql
-- ==============================================================================

DROP INDEX IF EXISTS public.idx_messages_matter_created;
DROP INDEX IF EXISTS public.idx_matters_client_updated;
DROP INDEX IF EXISTS public.idx_matters_lawyer_updated;
DROP INDEX IF EXISTS public.idx_lawyer_profiles_verified;
DROP INDEX IF EXISTS public.idx_lawyer_reviews_lawyer_stats;
DROP INDEX IF EXISTS public.idx_documents_matter_id;
