import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().split("T")[0];

    // Find in_progress trips whose end_date has passed
    const { data: completedTrips, error } = await supabase
      .from("trips")
      .select("*, echoprint_destinations(*), respondents(*)")
      .eq("status", "in_progress")
      .lte("end_date", today);

    if (error) throw error;

    const results = [];

    for (const trip of completedTrips || []) {
      // Update status to completed
      const { error: updateErr } = await supabase
        .from("trips")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", trip.id);

      if (updateErr) {
        console.error(`Failed to complete trip ${trip.id}:`, updateErr);
        results.push({ trip_id: trip.id, status: "error", error: updateErr.message });
        continue;
      }

      // Schedule survey email for 3 days after end_date
      const surveyDate = new Date(trip.end_date);
      surveyDate.setDate(surveyDate.getDate() + 3);

      // If 3 days have already passed, send immediately
      const now = new Date();
      if (surveyDate <= now) {
        try {
          await supabase.functions.invoke("send-trip-survey", {
            body: {
              trip_id: trip.id,
              respondent_name: trip.respondents?.name || "Traveler",
              respondent_email: trip.respondents?.email,
              destination_name: trip.echoprint_destinations?.name || "your destination",
            },
          });
          console.log(`Survey email sent for trip ${trip.id}`);
        } catch (emailErr) {
          console.error(`Failed to send survey for trip ${trip.id}:`, emailErr);
        }
      }

      results.push({ trip_id: trip.id, status: "completed" });
      console.log(`Trip ${trip.id} marked as completed`);
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        results,
        checked_at: today,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error checking trip completion:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
