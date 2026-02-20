import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Fingerprint, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { TraitScores, SENSORY_LABELS, generateHeadline, generateTagline, generateNarrative } from "@/lib/soulprint-traits";
import jsPDF from "jspdf";
import { useState } from "react";
import { toast } from "sonner";

interface SoulPrintCardProps {
  traits: TraitScores;
  computed?: any;
  narrative?: any;
}

const COLORS = ["hsl(255,47%,62%)", "hsl(40,30%,65%)", "hsl(200,60%,55%)", "hsl(140,50%,55%)"];

const SoulPrintCard = ({ traits, computed, narrative }: SoulPrintCardProps) => {
  const [exporting, setExporting] = useState(false);

  const headline = narrative?.headline || generateHeadline(traits, computed);
  const tagline = narrative?.tagline || generateTagline(traits);
  const rawSummary = narrative?.soulprint_summary || "";
  const isOldNarrative = rawSummary.toLowerCase().includes("azerbaijan") || rawSummary.includes("T_Social") || rawSummary.includes("O47") || rawSummary.length > 600;
  const description = !isOldNarrative && rawSummary ? rawSummary : generateNarrative(traits);

  const top1Label = SENSORY_LABELS[traits.sensory.top1] || traits.sensory.top1;
  const top2Label = SENSORY_LABELS[traits.sensory.top2] || traits.sensory.top2;

  // ── Personality (Big Five) ─────────────────────────────────────────
  const bigFiveData = computed ? [
    { trait: "Extraversion", value: parseFloat(computed.extraversion) || 0 },
    { trait: "Openness", value: parseFloat(computed.openness) || 0 },
    { trait: "Conscientiousness", value: parseFloat(computed.conscientiousness) || 0 },
    { trait: "Agreeableness", value: parseFloat(computed.agreeableness) || 0 },
    { trait: "Emotional Stability", value: parseFloat(computed.emotional_stability) || 0 },
  ] : [
    { trait: "Energy", value: traits.energy, fullMark: 100 },
    { trait: "Social", value: traits.social, fullMark: 100 },
    { trait: "Luxury", value: traits.luxury, fullMark: 100 },
    { trait: "Pace", value: traits.pace, fullMark: 100 },
    { trait: top1Label.split(" ")[0], value: traits.sensory.scores[traits.sensory.top1] || 50, fullMark: 100 },
  ];

  // ── Travel Behavior ────────────────────────────────────────────────
  const tensionsData = computed ? [
    { axis: "Social", value: parseFloat(computed.t_social) || 0 },
    { axis: "Flow", value: parseFloat(computed.t_flow) || 0 },
    { axis: "Risk", value: parseFloat(computed.t_risk) || 0 },
    { axis: "Elements", value: parseFloat(computed.t_elements) || 0 },
    { axis: "Tempo", value: parseFloat(computed.t_tempo) || 0 },
  ] : [];

  const travelSliders = computed ? [
    { label: "Spontaneity", value: parseFloat(computed.spontaneity_flexibility) || 0, left: "Structured", right: "Spontaneous" },
    { label: "Adventure", value: parseFloat(computed.adventure_orientation) || 0, left: "Comfort-Seeking", right: "Adventure-Hungry" },
    { label: "Adaptation", value: parseFloat(computed.environmental_adaptation) || 0, left: "Routine", right: "Adaptable" },
  ] : [];

  // ── Inner Compass ──────────────────────────────────────────────────
  const innerCompassData = computed ? [
    { name: "Transformation", value: parseFloat(computed.transformation) || 0 },
    { name: "Clarity", value: parseFloat(computed.clarity) || 0 },
    { name: "Aliveness", value: parseFloat(computed.aliveness) || 0 },
    { name: "Connection", value: parseFloat(computed.connection) || 0 },
  ] : [];

  const exportPDF = async () => {
    setExporting(true);
    try {
      const jspdf = new jsPDF("p", "mm", "a4");
      const pw = jspdf.internal.pageSize.getWidth();
      let y = 20;
      jspdf.setFontSize(22); jspdf.setFont("helvetica", "bold");
      jspdf.text("Your SoulPrint", pw / 2, y, { align: "center" }); y += 10;
      jspdf.setFontSize(12); jspdf.setFont("helvetica", "italic");
      jspdf.text(headline, pw / 2, y, { align: "center" }); y += 7;
      jspdf.setFontSize(10); jspdf.setFont("helvetica", "normal");
      jspdf.text(tagline, pw / 2, y, { align: "center" }); y += 12;
      const lines = jspdf.splitTextToSize(description, pw - 30);
      lines.forEach((l: string) => { jspdf.text(l, 15, y); y += 5; });
      jspdf.save("soulprint.pdf");
      toast.success("SoulPrint exported!");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Card className="overflow-hidden border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Fingerprint className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{headline}</h2>
                <p className="text-sm text-muted-foreground italic">{tagline}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={exportPDF} disabled={exporting} className="gap-1.5 shrink-0">
              <Download className="h-3.5 w-3.5" />
              {exporting ? "Exporting..." : "Export"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Narrative */}
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>

          {/* Sensory Priorities */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Sensory Priorities</p>
            <div className="flex gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-sm font-medium">{top1Label}</span>
              <span className="px-3 py-1 rounded-full bg-accent/15 text-accent-foreground text-sm font-medium">{top2Label}</span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="personality" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personality">Personality</TabsTrigger>
              <TabsTrigger value="travel">Travel Behavior</TabsTrigger>
              <TabsTrigger value="compass">Inner Compass</TabsTrigger>
            </TabsList>

            {/* PERSONALITY */}
            <TabsContent value="personality" className="space-y-4">
              <div className="w-full h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={bigFiveData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="trait" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="You" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {bigFiveData.map(({ trait, value }) => (
                  <div key={trait}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{trait}</span>
                      <span className="font-semibold">{Math.round(value)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* TRAVEL BEHAVIOR */}
            <TabsContent value="travel" className="space-y-4">
              {travelSliders.length > 0 && (
                <div className="space-y-4">
                  {travelSliders.map(({ label, value, left, right }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{left}</span>
                        <span className="font-medium text-foreground">{label}</span>
                        <span>{right}</span>
                      </div>
                      <div className="relative h-3 rounded-full bg-muted/40">
                        <div className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-accent to-primary transition-all" style={{ width: `${value}%` }} />
                        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-2 border-card shadow-md" style={{ left: `calc(${value}% - 8px)` }} />
                      </div>
                      <div className="text-right text-xs font-semibold text-primary mt-0.5">{Math.round(value)}/100</div>
                    </div>
                  ))}
                </div>
              )}

              {tensionsData.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Growth & Tension Areas</p>
                  <div className="w-full h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={tensionsData} cx="50%" cy="50%" outerRadius="65%">
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="axis" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Tension" dataKey="value" stroke="hsl(var(--accent-foreground))" fill="hsl(var(--accent))" fillOpacity={0.3} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {tensionsData.map(({ axis, value }) => {
                      const level = value >= 60 ? "High stretch" : value >= 30 ? "Moderate" : "Aligned";
                      const color = value >= 60 ? "text-amber-600" : value >= 30 ? "text-primary" : "text-emerald-600";
                      return (
                        <div key={axis} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                          <span className="text-xs text-muted-foreground">{axis}</span>
                          <span className={`text-xs font-semibold ${color}`}>{level}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {travelSliders.length === 0 && tensionsData.length === 0 && (
                <div className="space-y-3">
                  <DimensionBar label="Energy" value={traits.energy} leftLabel="Restorative" rightLabel="Achievement" />
                  <DimensionBar label="Social" value={traits.social} leftLabel="Intimate" rightLabel="Social" />
                  <DimensionBar label="Luxury" value={traits.luxury} leftLabel="Authentic" rightLabel="Seamless" />
                  <DimensionBar label="Pace" value={traits.pace} leftLabel="Slow" rightLabel="Packed" />
                </div>
              )}
            </TabsContent>

            {/* INNER COMPASS */}
            <TabsContent value="compass" className="space-y-4">
              {innerCompassData.length > 0 ? (
                <>
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={innerCompassData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${Math.round(value)}`} labelLine={false}>
                          {innerCompassData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(val: any) => Math.round(val)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {computed && (computed.life_phase || computed.shift_desired) && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                      {computed.life_phase && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Life Phase</p>
                          <Badge variant="outline" className="text-xs px-2 py-0.5">{computed.life_phase}</Badge>
                        </div>
                      )}
                      {computed.shift_desired && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Seeking</p>
                          <Badge variant="outline" className="text-xs px-2 py-0.5">{computed.shift_desired}</Badge>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Inner Compass data not available yet.</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

function DimensionBar({ label, value, leftLabel, rightLabel }: {
  label: string; value: number; leftLabel: string; rightLabel: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-muted-foreground">{leftLabel}</span>
        <span className="text-xs font-medium text-foreground">{label} — {value}</span>
        <span className="text-xs text-muted-foreground">{rightLabel}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <motion.div className="h-full rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
      </div>
    </div>
  );
}

export default SoulPrintCard;
