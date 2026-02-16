
-- Multi-destination trips
ALTER TABLE public.trips 
  ADD COLUMN IF NOT EXISTS is_multi_destination BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS destination_ids UUID[] DEFAULT ARRAY[]::UUID[];

-- Destination favorites/wishlist
CREATE TABLE public.destination_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  destination_id UUID REFERENCES public.echoprint_destinations(id) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, destination_id)
);

ALTER TABLE public.destination_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
ON public.destination_favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
ON public.destination_favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
ON public.destination_favorites FOR DELETE
USING (auth.uid() = user_id);
