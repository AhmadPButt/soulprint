import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, ArrowLeft, Plane, DollarSign, Calendar, MapPin,
  Sparkles, Clock, Globe, Phone, ChevronDown, ChevronUp, Bookmark, Heart, GitCompare,
  Zap, Users, Eye, Diamond, AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FavoriteButton } from "@/components/FavoriteButton";
import { calculateAllTraits, TraitScores } from "@/lib/soulprint-traits";
import {
  getAffinityLabel,
  getAffinityColor,
  generateWhyItFits,
  generateTension,
  generateBestForTag,
  getDimensionExplanation,
  getDestinationPersonality,
} from "@/lib/destination-narratives";

interface Destination {
  id: string;
  name: string;
  country: string;
  region: string;
  description: string;
  short_description: string;
  image_url: string | null;
  image_credit: string | null;
  highlights: string[] | null;
  climate_tags: string[] | null;
  best_time_to_visit: string | null;
  avg_cost_per_day_gbp: number | null;
  flight_time_from_uk_hours: number | null;
  restorative_score: number | null;
  achievement_score: number | null;
  cultural_score: number | null;
  social_vibe_score: number | null;
  visual_score: number | null;
  culinary_score: number | null;
  nature_score: number | null;
  cultural_sensory_score: number | null;
  wellness_score: number | null;
  luxury_style_score: number | null;
}

function getDurationDays(duration?: string): number {
  if (!duration) return 7;
  const d = duration.toLowerCase();
  if (d.includes("weekend") || d.includes("2-3")) return 3;
  if (d.includes("week") || d.includes("5-7")) return 7;
  if (d.includes("10") || d.includes("two week") || d.includes("2 week")) return 10;
  if (d.includes("14")) return 14;
  return 7;
}

const PERSONALITY_ICONS: Record<string, React.ReactNode> = {
  pace: <Clock className="h-5 w-5 text-primary" />,
  socialVibe: <Users className="h-5 w-5 text-primary" />,
  sensoryIntensity: <Eye className="h-5 w-5 text-primary" />,
  luxuryStyle: <Diamond className="h-5 w-5 text-primary" />,
};

