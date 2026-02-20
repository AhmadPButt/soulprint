import { useEffect, useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, TrendingDown, Clock, CheckCircle, Download, Mail, FlaskConical, FileJson, Brain, MapPin, User, Globe, Phone, Utensils, BedDouble, Fingerprint, HeadphonesIcon, BarChart3, Shield, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AdminsTab } from "@/components/admin/AdminsTab";
import { TripStatusControl } from "@/components/admin/TripStatusControl";

const SoulPrintVisualization = lazy(() => import("@/components/admin/SoulPrintVisualization"));
const ItineraryVisualization = lazy(() => import("@/components/admin/ItineraryVisualization"));
import { GroupDiscussionsTab } from "@/components/admin/GroupDiscussionsTab";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { DestinationsTab } from "@/components/admin/DestinationsTab";
import { MatchTestPanel } from "@/components/admin/MatchTestPanel";
import { AdminDocumentUpload } from "@/components/admin/AdminDocumentUpload";
import { AdminSupportTab } from "@/components/admin/AdminSupportTab";
import { AlgorithmPerformanceTab } from "@/components/admin/AlgorithmPerformanceTab";
import { BehavioralAnalyticsTab } from "@/components/admin/BehavioralAnalyticsTab";
import { SystemPromptsTab } from "@/components/admin/SystemPromptsTab";
import { QuestionnaireEditorTab } from "@/components/admin/QuestionnaireEditorTab";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [computingId, setComputingId] = useState<string | null>(null);
  const [generatingItinerary, setGeneratingItinerary] = useState<string | null>(null);
  const [selectedItinerary, setSelectedItinerary] = useState<any>(null);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [generatingGroupItinerary, setGeneratingGroupItinerary] = useState<string | null>(null);
  const [expandedTraveler, setExpandedTraveler] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState("");
  const [registering, setRegistering] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  // Check if current user has admin role
  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setAuthChecking(false);
          return;
        }
        // Use RPC to check admin role (has_role is security definer)
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin'
        });
        if (!error && data === true) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Error checking admin role:', err);
      } finally {
        setAuthChecking(false);
      }
    };
    checkAdminRole();
  }, []);

  const loadAnalytics = async () => {
    try {
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

      const starts = allEvents.filter((e) => e.event_type === "started").length;
      const completions = allEvents.filter((e) => e.event_type === "completed").length;
      const completionRate = starts > 0 ? (completions / starts) * 100 : 0;

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

      const respondent = respondents.find(r => r.id === respondentId);
      
      setSelectedItinerary({
        itinerary: data.itinerary,
        itineraryId: data.itinerary_id,
        respondentId: respondentId,
        respondentName: respondent?.name || 'Traveler'
      });
      setShowItineraryModal(true);

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

  const exportToCSV = (startDate?: string, endDate?: string) => {
    if (!analytics) return;
    let eventsToExport = analytics.recentSessions;
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

  useEffect(() => {
    if (isAuthenticated) {
      loadAnalytics();
      loadVariants();
      loadRespondents();
      loadGroups();
      const channel = supabase
        .channel("analytics-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "questionnaire_analytics" },
          () => { loadAnalytics(); }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "respondents" },
          () => { loadRespondents(); }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [isAuthenticated]);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Checking access...</p>
      </div>
    );
  }




  const handleAdminRegister = async () => {
    if (!secretKey.trim() || !adminName.trim() || !adminEmail.trim()) return;
    setRegistering(true);
    try {
      const { data, error } = await supabase.functions.invoke("register-admin", {
        body: { secret_key: secretKey, admin_name: adminName, admin_email: adminEmail },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Success!", description: data.message || "Admin role granted." });
      setIsAuthenticated(true);
      setSecretKey("");
      setAdminName("");
      setAdminEmail("");
    } catch (err: any) {
      toast({ title: "Access Denied", description: err.message || "Invalid secret key", variant: "destructive" });
    } finally {
      setRegistering(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Admin Access</CardTitle>
            <CardDescription>Enter your details and admin secret key to gain access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Your Name</Label>
              <Input
                id="admin-name"
                placeholder="Enter your full name"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Your Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="Enter your email address"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret-key">Admin Secret Key</Label>
              <Input
                id="secret-key"
                type="password"
                placeholder="Enter the admin secret key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdminRegister()}
              />
              <p className="text-xs text-muted-foreground">
                This key is provided to authorized administrators only.
              </p>
            </div>
            <Button onClick={handleAdminRegister} className="w-full" disabled={registering || !secretKey.trim() || !adminName.trim() || !adminEmail.trim()}>
              {registering ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
              Register as Admin
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
            </div>
            <Button variant="outline" onClick={() => navigate("/auth")} className="w-full">
              Sign In to Different Account
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")} className="w-full">
              Go Home
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
            <div className="flex items-center gap-3">
              <Fingerprint className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-heading font-bold mb-1">Erranza Panel</h1>
                <p className="text-muted-foreground">Admin management &amp; analytics</p>
              </div>
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

        {/* Admin Trip Phase Navigation */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Trip Management</h3>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/trips")}>
                <MapPin className="h-4 w-4 mr-2" />
                View All Trips
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => {
                // Navigate to most recently updated trip with in_progress status
                supabase.from("trips").select("id").eq("status", "in_progress").order("updated_at", { ascending: false }).limit(1).then(({ data }) => {
                  if (data?.[0]) navigate(`/trips/${data[0].id}`);
                  else {
                    // Fall back to any trip
                    supabase.from("trips").select("id").order("updated_at", { ascending: false }).limit(1).then(({ data: anyTrip }) => {
                      if (anyTrip?.[0]) navigate(`/trips/${anyTrip[0].id}`);
                      else toast({ title: "No trips found", description: "No trips exist yet.", variant: "destructive" });
                    });
                  }
                });
              }}>
                <Clock className="h-4 w-4 mr-2" />
                In-Trip View
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => {
                supabase.from("trips").select("id").eq("status", "completed").order("updated_at", { ascending: false }).limit(1).then(({ data }) => {
                  if (data?.[0]) navigate(`/trips/${data[0].id}`);
                  else {
                    supabase.from("trips").select("id").order("updated_at", { ascending: false }).limit(1).then(({ data: anyTrip }) => {
                      if (anyTrip?.[0]) navigate(`/trips/${anyTrip[0].id}`);
                      else toast({ title: "No trips found", variant: "destructive" });
                    });
                  }
                });
              }}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Post-Trip View
              </Button>
            </div>
          </CardContent>
        </Card>

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
                      : 0}m
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="travelers" className="space-y-4">
              <TabsList className="grid w-full grid-cols-7 h-auto p-1">
                <TabsTrigger value="travelers">Travelers</TabsTrigger>
                <TabsTrigger value="groups">Groups</TabsTrigger>
                <TabsTrigger value="destinations">Destinations</TabsTrigger>
                <TabsTrigger value="support" className="gap-1"><HeadphonesIcon className="h-3.5 w-3.5" /> Support</TabsTrigger>
                <TabsTrigger value="algorithm" className="gap-1"><Brain className="h-3.5 w-3.5" /> Algorithm</TabsTrigger>
                <TabsTrigger value="analytics" className="gap-1"><BarChart3 className="h-3.5 w-3.5" /> Analytics</TabsTrigger>
                <TabsTrigger value="admins" className="gap-1"><Shield className="h-3.5 w-3.5" /> Admins</TabsTrigger>
              </TabsList>

              {/* TRAVELERS TAB */}
              <TabsContent value="travelers">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Travelers
                    </CardTitle>
                    <CardDescription>
                      CRM view of all travelers — profiles, SoulPrints, itineraries, and documents
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-3">
                        {respondents.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">
                            No travelers yet
                          </p>
                        ) : (
                          respondents.map((respondent) => {
                            const itineraries = Array.isArray(respondent.itineraries) ? respondent.itineraries : [];
                            const itinerary = itineraries[0];
                            const hasComputed = respondent.computed_scores?.length > 0;
                            
                            return (
                              <button
                                key={respondent.id}
                                onClick={() => navigate(`/admin/traveler/${respondent.id}`)}
                                className="w-full rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left"
                              >
                                <div className="p-4 flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                      <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="font-semibold truncate">{respondent.name}</p>
                                        {hasComputed && <Fingerprint className="h-4 w-4 text-primary shrink-0" />}
                                      </div>
                                      <p className="text-sm text-muted-foreground truncate">{respondent.email}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    {hasComputed && (
                                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                                        SoulPrint ✓
                                      </Badge>
                                    )}
                                    {itinerary && (
                                      <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                                        Itinerary ✓
                                      </Badge>
                                    )}
                                    {!hasComputed && (
                                      <Badge variant="secondary" className="text-xs">Pending</Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(respondent.created_at).toLocaleDateString()}
                                    </span>
                                    <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* GROUPS TAB */}
              <TabsContent value="groups">
                <Card>
                  <CardHeader>
                    <CardTitle>Travel Groups</CardTitle>
                    <CardDescription>Manage group travel arrangements and generate group itineraries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-4">
                        {groups.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">No travel groups created yet</p>
                        ) : (
                          groups.map((group) => {
                            const members = group.group_members || [];
                            const allMembersComplete = members.every((m: any) => 
                              m.respondents?.computed_scores?.length > 0
                            );
                            const hasGroupItinerary = group.group_itineraries?.length > 0;

                            return (
                              <div key={group.id} className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold">{group.name}</p>
                                      <Badge variant="outline">Join Code: {group.join_code}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Created {new Date(group.created_at).toLocaleDateString()}
                                    </p>
                                    <p className="text-sm mt-2">{members.length} {members.length === 1 ? 'member' : 'members'}</p>
                                    {allMembersComplete && <p className="text-xs text-green-500 mt-1">✓ All members completed SoulPrints</p>}
                                    {hasGroupItinerary && <p className="text-xs text-primary mt-1">✓ Group Itinerary Created</p>}
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {allMembersComplete && !hasGroupItinerary && (
                                      <Button
                                        size="sm"
                                        onClick={() => generateGroupItinerary(group.id)}
                                        disabled={generatingGroupItinerary === group.id}
                                      >
                                        <MapPin className="h-4 w-4 mr-1" />
                                        {generatingGroupItinerary === group.id ? "Generating..." : "Generate Group Itinerary"}
                                      </Button>
                                    )}
                                    {!allMembersComplete && (
                                      <Badge variant="secondary" className="text-xs">Waiting for all members</Badge>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground">Group Members:</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {members.map((member: any) => (
                                      <div key={member.id} className="p-2 rounded border border-border bg-card text-xs">
                                        <p className="font-medium">{member.respondents?.name || 'Unknown'}</p>
                                        <p className="text-muted-foreground">{member.respondents?.email || 'No email'}</p>
                                        {member.respondents?.computed_scores?.length > 0 ? (
                                          <Badge variant="outline" className="mt-1 text-xs">✓ Completed</Badge>
                                        ) : (
                                          <Badge variant="secondary" className="mt-1 text-xs">Pending</Badge>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {hasGroupItinerary && (
                                  <div className="pt-2 border-t">
                                    <p className="text-xs text-muted-foreground">
                                      Group itinerary created on {new Date(group.group_itineraries[0].created_at).toLocaleDateString()}
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

              <TabsContent value="destinations">
                <div className="space-y-6">
                  <DestinationsTab />
                  <MatchTestPanel respondents={respondents} />
                </div>
              </TabsContent>

              <TabsContent value="support">
                <AdminSupportTab />
              </TabsContent>

              <TabsContent value="algorithm">
                <Tabs defaultValue="performance" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3 h-auto p-1">
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="prompts">System Prompts</TabsTrigger>
                    <TabsTrigger value="questionnaire">Questionnaire</TabsTrigger>
                  </TabsList>
                  <TabsContent value="performance">
                    <AlgorithmPerformanceTab />
                  </TabsContent>
                  <TabsContent value="prompts">
                    <SystemPromptsTab />
                  </TabsContent>
                  <TabsContent value="questionnaire">
                    <QuestionnaireEditorTab />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="analytics">
                <BehavioralAnalyticsTab />
              </TabsContent>

              <TabsContent value="admins">
                <div className="space-y-6">
                  <AdminNotifications />
                  <AdminsTab />
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* SoulPrint Visualization Modal */}
        <Dialog open={showSoulPrintModal} onOpenChange={setShowSoulPrintModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedSoulPrint?.respondent.name}'s SoulPrint</DialogTitle>
              <DialogDescription>Complete psychological and travel profile with AI-generated insights</DialogDescription>
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
              <DialogTitle>{selectedItinerary?.respondentName}'s Personalized Itinerary</DialogTitle>
              <DialogDescription>Personalized psychologically-aligned journey</DialogDescription>
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
