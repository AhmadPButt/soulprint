import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, ArrowLeft, MapPin, Calendar, Users, UserPlus,
  Mail, Check, Clock, Sparkles, Phone, FileText, Wrench, Heart, Trash2, AlertTriangle,
  Download, RefreshCw, XCircle, PoundSterling, LayoutDashboard, Route, Star,
  ListOrdered, CalendarDays
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BookingsSection } from "@/components/trip/BookingsSection";
import { DocumentsSection } from "@/components/trip/DocumentsSection";
import { DestinationInfoSection } from "@/components/trip/DestinationInfoSection";
import { MoodLogger } from "@/components/trip/MoodLogger";
import { EmotionalFluctuationGraph } from "@/components/trip/EmotionalFluctuationGraph";
import { MoodInsights } from "@/components/trip/MoodInsights";
import { TripReflection } from "@/components/trip/TripReflection";
import { AIChatWidget } from "@/components/trip/AIChatWidget";
import ItineraryTimeline from "@/components/trip/ItineraryTimeline";
import fingerprintImg from "@/assets/fingerprint.png";
import jsPDF from "jspdf";

interface TripMember {
  id: string;
  email: string;
  role: string;
  invitation_status: string;
  respondent_id: string | null;
  user_id: string | null;
}

type NavSection = "overview" | "travelers" | "itinerary" | "utilities" | "mood" | "documents" | "post-trip";

const statusColors: Record<string, string> = {
  planning: "bg-amber-50 text-amber-700 border-amber-200",
  booked: "bg-emerald-50 text-emerald-700 border-emerald-200",
  in_progress: "bg-accent text-accent-foreground border-primary/20",
  completed: "bg-secondary text-secondary-foreground border-border",
};

