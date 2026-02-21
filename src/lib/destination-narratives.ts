/**
 * Psychology-first narrative generation for destination matching.
 * Generates "Why This Fits You", tension notes, and affinity labels.
 */

import type { TraitScores } from "@/lib/soulprint-traits";

/** Returns an affinity label based on overall fit score */
export function getAffinityLabel(score: number): string {
  if (score >= 85) return "Exceptional Match";
  if (score >= 70) return "Strong Match";
  if (score >= 55) return "Good Match";
  return "Moderate Match";
}

/** Returns semantic color classes for affinity labels */
export function getAffinityColor(score: number): string {
  if (score >= 85) return "text-primary-foreground bg-primary border-primary";
  if (score >= 70) return "text-primary bg-primary/10 border-primary/30";
  return "text-amber-400 bg-amber-500/10 border-amber-500/30";
}

/** Generates a "Why This Fits You" narrative paragraph */
export function generateWhyItFits(
  destName: string,
  traits: TraitScores,
  breakdown: Record<string, number>,
  destination: any
): string {
  const dominantTrait = traits.energy < 40
    ? "restorative"
    : traits.energy > 60
    ? "adventure-seeking"
    : "balanced";

  const energyType = (destination.restorative_score ?? 50) > 60
    ? "calm, restorative"
    : (destination.restorative_score ?? 50) < 40
    ? "energising, stimulating"
    : "balanced";

  const paceDesc = traits.pace < 40
    ? "unhurried pace"
    : traits.pace > 60
    ? "active schedule"
    : "moderate rhythm";

  const socialDesc = (destination.social_vibe_score ?? 50) > 60
    ? "vibrant, communal"
    : (destination.social_vibe_score ?? 50) < 40
    ? "intimate, uncrowded"
    : "gently social";

  const userSocialContext = traits.social > 60
    ? "sociable nature"
    : traits.social < 40
    ? "preference for solitude"
    : "balanced social style";

  return `${destName} aligns with your ${dominantTrait} profile. Its ${energyType} environment suits your ${paceDesc}, and the ${socialDesc} setting complements your ${userSocialContext}.`;
}

/** Generates a "One Honest Note" tension paragraph */
export function generateTension(
  destName: string,
  traits: TraitScores,
  destination: any
): string {
  const destRestorative = destination.restorative_score ?? 50;
  const destSocial = destination.social_vibe_score ?? 50;
  const destLuxury = destination.luxury_style_score ?? 50;

  // Find the biggest gap between user and destination
  const tensions: { gap: number; text: string }[] = [];

  // Energy tension
  const userEnergy = traits.energy;
  const energyGap = Math.abs(userEnergy - (100 - destRestorative));
  if (energyGap > 25) {
    if (userEnergy < 40 && destRestorative < 40) {
      tensions.push({
        gap: energyGap,
        text: `Travellers with your restorative profile sometimes find the high-energy pace of ${destName} overwhelming at first. If you build in rest days between activities, this won't be a concern.`,
      });
    } else if (userEnergy > 60 && destRestorative > 60) {
      tensions.push({
        gap: energyGap,
        text: `Travellers with your adventurous profile sometimes find the slower pace of ${destName} under-stimulating. If you seek out the more active excursions available, this won't be a concern.`,
      });
    }
  }

  // Social tension
  const socialGap = Math.abs(traits.social - destSocial);
  if (socialGap > 30) {
    if (traits.social < 40 && destSocial > 60) {
      tensions.push({
        gap: socialGap,
        text: `Travellers with your private nature sometimes find the social bustle of ${destName} intense. If you choose accommodation away from the main tourist areas, this won't be a concern.`,
      });
    } else if (traits.social > 60 && destSocial < 40) {
      tensions.push({
        gap: socialGap,
        text: `Travellers with your sociable nature sometimes find ${destName}'s quieter atmosphere isolating. If you stay in communal lodges or join group tours, this won't be a concern.`,
      });
    }
  }

  // Luxury tension
  const luxuryGap = Math.abs(traits.luxury - destLuxury);
  if (luxuryGap > 30) {
    if (traits.luxury > 60 && destLuxury < 40) {
      tensions.push({
        gap: luxuryGap,
        text: `Travellers with your refined taste sometimes find ${destName}'s rustic infrastructure basic. If you book the premium tier accommodations available, this won't be a concern.`,
      });
    } else if (traits.luxury < 40 && destLuxury > 60) {
      tensions.push({
        gap: luxuryGap,
        text: `Travellers who value raw authenticity sometimes find ${destName}'s polished tourism scene too curated. If you venture into the local neighbourhoods, this won't be a concern.`,
      });
    }
  }

  if (tensions.length === 0) {
    return `${destName} aligns well across all your key dimensions. No significant tensions were identified between your profile and this destination.`;
  }

  // Return the tension with the biggest gap
  tensions.sort((a, b) => b.gap - a.gap);
  return tensions[0].text;
}

