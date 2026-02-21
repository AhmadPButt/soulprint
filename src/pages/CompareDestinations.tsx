import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, MapPin, Sparkles, Check, Bookmark } from "lucide-react";
import { motion } from "framer-motion";
import { calculateAllTraits, TraitScores } from "@/lib/soulprint-traits";
import {
  getAffinityLabel,
  getAffinityColor,
  generateWhyItFits,
  generateTension,
  generateBestForTag,
} from "@/lib/destination-narratives";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface DestWithMatch {
  id: string;
  name: string;
  country: string;
  region: string;
  description: string;
  short_description: string;
  image_url: string | null;
  highlights: string[] | null;
  climate_tags: string[] | null;
  best_time_to_visit: string | null;
  avg_cost_per_day_gbp: number | null;
  flight_time_from_uk_hours: number | null;
  restorative_score: number | null;
  cultural_score: number | null;
  nature_score: number | null;
  wellness_score: number | null;
  culinary_score: number | null;
  visual_score: number | null;
  social_vibe_score: number | null;
  luxury_style_score: number | null;
  fit_score?: number;
  fit_breakdown?: Record<string, number>;
}

export default function CompareDestinations() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [destinations, setDestinations] = useState<DestWithMatch[]>([]);
  const [traits, setTraits] = useState<TraitScores | null>(null);
  const [showSaveTrip, setShowSaveTrip] = useState<string | null>(null);
  const [tripName, setTripName] = useState("");
  const [savingTrip, setSavingTrip] = useState(false);

  const ids = searchParams.get("destinations")?.split(",").filter(Boolean) || [];

  useEffect(() => { loadDestinations(); }, []);

  const loadDestinations = async () => {
    if (ids.length < 2) { setLoading(false); return; }

    const { data: { session } } = await supabase.auth.getSession();
    const { data: dests } = await supabase.from("echoprint_destinations").select("*").in("id", ids);
    if (!dests) { setLoading(false); return; }

    let matchMap = new Map<string, { fit_score: number; fit_breakdown: any }>();
    if (session) {
      const { data: respondent } = await supabase.from("respondents").select("id, raw_responses").eq("user_id", session.user.id).single();
      if (respondent) {
        const { data: matches } = await supabase.from("destination_matches").select("destination_id, fit_score, fit_breakdown").eq("respondent_id", respondent.id).in("destination_id", ids);
        matches?.forEach(m => matchMap.set(m.destination_id, { fit_score: m.fit_score, fit_breakdown: m.fit_breakdown }));

        const { data: computed } = await supabase.from("computed_scores").select("*").eq("respondent_id", respondent.id).maybeSingle();
        setTraits(calculateAllTraits(respondent.raw_responses, computed));
      }
    }

    const enriched = dests.map(d => ({
      ...d,
      fit_score: matchMap.get(d.id)?.fit_score,
      fit_breakdown: matchMap.get(d.id)?.fit_breakdown as Record<string, number> | undefined,
    }));

    setDestinations(enriched);
    setLoading(false);
  };

  const handlePlanTrip = async (destId: string) => {
    if (!tripName.trim()) return;
    setSavingTrip(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: respondent } = await supabase.from("respondents").select("id").eq("user_id", session.user.id).single();
      const { data: trip, error } = await supabase.from("trips").insert({
        trip_name: tripName, created_by: session.user.id, trip_type: "solo",
        status: "planning", destination_id: destId, respondent_id: respondent?.id || null,
      }).select().single();
      if (error) throw error;
      await supabase.from("trip_members").insert({
        trip_id: trip.id, user_id: session.user.id, email: session.user.email!,
        role: "primary", invitation_status: "accepted", accepted_at: new Date().toISOString(),
      });
      toast.success("Trip created!");
      navigate(`/trips/${trip.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create trip");
    } finally {
      setSavingTrip(false);
      setShowSaveTrip(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (destinations.length < 2) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <h2 className="text-xl font-bold mb-2">Select Destinations to Compare</h2>
          <p className="text-muted-foreground mb-4">Add at least 2 destinations from your dashboard to compare them side-by-side.</p>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  // Recommendation banner
  const withScores = destinations.filter(d => d.fit_score != null).sort((a, b) => b.fit_score! - a.fit_score!);
  const topDest = withScores.length >= 2 && (withScores[0].fit_score! - withScores[1].fit_score!) > 10 ? withScores[0] : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Compare Destinations</h1>
            <p className="text-muted-foreground">Psychology-first comparison of {destinations.length} destinations</p>
          </div>
        </div>

        {/* Recommendation Banner */}
        {topDest && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm font-medium text-foreground">
              Based on your SoulPrint, <strong>{topDest.name}</strong> is your strongest match.
            </p>
          </motion.div>
        )}

        {/* Comparison Columns */}
        <div className={`grid gap-6 ${destinations.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"}`}>
          {destinations.map((d, idx) => {
            const score = d.fit_score != null ? Math.round(d.fit_score) : null;
            const breakdown = d.fit_breakdown;
            const bestFor = generateBestForTag(d);
            const narrative = traits && breakdown
              ? generateWhyItFits(d.name, traits, breakdown, d)
              : d.short_description || d.description?.slice(0, 120);
            const tension = traits
              ? generateTension(d.name, traits, d)
              : null;

            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="overflow-hidden h-full flex flex-col">
                  {/* Image */}
                  <div className="h-40 bg-muted cursor-pointer" onClick={() => navigate(`/destination/${d.id}`)}>
                    {d.image_url ? (
                      <img src={d.image_url} alt={d.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/5">
                        <MapPin className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-5 flex-1 flex flex-col space-y-4">
                    {/* Row 1: Score + Affinity */}
                    <div className="text-center">
                      <h3 className="text-xl font-bold">{d.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{d.country}</p>
                      {score !== null && (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-3xl font-bold text-primary">{score}%</span>
                          <Badge className={`text-xs border ${getAffinityColor(score)}`}>{getAffinityLabel(score)}</Badge>
                        </div>
                      )}
                    </div>

                    {/* Row 2: Why it fits */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Why it fits you</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{narrative}</p>
                    </div>

                    {/* Row 3: Dimension bars */}
                    {breakdown && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dimensions</p>
                        {Object.entries(breakdown)
                          .filter(([key]) => key !== "narrative" && key !== "tension")
                          .map(([key, val]) => {
                            const s = Math.round(Number(val));
                            const isBest = withScores.length > 0 && destinations.every(od => {
                              const ob = od.fit_breakdown;
                              if (!ob) return true;
                              return s >= Math.round(Number((ob as any)[key] ?? 0));
                            });
                            return (
                              <div key={key} className="flex items-center gap-2">
                                <span className="text-[10px] capitalize text-muted-foreground w-14">{key}</span>
                                <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                                  <div className={`h-full rounded-full ${isBest ? "bg-primary" : "bg-primary/50"}`} style={{ width: `${s}%` }} />
                                </div>
                                <span className="text-[10px] font-medium w-7 text-right">{s}%</span>
                                {isBest && <Check className="h-3 w-3 text-primary" />}
                              </div>
                            );
                          })}
                      </div>
                    )}

                    {/* Row 4: Honest tension */}
                    {tension && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Honest note</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{tension}</p>
                      </div>
                    )}

                    {/* Row 5: Best for tag */}
                    <div className="mt-auto pt-2">
                      <Badge variant="secondary" className="text-xs">{bestFor}</Badge>
                    </div>

                    {/* Plan This Trip */}
                    <Button
                      className="w-full gap-2"
                      onClick={() => { setTripName(`${d.name} Trip`); setShowSaveTrip(d.id); }}
                    >
                      <Bookmark className="h-4 w-4" /> Plan This Trip
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Save Trip Dialog */}
      <Dialog open={!!showSaveTrip} onOpenChange={() => setShowSaveTrip(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Plan This Trip</DialogTitle>
            <DialogDescription>Create a trip to start planning.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Trip Name</Label>
              <Input value={tripName} onChange={e => setTripName(e.target.value)} placeholder="e.g. Summer 2026" />
            </div>
            <Button onClick={() => showSaveTrip && handlePlanTrip(showSaveTrip)} disabled={savingTrip || !tripName.trim()} className="w-full">
              {savingTrip ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bookmark className="h-4 w-4 mr-2" />}
              Create Trip
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
