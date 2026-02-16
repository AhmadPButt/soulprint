import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getAuthUserId(req: Request): string | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.replace('Bearer ', '');
}

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

// Scoring functions
function reverseScore(value: number): number {
  return 100 - value;
}

function calculateTraitScores(raw: Record<string, any>) {
  // Big Five Traits (Q4-Q23 from questionnaire)
  const E = (raw.Q4 + raw.Q5 + raw.Q6 + reverseScore(raw.Q7)) / 4;
  const O = (raw.Q8 + raw.Q9 + raw.Q10 + reverseScore(raw.Q11)) / 4;
  const C = (raw.Q12 + raw.Q13 + raw.Q14 + reverseScore(raw.Q15)) / 4;
  const A = (raw.Q16 + raw.Q17 + raw.Q18 + reverseScore(raw.Q19)) / 4;
  const ES = (raw.Q20 + raw.Q21 + reverseScore(raw.Q22) + reverseScore(raw.Q23)) / 4;
  
  // Travel Behavior (Q24-Q33 from questionnaire)
  const SF = (raw.Q24 + raw.Q25 + raw.Q26 + reverseScore(raw.Q27)) / 4;
  const AO = (raw.Q28 + raw.Q29 + reverseScore(raw.Q30)) / 3;
  const EA = (raw.Q31 + raw.Q32 + reverseScore(raw.Q33)) / 3;
  const TFI = 0.4 * SF + 0.4 * AO + 0.2 * EA;
  
  // Elemental Resonance (Q34 from questionnaire - parse comma-separated string)
  const elementString = raw.Q34 || "";
  const elementArray = elementString.split(",").map((s: string) => s.trim().toLowerCase());
  const elementRanks = {
    fire: elementArray.indexOf("fire") + 1,
    water: elementArray.indexOf("water") + 1,
    stone: elementArray.indexOf("stone") + 1,
    urban: elementArray.indexOf("urban") + 1,
    desert: elementArray.indexOf("desert") + 1
  };
  
  const fire = (5 - elementRanks.fire) * 25;
  const water = (5 - elementRanks.water) * 25;
  const stone = (5 - elementRanks.stone) * 25;
  const urban = (5 - elementRanks.urban) * 25;
  const desert = (5 - elementRanks.desert) * 25;
  
  const elementScores = { fire, water, stone, urban, desert };
  const sortedElements = Object.entries(elementScores).sort((a, b) => b[1] - a[1]);
  const dominant_element = sortedElements[0][0];
  const secondary_element = sortedElements[1][0];
  
  // Inner Compass (Q35-Q42 from questionnaire)
  const TR = (raw.Q35 + raw.Q36) / 2;
  const CL = (raw.Q37 + raw.Q38) / 2;
  const AL = (raw.Q39 + raw.Q40) / 2;
  const CON = (raw.Q41 + raw.Q42) / 2;
  
  const motivationScores = { Transformation: TR, Clarity: CL, Aliveness: AL, Connection: CON };
  const sortedMotivations = Object.entries(motivationScores).sort((a, b) => b[1] - a[1]);
  const top_motivation_1 = sortedMotivations[0][0];
  const top_motivation_2 = sortedMotivations[1][0];
  
  // State Variables (Q45_* and Q43, Q44, Q46 from questionnaire)
  const EBI = (raw.Q45_overwhelm + raw.Q45_uncertainty + raw.Q45_burnout + raw.Q45_disconnection) / 4;
  const ETI = (ES + (100 - EBI)) / 2;
  
  return {
    E, O, C, A, ES,
    SF, AO, EA, TFI,
    fire, water, stone, urban, desert,
    dominant_element, secondary_element,
    TR, CL, AL, CON,
    top_motivation_1, top_motivation_2,
    life_phase: raw.Q43,
    shift_desired: raw.Q44,
    EBI, ETI,
    completion_need: raw.Q46
  };
}

