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
    const { type, params } = await req.json();
    
    const SERP_API_KEY = Deno.env.get('SERP_API_KEY');
    if (!SERP_API_KEY) {
      throw new Error('SERP_API_KEY is not configured');
    }

    let results;

    if (type === 'flights') {
      // Search Google Flights via SerpApi
      const { origin, destination, departure_date, return_date, adults = 1 } = params;
      
      const flightParams = new URLSearchParams({
        engine: 'google_flights',
        departure_id: origin,
        arrival_id: destination,
        outbound_date: departure_date,
        return_date: return_date || '',
        adults: adults.toString(),
        currency: 'USD',
        hl: 'en',
        api_key: SERP_API_KEY,
      });

      console.log('Searching flights:', flightParams.toString());

      const flightResponse = await fetch(`https://serpapi.com/search?${flightParams}`);
      
      if (!flightResponse.ok) {
        const errorText = await flightResponse.text();
        console.error('Flight search error:', flightResponse.status, errorText);
        throw new Error(`Flight search failed: ${errorText}`);
      }

      const flightData = await flightResponse.json();
      
      // Extract best flights with pricing
      results = {
        type: 'flights',
        best_flights: flightData.best_flights?.slice(0, 3).map((flight: any) => ({
          price: flight.price,
          airline: flight.flights?.[0]?.airline,
          duration: flight.total_duration,
          departure_time: flight.flights?.[0]?.departure_airport?.time,
          arrival_time: flight.flights?.[flight.flights.length - 1]?.arrival_airport?.time,
          stops: flight.flights?.length - 1,
        })) || [],
        other_flights: flightData.other_flights?.slice(0, 5).map((flight: any) => ({
          price: flight.price,
          airline: flight.flights?.[0]?.airline,
          duration: flight.total_duration,
          stops: flight.flights?.length - 1,
        })) || [],
        price_insights: flightData.price_insights,
      };

    } else if (type === 'hotels') {
      // Search Google Hotels via SerpApi
      const { location, check_in_date, check_out_date, adults = 1, currency = 'USD' } = params;
      
      const hotelParams = new URLSearchParams({
        engine: 'google_hotels',
        q: location,
        check_in_date: check_in_date,
        check_out_date: check_out_date,
        adults: adults.toString(),
        currency: currency,
        hl: 'en',
        api_key: SERP_API_KEY,
      });

      console.log('Searching hotels:', hotelParams.toString());

      const hotelResponse = await fetch(`https://serpapi.com/search?${hotelParams}`);
      
      if (!hotelResponse.ok) {
        const errorText = await hotelResponse.text();
        console.error('Hotel search error:', hotelResponse.status, errorText);
        throw new Error(`Hotel search failed: ${errorText}`);
      }

      const hotelData = await hotelResponse.json();
      
      // Extract top hotels with pricing
      results = {
        type: 'hotels',
        properties: hotelData.properties?.slice(0, 10).map((hotel: any) => ({
          name: hotel.name,
          type: hotel.type,
          rating: hotel.overall_rating,
          reviews: hotel.reviews,
          price: hotel.rate_per_night?.lowest,
          total_rate: hotel.total_rate?.lowest,
          description: hotel.description,
          images: hotel.images?.slice(0, 3),
          amenities: hotel.amenities,
          link: hotel.link,
        })) || [],
      };

    } else {
      throw new Error('Invalid search type. Use "flights" or "hotels"');
    }

    console.log('Search completed successfully');

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in search-travel:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Search failed',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
