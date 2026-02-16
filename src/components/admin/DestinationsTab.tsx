import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Copy, Archive, Search, MapPin, Plane, PoundSterling, Globe } from "lucide-react";

interface Destination {
  id: string;
  name: string;
  country: string;
  region: string;
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
  avg_cost_per_day_gbp: number | null;
  flight_time_from_uk_hours: number | null;
  climate_tags: string[] | null;
  best_time_to_visit: string | null;
  description: string | null;
  short_description: string | null;
  image_url: string | null;
  image_credit: string | null;
  highlights: string[] | null;
  tier: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

const EMPTY_DESTINATION: Omit<Destination, "id" | "created_at" | "updated_at"> = {
  name: "", country: "", region: "Europe",
  restorative_score: 50, achievement_score: 50, cultural_score: 50, social_vibe_score: 50,
  visual_score: 50, culinary_score: 50, nature_score: 50, cultural_sensory_score: 50, wellness_score: 50,
  luxury_style_score: 50, avg_cost_per_day_gbp: 300, flight_time_from_uk_hours: 3,
  climate_tags: [], best_time_to_visit: "",
  description: "", short_description: "", image_url: "", image_credit: "", highlights: [],
  tier: "curated", is_active: true,
};

const REGIONS = ["Europe", "Asia", "Americas", "Africa", "Oceania"];
const TIERS = ["verified", "curated", "manual"];

const tierColor = (tier: string | null) => {
  switch (tier) {
    case "verified": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "curated": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "manual": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    default: return "";
  }
};

function ScoreSlider({ label, sublabel, value, onChange }: { label: string; sublabel?: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm">{label}</Label>
          {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
        </div>
        <span className="text-sm font-bold tabular-nums w-8 text-right">{value}</span>
      </div>
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={0} max={100} step={1} />
    </div>
  );
}

export function DestinationsTab() {
  const { toast } = useToast();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_DESTINATION);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("active");
  const [highlightsText, setHighlightsText] = useState("");
  const [climateText, setClimateText] = useState("");
  // Destination Info fields
  const [destInfo, setDestInfo] = useState({
    cultural_customs: "", language_basics: "", tipping_etiquette: "", dress_code: "",
    local_customs: "", safety_tips: "", embassy_contact: "", currency: "", timezone: "", voltage: "",
    emergency_numbers: "{}"
  });

  const load = async () => {
    const { data, error } = await supabase
      .from("echoprint_destinations")
      .select("*")
      .order("name");
    if (error) { console.error(error); return; }
    setDestinations((data as unknown as Destination[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = destinations.filter(d => {
    if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase()) && !d.country.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterRegion !== "all" && d.region !== filterRegion) return false;
    if (filterTier !== "all" && d.tier !== filterTier) return false;
    if (filterActive === "active" && !d.is_active) return false;
    if (filterActive === "archived" && d.is_active) return false;
    return true;
  });

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_DESTINATION);
    setHighlightsText("");
    setClimateText("");
    setDestInfo({ cultural_customs: "", language_basics: "", tipping_etiquette: "", dress_code: "", local_customs: "", safety_tips: "", embassy_contact: "", currency: "", timezone: "", voltage: "", emergency_numbers: "{}" });
    setShowForm(true);
  };

  const openEdit = async (d: Destination) => {
    setEditingId(d.id);
    setForm({ ...d });
    setHighlightsText((d.highlights || []).join(", "));
    setClimateText((d.climate_tags || []).join(", "));
    // Load destination info
    const { data: info } = await supabase.from("destination_info").select("*").eq("destination_id", d.id).maybeSingle();
    if (info) {
      setDestInfo({
        cultural_customs: info.cultural_customs || "",
        language_basics: info.language_basics || "",
        tipping_etiquette: info.tipping_etiquette || "",
        dress_code: info.dress_code || "",
        local_customs: info.local_customs || "",
        safety_tips: info.safety_tips || "",
        embassy_contact: info.embassy_contact || "",
        currency: info.currency || "",
        timezone: info.timezone || "",
        voltage: info.voltage || "",
        emergency_numbers: info.emergency_numbers ? JSON.stringify(info.emergency_numbers, null, 2) : "{}",
      });
    } else {
      setDestInfo({ cultural_customs: "", language_basics: "", tipping_etiquette: "", dress_code: "", local_customs: "", safety_tips: "", embassy_contact: "", currency: "", timezone: "", voltage: "", emergency_numbers: "{}" });
    }
    setShowForm(true);
  };

  const duplicate = (d: Destination) => {
    setEditingId(null);
    setForm({ ...d, name: `${d.name} (Copy)` });
    setHighlightsText((d.highlights || []).join(", "));
    setClimateText((d.climate_tags || []).join(", "));
    setShowForm(true);
  };

  const toggleActive = async (d: Destination) => {
    const { error } = await supabase
      .from("echoprint_destinations")
      .update({ is_active: !d.is_active } as any)
      .eq("id", d.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: d.is_active ? "Archived" : "Activated", description: `${d.name} ${d.is_active ? "archived" : "activated"}` });
    load();
  };

