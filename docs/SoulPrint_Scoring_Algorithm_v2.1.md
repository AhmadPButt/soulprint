# SoulPrint v2.1 — Scoring Algorithm Specification

## Technical Implementation Guide for Application Development

**Version:** 2.1  
**Last Updated:** November 2025  
**Purpose:** Complete specification for building a SoulPrint questionnaire application with automated scoring, database storage, and LLM-powered narrative generation.

---

## 1. SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SOULPRINT APPLICATION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌───────────┐ │
│  │ QUESTIONNAIRE│───▶│   SCORING    │───▶│   DATABASE   │───▶│    LLM    │ │
│  │   CAPTURE    │    │    ENGINE    │    │    STORAGE   │    │ NARRATIVE │ │
│  └──────────────┘    └──────────────┘    └──────────────┘    └───────────┘ │
│         │                   │                   │                   │       │
│         ▼                   ▼                   ▼                   ▼       │
│   55 Questions        42 Scores           All Data +          Personalized  │
│   Raw Responses       6 KPIs              Computed Fields      Insights     │
│                       5 Tensions                                            │
│                       Tribe + EAI                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. DATA CAPTURE SCHEMA

### 2.1 Question Types & Input Validation

```typescript
enum QuestionType {
  SLIDER = "slider",           // 0-100 integer
  MULTI_SELECT = "multi",      // Array of strings
  SINGLE_SELECT = "single",    // Single string
  RANKING = "ranking",         // Array of 5 integers [1-5]
  TEXT_SHORT = "text_short",   // String, max 100 chars
  TEXT_LONG = "text_long",     // String, max 2000 chars
  EMAIL = "email",             // Valid email format
  DROPDOWN = "dropdown"        // Single string from list
}

interface QuestionDefinition {
  id: string;                  // "Q1", "Q2", etc.
  type: QuestionType;
  required: boolean;
  validation?: ValidationRule;
  options?: string[];          // For select/dropdown types
  reverse_scored?: boolean;    // For personality items
  construct?: string;          // Which construct this feeds
}
```

### 2.2 Complete Question Definitions

```typescript
const QUESTIONS: QuestionDefinition[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // CHAPTER I — THE LAND OF FIRE (Contextual/Qualitative)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "Q1",
    type: "multi",
    required: true,
    construct: "draws",
    options: [
      "fire_mystique",      // "The Land of Fire and its ancient mystique"
      "transition",         // "A shift or transition I'm moving through"
      "depth_clarity",      // "A desire for depth, meaning, and clarity"
      "architecture_stone", // "The fusion of modern architecture and old stone"
      "unfamiliar_terrain"  // "The sense of unfamiliar terrain calling me"
    ]
  },
  {
    id: "Q2",
    type: "single",
    required: true,
    construct: "pace",
    options: ["slow", "balanced", "adventurous"]
  },
  {
    id: "Q3",
    type: "slider",
    required: true,
    construct: "rhythm",
    validation: { min: 0, max: 100 }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CHAPTER II — CORE TRAITS (Big Five Personality)
  // ═══════════════════════════════════════════════════════════════════════
  
  // EXTRAVERSION (E) — Q4-Q7
  { id: "Q4", type: "slider", required: true, construct: "E", reverse_scored: false },
  { id: "Q5", type: "slider", required: true, construct: "E", reverse_scored: false },
  { id: "Q6", type: "slider", required: true, construct: "E", reverse_scored: false },
  { id: "Q7", type: "slider", required: true, construct: "E", reverse_scored: true },
  
  // OPENNESS (O) — Q8-Q11
  { id: "Q8", type: "slider", required: true, construct: "O", reverse_scored: false },
  { id: "Q9", type: "slider", required: true, construct: "O", reverse_scored: false },
  { id: "Q10", type: "slider", required: true, construct: "O", reverse_scored: false },
  { id: "Q11", type: "slider", required: true, construct: "O", reverse_scored: true },
  
  // CONSCIENTIOUSNESS (C) — Q12-Q15
  { id: "Q12", type: "slider", required: true, construct: "C", reverse_scored: false },
  { id: "Q13", type: "slider", required: true, construct: "C", reverse_scored: false },
  { id: "Q14", type: "slider", required: true, construct: "C", reverse_scored: false },
  { id: "Q15", type: "slider", required: true, construct: "C", reverse_scored: true },
  
  // AGREEABLENESS (A) — Q16-Q19
  { id: "Q16", type: "slider", required: true, construct: "A", reverse_scored: false },
  { id: "Q17", type: "slider", required: true, construct: "A", reverse_scored: false },
  { id: "Q18", type: "slider", required: true, construct: "A", reverse_scored: false },
  { id: "Q19", type: "slider", required: true, construct: "A", reverse_scored: true },
  
  // EMOTIONAL STABILITY (ES) — Q20-Q23
  { id: "Q20", type: "slider", required: true, construct: "ES", reverse_scored: false },
  { id: "Q21", type: "slider", required: true, construct: "ES", reverse_scored: false },
  { id: "Q22", type: "slider", required: true, construct: "ES", reverse_scored: true },
  { id: "Q23", type: "slider", required: true, construct: "ES", reverse_scored: true },

  // ═══════════════════════════════════════════════════════════════════════
  // CHAPTER III — TRAVEL BEHAVIOR
  // ═══════════════════════════════════════════════════════════════════════
  
  // SPONTANEITY/FLEXIBILITY (SF) — Q24-Q27
  { id: "Q24", type: "slider", required: true, construct: "SF", reverse_scored: false },
  { id: "Q25", type: "slider", required: true, construct: "SF", reverse_scored: false },
  { id: "Q26", type: "slider", required: true, construct: "SF", reverse_scored: false },
  { id: "Q27", type: "slider", required: true, construct: "SF", reverse_scored: true },
  
  // ADVENTURE ORIENTATION (AO) — Q28-Q30
  { id: "Q28", type: "slider", required: true, construct: "AO", reverse_scored: false },
  { id: "Q29", type: "slider", required: true, construct: "AO", reverse_scored: false },
  { id: "Q30", type: "slider", required: true, construct: "AO", reverse_scored: true },
  
  // ENVIRONMENTAL ADAPTATION (EA) — Q31-Q33
  { id: "Q31", type: "slider", required: true, construct: "EA", reverse_scored: false },
  { id: "Q32", type: "slider", required: true, construct: "EA", reverse_scored: false },
  { id: "Q33", type: "slider", required: true, construct: "EA", reverse_scored: true },

  // ═══════════════════════════════════════════════════════════════════════
  // CHAPTER IV — ELEMENTAL RESONANCE
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "Q34",
    type: "ranking",
    required: true,
    construct: "elements",
    options: ["fire", "water", "stone", "urban", "desert"],
    validation: { 
      type: "ranking",
      message: "Must rank all 5 elements from 1-5 with no duplicates"
    }
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CHAPTER V — INNER COMPASS
  // ═══════════════════════════════════════════════════════════════════════
  
  // TRANSFORMATION (TR) — Q35-Q36
  { id: "Q35", type: "slider", required: true, construct: "TR", reverse_scored: false },
  { id: "Q36", type: "slider", required: true, construct: "TR", reverse_scored: false },
  
  // CLARITY (CL) — Q37-Q38
  { id: "Q37", type: "slider", required: true, construct: "CL", reverse_scored: false },
  { id: "Q38", type: "slider", required: true, construct: "CL", reverse_scored: false },
  
  // ALIVENESS (AL) — Q39-Q40
  { id: "Q39", type: "slider", required: true, construct: "AL", reverse_scored: false },
  { id: "Q40", type: "slider", required: true, construct: "AL", reverse_scored: false },
  
  // CONNECTION (CON) — Q41-Q42
  { id: "Q41", type: "slider", required: true, construct: "CON", reverse_scored: false },
  { id: "Q42", type: "slider", required: true, construct: "CON", reverse_scored: false },

  // ═══════════════════════════════════════════════════════════════════════
  // CHAPTER VI — STATE ASSESSMENT
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: "Q43",
    type: "single",
    required: true,
    construct: "life_phase",
    options: ["transition", "rebuilding", "awakening", "deepening", "search", "unfolding"]
  },
  {
    id: "Q44",
    type: "single",
    required: true,
    construct: "shift_desired",
    options: ["calm", "courage", "clarity", "softness", "aliveness", "reset"]
  },
  
  // EMOTIONAL BURDEN INDEX (EBI) — Q45 (4 sub-sliders)
  { id: "Q45_overwhelm", type: "slider", required: true, construct: "EBI" },
  { id: "Q45_uncertainty", type: "slider", required: true, construct: "EBI" },
  { id: "Q45_burnout", type: "slider", required: true, construct: "EBI" },
  { id: "Q45_disconnection", type: "slider", required: true, construct: "EBI" },
  
  {
    id: "Q46",
    type: "single",
    required: true,
    construct: "completion_need",
    options: ["let_go", "begin_again", "understand", "restore", "transform", "feel_again"]
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CHAPTER VII — NARRATIVE IDENTITY
  // ═══════════════════════════════════════════════════════════════════════
  { id: "Q47", type: "text_long", required: true, construct: "why_azerbaijan" },
  { id: "Q48", type: "text_long", required: true, construct: "journey_shape" },

  // ═══════════════════════════════════════════════════════════════════════
  // CHAPTER VIII — PRACTICALITIES
  // ═══════════════════════════════════════════════════════════════════════
  { id: "Q49", type: "text_short", required: true, construct: "name" },
  { id: "Q50", type: "email", required: true, construct: "email" },
  { id: "Q51", type: "dropdown", required: true, construct: "country" },
  { id: "Q52", type: "dropdown", required: true, construct: "passport" },
  { id: "Q53", type: "single", required: true, construct: "travel_companion",
    options: ["solo", "partner", "friend", "group"] },
  { id: "Q54", type: "single", required: true, construct: "room_type",
    options: ["single", "double", "twin", "suite"] },
  { id: "Q55", type: "text_long", required: false, construct: "dietary" }
];
```

