import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, TrendingUp, Target, AlertTriangle } from "lucide-react";

interface MatchWithReflection {
  id: string;
  fit_score: number;
  actual_satisfaction: number | null;
  prediction_accuracy: number | null;
  destination_name: string;
  respondent_name: string;
  nps_score: number | null;
}

export function AlgorithmPerformanceTab() {
  const [matches, setMatches] = useState<MatchWithReflection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      // Get all matches that have actual_satisfaction data
      const { data: matchData, error } = await supabase
        .from("destination_matches")
        .select(`
          id, fit_score, actual_satisfaction, prediction_accuracy,
          echoprint_destinations(name),
          respondents(name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Also get reflections with NPS scores
      const { data: reflections } = await supabase
        .from("trip_reflections")
        .select("respondent_id, nps_score");

      const npsMap = new Map(
        (reflections || []).map(r => [r.respondent_id, r.nps_score])
      );

      const processed = (matchData || []).map((m: any) => ({
        id: m.id,
        fit_score: m.fit_score,
        actual_satisfaction: m.actual_satisfaction,
        prediction_accuracy: m.prediction_accuracy,
        destination_name: m.echoprint_destinations?.name || "Unknown",
        respondent_name: m.respondents?.name || "Unknown",
        nps_score: npsMap.get(m.respondent_id) ?? null,
      }));

      setMatches(processed);
    } catch (error) {
      console.error("Error loading performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const withAccuracy = matches.filter(m => m.prediction_accuracy !== null);
  const avgAccuracy = withAccuracy.length > 0
    ? withAccuracy.reduce((sum, m) => sum + (m.prediction_accuracy || 0), 0) / withAccuracy.length
    : null;

  const withNps = matches.filter(m => m.nps_score !== null);
  const avgNps = withNps.length > 0
    ? withNps.reduce((sum, m) => sum + (m.nps_score || 0), 0) / withNps.length
    : null;

  // Group by destination
  const destStats = new Map<string, { total: number; accuracy: number[]; nps: number[] }>();
  matches.forEach(m => {
    const stats = destStats.get(m.destination_name) || { total: 0, accuracy: [], nps: [] };
    stats.total++;
    if (m.prediction_accuracy !== null) stats.accuracy.push(m.prediction_accuracy);
    if (m.nps_score !== null) stats.nps.push(m.nps_score);
    destStats.set(m.destination_name, stats);
  });

  const destSorted = Array.from(destStats.entries())
    .map(([name, stats]) => ({
      name,
      total: stats.total,
      avgAccuracy: stats.accuracy.length > 0 ? stats.accuracy.reduce((a, b) => a + b, 0) / stats.accuracy.length : null,
      avgNps: stats.nps.length > 0 ? stats.nps.reduce((a, b) => a + b, 0) / stats.nps.length : null,
    }))
    .sort((a, b) => (b.avgAccuracy ?? 0) - (a.avgAccuracy ?? 0));

  // Correlation: high fit_score → high NPS?
  const highFitMatches = matches.filter(m => m.fit_score >= 75 && m.nps_score !== null);
  const lowFitMatches = matches.filter(m => m.fit_score < 75 && m.nps_score !== null);
  const highFitAvgNps = highFitMatches.length > 0
    ? highFitMatches.reduce((s, m) => s + (m.nps_score || 0), 0) / highFitMatches.length
    : null;
  const lowFitAvgNps = lowFitMatches.length > 0
    ? lowFitMatches.reduce((s, m) => s + (m.nps_score || 0), 0) / lowFitMatches.length
    : null;

  if (loading) {
    return <Card><CardContent className="p-8 text-center text-muted-foreground">Loading...</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Prediction Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgAccuracy !== null ? `${avgAccuracy.toFixed(1)}%` : "—"}
            </div>
            {avgAccuracy !== null && <Progress value={avgAccuracy} className="mt-2" />}
            <p className="text-xs text-muted-foreground mt-1">{withAccuracy.length} trips measured</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg NPS Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgNps !== null ? avgNps.toFixed(1) : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{withNps.length} responses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Fit → NPS</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {highFitAvgNps !== null ? highFitAvgNps.toFixed(1) : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Fit ≥75% ({highFitMatches.length} trips)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Fit → NPS</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lowFitAvgNps !== null ? lowFitAvgNps.toFixed(1) : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Fit &lt;75% ({lowFitMatches.length} trips)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Destination Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Destination Calibration
          </CardTitle>
          <CardDescription>
            Which destinations are most accurately matched? Low accuracy means recalibration needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {destSorted.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No feedback data yet. Prediction accuracy is calculated when travelers complete post-trip surveys.
                </p>
              ) : (
                destSorted.map(dest => (
                  <div key={dest.name} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{dest.name}</p>
                      <p className="text-xs text-muted-foreground">{dest.total} matches</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Accuracy</p>
                        <p className="font-medium">
                          {dest.avgAccuracy !== null ? `${dest.avgAccuracy.toFixed(0)}%` : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Avg NPS</p>
                        <p className="font-medium">
                          {dest.avgNps !== null ? dest.avgNps.toFixed(1) : "—"}
                        </p>
                      </div>
                      {dest.avgAccuracy !== null && (
                        <Badge
                          variant={dest.avgAccuracy >= 80 ? "default" : dest.avgAccuracy >= 60 ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {dest.avgAccuracy >= 80 ? "Calibrated" : dest.avgAccuracy >= 60 ? "Okay" : "Needs Work"}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Recent Matches with Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Match Feedback</CardTitle>
          <CardDescription>Individual prediction vs actual satisfaction</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {matches.filter(m => m.nps_score !== null || m.actual_satisfaction !== null).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No post-trip feedback collected yet.
                </p>
              ) : (
                matches
                  .filter(m => m.nps_score !== null || m.actual_satisfaction !== null)
                  .slice(0, 20)
                  .map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                      <div>
                        <p className="font-medium">{m.respondent_name}</p>
                        <p className="text-xs text-muted-foreground">{m.destination_name}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Predicted</p>
                          <p className="font-medium">{m.fit_score.toFixed(0)}%</p>
                        </div>
                        {m.actual_satisfaction !== null && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Actual</p>
                            <p className="font-medium">{m.actual_satisfaction.toFixed(0)}%</p>
                          </div>
                        )}
                        {m.nps_score !== null && (
                          <Badge variant="outline" className="text-xs">
                            NPS: {m.nps_score}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
