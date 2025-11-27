import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";

interface SoulPrintVisualizationProps {
  computed: any;
  narrative: any;
}

const SoulPrintVisualization = ({ computed, narrative }: SoulPrintVisualizationProps) => {
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

  return (
    <div className="space-y-6">
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