const statusLabels: Record<string, string> = {
  planning: "Planning",
  booked: "Booked",
  in_progress: "In Progress",
  completed: "Completed",
};

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
  const [groupType, setGroupType] = useState<string>("couple");
  const [generating, setGenerating] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Record<string, any>>({});
  const [showCalendly, setShowCalendly] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeSection, setActiveSection] = useState<NavSection>("overview");
  const [chatOpen, setChatOpen] = useState(false);
  const [itineraryView, setItineraryView] = useState<"timeline" | "day">("timeline");

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  const loadTrip = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }
    setUserId(session.user.id);

    const { data: adminCheck } = await supabase.rpc('has_role', { _user_id: session.user.id, _role: 'admin' });
    if (adminCheck) setIsAdmin(true);

    const { data: tripData, error } = await supabase.from("trips").select("*").eq("id", tripId!).single();
    if (error || !tripData) {
      toast({ title: "Trip not found", variant: "destructive" });
      navigate("/trips");
      return;
    }
    setTrip(tripData);

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
    // Always load itinerary scoped to THIS trip first (prevents cross-trip leakage)
    const { data: tripScopedItin } = await supabase
      .from("itineraries")
      .select("*")
      .eq("trip_id", tripId!)
      .maybeSingle();

    if (tripScopedItin) {
      setItinerary(tripScopedItin.itinerary_data);
    } else if (tripData.itinerary_id) {
      // Only fall back to trips.itinerary_id if it actually belongs to this trip
      const { data: linkedItin } = await supabase
        .from("itineraries")
        .select("*")
        .eq("id", tripData.itinerary_id)
        .eq("trip_id", tripId!)
        .maybeSingle();
      if (linkedItin) setItinerary(linkedItin.itinerary_data);
    }

    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmails.trim()) return;
    setInviting(true);
    try {
      const emails = inviteEmails.split(",").map(e => e.trim()).filter(Boolean);
      const { data: { user } } = await supabase.auth.getUser();
      const inviterName = user?.email?.split("@")[0] || "Your travel companion";

      for (const email of emails) {
        // Insert member
        // Generate a unique token for the invitation link
        const invitationToken = crypto.randomUUID();

        const { data: newMember, error: insertErr } = await supabase
          .from("trip_members")
          .insert({ 
            trip_id: tripId!, 
            email, 
            role: "member", 
            invitation_status: "pending",
            invitation_token: invitationToken,
          })
          .select()
          .single();

        if (insertErr) throw insertErr;

        // Also update trip type to reflect group if it was solo
        if (trip.trip_type === "solo" && groupType) {
          await supabase.from("trips").update({ trip_type: groupType }).eq("id", tripId!);
        }

        // Send invitation email via edge function
        const { data: emailData, error: emailErr } = await supabase.functions.invoke("send-trip-invitation", {
          body: {
            trip_id: tripId!,
            member_id: newMember.id,
            invitation_token: newMember.invitation_token,
            inviter_name: inviterName,
          },
        });

        if (emailErr) {
          console.error("Email send failed:", emailErr);
          toast({ title: "Invite added but email failed", description: emailErr.message, variant: "destructive" });
        }
      }

      toast({ title: `Invitation sent to ${emails.length} traveler(s)`, description: "They'll receive an email with a link to join." });
      setInviteEmails("");
      setGroupType("couple");
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
          trip_id: tripId,
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

    if (itinerary.total_estimated_cost) addText(`Total Estimated Cost: £${itinerary.total_estimated_cost}`, 14, true);
    doc.save(`${trip.trip_name.replace(/\s+/g, "_")}_itinerary.pdf`);
    toast({ title: "PDF downloaded" });
  };

  const handleResendInvitation = async (memberId: string, email: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const inviterName = user?.email?.split("@")[0] || "Your travel companion";
      const { error: resendErr } = await supabase.functions.invoke("send-trip-invitation", {
        body: { trip_id: tripId, member_id: memberId, inviter_name: inviterName },
      });
      if (resendErr) throw resendErr;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!trip) return null;

  const isInProgress = trip.status === "in_progress";
  const isCompleted = trip.status === "completed";
  const isPlanning = trip.status === "planning";
  const isBooked = trip.status === "booked";

  // Which sections are visible based on status
  const showUtilities = isAdmin || isBooked || isInProgress || isPlanning;
  const showMood = isAdmin || isInProgress;
  const showPostTrip = isAdmin || isCompleted;

  // Nav items based on status
  const allNavItems = [
    { id: "overview" as NavSection, label: "Overview", icon: <LayoutDashboard className="h-4 w-4" />, show: true },
    { id: "travelers" as NavSection, label: "Travelers", icon: <Users className="h-4 w-4" />, show: true },
    { id: "itinerary" as NavSection, label: "Itinerary", icon: <Route className="h-4 w-4" />, show: true },
    { id: "utilities" as NavSection, label: "Utilities", icon: <Wrench className="h-4 w-4" />, show: showUtilities },
    { id: "mood" as NavSection, label: "Mood", icon: <Heart className="h-4 w-4" />, show: showMood },
    { id: "documents" as NavSection, label: "Documents", icon: <FileText className="h-4 w-4" />, show: true },
    { id: "post-trip" as NavSection, label: "Post Trip", icon: <Star className="h-4 w-4" />, show: showPostTrip },
  ];
  const navItems = allNavItems.filter(item => item.show);

  // Itinerary day render
  const renderItineraryContent = () => {
    if (!itinerary) {
      return (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-7 w-7 text-primary/60" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No itinerary yet</h3>
          <p className="text-muted-foreground text-sm mb-4 max-w-sm mx-auto">Generate a personalized itinerary crafted around your SoulPrint and destination.</p>
          <Button onClick={handleGenerateItinerary} disabled={generating || !trip.respondent_id}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate Itinerary
          </Button>
        </div>
      );
    }

    const activeDayNum = (expandedDays as any).activeDay ?? itinerary.days?.[0]?.day;
    const activeDay = itinerary.days?.find((d: any) => d.day === activeDayNum) || itinerary.days?.[0];

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
          <div className="bg-gradient-to-br from-brand-lavender-haze via-accent/50 to-background px-6 py-6">
            <p className="text-xs font-semibold tracking-widest uppercase text-primary/70 mb-2">Itinerary</p>
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold text-foreground">{itinerary.title || "Your Itinerary"}</h2>
              {itinerary.total_estimated_cost && (
                <Badge variant="outline" className="text-sm gap-1.5 px-3 py-1.5 shrink-0 bg-card">
                  <PoundSterling className="h-3.5 w-3.5" />{itinerary.total_estimated_cost.toLocaleString()} total
                </Badge>
              )}
            </div>
            {destination && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />{destination.name}, {destination.country}
              </p>
            )}
            {itinerary.overview && (
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{itinerary.overview}</p>
            )}
          </div>
        </div>

        {/* View toggle */}
        {itinerary.days?.length > 0 && (
          <div className="flex items-center gap-1 p-1 bg-secondary rounded-xl w-fit">
            <button
              onClick={() => setItineraryView("timeline")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                itineraryView === "timeline" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ListOrdered className="h-3.5 w-3.5" /> Timeline
            </button>
            <button
              onClick={() => setItineraryView("day")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                itineraryView === "day" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" /> Day View
            </button>
          </div>
        )}

        {/* Timeline view */}
        {itinerary.days?.length > 0 && itineraryView === "timeline" && (
          <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
            <ItineraryTimeline itinerary={itinerary} />
          </div>
        )}

        {/* Day tabs */}
        {itinerary.days?.length > 0 && itineraryView === "day" && (
          <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 py-0 flex gap-1 overflow-x-auto bg-card">
              {itinerary.days.map((day: any) => (
                <button
                  key={day.day}
                  onClick={() => setExpandedDays(prev => ({ ...prev, activeDay: day.day }))}
                  className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    activeDayNum === day.day ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Day {day.day}
                </button>
              ))}
            </div>
            {activeDay && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{activeDay.title || activeDay.theme || `Day ${activeDay.day}`}</h2>
                  {activeDay.theme && activeDay.title && <p className="text-sm text-muted-foreground mt-1 italic">{activeDay.theme}</p>}
                  {activeDay.daily_total_gbp && (
                    <Badge variant="outline" className="mt-2 gap-1"><PoundSterling className="h-3 w-3" />{activeDay.daily_total_gbp} today</Badge>
                  )}
                </div>

                {/* New format: locations[] */}
                {activeDay.locations?.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" /> Activities
                    </p>
                    {activeDay.locations.map((loc: any, idx: number) => (
                      <div key={idx} className="flex gap-4 p-4 rounded-xl border border-border bg-background hover:border-primary/30 transition-colors">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">{loc.name}</h4>
                            {loc.time && <span className="text-xs text-muted-foreground shrink-0 mt-0.5">{loc.time}</span>}
                          </div>
                          <p className="text-sm text-muted-foreground">{loc.activity}</p>
                          {loc.psychological_alignment && (
                            <div className="mt-2 px-3 py-1.5 rounded-lg bg-accent/50 flex items-center gap-1.5">
                              <Sparkles className="h-3 w-3 text-primary/60 shrink-0" />
                              <p className="text-xs text-primary/80 italic">{loc.psychological_alignment}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Old format: morning/afternoon/evening */}
                {(activeDay.morning || activeDay.afternoon || activeDay.evening) && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" /> Activities
                    </p>
                    {["morning", "afternoon", "evening"].map(slot => {
                      const s = activeDay[slot];
                      if (!s) return null;
                      return (
                        <div key={slot} className="flex gap-4 p-4 rounded-xl border border-border bg-background hover:border-primary/30 transition-colors">
                          <div className="flex-shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-accent px-2 py-0.5 rounded-full">{slot}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-semibold text-foreground">{s.activity}</p>
                              {s.estimated_cost_gbp && <span className="text-xs text-muted-foreground shrink-0">£{s.estimated_cost_gbp}</span>}
                            </div>
                            {s.time && <p className="text-xs text-muted-foreground">{s.time}</p>}
                            {s.why_it_fits && (
                              <div className="mt-2 flex items-start gap-1.5">
                                <Sparkles className="h-3 w-3 text-primary/60 shrink-0 mt-0.5" />
                                <p className="text-xs text-primary/80 italic">{s.why_it_fits}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeDay.accommodation && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">🏨 Stay</p>
                    <div className="p-4 rounded-xl border border-border bg-background flex gap-3 items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">{activeDay.accommodation.name}</h4>
                          {activeDay.accommodation.type && <Badge variant="outline" className="text-xs">{activeDay.accommodation.type}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{activeDay.accommodation.why || activeDay.accommodation.description || ""}</p>
                        {activeDay.accommodation.estimated_cost_gbp && (
                          <p className="text-xs text-muted-foreground mt-1">£{activeDay.accommodation.estimated_cost_gbp}/night</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeDay.meals?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">🍽 Dining</p>
                    <div className="grid grid-cols-3 gap-3">
                      {["Breakfast", "Lunch", "Dinner"].map((label, idx) => (
                        activeDay.meals[idx] && (
                          <div key={idx} className="p-3 rounded-xl border border-border bg-background text-center">
                            <p className="text-xs text-muted-foreground mb-1 font-medium">{label}</p>
                            <p className="text-sm font-medium text-foreground">{activeDay.meals[idx]}</p>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {itinerary.psychological_insights && (
          <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
            <div className="px-6 py-4 border-b border-border flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">Psychological Design</h2>
            </div>
            <div className="p-6 space-y-5">
              {[
                { label: "Transformation Arc", value: itinerary.psychological_insights.transformation_arc },
                { label: "Growth Opportunities", value: itinerary.psychological_insights.growth_opportunities },
                { label: "Comfort Balance", value: itinerary.psychological_insights.comfort_balance },
              ].map(({ label, value }) => value && (
                <div key={label}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
                  <p className="text-sm text-foreground leading-relaxed">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

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
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-5">
            {/* Hero destination card */}
            {destination && (
              <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
                {destination.image_url && (
                  <div className="relative h-56 overflow-hidden">
                    <img src={destination.image_url} alt={destination.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h2 className="text-2xl font-bold text-white leading-tight">{destination.name}</h2>
                      <p className="text-white/70 text-sm flex items-center gap-1.5 mt-1">
                        <MapPin className="h-3.5 w-3.5" />{destination.country}
                      </p>
                    </div>
                  </div>
                )}
                {!destination.image_url && (
                  <div className="bg-gradient-to-br from-brand-lavender-haze via-accent to-background p-6">
                    <h2 className="text-2xl font-bold text-foreground">{destination.name}</h2>
                    <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-1">
                      <MapPin className="h-3.5 w-3.5" />{destination.country}
                    </p>
                  </div>
                )}
                <div className="p-5 space-y-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">{destination.description}</p>
                  {destination.highlights?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {destination.highlights.map((h: string, i: number) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-accent text-xs font-medium text-primary border border-primary/10">{h}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-3 pt-1 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/destination/${destination.id}`)}>
                      <MapPin className="h-3.5 w-3.5 mr-1.5" /> View Full Details
                    </Button>
                    <Button size="sm" onClick={() => setShowCalendly(true)}>
                      <Phone className="h-3.5 w-3.5 mr-1.5" /> Book Consultation
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Trip type + budget + dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Trip Type */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Trip Type</p>
                {(() => {
                  const typeConfig: Record<string, { emoji: string; color: string; label: string }> = {
                    solo:       { emoji: "🧘", color: "bg-sky-100 text-sky-700 border-sky-200",       label: "Solo" },
                    romantic:   { emoji: "💑", color: "bg-rose-100 text-rose-700 border-rose-200",    label: "Romantic" },
                    family:     { emoji: "👨‍👩‍👧", color: "bg-amber-100 text-amber-700 border-amber-200", label: "Family" },
                    friends:    { emoji: "🎉", color: "bg-violet-100 text-violet-700 border-violet-200", label: "Friends" },
                    group:      { emoji: "👥", color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Group" },
                    adventure:  { emoji: "🏔️", color: "bg-orange-100 text-orange-700 border-orange-200", label: "Adventure" },
                    wellness:   { emoji: "🌿", color: "bg-teal-100 text-teal-700 border-teal-200",    label: "Wellness" },
                    business:   { emoji: "💼", color: "bg-slate-100 text-slate-700 border-slate-200", label: "Business" },
                  };
                  const cfg = typeConfig[trip.trip_type?.toLowerCase()] || { emoji: "✈️", color: "bg-accent text-primary border-primary/20", label: trip.trip_type || "Trip" };
                  return (
                    <div className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full border text-sm font-semibold ${cfg.color}`}>
                      <span className="text-xl leading-none">{cfg.emoji}</span>
                      {cfg.label}
                    </div>
                  );
                })()}
              </div>

              {/* Budget range */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Budget Range</p>
                {trip.budget_range ? (() => {
                  const budgetLevels = [
                    { key: "budget",   label: "Budget",   range: "Under £1k",  fill: 1 },
                    { key: "1k_2k",    label: "£1k–2k",   range: "£1,000–2,000", fill: 2 },
                    { key: "2k_3k",    label: "£2k–3k",   range: "£2,000–3,000", fill: 3 },
                    { key: "3k_5k",    label: "£3k–5k",   range: "£3,000–5,000", fill: 4 },
                    { key: "5k_10k",   label: "£5k–10k",  range: "£5,000–10,000", fill: 5 },
                    { key: "10k_plus", label: "£10k+",    range: "£10,000+",    fill: 6 },
                  ];
                  const total = budgetLevels.length;
                  const match = budgetLevels.find(b => trip.budget_range?.toLowerCase().includes(b.key.toLowerCase()) || trip.budget_range?.toLowerCase().includes(b.label.toLowerCase().replace("£","")));
                  const level = match?.fill ?? 3;
                  const label = match?.label ?? trip.budget_range;
                  const range = match?.range ?? trip.budget_range;
                  return (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: total }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-2.5 flex-1 rounded-full transition-all ${i < level ? "bg-primary" : "bg-secondary"}`}
                          />
                        ))}
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-base font-bold text-foreground">{label}</span>
                        <span className="text-xs text-muted-foreground">{range}</span>
                      </div>
                    </div>
                  );
                })() : (
                  <span className="text-sm text-muted-foreground italic">Not set</span>
                )}
              </div>

              {/* Travel dates */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Travel Dates</p>
                {trip.start_date || trip.end_date ? (() => {
                  const start = trip.start_date ? new Date(trip.start_date) : null;
                  const end = trip.end_date ? new Date(trip.end_date) : null;
                  const nights = start && end ? Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : null;
                  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        {/* Start */}
                        <div className="flex-1 rounded-xl bg-accent/60 border border-primary/10 p-3 text-center">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Departure</p>
                          <p className="text-sm font-bold text-foreground">{start ? fmt(start) : "TBC"}</p>
                        </div>
                        {/* Line */}
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <div className="h-px w-8 bg-primary/30" />
                          {nights !== null && (
                            <span className="text-[10px] font-semibold text-primary bg-accent px-2 py-0.5 rounded-full">{nights}n</span>
                          )}
                          <div className="h-px w-8 bg-primary/30" />
                        </div>
                        {/* End */}
                        <div className="flex-1 rounded-xl bg-primary/8 border border-primary/20 p-3 text-center">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Return</p>
                          <p className="text-sm font-bold text-foreground">{end ? fmt(end) : "TBC"}</p>
                        </div>
                      </div>
                    </div>
                  );
                })() : (
                  <span className="text-sm text-muted-foreground italic">Dates not set yet</span>
                )}
              </div>
            </div>
          </div>
        );

      case "travelers":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Trip Members</h3>
              {trip.trip_type !== "solo" && (
                <Button size="sm" onClick={() => setShowInvite(true)} className="gap-2">
                  <UserPlus className="h-4 w-4" /> Invite
                </Button>
              )}
            </div>
            {members.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No travelers invited yet</p>
                </CardContent>
              </Card>
            ) : members.map(member => (
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
                    <Badge variant="outline" className={`text-xs ${
                      member.invitation_status === "accepted" ? "text-emerald-500 border-emerald-500/30"
                        : member.invitation_status === "declined" ? "text-destructive border-destructive/30"
                        : "text-amber-500 border-amber-500/30"
                    }`}>
                      {member.invitation_status === "accepted" ? <><Check className="h-3 w-3 mr-1" /> Accepted</>
                        : member.invitation_status === "declined" ? "Declined"
                        : <><Clock className="h-3 w-3 mr-1" /> Pending</>}
                    </Badge>
                    {member.invitation_status === "pending" && trip.created_by === userId && (
                      <div className="flex items-center gap-1 ml-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Resend invitation"
                          onClick={() => handleResendInvitation(member.id, member.email)}>
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Cancel invitation"
                          onClick={() => handleCancelInvitation(member.id)}>
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case "itinerary":
        return renderItineraryContent();

      case "utilities":
        return (
          <div className="space-y-8">
            <BookingsSection tripId={tripId!} bookings={bookings} onReload={loadTrip} />
            <DocumentsSection tripId={tripId!} documents={documents} userId={userId} onReload={loadTrip} />
            {destination && <DestinationInfoSection destinationId={destination.id} destinationName={destination.name} />}
          </div>
        );

      case "mood":
        return (
          <div className="space-y-6">
            {trip.respondent_id && (
              <MoodLogger respondentId={trip.respondent_id} tripId={tripId!} destinationName={destination?.name} onLogComplete={loadTrip} />
            )}
            {trip.respondent_id && (
              <EmotionalFluctuationGraph respondentId={trip.respondent_id} tripId={tripId!} />
            )}
          </div>
        );

      case "documents":
        return <DocumentsSection tripId={tripId!} documents={documents} userId={userId} onReload={loadTrip} />;

      case "post-trip":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-1">Post-Trip Reflection</h3>
              <p className="text-sm text-muted-foreground">Share your experience and help us improve future journeys</p>
            </div>

            {/* NPS & Reflection form */}
            {trip.respondent_id && (
              <TripReflection respondentId={trip.respondent_id} tripId={tripId!} />
            )}

            {/* Mood fluctuation for completed trips */}
            {trip.respondent_id && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <Heart className="h-4 w-4 text-primary" /> Your Emotional Journey
                </h3>
                <EmotionalFluctuationGraph respondentId={trip.respondent_id} tripId={tripId!} />
              </div>
            )}

            {/* Mood insights AI summary */}
            {trip.respondent_id && (
              <MoodInsights respondentId={trip.respondent_id} />
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top header bar */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/trips")} className="rounded-full shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2.5 min-w-0">
              <h1 className="text-base font-semibold text-foreground truncate">{trip.trip_name}</h1>
              <Badge className={`text-xs font-medium shrink-0 ${statusColors[trip.status] || ""}`}>
                {statusLabels[trip.status] || trip.status}
              </Badge>
            </div>
            {destination && (
              <p className="text-muted-foreground text-sm flex items-center gap-1 hidden md:flex shrink-0">
                <MapPin className="h-3.5 w-3.5" />{destination.name}, {destination.country}
              </p>
            )}
          </div>

          {trip.created_by === userId && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive rounded-full shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" /> Delete Trip
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{trip.trip_name}" and all associated data. This action cannot be undone.
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

      {/* Main layout: sidebar + content */}
      <div className="container max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Side Navbar */}
        <aside className="w-52 shrink-0 hidden md:flex flex-col">
          <nav className="sticky top-20 flex flex-col gap-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  activeSection === item.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}

            {/* Fingerprint AI chat trigger — only for in_progress */}
            {isInProgress && (
              <div className="mt-6 border-t border-border pt-4">
                <button
                  onClick={() => setChatOpen(true)}
                  className="w-full flex flex-col items-center gap-2 p-3 rounded-xl border border-primary/20 bg-accent/50 hover:bg-accent transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors overflow-hidden">
                    <img src={fingerprintImg} alt="AI Assistant" className="w-8 h-8 object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-xs font-medium text-primary">AI Assistant</span>
                </button>
              </div>
            )}
          </nav>
        </aside>

        {/* Mobile nav — horizontal scroll */}
        <div className="md:hidden w-full absolute left-0 right-0 px-4 mt-[-12px]">
          <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeSection === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground bg-secondary"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 mt-8 md:mt-0">
          {renderSection()}
        </main>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite to {trip.trip_name}</DialogTitle>
            <DialogDescription>Add fellow travelers and set your group type.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Group type */}
            <div className="space-y-2">
              <Label>Travel Group Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "couple",   emoji: "💑", label: "Couple" },
                  { value: "friends",  emoji: "🎉", label: "Friends" },
                  { value: "family",   emoji: "👨‍👩‍👧", label: "Family" },
                  { value: "business", emoji: "💼", label: "Business" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setGroupType(opt.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      groupType === opt.value
                        ? "border-primary bg-accent text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <span className="text-lg">{opt.emoji}</span> {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="emails">Email Addresses</Label>
              <Input
                id="emails"
                placeholder="friend@example.com, partner@example.com"
                value={inviteEmails}
                onChange={e => setInviteEmails(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Separate multiple emails with commas.</p>
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

      {/* AI Chat Widget — floating, opened via fingerprint or programmatically */}
      {isInProgress && (
        <AIChatWidget
          tripId={tripId!}
          destinationName={destination?.name}
          externalOpen={chatOpen ? true : undefined}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
