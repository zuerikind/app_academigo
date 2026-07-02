-- Add CV and motivation letter fields to teachers table
ALTER TABLE teachers
  ADD COLUMN IF NOT EXISTS cv_url text,
  ADD COLUMN IF NOT EXISTS motivation_letter text;

-- Private bucket for CV documents (not public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "documents_upload_own" ON storage.objects;
DROP POLICY IF EXISTS "documents_read_service" ON storage.objects;

-- Only the owner can upload their own CV
CREATE POLICY "documents_upload_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owner can read their own documents
CREATE POLICY "documents_read_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