  const save = async (addAnother = false) => {
    if (!form.name || !form.country || !form.region) {
      toast({ title: "Validation Error", description: "Name, country, and region are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      highlights: highlightsText.split(",").map(s => s.trim()).filter(Boolean),
      climate_tags: climateText.split(",").map(s => s.trim()).filter(Boolean),
    } as any;
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    let error;
    let destId = editingId;
    if (editingId) {
      ({ error } = await supabase.from("echoprint_destinations").update(payload).eq("id", editingId));
    } else {
      const res = await supabase.from("echoprint_destinations").insert(payload).select("id").single();
      error = res.error;
      destId = res.data?.id || null;
    }

    // Save destination info if we have a destination id and any info fields are filled
    if (!error && destId) {
      const hasInfo = Object.entries(destInfo).some(([k, v]) => k !== "emergency_numbers" && v.trim());
      if (hasInfo) {
        let emergencyJson = {};
        try { emergencyJson = JSON.parse(destInfo.emergency_numbers || "{}"); } catch {}
        const infoPayload = {
          destination_id: destId,
          cultural_customs: destInfo.cultural_customs || null,
          language_basics: destInfo.language_basics || null,
          tipping_etiquette: destInfo.tipping_etiquette || null,
          dress_code: destInfo.dress_code || null,
          local_customs: destInfo.local_customs || null,
          safety_tips: destInfo.safety_tips || null,
          embassy_contact: destInfo.embassy_contact || null,
          currency: destInfo.currency || null,
          timezone: destInfo.timezone || null,
          voltage: destInfo.voltage || null,
          emergency_numbers: emergencyJson,
        };
        // Upsert
        const { data: existing } = await supabase.from("destination_info").select("id").eq("destination_id", destId).maybeSingle();
        if (existing) {
          await supabase.from("destination_info").update(infoPayload as any).eq("id", existing.id);
        } else {
          await supabase.from("destination_info").insert(infoPayload as any);
        }
      }
    }

    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: editingId ? "Updated" : "Created", description: `${form.name} saved successfully` });
    load();
    if (addAnother) { openNew(); } else { setShowForm(false); }
  };

