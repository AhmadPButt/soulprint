import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface EmotionalFluctuationGraphProps {
  respondentId: string;
}

interface MoodLog {
  id: string;
  logged_at: string;
  mood_score: number;
  emotions: any;
  location: string | null;
  activity_reference: string | null;
  notes: string | null;
}

export function EmotionalFluctuationGraph({ respondentId }: EmotionalFluctuationGraphProps) {
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ average: 0, trend: 0, highest: 0, lowest: 0 });

  useEffect(() => {
    loadMoodLogs();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('mood-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mood_logs',
          filter: `respondent_id=eq.${respondentId}`
        },
        () => loadMoodLogs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [respondentId]);

  const loadMoodLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('respondent_id', respondentId)
        .order('logged_at', { ascending: true });

      if (error) throw error;

      setMoodLogs(data || []);

      // Calculate statistics
      if (data && data.length > 0) {
        const scores = data.map(log => log.mood_score);
        const average = scores.reduce((a, b) => a + b, 0) / scores.length;
        const highest = Math.max(...scores);
        const lowest = Math.min(...scores);
        
        // Calculate trend (positive if improving, negative if declining)
        const recentAvg = scores.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, scores.length);
        const olderAvg = scores.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, scores.length);
        const trend = recentAvg - olderAvg;

        setStats({ average, trend, highest, lowest });
      }
    } catch (error) {
      console.error("Error loading mood logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = moodLogs.map((log) => ({
    date: format(new Date(log.logged_at), 'MMM dd, HH:mm'),
    mood: log.mood_score,
    location: log.location,
    activity: log.activity_reference,
    fullDate: log.logged_at,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.date}</p>
          <p className="text-primary font-bold">Mood: {data.mood}/10</p>
          {data.location && <p className="text-sm text-muted-foreground">📍 {data.location}</p>}
          {data.activity && <p className="text-sm text-muted-foreground">🎯 {data.activity}</p>}
        </div>
      );
    }
    return null;
  };

  const getTrendIcon = () => {
    if (stats.trend > 0.5) return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (stats.trend < -0.5) return <TrendingDown className="h-5 w-5 text-red-500" />;
    return <Minus className="h-5 w-5 text-muted-foreground" />;
  };

  const getTrendText = () => {
    if (stats.trend > 0.5) return "Improving";
    if (stats.trend < -0.5) return "Declining";
    return "Stable";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading emotional data...</p>
        </CardContent>
      </Card>
    );
  }

  if (moodLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Emotional Fluctuation</CardTitle>
          <CardDescription>Track your mood throughout your journey</CardDescription>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No mood logs yet. Start logging your emotions!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emotional Fluctuation</CardTitle>
        <CardDescription>Your mood journey over time</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Average Mood</p>
            <p className="text-2xl font-bold">{stats.average.toFixed(1)}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Trend</p>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <p className="text-sm font-semibold">{getTrendText()}</p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Highest</p>
            <p className="text-2xl font-bold text-green-500">{stats.highest}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Lowest</p>
            <p className="text-2xl font-bold text-red-500">{stats.lowest}</p>
          </div>
        </div>

        {/* Graph */}
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                domain={[0, 10]}
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="mood"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                fill="url(#moodGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Logs */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Recent Entries</h4>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {moodLogs.slice(-5).reverse().map((log) => (
              <div key={log.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{format(new Date(log.logged_at), 'MMM dd, yyyy HH:mm')}</span>
                  <span className="text-primary font-bold">{log.mood_score}/10</span>
                </div>
                {log.location && <p className="text-xs text-muted-foreground">📍 {log.location}</p>}
                {log.notes && <p className="text-xs mt-1">{log.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
