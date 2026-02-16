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

    const { respondent_id } = await req.json();

    if (!respondent_id) {
      return new Response(
        JSON.stringify({ error: 'respondent_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch mood logs for the respondent
    const { data: moodLogs, error: logsError } = await supabaseClient
      .from('mood_logs')
      .select('*')
      .eq('respondent_id', respondent_id)
      .order('logged_at', { ascending: true });

    if (logsError) {
      console.error('Error fetching mood logs:', logsError);
      throw logsError;
    }

    if (!moodLogs || moodLogs.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No mood logs found for this respondent' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare mood data for analysis
    const moodSummary = moodLogs.map(log => ({
      date: log.logged_at,
      score: log.mood_score,
      emotions: log.emotions?.selected || [],
      location: log.location,
      activity: log.activity_reference,
      notes: log.notes
    }));

    const avgMood = moodLogs.reduce((sum, log) => sum + log.mood_score, 0) / moodLogs.length;
    const highestMood = Math.max(...moodLogs.map(l => l.mood_score));
    const lowestMood = Math.min(...moodLogs.map(l => l.mood_score));

    // Create prompt for AI analysis
    const prompt = `You are an empathetic travel psychologist analyzing a traveler's emotional journey. 

Analyze these mood logs and provide:
1. Key emotional patterns and trends
2. Insights about what activities/locations correlated with positive emotions
3. Recommendations for future travel based on their emotional responses
4. Personal growth observations

Mood Statistics:
- Average Mood: ${avgMood.toFixed(1)}/10
- Highest Mood: ${highestMood}/10
- Lowest Mood: ${lowestMood}/10
- Total Entries: ${moodLogs.length}

Detailed Mood Logs:
${JSON.stringify(moodSummary, null, 2)}

Provide a warm, insightful analysis in 3-4 paragraphs that feels personal and encouraging. Focus on actionable insights.`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an empathetic travel psychologist who provides warm, insightful analysis of emotional patterns.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const insightsText = aiData.choices[0].message.content;

    // Analyze emotional patterns
    const emotionCounts: Record<string, number> = {};
    moodLogs.forEach(log => {
      const emotions = log.emotions?.selected || [];
      emotions.forEach((emotion: string) => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
    });

    const locationMoods: Record<string, number[]> = {};
    moodLogs.forEach(log => {
      if (log.location) {
        if (!locationMoods[log.location]) {
          locationMoods[log.location] = [];
        }
        locationMoods[log.location].push(log.mood_score);
      }
    });

    const emotionalPatterns = {
      averageMood: avgMood,
      highestMood,
      lowestMood,
      totalEntries: moodLogs.length,
      emotionFrequency: emotionCounts,
      locationMoodAverages: Object.entries(locationMoods).map(([location, moods]) => ({
        location,
        averageMood: moods.reduce((a, b) => a + b, 0) / moods.length
      })).sort((a, b) => b.averageMood - a.averageMood)
    };

    // Store insights in database
    const { data: insight, error: insertError } = await supabaseClient
      .from('mood_insights')
      .insert({
        respondent_id,
        insights_text: insightsText,
        emotional_patterns: emotionalPatterns,
        model_used: 'google/gemini-2.5-flash'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting insights:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        insight,
        patterns: emotionalPatterns
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-mood-patterns:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
