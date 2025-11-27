import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Brain, Sparkles, TrendingUp, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MoodInsightsProps {
  respondentId: string;
}

interface InsightData {
  id: string;
  insights_text: string;
  recommendations: string | null;
  emotional_patterns: any;
  generated_at: string;
}

export function MoodInsights({ respondentId }: MoodInsightsProps) {
  const { toast } = useToast();
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadInsights();
  }, [respondentId]);

  const loadInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('mood_insights')
        .select('*')
        .eq('respondent_id', respondentId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      setInsight(data);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-mood-patterns', {
        body: { respondent_id: respondentId }
      });

      if (error) throw error;

      toast({
        title: "Insights Generated",
        description: "Your emotional patterns have been analyzed!",
      });

      setInsight(data.insight);
    } catch (error: any) {
      console.error('Error generating insights:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate insights",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading insights...</p>
        </CardContent>
      </Card>
    );
  }

  if (!insight) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Mood Insights
          </CardTitle>
          <CardDescription>
            Get personalized insights about your emotional journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Generate AI-powered insights from your mood logs to understand your emotional patterns and get personalized recommendations.
            </p>
            <Button onClick={generateInsights} disabled={generating} size="lg">
              <Sparkles className="h-4 w-4 mr-2" />
              {generating ? "Analyzing..." : "Generate Insights"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const patterns = insight.emotional_patterns;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Your Emotional Journey Insights
        </CardTitle>
        <CardDescription>
          AI-powered analysis of your mood patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Patterns */}
        {patterns && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Average Mood</p>
              <p className="text-2xl font-bold">{patterns.averageMood?.toFixed(1)}/10</p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-muted-foreground mb-1">Peak Mood</p>
              <p className="text-2xl font-bold text-green-600">{patterns.highestMood}/10</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-muted-foreground mb-1">Total Entries</p>
              <p className="text-2xl font-bold">{patterns.totalEntries}</p>
            </div>
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <p className="text-xs text-muted-foreground mb-1">Low Point</p>
              <p className="text-2xl font-bold text-orange-600">{patterns.lowestMood}/10</p>
            </div>
          </div>
        )}

        {/* AI Insights */}
        <div className="prose prose-sm max-w-none">
          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Analysis
            </h4>
            <div className="text-sm whitespace-pre-wrap">{insight.insights_text}</div>
          </div>
        </div>

        {/* Top Emotions */}
        {patterns?.emotionFrequency && Object.keys(patterns.emotionFrequency).length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Most Frequent Emotions
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(patterns.emotionFrequency)
                .sort(([, a]: any, [, b]: any) => b - a)
                .slice(0, 5)
                .map(([emotion, count]: any) => (
                  <Badge key={emotion} variant="secondary">
                    {emotion} ({count})
                  </Badge>
                ))}
            </div>
          </div>
        )}

        {/* Best Locations */}
        {patterns?.locationMoodAverages && patterns.locationMoodAverages.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Your Happiest Locations
            </h4>
            <div className="space-y-2">
              {patterns.locationMoodAverages.slice(0, 5).map((loc: any) => (
                <div key={loc.location} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm">{loc.location}</span>
                  <Badge variant="outline">{loc.averageMood.toFixed(1)}/10</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={generateInsights} variant="outline" disabled={generating} className="w-full">
          <Sparkles className="h-4 w-4 mr-2" />
          {generating ? "Regenerating..." : "Regenerate Insights"}
        </Button>
      </CardContent>
    </Card>
  );
}
