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

  // This is an internal/admin-only function — require a service-level secret header
  // or validate that the caller is an admin user
  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Accept either the service role key (for cron/internal calls) or a valid admin JWT
  let isAuthorized = false;

  if (authHeader === `Bearer ${serviceKey}`) {
    // Internal cron call using service role key
    isAuthorized = true;
  } else if (authHeader?.startsWith("Bearer ")) {
    // Validate as admin user
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data, error } = await supabaseAnon.auth.getUser();
    if (!error && data?.user) {
      // Check admin role
      const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .single();
      if (roleData) isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
