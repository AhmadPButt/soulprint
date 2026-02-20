import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, LogOut, Users, Copy, Plane, Compass, Home, UserCircle, Fingerprint, BadgeCheck, MapPin, Sparkles, Briefcase, GitCompare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import erranzaLogo from "@/assets/erranza-logo.png";
import ItineraryDisplay from "@/components/user/ItineraryDisplay";
import SoulPrintVisualization from "@/components/admin/SoulPrintVisualization";
import { ItineraryDiscussionForum } from "@/components/discussion/ItineraryDiscussionForum";
import { MoodLogger } from "@/components/trip/MoodLogger";
import { EmotionalFluctuationGraph } from "@/components/trip/EmotionalFluctuationGraph";
import { MoodInsights } from "@/components/trip/MoodInsights";
import { TripReflection } from "@/components/trip/TripReflection";
import SoulPrintCard from "@/components/dashboard/SoulPrintCard";
import DestinationMatchCard from "@/components/dashboard/DestinationMatchCard";
import { calculateAllTraits } from "@/lib/soulprint-traits";
import { DocumentsSection } from "@/components/trip/DocumentsSection";
import { DestinationInfoSection } from "@/components/trip/DestinationInfoSection";
import { BookingsSection } from "@/components/trip/BookingsSection";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface RespondentData {
  id: string;
  name: string;
  email: string;
  raw_responses: any;
  travel_companion?: string;
  avatar_url?: string;
}

interface ComputedScores {
  [key: string]: any;
}

interface NarrativeInsights {
  headline?: string;
  tagline?: string;
  soulprint_summary?: string;
  traveler_archetype?: string;
  journey_recommendations?: string;
  growth_edges?: string;
  guide_briefing?: string;
  group_compatibility_notes?: string;
}

interface Itinerary {
  id: string;
  itinerary_data: any;
}

interface Group {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
}

interface GroupMember {
  id: string;
  respondent_id: string;
  respondents: {
    name: string;
    email: string;
  };
}

