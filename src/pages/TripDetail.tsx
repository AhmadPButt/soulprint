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
  Mail, Check, Clock, Sparkles, Phone, FileText, ChevronDown, ChevronUp, Wrench, Heart, Trash2, AlertTriangle,
  Download, RefreshCw, XCircle, PoundSterling
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BookingsSection } from "@/components/trip/BookingsSection";
import { DocumentsSection } from "@/components/trip/DocumentsSection";
import { DestinationInfoSection } from "@/components/trip/DestinationInfoSection";
import { MoodLogger } from "@/components/trip/MoodLogger";
import { EmotionalFluctuationGraph } from "@/components/trip/EmotionalFluctuationGraph";
import { MoodInsights } from "@/components/trip/MoodInsights";
import { TripReflection } from "@/components/trip/TripReflection";
import { AIChatWidget } from "@/components/trip/AIChatWidget";
import jsPDF from "jspdf";

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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  const loadTrip = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }
    setUserId(session.user.id);

    // Check admin role
    const { data: adminCheck } = await supabase.rpc('has_role', {
      _user_id: session.user.id,
      _role: 'admin'
    });
    if (adminCheck) setIsAdmin(true);

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
    planning: "bg-amber-50 text-amber-700 border-amber-200",
    booked: "bg-emerald-50 text-emerald-700 border-emerald-200",
    in_progress: "bg-brand-lavender-haze text-primary border-primary/20",
    completed: "bg-secondary text-secondary-foreground border-border",
  };

  const showUtilities = isAdmin || trip.status === "booked" || trip.status === "in_progress" || trip.status === "planning";
  const showMoodTab = isAdmin || trip.status === "in_progress" || trip.status === "completed";

  const statusFlow: Record<string, string[]> = {
    planning: ["booked"],
    booked: ["in_progress", "planning"],
    in_progress: ["completed", "booked"],
    completed: [],
  };

  const statusLabels: Record<string, string> = {
    planning: "Planning",
    booked: "Booked",
    in_progress: "In Progress",
    completed: "Completed",
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from("trips")
        .update({ status: newStatus })
        .eq("id", tripId!);
      if (error) throw error;
      setTrip({ ...trip, status: newStatus });
      toast({ title: `Trip status updated to ${statusLabels[newStatus]}` });
    } catch (err: any) {
      toast({ title: "Failed to update status", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteTrip = async () => {
    try {
      const { error } = await supabase.from("trips").delete().eq("id", tripId!);
      if (error) throw error;
      toast({ title: "Trip deleted" });
      navigate("/trips");
    } catch (err: any) {
      toast({ title: "Failed to delete trip", description: err.message, variant: "destructive" });
    }
  };

  const handleExportPDF = () => {
    if (!itinerary) return;
    const doc = new jsPDF();
    let y = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;

    const addText = (text: string, size: number, bold = false) => {
      doc.setFontSize(size);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, maxWidth);
      for (const line of lines) {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += size * 0.5;
      }
      y += 4;
    };

    addText(itinerary.title || trip.trip_name, 18, true);
    if (destination) addText(`${destination.name}, ${destination.country}`, 12);
    if (itinerary.overview) { y += 2; addText(itinerary.overview, 10); }
    y += 4;

    itinerary.days?.forEach((day: any) => {
      addText(`Day ${day.day}: ${day.title || day.theme || ""}`, 14, true);
      for (const slot of ["morning", "afternoon", "evening"]) {
        const s = day[slot];
        if (!s) continue;
        const cost = s.estimated_cost_gbp ? ` (£${s.estimated_cost_gbp})` : "";
        addText(`${slot.charAt(0).toUpperCase() + slot.slice(1)} — ${s.time || ""}${cost}`, 10, true);
        addText(s.activity, 10);
        if (s.why_it_fits) addText(`  → ${s.why_it_fits}`, 9);
      }
      if (day.accommodation) {
        const accCost = day.accommodation.estimated_cost_gbp ? ` (£${day.accommodation.estimated_cost_gbp}/night)` : "";
        addText(`Accommodation: ${day.accommodation.name}${accCost}`, 10, true);
      }
      if (day.daily_total_gbp) addText(`Day total: £${day.daily_total_gbp}`, 10, true);
      y += 6;
    });

    if (itinerary.total_estimated_cost) {
      addText(`Total Estimated Cost: £${itinerary.total_estimated_cost}`, 14, true);
    }

    doc.save(`${trip.trip_name.replace(/\s+/g, "_")}_itinerary.pdf`);
    toast({ title: "PDF downloaded" });
  };

  const handleResendInvitation = async (memberId: string, email: string) => {
    try {
      await supabase.functions.invoke("send-trip-invitation", {
        body: { trip_id: tripId, email, trip_name: trip.trip_name },
      });
      toast({ title: `Invitation resent to ${email}` });
    } catch (err: any) {
      toast({ title: "Failed to resend", description: err.message, variant: "destructive" });
    }
  };

  const handleCancelInvitation = async (memberId: string) => {
    try {
      const { error } = await supabase.from("trip_members").delete().eq("id", memberId);
      if (error) throw error;
      setMembers(members.filter(m => m.id !== memberId));
      toast({ title: "Invitation cancelled" });
    } catch (err: any) {
      toast({ title: "Failed to cancel", description: err.message, variant: "destructive" });
    }
  };

  const nextStatuses = statusFlow[trip.status] || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/trips")} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{trip.trip_name}</h1>
                <Badge className={`text-xs font-medium ${statusColors[trip.status] || ""}`}>{trip.status.replace("_", " ")}</Badge>
                
                {nextStatuses.length > 0 && trip.created_by === userId && (
                  <Select onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-auto h-8 text-xs gap-1.5 border-border">
                      <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent>
                      {nextStatuses.map(s => (
                        <SelectItem key={s} value={s}>Move to {statusLabels[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {destination && (
                <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />{destination.name}, {destination.country}
                </p>
              )}
            </div>
            
            {trip.created_by === userId && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive rounded-full">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Delete Trip
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{trip.trip_name}" and all associated bookings, documents, and member invitations. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteTrip} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete Trip
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 flex-wrap bg-secondary/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
            <TabsTrigger value="travelers" className="rounded-lg">Travelers ({members.length})</TabsTrigger>
            <TabsTrigger value="itinerary" className="rounded-lg">Itinerary</TabsTrigger>
            {showUtilities && <TabsTrigger value="utilities" className="gap-1.5 rounded-lg"><Wrench className="h-3.5 w-3.5" /> Utilities</TabsTrigger>}
            {showMoodTab && <TabsTrigger value="mood" className="gap-1.5 rounded-lg"><Heart className="h-3.5 w-3.5" /> Mood</TabsTrigger>}
            <TabsTrigger value="documents" className="rounded-lg">Documents</TabsTrigger>
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
                    {/* Resend / Cancel for pending invitations */}
                    {member.invitation_status === "pending" && trip.created_by === userId && (
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Resend invitation"
                          onClick={() => handleResendInvitation(member.id, member.email)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          title="Cancel invitation"
                          onClick={() => handleCancelInvitation(member.id)}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ITINERARY */}
          <TabsContent value="itinerary" className="space-y-4">
            {itinerary ? (
              <div className="space-y-4">
                {/* Itinerary Header */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="bg-gradient-to-br from-brand-lavender-haze via-accent/50 to-background px-6 py-6">
                    <p className="text-xs font-semibold tracking-widest uppercase text-primary/60 mb-1">Itinerary</p>
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-xl font-bold text-foreground">{itinerary.title || "Your Itinerary"}</h2>
                      {itinerary.total_estimated_cost && (
                        <Badge variant="outline" className="text-sm gap-1.5 px-3 py-1 shrink-0 bg-card">
                          <PoundSterling className="h-3.5 w-3.5" />
                          {itinerary.total_estimated_cost.toLocaleString()} total
                        </Badge>
                      )}
                    </div>
                    {itinerary.overview && (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{itinerary.overview}</p>
                    )}
                  </div>
                </div>

                {/* Days */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  {itinerary.days?.map((day: any, idx: number) => (
                    <div key={day.day} className={idx > 0 ? "border-t border-border" : ""}>
                      <button
                        onClick={() => toggleDay(day.day)}
                        className="w-full flex items-center justify-between px-6 py-4 hover:bg-secondary/40 transition-colors text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-full bg-brand-lavender-haze flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">{day.day}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-foreground">{day.title || day.theme || `Day ${day.day}`}</span>
                            {day.theme && day.title && (
                              <p className="text-xs text-muted-foreground mt-0.5 italic">{day.theme}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {day.daily_total_gbp && (
                            <span className="text-xs font-medium text-muted-foreground">£{day.daily_total_gbp}</span>
                          )}
                          {expandedDays[day.day]
                            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </button>

                      {expandedDays[day.day] && (
                        <div className="px-6 pb-5 pt-1 border-t border-border/60 space-y-3">
                          {["morning", "afternoon", "evening"].map(slot => {
                            const s = day[slot];
                            if (!s) return null;
                            return (
                              <div key={slot} className="flex gap-3 p-3.5 rounded-xl border border-border bg-background">
                                <div className="flex-shrink-0">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary/60 bg-brand-lavender-haze px-2 py-0.5 rounded-full">
                                    {slot}
                                  </span>
                                </div>
                                <div className="flex-1 pt-0.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="font-semibold text-sm text-foreground">{s.activity}</p>
                                    {s.estimated_cost_gbp && (
                                      <span className="text-xs text-muted-foreground shrink-0">£{s.estimated_cost_gbp}</span>
                                    )}
                                  </div>
                                  {s.time && <p className="text-xs text-muted-foreground mt-0.5">{s.time}</p>}
                                  {s.why_it_fits && (
                                    <p className="text-xs text-primary/70 mt-1.5 italic flex items-start gap-1">
                                      <Sparkles className="h-3 w-3 shrink-0 mt-0.5" />{s.why_it_fits}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {day.accommodation && (
                            <div className="flex gap-3 p-3.5 rounded-xl border border-border bg-background">
                              <span className="text-base shrink-0">🏨</span>
                              <div>
                                <p className="font-semibold text-sm">{day.accommodation.name}</p>
                                {day.accommodation.estimated_cost_gbp && (
                                  <p className="text-xs text-muted-foreground">£{day.accommodation.estimated_cost_gbp}/night</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button onClick={() => setShowCalendly(true)} className="flex-1">
                    <Phone className="h-4 w-4 mr-2" /> Book Now
                  </Button>
                  <Button variant="outline" onClick={handleExportPDF}>
                    <Download className="h-4 w-4 mr-2" /> PDF
                  </Button>
                  <Button variant="outline" onClick={handleGenerateItinerary} disabled={generating}>
                    {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Regenerate
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-brand-lavender-haze flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-7 w-7 text-primary/60" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No itinerary yet</h3>
                <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">Generate a personalized itinerary crafted around your SoulPrint and destination.</p>
                <Button onClick={handleGenerateItinerary} disabled={generating || !trip.respondent_id}>
                  {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Generate Itinerary
                </Button>
              </div>
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

          {/* MOOD & REFLECTION */}
          {showMoodTab && (
            <TabsContent value="mood" className="space-y-8">
              {trip.status === "in_progress" && (
                <>
                  {trip.respondent_id && (
                    <MoodLogger
                      respondentId={trip.respondent_id}
                      tripId={tripId!}
                      destinationName={destination?.name}
                      onLogComplete={loadTrip}
                    />
                  )}

                  {itinerary?.days && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Rate Activities</CardTitle>
                        <CardDescription>How did each activity make you feel?</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {itinerary.days.map((day: any) => (
                          <div key={day.day} className="space-y-2">
                            <p className="text-sm font-semibold text-primary">Day {day.day}: {day.title || day.theme || ""}</p>
                            {["morning", "afternoon", "evening"].map(slot => {
                              const s = day[slot];
                              if (!s) return null;
                              return (
                                <div key={slot} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                                  <div>
                                    <p className="text-sm font-medium">{s.activity}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{slot} — {s.time || ""}</p>
                                  </div>
                                  <div className="flex gap-1">
                                    {["😊", "😐", "😔"].map((emoji, idx) => (
                                      <button
                                        key={emoji}
                                        className="text-xl hover:scale-125 transition-transform p-1"
                                        onClick={async () => {
                                          const score = [8, 5, 3][idx];
                                          if (!trip.respondent_id) return;
                                          await supabase.from('mood_logs').insert({
                                            respondent_id: trip.respondent_id,
                                            trip_id: tripId!,
                                            mood_score: score,
                                            activity_reference: s.activity,
                                            location: destination?.name || null,
                                            emotions: { selected: [] },
                                          } as any);
                                          toast({ title: "Mood logged for " + s.activity });
                                        }}
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {trip.respondent_id && (
                    <EmotionalFluctuationGraph respondentId={trip.respondent_id} tripId={tripId!} />
                  )}
                </>
              )}

              {trip.status === "completed" && trip.respondent_id && (
                <>
                  <EmotionalFluctuationGraph respondentId={trip.respondent_id} tripId={tripId!} />
                  <MoodInsights respondentId={trip.respondent_id} />
                  <TripReflection respondentId={trip.respondent_id} tripId={tripId!} />
                </>
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

      {/* AI Chat Widget for in-progress trips */}
      {trip.status === "in_progress" && (
        <AIChatWidget tripId={tripId!} destinationName={destination?.name} />
      )}
    </div>
  );
}
