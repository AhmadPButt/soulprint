import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { destination_name } = await req.json();
    if (!destination_name) {
      return new Response(JSON.stringify({ error: "destination_name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert travel analyst for a luxury travel company called Erranza. 
Your job is to generate accurate destination scoring profiles used for psychological travel matching.

Respond ONLY with a valid JSON object — no markdown, no explanation.`;

    const userPrompt = `Generate a complete destination profile for: "${destination_name}"

Return a JSON object with EXACTLY these fields:
{
  "name": "Destination Name",
  "country": "Country Name",
  "region": "One of: Europe, Asia, Americas, Africa, Oceania, Middle East",
  "short_description": "One compelling sentence (max 20 words)",
  "description": "Two to three sentences describing the destination for travelers (max 60 words)",
  "restorative_score": <0-100, how much it helps people decompress and restore>,
  "achievement_score": <0-100, how much it appeals to goal-oriented and achievement-driven travelers>,
  "cultural_score": <0-100, depth of cultural, historical, and heritage experiences>,
  "social_vibe_score": <0-100, social energy, nightlife, group activities, meeting people>,
  "visual_score": <0-100, stunning scenery, photography, visual beauty>,
  "culinary_score": <0-100, food quality, diversity, culinary experiences>,
  "nature_score": <0-100, wildlife, hiking, outdoors, natural landscapes>,
  "cultural_sensory_score": <0-100, sensory richness: markets, sounds, smells, textures>,
  "wellness_score": <0-100, spas, retreats, yoga, wellbeing facilities>,
  "luxury_style_score": <0-100, luxury accommodation, fine dining, exclusive experiences>,
  "avg_cost_per_day_gbp": <realistic average daily cost in GBP including accommodation>,
  "flight_time_from_uk_hours": <approximate direct flight time from London in hours as decimal>,
  "best_time_to_visit": "Month range e.g. Apr–Oct",
  "climate_tags": ["array", "of", "2-4", "climate", "descriptors"],
  "highlights": ["array", "of", "3-5", "key", "highlights"],
  "tier": "curated"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI error: ${response.status} ${text}`);
    }

    const aiResult = await response.json();
    let content = aiResult.choices?.[0]?.message?.content || "";

    // Strip markdown code blocks if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let profile;
    try {
      profile = JSON.parse(content);
    } catch {
      throw new Error("AI returned invalid JSON: " + content.slice(0, 200));
    }

    return new Response(JSON.stringify({ profile }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("generate-destination-profile error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
