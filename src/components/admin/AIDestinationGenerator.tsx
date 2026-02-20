import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, CheckCircle, RefreshCw } from "lucide-react";

interface GeneratedProfile {
  name: string;
  country: string;
  region: string;
  short_description: string;
  description: string;
  restorative_score: number;
  achievement_score: number;
  cultural_score: number;
  social_vibe_score: number;
  visual_score: number;
  culinary_score: number;
  nature_score: number;
  cultural_sensory_score: number;
  wellness_score: number;
  luxury_style_score: number;
  avg_cost_per_day_gbp: number;
  flight_time_from_uk_hours: number;
  best_time_to_visit: string;
  climate_tags: string[];
  highlights: string[];
  tier: string;
}

const REGIONS = ["Europe", "Asia", "Americas", "Africa", "Oceania", "Middle East"];

function ScoreRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-40 shrink-0">{label}</span>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={0} max={100} step={1} className="flex-1" />
      <span className="text-xs font-bold tabular-nums w-8 text-right">{value}</span>
    </div>
  );
}

export function AIDestinationGenerator({ onSaved }: { onSaved: () => void }) {
  const { toast } = useToast();
  const [destinationName, setDestinationName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<GeneratedProfile | null>(null);

  const generate = async () => {
    if (!destinationName.trim()) {
      toast({ title: "Enter a destination name", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const LOVABLE_API_KEY = (await supabase.functions.invoke("ai-chat", { body: { _getKey: true } })).data?.key;
      
      // Call AI directly via edge function
      const { data, error } = await supabase.functions.invoke("generate-destination-profile", {
        body: { destination_name: destinationName.trim() },
      });

      if (error) throw error;
      if (!data?.profile) throw new Error("No profile returned");

      setProfile(data.profile);
      toast({ title: "Profile generated!", description: "Review and curate before saving." });
    } catch (err: any) {
      console.error("Generation error:", err);
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const saveToDatabase = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("echoprint_destinations").insert({
        name: profile.name,
        country: profile.country,
        region: profile.region,
        short_description: profile.short_description,
        description: profile.description,
        restorative_score: profile.restorative_score,
        achievement_score: profile.achievement_score,
        cultural_score: profile.cultural_score,
        social_vibe_score: profile.social_vibe_score,
        visual_score: profile.visual_score,
        culinary_score: profile.culinary_score,
        nature_score: profile.nature_score,
        cultural_sensory_score: profile.cultural_sensory_score,
        wellness_score: profile.wellness_score,
        luxury_style_score: profile.luxury_style_score,
        avg_cost_per_day_gbp: profile.avg_cost_per_day_gbp,
        flight_time_from_uk_hours: profile.flight_time_from_uk_hours,
        best_time_to_visit: profile.best_time_to_visit,
        climate_tags: profile.climate_tags,
        highlights: profile.highlights,
        tier: profile.tier || "manual",
        is_active: true,
      } as any);

      if (error) throw error;
      toast({ title: "Destination saved!", description: `${profile.name} has been added to the database.` });
      setProfile(null);
      setDestinationName("");
      onSaved();
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateScore = (key: keyof GeneratedProfile, value: number) => {
    if (!profile) return;
    setProfile({ ...profile, [key]: value });
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Destination Profile Generator
        </CardTitle>
        <CardDescription>
          Enter a destination name and let AI generate a complete scoring profile. You can curate and adjust all values before saving.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Section */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="e.g. Kyoto, Japan or Patagonia, Argentina"
              value={destinationName}
              onChange={e => setDestinationName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !generating && generate()}
              disabled={generating}
            />
          </div>
          <Button onClick={generate} disabled={generating || !destinationName.trim()}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {generating ? "Generating..." : "Generate"}
          </Button>
        </div>

        {/* Generated Profile Editor */}
        {profile && (
          <div className="space-y-6 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-600">Profile generated — review and curate below</span>
              </div>
              <Button variant="ghost" size="sm" onClick={generate} disabled={generating}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Regenerate
              </Button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Name</Label>
                <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Country</Label>
                <Input value={profile.country} onChange={e => setProfile({ ...profile, country: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Region</Label>
                <Select value={profile.region} onValueChange={v => setProfile({ ...profile, region: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Best Time to Visit</Label>
                <Input value={profile.best_time_to_visit} onChange={e => setProfile({ ...profile, best_time_to_visit: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Avg Cost/Day (£)</Label>
                <Input type="number" value={profile.avg_cost_per_day_gbp} onChange={e => setProfile({ ...profile, avg_cost_per_day_gbp: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Flight Time from UK (hrs)</Label>
                <Input type="number" step="0.5" value={profile.flight_time_from_uk_hours} onChange={e => setProfile({ ...profile, flight_time_from_uk_hours: Number(e.target.value) })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Short Description</Label>
                <Textarea rows={2} value={profile.short_description} onChange={e => setProfile({ ...profile, short_description: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Full Description</Label>
                <Textarea rows={2} value={profile.description} onChange={e => setProfile({ ...profile, description: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Climate Tags (comma-separated)</Label>
                <Input value={profile.climate_tags.join(", ")} onChange={e => setProfile({ ...profile, climate_tags: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} />
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.climate_tags.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Highlights (comma-separated)</Label>
                <Input value={profile.highlights.join(", ")} onChange={e => setProfile({ ...profile, highlights: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} />
              </div>
            </div>

            {/* Scores */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Matching Scores (0–100)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-3">
                  <ScoreRow label="Restorative" value={profile.restorative_score} onChange={v => updateScore("restorative_score", v)} />
                  <ScoreRow label="Achievement" value={profile.achievement_score} onChange={v => updateScore("achievement_score", v)} />
                  <ScoreRow label="Cultural" value={profile.cultural_score} onChange={v => updateScore("cultural_score", v)} />
                  <ScoreRow label="Social Vibe" value={profile.social_vibe_score} onChange={v => updateScore("social_vibe_score", v)} />
                  <ScoreRow label="Visual" value={profile.visual_score} onChange={v => updateScore("visual_score", v)} />
                </div>
                <div className="space-y-3">
                  <ScoreRow label="Culinary" value={profile.culinary_score} onChange={v => updateScore("culinary_score", v)} />
                  <ScoreRow label="Nature" value={profile.nature_score} onChange={v => updateScore("nature_score", v)} />
                  <ScoreRow label="Cultural Sensory" value={profile.cultural_sensory_score} onChange={v => updateScore("cultural_sensory_score", v)} />
                  <ScoreRow label="Wellness" value={profile.wellness_score} onChange={v => updateScore("wellness_score", v)} />
                  <ScoreRow label="Luxury Style" value={profile.luxury_style_score} onChange={v => updateScore("luxury_style_score", v)} />
                </div>
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" onClick={() => setProfile(null)}>Discard</Button>
              <Button onClick={saveToDatabase} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Save to Destinations
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
