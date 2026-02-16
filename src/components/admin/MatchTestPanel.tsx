import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Zap, Users, Eye, Gem } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface MatchResult {
  destination: {
    name: string;
    country: string;
    region: string;
    short_description: string;
    avg_cost_per_day_gbp: number;
    flight_time_from_uk_hours: number;
    tier: string;
  };
  fit_score: number;
  fit_breakdown: {
    energy: number;
    social: number;
    sensory: number;
    luxury: number;
  };
  rank: number;
}

interface UserTraits {
  userEnergy: number;
  userAchievement: number;
  userSocial: number;
  userLuxury: number;
  sensoryPriorities: string[];
}

interface MatchTestProps {
  respondents: any[];
}

export function MatchTestPanel({ respondents }: MatchTestProps) {
  const { toast } = useToast();
  const [selectedRespondent, setSelectedRespondent] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [userTraits, setUserTraits] = useState<UserTraits | null>(null);

  const completedRespondents = respondents.filter(r => r.raw_responses && Object.keys(r.raw_responses).length > 5);

  const runMatch = async () => {
    if (!selectedRespondent) return;
    setRunning(true);
    setResults(null);
    setUserTraits(null);

    try {
      const { data, error } = await supabase.functions.invoke("match-destinations", {
        body: { respondent_id: selectedRespondent },
      });

      if (error) throw error;

      setResults(data.matches || []);
      setUserTraits(data.user_traits || null);
      toast({ title: "Matching Complete", description: `Found ${data.matches?.length || 0} matches` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const breakdownIcons: Record<string, any> = {
    energy: Zap,
    social: Users,
    sensory: Eye,
    luxury: Gem,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Destination Match Test</CardTitle>
        <CardDescription>Test the matching algorithm against any respondent's SoulPrint</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">Select Respondent</label>
            <Select value={selectedRespondent} onValueChange={setSelectedRespondent}>
              <SelectTrigger><SelectValue placeholder="Choose a respondent..." /></SelectTrigger>
              <SelectContent>
                {completedRespondents.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name} ({r.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={runMatch} disabled={!selectedRespondent || running}>
            {running ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Running...</> : "Run Match"}
          </Button>
        </div>

        {/* User Traits */}
        {userTraits && (
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Extracted User Traits</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><span className="text-muted-foreground">Energy:</span> <span className="font-medium">{userTraits.userEnergy}</span></div>
              <div><span className="text-muted-foreground">Social:</span> <span className="font-medium">{userTraits.userSocial}</span></div>
              <div><span className="text-muted-foreground">Luxury:</span> <span className="font-medium">{userTraits.userLuxury}</span></div>
              <div><span className="text-muted-foreground">Achievement:</span> <span className="font-medium">{userTraits.userAchievement}</span></div>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Sensory Priorities:</span>{" "}
              {userTraits.sensoryPriorities.map((s, i) => (
                <Badge key={s} variant="outline" className="ml-1">#{i + 1} {s}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {results && results.length > 0 && (
          <div className="space-y-4">
            {results.map((match) => (
              <div key={match.rank} className="p-5 rounded-lg border bg-card space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/20 text-primary border-primary/30">#{match.rank}</Badge>
                      <h3 className="font-semibold text-lg">{match.destination.name}</h3>
                      <span className="text-sm text-muted-foreground">{match.destination.country}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{match.destination.short_description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">{match.fit_score}</p>
                    <p className="text-xs text-muted-foreground">Fit Score</p>
                  </div>
                </div>

                {/* Breakdown bars */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(match.fit_breakdown).map(([key, value]) => {
                    const Icon = breakdownIcons[key] || Zap;
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground capitalize">
                            <Icon className="h-3 w-3" />{key}
                          </span>
                          <span className="font-medium">{value}</span>
                        </div>
                        <Progress value={value} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>£{match.destination.avg_cost_per_day_gbp}/day</span>
                  <span>{match.destination.flight_time_from_uk_hours}h flight</span>
                  <Badge variant="outline" className="text-xs">{match.destination.tier}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {results && results.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No matches found. Check that destinations are active.</p>
        )}
      </CardContent>
    </Card>
  );
}
