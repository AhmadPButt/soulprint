import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, FileDown, Sparkles } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface SoulPrintVisualizationProps {
  computed: any;
  narrative: any;
  respondent: any;
}

const SoulPrintVisualization = ({ computed, narrative, respondent }: SoulPrintVisualizationProps) => {
  const { toast } = useToast();
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.5-flash");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const aiModels = [
    { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash (Fast)" },
    { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (Premium)" },
    { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
    { value: "openai/gpt-5", label: "GPT-5 (Premium)" },
  ];

  const handleRegenerateNarrative = async () => {
    setIsRegenerating(true);
    try {
      const { error } = await supabase.functions.invoke("compute-soulprint", {
        body: {
          respondent_id: respondent.id,
          regenerate: true,
          model: selectedModel,
        },
      });

      if (error) throw error;

      toast({
        title: "Narrative Regenerated",
        description: `New narrative created with ${aiModels.find(m => m.value === selectedModel)?.label}`,
      });

      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Regeneration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const reportElement = document.getElementById("research-report");
      if (!reportElement) throw new Error("Report element not found");

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`${respondent.name.replace(/\s+/g, "_")}_SoulPrint_Report.pdf`);

      toast({
        title: "PDF Exported",
        description: "Research report downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const kpiThresholds = {
    spi: {
      high: 75,
      medium: 50,
    },
    urs: {
      high: 70,
      medium: 45,
    },
    cgs: {
      high: 80,
      medium: 60,
    },
  };

  const getTierBadge = (value: number, kpi: string) => {
    if (value >= (kpiThresholds as any)[kpi].high) {
      return <Badge>High</Badge>;
    } else if (value >= (kpiThresholds as any)[kpi].medium) {
      return <Badge variant="secondary">Medium</Badge>;
    } else {
      return <Badge variant="outline">Low</Badge>;
    }
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatScore = (value: number) => {
    return value.toFixed(1);
  };

  const formatTier = (tier: string) => {
    return tier;
  };

  const formatRisk = (risk: string) => {
    return risk;
  };

  const formatUpsell = (upsell: string) => {
    return upsell;
  };

  const bigFiveData = [
    { trait: "Extraversion", value: parseFloat(computed.extraversion) },
    { trait: "Openness", value: parseFloat(computed.openness) },
    { trait: "Conscientiousness", value: parseFloat(computed.conscientiousness) },
    { trait: "Agreeableness", value: parseFloat(computed.agreeableness) },
    { trait: "Emotional Stability", value: parseFloat(computed.emotional_stability) }
  ];

  const travelData = [
    { name: "Spontaneity", value: parseFloat(computed.spontaneity_flexibility) },
    { name: "Adventure", value: parseFloat(computed.adventure_orientation) },
    { name: "Adaptation", value: parseFloat(computed.environmental_adaptation) }
  ];

  const elementalData = [
    { name: "Fire", value: parseFloat(computed.fire_score), color: "#FF6B6B" },
    { name: "Water", value: parseFloat(computed.water_score), color: "#4ECDC4" },
    { name: "Stone", value: parseFloat(computed.stone_score), color: "#95A5A6" },
    { name: "Urban", value: parseFloat(computed.urban_score), color: "#F7DC6F" },
    { name: "Desert", value: parseFloat(computed.desert_score), color: "#E8B87E" }
  ];

  const innerCompassData = [
    { motivation: "Transformation", value: parseFloat(computed.transformation) },
    { motivation: "Clarity", value: parseFloat(computed.clarity) },
    { motivation: "Aliveness", value: parseFloat(computed.aliveness) },
    { motivation: "Connection", value: parseFloat(computed.connection) }
  ];

  const tensionsData = [
    { name: "Social", value: parseFloat(computed.t_social) },
    { name: "Flow", value: parseFloat(computed.t_flow) },
    { name: "Risk", value: parseFloat(computed.t_risk) },
    { name: "Elements", value: parseFloat(computed.t_elements) },
    { name: "Tempo", value: parseFloat(computed.t_tempo) }
  ];

  const kpisData = [
    { name: "Spend Propensity", value: parseFloat(computed.spi), tier: computed.spi_tier },
    { name: "Upsell Receptivity", value: parseFloat(computed.urs), tier: computed.urs_tier },
    { name: "Content Generation", value: parseFloat(computed.cgs), tier: computed.cgs_tier }
  ];

  return (
    <Tabs defaultValue="luxury" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="luxury">
          <Sparkles className="w-4 h-4 mr-2" />
          Luxury Narrative
        </TabsTrigger>
        <TabsTrigger value="visualization">Visualizations</TabsTrigger>
        <TabsTrigger value="research">Research Report</TabsTrigger>
      </TabsList>

      <TabsContent value="luxury" className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <h3 className="font-semibold mb-2">Regenerate Narrative</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a new haute couture narrative using a different AI model
              </p>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aiModels.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleRegenerateNarrative}
              disabled={isRegenerating}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`} />
              {isRegenerating ? "Generating..." : "Regenerate"}
            </Button>
          </div>
          {narrative && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{narrative.model_used}</Badge>
                <span>•</span>
                <span>Version {narrative.prompt_version}</span>
                {narrative.regeneration_count > 0 && (
                  <>
                    <span>•</span>
                    <span>Regenerated {narrative.regeneration_count}x</span>
                  </>
                )}
              </div>
            </div>
          )}
        </Card>

        {narrative && (
          <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10">
            <CardHeader>
              <CardTitle className="text-3xl">{narrative.headline}</CardTitle>
              <CardDescription className="text-lg italic">{narrative.tagline}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                  {narrative.soulprint_summary}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="visualization" className="space-y-6">
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
      </TabsContent>

      <TabsContent value="research">
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="gap-2"
            >
              <FileDown className="w-4 h-4" />
              {isExporting ? "Exporting..." : "Export PDF"}
            </Button>
          </div>

          <div id="research-report" className="bg-white text-black p-12 space-y-8">
            <div className="text-center border-b-2 border-black pb-6">
              <h1 className="text-3xl font-bold mb-2">ERRANZA RESEARCH DIVISION</h1>
              <h2 className="text-xl font-semibold">Psychometric Travel Profile</h2>
              <p className="text-sm mt-2">Confidential Analysis</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold uppercase text-gray-600">Subject</p>
                <p className="text-lg">{respondent.name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase text-gray-600">Analysis Date</p>
                <p className="text-lg">
                  {new Date(computed.computed_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase text-gray-600">Traveler Archetype</p>
                <p className="text-lg font-bold">{computed.tribe}</p>
                <p className="text-sm text-gray-600">Confidence: {computed.tribe_confidence}</p>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase text-gray-600">Azerbaijan Affinity</p>
                <p className="text-lg font-bold">{computed.eai_azerbaijan?.toFixed(1)}%</p>
              </div>
            </div>

            <Separator className="bg-black" />

            <div>
              <h3 className="text-xl font-bold mb-4">I. PERSONALITY ARCHITECTURE</h3>
              <div className="grid grid-cols-5 gap-4">
                {bigFiveData.map((trait) => (
                  <div key={trait.trait} className="border border-black p-3">
                    <p className="text-xs font-semibold uppercase mb-1">{trait.trait}</p>
                    <p className="text-2xl font-bold">{trait.value?.toFixed(0)}</p>
                    <div className="mt-2 h-2 bg-gray-200">
                      <div
                        className="h-full bg-black"
                        style={{ width: `${trait.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">II. TRAVEL BEHAVIOR PROFILE</h3>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Spontaneity & Flexibility", value: computed.spontaneity_flexibility },
                  { label: "Adventure Orientation", value: computed.adventure_orientation },
                  { label: "Environmental Adaptation", value: computed.environmental_adaptation },
                  { label: "Travel Freedom Index", value: computed.travel_freedom_index },
                ].map((metric) => (
                  <div key={metric.label} className="border border-black p-3">
                    <p className="text-xs font-semibold uppercase mb-1">{metric.label}</p>
                    <p className="text-2xl font-bold">{metric.value?.toFixed(0)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">III. ELEMENTAL RESONANCE</h3>
              <div className="grid grid-cols-5 gap-4">
                {elementalData.map((element) => (
                  <div key={element.name} className="border border-black p-3">
                    <p className="text-xs font-semibold uppercase mb-1">{element.name}</p>
                    <p className="text-2xl font-bold">{element.value?.toFixed(0)}</p>
                    {(element.name.toLowerCase() === computed.dominant_element ||
                      element.name.toLowerCase() === computed.secondary_element) && (
                      <p className="text-xs font-semibold mt-1">
                        {element.name.toLowerCase() === computed.dominant_element ? "PRIMARY" : "ACCENT"}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">IV. INNER COMPASS & MOTIVATIONS</h3>
              <div className="grid grid-cols-4 gap-4">
                {innerCompassData.map((motivation) => (
                  <div key={motivation.motivation} className="border border-black p-3">
                    <p className="text-xs font-semibold uppercase mb-1">{motivation.motivation}</p>
                    <p className="text-2xl font-bold">{motivation.value?.toFixed(0)}</p>
                    {(motivation.motivation === computed.top_motivation_1 ||
                      motivation.motivation === computed.top_motivation_2) && (
                      <p className="text-xs font-semibold mt-1">TOP DRIVER</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 border border-black p-4">
                <p className="text-sm font-semibold">Current Life Phase</p>
                <p className="text-lg">{computed.life_phase}</p>
                <p className="text-sm font-semibold mt-2">Desired Shift</p>
                <p className="text-lg">{computed.shift_desired}</p>
                <p className="text-sm font-semibold mt-2">Completion Need</p>
                <p className="text-lg">{computed.completion_need}</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">V. PSYCHOLOGICAL TENSIONS</h3>
              <div className="grid grid-cols-5 gap-4">
                {tensionsData.map((tension) => (
                  <div key={tension.name} className="border border-black p-3">
                    <p className="text-xs font-semibold uppercase mb-1">{tension.name}</p>
                    <p className="text-2xl font-bold">{tension.value?.toFixed(0)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">VI. BUSINESS INTELLIGENCE</h3>
              <div className="space-y-4">
                <div className="border border-black p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-semibold">Sophistication Potential</p>
                      <p className="text-xl font-bold">{computed.spi?.toFixed(0)} / {computed.spi_tier}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Upsell Readiness</p>
                      <p className="text-xl font-bold">{computed.urs?.toFixed(0)} / {computed.urs_tier}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Predicted NPS</p>
                      <p className="text-xl font-bold">{computed.nps_predicted?.toFixed(1)} / {computed.nps_tier}</p>
                    </div>
                  </div>
                </div>
                <div className="border border-black p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-semibold">Cancellation Risk</p>
                      <p className="text-xl font-bold">{computed.crs?.toFixed(0)} / {computed.crs_tier}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Group Friction Index</p>
                      <p className="text-xl font-bold">{computed.gfi?.toFixed(0)} / {computed.gfi_tier}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Content Generation Score</p>
                      <p className="text-xl font-bold">{computed.cgs?.toFixed(0)} / {computed.cgs_tier}</p>
                    </div>
                  </div>
                </div>
                <div className="border border-black p-4 bg-gray-100">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-semibold">Upsell Priority</p>
                      <p className="text-lg font-bold">{computed.upsell_priority}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Risk Flag</p>
                      <p className="text-lg font-bold">{computed.risk_flag}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Content Flag</p>
                      <p className="text-lg font-bold">{computed.content_flag ? "YES" : "NO"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">VII. EMOTIONAL STATE ASSESSMENT</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-black p-4">
                  <p className="text-sm font-semibold uppercase">Emotional Burden Index</p>
                  <p className="text-3xl font-bold">{computed.emotional_burden_index?.toFixed(0)}</p>
                </div>
                <div className="border border-black p-4">
                  <p className="text-sm font-semibold uppercase">Emotional Travel Index</p>
                  <p className="text-3xl font-bold">{computed.emotional_travel_index?.toFixed(0)}</p>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-black pt-6">
              <p className="text-xs text-gray-500 text-center">
                This report is confidential and intended for internal research use only.
                <br />
                Erranza Research Division • {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default SoulPrintVisualization;