interface ActiveTrip {
  id: string;
  trip_name: string;
  status: string;
  destination_id: string | null;
  respondent_id: string | null;
  itinerary_id: string | null;
  destination?: { id: string; name: string; country: string } | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [respondent, setRespondent] = useState<RespondentData | null>(null);
  const [computed, setComputed] = useState<ComputedScores | null>(null);
  const [narrative, setNarrative] = useState<NarrativeInsights | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupItinerary, setGroupItinerary] = useState<any>(null);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [joinGroupOpen, setJoinGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [destinationMatches, setDestinationMatches] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<string>("home");
  const [userId, setUserId] = useState<string>("");

  // Active trips for in-trip / post-trip views
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [completedTrip, setCompletedTrip] = useState<ActiveTrip | null>(null);
  const [tripBookings, setTripBookings] = useState<any[]>([]);
  const [tripDocuments, setTripDocuments] = useState<any[]>([]);

  // Admin mode: ?admin=true query param unlocks all sections
  const isAdminMode = searchParams.get("admin") === "true";

  // Determine access based on actual trip status or admin mode
  const canAccessInTrip = isAdminMode || !!activeTrip;
  const canAccessPostTrip = isAdminMode || !!completedTrip;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        sessionStorage.setItem('pending_redirect', '/dashboard');
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);
      await loadUserData(session.user.id);
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/auth");
    }
  };

  const loadUserData = async (uid: string) => {
    try {
      const { data: respondentData, error: respondentError } = await supabase
        .from("respondents")
        .select("*")
        .eq("user_id", uid)
        .single();

      if (respondentError && respondentError.code !== 'PGRST116') throw respondentError;
      if (!respondentData) {
        setLoading(false);
        return;
      }

      setRespondent(respondentData);

      // Load all data in parallel
      const [computedRes, narrativeRes, itineraryRes, memberRes, matchesRes, tripsRes] = await Promise.all([
        supabase.from("computed_scores").select("*").eq("respondent_id", respondentData.id).single(),
        supabase.from("narrative_insights").select("*").eq("respondent_id", respondentData.id).single(),
        supabase.from("itineraries").select("*").eq("respondent_id", respondentData.id).single(),
        supabase.from("group_members").select("group_id").eq("respondent_id", respondentData.id).single(),
        supabase.from("destination_matches").select(`*, destination:echoprint_destinations(*)`).eq("respondent_id", respondentData.id).order("rank", { ascending: true }).limit(3),
        supabase.from("trips").select("*, destination:echoprint_destinations(id, name, country)").eq("created_by", uid).order("updated_at", { ascending: false }),
      ]);

      setComputed(computedRes.data);
      setNarrative(narrativeRes.data);
      setItinerary(itineraryRes.data);
      setDestinationMatches(matchesRes.data || []);

      // Find active (in_progress) and completed trips
      const allTrips = tripsRes.data || [];
      const inProgressTrip = allTrips.find((t: any) => t.status === "in_progress");
      const completedTrips = allTrips.find((t: any) => t.status === "completed");
      
      if (inProgressTrip) {
        setActiveTrip(inProgressTrip);
        // Load trip utilities data
        const [bookingsRes, docsRes] = await Promise.all([
          supabase.from("trip_bookings").select("*").eq("trip_id", inProgressTrip.id).order("booking_date"),
          supabase.from("trip_documents").select("*").eq("trip_id", inProgressTrip.id).order("uploaded_at", { ascending: false }),
        ]);
        setTripBookings(bookingsRes.data || []);
        setTripDocuments(docsRes.data || []);
      }
      if (completedTrips) {
        setCompletedTrip(completedTrips);
      }

      // Load group data
      if (memberRes.data) {
        const [groupRes, membersRes, groupItinRes] = await Promise.all([
          supabase.from("groups").select("*").eq("id", memberRes.data.group_id).single(),
          supabase.from("group_members").select(`id, respondent_id, respondents (name, email)`).eq("group_id", memberRes.data.group_id),
          supabase.from("group_itineraries").select("*").eq("group_id", memberRes.data.group_id).single(),
        ]);
        setGroup(groupRes.data);
        setGroupMembers(membersRes.data || []);
        setGroupItinerary(groupItinRes.data);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const reloadTripData = async () => {
    if (activeTrip) {
      const [bookingsRes, docsRes] = await Promise.all([
        supabase.from("trip_bookings").select("*").eq("trip_id", activeTrip.id).order("booking_date"),
        supabase.from("trip_documents").select("*").eq("trip_id", activeTrip.id).order("uploaded_at", { ascending: false }),
      ]);
      setTripBookings(bookingsRes.data || []);
      setTripDocuments(docsRes.data || []);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !respondent) return;

    try {
      const code = await generateJoinCode();
      
      const { data: newGroup, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: groupName,
          join_code: code,
          creator_id: respondent.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: newGroup.id,
          respondent_id: respondent.id
        });

      if (memberError) throw memberError;

      setGroup(newGroup);
      setGroupName("");
      setCreateGroupOpen(false);
      toast.success("Group created! Share the join code with your travel companions.");
      
      if (userId) await loadUserData(userId);
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group");
    }
  };

  const generateJoinCode = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_join_code');
    if (error) throw error;
    return data;
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim() || !respondent) return;

    try {
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("join_code", joinCode.toUpperCase())
        .single();

      if (groupError) throw new Error("Invalid join code");

      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: groupData.id,
          respondent_id: respondent.id
        });

      if (memberError) {
        if (memberError.code === "23505") {
          toast.error("You are already a member of this group");
        } else {
          throw memberError;
        }
        return;
      }

      setJoinCode("");
      setJoinGroupOpen(false);
      toast.success("Successfully joined the group!");
      
      if (userId) await loadUserData(userId);
    } catch (error) {
      console.error("Error joining group:", error);
      toast.error("Failed to join group. Please check the code and try again.");
    }
  };

  const copyJoinCode = () => {
    if (group) {
      navigator.clipboard.writeText(group.join_code);
      toast.success("Join code copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const showGroupSection = respondent?.raw_responses?.travel_companion === "friends" || 
                          respondent?.raw_responses?.travel_companion === "group";

  const currentTripForView = currentView === "in-trip" ? activeTrip : completedTrip;

  const DashboardSidebar = () => (
    <Sidebar className="border-r border-border bg-card">
      <SidebarContent>
        <div className="p-5 border-b border-border flex items-center">
          <img src={erranzaLogo} alt="Erranza" className="h-8 w-auto object-contain" />
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold tracking-widest uppercase text-muted-foreground px-4 pt-4 pb-1">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 space-y-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setCurrentView("home")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    currentView === "home"
                      ? "bg-brand-lavender-haze text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Home className="mr-2 h-4 w-4 shrink-0" />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate("/trips")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    currentView === "trips"
                      ? "bg-brand-lavender-haze text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Briefcase className="mr-2 h-4 w-4 shrink-0" />
                  <span>Trips</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {activeTrip && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold tracking-widest uppercase text-muted-foreground px-4 pt-4 pb-1">
              Active Trip
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-4 py-3 mx-2 rounded-xl bg-brand-lavender-haze/50 border border-primary/10 space-y-1">
                <p className="text-sm font-semibold text-foreground truncate">{activeTrip.trip_name}</p>
                {activeTrip.destination && (
                  <p className="text-xs text-muted-foreground">{activeTrip.destination.name}, {activeTrip.destination.country}</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs h-7 border-primary/20"
                  onClick={() => navigate(`/trips/${activeTrip.id}`)}
                >
                  View Trip
                </Button>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isAdminMode && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-4 py-2 mx-2 rounded-xl bg-brand-lavender-haze border border-primary/20">
                <p className="text-xs text-primary font-semibold">Admin View Active</p>
                <p className="text-xs text-muted-foreground mt-0.5">All sections unlocked.</p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Cover Photo Section */}
          <div className="relative">
            <div className="h-44 bg-gradient-to-r from-brand-lavender-haze via-accent to-brand-warm-stone relative overflow-hidden border-b border-border">
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: "radial-gradient(circle at 20% 50%, hsl(255 47% 80% / 0.4) 0%, transparent 60%), radial-gradient(circle at 80% 20%, hsl(40 30% 80% / 0.3) 0%, transparent 50%)"
              }} />
              <SidebarTrigger className="absolute top-4 left-4 bg-card/80 backdrop-blur border border-border shadow-sm" />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button variant="outline" onClick={() => navigate('/profile')} className="bg-card/80 backdrop-blur border-border shadow-sm text-foreground hover:bg-card">
                  <UserCircle className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button variant="outline" onClick={handleSignOut} className="bg-card/80 backdrop-blur border-border shadow-sm text-foreground hover:bg-card">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
            
            <div className="container mx-auto px-8">
              <div className="relative -mt-14 mb-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-28 w-28 border-4 border-card shadow-lg">
                    <AvatarImage src={respondent?.avatar_url} alt={respondent?.name} />
                    <AvatarFallback className="bg-brand-lavender-haze text-primary text-3xl font-bold">
                      {respondent?.name?.charAt(0)?.toUpperCase() || 'T'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="mt-4 flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-foreground">{respondent?.name || 'Traveler'}</h1>
                    <BadgeCheck className="h-6 w-6 text-primary" />
                  </div>
                  
                  <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                    <span className="text-sm">Hello, {respondent?.name?.split(' ')[0] || 'Traveler'}</span>
                    <Fingerprint className="h-4 w-4 text-primary/60" />
                  </div>

                  {isAdminMode && (
                    <div className="mt-2">
                      <span className="text-xs bg-brand-lavender-haze text-primary px-2.5 py-1 rounded-full border border-primary/20 font-medium">Admin View Active</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <main className="flex-1 container mx-auto px-4 py-8 overflow-y-auto">
            {/* HOME VIEW */}
            {currentView === "home" && (
              <div className="space-y-8">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold mb-2">Your SoulPrint</h2>
                  <p className="text-muted-foreground">Your travel personality profile and matched destinations</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    {respondent?.raw_responses ? (
                      <SoulPrintCard
                        traits={calculateAllTraits(respondent.raw_responses, computed)}
                        computed={computed}
                        narrative={narrative}
                      />
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle>SoulPrint Not Yet Computed</CardTitle>
                          <CardDescription>
                            Complete your questionnaire to see your travel personality profile.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button onClick={() => navigate('/questionnaire')}>
                            <Fingerprint className="h-4 w-4 mr-2" />
                            Take the Questionnaire
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-bold">Your Matched Destinations</h3>
                      {destinationMatches.length >= 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-auto gap-1.5"
                          onClick={() => navigate(`/compare?destinations=${destinationMatches.map(m => m.destination.id).join(",")}`)}
                        >
                          <GitCompare className="h-3.5 w-3.5" /> Compare
                        </Button>
                      )}
                    </div>

                    {destinationMatches.length > 0 ? (
                      <div className="space-y-4">
                        {destinationMatches.map((match, i) => (
                          <DestinationMatchCard key={match.id} match={match} index={i} />
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="p-6 text-center text-muted-foreground">
                          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p>No matches yet. Complete your SoulPrint to discover your ideal destinations.</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Complete SoulPrint Journey */}
                {computed && narrative && respondent && (
                  <div className="mt-8">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Fingerprint className="h-5 w-5 text-primary" />
                      Your Complete SoulPrint Journey
                    </h3>
                    <SoulPrintVisualization
                      computed={computed}
                      narrative={narrative}
                      respondentId={respondent.id}
                    />
                  </div>
                )}

                {/* Group Section */}
                {showGroupSection && (
                  <div className="mt-8 space-y-4">
                    <h3 className="text-xl font-bold">Travel Group</h3>
                    {group ? (
                      <Card>
                        <CardHeader>
                          <CardTitle>{group.name}</CardTitle>
                          <CardDescription>
                            <span className="flex items-center gap-2">
                              Join Code: <code className="bg-muted px-2 py-1 rounded font-mono">{group.join_code}</code>
                              <Button variant="ghost" size="sm" onClick={copyJoinCode}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {groupMembers.map((member) => (
                              <div key={member.id} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{member.respondents?.name}</span>
                                <span className="text-xs text-muted-foreground">{member.respondents?.email}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="flex gap-4">
                        <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
                          <DialogTrigger asChild>
                            <Button><Users className="h-4 w-4 mr-2" />Create Group</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create Travel Group</DialogTitle>
                              <DialogDescription>Start a new group and invite your companions</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Group Name</Label>
                                <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g., Summer Adventure" />
                              </div>
                              <Button onClick={handleCreateGroup}>Create Group</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Dialog open={joinGroupOpen} onOpenChange={setJoinGroupOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline">Join Group</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Join a Travel Group</DialogTitle>
                              <DialogDescription>Enter the join code from your group organizer</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Join Code</Label>
                                <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Enter code" />
                              </div>
                              <Button onClick={handleJoinGroup}>Join Group</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* IN-TRIP VIEW */}
            {currentView === "in-trip" && canAccessInTrip && respondent && (
              <div className="space-y-8">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold mb-2">In-Trip Experience</h2>
                  <p className="text-muted-foreground">Track your journey, log moods, and access trip utilities</p>
                  {activeTrip && !isAdminMode && (
                    <Badge className="mt-2 bg-amber-50 text-amber-700 border-amber-200 border">
                      {activeTrip.trip_name}
                    </Badge>
                  )}
                  {isAdminMode && !activeTrip && (
                    <Badge className="mt-2 bg-brand-lavender-haze text-primary border border-primary/20">Admin Preview Mode — No active trip</Badge>
                  )}
                </div>

                <Tabs defaultValue="mood" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="mood">Mood Tracking</TabsTrigger>
                    <TabsTrigger value="utilities">Utilities</TabsTrigger>
                  </TabsList>

                  <TabsContent value="mood" className="space-y-6">
                    <MoodLogger
                      respondentId={respondent.id}
                      tripId={activeTrip?.id}
                      destinationName={activeTrip?.destination?.name}
                    />
                    <EmotionalFluctuationGraph respondentId={respondent.id} />
                    <MoodInsights respondentId={respondent.id} />
                  </TabsContent>

                  <TabsContent value="utilities" className="space-y-6">
                    {activeTrip ? (
                      <>
                        <BookingsSection tripId={activeTrip.id} bookings={tripBookings} onReload={reloadTripData} />
                        <DocumentsSection tripId={activeTrip.id} documents={tripDocuments} userId={userId} onReload={reloadTripData} />
                        {activeTrip.destination && (
                          <DestinationInfoSection destinationId={activeTrip.destination.id} destinationName={activeTrip.destination.name} />
                        )}
                      </>
                    ) : (
                      <Card className="p-8 text-center">
                        <p className="text-muted-foreground">No active trip. Start a trip from the My Trips page to access utilities.</p>
                        <Button variant="outline" className="mt-4" onClick={() => navigate("/trips")}>
                          <Briefcase className="h-4 w-4 mr-2" /> Go to My Trips
                        </Button>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="discussion" className="space-y-6">
                    {itinerary && <ItineraryDiscussionForum itineraryId={itinerary.id} itineraryData={itinerary.itinerary_data} />}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* POST-TRIP VIEW */}
            {currentView === "post-trip" && canAccessPostTrip && respondent && (
              <div className="space-y-8">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold mb-2">Post-Trip Reflection</h2>
                  <p className="text-muted-foreground">Reflect on your journey and share your experience</p>
                  {completedTrip && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge className="bg-muted text-muted-foreground border-border">
                        {completedTrip.trip_name}
                      </Badge>
                      {completedTrip.destination && (
                        <span className="text-sm text-muted-foreground">
                          {completedTrip.destination.name}, {completedTrip.destination.country}
                        </span>
                      )}
                    </div>
                  )}
                  {isAdminMode && !completedTrip && (
                    <Badge className="mt-2 bg-primary/20 text-primary border-primary/30">Admin Preview Mode — No completed trip</Badge>
                  )}
                </div>

                <TripReflection
                  respondentId={respondent.id}
                  tripId={completedTrip?.id}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