---

## 3. SCORING ENGINE

### 3.1 Core Scoring Functions

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// REVERSE SCORING
// ═══════════════════════════════════════════════════════════════════════════

function reverseScore(value: number): number {
  return 100 - value;
}

// ═══════════════════════════════════════════════════════════════════════════
// TRAIT SCORING (Big Five + Travel Behavior)
// ═══════════════════════════════════════════════════════════════════════════

interface RawResponses {
  [key: string]: number | string | string[] | number[];
}

interface TraitScores {
  // Big Five (0-100)
  E: number;   // Extraversion
  O: number;   // Openness
  C: number;   // Conscientiousness
  A: number;   // Agreeableness
  ES: number;  // Emotional Stability
  
  // Travel Behavior (0-100)
  SF: number;  // Spontaneity/Flexibility
  AO: number;  // Adventure Orientation
  EA: number;  // Environmental Adaptation
  TFI: number; // Travel Freedom Index
  
  // Elemental (0-100)
  fire: number;
  water: number;
  stone: number;
  urban: number;
  desert: number;
  dominant_element: string;
  secondary_element: string;
  
  // Inner Compass (0-100)
  TR: number;  // Transformation
  CL: number;  // Clarity
  AL: number;  // Aliveness
  CON: number; // Connection
  top_motivation_1: string;
  top_motivation_2: string;
  
  // State
  life_phase: string;
  shift_desired: string;
  EBI: number;  // Emotional Burden Index (0-100)
  ETI: number;  // Emotional Travel Index (0-100)
  completion_need: string;
}

