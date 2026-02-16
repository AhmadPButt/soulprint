import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Star, Plane, DollarSign, Calendar, MapPin, Check, X } from "lucide-react";

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

const DIMENSION_LABELS: Record<string, string> = {
  restorative_score: "Restorative",
  cultural_score: "Cultural",
  nature_score: "Nature",
  wellness_score: "Wellness",
  culinary_score: "Culinary",
  visual_score: "Visual",
  social_vibe_score: "Social Vibe",
  luxury_style_score: "Luxury Style",
};

export default function CompareDestinations() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [destinations, setDestinations] = useState<DestWithMatch[]>([]);

  const ids = searchParams.get("destinations")?.split(",").filter(Boolean) || [];

  useEffect(() => {
    loadDestinations();
  }, []);

  const loadDestinations = async () => {
    if (ids.length < 2) { setLoading(false); return; }

    const { data: { session } } = await supabase.auth.getSession();

    const { data: dests } = await supabase
      .from("echoprint_destinations")
      .select("*")
      .in("id", ids);

    if (!dests) { setLoading(false); return; }

    // Try to get match scores
    let matchMap = new Map<string, { fit_score: number; fit_breakdown: any }>();
    if (session) {
      const { data: respondent } = await supabase
        .from("respondents")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (respondent) {
        const { data: matches } = await supabase
          .from("destination_matches")
          .select("destination_id, fit_score, fit_breakdown")
          .eq("respondent_id", respondent.id)
          .in("destination_id", ids);

        matches?.forEach(m => matchMap.set(m.destination_id, {
          fit_score: m.fit_score,
          fit_breakdown: m.fit_breakdown,
        }));
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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

  const getBest = (key: string) => {
    const vals = destinations.map(d => ({ id: d.id, val: (d as any)[key] })).filter(v => v.val != null);
    if (vals.length === 0) return null;
    return vals.reduce((best, curr) => curr.val > best.val ? curr : best).id;
  };

  const getCheapest = () => {
    const vals = destinations.filter(d => d.avg_cost_per_day_gbp != null);
    if (vals.length === 0) return null;
    return vals.reduce((best, curr) => (curr.avg_cost_per_day_gbp! < best.avg_cost_per_day_gbp! ? curr : best)).id;
  };

  const getShortest = () => {
    const vals = destinations.filter(d => d.flight_time_from_uk_hours != null);
    if (vals.length === 0) return null;
    return vals.reduce((best, curr) => (curr.flight_time_from_uk_hours! < best.flight_time_from_uk_hours! ? curr : best)).id;
  };

  const bestFit = (() => {
    const withScore = destinations.filter(d => d.fit_score != null);
    if (withScore.length === 0) return null;
    return withScore.reduce((best, curr) => (curr.fit_score! > best.fit_score! ? curr : best)).id;
  })();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Compare Destinations</h1>
            <p className="text-muted-foreground">Side-by-side comparison of {destinations.length} destinations</p>
          </div>
        </div>

        {/* Header Row with Images */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${destinations.length}, 1fr)` }}>
          <div /> {/* empty corner */}
          {destinations.map(d => (
            <Card key={d.id} className="overflow-hidden cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate(`/destination/${d.id}`)}>
              <div className="h-32 bg-muted">
                {d.image_url ? (
                  <img src={d.image_url} alt={d.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5">
                    <MapPin className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <CardContent className="p-3 text-center">
                <h3 className="font-bold">{d.name}</h3>
                <p className="text-xs text-muted-foreground">{d.country}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="mt-6 border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {/* Fit Score */}
              <CompareRow
                label="Fit Score"
                icon={<Star className="h-4 w-4" />}
                values={destinations.map(d => d.fit_score != null ? `${Math.round(d.fit_score)}%` : "—")}
                bestId={bestFit}
                ids={destinations.map(d => d.id)}
              />

              {/* Cost */}
              <CompareRow
                label="Cost/Day"
                icon={<DollarSign className="h-4 w-4" />}
                values={destinations.map(d => d.avg_cost_per_day_gbp != null ? `£${d.avg_cost_per_day_gbp}` : "—")}
                bestId={getCheapest()}
                ids={destinations.map(d => d.id)}
              />

              {/* Flight Time */}
              <CompareRow
                label="Flight (UK)"
                icon={<Plane className="h-4 w-4" />}
                values={destinations.map(d => d.flight_time_from_uk_hours != null ? `${d.flight_time_from_uk_hours}h` : "—")}
                bestId={getShortest()}
                ids={destinations.map(d => d.id)}
              />

              {/* Best Time */}
              <CompareRow
                label="Best Time"
                icon={<Calendar className="h-4 w-4" />}
                values={destinations.map(d => d.best_time_to_visit || "—")}
                ids={destinations.map(d => d.id)}
              />

              {/* Climate */}
              <CompareRow
                label="Climate"
                values={destinations.map(d => d.climate_tags?.join(", ") || "—")}
                ids={destinations.map(d => d.id)}
              />

              {/* Dimension Scores */}
              {Object.entries(DIMENSION_LABELS).map(([key, label]) => (
                <CompareRow
                  key={key}
                  label={label}
                  values={destinations.map(d => {
                    const v = (d as any)[key];
                    return v != null ? `${v}/100` : "—";
                  })}
                  bestId={getBest(key)}
                  ids={destinations.map(d => d.id)}
                />
              ))}

              {/* Highlights */}
              <tr className="border-t">
                <td className="p-3 font-medium text-muted-foreground bg-muted/30 align-top w-[200px]">Highlights</td>
                {destinations.map(d => (
                  <td key={d.id} className="p-3 align-top">
                    <div className="flex flex-wrap gap-1">
                      {d.highlights?.slice(0, 5).map((h, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] font-normal">{h}</Badge>
                      )) || <span className="text-muted-foreground">—</span>}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CompareRow({ label, icon, values, bestId, ids }: {
  label: string;
  icon?: React.ReactNode;
  values: string[];
  bestId?: string | null;
  ids: string[];
}) {
  return (
    <tr className="border-t">
      <td className="p-3 font-medium text-muted-foreground bg-muted/30 w-[200px]">
        <span className="flex items-center gap-1.5">{icon}{label}</span>
      </td>
      {values.map((val, i) => (
        <td key={ids[i]} className={`p-3 text-center font-medium ${bestId === ids[i] ? "text-primary bg-primary/5" : ""}`}>
          {val}
          {bestId === ids[i] && <Check className="inline-block h-3 w-3 ml-1 text-primary" />}
        </td>
      ))}
    </tr>
  );
}
