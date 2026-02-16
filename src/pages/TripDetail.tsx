import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, ArrowLeft, MapPin, Calendar, Users, UserPlus,
  Mail, Check, Clock, Sparkles, Phone, FileText, ChevronDown, ChevronUp, Wrench
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BookingsSection } from "@/components/trip/BookingsSection";
import { DocumentsSection } from "@/components/trip/DocumentsSection";
import { DestinationInfoSection } from "@/components/trip/DestinationInfoSection";

interface TripMember {
  id: string;
  email: string;
  role: string;
  invitation_status: string;
  respondent_id: string | null;
  user_id: string | null;
}

export default function TripDetail() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [itinerary, setItinerary] = useState<any>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviting, setInviting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});
  const [showCalendly, setShowCalendly] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  const loadTrip = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }
    setUserId(session.user.id);

    const { data: tripData, error } = await supabase
      .from("trips")
      .select("*")
      .eq("id", tripId!)
      .single();

    if (error || !tripData) {
      toast({ title: "Trip not found", variant: "destructive" });
      navigate("/trips");
      return;
    }

    setTrip(tripData);

    // Load related data in parallel
    const [membersRes, bookingsRes, docsRes] = await Promise.all([
      supabase.from("trip_members").select("*").eq("trip_id", tripId!).then(r => r),
      supabase.from("trip_bookings").select("*").eq("trip_id", tripId!).order("booking_date").then(r => r),
      supabase.from("trip_documents").select("*").eq("trip_id", tripId!).order("uploaded_at", { ascending: false }).then(r => r),
    ]);
    setMembers(membersRes.data || []);
    setBookings(bookingsRes.data || []);
    setDocuments(docsRes.data || []);

    if (tripData.destination_id) {
      const { data: destData } = await supabase.from("echoprint_destinations").select("*").eq("id", tripData.destination_id).single();
      if (destData) setDestination(destData);
    }
    if (tripData.itinerary_id) {
      const { data: itinData } = await supabase.from("itineraries").select("*").eq("id", tripData.itinerary_id).single();
      if (itinData) setItinerary(itinData.itinerary_data);
    }

    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmails.trim()) return;
    setInviting(true);
    try {
      const emails = inviteEmails.split(",").map(e => e.trim()).filter(Boolean);
      for (const email of emails) {
        await supabase.from("trip_members").insert({
          trip_id: tripId!,
          email,
          role: "member",
          invitation_status: "pending",
        });
      }
      toast({ title: `Invited ${emails.length} traveler(s)` });
      setInviteEmails("");
      setShowInvite(false);
      loadTrip();
    } catch (err: any) {
      toast({ title: "Failed to invite", description: err.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const handleGenerateItinerary = async () => {
    if (!trip?.respondent_id || !destination) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-itinerary", {
        body: {
          respondent_id: trip.respondent_id,
          destination_id: destination.id,
          destination_name: destination.name,
          destination_country: destination.country,
          destination_description: destination.description,
          destination_highlights: destination.highlights,
          duration_days: 7,
          force_regenerate: true,
        },
      });
      if (error) throw error;
      if (data?.itinerary_id) {
        await supabase.from("trips").update({ itinerary_id: data.itinerary_id }).eq("id", tripId!);
      }
      setItinerary(data?.itinerary);
      toast({ title: "Itinerary generated!" });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const toggleDay = (day: number) => {
    setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!trip) return null;

  const statusColors: Record<string, string> = {
    planning: "bg-primary/20 text-primary",
    booked: "bg-emerald-500/20 text-emerald-400",
    in_progress: "bg-amber-500/20 text-amber-400",
    completed: "bg-muted text-muted-foreground",
  };

  const showUtilities = trip.status === "booked" || trip.status === "in_progress" || trip.status === "planning";

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/trips")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{trip.trip_name}</h1>
              <Badge className={statusColors[trip.status] || ""}>{trip.status.replace("_", " ")}</Badge>
            </div>
            {destination && (
              <p className="text-muted-foreground">{destination.name}, {destination.country}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="travelers">Travelers ({members.length})</TabsTrigger>
            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
            {showUtilities && <TabsTrigger value="utilities" className="gap-1.5"><Wrench className="h-3.5 w-3.5" /> Utilities</TabsTrigger>}
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            {destination && (
              <Card className="overflow-hidden">
                {destination.image_url && (
                  <img src={destination.image_url} alt={destination.name} className="w-full h-48 object-cover" />
                )}
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-semibold">{destination.name}, {destination.country}</h2>
                  <p className="text-muted-foreground text-sm">{destination.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {destination.highlights?.map((h: string, i: number) => (
                      <Badge key={i} variant="outline">{h}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={() => navigate(`/destination/${destination.id}`)}>
                      <MapPin className="h-4 w-4 mr-2" /> View Full Details
                    </Button>
                    <Button variant="outline" onClick={() => setShowCalendly(true)}>
                      <Phone className="h-4 w-4 mr-2" /> Book Consultation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle className="text-base">Trip Details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Type</span><p className="font-medium capitalize">{trip.trip_type}</p></div>
                <div><span className="text-muted-foreground">Budget</span><p className="font-medium">{trip.budget_range || "Not set"}</p></div>
                <div><span className="text-muted-foreground">Start Date</span><p className="font-medium">{trip.start_date ? new Date(trip.start_date).toLocaleDateString() : "Not set"}</p></div>
                <div><span className="text-muted-foreground">End Date</span><p className="font-medium">{trip.end_date ? new Date(trip.end_date).toLocaleDateString() : "Not set"}</p></div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TRAVELERS */}
          <TabsContent value="travelers" className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Trip Members</h3>
              {trip.trip_type !== "solo" && (
                <Button size="sm" onClick={() => setShowInvite(true)} className="gap-2">
                  <UserPlus className="h-4 w-4" /> Invite
                </Button>
              )}
            </div>
            {members.map(member => (
              <Card key={member.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{member.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.respondent_id && (
                      <Badge variant="outline" className="text-xs gap-1"><Check className="h-3 w-3" /> SoulPrint</Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        member.invitation_status === "accepted"
                          ? "text-emerald-400 border-emerald-500/30"
                          : member.invitation_status === "declined"
                          ? "text-destructive border-destructive/30"
                          : "text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {member.invitation_status === "accepted" ? (
                        <><Check className="h-3 w-3 mr-1" /> Accepted</>
                      ) : member.invitation_status === "declined" ? "Declined" : (
                        <><Clock className="h-3 w-3 mr-1" /> Pending</>
                      )}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ITINERARY */}
          <TabsContent value="itinerary" className="space-y-4">
            {itinerary ? (
              <Card>
                <CardHeader>
                  <CardTitle>{itinerary.title || "Your Itinerary"}</CardTitle>
                  {itinerary.overview && <CardDescription>{itinerary.overview}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-3">
                  {itinerary.days?.map((day: any) => (
                    <div key={day.day} className="border border-border/50 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleDay(day.day)}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                      >
                        <div>
                          <span className="text-sm font-bold text-primary">Day {day.day}</span>
                          <span className="text-sm text-foreground ml-2">{day.title || day.theme || ""}</span>
                        </div>
                        {expandedDays[day.day] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      {expandedDays[day.day] && (
                        <div className="px-4 pb-4 space-y-3 border-t border-border/30">
                          {["morning", "afternoon", "evening"].map(slot => {
                            const s = day[slot];
                            if (!s) return null;
                            return (
                              <div key={slot} className="pl-4 border-l-2 border-primary/20 py-2">
                                <p className="text-xs text-muted-foreground uppercase">{slot} — {s.time || ""}</p>
                                <p className="font-medium text-sm">{s.activity}</p>
                                {s.why_it_fits && <p className="text-xs text-primary/70 mt-1 italic">{s.why_it_fits}</p>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-3 pt-4">
                    <Button onClick={() => setShowCalendly(true)} className="flex-1">
                      <Phone className="h-4 w-4 mr-2" /> Book Now
                    </Button>
                    <Button variant="outline" onClick={handleGenerateItinerary} disabled={generating}>
                      {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      Regenerate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No itinerary yet</h3>
                <p className="text-muted-foreground mb-4">Generate a personalized itinerary for this trip.</p>
                <Button onClick={handleGenerateItinerary} disabled={generating || !trip.respondent_id}>
                  {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Generate Itinerary
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* UTILITIES */}
          {showUtilities && (
            <TabsContent value="utilities" className="space-y-8">
              <BookingsSection tripId={tripId!} bookings={bookings} onReload={loadTrip} />
              <DocumentsSection tripId={tripId!} documents={documents} userId={userId} onReload={loadTrip} />
              {destination && (
                <DestinationInfoSection destinationId={destination.id} destinationName={destination.name} />
              )}
            </TabsContent>
          )}

          {/* DOCUMENTS (legacy tab kept for quick access) */}
          <TabsContent value="documents">
            <DocumentsSection tripId={tripId!} documents={documents} userId={userId} onReload={loadTrip} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite to {trip.trip_name}</DialogTitle>
            <DialogDescription>Enter email addresses separated by commas.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="emails">Email Addresses</Label>
              <Input id="emails" placeholder="friend@example.com, partner@example.com" value={inviteEmails} onChange={e => setInviteEmails(e.target.value)} />
            </div>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmails.trim()} className="w-full">
              {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Send Invitations
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Calendly Dialog */}
      <Dialog open={showCalendly} onOpenChange={setShowCalendly}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Book Your Travel Consultation</DialogTitle>
            <DialogDescription>30-minute complimentary consultation with an Erranza expert.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-4">
              <Phone className="h-12 w-12 mx-auto text-primary/50" />
              <p>Calendly integration will be configured here.</p>
              <p className="text-sm">Contact us at <span className="text-primary">hello@erranza.com</span></p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