function calculateTraitScores(raw: RawResponses): TraitScores {
  
  // ─────────────────────────────────────────────────────────────────────────
  // BIG FIVE TRAITS
  // ─────────────────────────────────────────────────────────────────────────
  
  const E = (
    raw.Q4 + raw.Q5 + raw.Q6 + reverseScore(raw.Q7)
  ) / 4;
  
  const O = (
    raw.Q8 + raw.Q9 + raw.Q10 + reverseScore(raw.Q11)
  ) / 4;
  
  const C = (
    raw.Q12 + raw.Q13 + raw.Q14 + reverseScore(raw.Q15)
  ) / 4;
  
  const A = (
    raw.Q16 + raw.Q17 + raw.Q18 + reverseScore(raw.Q19)
  ) / 4;
  
  const ES = (
    raw.Q20 + raw.Q21 + reverseScore(raw.Q22) + reverseScore(raw.Q23)
  ) / 4;
  
  // ─────────────────────────────────────────────────────────────────────────
  // TRAVEL BEHAVIOR
  // ─────────────────────────────────────────────────────────────────────────
  
  const SF = (
    raw.Q24 + raw.Q25 + raw.Q26 + reverseScore(raw.Q27)
  ) / 4;
  
  const AO = (
    raw.Q28 + raw.Q29 + reverseScore(raw.Q30)
  ) / 3;
  
  const EA = (
    raw.Q31 + raw.Q32 + reverseScore(raw.Q33)
  ) / 3;
  
  const TFI = 0.4 * SF + 0.4 * AO + 0.2 * EA;
  
  // ─────────────────────────────────────────────────────────────────────────
  // ELEMENTAL RESONANCE
  // Ranking input: { fire: 1, water: 4, stone: 2, urban: 3, desert: 5 }
  // Score = (5 - rank) * 25
  // ─────────────────────────────────────────────────────────────────────────
  
  const elementRanks = raw.Q34 as { [key: string]: number };
  
  const fire = (5 - elementRanks.fire) * 25;
  const water = (5 - elementRanks.water) * 25;
  const stone = (5 - elementRanks.stone) * 25;
  const urban = (5 - elementRanks.urban) * 25;
  const desert = (5 - elementRanks.desert) * 25;
  
  const elementScores = { fire, water, stone, urban, desert };
  const sortedElements = Object.entries(elementScores)
    .sort((a, b) => b[1] - a[1]);
  
  const dominant_element = sortedElements[0][0];
  const secondary_element = sortedElements[1][0];
  
  // ─────────────────────────────────────────────────────────────────────────
  // INNER COMPASS
  // ─────────────────────────────────────────────────────────────────────────
  
  const TR = (raw.Q35 + raw.Q36) / 2;
  const CL = (raw.Q37 + raw.Q38) / 2;
  const AL = (raw.Q39 + raw.Q40) / 2;
  const CON = (raw.Q41 + raw.Q42) / 2;
  
  const motivationScores = { TR, CL, AL, CON };
  const motivationLabels = {
    TR: "Transformation",
    CL: "Clarity", 
    AL: "Aliveness",
    CON: "Connection"
  };
  const sortedMotivations = Object.entries(motivationScores)
    .sort((a, b) => b[1] - a[1]);
  
  const top_motivation_1 = motivationLabels[sortedMotivations[0][0]];
  const top_motivation_2 = motivationLabels[sortedMotivations[1][0]];
  
  // ─────────────────────────────────────────────────────────────────────────
  // STATE VARIABLES
  // ─────────────────────────────────────────────────────────────────────────
  
  const EBI = (
    raw.Q45_overwhelm + raw.Q45_uncertainty + 
    raw.Q45_burnout + raw.Q45_disconnection
  ) / 4;
  
  const ETI = (ES + (100 - EBI)) / 2;
  
  return {
    E, O, C, A, ES,
    SF, AO, EA, TFI,
    fire, water, stone, urban, desert,
    dominant_element, secondary_element,
    TR, CL, AL, CON,
    top_motivation_1, top_motivation_2,
    life_phase: raw.Q43 as string,
    shift_desired: raw.Q44 as string,
    EBI, ETI,
    completion_need: raw.Q46 as string
  };
}
```

### 3.2 Tension Index Calculations

```typescript
interface TensionScores {
  T_Social: number;    // |E - CON|
  T_Flow: number;      // |C - SF|
  T_Risk: number;      // |AO - EA|
  T_Elements: number;  // |Fire - Water|
  T_Tempo: number;     // |Stone - Urban|
}

function calculateTensions(traits: TraitScores): TensionScores {
  return {
    T_Social: Math.abs(traits.E - traits.CON),
    T_Flow: Math.abs(traits.C - traits.SF),
    T_Risk: Math.abs(traits.AO - traits.EA),
    T_Elements: Math.abs(traits.fire - traits.water),
    T_Tempo: Math.abs(traits.stone - traits.urban)
  };
}

// Tension interpretation thresholds
const TENSION_THRESHOLDS = {
  low: 15,      // 0-15: Minimal tension, integrated
  medium: 30,   // 16-30: Moderate tension, aware
  high: 100     // 31+: High tension, needs attention
};

function interpretTension(value: number): "low" | "medium" | "high" {
  if (value <= TENSION_THRESHOLDS.low) return "low";
  if (value <= TENSION_THRESHOLDS.medium) return "medium";
  return "high";
}
```

### 3.3 Experience Alignment Index (EAI) — Azerbaijan

```typescript
function calculateEAI(traits: TraitScores): number {
  // Core alignment with Azerbaijan's offerings
  // Fire (40%): Yanar Dag, mud volcanoes, Zoroastrian fire temples
  // Stone (40%): Ancient petroglyphs, caravanserais, old Baku
  // Desert (20%): Gobustan, semi-arid landscapes
  
  const coreAlign = (
    0.4 * (traits.fire / 100) +
    0.4 * (traits.stone / 100) +
    0.2 * (traits.desert / 100)
  );
  
  // Bonus for high Openness (continuous, max +3%)
  const oBonus = Math.max(0, (traits.O - 50) / 50 * 0.03);
  
  // Bonus for high Transformation motive (continuous, max +3%)
  const trBonus = Math.max(0, (traits.TR - 50) / 50 * 0.03);
  
  // Cap at 100
  const eai = Math.min(coreAlign + oBonus + trBonus, 1.0) * 100;
  
  return Math.round(eai * 100) / 100; // Round to 2 decimal places
}
```

### 3.4 Business KPI Calculations

```typescript
interface BusinessKPIs {
  // Core KPIs (0-100)
  SPI: number;       // Spend Propensity Index
  URS: number;       // Upsell Receptivity Score
  NPS_predicted: number; // Predicted NPS (5-10 scale)
  CRS: number;       // Complaint Risk Score
  GFI: number;       // Group Friction Index
  CGS: number;       // Content Generation Score
  
  // Tiers
  SPI_tier: "High" | "Medium" | "Low";
  URS_tier: "High" | "Medium" | "Low";
  NPS_tier: "Promoter" | "Passive" | "Detractor";
  CRS_tier: "High" | "Medium" | "Low";
  GFI_tier: "High" | "Medium" | "Low";
  CGS_tier: "High" | "Medium" | "Low";
  
  // Tribe
  tribe: "A_Hunters" | "B_Observers" | "C_Connectors" | "Mixed";
  tribe_confidence: "High" | "Medium" | "Low";
  
  // Flags
  upsell_priority: "Priority 1" | "Priority 2" | "Priority 3";
  risk_flag: "HIGH RISK" | "Monitor" | "OK";
  content_flag: boolean;
}

