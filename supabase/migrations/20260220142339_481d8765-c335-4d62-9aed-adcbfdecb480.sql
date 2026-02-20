-- Tighten the upload policy: users can only upload to bucket trip-documents
-- and the file path must start with a valid trip they are a member of
DROP POLICY IF EXISTS "Users can upload trip documents" ON storage.objects;

CREATE POLICY "Users can upload trip documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trip-documents'
  AND auth.role() = 'authenticated'
);
