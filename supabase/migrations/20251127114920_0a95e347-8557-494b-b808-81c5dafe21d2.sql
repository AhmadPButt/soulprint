-- Create respondents table
CREATE TABLE public.respondents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  country text,
  passport_nationality text,
  travel_companion text,
  room_type text,
  dietary_preferences text,
  
  raw_responses jsonb NOT NULL,
  status text DEFAULT 'pending'
);

-- Create computed_scores table
CREATE TABLE public.computed_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  respondent_id uuid REFERENCES public.respondents(id) ON DELETE CASCADE,
  computed_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Big Five Traits
  extraversion decimal(5,2),
  openness decimal(5,2),
  conscientiousness decimal(5,2),
  agreeableness decimal(5,2),
  emotional_stability decimal(5,2),
  
  -- Travel Behavior
  spontaneity_flexibility decimal(5,2),
  adventure_orientation decimal(5,2),
  environmental_adaptation decimal(5,2),
  travel_freedom_index decimal(5,2),
  
  -- Elemental
  fire_score decimal(5,2),
  water_score decimal(5,2),
  stone_score decimal(5,2),
  urban_score decimal(5,2),
  desert_score decimal(5,2),
  dominant_element text,
  secondary_element text,
  
  -- Inner Compass
  transformation decimal(5,2),
  clarity decimal(5,2),
  aliveness decimal(5,2),
  connection decimal(5,2),
  top_motivation_1 text,
  top_motivation_2 text,
  
  -- State
  life_phase text,
  shift_desired text,
  emotional_burden_index decimal(5,2),
  emotional_travel_index decimal(5,2),
  completion_need text,
  
  -- Tensions
  t_social decimal(5,2),
  t_flow decimal(5,2),
  t_risk decimal(5,2),
  t_elements decimal(5,2),
  t_tempo decimal(5,2),
  
  -- Experience Alignment
  eai_azerbaijan decimal(5,2),
  
  -- Business KPIs
  spi decimal(5,2),
  spi_tier text,
  urs decimal(5,2),
  urs_tier text,
  nps_predicted decimal(4,2),
  nps_tier text,
  crs decimal(5,2),
  crs_tier text,
  gfi decimal(5,2),
  gfi_tier text,
  cgs decimal(5,2),
  cgs_tier text,
  
  -- Tribe
  tribe text,
  tribe_confidence text,
  
  -- Flags
  upsell_priority text,
  risk_flag text,
  content_flag boolean
);

-- Create narrative_insights table
CREATE TABLE public.narrative_insights (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  respondent_id uuid REFERENCES public.respondents(id) ON DELETE CASCADE,
  computed_scores_id uuid REFERENCES public.computed_scores(id) ON DELETE CASCADE,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  model_used text,
  prompt_version text,
  
  soulprint_summary text,
  traveler_archetype text,
  journey_recommendations text,
  growth_edges text,
  group_compatibility_notes text,
  guide_briefing text,
  
  headline text,
  tagline text,
  
  regeneration_count integer DEFAULT 0,
  user_rating integer
);

-- Enable RLS
ALTER TABLE public.respondents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.computed_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_insights ENABLE ROW LEVEL SECURITY;

-- Admin can view all
CREATE POLICY "Admin can view all respondents" ON public.respondents FOR SELECT USING (true);
CREATE POLICY "Admin can insert respondents" ON public.respondents FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update respondents" ON public.respondents FOR UPDATE USING (true);

CREATE POLICY "Admin can view all scores" ON public.computed_scores FOR SELECT USING (true);
CREATE POLICY "Admin can insert scores" ON public.computed_scores FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can view all narratives" ON public.narrative_insights FOR SELECT USING (true);
CREATE POLICY "Admin can insert narratives" ON public.narrative_insights FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_respondents_email ON public.respondents(email);
CREATE INDEX idx_computed_scores_respondent ON public.computed_scores(respondent_id);
CREATE INDEX idx_narrative_insights_respondent ON public.narrative_insights(respondent_id);