function calculateBusinessKPIs(
  traits: TraitScores, 
  eai: number,
  groupMeans?: { E: number; SF: number }  // Optional for GFI
): BusinessKPIs {
  
  // ─────────────────────────────────────────────────────────────────────────
  // SPEND PROPENSITY INDEX (SPI)
  // Higher O + AL + TR + lower C + higher SF = more likely to spend
  // ─────────────────────────────────────────────────────────────────────────
  const SPI = (
    0.35 * traits.O +
    0.25 * traits.AL +
    0.20 * traits.TR +
    0.10 * (100 - traits.C) +
    0.10 * traits.SF
  );
  
  // ─────────────────────────────────────────────────────────────────────────
  // UPSELL RECEPTIVITY SCORE (URS)
  // Higher A + SF + ES + lower EBI = more receptive to upsells
  // ─────────────────────────────────────────────────────────────────────────
  const URS = (
    0.30 * traits.A +
    0.25 * traits.SF +
    0.25 * traits.ES +
    0.20 * (100 - traits.EBI)
  );
  
  // ─────────────────────────────────────────────────────────────────────────
  // NPS PREDICTED (5-10 scale)
  // Base 5 + EAI bonus + TR bonus + emotional availability bonus
  // ─────────────────────────────────────────────────────────────────────────
  const NPS_predicted = (
    5 +
    (eai / 100) * 3 +
    (traits.TR / 100) * 1.5 +
    ((100 - traits.EBI) / 100) * 0.5
  );
  
  // ─────────────────────────────────────────────────────────────────────────
  // COMPLAINT RISK SCORE (CRS)
  // Lower ES + lower EA + higher EBI + lower A = higher complaint risk
  // ─────────────────────────────────────────────────────────────────────────
  const CRS = (
    0.40 * (100 - traits.ES) +
    0.30 * (100 - traits.EA) +
    0.20 * traits.EBI +
    0.10 * (100 - traits.A)
  );
  
  // ─────────────────────────────────────────────────────────────────────────
  // GROUP FRICTION INDEX (GFI)
  // Deviation from group mean + low A + low CON = friction potential
  // Uses placeholder mean=50 if no group data available
  // ─────────────────────────────────────────────────────────────────────────
  const meanE = groupMeans?.E ?? 50;
  const meanSF = groupMeans?.SF ?? 50;
  
  const GFI = (
    0.35 * Math.abs(traits.E - meanE) +
    0.25 * (100 - traits.A) +
    0.25 * Math.abs(traits.SF - meanSF) +
    0.15 * (100 - traits.CON)
  );
  
  // ─────────────────────────────────────────────────────────────────────────
  // CONTENT GENERATION SCORE (CGS)
  // Higher E + Urban + O + AL = more likely to create/share content
  // ─────────────────────────────────────────────────────────────────────────
  const CGS = (
    0.40 * traits.E +
    0.30 * traits.urban +
    0.20 * traits.O +
    0.10 * traits.AL
  );
  
  // ─────────────────────────────────────────────────────────────────────────
  // TIER CLASSIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  const tierify = (val: number): "High" | "Medium" | "Low" => {
    if (val >= 70) return "High";
    if (val >= 40) return "Medium";
    return "Low";
  };
  
  const tierifyCRS = (val: number): "High" | "Medium" | "Low" => {
    if (val >= 60) return "High";
    if (val >= 30) return "Medium";
    return "Low";
  };
  
  const tierifyGFI = (val: number): "High" | "Medium" | "Low" => {
    if (val >= 50) return "High";
    if (val >= 25) return "Medium";
    return "Low";
  };
  
  const tierifyNPS = (val: number): "Promoter" | "Passive" | "Detractor" => {
    if (val >= 9) return "Promoter";
    if (val >= 7) return "Passive";
    return "Detractor";
  };
  
  // ─────────────────────────────────────────────────────────────────────────
  // TRIBE ASSIGNMENT
  // ─────────────────────────────────────────────────────────────────────────
  let tribe: BusinessKPIs["tribe"];
  
  if (traits.E >= 60 && traits.ES >= 60) {
    tribe = "A_Hunters";  // Bold, stable adventurers
  } else if (traits.O >= 60 && traits.ES < 50) {
    tribe = "B_Observers";  // Sensitive, depth-seeking explorers
  } else if (traits.A >= 60) {
    tribe = "C_Connectors";  // Social harmonizers
  } else {
    tribe = "Mixed";  // Balanced or complex profile
  }
  
  // Tribe confidence based on trait strength
  let tribe_confidence: BusinessKPIs["tribe_confidence"];
  if (tribe === "Mixed") {
    tribe_confidence = "Low";
  } else if (traits.E >= 75 || traits.O >= 75 || traits.A >= 75) {
    tribe_confidence = "High";
  } else {
    tribe_confidence = "Medium";
  }
  
  // ─────────────────────────────────────────────────────────────────────────
  // FLAGS
  // ─────────────────────────────────────────────────────────────────────────
  let upsell_priority: BusinessKPIs["upsell_priority"];
  if (SPI >= 60 && URS >= 60) {
    upsell_priority = "Priority 1";
  } else if (SPI >= 60 || URS >= 60) {
    upsell_priority = "Priority 2";
  } else {
    upsell_priority = "Priority 3";
  }
  
  let risk_flag: BusinessKPIs["risk_flag"];
  if (CRS >= 50) {
    risk_flag = "HIGH RISK";
  } else if (CRS >= 30) {
    risk_flag = "Monitor";
  } else {
    risk_flag = "OK";
  }
  
  const content_flag = CGS >= 70;
  
  return {
    SPI: Math.round(SPI * 100) / 100,
    URS: Math.round(URS * 100) / 100,
    NPS_predicted: Math.round(NPS_predicted * 100) / 100,
    CRS: Math.round(CRS * 100) / 100,
    GFI: Math.round(GFI * 100) / 100,
    CGS: Math.round(CGS * 100) / 100,
    SPI_tier: tierify(SPI),
    URS_tier: tierify(URS),
    NPS_tier: tierifyNPS(NPS_predicted),
    CRS_tier: tierifyCRS(CRS),
    GFI_tier: tierifyGFI(GFI),
    CGS_tier: tierify(CGS),
    tribe,
    tribe_confidence,
    upsell_priority,
    risk_flag,
    content_flag
  };
}
```

---

## 4. DATABASE SCHEMA

### 4.1 Primary Tables

```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- RESPONDENTS TABLE (Core identity & practicalities)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE respondents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Identity (Q49-Q52)
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  country VARCHAR(100) NOT NULL,
  passport_nationality VARCHAR(100) NOT NULL,
  
  -- Travel Preferences (Q53-Q55)
  travel_companion VARCHAR(20),  -- solo, partner, friend, group
  room_type VARCHAR(20),         -- single, double, twin, suite
  dietary_preferences TEXT,
  
  -- Expedition assignment
  expedition_id UUID REFERENCES expeditions(id),
  status VARCHAR(20) DEFAULT 'pending'  -- pending, confirmed, completed
);

