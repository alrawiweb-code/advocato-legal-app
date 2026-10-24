-- ==============================================================================
-- ADVOCATO — LAWYER SUSPENSION, RE-VERIFICATION & DOCUMENT VERSIONING
-- Migration: 20261014_fix_suspension_and_document_versioning.sql
-- ==============================================================================

-- 1. Add document versioning and active status tracking
ALTER TABLE public.verification_documents
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS replaced_document_id UUID REFERENCES public.verification_documents(id) ON DELETE SET NULL;

-- 2. Index for fast querying of active documents per requirement
CREATE INDEX IF NOT EXISTS idx_verification_docs_active 
  ON public.verification_documents(lawyer_id, document_requirement_id, is_active);

-- 3. Update RLS on lawyer_verification_applications
-- Allow lawyers to update their application when it is in DRAFT, DOCUMENTS_REQUIRED, SUSPENDED, or REJECTED status
DROP POLICY IF EXISTS "Lawyers update own draft applications" ON public.lawyer_verification_applications;
DROP POLICY IF EXISTS "Lawyers update own draft or suspended applications" ON public.lawyer_verification_applications;

CREATE POLICY "Lawyers update own draft or suspended applications" 
  ON public.lawyer_verification_applications
  FOR UPDATE
  TO public
  USING (
    (auth.uid() = lawyer_id) AND 
    (status = ANY (ARRAY[
      'DRAFT'::verification_status, 
      'DOCUMENTS_REQUIRED'::verification_status, 
      'SUSPENDED'::verification_status,
      'REJECTED'::verification_status
    ]))
  );


