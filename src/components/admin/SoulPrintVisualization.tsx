import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
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

const SoulPrintVisualization = ({ computed, narrative, respondentId, onRegenerateComplete }: SoulPrintVisualizationProps) => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  // Big Five data
  const bigFiveData = [
    { trait: "Extraversion", value: parseFloat(computed.extraversion) },
    { trait: "Openness", value: parseFloat(computed.openness) },
    { trait: "Conscientiousness", value: parseFloat(computed.conscientiousness) },
    { trait: "Agreeableness", value: parseFloat(computed.agreeableness) },
    { trait: "Emotional Stability", value: parseFloat(computed.emotional_stability) }
  ];

  // Travel Behavior data
  const travelData = [
    { name: "Spontaneity", value: parseFloat(computed.spontaneity_flexibility) },
    { name: "Adventure", value: parseFloat(computed.adventure_orientation) },
    { name: "Adaptation", value: parseFloat(computed.environmental_adaptation) }
  ];

  // Inner Compass data
  const innerCompassData = [
    { motivation: "Transformation", value: parseFloat(computed.transformation) },
    { motivation: "Clarity", value: parseFloat(computed.clarity) },
    { motivation: "Aliveness", value: parseFloat(computed.aliveness) },
    { motivation: "Connection", value: parseFloat(computed.connection) }
  ];

  // Tensions data
  const tensionsData = [
    { name: "Social", value: parseFloat(computed.t_social) },
    { name: "Flow", value: parseFloat(computed.t_flow) },
    { name: "Risk", value: parseFloat(computed.t_risk) },
    { name: "Elements", value: parseFloat(computed.t_elements) },
    { name: "Tempo", value: parseFloat(computed.t_tempo) }
  ];

  const exportSoulPrint = async () => {
    setExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Your SoulPrint', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Erranza Travel Personality Profile', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(15, yPosition, pageWidth - 15, yPosition);
      
      yPosition += 10;

      // Profile Overview
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Profile Overview', 15, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Tribe: ${computed.tribe}`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Tribe Confidence: ${computed.tribe_confidence}`, 15, yPosition);
      yPosition += 10;

      // Big Five Personality
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Big Five Personality Traits', 15, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      bigFiveData.forEach(trait => {
        pdf.text(`${trait.trait}: ${trait.value.toFixed(1)}`, 15, yPosition);
        yPosition += 6;
      });
      yPosition += 5;

      // Travel Behavior
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Travel Behavior', 15, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      travelData.forEach(item => {
        pdf.text(`${item.name}: ${item.value.toFixed(1)}`, 15, yPosition);
        yPosition += 6;
      });
      pdf.text(`Travel Freedom Index: ${computed.travel_freedom_index}`, 15, yPosition);
      yPosition += 10;

      // Inner Compass
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Inner Compass & Motivations', 15, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      innerCompassData.forEach(item => {
        pdf.text(`${item.motivation}: ${item.value.toFixed(1)}`, 15, yPosition);
        yPosition += 6;
      });
      pdf.text(`Primary Motivation: ${computed.top_motivation_1}`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Secondary Motivation: ${computed.top_motivation_2}`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Life Phase: ${computed.life_phase}`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Seeking: ${computed.shift_desired}`, 15, yPosition);
      yPosition += 10;

      // Tensions
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Tensions & Growth Areas', 15, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      tensionsData.forEach(tension => {
        pdf.text(`${tension.name}: ${tension.value.toFixed(1)}`, 15, yPosition);
        yPosition += 6;
      });

      if (yPosition > pageHeight - 50 && narrative) {
        pdf.addPage();
        yPosition = 20;
      }

      // Narrative Insights
      if (narrative) {
        yPosition += 10;
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Your SoulPrint Narrative', 15, yPosition);
        yPosition += 10;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'italic');
        pdf.text(narrative.headline || '', 15, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const summaryLines = pdf.splitTextToSize(narrative.soulprint_summary || '', pageWidth - 30);
        summaryLines.forEach((line: string) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 15, yPosition);
          yPosition += 5;
        });

        if (narrative.traveler_archetype) {
          yPosition += 5;
          pdf.setFont('helvetica', 'bold');
          pdf.text('Traveler Archetype:', 15, yPosition);
          yPosition += 6;
          pdf.setFont('helvetica', 'normal');
          const archetypeLines = pdf.splitTextToSize(narrative.traveler_archetype, pageWidth - 30);
          archetypeLines.forEach((line: string) => {
            if (yPosition > pageHeight - 20) {
              pdf.addPage();
              yPosition = 20;
            }
            pdf.text(line, 15, yPosition);
            yPosition += 5;
          });
        }
      }

      // Footer
      const timestamp = new Date().toLocaleString();
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Generated: ${timestamp}`, 15, pageHeight - 10);
      pdf.text('Erranza © 2026 - Your Travel Personality', pageWidth / 2, pageHeight - 10, { align: 'center' });

      pdf.save(`soulprint-${respondentId?.substring(0, 8) || 'profile'}.pdf`);

      toast({
        title: "SoulPrint Exported",
        description: "Your SoulPrint PDF has been downloaded",
      });
    } catch (error: any) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Error",
        description: "Failed to export SoulPrint",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar - Export SoulPrint only */}
      {respondentId && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 justify-end">
              <Button onClick={exportSoulPrint} disabled={exporting} className="gap-2">
                <Fingerprint className="h-4 w-4" />
                {exporting ? "Exporting..." : "Export SoulPrint"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Headline */}
      {narrative && (
        <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10">
          <CardHeader>
            <CardTitle className="text-3xl">{narrative.headline}</CardTitle>
            <CardDescription className="text-lg italic">{narrative.tagline}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-wrap">{narrative.soulprint_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics - Tribe only, removed Azerbaijan, NPS, Risk Flag */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tribe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{computed.tribe}</div>
            <Badge variant={computed.tribe_confidence === "High" ? "default" : "secondary"}>
              {computed.tribe_confidence} Confidence
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Primary Motivation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{computed.top_motivation_1}</div>
            <p className="text-xs text-muted-foreground mt-1">Life Phase: {computed.life_phase}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Travel Freedom</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{computed.travel_freedom_index}</div>
            <Progress value={parseFloat(computed.travel_freedom_index)} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs - Removed Elements and Business */}
      <Tabs defaultValue="personality" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personality">Personality</TabsTrigger>
          <TabsTrigger value="travel">Travel</TabsTrigger>
          <TabsTrigger value="compass">Inner Compass</TabsTrigger>
        </TabsList>

        <TabsContent value="personality">
          <Card>
            <CardHeader>
              <CardTitle>Big Five Personality Traits</CardTitle>
              <CardDescription>Core personality dimensions (0-100 scale)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={bigFiveData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="trait" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Score" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {bigFiveData.map((trait) => (
                  <div key={trait.trait}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{trait.trait}</span>
                      <span className="font-medium">{trait.value.toFixed(1)}</span>
                    </div>
                    <Progress value={trait.value} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="travel">
          <Card>
            <CardHeader>
              <CardTitle>Travel Behavior</CardTitle>
              <CardDescription>How you approach travel experiences</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={travelData}>
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Travel Freedom Index</p>
                <div className="flex items-center gap-2">
                  <Progress value={parseFloat(computed.travel_freedom_index)} className="flex-1" />
                  <span className="text-sm font-bold">{computed.travel_freedom_index}</span>
                </div>
              </div>
              {/* Tensions */}
              <div className="mt-6">
                <p className="text-sm font-medium mb-3">Tensions & Growth Areas</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={tensionsData}>
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--destructive))" />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground mt-2">
                  Higher values indicate more internal friction and potential growth edges
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compass">
          <Card>
            <CardHeader>
              <CardTitle>Inner Compass</CardTitle>
              <CardDescription>What drives you in life and travel</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={innerCompassData}>
                  <XAxis dataKey="motivation" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--accent))" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Primary Motivation</p>
                  <p className="text-xl font-bold">{computed.top_motivation_1}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Secondary Motivation</p>
                  <p className="text-xl font-bold">{computed.top_motivation_2}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Life Phase</p>
                    <Badge>{computed.life_phase}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Seeking</p>
                    <Badge>{computed.shift_desired}</Badge>
                  </div>
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
