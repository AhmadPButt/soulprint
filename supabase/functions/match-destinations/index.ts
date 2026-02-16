import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function validateAuth(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }
  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } }
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }
  return { userId: data.user.id };
}

// ── Helper: reverse score ──
function reverseScore(value: number): number {
  return 100 - value;
}

// ── Extract user energy profile (0=active/achievement, 100=restorative) ──
function calculateUserEnergy(raw: Record<string, any>): number {
  // Extraversion items (high E = active)
  const E = ((raw.Q4 ?? 50) + (raw.Q5 ?? 50) + (raw.Q6 ?? 50) + reverseScore(raw.Q7 ?? 50)) / 4;
  // Adventure orientation
  const AO = ((raw.Q28 ?? 50) + (raw.Q29 ?? 50) + reverseScore(raw.Q30 ?? 50)) / 3;
  // Conscientiousness (high C = structured = less spontaneous)
  const C = ((raw.Q12 ?? 50) + (raw.Q13 ?? 50) + (raw.Q14 ?? 50) + reverseScore(raw.Q15 ?? 50)) / 4;

  // High E + high AO = achievement-oriented → low restorative score
  // Low E + low AO = restorative
  const restorativeScore = 100 - (E * 0.4 + AO * 0.4 + (100 - C) * 0.2);
  return Math.max(0, Math.min(100, Math.round(restorativeScore)));
}

// ── Extract user achievement profile (0=relaxed, 100=achievement) ──
function calculateUserAchievement(raw: Record<string, any>): number {
  const AO = ((raw.Q28 ?? 50) + (raw.Q29 ?? 50) + reverseScore(raw.Q30 ?? 50)) / 3;
  const E = ((raw.Q4 ?? 50) + (raw.Q5 ?? 50) + (raw.Q6 ?? 50) + reverseScore(raw.Q7 ?? 50)) / 4;
  const O = ((raw.Q8 ?? 50) + (raw.Q9 ?? 50) + (raw.Q10 ?? 50) + reverseScore(raw.Q11 ?? 50)) / 4;

  const achievementScore = AO * 0.5 + E * 0.3 + O * 0.2;
  return Math.max(0, Math.min(100, Math.round(achievementScore)));
}

// ── Extract user social preference (0=intimate, 100=social) ──
function calculateUserSocial(raw: Record<string, any>): number {
  const E = ((raw.Q4 ?? 50) + (raw.Q5 ?? 50) + (raw.Q6 ?? 50) + reverseScore(raw.Q7 ?? 50)) / 4;
  const A = ((raw.Q16 ?? 50) + (raw.Q17 ?? 50) + (raw.Q18 ?? 50) + reverseScore(raw.Q19 ?? 50)) / 4;

  const socialScore = E * 0.6 + A * 0.4;
  return Math.max(0, Math.min(100, Math.round(socialScore)));
}

// ── Extract user luxury style (0=authentic, 100=polished) ──
function calculateUserLuxury(raw: Record<string, any>): number {
  // New questionnaire: Q34-Q37 are luxury sliders (0-100)
  // Old questionnaire: Q34 was elemental ranking string — detect and use defaults
  if (typeof raw.Q34 === "string" || raw.Q34 === undefined) {
    // Old format or missing — return neutral
    return 50;
  }
  const q34 = raw.Q34 ?? 50; // polished
  const q35 = reverseScore(raw.Q35 ?? 50); // authentic (reverse)
  const q36 = raw.Q36 ?? 50; // five-star
  const q37 = reverseScore(raw.Q37 ?? 50); // unfiltered (reverse)

  const luxuryScore = (q34 + q35 + q36 + q37) / 4;
  return Math.max(0, Math.min(100, Math.round(luxuryScore)));
}

// ── Extract user pace preference ──
function calculateUserPace(raw: Record<string, any>): number {
  // New questionnaire: Q38-Q40 are pace sliders
  // Old questionnaire: Q38 was inner compass — detect
  if (typeof raw.Q38 !== "number" || raw.Q38 === undefined) {
    return 50;
  }
  const q38 = raw.Q38 ?? 50;
  const q39 = reverseScore(raw.Q39 ?? 50);
  const q40 = raw.Q40 ?? 50;

  return Math.max(0, Math.min(100, Math.round((q38 + q39 + q40) / 3)));
}

// ── Get top 2 sensory priorities from Q41 ranking ──
function getUserSensoryPriorities(raw: Record<string, any>): string[] {
  const ranking = raw.Q41;
  // New format: Q41 is an array like ["visual", "nature", ...]
  if (Array.isArray(ranking) && ranking.length >= 2 && typeof ranking[0] === "string") {
    return [ranking[0], ranking[1]];
  }
  // Old format or missing — default priorities
  return ["visual", "culinary"];
}

// ── Map sensory priority to destination column ──
function getSensoryScore(destination: any, priority: string): number {
  const map: Record<string, string> = {
    visual: "visual_score",
    culinary: "culinary_score",
    nature: "nature_score",
    cultural: "cultural_sensory_score",
    wellness: "wellness_score",
  };
  return destination[map[priority]] ?? 50;
}

