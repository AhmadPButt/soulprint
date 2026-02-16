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

    const { type, params } = await req.json();
    
    if (type !== 'hotels') {
      throw new Error('Invalid search type. Only "hotels" is supported');
    }

    const LITEFUL_API_KEY = Deno.env.get('AMADEUS_API_KEY');
    if (!LITEFUL_API_KEY) {
      throw new Error('AMADEUS_API_KEY is not configured');
    }

    const { location, check_in_date, check_out_date, adults = 1 } = params;
    
    console.log('Searching hotels with Liteful API:', { location, check_in_date, check_out_date, adults });

    // Call Liteful API for hotel search
    const hotelResponse = await fetch('https://api.liteful.com/v1/hotels/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LITEFUL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location: location,
        check_in: check_in_date,
        check_out: check_out_date,
        guests: adults,
      })
    });

    if (!hotelResponse.ok) {
      const errorText = await hotelResponse.text();
      console.error('Liteful API error:', hotelResponse.status, errorText);
      throw new Error(`Hotel search failed: ${errorText}`);
    }

    const hotelData = await hotelResponse.json();
    console.log('Liteful API response:', JSON.stringify(hotelData, null, 2));
    
    // Transform Liteful API response to match our expected format
    const results = {
      type: 'hotels',
      properties: (hotelData.hotels || hotelData.results || []).slice(0, 10).map((hotel: any) => ({
        name: hotel.name || hotel.hotel_name,
        type: hotel.type || hotel.category || 'Hotel',
        rating: hotel.rating || hotel.star_rating,
        reviews: hotel.reviews || hotel.review_count,
        price: hotel.price || hotel.rate_per_night || hotel.nightly_rate,
        total_rate: hotel.total_price || hotel.total_rate,
        description: hotel.description,
        images: hotel.images || hotel.photos?.slice(0, 3) || [],
        amenities: hotel.amenities || hotel.facilities || [],
        link: hotel.booking_url || hotel.link || hotel.url,
      })) || [],
    };

    console.log('Transformed results:', JSON.stringify(results, null, 2));

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in search-travel:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Search failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