function calculateTensions(traits: any) {
  return {
    T_Social: Math.abs(traits.E - traits.CON),
    T_Flow: Math.abs(traits.C - traits.SF),
    T_Risk: Math.abs(traits.AO - traits.EA),
    T_Elements: Math.abs(traits.fire - traits.water),
    T_Tempo: Math.abs(traits.stone - traits.urban)
  };
}

function calculateEAI(traits: any): number {
  const coreAlign = 0.4 * (traits.fire / 100) + 0.4 * (traits.stone / 100) + 0.2 * (traits.desert / 100);
  const oBonus = Math.max(0, (traits.O - 50) / 50 * 0.03);
  const trBonus = Math.max(0, (traits.TR - 50) / 50 * 0.03);
  const eai = Math.min(coreAlign + oBonus + trBonus, 1.0) * 100;
  return Math.round(eai * 100) / 100;
}

function calculateBusinessKPIs(traits: any, eai: number) {
  const SPI = 0.35 * traits.O + 0.25 * traits.AL + 0.20 * traits.TR + 0.10 * (100 - traits.C) + 0.10 * traits.SF;
  const URS = 0.30 * traits.A + 0.25 * traits.SF + 0.25 * traits.ES + 0.20 * (100 - traits.EBI);
  const NPS_predicted = 5 + (eai / 100) * 3 + (traits.TR / 100) * 1.5 + ((100 - traits.EBI) / 100) * 0.5;
  const CRS = 0.40 * (100 - traits.ES) + 0.30 * (100 - traits.EA) + 0.20 * traits.EBI + 0.10 * (100 - traits.A);
  const GFI = 0.35 * Math.abs(traits.E - 50) + 0.25 * (100 - traits.A) + 0.25 * Math.abs(traits.SF - 50) + 0.15 * (100 - traits.CON);
  const CGS = 0.40 * traits.E + 0.30 * traits.urban + 0.20 * traits.O + 0.10 * traits.AL;
  
  const tierify = (val: number) => val >= 70 ? "High" : val >= 40 ? "Medium" : "Low";
  const tierifyCRS = (val: number) => val >= 60 ? "High" : val >= 30 ? "Medium" : "Low";
  const tierifyGFI = (val: number) => val >= 50 ? "High" : val >= 25 ? "Medium" : "Low";
  const tierifyNPS = (val: number) => val >= 9 ? "Promoter" : val >= 7 ? "Passive" : "Detractor";
  
  let tribe: string;
  if (traits.E >= 60 && traits.ES >= 60) tribe = "A_Hunters";
  else if (traits.O >= 60 && traits.ES < 50) tribe = "B_Observers";
  else if (traits.A >= 60) tribe = "C_Connectors";
  else tribe = "Mixed";
  
  const tribe_confidence = tribe === "Mixed" ? "Low" : (traits.E >= 75 || traits.O >= 75 || traits.A >= 75) ? "High" : "Medium";
  
  const upsell_priority = (SPI >= 60 && URS >= 60) ? "Priority 1" : (SPI >= 60 || URS >= 60) ? "Priority 2" : "Priority 3";
  const risk_flag = CRS >= 50 ? "HIGH RISK" : CRS >= 30 ? "Monitor" : "OK";
  const content_flag = CGS >= 70;
  
  return {
    SPI: Math.round(SPI * 100) / 100, SPI_tier: tierify(SPI),
    URS: Math.round(URS * 100) / 100, URS_tier: tierify(URS),
    NPS_predicted: Math.round(NPS_predicted * 100) / 100, NPS_tier: tierifyNPS(NPS_predicted),
    CRS: Math.round(CRS * 100) / 100, CRS_tier: tierifyCRS(CRS),
    GFI: Math.round(GFI * 100) / 100, GFI_tier: tierifyGFI(GFI),
    CGS: Math.round(CGS * 100) / 100, CGS_tier: tierify(CGS),
    tribe, tribe_confidence, upsell_priority, risk_flag, content_flag
  };
}