// ── Main matching algorithm ──
function calculateFit(
  userEnergy: number,
  userAchievement: number,
  userSocial: number,
  userLuxury: number,
  sensoryPriorities: string[],
  destination: any
): { fitScore: number; breakdown: Record<string, number> } {
  // a) Energy Match (35%)
  const destEnergy = destination.restorative_score ?? 50;
  const energyMatch = 100 - Math.abs(userEnergy - destEnergy);

  // b) Social Match (25%)
  const destSocial = destination.social_vibe_score ?? 50;
  const socialMatch = 100 - Math.abs(userSocial - destSocial);

  // c) Sensory Match (25%) — weighted by user's top 2 priorities
  const top1Score = getSensoryScore(destination, sensoryPriorities[0]);
  const top2Score = getSensoryScore(destination, sensoryPriorities[1]);
  const sensoryMatch = top1Score * 0.6 + top2Score * 0.4;

  // d) Luxury Match (15%)
  const destLuxury = destination.luxury_style_score ?? 50;
  const luxuryMatch = 100 - Math.abs(userLuxury - destLuxury);

  const fitScore =
    energyMatch * 0.35 + socialMatch * 0.25 + sensoryMatch * 0.25 + luxuryMatch * 0.15;

  return {
    fitScore: Math.round(fitScore * 10) / 10,
    breakdown: {
      energy: Math.round(energyMatch),
      social: Math.round(socialMatch),
      sensory: Math.round(sensoryMatch),
      luxury: Math.round(luxuryMatch),
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authResult = await validateAuth(req);
    if (authResult instanceof Response) return authResult;

    const { respondent_id } = await req.json();
    if (!respondent_id) {
      throw new Error("respondent_id is required");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Matching destinations for respondent:", respondent_id);

    // 1. Get respondent + raw responses
    const { data: respondent, error: rErr } = await supabase
      .from("respondents")
      .select("id, user_id, raw_responses")
      .eq("id", respondent_id)
      .single();
    if (rErr) throw rErr;

    const raw = respondent.raw_responses as Record<string, any>;

    // 2. Get context intake for geographic constraints
    let geoConstraint = "anywhere";
    let geoValue = "";
    let contextIntakeId: string | null = null;

    if (respondent.user_id) {
      const { data: intake } = await supabase
        .from("context_intake")
        .select("id, geographic_constraint, geographic_value")
        .eq("user_id", respondent.user_id)
        .eq("completed", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (intake) {
        geoConstraint = intake.geographic_constraint || "anywhere";
        geoValue = intake.geographic_value || "";
        contextIntakeId = intake.id;
      }
    }

    // 3. Query active destinations with geographic filter
    let query = supabase
      .from("echoprint_destinations")
      .select("*")
      .eq("is_active", true);

    if (geoConstraint === "country" && geoValue) {
      query = query.ilike("country", `%${geoValue}%`);
    } else if (geoConstraint === "region" && geoValue) {
      query = query.eq("region", geoValue);
    } else if (geoConstraint === "flight_radius" && geoValue) {
      const maxHours = parseFloat(geoValue);
      if (!isNaN(maxHours)) {
        query = query.lte("flight_time_from_uk_hours", maxHours);
      }
    }
    // "anywhere" = no filter

    const { data: destinations, error: dErr } = await query;
    if (dErr) throw dErr;

    if (!destinations || destinations.length === 0) {
      console.log("No destinations matched geographic filter, falling back to all active");
      const { data: allDests, error: allErr } = await supabase
        .from("echoprint_destinations")
        .select("*")
        .eq("is_active", true);
      if (allErr) throw allErr;
      if (!allDests || allDests.length === 0) {
        return new Response(
          JSON.stringify({ matches: [], message: "No destinations available" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      destinations.push(...allDests);
    }

    // 4. Calculate user traits
    const userEnergy = calculateUserEnergy(raw);
    const userAchievement = calculateUserAchievement(raw);
    const userSocial = calculateUserSocial(raw);
    const userLuxury = calculateUserLuxury(raw);
    const sensoryPriorities = getUserSensoryPriorities(raw);

    console.log("User traits:", { userEnergy, userAchievement, userSocial, userLuxury, sensoryPriorities });

    // 5. Score each destination
    const scored = destinations.map((dest) => {
      const { fitScore, breakdown } = calculateFit(
        userEnergy,
        userAchievement,
        userSocial,
        userLuxury,
        sensoryPriorities,
        dest
      );
      return { destination: dest, fit_score: fitScore, fit_breakdown: breakdown };
    });

    // 6. Sort by fit score descending, take top 3
    scored.sort((a, b) => b.fit_score - a.fit_score);
    const top3 = scored.slice(0, 3);

    // 7. Delete any existing matches for this respondent (for re-runs)
    await supabase
      .from("destination_matches")
      .delete()
      .eq("respondent_id", respondent_id);

    // 8. Insert top 3 matches
    const matchInserts = top3.map((m, idx) => ({
      respondent_id,
      destination_id: m.destination.id,
      context_intake_id: contextIntakeId,
      fit_score: m.fit_score,
      fit_breakdown: m.fit_breakdown,
      rank: idx + 1,
    }));

    const { error: insertErr } = await supabase
      .from("destination_matches")
      .insert(matchInserts);
    if (insertErr) throw insertErr;

    console.log("Matched top 3:", top3.map((m) => `${m.destination.name}: ${m.fit_score}`));

    // 9. Return results
    const matches = top3.map((m, idx) => ({
      destination: m.destination,
      fit_score: m.fit_score,
      fit_breakdown: m.fit_breakdown,
      rank: idx + 1,
    }));

    return new Response(JSON.stringify({ matches, user_traits: { userEnergy, userAchievement, userSocial, userLuxury, sensoryPriorities } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error matching destinations:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
