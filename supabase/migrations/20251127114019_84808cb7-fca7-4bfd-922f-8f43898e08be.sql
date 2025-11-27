-- Create table for A/B test variants
CREATE TABLE public.questionnaire_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  weight integer NOT NULL DEFAULT 50,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.questionnaire_variants ENABLE ROW LEVEL SECURITY;

-- Admin can view all variants
CREATE POLICY "Admin can view all variants"
ON public.questionnaire_variants
FOR SELECT
USING (true);

-- Admin can insert variants
CREATE POLICY "Admin can insert variants"
ON public.questionnaire_variants
FOR INSERT
WITH CHECK (true);

-- Admin can update variants
CREATE POLICY "Admin can update variants"
ON public.questionnaire_variants
FOR UPDATE
USING (true);

-- Admin can delete variants
CREATE POLICY "Admin can delete variants"
ON public.questionnaire_variants
FOR DELETE
USING (true);

-- Add variant_id to questionnaire_analytics
ALTER TABLE public.questionnaire_analytics
ADD COLUMN variant_id uuid REFERENCES public.questionnaire_variants(id);

-- Create index for better performance
CREATE INDEX idx_questionnaire_analytics_variant_id ON public.questionnaire_analytics(variant_id);

-- Insert default control variant
INSERT INTO public.questionnaire_variants (name, description, is_active, weight)
VALUES ('Control', 'Original questionnaire version', true, 100);