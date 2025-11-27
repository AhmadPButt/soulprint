import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { respondent_id, force_regenerate = false, edit_suggestions } = await req.json();
    
    if (!respondent_id) {
      throw new Error("respondent_id is required");
    }

    // Import Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Check if itinerary already exists (unless force regenerate or editing)
    if (!force_regenerate && !edit_suggestions) {
      const { data: existingItinerary, error: fetchError } = await supabaseClient
        .from('itineraries')
        .select('*')
        .eq('respondent_id', respondent_id)
        .single();

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

    const computed = respondent.computed_scores?.[0];
    const narrative = respondent.narrative_insights?.[0];

    if (!computed) {
      throw new Error("Computed scores not found. Please compute SoulPrint first.");
    }

    // Fetch existing itinerary if editing
    let existingItinerary = null;
    if (edit_suggestions) {
      const { data: itineraryData } = await supabaseClient
        .from('itineraries')
        .select('itinerary_data')
        .eq('respondent_id', respondent_id)
        .single();
      
      existingItinerary = itineraryData?.itinerary_data;
    }

    // Build comprehensive prompt for itinerary generation
    let userPrompt = edit_suggestions 
      ? `Based on the following psychological profile and the ADMIN'S EDIT SUGGESTIONS, UPDATE the existing itinerary for Azerbaijan.
      
ADMIN EDIT SUGGESTIONS:
${edit_suggestions}

EXISTING ITINERARY (MUST KEEP ALL DAYS AND UPDATE ONLY AS REQUESTED):
${JSON.stringify(existingItinerary, null, 2)}

CRITICAL: Return the COMPLETE itinerary with ALL 7 DAYS. Only modify the specific parts mentioned in the edit suggestions. Keep all other days, activities, and details exactly as they are in the existing itinerary.

Apply these suggestions while maintaining the psychological alignment and luxury experience. Make specific changes requested while keeping the overall structure coherent.

Original context:`
      : `Based on the following psychological profile and travel preferences, create a detailed 7-day luxury itinerary for Azerbaijan:`;

    userPrompt += `

TRAVELER PROFILE:
Name: ${respondent.name}
Tribe: ${computed.tribe}
Dominant Element: ${computed.dominant_element}
Secondary Element: ${computed.secondary_element}

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

BUSINESS INSIGHTS:
- Azerbaijan Alignment: ${computed.eai_azerbaijan}%
- NPS Prediction: ${computed.nps_predicted}/10 (${computed.nps_tier})
- Spend Propensity: ${computed.spi_tier}
- Upsell Receptivity: ${computed.urs_tier}

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

Generate a luxury 7-day itinerary for Azerbaijan that:
1. Aligns with their elemental resonance and psychological profile
2. Matches their adventure orientation and spontaneity levels
3. Addresses their core motivations (${computed.top_motivation_1}, ${computed.top_motivation_2})
4. Respects their travel preferences
5. Includes specific locations in Azerbaijan with exact coordinates
6. Balances their needs across the Fire/Water/Stone/Urban/Desert spectrum

Return the itinerary in this JSON structure:
{
  "title": "Compelling itinerary title reflecting their tribe and motivations",
  "overview": "2-3 sentence overview of the journey's theme",
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "theme": "What this day represents psychologically",
      "locations": [
        {
          "name": "Location name",
          "coordinates": [longitude, latitude],
          "time": "Morning/Afternoon/Evening",
          "activity": "Specific activity description",
          "psychological_alignment": "How this connects to their profile",
          "element": "fire/water/stone/urban/desert"
        }
      ],
      "accommodation": {
        "name": "Hotel/guesthouse name",
        "coordinates": [longitude, latitude],
        "type": "luxury/boutique/traditional",
        "why": "Why this suits them"
      },
      "meals": ["Breakfast location/style", "Lunch suggestion", "Dinner experience"]
    }
  ],
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
  }
}

IMPORTANT AZERBAIJAN LOCATIONS TO CONSIDER (with real coordinates):
- Baku Old City (Icherisheher): [49.8373, 40.3656]
- Flame Towers: [49.8366, 40.3586]
- Gobustan Rock Art: [49.3892, 40.0989]
- Mud Volcanoes: [49.4008, 40.0234]
- Ateshgah Fire Temple: [50.0097, 40.4127]
- Yanar Dag (Burning Mountain): [49.8917, 40.5019]
- Lahij Village: [48.3919, 40.8489]
- Sheki Khan's Palace: [47.1906, 41.2119]
- Quba: [48.5131, 41.3614]
- Khinaliq Village: [48.1419, 41.2017]
- Shahdag Mountain Resort: [48.0947, 41.3169]
- Gabala: [47.8453, 40.9811]

Ensure all activities, accommodations, and experiences are real and bookable in Azerbaijan.`;

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
            content: "You are an expert luxury travel designer for Erranza, specializing in psychologically-aligned travel experiences in Azerbaijan. Return only valid JSON."
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
      // Update existing itinerary
      const { data: updateData, error: updateError } = await supabaseClient
        .from('itineraries')
        .update({ itinerary_data: parsedItinerary })
        .eq('respondent_id', respondent_id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating itinerary:', updateError);
        throw updateError;
      }
      itineraryId = updateData.id;
      console.log('Itinerary updated in database');
    } else {
      // Insert new itinerary or update if exists
      const { data: upsertData, error: upsertError } = await supabaseClient
        .from('itineraries')
        .upsert(
          { 
            respondent_id: respondent_id, 
            itinerary_data: parsedItinerary 
          },
          { onConflict: 'respondent_id' }
        )
        .select()
        .single();

      if (upsertError) {
        console.error('Error saving itinerary:', upsertError);
        throw upsertError;
      }
      itineraryId = upsertData.id;
      console.log('Itinerary saved to database');
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
        error: error.message || "Failed to generate itinerary",
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
