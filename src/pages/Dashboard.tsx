import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, LogOut, Users, Copy, Plane, Compass, Home } from "lucide-react";
import ItineraryDisplay from "@/components/user/ItineraryDisplay";
import SoulPrintVisualization from "@/components/admin/SoulPrintVisualization";
import { ItineraryDiscussionForum } from "@/components/discussion/ItineraryDiscussionForum";
import { MoodLogger } from "@/components/trip/MoodLogger";
import { EmotionalFluctuationGraph } from "@/components/trip/EmotionalFluctuationGraph";
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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
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
      // Get respondent data
      const { data: respondentData, error: respondentError } = await supabase
        .from("respondents")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (respondentError) throw respondentError;
      if (!respondentData) {
        toast.error("Please complete the questionnaire first");
        navigate("/questionnaire");
        return;
      }

      setRespondent(respondentData);

      // Get computed scores
      const { data: computedData } = await supabase
        .from("computed_scores")
        .select("*")
        .eq("respondent_id", respondentData.id)
        .single();

      setComputed(computedData);

      // Get narrative insights
      const { data: narrativeData } = await supabase
        .from("narrative_insights")
        .select("*")
        .eq("respondent_id", respondentData.id)
        .single();

      setNarrative(narrativeData);

      // Get itinerary
      const { data: itineraryData } = await supabase
        .from("itineraries")
        .select("*")
        .eq("respondent_id", respondentData.id)
        .single();

      setItinerary(itineraryData);

      // Check if user is part of a group
      const { data: memberData } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("respondent_id", respondentData.id)
        .single();

      if (memberData) {
        // Load group data
        const { data: groupData } = await supabase
          .from("groups")
          .select("*")
          .eq("id", memberData.group_id)
          .single();

        setGroup(groupData);

        // Load group members
        const { data: membersData } = await supabase
          .from("group_members")
          .select(`
            id,
            respondent_id,
            respondents (name, email)
          `)
          .eq("group_id", memberData.group_id);

        setGroupMembers(membersData || []);

        // Load group itinerary
        const { data: groupItinData } = await supabase
          .from("group_itineraries")
          .select("*")
          .eq("group_id", memberData.group_id)
          .single();

        setGroupItinerary(groupItinData);
      }
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

      // Add creator as member
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
      
      // Reload data
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
      // Find group by join code
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("join_code", joinCode.toUpperCase())
        .single();

      if (groupError) throw new Error("Invalid join code");

      // Add user to group
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
      
      // Reload data
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

  const [currentView, setCurrentView] = useState<string>("pre-trip");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const showGroupSection = respondent?.raw_responses?.travel_companion === "friends" || 
                          respondent?.raw_responses?.travel_companion === "group";

  const DashboardSidebar = () => (
    <Sidebar className="border-r">
      <SidebarContent>
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg text-primary">Travel Phases</h2>
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
                  onClick={() => setCurrentView("in-trip")}
                  className={currentView === "in-trip" ? "bg-muted text-primary font-medium" : ""}
                >
                  <Compass className="mr-2 h-4 w-4" />
                  <span>In-Trip</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setCurrentView("post-trip")}
                  className={currentView === "post-trip" ? "bg-muted text-primary font-medium" : ""}
                >
                  <Home className="mr-2 h-4 w-4" />
                  <span>Post-Trip</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold text-primary">My SoulPrint Dashboard</h1>
              </div>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </header>

          <main className="flex-1 container mx-auto px-4 py-8 overflow-y-auto">
            {/* PRE-TRIP VIEW */}
            {currentView === "pre-trip" && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold mb-2">Pre-Trip Preparation</h2>
                  <p className="text-muted-foreground">Review your SoulPrint, itinerary, and group details before your journey</p>
                </div>

                <Tabs defaultValue="soulprint" className="space-y-6">
                  <TabsList className={`grid w-full ${itinerary && showGroupSection ? "grid-cols-4" : itinerary || showGroupSection ? "grid-cols-3" : "grid-cols-2"}`}>
                    <TabsTrigger value="soulprint">My SoulPrint</TabsTrigger>
                    <TabsTrigger value="itinerary">My Itinerary</TabsTrigger>
                    {itinerary && <TabsTrigger value="discussion">Discussion</TabsTrigger>}
                    {showGroupSection && <TabsTrigger value="group">Travel Group</TabsTrigger>}
                  </TabsList>

                  <TabsContent value="soulprint" className="space-y-6">
                    {computed && narrative ? (
                      <SoulPrintVisualization
                        computed={computed}
                        narrative={narrative}
                        respondentId={respondent?.id}
                      />
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle>SoulPrint Not Yet Computed</CardTitle>
                          <CardDescription>
                            Your SoulPrint analysis is being processed. Please check back soon.
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="itinerary">
                    {itinerary ? (
                      <ItineraryDisplay itinerary={itinerary.itinerary_data} />
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle>Itinerary Not Yet Created</CardTitle>
                          <CardDescription>
                            Your personalized itinerary is being created by our team. You'll be notified when it's ready.
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    )}
                  </TabsContent>

                  {itinerary && (
                    <TabsContent value="discussion" className="space-y-6">
                      <ItineraryDiscussionForum 
                        itineraryId={itinerary.id}
                        itineraryData={itinerary.itinerary_data}
                        isGroup={false}
                      />
                    </TabsContent>
                  )}

                  {showGroupSection && (
                    <TabsContent value="group" className="space-y-6">
                      {!group ? (
                        <Card>
                          <CardHeader>
                            <CardTitle>Create or Join a Travel Group</CardTitle>
                            <CardDescription>
                              Coordinate your trip with friends or family
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex gap-4">
                            <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
                              <DialogTrigger asChild>
                                <Button>
                                  <Users className="h-4 w-4 mr-2" />
                                  Create Group
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Create Travel Group</DialogTitle>
                                  <DialogDescription>
                                    Create a group and share the join code with your travel companions
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="groupName">Group Name</Label>
                                    <Input
                                      id="groupName"
                                      value={groupName}
                                      onChange={(e) => setGroupName(e.target.value)}
                                      placeholder="e.g., Azerbaijan Adventure 2025"
                                    />
                                  </div>
                                  <Button onClick={handleCreateGroup} className="w-full">
                                    Create Group
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Dialog open={joinGroupOpen} onOpenChange={setJoinGroupOpen}>
                              <DialogTrigger asChild>
                                <Button variant="outline">Join Existing Group</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Join Travel Group</DialogTitle>
                                  <DialogDescription>
                                    Enter the join code shared by your group creator
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="joinCode">Join Code</Label>
                                    <Input
                                      id="joinCode"
                                      value={joinCode}
                                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                      placeholder="Enter 8-character code"
                                      maxLength={8}
                                    />
                                  </div>
                                  <Button onClick={handleJoinGroup} className="w-full">
                                    Join Group
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-6">
                          <Card>
                            <CardHeader>
                              <CardTitle>{group.name}</CardTitle>
                              <CardDescription>
                                Share this code with your travel companions
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center gap-2">
                                <code className="bg-muted px-4 py-2 rounded text-lg font-mono">
                                  {group.join_code}
                                </code>
                                <Button variant="outline" size="icon" onClick={copyJoinCode}>
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle>Group Members</CardTitle>
                              <CardDescription>
                                {groupMembers.length} {groupMembers.length === 1 ? 'member' : 'members'}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {groupMembers.map((member) => (
                                  <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                                    <div>
                                      <p className="font-medium">{member.respondents.name}</p>
                                      <p className="text-sm text-muted-foreground">{member.respondents.email}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>

                          {groupItinerary ? (
                            <>
                              <Card>
                                <CardHeader>
                                  <CardTitle>Group Itinerary</CardTitle>
                                  <CardDescription>Your customized group travel plan</CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <ItineraryDisplay itinerary={groupItinerary.itinerary_data} />
                                </CardContent>
                              </Card>
                              
                              <ItineraryDiscussionForum 
                                groupItineraryId={groupItinerary.id}
                                itineraryData={groupItinerary.itinerary_data}
                                isGroup={true}
                              />
                            </>
                          ) : (
                            <Card>
                              <CardHeader>
                                <CardTitle>Group Itinerary Pending</CardTitle>
                                <CardDescription>
                                  Once all group members complete their SoulPrints, our team will create a customized group itinerary
                                </CardDescription>
                              </CardHeader>
                            </Card>
                          )}
                        </div>
                      )}
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            )}

            {/* IN-TRIP VIEW */}
            {currentView === "in-trip" && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold mb-2">In-Trip Experience</h2>
                  <p className="text-muted-foreground">Track your mood, explore your itinerary, and connect with your travel group</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {respondent && (
                    <>
                      <MoodLogger 
                        respondentId={respondent.id}
                        onLogComplete={() => {}}
                      />
                      <EmotionalFluctuationGraph respondentId={respondent.id} />
                    </>
                  )}
                </div>

                <Tabs defaultValue="itinerary" className="space-y-6">
                  <TabsList className={`grid w-full ${showGroupSection ? "grid-cols-4" : "grid-cols-3"}`}>
                    <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                    <TabsTrigger value="soulprint">SoulPrint</TabsTrigger>
                    <TabsTrigger value="discussion">Discussion</TabsTrigger>
                    {showGroupSection && <TabsTrigger value="group">Travel Group</TabsTrigger>}
                  </TabsList>

                  <TabsContent value="itinerary">
                    {itinerary ? (
                      <ItineraryDisplay itinerary={itinerary.itinerary_data} />
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle>Itinerary Not Yet Created</CardTitle>
                          <CardDescription>
                            Your personalized itinerary is being created by our team.
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="soulprint">
                    {computed && narrative ? (
                      <>
                        <SoulPrintVisualization
                          computed={computed}
                          narrative={narrative}
                          respondentId={respondent?.id}
                        />
                        {respondent && (
                          <div className="mt-6">
                            <EmotionalFluctuationGraph respondentId={respondent.id} />
                          </div>
                        )}
                      </>
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle>SoulPrint Not Available</CardTitle>
                        </CardHeader>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="discussion">
                    {itinerary ? (
                      <ItineraryDiscussionForum 
                        itineraryId={itinerary.id}
                        itineraryData={itinerary.itinerary_data}
                        isGroup={false}
                      />
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle>No Itinerary Yet</CardTitle>
                          <CardDescription>Discussions will be available once your itinerary is created</CardDescription>
                        </CardHeader>
                      </Card>
                    )}
                  </TabsContent>

                  {showGroupSection && (
                    <TabsContent value="group">
                      {groupItinerary ? (
                        <ItineraryDiscussionForum 
                          groupItineraryId={groupItinerary.id}
                          itineraryData={groupItinerary.itinerary_data}
                          isGroup={true}
                        />
                      ) : (
                        <Card>
                          <CardHeader>
                            <CardTitle>Group Itinerary Pending</CardTitle>
                          </CardHeader>
                        </Card>
                      )}
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            )}

            {/* POST-TRIP VIEW */}
            {currentView === "post-trip" && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold mb-2">Post-Trip Reflection</h2>
                  <p className="text-muted-foreground">Review your journey and emotional evolution</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Post-Trip Features Coming Soon</CardTitle>
                    <CardDescription>
                      Reflection tools, trip summary, and memory collection will be available here
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {respondent && (
                      <EmotionalFluctuationGraph respondentId={respondent.id} />
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}