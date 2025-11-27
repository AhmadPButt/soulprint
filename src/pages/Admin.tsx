import { useEffect, useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, TrendingDown, Clock, CheckCircle, Download, Mail, FlaskConical, FileJson, Brain, MapPin } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const SoulPrintVisualization = lazy(() => import("@/components/admin/SoulPrintVisualization"));
const ItineraryVisualization = lazy(() => import("@/components/admin/ItineraryVisualization"));
import { GroupDiscussionsTab } from "@/components/admin/GroupDiscussionsTab";
import { AdminNotifications } from "@/components/admin/AdminNotifications";

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
  const [generatingItinerary, setGeneratingItinerary] = useState<string | null>(null);
  const [selectedItinerary, setSelectedItinerary] = useState<any>(null);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [generatingGroupItinerary, setGeneratingGroupItinerary] = useState<string | null>(null);

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
    console.log('Loading respondents with itineraries...');
    const { data, error } = await supabase
      .from("respondents")
      .select(`
        *,
        computed_scores (*),
        narrative_insights (*),
        itineraries (*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading respondents:", error);
      return;
    }

    console.log('Loaded respondents:', data?.map(r => ({
      id: r.id,
      name: r.name,
      itineraries_count: Array.isArray(r.itineraries) ? r.itineraries.length : 0
    })));

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

  const viewItinerary = async (respondentId: string) => {
    try {
      // Fetch existing itinerary from database
      const { data: itineraryData, error } = await supabase
        .from('itineraries')
        .select('*')
        .eq('respondent_id', respondentId)
        .single();

      if (error) {
        toast({
          title: "No Itinerary Found",
          description: "Please generate an itinerary first",
          variant: "destructive",
        });
        return;
      }

      // Find the respondent to get name
      const respondent = respondents.find(r => r.id === respondentId);
      
      setSelectedItinerary({
        itinerary: itineraryData.itinerary_data,
        itineraryId: itineraryData.id,
        respondentId: respondentId,
        respondentName: respondent?.name || 'Traveler'
      });
      setShowItineraryModal(true);

      toast({
        title: "Itinerary Loaded",
        description: `${respondent?.name}'s itinerary loaded successfully!`,
      });
    } catch (error: any) {
      console.error("Error viewing itinerary:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load itinerary",
        variant: "destructive",
      });
    }
  };

  const loadGroups = async () => {
    try {
      const { data: groupsData, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members (
            id,
            respondent_id,
            respondents (
              name,
              email,
              computed_scores (id),
              itineraries (id)
            )
          ),
          group_itineraries (
            id,
            itinerary_data,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGroups(groupsData || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const generateGroupItinerary = async (groupId: string) => {
    setGeneratingGroupItinerary(groupId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-group-itinerary', {
        body: { group_id: groupId }
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Group itinerary generated successfully",
      });

      await loadGroups();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate group itinerary",
        variant: "destructive",
      });
    } finally {
      setGeneratingGroupItinerary(null);
    }
  };

  const generateItinerary = async (respondentId: string, forceRegenerate = false) => {
    setGeneratingItinerary(respondentId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-itinerary", {
        body: { 
          respondent_id: respondentId,
          force_regenerate: forceRegenerate 
        },
      });

      if (error) throw error;

      toast({
        title: forceRegenerate ? "Itinerary Regenerated" : "Itinerary Generated",
        description: forceRegenerate 
          ? "New personalized journey created!"
          : "Personalized journey created successfully!",
      });

      // Find the respondent to get name
      const respondent = respondents.find(r => r.id === respondentId);
      
      setSelectedItinerary({
        itinerary: data.itinerary,
        itineraryId: data.itinerary_id,
        respondentId: respondentId,
        respondentName: respondent?.name || 'Traveler'
      });
      setShowItineraryModal(true);

      // Reload respondents to update itinerary status
      await loadRespondents();
    } catch (error: any) {
      console.error("Error generating itinerary:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate itinerary",
        variant: "destructive",
      });
    } finally {
      setGeneratingItinerary(null);
    }
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

  const togglePaymentStatus = async (respondentId: string, field: 'paid_flights' | 'paid_hotels' | 'paid_activities', currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('respondents')
        .update({ [field]: !currentValue })
        .eq('id', respondentId);

      if (error) throw error;

      toast({
        title: "Payment Status Updated",
        description: `${field.replace('paid_', '').replace('_', ' ')} marked as ${!currentValue ? 'paid' : 'unpaid'}`,
      });

      await loadRespondents();
    } catch (error: any) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAnalytics();
      loadVariants();
      loadRespondents();
      loadGroups();
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
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="dropoffs">Section Dropoffs</TabsTrigger>
                <TabsTrigger value="time">Time per Section</TabsTrigger>
                <TabsTrigger value="sessions">Recent Sessions</TabsTrigger>
                <TabsTrigger value="variants">A/B Testing</TabsTrigger>
                <TabsTrigger value="respondents">SoulPrint Submissions</TabsTrigger>
                <TabsTrigger value="groups">Travel Groups</TabsTrigger>
                <TabsTrigger value="discussions">Discussions</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
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
                          respondents.map((respondent) => {
                            const itineraries = Array.isArray(respondent.itineraries) ? respondent.itineraries : [];
                            const itinerary = itineraries[0];
                            const itineraryData = itinerary?.itinerary_data;
                            
                            return (
                            <div
                              key={respondent.id}
                              className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors space-y-3"
                            >
                              <div className="flex items-start justify-between gap-4">
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
                                  {itinerary && (
                                    <p className="text-xs text-primary mt-1">
                                      ✓ Itinerary Created
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2">
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
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() => viewSoulPrint(respondent)}
                                      >
                                        View SoulPrint
                                      </Button>
                                      {Array.isArray(respondent.itineraries) && respondent.itineraries.length > 0 ? (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => viewItinerary(respondent.id)}
                                          >
                                            <MapPin className="h-4 w-4 mr-1" />
                                            View Itinerary
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => generateItinerary(respondent.id, true)}
                                            disabled={generatingItinerary === respondent.id}
                                          >
                                            {generatingItinerary === respondent.id
                                              ? "Regenerating..."
                                              : "Regenerate"}
                                          </Button>
                                        </>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="secondary"
                                          onClick={() => generateItinerary(respondent.id)}
                                          disabled={generatingItinerary === respondent.id}
                                        >
                                          <MapPin className="h-4 w-4 mr-1" />
                                          {generatingItinerary === respondent.id
                                            ? "Generating..."
                                            : "Generate Itinerary"}
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Itinerary Preview Card */}
                              {itinerary && itineraryData && (
                                <div className="border border-border rounded-lg p-3 bg-background/50">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        {itineraryData.title || "Azerbaijan Journey"}
                                      </h4>
                                      <p className="text-xs text-muted-foreground mb-2">
                                        {itineraryData.duration || "7 days"} • {itineraryData.days?.length || 7} locations
                                      </p>
                                      <div className="flex flex-wrap gap-1 mb-2">
                                        {itineraryData.days?.slice(0, 3).map((day: any, idx: number) => (
                                          <Badge key={idx} variant="outline" className="text-xs">
                                            {day.location}
                                          </Badge>
                                        ))}
                                        {itineraryData.days?.length > 3 && (
                                          <Badge variant="outline" className="text-xs">
                                            +{itineraryData.days.length - 3} more
                                          </Badge>
                                        )}
                                      </div>
                                      {itineraryData.highlights && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                          {itineraryData.highlights}
                                        </p>
                                      )}
                                    </div>
                                    {itineraryData.estimated_cost && (
                                      <div className="text-right">
                                        <p className="text-xs text-muted-foreground">Est. Cost</p>
                                        <p className="text-lg font-bold text-primary">
                                          ${itineraryData.estimated_cost}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Payment Tracking */}
                              <div className="border border-border rounded-lg p-3 bg-background/50">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Payment Status:</p>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    variant={respondent.paid_flights ? "default" : "outline"}
                                    onClick={() => togglePaymentStatus(respondent.id, 'paid_flights', respondent.paid_flights)}
                                    className="text-xs"
                                  >
                                    <CheckCircle className={`h-3 w-3 mr-1 ${respondent.paid_flights ? '' : 'opacity-30'}`} />
                                    Flights {respondent.paid_flights ? 'Paid' : 'Unpaid'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={respondent.paid_hotels ? "default" : "outline"}
                                    onClick={() => togglePaymentStatus(respondent.id, 'paid_hotels', respondent.paid_hotels)}
                                    className="text-xs"
                                  >
                                    <CheckCircle className={`h-3 w-3 mr-1 ${respondent.paid_hotels ? '' : 'opacity-30'}`} />
                                    Hotels {respondent.paid_hotels ? 'Paid' : 'Unpaid'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={respondent.paid_activities ? "default" : "outline"}
                                    onClick={() => togglePaymentStatus(respondent.id, 'paid_activities', respondent.paid_activities)}
                                    className="text-xs"
                                  >
                                    <CheckCircle className={`h-3 w-3 mr-1 ${respondent.paid_activities ? '' : 'opacity-30'}`} />
                                    Activities {respondent.paid_activities ? 'Paid' : 'Unpaid'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )})
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="groups">
                <Card>
                  <CardHeader>
                    <CardTitle>Travel Groups</CardTitle>
                    <CardDescription>
                      Manage group travel arrangements and generate group itineraries
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-4">
                        {groups.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">
                            No travel groups created yet
                          </p>
                        ) : (
                          groups.map((group) => {
                            const members = group.group_members || [];
                            const allMembersComplete = members.every((m: any) => 
                              m.respondents?.computed_scores?.length > 0
                            );
                            const hasGroupItinerary = group.group_itineraries?.length > 0;

                            return (
                              <div
                                key={group.id}
                                className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors space-y-3"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold">{group.name}</p>
                                      <Badge variant="outline">
                                        Join Code: {group.join_code}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Created {new Date(group.created_at).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm mt-2">
                                      {members.length} {members.length === 1 ? 'member' : 'members'}
                                    </p>
                                    {allMembersComplete && (
                                      <p className="text-xs text-green-500 mt-1">
                                        ✓ All members completed SoulPrints
                                      </p>
                                    )}
                                    {hasGroupItinerary && (
                                      <p className="text-xs text-primary mt-1">
                                        ✓ Group Itinerary Created
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {allMembersComplete && !hasGroupItinerary && (
                                      <Button
                                        size="sm"
                                        onClick={() => generateGroupItinerary(group.id)}
                                        disabled={generatingGroupItinerary === group.id}
                                      >
                                        <MapPin className="h-4 w-4 mr-1" />
                                        {generatingGroupItinerary === group.id
                                          ? "Generating..."
                                          : "Generate Group Itinerary"}
                                      </Button>
                                    )}
                                    {!allMembersComplete && (
                                      <Badge variant="secondary" className="text-xs">
                                        Waiting for all members
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground">Group Members:</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {members.map((member: any) => (
                                      <div
                                        key={member.id}
                                        className="p-2 rounded border border-border bg-card text-xs"
                                      >
                                        <p className="font-medium">{member.respondents?.name || 'Unknown'}</p>
                                        <p className="text-muted-foreground">{member.respondents?.email || 'No email'}</p>
                                        {member.respondents?.computed_scores?.length > 0 ? (
                                          <Badge variant="outline" className="mt-1 text-xs">
                                            ✓ Completed
                                          </Badge>
                                        ) : (
                                          <Badge variant="secondary" className="mt-1 text-xs">
                                            Pending
                                          </Badge>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {hasGroupItinerary && (
                                  <div className="pt-2 border-t">
                                    <p className="text-xs text-muted-foreground">
                                      Group itinerary created on{' '}
                                      {new Date(group.group_itineraries[0].created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="discussions">
                <GroupDiscussionsTab />
              </TabsContent>

              <TabsContent value="notifications">
                <AdminNotifications />
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
              <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
                <SoulPrintVisualization
                  computed={selectedSoulPrint.computed}
                  narrative={selectedSoulPrint.narrative}
                  respondentId={selectedSoulPrint.respondent.id}
                  onRegenerateComplete={loadRespondents}
                />
              </Suspense>
            )}
          </DialogContent>
        </Dialog>

        {/* Itinerary Visualization Modal */}
        <Dialog open={showItineraryModal} onOpenChange={setShowItineraryModal}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedItinerary?.respondentName}'s Personalized Itinerary
              </DialogTitle>
              <DialogDescription>
                7-day psychologically-aligned journey through Azerbaijan
              </DialogDescription>
            </DialogHeader>
            {selectedItinerary && (
              <Suspense fallback={<div className="p-8 text-center">Loading map...</div>}>
                <ItineraryVisualization
                  itinerary={selectedItinerary.itinerary}
                  itineraryId={selectedItinerary.itineraryId}
                  respondentId={selectedItinerary.respondentId}
                  respondentName={selectedItinerary.respondentName}
                  onItineraryUpdate={(updatedItinerary) => {
                    setSelectedItinerary({
                      ...selectedItinerary,
                      itinerary: updatedItinerary
                    });
                  }}
                />
              </Suspense>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;