/** Generate a "Best for" tag based on destination scores */
export function generateBestForTag(destination: any): string {
  const scores: { key: string; label: string; val: number }[] = [
    { key: "restorative", label: "restoration", val: destination.restorative_score ?? 0 },
    { key: "cultural", label: "cultural immersion", val: destination.cultural_score ?? 0 },
    { key: "nature", label: "nature exploration", val: destination.nature_score ?? 0 },
    { key: "wellness", label: "wellness retreats", val: destination.wellness_score ?? 0 },
    { key: "culinary", label: "culinary discovery", val: destination.culinary_score ?? 0 },
    { key: "social", label: "social connection", val: destination.social_vibe_score ?? 0 },
    { key: "visual", label: "visual beauty", val: destination.visual_score ?? 0 },
    { key: "luxury", label: "luxury experiences", val: destination.luxury_style_score ?? 0 },
  ];

  scores.sort((a, b) => b.val - a.val);
  return `Best for ${scores[0].label}`;
}

/** Get dimension explanation for the detail page */
export function getDimensionExplanation(
  key: string,
  score: number,
  traits: TraitScores,
  destName: string
): string {
  const s = Math.round(score);
  switch (key) {
    case "energy":
      return traits.energy < 50
        ? `This destination's restorative pacing aligns ${s >= 80 ? "precisely" : "well"} with your recovery-oriented travel style.`
        : `${destName}'s active energy ${s >= 80 ? "perfectly matches" : "connects with"} your adventurous approach.`;
    case "social":
      return traits.social < 50
        ? `The intimate, uncrowded vibe matches your preference for privacy and quiet spaces.`
        : `The social atmosphere and communal experiences align with your outgoing nature.`;
    case "sensory":
      return `Your top sensory priorities — ${traits.sensory.top1} and ${traits.sensory.top2} — are ${s >= 85 ? "defining features" : "well-represented"} here.`;
    case "luxury":
      return traits.luxury < 50
        ? `Authentic, locally-rooted experiences with rustic elegance match your style.`
        : `Polished, seamless service and refined accommodations suit your taste.`;
    default:
      return `This dimension scores ${s}% alignment with your profile.`;
  }
}

/** Derive pace/energy descriptors from destination scores */
export function getDestinationPersonality(destination: any) {
  const restorative = destination.restorative_score ?? 50;
  const social = destination.social_vibe_score ?? 50;
  const luxury = destination.luxury_style_score ?? 50;

  // Sensory intensity = average of visual, culinary, nature, cultural_sensory, wellness
  const sensoryScores = [
    destination.visual_score,
    destination.culinary_score,
    destination.nature_score,
    destination.cultural_sensory_score,
    destination.wellness_score,
  ].filter((s: any) => s != null) as number[];
  const sensoryIntensity = sensoryScores.length > 0
    ? Math.round(sensoryScores.reduce((a: number, b: number) => a + b, 0) / sensoryScores.length)
    : 50;

  return {
    pace: restorative > 60 ? "Slow" : restorative < 40 ? "Fast" : "Moderate",
    socialVibe: social > 60 ? "Vibrant" : social < 40 ? "Intimate" : "Mixed",
    sensoryIntensity: sensoryIntensity > 60 ? "Rich" : sensoryIntensity < 40 ? "Calm" : "Moderate",
    luxuryStyle: luxury > 60 ? "Opulent" : luxury < 40 ? "Raw" : "Refined",
  };
}

/** Get elemental/climate tags from destination for display */
export function getElementalPills(destination: any): string[] {
  // Use climate_tags as the primary source
  if (destination.climate_tags && destination.climate_tags.length > 0) {
    return destination.climate_tags.slice(0, 3);
  }
  // Fallback: derive from region
  return [destination.region];
}
