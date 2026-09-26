-- Migration: Fix profiles RLS to allow lawyers to see their clients' names

CREATE POLICY "Users can view connected profiles via matters"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM matters
    WHERE (matters.client_id = auth.uid() AND matters.lawyer_id = profiles.id)
       OR (matters.lawyer_id = auth.uid() AND matters.client_id = profiles.id)
  )
);
