import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface SoulPrintVisualizationProps {
  computed: any;
  narrative: any;
  respondentId?: string;
  onRegenerateComplete?: () => void;
}

const SoulPrintVisualization = ({ computed, narrative, respondentId, onRegenerateComplete }: SoulPrintVisualizationProps) => {
  const { toast } = useToast();
  const [regenerating, setRegenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.5-flash");
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

  // Elemental data
  const elementalData = [
    { name: "Fire", value: parseFloat(computed.fire_score), color: "#FF6B6B" },
    { name: "Water", value: parseFloat(computed.water_score), color: "#4ECDC4" },
    { name: "Stone", value: parseFloat(computed.stone_score), color: "#95A5A6" },
    { name: "Urban", value: parseFloat(computed.urban_score), color: "#F7DC6F" },
    { name: "Desert", value: parseFloat(computed.desert_score), color: "#E8B87E" }
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

  // Business KPIs
  const kpisData = [
    { name: "Spend Propensity", value: parseFloat(computed.spi), tier: computed.spi_tier },
    { name: "Upsell Receptivity", value: parseFloat(computed.urs), tier: computed.urs_tier },
    { name: "Content Generation", value: parseFloat(computed.cgs), tier: computed.cgs_tier }
  ];

  const handleRegenerate = async () => {
    if (!respondentId) {
      toast({
        title: "Error",
        description: "Respondent ID is required for regeneration",
        variant: "destructive",
      });
      return;
    }

    setRegenerating(true);
    try {
      const { error } = await supabase.functions.invoke("compute-soulprint", {
        body: { 
          respondent_id: respondentId,
          regenerate: true,
          model: selectedModel
        },
      });

      if (error) throw error;

      toast({
        title: "Narrative Regenerated",
        description: `Successfully regenerated with ${selectedModel}`,
      });

      onRegenerateComplete?.();
    } catch (error: any) {
      console.error("Error regenerating narrative:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate narrative",
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SoulPrint Research Report', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Erranza Travel Psychology Research', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(15, yPosition, pageWidth - 15, yPosition);
      
      yPosition += 10;

      // Respondent Overview
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Respondent Profile', 15, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Tribe: ${computed.tribe}`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Tribe Confidence: ${computed.tribe_confidence}`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Azerbaijan Alignment: ${computed.eai_azerbaijan}%`, 15, yPosition);
      yPosition += 6;
      pdf.text(`NPS Prediction: ${computed.nps_predicted}/10 (${computed.nps_tier})`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Risk Flag: ${computed.risk_flag}`, 15, yPosition);
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

      // Elemental Resonance
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Elemental Resonance', 15, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      elementalData.forEach(element => {
        pdf.text(`${element.name}: ${element.value.toFixed(1)}`, 15, yPosition);
        yPosition += 6;
      });
      pdf.text(`Dominant Element: ${computed.dominant_element}`, 15, yPosition);
      yPosition += 6;
      pdf.text(`Secondary Element: ${computed.secondary_element}`, 15, yPosition);
      yPosition += 10;

      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

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

      // Business KPIs
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Business Key Performance Indicators', 15, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      kpisData.forEach(kpi => {
        pdf.text(`${kpi.name}: ${kpi.value.toFixed(1)} (${kpi.tier})`, 15, yPosition);
        yPosition += 6;
      });
      yPosition += 5;

      // Tensions
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Tensions & Friction Points', 15, yPosition);
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
        pdf.text('Psychological Narrative', 15, yPosition);
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
      pdf.text('Erranza © 2025 - Confidential Research Data', pageWidth / 2, pageHeight - 10, { align: 'center' });

      pdf.save(`soulprint-research-${respondentId?.substring(0, 8) || 'report'}.pdf`);

      toast({
        title: "PDF Exported",
        description: "Research report downloaded successfully",
      });
    } catch (error: any) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Error",
        description: "Failed to export PDF",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      {respondentId && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google/gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                    <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                    <SelectItem value="openai/gpt-5-mini">GPT-5 Mini</SelectItem>
                    <SelectItem value="openai/gpt-5">GPT-5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleRegenerate} 
                disabled={regenerating}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                {regenerating ? "Regenerating..." : "Regenerate Narrative"}
              </Button>
              <Button onClick={exportToPDF} disabled={exporting}>
                <Download className="h-4 w-4 mr-2" />
                {exporting ? "Exporting..." : "Export Research Report"}
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm font-medium">Azerbaijan Alignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{computed.eai_azerbaijan}%</div>
            <Progress value={parseFloat(computed.eai_azerbaijan)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">NPS Prediction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{computed.nps_predicted}/10</div>
            <Badge variant={computed.nps_tier === "Promoter" ? "default" : "secondary"}>
              {computed.nps_tier}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Risk Flag</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={computed.risk_flag === "HIGH RISK" ? "destructive" : computed.risk_flag === "Monitor" ? "secondary" : "default"}>
              {computed.risk_flag}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">Upsell: {computed.upsell_priority}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="personality" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personality">Personality</TabsTrigger>
          <TabsTrigger value="travel">Travel</TabsTrigger>
          <TabsTrigger value="elements">Elements</TabsTrigger>
          <TabsTrigger value="compass">Inner Compass</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
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
                  <Radar name="Score" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
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
                  <Bar dataKey="value" fill="#647ED5" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Travel Freedom Index</p>
                <div className="flex items-center gap-2">
                  <Progress value={parseFloat(computed.travel_freedom_index)} className="flex-1" />
                  <span className="text-sm font-bold">{computed.travel_freedom_index}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="elements">
          <Card>
            <CardHeader>
              <CardTitle>Elemental Resonance</CardTitle>
              <CardDescription>Your connection to natural elements</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={elementalData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {elementalData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 flex gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Dominant Element</p>
                  <p className="text-lg font-bold capitalize">{computed.dominant_element}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Secondary Element</p>
                  <p className="text-lg font-bold capitalize">{computed.secondary_element}</p>
                </div>
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
                  <Bar dataKey="value" fill="#A78BFA" />
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

        <TabsContent value="business">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Business KPIs</CardTitle>
                <CardDescription>Commercial value indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {kpisData.map((kpi) => (
                    <div key={kpi.name}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{kpi.name}</span>
                        <Badge variant={kpi.tier === "High" ? "default" : kpi.tier === "Medium" ? "secondary" : "outline"}>
                          {kpi.tier}
                        </Badge>
                      </div>
                      <Progress value={kpi.value} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{kpi.value.toFixed(1)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tensions & Friction Points</CardTitle>
                <CardDescription>Internal conflicts and growth areas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={tensionsData}>
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground mt-2">
                  Higher values indicate more internal friction and potential growth edges
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SoulPrintVisualization;