-- ═══════════════════════════════════════════════════════════════════════════
-- RAW RESPONSES TABLE (All question answers)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE raw_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  respondent_id UUID REFERENCES respondents(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Chapter I: Context
  q1_draws TEXT[],           -- Multi-select array
  q2_pace VARCHAR(20),       -- slow, balanced, adventurous
  q3_rhythm INTEGER,         -- 0-100
  
  -- Chapter II: Big Five (all 0-100)
  q4_e1 INTEGER, q5_e2 INTEGER, q6_e3 INTEGER, q7_e4_r INTEGER,
  q8_o1 INTEGER, q9_o2 INTEGER, q10_o3 INTEGER, q11_o4_r INTEGER,
  q12_c1 INTEGER, q13_c2 INTEGER, q14_c3 INTEGER, q15_c4_r INTEGER,
  q16_a1 INTEGER, q17_a2 INTEGER, q18_a3 INTEGER, q19_a4_r INTEGER,
  q20_es1 INTEGER, q21_es2 INTEGER, q22_es3_r INTEGER, q23_es4_r INTEGER,
  
  -- Chapter III: Travel Behavior (all 0-100)
  q24_sf1 INTEGER, q25_sf2 INTEGER, q26_sf3 INTEGER, q27_sf4_r INTEGER,
  q28_ao1 INTEGER, q29_ao2 INTEGER, q30_ao3_r INTEGER,
  q31_ea1 INTEGER, q32_ea2 INTEGER, q33_ea3_r INTEGER,
  
  -- Chapter IV: Elemental (ranks 1-5)
  q34_fire_rank INTEGER, q34_water_rank INTEGER, q34_stone_rank INTEGER,
  q34_urban_rank INTEGER, q34_desert_rank INTEGER,
  
  -- Chapter V: Inner Compass (all 0-100)
  q35_tr1 INTEGER, q36_tr2 INTEGER,
  q37_cl1 INTEGER, q38_cl2 INTEGER,
  q39_al1 INTEGER, q40_al2 INTEGER,
  q41_con1 INTEGER, q42_con2 INTEGER,
  
  -- Chapter VI: State
  q43_life_phase VARCHAR(20),
  q44_shift_desired VARCHAR(20),
  q45_overwhelm INTEGER, q45_uncertainty INTEGER,
  q45_burnout INTEGER, q45_disconnection INTEGER,
  q46_completion_need VARCHAR(20),
  
  -- Chapter VII: Narrative
  q47_why_azerbaijan TEXT,
  q48_journey_shape TEXT,
  
  CONSTRAINT valid_slider CHECK (
    q3_rhythm BETWEEN 0 AND 100 AND
    q4_e1 BETWEEN 0 AND 100 AND q5_e2 BETWEEN 0 AND 100 -- etc.
  ),
  CONSTRAINT valid_ranking CHECK (
    q34_fire_rank BETWEEN 1 AND 5 AND
    q34_water_rank BETWEEN 1 AND 5 AND
    q34_stone_rank BETWEEN 1 AND 5 AND
    q34_urban_rank BETWEEN 1 AND 5 AND
    q34_desert_rank BETWEEN 1 AND 5
  )
);

-- ═══════════════════════════════════════════════════════════════════════════
-- COMPUTED SCORES TABLE (All calculated values)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE computed_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  respondent_id UUID REFERENCES respondents(id) ON DELETE CASCADE,
  raw_response_id UUID REFERENCES raw_responses(id) ON DELETE CASCADE,
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Big Five Traits (0-100)
  extraversion DECIMAL(5,2),
  openness DECIMAL(5,2),
  conscientiousness DECIMAL(5,2),
  agreeableness DECIMAL(5,2),
  emotional_stability DECIMAL(5,2),
  
  -- Travel Behavior (0-100)
  spontaneity_flexibility DECIMAL(5,2),
  adventure_orientation DECIMAL(5,2),
  environmental_adaptation DECIMAL(5,2),
  travel_freedom_index DECIMAL(5,2),
  
  -- Elemental (0-100)
  fire_score DECIMAL(5,2),
  water_score DECIMAL(5,2),
  stone_score DECIMAL(5,2),
  urban_score DECIMAL(5,2),
  desert_score DECIMAL(5,2),
  dominant_element VARCHAR(10),
  secondary_element VARCHAR(10),
  
  -- Inner Compass (0-100)
  transformation DECIMAL(5,2),
  clarity DECIMAL(5,2),
  aliveness DECIMAL(5,2),
  connection DECIMAL(5,2),
  top_motivation_1 VARCHAR(20),
  top_motivation_2 VARCHAR(20),
  
  -- State
  life_phase VARCHAR(20),
  shift_desired VARCHAR(20),
  emotional_burden_index DECIMAL(5,2),
  emotional_travel_index DECIMAL(5,2),
  completion_need VARCHAR(20),
  
  -- Tensions (0-100)
  t_social DECIMAL(5,2),
  t_flow DECIMAL(5,2),
  t_risk DECIMAL(5,2),
  t_elements DECIMAL(5,2),
  t_tempo DECIMAL(5,2),
  
  -- Experience Alignment
  eai_azerbaijan DECIMAL(5,2),
  
  -- Business KPIs (0-100 except NPS which is 5-10)
  spi DECIMAL(5,2),
  spi_tier VARCHAR(10),
  urs DECIMAL(5,2),
  urs_tier VARCHAR(10),
  nps_predicted DECIMAL(4,2),
  nps_tier VARCHAR(15),
  crs DECIMAL(5,2),
  crs_tier VARCHAR(10),
  gfi DECIMAL(5,2),
  gfi_tier VARCHAR(10),
  cgs DECIMAL(5,2),
  cgs_tier VARCHAR(10),
  
  -- Tribe
  tribe VARCHAR(20),
  tribe_confidence VARCHAR(10),
  
  -- Flags
  upsell_priority VARCHAR(15),
  risk_flag VARCHAR(15),
  content_flag BOOLEAN
);

