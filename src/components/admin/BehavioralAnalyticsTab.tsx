import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, TrendingUp, MousePointerClick, Eye, Users, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell } from "recharts";

interface FunnelStep {
  name: string;
  value: number;
  fill: string;
}

interface DestinationStat {
  destination_id: string;
  destination_name: string;
  impressions: number;
  clicks: number;
  ctr: number;
  avgHoverMs: number;
  tripConversions: number;
}

const FUNNEL_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--primary) / 0.85)",
  "hsl(var(--primary) / 0.7)",
  "hsl(var(--primary) / 0.55)",
  "hsl(var(--primary) / 0.4)",
  "hsl(var(--primary) / 0.3)",
  "hsl(var(--primary) / 0.2)",
  "hsl(var(--primary) / 0.15)",
];

export function BehavioralAnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [funnelData, setFunnelData] = useState<FunnelStep[]>([]);
  const [destStats, setDestStats] = useState<DestinationStat[]>([]);
  const [totals, setTotals] = useState({
    totalEvents: 0,
    uniqueUsers: 0,
    uniqueSessions: 0,
    eventBreakdown: [] as { event_type: string; count: number }[],
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Fetch all analytics events (admin reads via service role won't work from client,
      // so we use questionnaire_analytics for funnel + analytics_events for dest tracking)
      // For the funnel, we leverage questionnaire_analytics which already tracks the questionnaire funnel
      const { data: qaEvents } = await supabase
        .from("questionnaire_analytics")
        .select("event_type, session_id, email");

      // Build funnel from questionnaire_analytics
      const sessions = new Set<string>();
      const completedSessions = new Set<string>();
      qaEvents?.forEach(e => {
        sessions.add(e.session_id);
        if (e.event_type === "completed") completedSessions.add(e.session_id);
      });

      // Get respondent count
      const { count: respondentCount } = await supabase
        .from("respondents")
        .select("*", { count: "exact", head: true });

      // Get destination match views
      const { count: matchViewCount } = await supabase
        .from("destination_matches")
        .select("*", { count: "exact", head: true })
        .eq("shown_to_user", true);

      // Get destination clicks
      const { count: matchClickCount } = await supabase
        .from("destination_matches")
        .select("*", { count: "exact", head: true })
        .eq("clicked_by_user", true);

      // Get itinerary count
      const { count: itineraryCount } = await supabase
        .from("itineraries")
        .select("*", { count: "exact", head: true });

      // Get trip count
      const { count: tripCount } = await supabase
        .from("trips")
        .select("*", { count: "exact", head: true });

      // Get consultation booked count
      const { count: consultationCount } = await supabase
        .from("trips")
        .select("*", { count: "exact", head: true })
        .eq("consultation_booked", true);

      const startedCount = qaEvents?.filter(e => e.event_type === "started").length || 0;

      const funnel: FunnelStep[] = [
        { name: "Started Questionnaire", value: startedCount, fill: FUNNEL_COLORS[0] },
        { name: "Completed Questionnaire", value: completedSessions.size, fill: FUNNEL_COLORS[1] },
        { name: "SoulPrint Computed", value: respondentCount || 0, fill: FUNNEL_COLORS[2] },
        { name: "Viewed Matches", value: matchViewCount || 0, fill: FUNNEL_COLORS[3] },
        { name: "Clicked Destination", value: matchClickCount || 0, fill: FUNNEL_COLORS[4] },
        { name: "Generated Itinerary", value: itineraryCount || 0, fill: FUNNEL_COLORS[5] },
        { name: "Created Trip", value: tripCount || 0, fill: FUNNEL_COLORS[6] },
        { name: "Booked Consultation", value: consultationCount || 0, fill: FUNNEL_COLORS[7] },
      ];
      setFunnelData(funnel);

      // Destination analytics
      const { data: matches } = await supabase
        .from("destination_matches")
        .select("destination_id, shown_to_user, clicked_by_user, fit_score, echoprint_destinations(name)");

      const { data: trips } = await supabase
        .from("trips")
        .select("destination_id");

      const destMap = new Map<string, DestinationStat>();
      matches?.forEach((m: any) => {
        const id = m.destination_id;
        if (!destMap.has(id)) {
          destMap.set(id, {
            destination_id: id,
            destination_name: m.echoprint_destinations?.name || "Unknown",
            impressions: 0,
            clicks: 0,
            ctr: 0,
            avgHoverMs: 0,
            tripConversions: 0,
          });
        }
        const stat = destMap.get(id)!;
        if (m.shown_to_user) stat.impressions++;
        if (m.clicked_by_user) stat.clicks++;
      });

      trips?.forEach((t: any) => {
        if (t.destination_id && destMap.has(t.destination_id)) {
          destMap.get(t.destination_id)!.tripConversions++;
        }
      });

      destMap.forEach(stat => {
        stat.ctr = stat.impressions > 0 ? Math.round((stat.clicks / stat.impressions) * 100) : 0;
      });

      const sortedDest = Array.from(destMap.values()).sort((a, b) => b.impressions - a.impressions);
      setDestStats(sortedDest);

      setTotals({
        totalEvents: qaEvents?.length || 0,
        uniqueUsers: new Set(qaEvents?.map(e => e.email).filter(Boolean)).size,
        uniqueSessions: sessions.size,
        eventBreakdown: [],
      });
    } catch (error) {
      console.error("Error loading behavioral analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.uniqueSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.uniqueUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Destinations Tracked</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{destStats.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg CTR</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {destStats.length > 0
                ? Math.round(destStats.reduce((s, d) => s + d.ctr, 0) / destStats.length)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Conversion Funnel
          </CardTitle>
          <CardDescription>User journey from questionnaire start to trip booking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelData.map((step, i) => {
              const prevValue = i === 0 ? step.value : funnelData[i - 1].value;
              const convRate = prevValue > 0 ? Math.round((step.value / prevValue) * 100) : 0;
              const widthPct = funnelData[0].value > 0 ? Math.max(8, (step.value / funnelData[0].value) * 100) : 8;

              return (
                <div key={step.name} className="flex items-center gap-3">
                  <div className="w-44 text-sm text-muted-foreground shrink-0 text-right">
                    {step.name}
                  </div>
                  <div className="flex-1 relative">
                    <div
                      className="h-8 rounded-md flex items-center px-3 transition-all"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: step.fill,
                        minWidth: "60px",
                      }}
                    >
                      <span className="text-xs font-bold text-primary-foreground">{step.value}</span>
                    </div>
                  </div>
                  {i > 0 && (
                    <div className="w-16 shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {convRate}%
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Destination Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointerClick className="h-5 w-5" /> Destination Performance
          </CardTitle>
          <CardDescription>Impressions, clicks, and trip conversions per destination</CardDescription>
        </CardHeader>
        <CardContent>
          {destStats.length > 0 ? (
            <>
              <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={destStats.slice(0, 10)} layout="vertical">
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="destination_name"
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip />
                    <Bar dataKey="impressions" fill="hsl(var(--muted-foreground) / 0.3)" name="Impressions" />
                    <Bar dataKey="clicks" fill="hsl(var(--primary))" name="Clicks" />
                    <Bar dataKey="tripConversions" fill="hsl(var(--chart-2))" name="Trips" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <ScrollArea className="h-[300px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Destination</th>
                      <th className="pb-2 font-medium text-right">Impressions</th>
                      <th className="pb-2 font-medium text-right">Clicks</th>
                      <th className="pb-2 font-medium text-right">CTR</th>
                      <th className="pb-2 font-medium text-right">Trips</th>
                    </tr>
                  </thead>
                  <tbody>
                    {destStats.map(d => (
                      <tr key={d.destination_id} className="border-b border-border/30">
                        <td className="py-2 font-medium">{d.destination_name}</td>
                        <td className="py-2 text-right text-muted-foreground">{d.impressions}</td>
                        <td className="py-2 text-right">{d.clicks}</td>
                        <td className="py-2 text-right">
                          <Badge variant={d.ctr >= 50 ? "default" : "outline"} className="text-xs">
                            {d.ctr}%
                          </Badge>
                        </td>
                        <td className="py-2 text-right">{d.tripConversions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">No destination data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
