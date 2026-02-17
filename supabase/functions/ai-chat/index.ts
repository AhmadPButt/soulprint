import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversation_id, user_message, trip_id } = await req.json();

    if (!user_message || !trip_id) {
      return new Response(
        JSON.stringify({ error: 'user_message and trip_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input length validation
    const MAX_MESSAGE_LENGTH = 2000;
    if (typeof user_message !== 'string' || user_message.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Message must be a string under ${MAX_MESSAGE_LENGTH} characters` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth user from request and validate
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      ).auth.getUser(token);
      userId = user?.id ?? null;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has access to this trip
    const { data: tripAccess } = await supabaseClient
      .from('trips')
      .select('id')
      .eq('id', trip_id)
      .or(`created_by.eq.${userId}`)
      .maybeSingle();

    const { data: memberAccess } = await supabaseClient
      .from('trip_members')
      .select('id')
      .eq('trip_id', trip_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!tripAccess && !memberAccess) {
      return new Response(
        JSON.stringify({ error: 'Access denied to this trip' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resolve or create conversation
    let convId = conversation_id;
    if (!convId && userId) {
      const { data: conv, error: convErr } = await supabaseClient
        .from('ai_conversations')
        .insert({ trip_id, user_id: userId })
        .select()
        .single();
      if (convErr) throw convErr;
      convId = conv.id;
    }

    // Get conversation history
    let history: any[] = [];
    if (convId) {
      const { data: msgs } = await supabaseClient
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(50);
      history = msgs || [];
    }

    // Get trip context with related data
    const { data: trip } = await supabaseClient
      .from('trips')
      .select('*')
      .eq('id', trip_id)
      .single();

    let destination: any = null;
    let destInfo: any = null;
    let itinerary: any = null;
    let respondent: any = null;
    let bookings: any[] = [];

    if (trip) {
      const promises: Promise<any>[] = [];

      if (trip.destination_id) {
        promises.push(
          supabaseClient.from('echoprint_destinations').select('*').eq('id', trip.destination_id).single(),
          supabaseClient.from('destination_info').select('*').eq('destination_id', trip.destination_id).maybeSingle()
        );
      } else {
        promises.push(Promise.resolve({ data: null }), Promise.resolve({ data: null }));
      }

      if (trip.itinerary_id) {
        promises.push(supabaseClient.from('itineraries').select('*').eq('id', trip.itinerary_id).single());
      } else {
        promises.push(Promise.resolve({ data: null }));
      }

      if (trip.respondent_id) {
        promises.push(supabaseClient.from('respondents').select('*').eq('id', trip.respondent_id).single());
      } else {
        promises.push(Promise.resolve({ data: null }));
      }

      promises.push(supabaseClient.from('trip_bookings').select('*').eq('trip_id', trip_id));

      const [destRes, destInfoRes, itinRes, respRes, bookingsRes] = await Promise.all(promises);
      destination = destRes?.data;
      destInfo = destInfoRes?.data;
      itinerary = itinRes?.data?.itinerary_data;
      respondent = respRes?.data;
      bookings = bookingsRes?.data || [];
    }

    // Build current day itinerary
    let todayItinerary = 'No itinerary available';
    if (itinerary?.days) {
      const startDate = trip?.start_date ? new Date(trip.start_date) : null;
      const today = new Date();
      let dayNum = 1;
      if (startDate) {
        dayNum = Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      }
      const todayPlan = itinerary.days.find((d: any) => d.day === dayNum);
      if (todayPlan) {
        const slots = ['morning', 'afternoon', 'evening']
          .map(s => todayPlan[s] ? `${s}: ${todayPlan[s].activity} (${todayPlan[s].time || ''})` : null)
          .filter(Boolean)
          .join('\n');
        todayItinerary = `Day ${dayNum}: ${todayPlan.title || todayPlan.theme || ''}\n${slots}`;
      }
    }

    // Format bookings
    const bookingsText = bookings.length > 0
      ? bookings.map(b => `${b.booking_type}: ${b.provider_name || ''} - ${b.location_name || ''} (${b.booking_date || 'no date'})`).join('\n')
      : 'No bookings recorded';

    // Format destination info
    let destInfoText = '';
    if (destInfo) {
      const parts = [];
      if (destInfo.currency) parts.push(`Currency: ${destInfo.currency}`);
      if (destInfo.timezone) parts.push(`Timezone: ${destInfo.timezone}`);
      if (destInfo.language_basics) parts.push(`Language: ${destInfo.language_basics}`);
      if (destInfo.tipping_etiquette) parts.push(`Tipping: ${destInfo.tipping_etiquette}`);
      if (destInfo.safety_tips) parts.push(`Safety: ${destInfo.safety_tips}`);
      if (destInfo.emergency_numbers) parts.push(`Emergency: ${JSON.stringify(destInfo.emergency_numbers)}`);
      if (destInfo.cultural_customs) parts.push(`Customs: ${destInfo.cultural_customs}`);
      destInfoText = parts.join('\n');
    }

    const travelerName = respondent?.name || 'traveler';
    const destName = destination?.name || 'your destination';
    const destCountry = destination?.country || '';

    const systemPrompt = `You are the Erranza AI travel assistant helping ${travelerName} during their trip to ${destName}, ${destCountry}.

TRIP CONTEXT:
- Dates: ${trip?.start_date || 'Not set'} to ${trip?.end_date || 'Not set'}
- Party: ${trip?.trip_type || 'solo'}
- Destination: ${destination?.description || destName}

TODAY'S ITINERARY:
${todayItinerary}

BOOKINGS:
${bookingsText}

DESTINATION KNOWLEDGE:
${destInfoText || 'Limited info available'}

Your role:
1. Answer questions about their destination, itinerary, bookings
2. Provide local tips, restaurant suggestions, activity recommendations
3. Help with emergency guidance if needed (share emergency numbers if available)
4. Be warm, helpful, and concise
5. If you can't help or they need urgent human support, suggest clicking "Talk to a human"

Keep responses under 150 words unless providing detailed directions or important safety info. Use markdown for formatting when helpful.`;

    // Build messages for AI
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({
        role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: m.message_text
      })),
      { role: 'user' as const, content: user_message }
    ];

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
        messages: aiMessages,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiReply = aiData.choices[0].message.content;

    // Save user message and AI response
    if (convId) {
      await supabaseClient.from('ai_messages').insert([
        { conversation_id: convId, sender: 'user', message_text: user_message },
        { conversation_id: convId, sender: 'ai', message_text: aiReply, metadata: { model: 'gemini-2.5-flash' } },
      ]);
    }

    return new Response(
      JSON.stringify({ reply: aiReply, conversation_id: convId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-chat:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