-- ═══════════════════════════════════════════════════════════════════════════
-- NARRATIVE INSIGHTS TABLE (LLM-generated content)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE narrative_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  respondent_id UUID REFERENCES respondents(id) ON DELETE CASCADE,
  computed_scores_id UUID REFERENCES computed_scores(id) ON DELETE CASCADE,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- LLM metadata
  model_used VARCHAR(50),        -- e.g., "claude-3-sonnet"
  prompt_version VARCHAR(20),    -- Track prompt iterations
  
  -- Generated narratives
  soulprint_summary TEXT,        -- 2-3 paragraph overview
  traveler_archetype TEXT,       -- Archetype name + description
  journey_recommendations TEXT,  -- Personalized Azerbaijan itinerary suggestions
  growth_edges TEXT,             -- Areas for personal development
  group_compatibility_notes TEXT,-- How they'll interact with others
  guide_briefing TEXT,           -- Internal notes for expedition guides
  
  -- For display
  headline VARCHAR(255),         -- One-line summary
  tagline VARCHAR(255),          -- Evocative phrase
  
  -- Quality tracking
  regeneration_count INTEGER DEFAULT 0,
  user_rating INTEGER,           -- 1-5 if we collect feedback
  
  UNIQUE(respondent_id, prompt_version)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- EXPEDITIONS TABLE (Group assignments)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE expeditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  capacity INTEGER DEFAULT 12,
  status VARCHAR(20) DEFAULT 'planning',  -- planning, confirmed, active, completed
  
  -- Group-level computed metrics (updated when members change)
  avg_extraversion DECIMAL(5,2),
  avg_openness DECIMAL(5,2),
  avg_spontaneity_flexibility DECIMAL(5,2),
  dominant_tribe VARCHAR(20),
  group_friction_assessment TEXT
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX idx_respondents_email ON respondents(email);
CREATE INDEX idx_respondents_expedition ON respondents(expedition_id);
CREATE INDEX idx_computed_scores_respondent ON computed_scores(respondent_id);
CREATE INDEX idx_computed_scores_tribe ON computed_scores(tribe);
CREATE INDEX idx_narrative_insights_respondent ON narrative_insights(respondent_id);
```

---

## 5. LLM NARRATIVE GENERATION

### 5.1 System Prompt Template

```typescript
const NARRATIVE_SYSTEM_PROMPT = `You are the Erranza SoulPrint Narrator, a psychologically sophisticated guide who transforms quantitative assessment data into evocative, personalized travel narratives.

Your voice is:
- Warm but not saccharine
- Insightful without being clinical
- Poetic but grounded
- Encouraging growth without being preachy

You write for an audience of thoughtful, introspective travelers seeking meaningful experiences in Azerbaijan. They value depth over platitudes.

IMPORTANT CONSTRAINTS:
- Never invent biographical details not in the data
- Keep narratives under specified word limits
- Reference specific scores only when contextually appropriate
- Focus on patterns and tensions, not just high scores
- Azerbaijan-specific recommendations must be geographically accurate`;
```

### 5.2 Narrative Generation Prompts

```typescript
interface NarrativeContext {
  name: string;
  traits: TraitScores;
  tensions: TensionScores;
  kpis: BusinessKPIs;
  eai: number;
  raw: {
    q1_draws: string[];
    q2_pace: string;
    q43_life_phase: string;
    q44_shift_desired: string;
    q46_completion_need: string;
    q47_why_azerbaijan: string;
    q48_journey_shape: string;
  };
}

function buildSoulprintSummaryPrompt(ctx: NarrativeContext): string {
  return `Generate a SoulPrint Summary for ${ctx.name}.

## PSYCHOMETRIC PROFILE

### Big Five Traits (0-100 scale)
- Extraversion: ${ctx.traits.E.toFixed(1)}
- Openness: ${ctx.traits.O.toFixed(1)}
- Conscientiousness: ${ctx.traits.C.toFixed(1)}
- Agreeableness: ${ctx.traits.A.toFixed(1)}
- Emotional Stability: ${ctx.traits.ES.toFixed(1)}

### Travel Behavior
- Spontaneity/Flexibility: ${ctx.traits.SF.toFixed(1)}
- Adventure Orientation: ${ctx.traits.AO.toFixed(1)}
- Environmental Adaptation: ${ctx.traits.EA.toFixed(1)}
- Travel Freedom Index: ${ctx.traits.TFI.toFixed(1)}

### Elemental Resonance
- Dominant: ${ctx.traits.dominant_element} (${ctx.traits[ctx.traits.dominant_element]})
- Secondary: ${ctx.traits.secondary_element} (${ctx.traits[ctx.traits.secondary_element]})
- Azerbaijan Alignment (EAI): ${ctx.eai.toFixed(1)}%

### Inner Compass
- Primary motivation: ${ctx.traits.top_motivation_1} (${ctx.traits[ctx.traits.top_motivation_1.substring(0,2).toUpperCase() === "TR" ? "TR" : ctx.traits.top_motivation_1.substring(0,2).toUpperCase()].toFixed(1)})
- Secondary motivation: ${ctx.traits.top_motivation_2}

### Tensions (Higher = more internal friction)
- Social Tension (E vs Connection): ${ctx.tensions.T_Social.toFixed(1)}
- Flow Tension (Structure vs Spontaneity): ${ctx.tensions.T_Flow.toFixed(1)}
- Risk Tension (Adventure vs Adaptation): ${ctx.tensions.T_Risk.toFixed(1)}
- Elemental Tension (Fire vs Water): ${ctx.tensions.T_Elements.toFixed(1)}
- Tempo Tension (Stone vs Urban): ${ctx.tensions.T_Tempo.toFixed(1)}

### Current State
- Life Phase: ${ctx.raw.q43_life_phase}
- Seeking: ${ctx.raw.q44_shift_desired}
- Emotional Burden: ${ctx.traits.EBI.toFixed(1)}/100
- Journey would be complete if: ${ctx.raw.q46_completion_need}

### Tribe Assignment
- ${ctx.kpis.tribe} (${ctx.kpis.tribe_confidence} confidence)

## THEIR OWN WORDS

Why Azerbaijan now:
"${ctx.raw.q47_why_azerbaijan}"

What shape they hope the journey carves:
"${ctx.raw.q48_journey_shape}"

---

## YOUR TASK

Write a 250-350 word SoulPrint Summary that:

1. Opens with an evocative one-sentence characterization of this traveler
2. Weaves together their dominant traits and motivations into a coherent portrait
3. Names and explores at least one key tension in their profile
4. Connects their psychological profile to what Azerbaijan specifically offers
5. Ends with an insight about what this journey might unlock for them

Do NOT:
- List scores or percentages
- Use clinical language
- Make up biographical details
- Be generically inspirational

Write in second person ("You are...") with warmth and specificity.`;
}

