
-- Create trip_bookings table
CREATE TABLE public.trip_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  booking_type VARCHAR(50) NOT NULL,
  provider_name VARCHAR(200),
  confirmation_number VARCHAR(100),
  booking_date DATE,
  booking_time TIME,
  location_name VARCHAR(200),
  location_address TEXT,
  cost_gbp INT,
  currency VARCHAR(10) DEFAULT 'GBP',
  notes TEXT,
  contact_phone VARCHAR(50),
  contact_email VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.trip_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trip creators can manage bookings" ON public.trip_bookings FOR ALL
  USING (trip_id IN (SELECT id FROM public.trips WHERE created_by = auth.uid()));

CREATE POLICY "Trip members can view bookings" ON public.trip_bookings FOR SELECT
  USING (trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid()));

CREATE INDEX idx_bookings_trip ON public.trip_bookings(trip_id);

-- Create trip_documents table
CREATE TABLE public.trip_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(200) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT,
  notes TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.trip_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trip creators can manage documents" ON public.trip_documents FOR ALL
  USING (trip_id IN (SELECT id FROM public.trips WHERE created_by = auth.uid()));

CREATE POLICY "Trip members can view documents" ON public.trip_documents FOR SELECT
  USING (trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can upload their own documents" ON public.trip_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_documents_trip ON public.trip_documents(trip_id);

-- Create destination_info table
CREATE TABLE public.destination_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID REFERENCES public.echoprint_destinations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  cultural_customs TEXT,
  language_basics TEXT,
  tipping_etiquette TEXT,
  dress_code TEXT,
  local_customs TEXT,
  safety_tips TEXT,
  emergency_numbers JSONB,
  embassy_contact TEXT,
  currency VARCHAR(50),
  timezone VARCHAR(50),
  voltage VARCHAR(50),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.destination_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view destination info" ON public.destination_info FOR SELECT USING (true);
CREATE POLICY "Admin can manage destination info" ON public.destination_info FOR ALL USING (true);

CREATE INDEX idx_destination_info ON public.destination_info(destination_id);

-- Create trip-documents storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('trip-documents', 'trip-documents', false);

-- Storage policies for trip-documents bucket
CREATE POLICY "Authenticated users can upload trip documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'trip-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their trip documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'trip-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their trip documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'trip-documents' AND auth.role() = 'authenticated');
