import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function validateAuth(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }
  return { userId: data.user.id };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authResult = await validateAuth(req);
    if (authResult instanceof Response) return authResult;

    const { 
      respondent_id, trip_id, force_regenerate = false, edit_suggestions,
      destination_id, destination_name, destination_country, 
      destination_description, destination_highlights, duration_days
    } = await req.json();
    
    if (!respondent_id) {
      throw new Error("respondent_id is required");
    }

    // Input length validation
    if (edit_suggestions && (typeof edit_suggestions !== 'string' || edit_suggestions.length > 2000)) {
      return new Response(
        JSON.stringify({ error: 'edit_suggestions must be under 2000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Verify ownership: respondent must belong to authenticated user
    const { data: ownerCheck } = await supabaseClient
      .from('respondents')
      .select('user_id')
      .eq('id', respondent_id)
      .single();

    if (!ownerCheck || ownerCheck.user_id !== authResult.userId) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if itinerary already exists for this trip (unless force regenerate or editing)
    if (!force_regenerate && !edit_suggestions) {
      // Look up by trip_id first (preferred), fallback to respondent_id for legacy
      let existingQuery = supabaseClient.from('itineraries').select('*');
      if (trip_id) {
        existingQuery = existingQuery.eq('trip_id', trip_id);
      } else {
        existingQuery = existingQuery.eq('respondent_id', respondent_id);
      }
      const { data: existingItinerary, error: fetchError } = await existingQuery.maybeSingle();

      if (existingItinerary && !fetchError) {
        console.log('Returning existing itinerary');
        return new Response(
          JSON.stringify({ 
            itinerary: existingItinerary.itinerary_data,
            itinerary_id: existingItinerary.id 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch respondent data with computed scores and narrative
    const { data: respondent, error: respondentError } = await supabaseClient
      .from('respondents')
      .select(`
        *,
        computed_scores (*),
        narrative_insights (*)
      `)
      .eq('id', respondent_id)
      .single();

    if (respondentError || !respondent) {
      throw new Error("Respondent not found");
    }

    let computed = respondent.computed_scores?.[0];
    const narrative = respondent.narrative_insights?.[0];

    // If no computed scores, trigger compute-soulprint first
    if (!computed) {
      console.log("No computed scores found, triggering compute-soulprint...");
      const computeResponse = await fetch(`${supabaseUrl}/functions/v1/compute-soulprint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ respondent_id }),
      });

      if (!computeResponse.ok) {
        const errText = await computeResponse.text();
        console.error("compute-soulprint failed:", errText);
        throw new Error("Failed to compute SoulPrint scores. Please try again.");
      }

      // Re-fetch computed scores
      const { data: freshScores } = await supabaseClient
        .from('computed_scores')
        .select('*')
        .eq('respondent_id', respondent_id)
        .single();

      if (!freshScores) {
        throw new Error("Could not compute SoulPrint scores. Please complete the questionnaire first.");
      }
      computed = freshScores;
      console.log("SoulPrint computed successfully");
    }

    // Fetch existing itinerary if editing
    let existingItinerary = null;
    if (edit_suggestions) {
      let editQuery = supabaseClient.from('itineraries').select('itinerary_data');
      if (trip_id) {
        editQuery = editQuery.eq('trip_id', trip_id);
      } else {
        editQuery = editQuery.eq('respondent_id', respondent_id);
      }
      const { data: itineraryData } = await editQuery.maybeSingle();
      existingItinerary = itineraryData?.itinerary_data;
    }

    // Determine destination context
    const destName = destination_name || 'your matched destination';
    const destCountry = destination_country || '';
    const destDesc = destination_description || '';
    const destHighlights = destination_highlights || [];
    const numDays = duration_days || 7;

    // Build comprehensive prompt for itinerary generation
    let userPrompt = edit_suggestions 
      ? `Based on the following psychological profile and the ADMIN'S EDIT SUGGESTIONS, UPDATE the existing itinerary for ${destName}.
      
ADMIN EDIT SUGGESTIONS:
${edit_suggestions}

EXISTING ITINERARY (MUST KEEP ALL DAYS AND UPDATE ONLY AS REQUESTED):
${JSON.stringify(existingItinerary, null, 2)}

CRITICAL: Return the COMPLETE itinerary with ALL days. Only modify the specific parts mentioned in the edit suggestions.

Original context:`
      : `Based on the following psychological profile and travel preferences, create a detailed ${numDays}-day personalized itinerary for ${destName}, ${destCountry}:`;

    if (destDesc) {
      userPrompt += `

DESTINATION CONTEXT:
${destDesc}
Key features: ${destHighlights.join(', ')}
`;
    }

    userPrompt += `

TRAVELER PROFILE:
Name: ${respondent.name}
${computed.tribe ? `Tribe: ${computed.tribe}` : ''}
${computed.dominant_element ? `Dominant Element: ${computed.dominant_element}` : ''}
${computed.secondary_element ? `Secondary Element: ${computed.secondary_element}` : ''}

PERSONALITY TRAITS (0-100 scale):
- Extraversion: ${computed.extraversion}
- Openness: ${computed.openness}
- Conscientiousness: ${computed.conscientiousness}
- Agreeableness: ${computed.agreeableness}
- Emotional Stability: ${computed.emotional_stability}

TRAVEL BEHAVIOR:
- Spontaneity & Flexibility: ${computed.spontaneity_flexibility}
- Adventure Orientation: ${computed.adventure_orientation}
- Environmental Adaptation: ${computed.environmental_adaptation}
- Travel Freedom Index: ${computed.travel_freedom_index}

INNER COMPASS & MOTIVATIONS:
- Primary Motivation: ${computed.top_motivation_1}
- Secondary Motivation: ${computed.top_motivation_2}
- Life Phase: ${computed.life_phase}
- Seeking: ${computed.shift_desired}

ELEMENTAL RESONANCE:
- Fire (Adventure/Intensity): ${computed.fire_score}
- Water (Flow/Ease): ${computed.water_score}
- Stone (Stability/Heritage): ${computed.stone_score}
- Urban (Modernity/Culture): ${computed.urban_score}
- Desert (Solitude/Reflection): ${computed.desert_score}

TRAVEL PREFERENCES:
- Room Type: ${respondent.room_type || 'Not specified'}
- Dietary: ${respondent.dietary_preferences || 'None specified'}
- Travel Companion: ${respondent.travel_companion || 'Solo'}

${narrative ? `
PSYCHOLOGICAL NARRATIVE:
${narrative.soulprint_summary}

TRAVELER ARCHETYPE:
${narrative.traveler_archetype}

GROWTH EDGES:
${narrative.growth_edges}
` : ''}

Generate a ${numDays}-day itinerary for ${destName}, ${destCountry} that:
1. Aligns with their elemental resonance and psychological profile
2. Matches their adventure orientation and spontaneity levels
3. Addresses their core motivations (${computed.top_motivation_1}, ${computed.top_motivation_2})
4. Respects their travel preferences and pace
5. Balances their needs across the personality spectrum

Return the itinerary in this JSON structure:
{
  "title": "Compelling itinerary title reflecting their personality",
  "overview": "2-3 sentence overview of the journey's theme",
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "theme": "What this day represents psychologically",
      "morning": {
      "activity": "Specific activity description",
        "why_it_fits": "How this connects to their profile",
        "time": "9:00 AM",
        "estimated_cost_gbp": 50
      },
      "afternoon": {
        "activity": "Specific activity description",
        "why_it_fits": "How this connects to their profile",
        "time": "2:00 PM",
        "estimated_cost_gbp": 80
      },
      "evening": {
        "activity": "Specific activity description",
        "why_it_fits": "How this connects to their profile",
        "time": "7:00 PM",
        "estimated_cost_gbp": 120
      },
      "accommodation": {
        "name": "Hotel/guesthouse name",
        "type": "luxury/boutique/traditional",
        "why": "Why this suits them",
        "estimated_cost_gbp": 250
      },
      "daily_total_gbp": 500,
      "meals": ["Breakfast suggestion", "Lunch suggestion", "Dinner experience"]
    }
  ],
  "accommodations": {
    "recommendation": "Overall accommodation style recommendation",
    "why": "Why this style suits the traveler"
  },
  "total_estimated_cost": 2800,
  "packing_tips": ["tip1", "tip2"],
  "practical_notes": {
    "dietary_accommodations": "How dietary preferences are handled",
    "pacing": "How the itinerary matches their energy levels",
    "flexibility": "Built-in flexibility for spontaneous changes",
    "companion_considerations": "How the itinerary works for their travel companion type"
  },
  "psychological_insights": {
    "transformation_arc": "How this journey facilitates their desired transformation",
    "growth_opportunities": "Specific moments designed for growth",
    "comfort_balance": "How we balance challenge and comfort"
  },
  "notes": "Any additional notes"
}

Ensure all activities, accommodations, and experiences are real and bookable in ${destName}, ${destCountry}.`;

    console.log("Generating itinerary with prompt...");

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert luxury travel designer for Erranza, specializing in psychologically-aligned travel experiences worldwide. You create personalized itineraries for ${destName}, ${destCountry}. Return only valid JSON.`
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API Error:", aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices[0].message.content;

    console.log("AI Response received:", generatedText.substring(0, 200));

    // Parse JSON from response
    let parsedItinerary;
    try {
      const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || 
                        generatedText.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : generatedText;
      parsedItinerary = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      throw new Error("Failed to parse itinerary from AI response");
    }

    console.log("Itinerary generated successfully");

    // Save or update itinerary in database
    let itineraryId;
    if (edit_suggestions) {
      // Update existing itinerary (trip-scoped or respondent-scoped)
      let updateQuery = supabaseClient.from('itineraries').update({ itinerary_data: parsedItinerary });
      if (trip_id) {
        updateQuery = updateQuery.eq('trip_id', trip_id);
      } else {
        updateQuery = updateQuery.eq('respondent_id', respondent_id);
      }
      const { data: updateData, error: updateError } = await updateQuery.select().single();
      if (updateError) {
        console.error('Error updating itinerary:', updateError);
        throw updateError;
      }
      itineraryId = updateData.id;
      console.log('Itinerary updated in database');
    } else {
      if (trip_id) {
        // Trip-scoped: check if one already exists for this trip, update or insert
        const { data: existingForTrip } = await supabaseClient
          .from('itineraries')
          .select('id')
          .eq('trip_id', trip_id)
          .maybeSingle();

        let saveResult;
        if (existingForTrip) {
          saveResult = await supabaseClient
            .from('itineraries')
            .update({ itinerary_data: parsedItinerary, respondent_id })
            .eq('id', existingForTrip.id)
            .select()
            .single();
        } else {
          saveResult = await supabaseClient
            .from('itineraries')
            .insert({ respondent_id, trip_id, itinerary_data: parsedItinerary })
            .select()
            .single();
        }
        if (saveResult.error) {
          console.error('Error saving itinerary:', saveResult.error);
          throw saveResult.error;
        }
        itineraryId = saveResult.data.id;
      } else {
        // Legacy fallback: check if a null-trip_id itinerary exists for this respondent, update or insert
        const { data: existingLegacy } = await supabaseClient
          .from('itineraries')
          .select('id')
          .eq('respondent_id', respondent_id)
          .is('trip_id', null)
          .maybeSingle();

        let legacyResult;
        if (existingLegacy) {
          legacyResult = await supabaseClient
            .from('itineraries')
            .update({ itinerary_data: parsedItinerary })
            .eq('id', existingLegacy.id)
            .select()
            .single();
        } else {
          legacyResult = await supabaseClient
            .from('itineraries')
            .insert({ respondent_id, itinerary_data: parsedItinerary })
            .select()
            .single();
        }
        if (legacyResult.error) {
          console.error('Error saving itinerary:', legacyResult.error);
          throw legacyResult.error;
        }
        itineraryId = legacyResult.data.id;
      }
      console.log('Itinerary saved to database, id:', itineraryId);
    }

    return new Response(
      JSON.stringify({ 
        itinerary: parsedItinerary,
        itinerary_id: itineraryId 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error("Error in generate-itinerary:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate itinerary"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
