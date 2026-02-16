import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
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

    const { group_id } = await req.json();

    if (!group_id) {
      return new Response(
        JSON.stringify({ error: 'group_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', group_id)
      .single();

    if (groupError) throw groupError;

    // Get all group members with their data
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select(`
        respondent_id,
        respondents (
          id,
          name,
          email,
          raw_responses
        )
      `)
      .eq('group_id', group_id);

    if (membersError) throw membersError;
    if (!members || members.length === 0) {
      throw new Error('No members found in group');
    }

    // Get computed scores and narratives for all members
    const memberIds = members.map(m => m.respondent_id);
    
    const { data: computedScores } = await supabase
      .from('computed_scores')
      .select('*')
      .in('respondent_id', memberIds);

    const { data: narratives } = await supabase
      .from('narrative_insights')
      .select('*')
      .in('respondent_id', memberIds);

    const { data: itineraries } = await supabase
      .from('itineraries')
      .select('*')
      .in('respondent_id', memberIds);

    // Check if all members have completed their soulprints
    if (!computedScores || computedScores.length !== members.length) {
      return new Response(
        JSON.stringify({ error: 'Not all group members have completed their SoulPrints' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build comprehensive prompt for group itinerary
    const memberProfiles = members.map((member: any, index: number) => {
      const computed = computedScores.find(c => c.respondent_id === member.respondent_id);
      const narrative = narratives?.find(n => n.respondent_id === member.respondent_id);
      const itinerary = itineraries?.find(i => i.respondent_id === member.respondent_id);
      
      return {
        name: member.respondents?.name || 'Unknown',
        computed,
        narrative,
        individualItinerary: itinerary?.itinerary_data
      };
    });

    const prompt = `You are an expert luxury travel designer for Azerbaijan. Create a comprehensive group itinerary that harmonizes the preferences and personalities of all group members.

GROUP: ${group.name}
NUMBER OF TRAVELERS: ${members.length}

INDIVIDUAL MEMBER PROFILES:
${memberProfiles.map((profile: any, i: number) => `
MEMBER ${i + 1}: ${profile.name}
Personality Traits:
- Extraversion: ${profile.computed?.extraversion || 'N/A'}
- Openness: ${profile.computed?.openness || 'N/A'}
- Conscientiousness: ${profile.computed?.conscientiousness || 'N/A'}
- Adventure Orientation: ${profile.computed?.adventure_orientation || 'N/A'}
- Spontaneity: ${profile.computed?.spontaneity_flexibility || 'N/A'}

Travel Style:
- Dominant Element: ${profile.computed?.dominant_element || 'N/A'}
- Tribe: ${profile.computed?.tribe || 'N/A'}
- Top Motivations: ${profile.computed?.top_motivation_1 || 'N/A'}, ${profile.computed?.top_motivation_2 || 'N/A'}

Traveler Archetype: ${profile.narrative?.traveler_archetype || 'N/A'}
Group Compatibility Notes: ${profile.narrative?.group_compatibility_notes || 'N/A'}
`).join('\n')}

DESIGN PRINCIPLES FOR GROUP TRAVEL:
1. Balance activities to satisfy different energy levels and interests
2. Include both group bonding experiences and individual exploration time
3. Consider the group's dominant elements and shared interests
4. Plan for varied pacing - some structured days, some flexible time
5. Include activities that appeal to different personality types
6. Ensure accommodations and dining work for the entire group
7. Build in downtime for group members with different stamina levels

Create a JSON itinerary with this structure:
{
  "overview": {
    "title": "Group trip title",
    "duration": "X days",
    "groupSize": ${members.length},
    "accommodations": "Luxury hotel/villa details",
    "groupDynamics": "Analysis of how this group will travel together",
    "keyThemes": ["theme1", "theme2", "theme3"]
  },
  "days": [
    {
      "day": 1,
      "theme": "Day theme",
      "morning": {
        "activity": "Group activity",
        "rationale": "Why this works for the group",
        "flexibility": "Optional individual variations"
      },
      "afternoon": {
        "activity": "Activity",
        "rationale": "Group dynamics consideration",
        "flexibility": "Individual options"
      },
      "evening": {
        "activity": "Evening plans",
        "rationale": "Energy level consideration"
      }
    }
  ],
  "groupConsiderations": {
    "personalityBalance": "How different personalities complement each other",
    "conflictMitigation": "Potential friction points and solutions",
    "bondingOpportunities": "Specific moments designed for group connection",
    "individualNeeds": "How to honor individual preferences within group context"
  },
  "practicalDetails": {
    "transportation": "Group transportation arrangements",
    "dining": "Restaurant recommendations for groups",
    "timing": "Pacing considerations for the group",
    "contingencies": "Backup plans for different group moods/weather"
  }
}

Respond ONLY with valid JSON, no additional text.`;

    // Call AI to generate group itinerary
    const aiResponse = await fetch('https://gateway.ai.cloudflare.com/v1/lovable/default/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a luxury travel designer specializing in group dynamics and personalized experiences in Azerbaijan. You create harmonious itineraries that balance diverse personalities and preferences.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 4000
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', errorText);
      throw new Error(`AI API request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // Parse the JSON response
    let itineraryData;
    try {
      itineraryData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse itinerary data');
    }

    // Store group itinerary
    const { data: savedItinerary, error: saveError } = await supabase
      .from('group_itineraries')
      .upsert({
        group_id: group_id,
        itinerary_data: itineraryData
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return new Response(
      JSON.stringify({ 
        success: true,
        itinerary: savedItinerary 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});