-- Add unique constraint on respondent_id to enable upsert operations
ALTER TABLE public.itineraries 
ADD CONSTRAINT itineraries_respondent_id_unique UNIQUE (respondent_id);