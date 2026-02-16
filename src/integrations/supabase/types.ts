export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      computed_scores: {
        Row: {
          adventure_orientation: number | null
          agreeableness: number | null
          aliveness: number | null
          cgs: number | null
          cgs_tier: string | null
          clarity: number | null
          completion_need: string | null
          computed_at: string
          connection: number | null
          conscientiousness: number | null
          content_flag: boolean | null
          crs: number | null
          crs_tier: string | null
          desert_score: number | null
          dominant_element: string | null
          eai_azerbaijan: number | null
          emotional_burden_index: number | null
          emotional_stability: number | null
          emotional_travel_index: number | null
          environmental_adaptation: number | null
          extraversion: number | null
          fire_score: number | null
          gfi: number | null
          gfi_tier: string | null
          id: string
          life_phase: string | null
          nps_predicted: number | null
          nps_tier: string | null
          openness: number | null
          respondent_id: string | null
          risk_flag: string | null
          secondary_element: string | null
          shift_desired: string | null
          spi: number | null
          spi_tier: string | null
          spontaneity_flexibility: number | null
          stone_score: number | null
          t_elements: number | null
          t_flow: number | null
          t_risk: number | null
          t_social: number | null
          t_tempo: number | null
          top_motivation_1: string | null
          top_motivation_2: string | null
          transformation: number | null
          travel_freedom_index: number | null
          tribe: string | null
          tribe_confidence: string | null
          upsell_priority: string | null
          urban_score: number | null
          urs: number | null
          urs_tier: string | null
          water_score: number | null
        }
        Insert: {
          adventure_orientation?: number | null
          agreeableness?: number | null
          aliveness?: number | null
          cgs?: number | null
          cgs_tier?: string | null
          clarity?: number | null
          completion_need?: string | null
          computed_at?: string
          connection?: number | null
          conscientiousness?: number | null
          content_flag?: boolean | null
          crs?: number | null
          crs_tier?: string | null
          desert_score?: number | null
          dominant_element?: string | null
          eai_azerbaijan?: number | null
          emotional_burden_index?: number | null
          emotional_stability?: number | null
          emotional_travel_index?: number | null
          environmental_adaptation?: number | null
          extraversion?: number | null
          fire_score?: number | null
          gfi?: number | null
          gfi_tier?: string | null
          id?: string
          life_phase?: string | null
          nps_predicted?: number | null
          nps_tier?: string | null
          openness?: number | null
          respondent_id?: string | null
          risk_flag?: string | null
          secondary_element?: string | null
          shift_desired?: string | null
          spi?: number | null
          spi_tier?: string | null
          spontaneity_flexibility?: number | null
          stone_score?: number | null
          t_elements?: number | null
          t_flow?: number | null
          t_risk?: number | null
          t_social?: number | null
          t_tempo?: number | null
          top_motivation_1?: string | null
          top_motivation_2?: string | null
          transformation?: number | null
          travel_freedom_index?: number | null
          tribe?: string | null
          tribe_confidence?: string | null
          upsell_priority?: string | null
          urban_score?: number | null
          urs?: number | null
          urs_tier?: string | null
          water_score?: number | null
        }
        Update: {
          adventure_orientation?: number | null
          agreeableness?: number | null
          aliveness?: number | null
          cgs?: number | null
          cgs_tier?: string | null
          clarity?: number | null
          completion_need?: string | null
          computed_at?: string
          connection?: number | null
          conscientiousness?: number | null
          content_flag?: boolean | null
          crs?: number | null
          crs_tier?: string | null
          desert_score?: number | null
          dominant_element?: string | null
          eai_azerbaijan?: number | null
          emotional_burden_index?: number | null
          emotional_stability?: number | null
          emotional_travel_index?: number | null
          environmental_adaptation?: number | null
          extraversion?: number | null
          fire_score?: number | null
          gfi?: number | null
          gfi_tier?: string | null
          id?: string
          life_phase?: string | null
          nps_predicted?: number | null
          nps_tier?: string | null
          openness?: number | null
          respondent_id?: string | null
          risk_flag?: string | null
          secondary_element?: string | null
          shift_desired?: string | null
          spi?: number | null
          spi_tier?: string | null
          spontaneity_flexibility?: number | null
          stone_score?: number | null
          t_elements?: number | null
          t_flow?: number | null
          t_risk?: number | null
          t_social?: number | null
          t_tempo?: number | null
          top_motivation_1?: string | null
          top_motivation_2?: string | null
          transformation?: number | null
          travel_freedom_index?: number | null
          tribe?: string | null
          tribe_confidence?: string | null
          upsell_priority?: string | null
          urban_score?: number | null
          urs?: number | null
          urs_tier?: string | null
          water_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "computed_scores_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: false
            referencedRelation: "respondents"
            referencedColumns: ["id"]
          },
        ]
      }
      context_intake: {
        Row: {
          budget_range: string | null
          completed: boolean | null
          created_at: string
          desired_outcome: string | null
          duration: string | null
          geographic_constraint: string | null
          geographic_value: string | null
          id: string
          occasion: string | null
          party_composition: Json | null
          respondent_id: string | null
          timeline: string | null
          travel_dates: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_range?: string | null
          completed?: boolean | null
          created_at?: string
          desired_outcome?: string | null
          duration?: string | null
          geographic_constraint?: string | null
          geographic_value?: string | null
          id?: string
          occasion?: string | null
          party_composition?: Json | null
          respondent_id?: string | null
          timeline?: string | null
          travel_dates?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_range?: string | null
          completed?: boolean | null
          created_at?: string
          desired_outcome?: string | null
          duration?: string | null
          geographic_constraint?: string | null
          geographic_value?: string | null
          id?: string
          occasion?: string | null
          party_composition?: Json | null
          respondent_id?: string | null
          timeline?: string | null
          travel_dates?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "context_intake_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: false
            referencedRelation: "respondents"
            referencedColumns: ["id"]
          },
        ]
      }
      echoprint_destinations: {
        Row: {
          achievement_score: number | null
          avg_cost_per_day_gbp: number | null
          best_time_to_visit: string | null
          climate_tags: string[] | null
          country: string
          created_at: string | null
          culinary_score: number | null
          cultural_score: number | null
          cultural_sensory_score: number | null
          description: string | null
          flight_time_from_uk_hours: number | null
          highlights: string[] | null
          id: string
          image_credit: string | null
          image_url: string | null
          is_active: boolean | null
          luxury_style_score: number | null
          name: string
          nature_score: number | null
          region: string
          restorative_score: number | null
          short_description: string | null
          social_vibe_score: number | null
          tier: string | null
          updated_at: string | null
          visual_score: number | null
          wellness_score: number | null
        }
        Insert: {
          achievement_score?: number | null
          avg_cost_per_day_gbp?: number | null
          best_time_to_visit?: string | null
          climate_tags?: string[] | null
          country: string
          created_at?: string | null
          culinary_score?: number | null
          cultural_score?: number | null
          cultural_sensory_score?: number | null
          description?: string | null
          flight_time_from_uk_hours?: number | null
          highlights?: string[] | null
          id?: string
          image_credit?: string | null
          image_url?: string | null
          is_active?: boolean | null
          luxury_style_score?: number | null
          name: string
          nature_score?: number | null
          region: string
          restorative_score?: number | null
          short_description?: string | null
          social_vibe_score?: number | null
          tier?: string | null
          updated_at?: string | null
          visual_score?: number | null
          wellness_score?: number | null
        }
        Update: {
          achievement_score?: number | null
          avg_cost_per_day_gbp?: number | null
          best_time_to_visit?: string | null
          climate_tags?: string[] | null
          country?: string
          created_at?: string | null
          culinary_score?: number | null
          cultural_score?: number | null
          cultural_sensory_score?: number | null
          description?: string | null
          flight_time_from_uk_hours?: number | null
          highlights?: string[] | null
          id?: string
          image_credit?: string | null
          image_url?: string | null
          is_active?: boolean | null
          luxury_style_score?: number | null
          name?: string
          nature_score?: number | null
          region?: string
          restorative_score?: number | null
          short_description?: string | null
          social_vibe_score?: number | null
          tier?: string | null
          updated_at?: string | null
          visual_score?: number | null
          wellness_score?: number | null
        }
        Relationships: []
      }
      group_itineraries: {
        Row: {
          created_at: string
          group_id: string
          id: string
          itinerary_data: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          itinerary_data: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          itinerary_data?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_itineraries_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: true
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          respondent_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          respondent_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          respondent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: false
            referencedRelation: "respondents"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          join_code: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          join_code: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          join_code?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "respondents"
            referencedColumns: ["id"]
          },
        ]
      }
      itineraries: {
        Row: {
          created_at: string
          id: string
          itinerary_data: Json
          respondent_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          itinerary_data: Json
          respondent_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          itinerary_data?: Json
          respondent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itineraries_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: true
            referencedRelation: "respondents"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_discussions: {
        Row: {
          activity_reference: string | null
          comment_text: string
          comment_type: string
          created_at: string
          day_reference: number | null
          group_itinerary_id: string | null
          id: string
          itinerary_id: string | null
          parent_comment_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_reference?: string | null
          comment_text: string
          comment_type?: string
          created_at?: string
          day_reference?: number | null
          group_itinerary_id?: string | null
          id?: string
          itinerary_id?: string | null
          parent_comment_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_reference?: string | null
          comment_text?: string
          comment_type?: string
          created_at?: string
          day_reference?: number | null
          group_itinerary_id?: string | null
          id?: string
          itinerary_id?: string | null
          parent_comment_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_discussions_group_itinerary_id_fkey"
            columns: ["group_itinerary_id"]
            isOneToOne: false
            referencedRelation: "group_itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_discussions_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_discussions_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "itinerary_discussions"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_polls: {
        Row: {
          activity_reference: string | null
          closes_at: string | null
          created_at: string
          created_by: string
          day_reference: number | null
          group_itinerary_id: string | null
          id: string
          is_active: boolean
          itinerary_id: string | null
          options: Json
          poll_type: string
          question: string
        }
        Insert: {
          activity_reference?: string | null
          closes_at?: string | null
          created_at?: string
          created_by: string
          day_reference?: number | null
          group_itinerary_id?: string | null
          id?: string
          is_active?: boolean
          itinerary_id?: string | null
          options: Json
          poll_type?: string
          question: string
        }
        Update: {
          activity_reference?: string | null
          closes_at?: string | null
          created_at?: string
          created_by?: string
          day_reference?: number | null
          group_itinerary_id?: string | null
          id?: string
          is_active?: boolean
          itinerary_id?: string | null
          options?: Json
          poll_type?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_polls_group_itinerary_id_fkey"
            columns: ["group_itinerary_id"]
            isOneToOne: false
            referencedRelation: "group_itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_polls_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_insights: {
        Row: {
          emotional_patterns: Json | null
          generated_at: string
          id: string
          insights_text: string
          model_used: string | null
          recommendations: string | null
          respondent_id: string
        }
        Insert: {
          emotional_patterns?: Json | null
          generated_at?: string
          id?: string
          insights_text: string
          model_used?: string | null
          recommendations?: string | null
          respondent_id: string
        }
        Update: {
          emotional_patterns?: Json | null
          generated_at?: string
          id?: string
          insights_text?: string
          model_used?: string | null
          recommendations?: string | null
          respondent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_insights_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: false
            referencedRelation: "respondents"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_logs: {
        Row: {
          activity_reference: string | null
          created_at: string
          emotions: Json | null
          id: string
          location: string | null
          logged_at: string
          mood_score: number
          notes: string | null
          respondent_id: string
        }
        Insert: {
          activity_reference?: string | null
          created_at?: string
          emotions?: Json | null
          id?: string
          location?: string | null
          logged_at?: string
          mood_score: number
          notes?: string | null
          respondent_id: string
        }
        Update: {
          activity_reference?: string | null
          created_at?: string
          emotions?: Json | null
          id?: string
          location?: string | null
          logged_at?: string
          mood_score?: number
          notes?: string | null
          respondent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_logs_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: false
            referencedRelation: "respondents"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_insights: {
        Row: {
          computed_scores_id: string | null
          generated_at: string
          group_compatibility_notes: string | null
          growth_edges: string | null
          guide_briefing: string | null
          headline: string | null
          id: string
          journey_recommendations: string | null
          model_used: string | null
          prompt_version: string | null
          regeneration_count: number | null
          respondent_id: string | null
          soulprint_summary: string | null
          tagline: string | null
          traveler_archetype: string | null
          user_rating: number | null
        }
        Insert: {
          computed_scores_id?: string | null
          generated_at?: string
          group_compatibility_notes?: string | null
          growth_edges?: string | null
          guide_briefing?: string | null
          headline?: string | null
          id?: string
          journey_recommendations?: string | null
          model_used?: string | null
          prompt_version?: string | null
          regeneration_count?: number | null
          respondent_id?: string | null
          soulprint_summary?: string | null
          tagline?: string | null
          traveler_archetype?: string | null
          user_rating?: number | null
        }
        Update: {
          computed_scores_id?: string | null
          generated_at?: string
          group_compatibility_notes?: string | null
          growth_edges?: string | null
          guide_briefing?: string | null
          headline?: string | null
          id?: string
          journey_recommendations?: string | null
          model_used?: string | null
          prompt_version?: string | null
          regeneration_count?: number | null
          respondent_id?: string | null
          soulprint_summary?: string | null
          tagline?: string | null
          traveler_archetype?: string | null
          user_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "narrative_insights_computed_scores_id_fkey"
            columns: ["computed_scores_id"]
            isOneToOne: false
            referencedRelation: "computed_scores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "narrative_insights_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: false
            referencedRelation: "respondents"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          poll_id: string
          selected_option: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          poll_id: string
          selected_option: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          poll_id?: string
          selected_option?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "itinerary_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_analytics: {
        Row: {
          email: string | null
          event_type: string
          id: string
          metadata: Json | null
          section_number: number | null
          session_id: string
          time_spent_seconds: number | null
          timestamp: string
          variant_id: string | null
        }
        Insert: {
          email?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          section_number?: number | null
          session_id: string
          time_spent_seconds?: number | null
          timestamp?: string
          variant_id?: string | null
        }
        Update: {
          email?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          section_number?: number | null
          session_id?: string
          time_spent_seconds?: number | null
          timestamp?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questionnaire_analytics_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "questionnaire_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaire_variants: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          weight?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      respondents: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          dietary_preferences: string | null
          email: string
          id: string
          name: string
          paid_activities: boolean | null
          paid_flights: boolean | null
          paid_hotels: boolean | null
          passport_nationality: string | null
          raw_responses: Json
          room_type: string | null
          status: string | null
          travel_companion: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          dietary_preferences?: string | null
          email: string
          id?: string
          name: string
          paid_activities?: boolean | null
          paid_flights?: boolean | null
          paid_hotels?: boolean | null
          passport_nationality?: string | null
          raw_responses: Json
          room_type?: string | null
          status?: string | null
          travel_companion?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          dietary_preferences?: string | null
          email?: string
          id?: string
          name?: string
          paid_activities?: boolean | null
          paid_flights?: boolean | null
          paid_hotels?: boolean | null
          passport_nationality?: string | null
          raw_responses?: Json
          room_type?: string | null
          status?: string | null
          travel_companion?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      trip_reflections: {
        Row: {
          challenges_faced: string[] | null
          created_at: string
          favorite_moments: string[] | null
          highlights: Json | null
          id: string
          nps_score: number | null
          personal_growth: string | null
          photo_urls: Json | null
          respondent_id: string
          review_text: string | null
          trip_summary: string | null
          updated_at: string
          would_recommend: boolean | null
        }
        Insert: {
          challenges_faced?: string[] | null
          created_at?: string
          favorite_moments?: string[] | null
          highlights?: Json | null
          id?: string
          nps_score?: number | null
          personal_growth?: string | null
          photo_urls?: Json | null
          respondent_id: string
          review_text?: string | null
          trip_summary?: string | null
          updated_at?: string
          would_recommend?: boolean | null
        }
        Update: {
          challenges_faced?: string[] | null
          created_at?: string
          favorite_moments?: string[] | null
          highlights?: Json | null
          id?: string
          nps_score?: number | null
          personal_growth?: string | null
          photo_urls?: Json | null
          respondent_id?: string
          review_text?: string | null
          trip_summary?: string | null
          updated_at?: string
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_reflections_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: false
            referencedRelation: "respondents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_join_code: { Args: never; Returns: string }
      user_has_group_itinerary: {
        Args: { _group_itinerary_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_poll_access: {
        Args: { _poll_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_poll_access_v2: {
        Args: { _poll_id: string; _user_id: string }
        Returns: boolean
      }
      user_owns_itinerary: {
        Args: { _itinerary_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