function buildJourneyRecommendationsPrompt(ctx: NarrativeContext): string {
  return `Generate personalized Azerbaijan journey recommendations for ${ctx.name}.

## PROFILE SUMMARY
- Tribe: ${ctx.kpis.tribe}
- Dominant Element: ${ctx.traits.dominant_element}
- Secondary Element: ${ctx.traits.secondary_element}
- EAI (Azerbaijan Fit): ${ctx.eai.toFixed(1)}%
- Top Motivation: ${ctx.traits.top_motivation_1}
- Pace Preference: ${ctx.raw.q2_pace}
- Emotional Burden: ${ctx.traits.EBI.toFixed(1)}/100
- Current Life Phase: ${ctx.raw.q43_life_phase}

## KEY TRAIT LEVELS
- Extraversion: ${ctx.traits.E >= 60 ? "High" : ctx.traits.E >= 40 ? "Moderate" : "Low"}
- Openness: ${ctx.traits.O >= 60 ? "High" : ctx.traits.O >= 40 ? "Moderate" : "Low"}
- Adventure Orientation: ${ctx.traits.AO >= 60 ? "High" : ctx.traits.AO >= 40 ? "Moderate" : "Low"}
- Environmental Adaptation: ${ctx.traits.EA >= 60 ? "High" : ctx.traits.EA >= 40 ? "Moderate" : "Low"}

## AZERBAIJAN EXPERIENCES TO REFERENCE

### Fire Element Experiences
- Yanar Dag (Burning Mountain) - eternal flame on hillside
- Mud volcanoes of Gobustan - lunar landscape, bubbling earth
- Ateshgah Fire Temple - Zoroastrian heritage
- Baku's flame towers at sunset

### Stone Element Experiences
- Gobustan petroglyphs - 40,000-year-old rock art
- Sheki Khan's Palace - intricate stained glass
- Old Baku (Icherisheher) - ancient walled city
- Khinalig village - isolated mountain settlement
- Caravanserais along the Silk Road

### Water Element Experiences
- Caspian Sea shore - meditative walks
- Highland springs and waterfalls
- Hammam experiences in Baku

### Urban Element Experiences
- Modern Baku architecture - Heydar Aliyev Center
- Baku Boulevard promenade
- Contemporary art galleries
- Night markets and tea houses

### Desert Element Experiences
- Gobustan semi-arid landscapes
- Absheron Peninsula stark beauty
- Silence and solitude moments

---

## YOUR TASK

Write 200-300 words of personalized journey recommendations that:

1. Suggest 3-4 specific experiences matched to their elemental profile
2. Consider their pace preference and energy levels
3. Account for their current emotional state and what they're seeking
4. Include one "stretch" experience that might expand their comfort zone
5. Note any scheduling considerations (e.g., if high EBI, build in rest)

Write as a knowledgeable friend sharing insider tips, not as a formal itinerary.`;
}

function buildGuideBriefingPrompt(ctx: NarrativeContext): string {
  return `Generate an internal guide briefing for ${ctx.name}.

## CORE METRICS
- Tribe: ${ctx.kpis.tribe} (${ctx.kpis.tribe_confidence})
- Risk Flag: ${ctx.kpis.risk_flag}
- Complaint Risk: ${ctx.kpis.CRS.toFixed(1)} (${ctx.kpis.CRS_tier})
- Upsell Priority: ${ctx.kpis.upsell_priority}
- Content Creator: ${ctx.kpis.content_flag ? "Yes" : "No"}

## PERSONALITY PROFILE
- Extraversion: ${ctx.traits.E.toFixed(1)}
- Agreeableness: ${ctx.traits.A.toFixed(1)}
- Emotional Stability: ${ctx.traits.ES.toFixed(1)}
- Spontaneity/Flexibility: ${ctx.traits.SF.toFixed(1)}
- Environmental Adaptation: ${ctx.traits.EA.toFixed(1)}
- Emotional Burden: ${ctx.traits.EBI.toFixed(1)}

## KEY TENSIONS
${ctx.tensions.T_Flow > 25 ? `- Structure vs Spontaneity tension (${ctx.tensions.T_Flow.toFixed(0)})` : ""}
${ctx.tensions.T_Risk > 25 ? `- Adventure vs Comfort tension (${ctx.tensions.T_Risk.toFixed(0)})` : ""}
${ctx.tensions.T_Social > 25 ? `- Social Energy vs Connection tension (${ctx.tensions.T_Social.toFixed(0)})` : ""}

## THEIR STATE
- Life Phase: ${ctx.raw.q43_life_phase}
- Seeking: ${ctx.raw.q44_shift_desired}
- Would feel complete if: ${ctx.raw.q46_completion_need}

---

## YOUR TASK

Write a 150-200 word confidential guide briefing covering:

1. **Approach Style**: How to best interact with this traveler
2. **Watch For**: Any flags or sensitivities to be aware of
3. **Opportunity**: What upsell or special experience might resonate
4. **Group Dynamics**: How they might interact with others
5. **Success Metric**: What would make this trip successful for them

Be direct and practical. This is operational guidance for experienced guides.`;
}
```

### 5.3 LLM Integration Example

```typescript
import Anthropic from "@anthropic-ai/sdk";

interface NarrativeInsights {
  soulprint_summary: string;
  traveler_archetype: string;
  journey_recommendations: string;
  growth_edges: string;
  group_compatibility_notes: string;
  guide_briefing: string;
  headline: string;
  tagline: string;
}

