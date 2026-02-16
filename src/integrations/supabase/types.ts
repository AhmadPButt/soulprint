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
      ai_conversations: {
        Row: {
          ended_at: string | null
          escalated_at: string | null
          escalated_to_human: boolean | null
          escalation_reason: string | null
          human_agent_id: string | null
          id: string
          started_at: string | null
          trip_id: string
          user_id: string
        }
        Insert: {
          ended_at?: string | null
          escalated_at?: string | null
          escalated_to_human?: boolean | null
          escalation_reason?: string | null
          human_agent_id?: string | null
          id?: string
          started_at?: string | null
          trip_id: string
          user_id: string
        }
        Update: {
          ended_at?: string | null
          escalated_at?: string | null
          escalated_to_human?: boolean | null
          escalation_reason?: string | null
          human_agent_id?: string | null
          id?: string
          started_at?: string | null
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          message_text: string
          metadata: Json | null
          sender: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          message_text: string
          metadata?: Json | null
          sender: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          message_text?: string
          metadata?: Json | null
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          event_type: string
          id: string
          metadata: Json | null
          page_url: string | null
          session_id: string | null
          timestamp: string | null
          trip_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          event_type: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          session_id?: string | null
          timestamp?: string | null
          trip_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          metadata?: Json | null
          page_url?: string | null
          session_id?: string | null
          timestamp?: string | null
          trip_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
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
      destination_info: {
        Row: {
          cultural_customs: string | null
          currency: string | null
          destination_id: string
          dress_code: string | null
          embassy_contact: string | null
          emergency_numbers: Json | null
          id: string
          language_basics: string | null
          local_customs: string | null
          safety_tips: string | null
          timezone: string | null
          tipping_etiquette: string | null
          updated_at: string | null
          voltage: string | null
        }
        Insert: {
          cultural_customs?: string | null
          currency?: string | null
          destination_id: string
          dress_code?: string | null
          embassy_contact?: string | null
          emergency_numbers?: Json | null
          id?: string
          language_basics?: string | null
          local_customs?: string | null
          safety_tips?: string | null
          timezone?: string | null
          tipping_etiquette?: string | null
          updated_at?: string | null
          voltage?: string | null
        }
        Update: {
          cultural_customs?: string | null
          currency?: string | null
          destination_id?: string
          dress_code?: string | null
          embassy_contact?: string | null
          emergency_numbers?: Json | null
          id?: string
          language_basics?: string | null
          local_customs?: string | null
          safety_tips?: string | null
          timezone?: string | null
          tipping_etiquette?: string | null
          updated_at?: string | null
          voltage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "destination_info_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: true
            referencedRelation: "echoprint_destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      destination_matches: {
        Row: {
          actual_satisfaction: number | null
          clicked_at: string | null
          clicked_by_user: boolean | null
          context_intake_id: string | null
          created_at: string | null
          destination_id: string
          fit_breakdown: Json
          fit_score: number
          id: string
          prediction_accuracy: number | null
          rank: number
          respondent_id: string
          shown_to_user: boolean | null
        }
        Insert: {
          actual_satisfaction?: number | null
          clicked_at?: string | null
          clicked_by_user?: boolean | null
          context_intake_id?: string | null
          created_at?: string | null
          destination_id: string
          fit_breakdown: Json
          fit_score: number
          id?: string
          prediction_accuracy?: number | null
          rank: number
          respondent_id: string
          shown_to_user?: boolean | null
        }
        Update: {
          actual_satisfaction?: number | null
          clicked_at?: string | null
          clicked_by_user?: boolean | null
          context_intake_id?: string | null
          created_at?: string | null
          destination_id?: string
          fit_breakdown?: Json
          fit_score?: number
          id?: string
          prediction_accuracy?: number | null
          rank?: number
          respondent_id?: string
          shown_to_user?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "destination_matches_context_intake_id_fkey"
            columns: ["context_intake_id"]
            isOneToOne: false
            referencedRelation: "context_intake"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "destination_matches_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "echoprint_destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "destination_matches_respondent_id_fkey"
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
          trip_id: string | null
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
          trip_id?: string | null
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
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mood_logs_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: false
            referencedRelation: "respondents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mood_logs_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
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
      trip_bookings: {
        Row: {
          booking_date: string | null
          booking_time: string | null
          booking_type: string
          confirmation_number: string | null
          contact_email: string | null
          contact_phone: string | null
          cost_gbp: number | null
          created_at: string | null
          currency: string | null
          id: string
          location_address: string | null
          location_name: string | null
          notes: string | null
          provider_name: string | null
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          booking_date?: string | null
          booking_time?: string | null
          booking_type: string
          confirmation_number?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cost_gbp?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          location_address?: string | null
          location_name?: string | null
          notes?: string | null
          provider_name?: string | null
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          booking_date?: string | null
          booking_time?: string | null
          booking_type?: string
          confirmation_number?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cost_gbp?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          location_address?: string | null
          location_name?: string | null
          notes?: string | null
          provider_name?: string | null
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_documents: {
        Row: {
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          notes: string | null
          trip_id: string
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          notes?: string | null
          trip_id: string
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          notes?: string | null
          trip_id?: string
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_documents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_members: {
        Row: {
          accepted_at: string | null
          email: string
          id: string
          invitation_status: string | null
          invitation_token: string | null
          invited_at: string | null
          respondent_id: string | null
          role: string | null
          trip_id: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          email: string
          id?: string
          invitation_status?: string | null
          invitation_token?: string | null
          invited_at?: string | null
          respondent_id?: string | null
          role?: string | null
          trip_id: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          email?: string
          id?: string
          invitation_status?: string | null
          invitation_token?: string | null
          invited_at?: string | null
          respondent_id?: string | null
          role?: string | null
          trip_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: false
            referencedRelation: "respondents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
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
          trip_id: string | null
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
          trip_id?: string | null
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
          trip_id?: string | null
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
          {
            foreignKeyName: "trip_reflections_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          budget_range: string | null
          consultation_booked: boolean | null
          consultation_date: string | null
          context_intake_id: string | null
          created_at: string | null
          created_by: string
          destination_id: string | null
          end_date: string | null
          fora_booking_id: string | null
          fora_itinerary_url: string | null
          id: string
          itinerary_id: string | null
          respondent_id: string | null
          start_date: string | null
          status: string | null
          trip_name: string
          trip_type: string
          updated_at: string | null
        }
        Insert: {
          budget_range?: string | null
          consultation_booked?: boolean | null
          consultation_date?: string | null
          context_intake_id?: string | null
          created_at?: string | null
          created_by: string
          destination_id?: string | null
          end_date?: string | null
          fora_booking_id?: string | null
          fora_itinerary_url?: string | null
          id?: string
          itinerary_id?: string | null
          respondent_id?: string | null
          start_date?: string | null
          status?: string | null
          trip_name: string
          trip_type?: string
          updated_at?: string | null
        }
        Update: {
          budget_range?: string | null
          consultation_booked?: boolean | null
          consultation_date?: string | null
          context_intake_id?: string | null
          created_at?: string | null
          created_by?: string
          destination_id?: string | null
          end_date?: string | null
          fora_booking_id?: string | null
          fora_itinerary_url?: string | null
          id?: string
          itinerary_id?: string | null
          respondent_id?: string | null
          start_date?: string | null
          status?: string | null
          trip_name?: string
          trip_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_context_intake_id_fkey"
            columns: ["context_intake_id"]
            isOneToOne: false
            referencedRelation: "context_intake"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "echoprint_destinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_itinerary_id_fkey"
            columns: ["itinerary_id"]
            isOneToOne: false
            referencedRelation: "itineraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_respondent_id_fkey"
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
      user_is_trip_creator: {
        Args: { _trip_id: string; _user_id: string }
        Returns: boolean
      }
      user_is_trip_member: {
        Args: { _trip_id: string; _user_id: string }
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