export default function DestinationDetail() {
  const { destinationId } = useParams<{ destinationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [respondent, setRespondent] = useState<any>(null);
  const [match, setMatch] = useState<any>(null);
  const [context, setContext] = useState<any>(null);
  const [computed, setComputed] = useState<any>(null);
  const [traits, setTraits] = useState<TraitScores | null>(null);

  const [generating, setGenerating] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState<any>(null);
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});
  const [showCalendly, setShowCalendly] = useState(false);
  const [showSaveTrip, setShowSaveTrip] = useState(false);
  const [tripName, setTripName] = useState("");
  const [savingTrip, setSavingTrip] = useState(false);

  useEffect(() => {
    loadData();
  }, [destinationId]);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/auth"); return; }

      const [destRes, respRes, ctxRes] = await Promise.all([
        supabase.from("echoprint_destinations").select("*").eq("id", destinationId!).single(),
        supabase.from("respondents").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(1).single(),
        supabase.from("context_intake").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(1).single(),
      ]);

      if (destRes.error || !destRes.data) {
        toast({ title: "Destination not found", variant: "destructive" });
        navigate("/dashboard"); return;
      }
      setDestination(destRes.data as Destination);
      setContext(ctxRes.data);

      if (respRes.data) {
        setRespondent(respRes.data);
        const [matchRes, compRes] = await Promise.all([
          supabase.from("destination_matches").select("*").eq("respondent_id", respRes.data.id).eq("destination_id", destinationId!).maybeSingle(),
          supabase.from("computed_scores").select("*").eq("respondent_id", respRes.data.id).maybeSingle(),
        ]);
        setMatch(matchRes.data);
        setComputed(compRes.data);
        setTraits(calculateAllTraits(respRes.data.raw_responses, compRes.data));

        if (matchRes.data) {
          trackEvent("destination_viewed", { destination_id: destinationId, fit_score: matchRes.data.fit_score, rank: matchRes.data.rank });
          supabase.from("destination_matches")
            .update({ shown_to_user: true, clicked_by_user: true, clicked_at: new Date().toISOString() })
            .eq("id", matchRes.data.id).then(() => {});
        }
      }
    } catch (err) {
      console.error("Error loading destination:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateItinerary = async () => {
    if (!respondent || !destination) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-itinerary", {
        body: {
          respondent_id: respondent.id,
          destination_id: destination.id,
          destination_name: destination.name,
          destination_country: destination.country,
          destination_description: destination.description,
          destination_highlights: destination.highlights,
          duration_days: getDurationDays(context?.duration),
          force_regenerate: true,
        },
      });
      if (error) throw error;
      trackEvent("itinerary_generated", { destination_id: destination.id, destination_name: destination.name });
      setGeneratedItinerary(data?.itinerary);
      toast({ title: "Itinerary generated!", description: `Your ${destination.name} itinerary is ready.` });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAsTrip = async () => {
    if (!tripName.trim() || !respondent || !destination) return;
    setSavingTrip(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: trip, error } = await supabase.from("trips").insert({
        trip_name: tripName, created_by: session.user.id, trip_type: context?.occasion || "solo",
        status: "planning", destination_id: destination.id, context_intake_id: context?.id || null,
        respondent_id: respondent.id, budget_range: context?.budget_range || null,
      }).select().single();
      if (error) throw error;
      trackEvent("trip_created", { destination_id: destination.id, trip_name: tripName });
      await supabase.from("trip_members").insert({
        trip_id: trip.id, user_id: session.user.id, email: session.user.email!,
        role: "primary", invitation_status: "accepted", respondent_id: respondent.id,
        accepted_at: new Date().toISOString(),
      });
      toast({ title: "Trip created!", description: `${tripName} has been saved.` });
      setShowSaveTrip(false); setTripName("");
      navigate(`/trips/${trip.id}`);
    } catch (err: any) {
      toast({ title: "Failed to save trip", description: err.message, variant: "destructive" });
    } finally {
      setSavingTrip(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!destination) return null;

  const fitScore = match ? Math.round(match.fit_score) : null;
  const breakdown = match?.fit_breakdown as Record<string, number> | null;
  const personality = getDestinationPersonality(destination);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        {destination.image_url ? (
          <img src={destination.image_url} alt={destination.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        <div className="absolute top-4 left-4 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")} className="bg-background/80 backdrop-blur">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">{destination.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-lg text-muted-foreground">{destination.country} · {destination.region}</span>
              {fitScore !== null && (
                <Badge className={`text-sm font-bold px-3 py-1 border ${getAffinityColor(fitScore)}`}>
                  {getAffinityLabel(fitScore)}
                </Badge>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* ── SECTION 1: Why You'll Thrive Here ── */}
        {traits && breakdown && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="h-6 w-6 text-primary" /> Why You'll Thrive Here
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personalised narrative */}
              <p className="text-base text-muted-foreground leading-relaxed">
                {(breakdown as any)?.narrative ?? generateWhyItFits(destination.name, traits, breakdown, destination)}
              </p>

              {/* Top 3 matching dimensions with explanations */}
              <div className="space-y-4">
                {Object.entries(breakdown)
                  .filter(([key]) => key !== "narrative" && key !== "tension")
                  .sort(([, a], [, b]) => Number(b) - Number(a))
                  .slice(0, 3)
                  .map(([key, val]) => {
                    const score = Math.round(Number(val));
                    return (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-semibold capitalize">{key} Match</span>
                          <span className="text-sm font-bold text-primary">{score}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted/50 overflow-hidden mb-1.5">
                          <motion.div
                            className="h-full rounded-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {getDimensionExplanation(key, score, traits, destination.name)}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── SECTION 2: What to Expect ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">What to Expect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Personality attributes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(personality).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/30 border border-border/50">
                  {PERSONALITY_ICONS[key]}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {key === "socialVibe" ? "Social Vibe" : key === "sensoryIntensity" ? "Sensory" : key === "luxuryStyle" ? "Luxury" : "Pace"}
                    </p>
                    <p className="text-sm font-semibold text-foreground">{val}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {destination.description}
            </p>

            {/* Key stats */}
            <div className="flex flex-wrap gap-3">
              {destination.flight_time_from_uk_hours != null && (
                <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
                  <Plane className="h-3.5 w-3.5" /> {destination.flight_time_from_uk_hours}h from UK
                </Badge>
              )}
              {destination.avg_cost_per_day_gbp != null && (
                <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
                  <DollarSign className="h-3.5 w-3.5" /> £{destination.avg_cost_per_day_gbp}/day
                </Badge>
              )}
              {destination.best_time_to_visit && (
                <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
                  <Calendar className="h-3.5 w-3.5" /> {destination.best_time_to_visit}
                </Badge>
              )}
              {destination.climate_tags?.map((tag, i) => (
                <Badge key={i} variant="secondary" className="py-1.5 px-3">{tag}</Badge>
              ))}
            </div>

            {/* Highlights */}
            {destination.highlights && destination.highlights.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {destination.highlights.map((h, i) => (
                  <Badge key={i} variant="outline" className="font-normal">{h}</Badge>
                ))}
              </div>
            )}

            {/* Full dimension breakdown (moved from cards) */}
            {breakdown && traits && (
              <div className="pt-4 border-t border-border/50 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Fit Breakdown</p>
                {Object.entries(breakdown)
                  .filter(([key]) => key !== "narrative" && key !== "tension")
                  .map(([key, val]) => {
                    const score = Math.round(Number(val));
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xs capitalize text-muted-foreground w-16">{key}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                          <div className="h-full rounded-full bg-primary/70" style={{ width: `${score}%` }} />
                        </div>
                        <span className="text-xs font-medium text-foreground w-8 text-right">{score}%</span>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Destination Profile Scores */}
            <div className="pt-4 border-t border-border/50 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Destination Profile</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {[
                  { label: "Restorative", val: destination.restorative_score },
                  { label: "Achievement", val: destination.achievement_score },
                  { label: "Cultural", val: destination.cultural_score },
                  { label: "Social Vibe", val: destination.social_vibe_score },
                  { label: "Visual", val: destination.visual_score },
                  { label: "Culinary", val: destination.culinary_score },
                  { label: "Nature", val: destination.nature_score },
                  { label: "Wellness", val: destination.wellness_score },
                  { label: "Luxury", val: destination.luxury_style_score },
                ].filter(s => s.val != null).map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-medium">{s.val}</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
                      <div className="h-full rounded-full bg-primary/60" style={{ width: `${s.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── SECTION 3: One Honest Note ── */}
        {traits && (
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> One Honest Note
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {(breakdown as any)?.tension ?? generateTension(destination.name, traits, destination)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── SECTION 4: Actions ── */}
        <Card className="border-primary/20">
          <CardContent className="p-6 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="gap-2"
              onClick={handleGenerateItinerary}
              disabled={generating || !respondent}
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Build My Itinerary</>
              )}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="gap-2"
              onClick={() => { setTripName(`${destination.name} Trip`); setShowSaveTrip(true); }}
              disabled={!respondent}
            >
              <Bookmark className="h-4 w-4" /> Save as Trip
            </Button>
            <FavoriteButton destinationId={destination.id} />
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={() => navigate(`/compare?destinations=${destination.id}`)}
            >
              <GitCompare className="h-4 w-4" /> Compare
            </Button>
          </CardContent>
        </Card>

        {/* Generated Itinerary */}
        {generatedItinerary && (
          <Card>
            <CardHeader>
              <CardTitle>{generatedItinerary.title || "Your Personalized Itinerary"}</CardTitle>
              {generatedItinerary.overview && <CardDescription>{generatedItinerary.overview}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-3">
              {generatedItinerary.days?.map((day: any) => (
                <div key={day.day} className="border border-border/50 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedDays(prev => ({ ...prev, [day.day]: !prev[day.day] }))}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div>
                      <span className="text-sm font-bold text-primary">Day {day.day}</span>
                      <span className="text-sm text-foreground ml-2">{day.title || day.theme || ""}</span>
                    </div>
                    {expandedDays[day.day] ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {expandedDays[day.day] && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border/30">
                      {day.locations ? (
                        day.locations.map((loc: any, i: number) => (
                          <div key={i} className="pl-4 border-l-2 border-primary/20 py-2">
                            <p className="text-xs text-muted-foreground uppercase">{loc.time}</p>
                            <p className="font-medium text-sm">{loc.name || loc.activity}</p>
                            {loc.activity && loc.name && <p className="text-xs text-muted-foreground">{loc.activity}</p>}
                            {loc.psychological_alignment && <p className="text-xs text-primary/70 mt-1 italic">{loc.psychological_alignment}</p>}
                          </div>
                        ))
                      ) : (
                        <>
                          {day.morning && (
                            <div className="pl-4 border-l-2 border-primary/20 py-2">
                              <p className="text-xs text-muted-foreground uppercase">Morning — {day.morning.time || ""}</p>
                              <p className="font-medium text-sm">{day.morning.activity}</p>
                              {day.morning.why_it_fits && <p className="text-xs text-primary/70 mt-1 italic">{day.morning.why_it_fits}</p>}
                            </div>
                          )}
                          {day.afternoon && (
                            <div className="pl-4 border-l-2 border-accent/30 py-2">
                              <p className="text-xs text-muted-foreground uppercase">Afternoon — {day.afternoon.time || ""}</p>
                              <p className="font-medium text-sm">{day.afternoon.activity}</p>
                              {day.afternoon.why_it_fits && <p className="text-xs text-primary/70 mt-1 italic">{day.afternoon.why_it_fits}</p>}
                            </div>
                          )}
                          {day.evening && (
                            <div className="pl-4 border-l-2 border-muted py-2">
                              <p className="text-xs text-muted-foreground uppercase">Evening — {day.evening.time || ""}</p>
                              <p className="font-medium text-sm">{day.evening.activity}</p>
                              {day.evening.why_it_fits && <p className="text-xs text-primary/70 mt-1 italic">{day.evening.why_it_fits}</p>}
                            </div>
                          )}
                        </>
                      )}
                      {day.accommodation && (
                        <div className="mt-2 p-3 bg-muted/20 rounded-lg">
                          <p className="text-xs text-muted-foreground uppercase mb-1">Accommodation</p>
                          <p className="text-sm font-medium">{day.accommodation.name}</p>
                          {day.accommodation.why && <p className="text-xs text-muted-foreground">{day.accommodation.why}</p>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {generatedItinerary.practical_notes && (
                <div className="mt-4 p-4 bg-muted/20 rounded-lg space-y-2">
                  <p className="text-sm font-semibold">Practical Notes</p>
                  {Object.entries(generatedItinerary.practical_notes).map(([k, v]) => (
                    <p key={k} className="text-xs text-muted-foreground">
                      <span className="capitalize font-medium">{k.replace(/_/g, " ")}: </span>{String(v)}
                    </p>
                  ))}
                </div>
              )}

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
        )}
      </div>

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

      {/* Save as Trip Dialog */}
      <Dialog open={showSaveTrip} onOpenChange={setShowSaveTrip}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Trip</DialogTitle>
            <DialogDescription>Create a trip to start planning your journey to {destination.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tripName">Trip Name</Label>
              <Input id="tripName" placeholder="e.g. Summer Getaway 2026" value={tripName} onChange={e => setTripName(e.target.value)} />
            </div>
            <Button onClick={handleSaveAsTrip} disabled={savingTrip || !tripName.trim()} className="w-full">
              {savingTrip ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bookmark className="h-4 w-4 mr-2" />}
              Create Trip
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
