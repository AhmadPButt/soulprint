
-- Create destination profiles table
CREATE TABLE public.echoprint_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  country VARCHAR(50) NOT NULL,
  region VARCHAR(50) NOT NULL,
  
  -- Core psychological scores (0-100)
  restorative_score INT,
  achievement_score INT,
  cultural_score INT,
  social_vibe_score INT,
  
  -- Sensory dimension scores (0-100)
  visual_score INT,
  culinary_score INT,
  nature_score INT,
  cultural_sensory_score INT,
  wellness_score INT,
  
  -- Luxury & practical
  luxury_style_score INT,
  avg_cost_per_day_gbp INT,
  flight_time_from_uk_hours FLOAT,
  climate_tags TEXT[],
  best_time_to_visit VARCHAR(100),
  
  -- Content & media
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  image_credit VARCHAR(200),
  highlights TEXT[],
  
  -- Metadata
  tier VARCHAR(20) DEFAULT 'curated',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Validation trigger for scores 0-100
CREATE OR REPLACE FUNCTION public.validate_destination_scores()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.restorative_score IS NOT NULL AND (NEW.restorative_score < 0 OR NEW.restorative_score > 100) THEN
    RAISE EXCEPTION 'restorative_score must be between 0 and 100';
  END IF;
  IF NEW.achievement_score IS NOT NULL AND (NEW.achievement_score < 0 OR NEW.achievement_score > 100) THEN
    RAISE EXCEPTION 'achievement_score must be between 0 and 100';
  END IF;
  IF NEW.cultural_score IS NOT NULL AND (NEW.cultural_score < 0 OR NEW.cultural_score > 100) THEN
    RAISE EXCEPTION 'cultural_score must be between 0 and 100';
  END IF;
  IF NEW.social_vibe_score IS NOT NULL AND (NEW.social_vibe_score < 0 OR NEW.social_vibe_score > 100) THEN
    RAISE EXCEPTION 'social_vibe_score must be between 0 and 100';
  END IF;
  IF NEW.visual_score IS NOT NULL AND (NEW.visual_score < 0 OR NEW.visual_score > 100) THEN
    RAISE EXCEPTION 'visual_score must be between 0 and 100';
  END IF;
  IF NEW.culinary_score IS NOT NULL AND (NEW.culinary_score < 0 OR NEW.culinary_score > 100) THEN
    RAISE EXCEPTION 'culinary_score must be between 0 and 100';
  END IF;
  IF NEW.nature_score IS NOT NULL AND (NEW.nature_score < 0 OR NEW.nature_score > 100) THEN
    RAISE EXCEPTION 'nature_score must be between 0 and 100';
  END IF;
  IF NEW.cultural_sensory_score IS NOT NULL AND (NEW.cultural_sensory_score < 0 OR NEW.cultural_sensory_score > 100) THEN
    RAISE EXCEPTION 'cultural_sensory_score must be between 0 and 100';
  END IF;
  IF NEW.wellness_score IS NOT NULL AND (NEW.wellness_score < 0 OR NEW.wellness_score > 100) THEN
    RAISE EXCEPTION 'wellness_score must be between 0 and 100';
  END IF;
  IF NEW.luxury_style_score IS NOT NULL AND (NEW.luxury_style_score < 0 OR NEW.luxury_style_score > 100) THEN
    RAISE EXCEPTION 'luxury_style_score must be between 0 and 100';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_destination_scores_trigger
BEFORE INSERT OR UPDATE ON public.echoprint_destinations
FOR EACH ROW EXECUTE FUNCTION public.validate_destination_scores();

-- Updated_at trigger
CREATE TRIGGER update_destinations_updated_at
BEFORE UPDATE ON public.echoprint_destinations
FOR EACH ROW EXECUTE FUNCTION public.update_itineraries_updated_at();

-- Indexes
CREATE INDEX idx_destinations_region ON public.echoprint_destinations(region);
CREATE INDEX idx_destinations_active ON public.echoprint_destinations(is_active);
CREATE INDEX idx_destinations_tier ON public.echoprint_destinations(tier);

-- RLS
ALTER TABLE public.echoprint_destinations ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active destinations
CREATE POLICY "Anyone can view active destinations"
ON public.echoprint_destinations FOR SELECT
USING (true);

