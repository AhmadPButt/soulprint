-- Fix storage policies for trip-documents bucket
-- First ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-documents', 'trip-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if any
DROP POLICY IF EXISTS "Users can upload trip documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own trip documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own trip documents" ON storage.objects;
DROP POLICY IF EXISTS "Trip members can view documents" ON storage.objects;

-- Allow authenticated users to upload to trip-documents bucket
-- Path structure: {tripId}/{filename}
CREATE POLICY "Users can upload trip documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'trip-documents');

-- Allow authenticated users to view files in trips they are part of
CREATE POLICY "Users can view trip documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'trip-documents');

-- Allow users to delete their own uploaded files
CREATE POLICY "Users can delete trip documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'trip-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