  const deleteDestination = async () => {
    if (!editingId) return;
    const { error } = await supabase.from("echoprint_destinations").delete().eq("id", editingId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Deleted", description: "Destination removed" });
    setShowDeleteConfirm(false);
    setShowForm(false);
    load();
  };

  // Stats
  const totalActive = destinations.filter(d => d.is_active).length;
  const regionCounts = REGIONS.map(r => ({ region: r, count: destinations.filter(d => d.region === r && d.is_active).length }));
  const tierCounts = TIERS.map(t => ({ tier: t, count: destinations.filter(d => d.tier === t && d.is_active).length }));
  const costs = destinations.filter(d => d.avg_cost_per_day_gbp && d.is_active).map(d => d.avg_cost_per_day_gbp!);
  const minCost = costs.length ? Math.min(...costs) : 0;
  const maxCost = costs.length ? Math.max(...costs) : 0;

  const setField = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalActive}</p><p className="text-xs text-muted-foreground">Active Destinations</p></CardContent></Card>
        {regionCounts.filter(r => r.count > 0).slice(0, 3).map(r => (
          <Card key={r.region}><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{r.count}</p><p className="text-xs text-muted-foreground">{r.region}</p></CardContent></Card>
        ))}
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">£{minCost}-{maxCost}</p><p className="text-xs text-muted-foreground">Cost Range/Day</p></CardContent></Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 w-48" />
          </div>
          <Select value={filterRegion} onValueChange={setFilterRegion}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Region" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterTier} onValueChange={setFilterTier}>
            <SelectTrigger className="w-28"><SelectValue placeholder="Tier" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              {TIERS.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterActive} onValueChange={setFilterActive}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Destination</Button>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Destinations ({filtered.length})</CardTitle>
          <CardDescription>Manage destination profiles for the matching algorithm</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No destinations found</p>
            ) : (
              <div className="space-y-3">
                {filtered.map(d => (
                  <div key={d.id} className={`p-4 rounded-lg border transition-colors ${d.is_active ? 'bg-muted/50 hover:bg-muted' : 'bg-muted/20 opacity-60'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <MapPin className="h-4 w-4 text-primary shrink-0" />
                          <h3 className="font-semibold">{d.name}</h3>
                          <span className="text-sm text-muted-foreground">{d.country}</span>
                          <Badge variant="outline">{d.region}</Badge>
                          <Badge className={tierColor(d.tier)}>{d.tier}</Badge>
                          {!d.is_active && <Badge variant="secondary">Archived</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{d.short_description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          {d.avg_cost_per_day_gbp && <span className="flex items-center gap-1"><PoundSterling className="h-3 w-3" />{d.avg_cost_per_day_gbp}/day</span>}
                          {d.flight_time_from_uk_hours && <span className="flex items-center gap-1"><Plane className="h-3 w-3" />{d.flight_time_from_uk_hours}h</span>}
                          {d.best_time_to_visit && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{d.best_time_to_visit}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(d)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => duplicate(d)}><Copy className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleActive(d)}><Archive className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Destination" : "Add New Destination"}</DialogTitle>
            <DialogDescription>Fill in the destination profile for the matching algorithm</DialogDescription>
          </DialogHeader>

          <div className="space-y-8">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Basic Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1"><Label>Name *</Label><Input value={form.name} onChange={e => setField("name", e.target.value)} /></div>
                <div className="space-y-1"><Label>Country *</Label><Input value={form.country} onChange={e => setField("country", e.target.value)} /></div>
                <div className="space-y-1">
                  <Label>Region *</Label>
                  <Select value={form.region} onValueChange={v => setField("region", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Psychological Scores */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Psychological Scores</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ScoreSlider label="Restorative" sublabel="0 = stimulating → 100 = deeply restorative" value={form.restorative_score ?? 50} onChange={v => setField("restorative_score", v)} />
                <ScoreSlider label="Achievement" sublabel="0 = relaxed → 100 = adventure focused" value={form.achievement_score ?? 50} onChange={v => setField("achievement_score", v)} />
                <ScoreSlider label="Cultural" sublabel="0 = low cultural depth → 100 = rich immersion" value={form.cultural_score ?? 50} onChange={v => setField("cultural_score", v)} />
                <ScoreSlider label="Social Vibe" sublabel="0 = intimate → 100 = social" value={form.social_vibe_score ?? 50} onChange={v => setField("social_vibe_score", v)} />
              </div>
            </div>

            {/* Sensory Scores */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Sensory Dimensions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ScoreSlider label="Visual Beauty" value={form.visual_score ?? 50} onChange={v => setField("visual_score", v)} />
                <ScoreSlider label="Culinary Excellence" value={form.culinary_score ?? 50} onChange={v => setField("culinary_score", v)} />
                <ScoreSlider label="Nature Immersion" value={form.nature_score ?? 50} onChange={v => setField("nature_score", v)} />
                <ScoreSlider label="Cultural Sensory" value={form.cultural_sensory_score ?? 50} onChange={v => setField("cultural_sensory_score", v)} />
                <ScoreSlider label="Wellness" value={form.wellness_score ?? 50} onChange={v => setField("wellness_score", v)} />
              </div>
            </div>

            {/* Luxury & Practical */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Luxury & Practical</h3>
              <ScoreSlider label="Luxury Style" sublabel="0 = authentic/rustic → 100 = polished/seamless" value={form.luxury_style_score ?? 50} onChange={v => setField("luxury_style_score", v)} />
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1"><Label>Avg Cost/Day (£)</Label><Input type="number" value={form.avg_cost_per_day_gbp ?? ""} onChange={e => setField("avg_cost_per_day_gbp", parseInt(e.target.value) || null)} /></div>
                <div className="space-y-1"><Label>Flight Time (hours)</Label><Input type="number" step="0.5" value={form.flight_time_from_uk_hours ?? ""} onChange={e => setField("flight_time_from_uk_hours", parseFloat(e.target.value) || null)} /></div>
                <div className="space-y-1"><Label>Best Time to Visit</Label><Input value={form.best_time_to_visit ?? ""} onChange={e => setField("best_time_to_visit", e.target.value)} /></div>
              </div>
              <div className="space-y-1"><Label>Climate Tags (comma-separated)</Label><Input value={climateText} onChange={e => setClimateText(e.target.value)} placeholder="Mediterranean, Beach, Hot summers" /></div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Content</h3>
              <div className="space-y-1"><Label>Short Description</Label><Input value={form.short_description ?? ""} onChange={e => setField("short_description", e.target.value)} placeholder="One sentence for card displays" /></div>
              <div className="space-y-1"><Label>Full Description</Label><Textarea rows={4} value={form.description ?? ""} onChange={e => setField("description", e.target.value)} /></div>
              <div className="space-y-1"><Label>Highlights (comma-separated)</Label><Input value={highlightsText} onChange={e => setHighlightsText(e.target.value)} placeholder="Pristine beaches, Wine tasting, Hiking" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Image URL</Label><Input value={form.image_url ?? ""} onChange={e => setField("image_url", e.target.value)} /></div>
                <div className="space-y-1"><Label>Image Credit</Label><Input value={form.image_credit ?? ""} onChange={e => setField("image_credit", e.target.value)} /></div>
              </div>
            </div>

            {/* Destination Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Destination Information (Travel Guide)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1"><Label>Currency</Label><Input value={destInfo.currency} onChange={e => setDestInfo(p => ({ ...p, currency: e.target.value }))} placeholder="Euro (EUR)" /></div>
                <div className="space-y-1"><Label>Timezone</Label><Input value={destInfo.timezone} onChange={e => setDestInfo(p => ({ ...p, timezone: e.target.value }))} placeholder="CET (UTC+1)" /></div>
                <div className="space-y-1"><Label>Voltage</Label><Input value={destInfo.voltage} onChange={e => setDestInfo(p => ({ ...p, voltage: e.target.value }))} placeholder="230V, Type C/F" /></div>
              </div>
              <div className="space-y-1"><Label>Cultural Customs</Label><Textarea rows={3} value={destInfo.cultural_customs} onChange={e => setDestInfo(p => ({ ...p, cultural_customs: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Language Basics</Label><Textarea rows={3} value={destInfo.language_basics} onChange={e => setDestInfo(p => ({ ...p, language_basics: e.target.value }))} placeholder="Hello - Olá&#10;Thank you - Obrigado" /></div>
              <div className="space-y-1"><Label>Tipping Etiquette</Label><Textarea rows={2} value={destInfo.tipping_etiquette} onChange={e => setDestInfo(p => ({ ...p, tipping_etiquette: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Dress Code</Label><Textarea rows={2} value={destInfo.dress_code} onChange={e => setDestInfo(p => ({ ...p, dress_code: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Local Customs</Label><Textarea rows={2} value={destInfo.local_customs} onChange={e => setDestInfo(p => ({ ...p, local_customs: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Safety Tips</Label><Textarea rows={2} value={destInfo.safety_tips} onChange={e => setDestInfo(p => ({ ...p, safety_tips: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Embassy Contact</Label><Textarea rows={2} value={destInfo.embassy_contact} onChange={e => setDestInfo(p => ({ ...p, embassy_contact: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Emergency Numbers (JSON)</Label><Textarea rows={3} value={destInfo.emergency_numbers} onChange={e => setDestInfo(p => ({ ...p, emergency_numbers: e.target.value }))} placeholder='{"emergency": "112", "police": "112"}' className="font-mono text-xs" /></div>
            </div>

            {/* Metadata */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Metadata</h3>
              <div className="flex items-center gap-6">
                <div className="space-y-1">
                  <Label>Tier</Label>
                  <Select value={form.tier ?? "curated"} onValueChange={v => setField("tier", v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{TIERS.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Active</Label>
                  <Switch checked={form.is_active ?? true} onCheckedChange={v => setField("is_active", v)} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-wrap gap-2">
            {editingId && (
              <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>Delete</Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button variant="secondary" onClick={() => save(true)} disabled={saving}>Save & Add Another</Button>
            <Button onClick={() => save(false)} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Destination</DialogTitle>
            <DialogDescription>Are you sure you want to permanently delete "{form.name}"? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteDestination}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