-- Admin full access (using restrictive policies matching existing pattern)
CREATE POLICY "Admin can insert destinations"
ON public.echoprint_destinations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admin can update destinations"
ON public.echoprint_destinations FOR UPDATE
USING (true);

CREATE POLICY "Admin can delete destinations"
ON public.echoprint_destinations FOR DELETE
USING (true);

-- Seed 5 starter destinations
INSERT INTO public.echoprint_destinations (
  name, country, region,
  restorative_score, achievement_score, cultural_score, social_vibe_score,
  visual_score, culinary_score, nature_score, cultural_sensory_score, wellness_score,
  luxury_style_score, avg_cost_per_day_gbp, flight_time_from_uk_hours,
  climate_tags, best_time_to_visit, description, short_description, highlights, tier, is_active
) VALUES
(
  'Comporta', 'Portugal', 'Europe',
  92, 35, 58, 25,
  88, 75, 95, 60, 85,
  30, 350, 2.5,
  ARRAY['Mediterranean', 'Beach', 'Mild winters', 'Hot summers'],
  'April-October',
  'Comporta is a quiet coastal retreat on Portugal''s Atlantic coast. Known for pristine beaches, endless rice fields, and design-forward rustic luxury. Perfect for travelers seeking natural beauty, slow pace, and intimate settings away from tourist crowds.',
  'Quiet coastal retreat with pristine beaches and rustic luxury',
  ARRAY['Pristine beaches', 'Rice paddies', 'Rustic luxury stays', 'Dolphin watching', 'Wine tasting'],
  'verified', true
),
(
  'Puglia', 'Italy', 'Europe',
  85, 40, 72, 30,
  85, 95, 70, 78, 70,
  35, 300, 3.0,
  ARRAY['Mediterranean', 'Coastal', 'Hot summers'],
  'May-September',
  'Southern Italy''s culinary heartland. Whitewashed hilltop towns, ancient olive groves, masserie farmhouse stays, and exceptional food culture. Perfect for travelers who prioritize authentic experiences and gastronomic excellence.',
  'Southern Italy''s culinary heartland with masseria stays',
  ARRAY['Masseria stays', 'Olive oil tastings', 'Trulli villages', 'Coastal caves', 'Fresh pasta workshops'],
  'verified', true
),
(
  'Iceland', 'Iceland', 'Europe',
  60, 85, 55, 40,
  98, 60, 95, 50, 65,
  50, 400, 3.0,
  ARRAY['Subarctic', 'Cool summers', 'Cold winters', 'Northern lights'],
  'June-August, September-March for Northern Lights',
  'Land of fire and ice. Dramatic volcanic landscapes, massive glaciers, geothermal hot springs, and ethereal northern lights. Perfect for adventure-oriented travelers seeking raw natural beauty and active exploration.',
  'Dramatic landscapes and active adventure experiences',
  ARRAY['Northern Lights', 'Glacier hiking', 'Geothermal springs', 'Whale watching', 'Volcanic landscapes'],
  'verified', true
),
(
  'Morocco (Marrakech)', 'Morocco', 'Africa',
  70, 65, 90, 60,
  88, 85, 50, 95, 80,
  45, 250, 3.5,
  ARRAY['Mediterranean', 'Desert', 'Hot', 'Dry'],
  'October-April',
  'Sensory immersion in ancient medinas, vibrant souks, intimate riads, and desert landscapes. Rich cultural traditions, aromatic cuisine, intricate architecture. Perfect for travelers seeking deep cultural engagement and sensory experiences.',
  'Rich cultural immersion in medinas, souks, and riads',
  ARRAY['Medina exploration', 'Riad stays', 'Desert excursions', 'Hammam experiences', 'Spice markets'],
  'verified', true
),
(
  'Tasmania', 'Australia', 'Oceania',
  88, 70, 60, 20,
  92, 70, 98, 55, 75,
  40, 380, 24.0,
  ARRAY['Temperate', 'Cool', 'Four seasons', 'Remote'],
  'November-March',
  'Unspoiled wilderness at the edge of the world. Ancient rainforests, pristine coastlines, unique wildlife, and intimate nature encounters. Perfect for travelers seeking natural beauty, tranquility, and authentic outdoor experiences.',
  'Pristine wilderness and intimate nature experiences',
  ARRAY['Ancient rainforests', 'Pristine coastlines', 'Wildlife encounters', 'Farm-to-table dining', 'Hiking trails'],
  'verified', true
);
