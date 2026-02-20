import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell,
  PieChart, Pie, Legend
} from "recharts";
import { Download, Fingerprint } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';

interface SoulPrintVisualizationProps {
  computed: any;
  narrative: any;
  respondentId?: string;
  onRegenerateComplete?: () => void;
}

const COLORS = ["hsl(255,47%,62%)", "hsl(40,30%,65%)", "hsl(200,60%,55%)", "hsl(140,50%,55%)", "hsl(20,70%,55%)"];

const SoulPrintVisualization = ({ computed, narrative, respondentId, onRegenerateComplete }: SoulPrintVisualizationProps) => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  // Big Five data for radar
  const bigFiveData = [
    { trait: "Extraversion", value: parseFloat(computed.extraversion) || 0 },
    { trait: "Openness", value: parseFloat(computed.openness) || 0 },
    { trait: "Conscientiousness", value: parseFloat(computed.conscientiousness) || 0 },
    { trait: "Agreeableness", value: parseFloat(computed.agreeableness) || 0 },
    { trait: "Emotional Stability", value: parseFloat(computed.emotional_stability) || 0 }
  ];

  // Travel Behavior — bubble/scatter: spontaneity vs adventure
  const travelBubbleData = [
    { x: parseFloat(computed.spontaneity_flexibility) || 0, y: parseFloat(computed.adventure_orientation) || 0, z: 400, label: "You" },
  ];

  // Inner Compass — pie chart of 4 motivations
  const innerCompassData = [
    { name: "Transformation", value: parseFloat(computed.transformation) || 0 },
    { name: "Clarity", value: parseFloat(computed.clarity) || 0 },
    { name: "Aliveness", value: parseFloat(computed.aliveness) || 0 },
    { name: "Connection", value: parseFloat(computed.connection) || 0 }
  ];

  // Tensions — radar chart (more appropriate than bars)
  const tensionsData = [
    { axis: "Social", value: parseFloat(computed.t_social) || 0 },
    { axis: "Flow", value: parseFloat(computed.t_flow) || 0 },
    { axis: "Risk", value: parseFloat(computed.t_risk) || 0 },
    { axis: "Elements", value: parseFloat(computed.t_elements) || 0 },
    { axis: "Tempo", value: parseFloat(computed.t_tempo) || 0 },
  ];

  const exportSoulPrint = async () => {
    setExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let y = 20;

      pdf.setFontSize(24); pdf.setFont('helvetica', 'bold');
      pdf.text('Your SoulPrint', pageWidth / 2, y, { align: 'center' }); y += 10;
      pdf.setFontSize(12); pdf.setFont('helvetica', 'normal');
      pdf.text('Erranza Travel Personality Profile', pageWidth / 2, y, { align: 'center' }); y += 15;
      pdf.setDrawColor(200, 200, 200); pdf.line(15, y, pageWidth - 15, y); y += 10;

      if (narrative) {
        pdf.setFontSize(16); pdf.setFont('helvetica', 'bold');
        pdf.text(narrative.headline || '', 15, y); y += 8;
        pdf.setFontSize(11); pdf.setFont('helvetica', 'italic');
        pdf.text(narrative.tagline || '', 15, y); y += 10;
        pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
        const summaryLines = pdf.splitTextToSize(narrative.soulprint_summary || '', pageWidth - 30);
        summaryLines.forEach((line: string) => {
          if (y > pageHeight - 20) { pdf.addPage(); y = 20; }
          pdf.text(line, 15, y); y += 5;
        });
        y += 8;
      }

      pdf.setFontSize(14); pdf.setFont('helvetica', 'bold');
      pdf.text('Personality Profile', 15, y); y += 8;
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
      bigFiveData.forEach(t => { pdf.text(`${t.trait}: ${t.value.toFixed(1)}`, 15, y); y += 6; });
      y += 5;

      pdf.setFontSize(14); pdf.setFont('helvetica', 'bold');
      pdf.text('Inner Compass', 15, y); y += 8;
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
      innerCompassData.forEach(m => { pdf.text(`${m.name}: ${m.value.toFixed(1)}`, 15, y); y += 6; });
      y += 5;

      const timestamp = new Date().toLocaleString();
      pdf.setFontSize(8); pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated: ${timestamp}`, 15, pageHeight - 10);
      pdf.text('Erranza © 2026 - Your Travel Personality', pageWidth / 2, pageHeight - 10, { align: 'center' });
      pdf.save(`soulprint-${respondentId?.substring(0, 8) || 'profile'}.pdf`);

      toast({ title: "SoulPrint Exported", description: "Your SoulPrint PDF has been downloaded" });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to export SoulPrint", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export */}
      {respondentId && (
        <div className="flex justify-end">
          <Button onClick={exportSoulPrint} disabled={exporting} variant="outline" className="gap-2">
            <Fingerprint className="h-4 w-4" />
            {exporting ? "Exporting..." : "Export SoulPrint"}
          </Button>
        </div>
      )}

      {/* Narrative Card */}
      {narrative && (
        <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10">
          <CardHeader>
            <CardTitle className="text-2xl">{narrative.headline}</CardTitle>
            <CardDescription className="text-base italic">{narrative.tagline}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed">{narrative.soulprint_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="personality" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personality">Personality</TabsTrigger>
          <TabsTrigger value="travel">Travel Behavior</TabsTrigger>
          <TabsTrigger value="compass">Inner Compass</TabsTrigger>
        </TabsList>

        {/* PERSONALITY — radar */}
        <TabsContent value="personality">
          <Card>
            <CardHeader>
              <CardTitle>Personality Dimensions</CardTitle>
              <CardDescription>Your Big Five psychological profile (0–100 scale)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={bigFiveData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="trait" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="You" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
              {/* Dimension bars */}
              <div className="space-y-3">
                {bigFiveData.map(({ trait, value }) => (
                  <div key={trait}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{trait}</span>
                      <span className="font-semibold">{value.toFixed(0)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRAVEL BEHAVIOR — positioned scatter + tension radar */}
        <TabsContent value="travel">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Spontaneity vs Adventure</CardTitle>
                <CardDescription>Where you sit on the spontaneity and adventure spectrum</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Simple positioned indicator */}
                <div className="relative">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Spontaneity", value: parseFloat(computed.spontaneity_flexibility) || 0, left: "Structured", right: "Spontaneous" },
                      { label: "Adventure", value: parseFloat(computed.adventure_orientation) || 0, left: "Comfort-Seeking", right: "Adventure-Hungry" },
                      { label: "Adaptation", value: parseFloat(computed.environmental_adaptation) || 0, left: "Routine", right: "Adaptable" },
                    ].map(({ label, value, left, right }) => (
                      <div key={label} className="col-span-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{left}</span>
                          <span className="font-medium text-foreground">{label}</span>
                          <span>{right}</span>
                        </div>
                        <div className="relative h-3 rounded-full bg-muted/40">
                          <div
                            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-accent to-primary transition-all"
                            style={{ width: `${value}%` }}
                          />
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-2 border-card shadow-md transition-all"
                            style={{ left: `calc(${value}% - 8px)` }}
                          />
                        </div>
                        <div className="text-right text-xs font-semibold text-primary mt-0.5">{value.toFixed(0)}/100</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tensions — radar */}
            <Card>
              <CardHeader>
                <CardTitle>Growth & Tension Areas</CardTitle>
                <CardDescription>Internal friction points that signal your growth edges — higher scores indicate more stretch potential</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={tensionsData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Tension" dataKey="value" stroke="hsl(var(--accent-foreground))" fill="hsl(var(--accent))" fillOpacity={0.3} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {tensionsData.map(({ axis, value }) => {
                    const level = value >= 60 ? "High stretch" : value >= 30 ? "Moderate" : "Aligned";
                    const color = value >= 60 ? "text-amber-600" : value >= 30 ? "text-primary" : "text-emerald-600";
                    return (
                      <div key={axis} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <span className="text-sm text-muted-foreground">{axis}</span>
                        <span className={`text-xs font-semibold ${color}`}>{level}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* INNER COMPASS — pie */}
        <TabsContent value="compass">
          <Card>
            <CardHeader>
              <CardTitle>Inner Compass</CardTitle>
              <CardDescription>The emotional and purposeful drives that shape your travel choices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={innerCompassData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value.toFixed(0)}`}
                      labelLine={false}
                    >
                      {innerCompassData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => val.toFixed(1)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Life phase & seeking */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Life Phase</p>
                  <Badge variant="outline" className="text-sm px-3 py-1">{computed.life_phase || '—'}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Seeking</p>
                  <Badge variant="outline" className="text-sm px-3 py-1">{computed.shift_desired || '—'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SoulPrintVisualization;