async function generateNarrative(name: string, traits: any, tensions: any, kpis: any, eai: number, raw: any, model = "google/gemini-2.5-flash") {
  const prompt = `You are the Erranza SoulPrint Narrator — a luxury travel intelligence service that speaks with the sophistication of haute couture.

Craft an exquisite, bespoke narrative for ${name} that embodies refined elegance and psychological depth.

PSYCHOMETRIC ARCHITECTURE:
• Personality Canvas: E${traits.E.toFixed(0)} | O${traits.O.toFixed(0)} | C${traits.C.toFixed(0)} | A${traits.A.toFixed(0)} | ES${traits.ES.toFixed(0)}
• Travel Signature: SF${traits.SF.toFixed(0)} | AO${traits.AO.toFixed(0)} | EA${traits.EA.toFixed(0)}
• Elemental Resonance: ${traits.dominant_element} (primary) × ${traits.secondary_element} (accent)
• Inner Compass: ${traits.top_motivation_1} → ${traits.top_motivation_2}
• Life Chapter: ${traits.life_phase} | Seeking: ${traits.shift_desired}
• Traveler Archetype: ${kpis.tribe}

NARRATIVE REQUIREMENTS:
Write 3-4 paragraphs with the sophistication of a private members' club and the insight of a master psychologist:

1. OPENING OVERTURE (Headline + First Paragraph)
   • Begin with a poetic, evocative headline that captures their essence
   • Open with metaphor drawn from their dominant element
   • Weave their Big Five traits into a psychological portrait
   • Establish their unique travel signature with elegance

2. THE INNER ARCHITECTURE (Second Paragraph)
   • Illuminate the tensions and paradoxes within (T_Social: ${tensions.T_Social.toFixed(0)}, T_Flow: ${tensions.T_Flow.toFixed(0)})
   • Reveal growth edges with grace and nuance
   • Connect their life phase to their travel motivations
   • Frame challenges as invitations, not obstacles

3. THE DESTINATION PROPOSITION (Third Paragraph)
   • What types of destinations and experiences will resonate most deeply with this traveler?
   • How do their elemental resonances suggest ideal landscapes and environments?
   • What cultural, sensory, and emotional experiences align with their inner compass?
   • Frame their ideal journey as a natural extension of who they are

4. BESPOKE RECOMMENDATIONS (Final Paragraph)
   • 2-3 highly specific, unexpected experiences tailored to their psychometric profile
   • Speak to their tribe (${kpis.tribe}) with insider knowledge
   • Recommendations should feel like secrets whispered by someone who truly sees them
   • Close with an elegant, forward-looking statement

TONE PRINCIPLES:
• Haute couture: refined, considered, never rushed
• Psychologically astute: see beneath surface desires
• Poetically precise: every word chosen with intention
• Warmly exclusive: intimate without being familiar
• Avoid: generic travel writing, obvious suggestions, platitudes, clichés

Write as if composing a letter to a distinguished guest who deserves nothing less than complete understanding.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are the Erranza SoulPrint Narrator — a luxury travel psychologist with the elegance of haute couture." },
        { role: "user", content: prompt }
      ],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authResult = await validateAuth(req);
    if (authResult instanceof Response) return authResult;

    const { respondent_id, regenerate = false, model = "google/gemini-2.5-flash" } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Computing SoulPrint for respondent:", respondent_id);

    // Fetch respondent data
    const { data: respondent, error: fetchError } = await supabase
      .from("respondents")
      .select("*")
      .eq("id", respondent_id)
      .single();

    if (fetchError) throw fetchError;

    const raw = respondent.raw_responses;
    
    // Calculate all scores
    const traits = calculateTraitScores(raw);
    const tensions = calculateTensions(traits);
    const eai = calculateEAI(traits);
    const kpis = calculateBusinessKPIs(traits, eai);

    let computedScore;
    
    if (regenerate) {
      // For regeneration, fetch existing computed score
      const { data: existingScore, error: fetchScoreError } = await supabase
        .from("computed_scores")
        .select("*")
        .eq("respondent_id", respondent_id)
        .order("computed_at", { ascending: false })
        .limit(1)
        .single();
      
      if (fetchScoreError) throw fetchScoreError;
      computedScore = existingScore;
    } else {
      // Store computed scores for first-time computation
      const { data: newScore, error: scoreError } = await supabase
        .from("computed_scores")
        .insert({
        respondent_id,
        extraversion: traits.E, openness: traits.O, conscientiousness: traits.C,
        agreeableness: traits.A, emotional_stability: traits.ES,
        spontaneity_flexibility: traits.SF, adventure_orientation: traits.AO,
        environmental_adaptation: traits.EA, travel_freedom_index: traits.TFI,
        fire_score: traits.fire, water_score: traits.water, stone_score: traits.stone,
        urban_score: traits.urban, desert_score: traits.desert,
        dominant_element: traits.dominant_element, secondary_element: traits.secondary_element,
        transformation: traits.TR, clarity: traits.CL, aliveness: traits.AL, connection: traits.CON,
        top_motivation_1: traits.top_motivation_1, top_motivation_2: traits.top_motivation_2,
        life_phase: traits.life_phase, shift_desired: traits.shift_desired,
        emotional_burden_index: traits.EBI, emotional_travel_index: traits.ETI,
        completion_need: traits.completion_need,
        t_social: tensions.T_Social, t_flow: tensions.T_Flow, t_risk: tensions.T_Risk,
        t_elements: tensions.T_Elements, t_tempo: tensions.T_Tempo,
        eai_azerbaijan: eai,
        spi: kpis.SPI, spi_tier: kpis.SPI_tier, urs: kpis.URS, urs_tier: kpis.URS_tier,
        nps_predicted: kpis.NPS_predicted, nps_tier: kpis.NPS_tier,
        crs: kpis.CRS, crs_tier: kpis.CRS_tier, gfi: kpis.GFI, gfi_tier: kpis.GFI_tier,
        cgs: kpis.CGS, cgs_tier: kpis.CGS_tier,
        tribe: kpis.tribe, tribe_confidence: kpis.tribe_confidence,
        upsell_priority: kpis.upsell_priority, risk_flag: kpis.risk_flag, content_flag: kpis.content_flag
      })
        .select()
        .single();

      if (scoreError) throw scoreError;
      computedScore = newScore;
    }

    // Generate narrative with specified model
    const narrative = await generateNarrative(respondent.name, traits, tensions, kpis, eai, raw, model);

    if (regenerate) {
      // Update existing narrative with new content and increment regeneration count
      const { data: existingNarrative } = await supabase
        .from("narrative_insights")
        .select("regeneration_count")
        .eq("respondent_id", respondent_id)
        .order("generated_at", { ascending: false })
        .limit(1)
        .single();

      const { error: updateError } = await supabase
        .from("narrative_insights")
        .update({
          soulprint_summary: narrative,
          model_used: model,
          prompt_version: "v2.2-luxury",
          regeneration_count: (existingNarrative?.regeneration_count || 0) + 1,
          generated_at: new Date().toISOString()
        })
        .eq("respondent_id", respondent_id)
        .eq("computed_scores_id", computedScore.id);

      if (updateError) throw updateError;
    } else {
      // Store new narrative
      const { error: narrativeError } = await supabase
        .from("narrative_insights")
        .insert({
          respondent_id,
          computed_scores_id: computedScore.id,
          model_used: model,
          prompt_version: "v2.2-luxury",
          soulprint_summary: narrative,
          headline: `${respondent.name}: ${kpis.tribe} Traveler`,
          tagline: `Seeking ${traits.top_motivation_1} through ${traits.dominant_element}`
        });

      if (narrativeError) throw narrativeError;
    }

    console.log("SoulPrint computed successfully!");

    return new Response(JSON.stringify({ 
      success: true, 
      computed_scores_id: computedScore.id,
      traits, tensions, eai, kpis, narrative
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error computing SoulPrint:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});