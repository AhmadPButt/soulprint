/**
 * SoulPrint Trait Calculation Helpers
 * Extracts 5 key personality dimensions from raw questionnaire responses.
 */

export interface TraitScores {
  energy: number;      // 0 = restorative, 100 = achievement
  social: number;      // 0 = intimate, 100 = social
  luxury: number;      // 0 = authentic, 100 = seamless
  pace: number;        // 0 = slow, 100 = packed
  sensory: {
    top1: string;
    top2: string;
    scores: Record<string, number>;
  };
}

const SENSORY_LABELS: Record<string, string> = {
  visual: "Visual Beauty",
  culinary: "Culinary Excellence",
  nature: "Nature Immersion",
  cultural: "Cultural Sensory",
  wellness: "Wellness & Spa",
};

function safeNum(val: any, fallback = 50): number {
  const n = Number(val);
  return isNaN(n) ? fallback : Math.max(0, Math.min(100, n));
}

function avg(values: number[]): number {
  if (values.length === 0) return 50;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function reverseScore(val: number): number {
  return 100 - val;
}

/**
 * Energy Score: 0 = deeply restorative, 100 = achievement/adventure oriented
 * Draws from extraversion, adventure orientation, and spontaneity questions.
 */
export function calculateEnergyScore(responses: any, computed?: any): number {
  // If we have computed scores, use them directly
  if (computed) {
    const values: number[] = [];
    if (computed.adventure_orientation != null) values.push(safeNum(computed.adventure_orientation));
    if (computed.extraversion != null) values.push(safeNum(computed.extraversion));
    if (computed.spontaneity_flexibility != null) values.push(safeNum(computed.spontaneity_flexibility));
    if (values.length > 0) return avg(values);
  }

  // Fallback: calculate from raw responses
  const vals: number[] = [];
  // Q14 (risk), Q16 (spontaneity), Q17 (adventure)
  if (responses.q14 != null) vals.push(safeNum(responses.q14));
  if (responses.q16 != null) vals.push(safeNum(responses.q16));
  if (responses.q17 != null) vals.push(safeNum(responses.q17));
  // Q6 (extraversion items)
  if (responses.q6 != null) vals.push(safeNum(responses.q6));
  if (responses.q7 != null) vals.push(safeNum(responses.q7));
  
  return vals.length > 0 ? avg(vals) : 50;
}

/**
 * Social Score: 0 = intimate/private, 100 = social/communal
 * From extraversion + agreeableness questions.
 */
export function calculateSocialScore(responses: any, computed?: any): number {
  if (computed) {
    const values: number[] = [];
    if (computed.extraversion != null) values.push(safeNum(computed.extraversion));
    if (computed.agreeableness != null) values.push(safeNum(computed.agreeableness));
    if (computed.t_social != null) values.push(safeNum(computed.t_social));
    if (values.length > 0) return avg(values);
  }

  const vals: number[] = [];
  // Q6, Q7 extraversion; Q8, Q9 agreeableness
  if (responses.q6 != null) vals.push(safeNum(responses.q6));
  if (responses.q7 != null) vals.push(safeNum(responses.q7));
  if (responses.q8 != null) vals.push(safeNum(responses.q8));
  if (responses.q9 != null) vals.push(safeNum(responses.q9));

  return vals.length > 0 ? avg(vals) : 50;
}

/**
 * Luxury Score: 0 = authentic/rustic, 100 = polished/seamless
 * From Q34-Q37 (accounting for reverse scoring on Q35, Q37).
 */
export function calculateLuxuryScore(responses: any): number {
  const vals: number[] = [];
  if (responses.q34 != null) vals.push(safeNum(responses.q34));
  if (responses.q35 != null) vals.push(reverseScore(safeNum(responses.q35)));
  if (responses.q36 != null) vals.push(safeNum(responses.q36));
  if (responses.q37 != null) vals.push(reverseScore(safeNum(responses.q37)));

  return vals.length > 0 ? avg(vals) : 50;
}

/**
 * Pace Score: 0 = slow/unhurried, 100 = packed/scheduled
 * From Q38-Q40 (accounting for reverse scoring on Q39).
 */
export function calculatePaceScore(responses: any): number {
  const vals: number[] = [];
  if (responses.q38 != null) vals.push(safeNum(responses.q38));
  if (responses.q39 != null) vals.push(reverseScore(safeNum(responses.q39)));
  if (responses.q40 != null) vals.push(safeNum(responses.q40));

  return vals.length > 0 ? avg(vals) : 50;
}

/**
 * Sensory Priorities: Extract top 2 sensory preferences from Q41 ranking.
 */
export function getSensoryPriorities(responses: any): TraitScores["sensory"] {
  const defaultScores: Record<string, number> = {
    visual: 50,
    culinary: 50,
    nature: 50,
    cultural: 50,
    wellness: 50,
  };

  // Q41 may be stored as a ranking array: ['visual', 'nature', 'culinary', ...]
  const ranking = responses.q41_sensory_ranking || responses.q41;
  
  if (Array.isArray(ranking) && ranking.length >= 2) {
    const scores: Record<string, number> = {};
    ranking.forEach((item: string, idx: number) => {
      const key = item.toLowerCase().replace(/\s+/g, '_');
      scores[key] = Math.round(100 - (idx * (100 / ranking.length)));
    });
    return {
      top1: ranking[0],
      top2: ranking[1],
      scores,
    };
  }

  // Fallback: derive from individual sensory questions if available
  if (responses.q41_visual != null) defaultScores.visual = safeNum(responses.q41_visual);
  if (responses.q41_culinary != null) defaultScores.culinary = safeNum(responses.q41_culinary);
  if (responses.q41_nature != null) defaultScores.nature = safeNum(responses.q41_nature);
  if (responses.q41_cultural != null) defaultScores.cultural = safeNum(responses.q41_cultural);
  if (responses.q41_wellness != null) defaultScores.wellness = safeNum(responses.q41_wellness);

  const sorted = Object.entries(defaultScores).sort((a, b) => b[1] - a[1]);

  return {
    top1: sorted[0][0],
    top2: sorted[1][0],
    scores: defaultScores,
  };
}

/**
 * Calculate all trait scores at once.
 */
export function calculateAllTraits(responses: any, computed?: any): TraitScores {
  return {
    energy: calculateEnergyScore(responses, computed),
    social: calculateSocialScore(responses, computed),
    luxury: calculateLuxuryScore(responses),
    pace: calculatePaceScore(responses),
    sensory: getSensoryPriorities(responses),
  };
}

/**
 * Generate a template-based travel personality narrative.
 */
export function generateNarrative(traits: TraitScores): string {
  const energyDesc = traits.energy > 60 ? "achievement-driven" : traits.energy < 40 ? "restorative and calming" : "balanced";
  const socialDesc = traits.social > 60 ? "social and communal" : traits.social < 40 ? "intimate and private" : "a mix of social and solitary";
  const luxuryDesc = traits.luxury > 60 ? "seamless, polished luxury" : traits.luxury < 40 ? "authentic, rustic experiences" : "a blend of comfort and authenticity";
  const paceDesc = traits.pace > 60 ? "packed with activities" : traits.pace < 40 ? "slow and unhurried" : "moderately paced";

  const top1Label = SENSORY_LABELS[traits.sensory.top1] || traits.sensory.top1;
  const top2Label = SENSORY_LABELS[traits.sensory.top2] || traits.sensory.top2;

  return `You are drawn to ${energyDesc} travel experiences. You prefer ${socialDesc} settings and prioritize ${top1Label} and ${top2Label} in your destinations. Your ideal pace is ${paceDesc}, and you appreciate ${luxuryDesc}. These preferences shape your perfect destination — one that resonates with who you are at your core.`;
}

/**
 * Generate a headline from traits.
 */
export function generateHeadline(traits: TraitScores, computed?: any): string {
  if (computed?.tribe) {
    const tribe = computed.tribe.charAt(0).toUpperCase() + computed.tribe.slice(1);
    return `The ${tribe}`;
  }

  const energyWord = traits.energy > 60 ? "Adventurous" : traits.energy < 40 ? "Contemplative" : "Curious";
  const socialWord = traits.social > 60 ? "Connector" : traits.social < 40 ? "Wanderer" : "Explorer";
  return `The ${energyWord} ${socialWord}`;
}

/**
 * Generate a tagline from traits.
 */
export function generateTagline(traits: TraitScores): string {
  const top1Label = SENSORY_LABELS[traits.sensory.top1] || traits.sensory.top1;
  
  if (traits.energy < 40 && traits.social < 40) return "Seeking beauty in quiet spaces";
  if (traits.energy > 60 && traits.social > 60) return "Chasing horizons with kindred spirits";
  if (traits.energy > 60 && traits.social < 40) return "Conquering peaks on your own terms";
  if (traits.energy < 40 && traits.social > 60) return "Finding connection in serene settings";
  return `Drawn to ${top1Label.toLowerCase()} and authentic discovery`;
}

export { SENSORY_LABELS };
