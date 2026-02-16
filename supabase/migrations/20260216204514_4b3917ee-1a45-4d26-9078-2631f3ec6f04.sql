-- Create storage bucket for destination images
INSERT INTO storage.buckets (id, name, public) VALUES ('destination-images', 'destination-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view destination images
CREATE POLICY "Public destination images" ON storage.objects FOR SELECT
USING (bucket_id = 'destination-images');

-- Allow authenticated users to upload destination images (admin)
CREATE POLICY "Admin can upload destination images" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'destination-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete destination images (admin)
CREATE POLICY "Admin can delete destination images" ON storage.objects FOR DELETE
USING (bucket_id = 'destination-images' AND auth.role() = 'authenticated');
