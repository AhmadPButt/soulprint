import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, MousePointerClick, Eye, Users, Clock, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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

interface AnalyticsData {
  totalStarts: number;
  totalCompletions: number;
  completionRate: number;
  sectionDropoffs: { section: number; count: number }[];
  averageTimePerSection: { section: number; avgTime: number }[];
  recentSessions: {
    session_id: string;
    email: string | null;
    started_at: string;
    last_section: number;
    status: string;
  }[];
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
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [totals, setTotals] = useState({
    totalEvents: 0,
    uniqueUsers: 0,
    uniqueSessions: 0,
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Fetch questionnaire analytics events
      const { data: qaEvents } = await supabase
        .from("questionnaire_analytics")
        .select("*")
        .order("timestamp", { ascending: false });

      // Process events in ASCENDING order so later events overwrite earlier correctly
      const sortedEvents = [...(qaEvents || [])].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Build funnel sessions
      const sessions = new Set<string>();
      const completedSessions = new Set<string>();
      sortedEvents.forEach(e => {
        sessions.add(e.session_id);
        if (e.event_type === "completed") completedSessions.add(e.session_id);
      });

      // Compute analytics data
      const starts = sortedEvents.filter(e => e.event_type === "started").length || 0;
      const completions = sortedEvents.filter(e => e.event_type === "completed").length || 0;
      const completionRate = starts > 0 ? (completions / starts) * 100 : 0;

      // Section dropoffs — only count truly abandoned sessions (never completed)
      const sessionsFinalStatus = new Map<string, string>();
      sortedEvents.forEach(e => {
        if (e.event_type === "completed") sessionsFinalStatus.set(e.session_id, "completed");
        else if (e.event_type === "abandoned" && sessionsFinalStatus.get(e.session_id) !== "completed") {
          sessionsFinalStatus.set(e.session_id, "abandoned");
        }
      });
      const abandonments = sortedEvents.filter(
        e => e.event_type === "abandoned" && sessionsFinalStatus.get(e.session_id) === "abandoned"
      );
      const dropoffCounts = new Map<number, number>();
      abandonments.forEach(e => {
        if (e.section_number) {
          dropoffCounts.set(e.section_number, (dropoffCounts.get(e.section_number) || 0) + 1);
        }
      });
      const sectionDropoffs = Array.from(dropoffCounts.entries())
        .map(([section, count]) => ({ section, count }))
        .sort((a, b) => a.section - b.section);

      // Average time per section
      const sectionCompletions = sortedEvents.filter(e => e.event_type === "section_completed") || [];
      const timeBySectionMap = new Map<number, number[]>();
      sectionCompletions.forEach(e => {
        if (e.section_number && e.time_spent_seconds) {
          if (!timeBySectionMap.has(e.section_number)) timeBySectionMap.set(e.section_number, []);
          timeBySectionMap.get(e.section_number)!.push(e.time_spent_seconds);
        }
      });
      const averageTimePerSection = Array.from(timeBySectionMap.entries())
        .map(([section, times]) => ({
          section,
          avgTime: Math.floor(times.reduce((a, b) => a + b, 0) / times.length),
        }))
        .sort((a, b) => a.section - b.section);

      // Recent sessions — process in ascending order so final state is correct
      const sessionMap = new Map<string, any>();
      sortedEvents.forEach(event => {
        if (!sessionMap.has(event.session_id)) {
          sessionMap.set(event.session_id, {
            session_id: event.session_id,
            email: event.email,
            started_at: event.timestamp,
            last_section: 0,
            status: "in_progress",
          });
        }
        const session = sessionMap.get(event.session_id);
        if (event.event_type === "section_completed" && event.section_number) {
          session.last_section = Math.max(session.last_section, event.section_number);
        }
        // Only set completed/abandoned if not already completed
        if (event.event_type === "completed") {
          session.status = "completed";
          session.last_section = 6;
        } else if (event.event_type === "abandoned" && session.status !== "completed") {
          session.status = "abandoned";
        }
      });
      // Sort by most recent started_at DESC for display
      const recentSessions = Array.from(sessionMap.values())
        .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
        .slice(0, 50);

      setAnalyticsData({ totalStarts: starts, totalCompletions: completions, completionRate, sectionDropoffs, averageTimePerSection, recentSessions });

      // Get counts for funnel
      const { count: respondentCount } = await supabase.from("respondents").select("*", { count: "exact", head: true });
      const { count: matchViewCount } = await supabase.from("destination_matches").select("*", { count: "exact", head: true }).eq("shown_to_user", true);
      const { count: matchClickCount } = await supabase.from("destination_matches").select("*", { count: "exact", head: true }).eq("clicked_by_user", true);
      const { count: itineraryCount } = await supabase.from("itineraries").select("*", { count: "exact", head: true });
      const { count: tripCount } = await supabase.from("trips").select("*", { count: "exact", head: true });
      const { count: consultationCount } = await supabase.from("trips").select("*", { count: "exact", head: true }).eq("consultation_booked", true);

      const funnel: FunnelStep[] = [
        { name: "Started Questionnaire", value: starts, fill: FUNNEL_COLORS[0] },
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
      const { data: trips } = await supabase.from("trips").select("destination_id");

      const destMap = new Map<string, DestinationStat>();
      matches?.forEach((m: any) => {
        const id = m.destination_id;
        if (!destMap.has(id)) {
          destMap.set(id, { destination_id: id, destination_name: m.echoprint_destinations?.name || "Unknown", impressions: 0, clicks: 0, ctr: 0, avgHoverMs: 0, tripConversions: 0 });
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totals.uniqueSessions}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totals.uniqueUsers}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.completionRate.toFixed(1)}%</div>
            <Progress value={analyticsData?.completionRate || 0} className="mt-2 h-1" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Destinations Tracked</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{destStats.length}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="funnel" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1">
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="dropoffs">Dropoffs</TabsTrigger>
          <TabsTrigger value="time">Time per Section</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="destinations">Destinations</TabsTrigger>
        </TabsList>

        {/* Conversion Funnel */}
        <TabsContent value="funnel">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Conversion Funnel</CardTitle>
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
                      <div className="w-44 text-sm text-muted-foreground shrink-0 text-right">{step.name}</div>
                      <div className="flex-1 relative">
                        <div className="h-8 rounded-md flex items-center px-3 transition-all" style={{ width: `${widthPct}%`, backgroundColor: step.fill, minWidth: "60px" }}>
                          <span className="text-xs font-bold text-primary-foreground">{step.value}</span>
                        </div>
                      </div>
                      {i > 0 && (
                        <div className="w-16 shrink-0">
                          <Badge variant="outline" className="text-xs">{convRate}%</Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dropoffs */}
        <TabsContent value="dropoffs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5" /> Dropoffs by Section</CardTitle>
              <CardDescription>Number of users who abandoned at each section of the questionnaire</CardDescription>
            </CardHeader>
            <CardContent>
              {(analyticsData?.sectionDropoffs.length || 0) === 0 ? (
                <p className="text-muted-foreground text-center py-8">No dropoff data recorded yet</p>
              ) : (
                <div className="space-y-4">
                  {analyticsData?.sectionDropoffs.map(item => (
                    <div key={item.section} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Section {item.section}</span>
                        <span className="text-sm text-muted-foreground">{item.count} dropoffs</span>
                      </div>
                      <Progress value={analyticsData.totalStarts > 0 ? (item.count / analyticsData.totalStarts) * 100 : 0} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time per Section */}
        <TabsContent value="time">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Average Time per Section</CardTitle>
              <CardDescription>How long users spend on each section of the questionnaire</CardDescription>
            </CardHeader>
            <CardContent>
              {(analyticsData?.averageTimePerSection.length || 0) === 0 ? (
                <p className="text-muted-foreground text-center py-8">No time data recorded yet</p>
              ) : (
                <>
                  <div className="h-48 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData?.averageTimePerSection.map(s => ({ name: `S${s.section}`, seconds: s.avgTime }))}>
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={v => `${Math.floor(v / 60)}m`} />
                        <Tooltip formatter={(v: any) => [`${Math.floor(v / 60)}m ${v % 60}s`, "Avg Time"]} />
                        <Bar dataKey="seconds" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {analyticsData?.averageTimePerSection.map(item => (
                      <div key={item.section} className="flex items-center justify-between py-2 border-b border-border/30">
                        <span className="text-sm font-medium">Section {item.section}</span>
                        <span className="text-sm text-muted-foreground">{Math.floor(item.avgTime / 60)}m {item.avgTime % 60}s</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Recent Sessions</CardTitle>
              <CardDescription>Latest user activity and questionnaire progress</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px]">
                <div className="space-y-3">
                  {(analyticsData?.recentSessions.length || 0) === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No sessions recorded yet</p>
                  ) : (
                    analyticsData?.recentSessions.map(session => (
                      <div key={session.session_id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{session.email || "Anonymous"}</p>
                          <p className="text-xs text-muted-foreground">{new Date(session.started_at).toLocaleString()}</p>
                        </div>
                        <div className="text-right space-y-0.5">
                          <p className="text-sm font-medium">Section {session.last_section}/6</p>
                          <Badge variant="outline" className={`text-xs ${
                            session.status === "completed" ? "text-emerald-600 border-emerald-300 bg-emerald-50"
                              : session.status === "abandoned" ? "text-red-500 border-red-300 bg-red-50"
                              : "text-amber-600 border-amber-300 bg-amber-50"
                          }`}>
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Destinations */}
        <TabsContent value="destinations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MousePointerClick className="h-5 w-5" /> Destination Performance</CardTitle>
              <CardDescription>Impressions, clicks, and trip conversions per destination</CardDescription>
            </CardHeader>
            <CardContent>
              {destStats.length > 0 ? (
                <>
                  <div className="h-64 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={destStats.slice(0, 10)} layout="vertical">
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="destination_name" width={120} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="impressions" fill="hsl(var(--muted-foreground) / 0.3)" name="Impressions" />
                        <Bar dataKey="clicks" fill="hsl(var(--primary))" name="Clicks" />
                        <Bar dataKey="tripConversions" fill="hsl(var(--chart-2))" name="Trips" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <ScrollArea className="h-[250px]">
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
                            <td className="py-2 text-right"><Badge variant={d.ctr >= 50 ? "default" : "outline"} className="text-xs">{d.ctr}%</Badge></td>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
