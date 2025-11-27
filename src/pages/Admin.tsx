import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, TrendingDown, Clock, CheckCircle, Download, Mail, FlaskConical, FileJson, Brain } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SoulPrintVisualization from "@/components/admin/SoulPrintVisualization";

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
    variant_name?: string;
  }[];
  variantMetrics?: {
    variant_id: string;
    variant_name: string;
    starts: number;
    completions: number;
    completionRate: number;
  }[];
}

interface Variant {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  weight: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [respondents, setRespondents] = useState<any[]>([]);
  const [selectedSoulPrint, setSelectedSoulPrint] = useState<any>(null);
  const [showSoulPrintModal, setShowSoulPrintModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [computingId, setComputingId] = useState<string | null>(null);

  const loadAnalytics = async () => {
    try {
      // Fetch all analytics data
      const { data: allEvents, error } = await supabase
        .from("questionnaire_analytics")
        .select("*")
        .order("timestamp", { ascending: false });

      if (error) throw error;

      if (!allEvents) {
        setAnalytics({
          totalStarts: 0,
          totalCompletions: 0,
          completionRate: 0,
          sectionDropoffs: [],
          averageTimePerSection: [],
          recentSessions: [],
        });
        return;
      }

      // Calculate metrics
      const starts = allEvents.filter((e) => e.event_type === "started").length;
      const completions = allEvents.filter((e) => e.event_type === "completed").length;
      const completionRate = starts > 0 ? (completions / starts) * 100 : 0;

      // Calculate section dropoffs
      const abandonments = allEvents.filter((e) => e.event_type === "abandoned");
      const dropoffCounts = new Map<number, number>();
      abandonments.forEach((e) => {
        if (e.section_number) {
          dropoffCounts.set(e.section_number, (dropoffCounts.get(e.section_number) || 0) + 1);
        }
      });
      const sectionDropoffs = Array.from(dropoffCounts.entries())
        .map(([section, count]) => ({ section, count }))
        .sort((a, b) => a.section - b.section);

      // Calculate average time per section
      const sectionCompletions = allEvents.filter((e) => e.event_type === "section_completed");
      const timeBySectionMap = new Map<number, number[]>();
      sectionCompletions.forEach((e) => {
        if (e.section_number && e.time_spent_seconds) {
          if (!timeBySectionMap.has(e.section_number)) {
            timeBySectionMap.set(e.section_number, []);
          }
          timeBySectionMap.get(e.section_number)!.push(e.time_spent_seconds);
        }
      });
      const averageTimePerSection = Array.from(timeBySectionMap.entries())
        .map(([section, times]) => ({
          section,
          avgTime: Math.floor(times.reduce((a, b) => a + b, 0) / times.length),
        }))
        .sort((a, b) => a.section - b.section);

      // Get recent sessions
      const sessionMap = new Map<string, any>();
      allEvents.forEach((event) => {
        if (!sessionMap.has(event.session_id)) {
          sessionMap.set(event.session_id, {
            session_id: event.session_id,
            email: event.email,
            started_at: event.timestamp,
            last_section: 0,
            status: "started",
            variant_id: event.variant_id,
          });
        }
        const session = sessionMap.get(event.session_id);
        if (event.event_type === "section_completed" && event.section_number) {
          session.last_section = Math.max(session.last_section, event.section_number);
        }
        if (event.event_type === "completed") {
          session.status = "completed";
          session.last_section = 8;
        } else if (event.event_type === "abandoned") {
          session.status = "abandoned";
        }
      });

      // Fetch variants to add names to sessions
      const { data: variantsData } = await supabase
        .from("questionnaire_variants")
        .select("*");

      const variantMap = new Map(variantsData?.map(v => [v.id, v.name]) || []);

      const recentSessions = Array.from(sessionMap.values())
        .map(session => ({
          ...session,
          variant_name: variantMap.get(session.variant_id) || "Control"
        }))
        .slice(0, 20);

      // Calculate variant metrics
      const variantMetrics = variantsData?.map(variant => {
        const variantEvents = allEvents.filter(e => e.variant_id === variant.id);
        const variantStarts = variantEvents.filter(e => e.event_type === "started").length;
        const variantCompletions = variantEvents.filter(e => e.event_type === "completed").length;
        return {
          variant_id: variant.id,
          variant_name: variant.name,
          starts: variantStarts,
          completions: variantCompletions,
          completionRate: variantStarts > 0 ? (variantCompletions / variantStarts) * 100 : 0
        };
      }) || [];

      setAnalytics({
        totalStarts: starts,
        totalCompletions: completions,
        completionRate,
        sectionDropoffs,
        averageTimePerSection,
        recentSessions,
        variantMetrics,
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadVariants = async () => {
    const { data, error } = await supabase
      .from("questionnaire_variants")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading variants:", error);
      return;
    }

    setVariants(data || []);
  };

  const loadRespondents = async () => {
    const { data, error } = await supabase
      .from("respondents")
      .select(`
        *,
        computed_scores (*),
        narrative_insights (*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading respondents:", error);
      return;
    }

    setRespondents(data || []);
  };

  const downloadJSON = (respondent: any) => {
    const blob = new Blob([JSON.stringify(respondent.raw_responses, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soulprint_${respondent.name.replace(/\s+/g, "_")}_${respondent.id.substring(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: `SoulPrint JSON for ${respondent.name} downloaded successfully`,
    });
  };

  const computeSoulPrint = async (respondentId: string) => {
    setComputingId(respondentId);
    try {
      const { data, error } = await supabase.functions.invoke("compute-soulprint", {
        body: { respondent_id: respondentId },
      });

      if (error) throw error;

      toast({
        title: "SoulPrint Computed",
        description: "The SoulPrint has been calculated successfully!",
      });

      // Reload respondents to get updated data
      await loadRespondents();
    } catch (error: any) {
      console.error("Error computing SoulPrint:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to compute SoulPrint",
        variant: "destructive",
      });
    } finally {
      setComputingId(null);
    }
  };

  const viewSoulPrint = async (respondent: any) => {
    if (!respondent.computed_scores || respondent.computed_scores.length === 0) {
      toast({
        title: "No Computation",
        description: "Please compute the SoulPrint first",
        variant: "destructive",
      });
      return;
    }

    setSelectedSoulPrint({
      respondent,
      computed: respondent.computed_scores[0],
      narrative: respondent.narrative_insights?.[0] || null,
    });
    setShowSoulPrintModal(true);
  };

  const sendWeeklyReport = async () => {
    setSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-weekly-analytics");
      
      if (error) throw error;
      
      toast({
        title: "Email Sent",
        description: "Weekly analytics report sent to ahmad@erranza.ai",
      });
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast({
        title: "Error",
        description: "Failed to send email report",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAnalytics();
      loadVariants();
      loadRespondents();
      // Set up realtime subscription
      const channel = supabase
        .channel("analytics-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "questionnaire_analytics",
          },
          () => {
            loadAnalytics();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "respondents",
          },
          () => {
            loadRespondents();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    // Simple password check - in production, use proper authentication
    if (password === "Zahrasoulprint123") {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  const exportToCSV = (startDate?: string, endDate?: string) => {
    if (!analytics) return;

    // Filter events by date range if provided
    let eventsToExport = analytics.recentSessions;
    
    // Create CSV content
    const headers = ["Session ID", "Email", "Started At", "Last Section", "Status", "Variant"];
    const rows = eventsToExport.map((session) => [
      session.session_id,
      session.email || "Anonymous",
      new Date(session.started_at).toLocaleString(),
      session.last_section,
      session.status,
      session.variant_name || "Control"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soulprint-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Access</CardTitle>
            <CardDescription>Enter the admin password to view analytics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Password"
              className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground"
            />
            <Button onClick={handleLogin} className="w-full">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-heading font-bold mb-2">SoulPrint Analytics Dashboard</h1>
              <p className="text-muted-foreground">Monitor completion and dropoff rates</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => exportToCSV()}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={sendWeeklyReport} disabled={sendingEmail}>
                <Mail className="mr-2 h-4 w-4" />
                {sendingEmail ? "Sending..." : "Send Report"}
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>

        {analytics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Starts</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalStarts}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completions</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalCompletions}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.completionRate.toFixed(1)}%</div>
                  <Progress value={analytics.completionRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Time/Section</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {analytics.averageTimePerSection.length > 0
                      ? Math.floor(
                          analytics.averageTimePerSection.reduce((a, b) => a + b.avgTime, 0) /
                            analytics.averageTimePerSection.length /
                            60
                        )
                      : 0}
                    m
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="dropoffs" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="dropoffs">Section Dropoffs</TabsTrigger>
                <TabsTrigger value="time">Time per Section</TabsTrigger>
                <TabsTrigger value="sessions">Recent Sessions</TabsTrigger>
                <TabsTrigger value="variants">A/B Testing</TabsTrigger>
                <TabsTrigger value="respondents">SoulPrint Submissions</TabsTrigger>
              </TabsList>

              <TabsContent value="dropoffs">
                <Card>
                  <CardHeader>
                    <CardTitle>Dropoff by Section</CardTitle>
                    <CardDescription>
                      Number of users who abandoned at each section
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.sectionDropoffs.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No dropoffs recorded yet</p>
                      ) : (
                        analytics.sectionDropoffs.map((item) => (
                          <div key={item.section} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Section {item.section}</span>
                              <span className="text-sm text-muted-foreground">{item.count} dropoffs</span>
                            </div>
                            <Progress
                              value={(item.count / analytics.totalStarts) * 100}
                              className="h-2"
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="time">
                <Card>
                  <CardHeader>
                    <CardTitle>Average Time per Section</CardTitle>
                    <CardDescription>How long users spend on each section</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.averageTimePerSection.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No time data recorded yet</p>
                      ) : (
                        analytics.averageTimePerSection.map((item) => (
                          <div key={item.section} className="flex items-center justify-between">
                            <span className="text-sm font-medium">Section {item.section}</span>
                            <span className="text-sm text-muted-foreground">
                              {Math.floor(item.avgTime / 60)}m {item.avgTime % 60}s
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sessions">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Sessions</CardTitle>
                    <CardDescription>Latest user activity and progress</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {analytics.recentSessions.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">No sessions recorded yet</p>
                        ) : (
                          analytics.recentSessions.map((session) => (
                            <div
                              key={session.session_id}
                              className="flex items-center justify-between p-4 rounded-lg bg-card border border-border"
                            >
                              <div className="space-y-1">
                                <p className="text-sm font-medium">
                                  {session.email || "Anonymous"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(session.started_at).toLocaleString()}
                                </p>
                              </div>
                              <div className="text-right space-y-1">
                                <p className="text-sm font-medium">
                                  Section {session.last_section}/8
                                </p>
                                <p
                                  className={`text-xs ${
                                    session.status === "completed"
                                      ? "text-green-500"
                                      : session.status === "abandoned"
                                      ? "text-red-500"
                                      : "text-yellow-500"
                                  }`}
                                >
                                  {session.status}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="variants">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FlaskConical className="h-5 w-5" />
                      A/B Test Variants
                    </CardTitle>
                    <CardDescription>
                      Compare completion rates across different questionnaire variants
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {analytics?.variantMetrics && analytics.variantMetrics.length > 0 ? (
                        analytics.variantMetrics.map((metric) => (
                          <div key={metric.variant_id} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">{metric.variant_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {metric.starts} starts, {metric.completions} completions
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold">{metric.completionRate.toFixed(1)}%</p>
                                <p className="text-xs text-muted-foreground">Completion Rate</p>
                              </div>
                            </div>
                            <Progress value={metric.completionRate} className="h-3" />
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          No A/B test data available yet
                        </p>
                      )}
                      
                      <div className="pt-6 border-t">
                        <h3 className="font-semibold mb-3">Active Variants</h3>
                        <div className="space-y-2">
                          {variants.map((variant) => (
                            <div
                              key={variant.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                            >
                              <div>
                                <p className="font-medium">{variant.name}</p>
                                {variant.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {variant.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  Weight: {variant.weight}%
                                </span>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    variant.is_active
                                      ? "bg-green-500/20 text-green-500"
                                      : "bg-red-500/20 text-red-500"
                                  }`}
                                >
                                  {variant.is_active ? "Active" : "Inactive"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="respondents">
                <Card>
                  <CardHeader>
                    <CardTitle>SoulPrint Submissions</CardTitle>
                    <CardDescription>
                      View, download, and compute SoulPrints for all respondents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-3">
                        {respondents.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">
                            No submissions yet
                          </p>
                        ) : (
                          respondents.map((respondent) => (
                            <div
                              key={respondent.id}
                              className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                            >
                              <div className="flex-1">
                                <p className="font-semibold">{respondent.name}</p>
                                <p className="text-sm text-muted-foreground">{respondent.email}</p>
                                <p className="text-xs text-muted-foreground">
                                  Submitted {new Date(respondent.created_at).toLocaleString()}
                                </p>
                                {respondent.computed_scores?.length > 0 && (
                                  <p className="text-xs text-green-500 mt-1">
                                    ✓ SoulPrint Computed
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadJSON(respondent)}
                                >
                                  <FileJson className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => computeSoulPrint(respondent.id)}
                                  disabled={computingId === respondent.id}
                                >
                                  <Brain className="h-4 w-4 mr-1" />
                                  {computingId === respondent.id
                                    ? "Computing..."
                                    : "Compute"}
                                </Button>
                                {respondent.computed_scores?.length > 0 && (
                                  <Button
                                    size="sm"
                                    onClick={() => viewSoulPrint(respondent)}
                                  >
                                    View SoulPrint
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* SoulPrint Visualization Modal */}
        <Dialog open={showSoulPrintModal} onOpenChange={setShowSoulPrintModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedSoulPrint?.respondent.name}'s SoulPrint
              </DialogTitle>
              <DialogDescription>
                Complete psychological and travel profile with AI-generated insights
              </DialogDescription>
            </DialogHeader>
            {selectedSoulPrint && (
              <SoulPrintVisualization
                computed={selectedSoulPrint.computed}
                narrative={selectedSoulPrint.narrative}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;