async function generateNarrativeInsights(
  ctx: NarrativeContext,
  apiKey: string
): Promise<NarrativeInsights> {
  
  const client = new Anthropic({ apiKey });
  
  // Generate each narrative component
  const summaryResponse = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: NARRATIVE_SYSTEM_PROMPT,
    messages: [{ 
      role: "user", 
      content: buildSoulprintSummaryPrompt(ctx) 
    }]
  });
  
  const recommendationsResponse = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: NARRATIVE_SYSTEM_PROMPT,
    messages: [{ 
      role: "user", 
      content: buildJourneyRecommendationsPrompt(ctx) 
    }]
  });
  
  const guideBriefingResponse = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: NARRATIVE_SYSTEM_PROMPT,
    messages: [{ 
      role: "user", 
      content: buildGuideBriefingPrompt(ctx) 
    }]
  });
  
  // Generate headline and tagline
  const headlineResponse = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 100,
    system: NARRATIVE_SYSTEM_PROMPT,
    messages: [{ 
      role: "user", 
      content: `Based on this profile, generate:
1. A headline (max 10 words) capturing their essence as a traveler
2. A tagline (max 15 words) that's evocative and memorable

Profile: ${ctx.kpis.tribe}, ${ctx.traits.dominant_element}-${ctx.traits.secondary_element}, seeking ${ctx.raw.q44_shift_desired}

Format your response as:
HEADLINE: [headline here]
TAGLINE: [tagline here]`
    }]
  });
  
  // Parse headline response
  const headlineText = headlineResponse.content[0].type === "text" 
    ? headlineResponse.content[0].text 
    : "";
  const headlineMatch = headlineText.match(/HEADLINE:\s*(.+)/);
  const taglineMatch = headlineText.match(/TAGLINE:\s*(.+)/);
  
  return {
    soulprint_summary: summaryResponse.content[0].type === "text" 
      ? summaryResponse.content[0].text : "",
    journey_recommendations: recommendationsResponse.content[0].type === "text"
      ? recommendationsResponse.content[0].text : "",
    guide_briefing: guideBriefingResponse.content[0].type === "text"
      ? guideBriefingResponse.content[0].text : "",
    headline: headlineMatch?.[1]?.trim() || "A Unique Traveler",
    tagline: taglineMatch?.[1]?.trim() || "Ready for Azerbaijan",
    
    // These would be generated with additional prompts:
    traveler_archetype: "", 
    growth_edges: "",
    group_compatibility_notes: ""
  };
}
```

---

## 6. COMPLETE SCORING PIPELINE

### 6.1 End-to-End Flow

```typescript
interface SoulPrintResult {
  respondent_id: string;
  traits: TraitScores;
  tensions: TensionScores;
  eai: number;
  kpis: BusinessKPIs;
  narratives: NarrativeInsights;
}

async function processSoulPrintSubmission(
  rawResponses: RawResponses,
  anthropicApiKey: string
): Promise<SoulPrintResult> {
  
  // Step 1: Calculate trait scores
  const traits = calculateTraitScores(rawResponses);
  
  // Step 2: Calculate tensions
  const tensions = calculateTensions(traits);
  
  // Step 3: Calculate EAI
  const eai = calculateEAI(traits);
  
  // Step 4: Calculate business KPIs
  const kpis = calculateBusinessKPIs(traits, eai);
  
  // Step 5: Build narrative context
  const narrativeContext: NarrativeContext = {
    name: rawResponses.Q49 as string,
    traits,
    tensions,
    kpis,
    eai,
    raw: {
      q1_draws: rawResponses.Q1 as string[],
      q2_pace: rawResponses.Q2 as string,
      q43_life_phase: rawResponses.Q43 as string,
      q44_shift_desired: rawResponses.Q44 as string,
      q46_completion_need: rawResponses.Q46 as string,
      q47_why_azerbaijan: rawResponses.Q47 as string,
      q48_journey_shape: rawResponses.Q48 as string
    }
  };
  
  // Step 6: Generate LLM narratives
  const narratives = await generateNarrativeInsights(
    narrativeContext, 
    anthropicApiKey
  );
  
  // Step 7: Store everything in database
  const respondent_id = await storeResults(
    rawResponses, traits, tensions, eai, kpis, narratives
  );
  
  return {
    respondent_id,
    traits,
    tensions,
    eai,
    kpis,
    narratives
  };
}
```

---

## 7. VALIDATION & ERROR HANDLING

### 7.1 Input Validation

```typescript
interface ValidationError {
  field: string;
  message: string;
}

function validateResponses(raw: RawResponses): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Slider validation (0-100)
  const sliderFields = [
    "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9", "Q10", "Q11",
    "Q12", "Q13", "Q14", "Q15", "Q16", "Q17", "Q18", "Q19",
    "Q20", "Q21", "Q22", "Q23", "Q24", "Q25", "Q26", "Q27",
    "Q28", "Q29", "Q30", "Q31", "Q32", "Q33",
    "Q35", "Q36", "Q37", "Q38", "Q39", "Q40", "Q41", "Q42",
    "Q45_overwhelm", "Q45_uncertainty", "Q45_burnout", "Q45_disconnection"
  ];
  
  for (const field of sliderFields) {
    const value = raw[field];
    if (typeof value !== "number" || value < 0 || value > 100) {
      errors.push({
        field,
        message: `${field} must be a number between 0 and 100`
      });
    }
  }
  
  // Ranking validation (Q34)
  const ranking = raw.Q34 as { [key: string]: number };
  if (ranking) {
    const ranks = Object.values(ranking);
    const uniqueRanks = new Set(ranks);
    if (ranks.length !== 5 || uniqueRanks.size !== 5 || 
        !ranks.every(r => r >= 1 && r <= 5)) {
      errors.push({
        field: "Q34",
        message: "Must rank all 5 elements from 1-5 with no duplicates"
      });
    }
  }
  
  // Email validation
  const email = raw.Q50 as string;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({
      field: "Q50",
      message: "Valid email address required"
    });
  }
  
  return errors;
}
```

---

## 8. APPENDIX: REVERSE-CODED ITEMS

| Question | Construct | Original Wording | Scoring |
|----------|-----------|------------------|---------|
| Q7 | Extraversion | "Quiet environments restore me more than social ones." | 100 - value |
| Q11 | Openness | "I prefer predictable environments over unknown terrain." | 100 - value |
| Q15 | Conscientiousness | "I often leave tasks incomplete or decisions unmade." | 100 - value |
| Q19 | Agreeableness | "I tend to voice disagreement when I don't like a plan." | 100 - value |
| Q22 | Emotional Stability | "Uncertainty about plans makes me anxious." | 100 - value |
| Q23 | Emotional Stability | "My emotions easily overwhelm me when plans change." | 100 - value |
| Q27 | Spontaneity/Flexibility | "I get tense when structure disappears." | 100 - value |
| Q30 | Adventure Orientation | "I prefer days that are calm and predictable." | 100 - value |
| Q33 | Environmental Adaptation | "Physical discomfort significantly impacts my mood." | 100 - value |

---

## 9. VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 2.1 | Nov 2025 | Added Q14 (Conscientiousness item 4), all Big Five now 4 items, renumbered Q15-Q55 |
| 2.0 | Nov 2025 | Optimized from v1.0: 54 questions, consolidated elemental to ranking, paired Inner Compass |
| 1.0 | Oct 2025 | Initial 61-question framework |

---

*Document generated for Erranza SoulPrint Application Development*
*Technical contact: development@erranza.com*
