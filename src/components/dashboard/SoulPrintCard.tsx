import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Fingerprint } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { TraitScores, SENSORY_LABELS, generateHeadline, generateTagline, generateNarrative } from "@/lib/soulprint-traits";

interface SoulPrintCardProps {
  traits: TraitScores;
  computed?: any;
  narrative?: any;
}

const SoulPrintCard = ({ traits, computed, narrative }: SoulPrintCardProps) => {
  const headline = narrative?.headline || generateHeadline(traits, computed);
  const tagline = narrative?.tagline || generateTagline(traits);
  // Only show narrative summary if it's NOT the old Azerbaijan content
  const rawSummary = narrative?.soulprint_summary || "";
  const isOldNarrative = rawSummary.toLowerCase().includes("azerbaijan") || rawSummary.includes("T_Social") || rawSummary.includes("O47") || rawSummary.length > 600;
  const description = !isOldNarrative && rawSummary ? rawSummary : generateNarrative(traits);

  const top1Label = SENSORY_LABELS[traits.sensory.top1] || traits.sensory.top1;
  const top2Label = SENSORY_LABELS[traits.sensory.top2] || traits.sensory.top2;

  const radarData = [
    { trait: "Energy", value: traits.energy, fullMark: 100 },
    { trait: "Social", value: traits.social, fullMark: 100 },
    { trait: "Luxury", value: traits.luxury, fullMark: 100 },
    { trait: "Pace", value: traits.pace, fullMark: 100 },
    { trait: top1Label.split(" ")[0], value: traits.sensory.scores[traits.sensory.top1] || 50, fullMark: 100 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Fingerprint className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{headline}</h2>
              <p className="text-sm text-muted-foreground italic">{tagline}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Radar Chart */}
          <div className="w-full h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="trait"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="You"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Dimension Bars */}
          <div className="space-y-3">
            <DimensionBar label="Energy" value={traits.energy} leftLabel="Restorative" rightLabel="Achievement" />
            <DimensionBar label="Social" value={traits.social} leftLabel="Intimate" rightLabel="Social" />
            <DimensionBar label="Luxury" value={traits.luxury} leftLabel="Authentic" rightLabel="Seamless" />
            <DimensionBar label="Pace" value={traits.pace} leftLabel="Slow" rightLabel="Packed" />
          </div>

          {/* Sensory Priorities */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Sensory Priorities</p>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-sm font-medium">
                {top1Label}
              </span>
              <span className="px-3 py-1 rounded-full bg-accent/15 text-accent-foreground text-sm font-medium">
                {top2Label}
              </span>
            </div>
          </div>

          {/* Narrative from AI (if available) or fallback */}
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

function DimensionBar({ label, value, leftLabel, rightLabel }: {
  label: string;
  value: number;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-muted-foreground">{leftLabel}</span>
        <span className="text-xs font-medium text-foreground">{label} — {value}</span>
        <span className="text-xs text-muted-foreground">{rightLabel}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default SoulPrintCard;
