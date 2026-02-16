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
import { Loader2, LogOut, Users, Copy, Plane, Compass, Home, UserCircle, Fingerprint, BadgeCheck, MapPin, Sparkles, Briefcase, Lock, GitCompare, Heart } from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";

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
  const [currentView, setCurrentView] = useState<string>("pre-trip");

  // Admin mode: ?admin=true query param unlocks all sections
  const isAdminMode = searchParams.get("admin") === "true";

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

      await loadUserData(session.user.id);
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/auth");
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      const { data: respondentData, error: respondentError } = await supabase
        .from("respondents")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (respondentError && respondentError.code !== 'PGRST116') throw respondentError;
      if (!respondentData) {
        setLoading(false);
        return;
      }

      setRespondent(respondentData);

      const { data: computedData } = await supabase
        .from("computed_scores")
        .select("*")
        .eq("respondent_id", respondentData.id)
        .single();

      setComputed(computedData);

      const { data: narrativeData } = await supabase
        .from("narrative_insights")
        .select("*")
        .eq("respondent_id", respondentData.id)
        .single();

      setNarrative(narrativeData);

      const { data: itineraryData } = await supabase
        .from("itineraries")
        .select("*")
        .eq("respondent_id", respondentData.id)
        .single();

      setItinerary(itineraryData);

      const { data: memberData } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("respondent_id", respondentData.id)
        .single();

      if (memberData) {
        const { data: groupData } = await supabase
          .from("groups")
          .select("*")
          .eq("id", memberData.group_id)
          .single();

        setGroup(groupData);

        const { data: membersData } = await supabase
          .from("group_members")
          .select(`id, respondent_id, respondents (name, email)`)
          .eq("group_id", memberData.group_id);

        setGroupMembers(membersData || []);

        const { data: groupItinData } = await supabase
          .from("group_itineraries")
          .select("*")
          .eq("group_id", memberData.group_id)
          .single();

        setGroupItinerary(groupItinData);
      }

      const { data: matchesData } = await supabase
        .from("destination_matches")
        .select(`*, destination:echoprint_destinations(*)`)
        .eq("respondent_id", respondentData.id)
        .order("rank", { ascending: true })
        .limit(3);

      setDestinationMatches(matchesData || []);
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
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
      
      if (respondent.id) {
        await loadUserData((await supabase.auth.getSession()).data.session!.user.id);
      }
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
      
      if (respondent.id) {
        await loadUserData((await supabase.auth.getSession()).data.session!.user.id);
      }
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

  // In-trip and post-trip are locked unless admin mode
  const canAccessInTrip = isAdminMode;
  const canAccessPostTrip = isAdminMode;

  const DashboardSidebar = () => (
    <Sidebar className="border-r">
      <SidebarContent>
        <div className="p-4 border-b flex items-center justify-center">
          <img src={erranzaLogo} alt="Erranza" className="h-10 w-auto object-contain" />
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Trip Status</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setCurrentView("pre-trip")}
                  className={currentView === "pre-trip" ? "bg-muted text-primary font-medium" : ""}
                >
                  <Plane className="mr-2 h-4 w-4" />
                  <span>Pre-Trip</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => canAccessInTrip && setCurrentView("in-trip")}
                  className={currentView === "in-trip" ? "bg-muted text-primary font-medium" : !canAccessInTrip ? "opacity-50 cursor-not-allowed" : ""}
                  disabled={!canAccessInTrip}
                >
                  <Compass className="mr-2 h-4 w-4" />
                  <span>In-Trip {!canAccessInTrip && "🔒"}</span>
                  {isAdminMode && <Badge className="ml-auto text-[10px] px-1 py-0 bg-primary/20 text-primary border-primary/30">Admin</Badge>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => canAccessPostTrip && setCurrentView("post-trip")}
                  className={currentView === "post-trip" ? "bg-muted text-primary font-medium" : !canAccessPostTrip ? "opacity-50 cursor-not-allowed" : ""}
                  disabled={!canAccessPostTrip}
                >
                  <Home className="mr-2 h-4 w-4" />
                  <span>Post-Trip {!canAccessPostTrip && "🔒"}</span>
                  {isAdminMode && <Badge className="ml-auto text-[10px] px-1 py-0 bg-primary/20 text-primary border-primary/30">Admin</Badge>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate("/trips")}>
                  <Briefcase className="mr-2 h-4 w-4" />
                  <span>My Trips</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdminMode && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin Mode</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-3 py-2">
                <p className="text-xs text-muted-foreground">All sections unlocked for admin viewing and editing.</p>
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
            <div className="h-48 bg-gradient-to-r from-primary via-secondary to-accent relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2LTJoMnYyem0tNiAwaDJ2LTJoLTJ2MnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
              <SidebarTrigger className="absolute top-4 left-4 bg-background/80 backdrop-blur" />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button variant="outline" onClick={() => navigate('/profile')} className="bg-background/80 backdrop-blur">
                  <UserCircle className="h-4 w-4 mr-2" />
                  Profile Settings
                </Button>
                <Button variant="outline" onClick={handleSignOut} className="bg-background/80 backdrop-blur">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
            
            <div className="container mx-auto px-4">
              <div className="relative -mt-16 mb-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                    <AvatarImage src={respondent?.avatar_url} alt={respondent?.name} />
                    <AvatarFallback className="bg-primary text-white text-3xl font-bold">
                      {respondent?.name?.charAt(0)?.toUpperCase() || 'T'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="mt-4 flex items-center gap-2">
                    <h1 className="text-3xl font-bold">{respondent?.name || 'Traveler'}</h1>
                    <BadgeCheck className="h-7 w-7 text-primary fill-primary/20" />
                  </div>
                  
                  <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                    <span className="text-lg">Hello, {respondent?.name?.split(' ')[0] || 'Traveler'}</span>
                    <Fingerprint className="h-5 w-5 text-primary" />
                  </div>

                  {isAdminMode && (
                    <div className="mt-2">
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">Admin View Active</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <main className="flex-1 container mx-auto px-4 py-8 overflow-y-auto">
            {/* PRE-TRIP VIEW */}
            {currentView === "pre-trip" && (
              <div className="space-y-8">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold mb-2">Pre-Trip Preparation</h2>
                  <p className="text-muted-foreground">Review your SoulPrint, matched destinations, and group details</p>
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

                {/* Itinerary */}
                {itinerary && (
                  <div className="mt-8">
                    <ItineraryDisplay itinerary={itinerary.itinerary_data} />
                    <div className="mt-4">
                      <ItineraryDiscussionForum itineraryId={itinerary.id} itineraryData={itinerary.itinerary_data} />
                    </div>
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
                  {isAdminMode && <Badge className="mt-2 bg-primary/20 text-primary border-primary/30">Admin Preview Mode</Badge>}
                </div>

                <Tabs defaultValue="mood" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="mood">Mood Tracking</TabsTrigger>
                    <TabsTrigger value="utilities">Utilities</TabsTrigger>
                    <TabsTrigger value="discussion">Discussion</TabsTrigger>
                  </TabsList>

                  <TabsContent value="mood" className="space-y-6">
                    <MoodLogger respondentId={respondent.id} />
                    <EmotionalFluctuationGraph respondentId={respondent.id} />
                    <MoodInsights respondentId={respondent.id} />
                  </TabsContent>

                  <TabsContent value="utilities" className="space-y-6">
                    <DocumentsSection tripId="" documents={[]} userId="" onReload={() => {}} />
                    <DestinationInfoSection destinationId="" destinationName="" />
                    <BookingsSection tripId="" bookings={[]} onReload={() => {}} />
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
                  {isAdminMode && <Badge className="mt-2 bg-primary/20 text-primary border-primary/30">Admin Preview Mode</Badge>}
                </div>

                <TripReflection respondentId={respondent.id} />
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
