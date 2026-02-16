import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Loader2, ArrowLeft, Plane, DollarSign, Calendar, MapPin,
  Star, Sparkles, Clock, Globe, Phone, ChevronDown, ChevronUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculateAllTraits, TraitScores } from "@/lib/soulprint-traits";

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

function getMatchColor(score: number) {
  if (score >= 85) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
  if (score >= 70) return "bg-primary/20 text-primary border-primary/40";
  return "bg-accent/20 text-accent-foreground border-accent/40";
}

function generateMatchExplanation(key: string, score: number, traits: TraitScores, dest: Destination): string {
  const s = Math.round(score);
  switch (key) {
    case "energy":
      return traits.energy < 50
        ? `Your preference for restorative experiences aligns ${s >= 80 ? "perfectly" : "well"} with ${dest.name}'s calm pace and natural beauty.`
        : `Your adventurous spirit ${s >= 80 ? "perfectly matches" : "connects well with"} ${dest.name}'s active exploration opportunities.`;
    case "social":
      return traits.social < 50
        ? `The intimate, uncrowded vibe matches your preference for privacy and quiet spaces.`
        : `The social atmosphere and communal experiences align with your outgoing nature.`;
    case "sensory":
      return `Your top sensory priorities — ${traits.sensory.top1} and ${traits.sensory.top2} — are ${s >= 85 ? "defining features" : "well-represented"} in ${dest.name}.`;
    case "luxury":
      return traits.luxury < 50
        ? `Authentic, locally-rooted experiences with rustic elegance match your luxury style.`
        : `Polished, seamless service and refined accommodations suit your taste perfectly.`;
    default:
      return `This dimension scores ${s}% alignment with your profile.`;
  }
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
  const [showItinerary, setShowItinerary] = useState(false);
  const [showCalendly, setShowCalendly] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadData();
  }, [destinationId]);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }

      // Fetch all data in parallel
      const [destRes, respRes, ctxRes] = await Promise.all([
        supabase.from("echoprint_destinations").select("*").eq("id", destinationId!).single(),
        supabase.from("respondents").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(1).single(),
        supabase.from("context_intake").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(1).single(),
      ]);

      if (destRes.error || !destRes.data) {
        toast({ title: "Destination not found", variant: "destructive" });
        navigate("/dashboard");
        return;
      }
      setDestination(destRes.data as Destination);
      setContext(ctxRes.data);

      if (respRes.data) {
        setRespondent(respRes.data);

        // Fetch match + computed scores
        const [matchRes, compRes] = await Promise.all([
          supabase.from("destination_matches").select("*").eq("respondent_id", respRes.data.id).eq("destination_id", destinationId!).maybeSingle(),
          supabase.from("computed_scores").select("*").eq("respondent_id", respRes.data.id).maybeSingle(),
        ]);

        setMatch(matchRes.data);
        setComputed(compRes.data);
        setTraits(calculateAllTraits(respRes.data.raw_responses, compRes.data));

        // Track view
        if (matchRes.data) {
          supabase.from("destination_matches")
            .update({ shown_to_user: true, clicked_by_user: true, clicked_at: new Date().toISOString() })
            .eq("id", matchRes.data.id)
            .then(() => {});
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

      setGeneratedItinerary(data?.itinerary);
      setShowItinerary(true);
      toast({ title: "Itinerary generated!", description: `Your ${destination.name} itinerary is ready.` });
    } catch (err: any) {
      console.error("Itinerary generation error:", err);
      toast({ title: "Generation failed", description: err.message || "Please try again.", variant: "destructive" });
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

  if (!destination) return null;

  const fitScore = match ? Math.round(match.fit_score) : null;
  const breakdown = match?.fit_breakdown as Record<string, number> | null;

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

        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")} className="bg-background/80 backdrop-blur">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>

        {/* Fit Score */}
        {fitScore !== null && (
          <div className="absolute top-4 right-4">
            <Badge className={`text-lg font-bold px-4 py-2 border ${getMatchColor(fitScore)}`}>
              <Star className="h-4 w-4 mr-1.5" /> {fitScore}% Match
            </Badge>
          </div>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">{destination.name}</h1>
            <p className="text-lg text-muted-foreground mt-1">{destination.country} · {destination.region}</p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Key Stats */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Overview + Match Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{destination.description}</p>
                {destination.highlights && destination.highlights.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Highlights</p>
                    <div className="flex flex-wrap gap-2">
                      {destination.highlights.map((h, i) => (
                        <Badge key={i} variant="outline" className="font-normal">{h}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Why This Matches You */}
            {breakdown && traits && (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> Why This Matches You
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {Object.entries(breakdown).map(([key, val]) => {
                    const score = Math.round(Number(val));
                    return (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium capitalize">{key} Match</span>
                          <span className="text-sm font-bold text-primary">{score}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted/50 overflow-hidden mb-2">
                          <motion.div
                            className="h-full rounded-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {generateMatchExplanation(key, score, traits, destination)}
                        </p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Generated Itinerary (inline) */}
            {generatedItinerary && (
              <Card>
                <CardHeader>
                  <CardTitle>{generatedItinerary.title || "Your Personalized Itinerary"}</CardTitle>
                  {generatedItinerary.overview && (
                    <CardDescription>{generatedItinerary.overview}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {generatedItinerary.days?.map((day: any) => (
                    <div key={day.day} className="border border-border/50 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleDay(day.day)}
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
                          {/* Support both location-based and time-slot-based itineraries */}
                          {day.locations ? (
                            day.locations.map((loc: any, i: number) => (
                              <div key={i} className="pl-4 border-l-2 border-primary/20 py-2">
                                <p className="text-xs text-muted-foreground uppercase">{loc.time}</p>
                                <p className="font-medium text-sm">{loc.name || loc.activity}</p>
                                {loc.activity && loc.name && <p className="text-xs text-muted-foreground">{loc.activity}</p>}
                                {loc.psychological_alignment && (
                                  <p className="text-xs text-primary/70 mt-1 italic">{loc.psychological_alignment}</p>
                                )}
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

                  {/* Practical Notes */}
                  {generatedItinerary.practical_notes && (
                    <div className="mt-4 p-4 bg-muted/20 rounded-lg space-y-2">
                      <p className="text-sm font-semibold">Practical Notes</p>
                      {Object.entries(generatedItinerary.practical_notes).map(([k, v]) => (
                        <p key={k} className="text-xs text-muted-foreground">
                          <span className="capitalize font-medium">{k.replace(/_/g, " ")}: </span>
                          {String(v)}
                        </p>
                      ))}
                    </div>
                  )}

                  {generatedItinerary.packing_tips && (
                    <div className="mt-2 p-4 bg-muted/20 rounded-lg">
                      <p className="text-sm font-semibold mb-1">Packing Tips</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {generatedItinerary.packing_tips.map((tip: string, i: number) => (
                          <li key={i} className="text-xs text-muted-foreground">{tip}</li>
                        ))}
                      </ul>
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

          {/* Right column: CTAs + Details */}
          <div className="space-y-6">
            {/* CTA Card */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-6 space-y-4">
                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={handleGenerateItinerary}
                  disabled={generating || !respondent}
                >
                  {generating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Generate My Itinerary</>
                  )}
                </Button>
                <Button variant="outline" size="lg" className="w-full gap-2" onClick={() => setShowCalendly(true)}>
                  <Phone className="h-4 w-4" /> Speak to Travel Expert
                </Button>
                {!respondent && (
                  <p className="text-xs text-muted-foreground text-center">
                    Complete your questionnaire to generate a personalized itinerary.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Key Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Key Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow icon={<DollarSign className="h-4 w-4" />} label="Average Cost" value={destination.avg_cost_per_day_gbp ? `£${destination.avg_cost_per_day_gbp}/day` : "—"} />
                <DetailRow icon={<Plane className="h-4 w-4" />} label="Flight Time" value={destination.flight_time_from_uk_hours ? `${destination.flight_time_from_uk_hours} hours from UK` : "—"} />
                <DetailRow icon={<Calendar className="h-4 w-4" />} label="Best Time" value={destination.best_time_to_visit || "—"} />
                <DetailRow icon={<Globe className="h-4 w-4" />} label="Region" value={destination.region} />
              </CardContent>
            </Card>

            {/* Destination Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Destination Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ScoreBar label="Restorative" value={destination.restorative_score} />
                <ScoreBar label="Achievement" value={destination.achievement_score} />
                <ScoreBar label="Cultural" value={destination.cultural_score} />
                <ScoreBar label="Social Vibe" value={destination.social_vibe_score} />
                <ScoreBar label="Visual" value={destination.visual_score} />
                <ScoreBar label="Culinary" value={destination.culinary_score} />
                <ScoreBar label="Nature" value={destination.nature_score} />
                <ScoreBar label="Wellness" value={destination.wellness_score} />
                <ScoreBar label="Luxury" value={destination.luxury_style_score} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Calendly Dialog */}
      <Dialog open={showCalendly} onOpenChange={setShowCalendly}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Book Your Travel Consultation</DialogTitle>
            <DialogDescription>
              30-minute complimentary consultation with an Erranza expert to refine your {destination.name} trip.
            </DialogDescription>
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

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">{icon} {label}</div>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null;
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium">{value}</span>
      </div>
      <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
        <div className="h-full rounded-full bg-primary/60" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
