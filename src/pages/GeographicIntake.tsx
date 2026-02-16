import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ArrowRight, MapPin, Map, Plane, Globe } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface IntakeData {
  geographic_constraint: string;
  geographic_value: string;
  occasion: string;
  party_composition: Record<string, any> | null;
  desired_outcome: string;
  timeline: string;
  travel_dates: Record<string, string> | null;
  duration: string;
  budget_range: string;
}

const defaultData: IntakeData = {
  geographic_constraint: "",
  geographic_value: "",
  occasion: "",
  party_composition: null,
  desired_outcome: "",
  timeline: "",
  travel_dates: null,
  duration: "",
  budget_range: "",
};

const GeographicIntake = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [data, setData] = useState<IntakeData>(defaultData);
  const [intakeId, setIntakeId] = useState<string | null>(null);
  const [kidAges, setKidAges] = useState<number[]>([]);

  const totalQuestions = 7;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  // Auth check + load existing intake
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Load existing incomplete intake
      const { data: existing } = await supabase
        .from("context_intake")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("completed", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        setIntakeId(existing.id);
        setData({
          geographic_constraint: existing.geographic_constraint || "",
          geographic_value: existing.geographic_value || "",
          occasion: existing.occasion || "",
          party_composition: existing.party_composition as Record<string, any> | null,
          desired_outcome: existing.desired_outcome || "",
          timeline: existing.timeline || "",
          travel_dates: existing.travel_dates as Record<string, string> | null,
          duration: existing.duration || "",
          budget_range: existing.budget_range || "",
        });
        // Find first unanswered question
        const fields = ["geographic_constraint", "occasion", "party_composition", "desired_outcome", "timeline", "duration", "budget_range"];
        const firstEmpty = fields.findIndex((f) => {
          const val = existing[f as keyof typeof existing];
          return !val || val === "";
        });
        if (firstEmpty > 0) setCurrentQuestion(firstEmpty);
      }
      setLoading(false);
    };
    init();
  }, [navigate]);

  // Auto-save
  const saveProgress = useCallback(async (updatedData: IntakeData, completed = false) => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      geographic_constraint: updatedData.geographic_constraint || null,
      geographic_value: updatedData.geographic_value || null,
      occasion: updatedData.occasion || null,
      party_composition: updatedData.party_composition,
      desired_outcome: updatedData.desired_outcome || null,
      timeline: updatedData.timeline || null,
      travel_dates: updatedData.travel_dates,
      duration: updatedData.duration || null,
      budget_range: updatedData.budget_range || null,
      completed,
      updated_at: new Date().toISOString(),
    };

    if (intakeId) {
      await supabase.from("context_intake").update(payload).eq("id", intakeId);
    } else {
      const { data: inserted } = await supabase.from("context_intake").insert(payload).select("id").single();
      if (inserted) setIntakeId(inserted.id);
    }
    setSaving(false);
  }, [user, intakeId]);

  const updateData = (updates: Partial<IntakeData>) => {
    const updated = { ...data, ...updates };
    setData(updated);
    saveProgress(updated);
  };

  const canProceed = (): boolean => {
    switch (currentQuestion) {
      case 0: return !!data.geographic_constraint && (data.geographic_constraint === "anywhere" || !!data.geographic_value);
      case 1: return !!data.occasion;
      case 2: return !!data.party_composition;
      case 3: return !!data.desired_outcome;
      case 4: return !!data.timeline && (data.timeline !== "specific_dates" || !!data.travel_dates?.start);
      case 5: return !!data.duration;
      case 6: return !!data.budget_range;
      default: return false;
    }
  };

  const handleNext = () => {
    // Auto-skip Q2 (party_composition) for solo
    if (currentQuestion === 1 && data.occasion === "solo") {
      updateData({ party_composition: { type: "solo" } });
      setCurrentQuestion(3); // skip Q2, go to Q3 (desired_outcome)
      return;
    }
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentQuestion === 3 && data.occasion === "solo") {
      setCurrentQuestion(1); // skip back over party composition
      return;
    }
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  };

  const handleComplete = async () => {
    await saveProgress(data, true);
    toast({ title: "Context saved", description: "Let's build your SoulPrint." });
    navigate("/questionnaire");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-card border-b border-border/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-heading font-thin tracking-tight text-foreground">Erranza</h1>
              <p className="text-xs text-muted-foreground mt-1">Your Journey Begins</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm text-foreground/80">{currentQuestion + 1} / {totalQuestions}</p>
              {saving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
            </div>
          </div>
          <Progress value={progress} className="mt-4 h-1" />
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8 md:py-16 max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {currentQuestion === 0 && <Q1Geographic data={data} updateData={updateData} />}
            {currentQuestion === 1 && <Q2Occasion data={data} updateData={updateData} />}
            {currentQuestion === 2 && <Q3Party data={data} updateData={updateData} kidAges={kidAges} setKidAges={setKidAges} />}
            {currentQuestion === 3 && <Q4Outcome data={data} updateData={updateData} />}
            {currentQuestion === 4 && <Q5Timeline data={data} updateData={updateData} />}
            {currentQuestion === 5 && <Q6Duration data={data} updateData={updateData} />}
            {currentQuestion === 6 && <Q7Budget data={data} updateData={updateData} />}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between pt-8 mt-8">
          {currentQuestion > 0 ? (
            <Button onClick={handleBack} variant="outline" size="lg" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          ) : <div />}
          <Button onClick={handleNext} size="lg" className="gap-2" disabled={!canProceed()}>
            {currentQuestion === totalQuestions - 1 ? "Continue to Profile" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  );
};

// ─── Q1: Geographic ───────────────────────────
interface QProps {
  data: IntakeData;
  updateData: (u: Partial<IntakeData>) => void;
}

const geoOptions = [
  { value: "country", icon: MapPin, emoji: "📍", label: "Specific destination", desc: "I have a place in mind" },
  { value: "region", icon: Map, emoji: "🗺️", label: "Somewhere in a region", desc: "Europe, Asia, Americas..." },
  { value: "flight_radius", icon: Plane, emoji: "✈️", label: "Within travel time", desc: "Max hours from UK" },
  { value: "anywhere", icon: Globe, emoji: "🌍", label: "Surprise me", desc: "Find my perfect place" },
];

const regions = ["Europe", "Asia", "Americas", "Africa", "Oceania", "Middle East"];

const Q1Geographic = ({ data, updateData }: QProps) => (
  <div className="space-y-8">
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Step 1</p>
      <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Where would you like to explore?</h2>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {geoOptions.map((opt) => (
        <Card
          key={opt.value}
          onClick={() => {
            if (opt.value === "anywhere") {
              updateData({ geographic_constraint: "anywhere", geographic_value: "" });
            } else {
              updateData({ geographic_constraint: opt.value, geographic_value: "" });
            }
          }}
          className={`p-6 cursor-pointer transition-all hover:border-primary/50 ${
            data.geographic_constraint === opt.value ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border"
          }`}
        >
          <span className="text-3xl mb-3 block">{opt.emoji}</span>
          <h3 className="font-heading font-semibold text-foreground">{opt.label}</h3>
          <p className="text-sm text-muted-foreground mt-1">{opt.desc}</p>
        </Card>
      ))}
    </div>

    {/* Follow-up inputs */}
    <AnimatePresence>
      {data.geographic_constraint === "country" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          <Input
            placeholder="Enter country or city..."
            value={data.geographic_value}
            onChange={(e) => updateData({ geographic_value: e.target.value })}
            className="h-12 text-base"
          />
        </motion.div>
      )}
      {data.geographic_constraint === "region" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap gap-2">
          {regions.map((r) => (
            <Button
              key={r}
              variant={data.geographic_value === r ? "default" : "outline"}
              onClick={() => updateData({ geographic_value: r })}
              size="sm"
            >
              {r}
            </Button>
          ))}
        </motion.div>
      )}
      {data.geographic_constraint === "flight_radius" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>3 hours</span>
            <span className="text-foreground font-medium">{data.geographic_value || "8"} hours max</span>
            <span>24 hours</span>
          </div>
          <input
            type="range"
            min={3}
            max={24}
            step={1}
            value={data.geographic_value || "8"}
            onChange={(e) => updateData({ geographic_value: e.target.value })}
            className="w-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// ─── Q2: Occasion ───────────────────────────
const occasions = [
  { value: "solo", label: "Solo adventure" },
  { value: "romantic", label: "Romantic escape" },
  { value: "family", label: "Family trip" },
  { value: "friends", label: "Friends getaway" },
  { value: "celebration", label: "Milestone celebration" },
  { value: "wellness", label: "Wellness retreat" },
  { value: "work", label: "Work trip" },
  { value: "just_because", label: "Just because" },
];

const Q2Occasion = ({ data, updateData }: QProps) => (
  <div className="space-y-8">
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Step 2</p>
      <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">What's the occasion?</h2>
    </div>
    <div className="flex flex-wrap gap-3">
      {occasions.map((o) => (
        <Button
          key={o.value}
          variant={data.occasion === o.value ? "default" : "outline"}
          onClick={() => updateData({ occasion: o.value, party_composition: null })}
          className="rounded-full px-5 h-11"
        >
          {o.label}
        </Button>
      ))}
    </div>
  </div>
);

// ─── Q3: Party Composition ───────────────────
interface Q3Props extends QProps {
  kidAges: number[];
  setKidAges: React.Dispatch<React.SetStateAction<number[]>>;
}

const Q3Party = ({ data, updateData, kidAges, setKidAges }: Q3Props) => {
  const occasion = data.occasion;
  const comp = data.party_composition || {};

  if (occasion === "romantic") {
    // Auto-set couple
    if (!data.party_composition || (data.party_composition as any).type !== "couple") {
      updateData({ party_composition: { type: "couple" } });
    }
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Step 3</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Who's traveling with you?</h2>
        </div>
        <Card className="p-6 border-primary bg-primary/5">
          <p className="text-foreground font-medium">💑 Just you and your partner</p>
        </Card>
      </div>
    );
  }

  if (occasion === "family") {
    const adults = (comp as any).adults || 2;
    const numKids = kidAges.length;

    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Step 3</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Who's traveling with you?</h2>
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-foreground">Adults</span>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => {
                const v = Math.max(1, adults - 1);
                updateData({ party_composition: { type: "family", adults: v, kids: kidAges.map(a => ({ age: a })) } });
              }}>-</Button>
              <span className="w-8 text-center text-foreground font-medium">{adults}</span>
              <Button variant="outline" size="sm" onClick={() => {
                const v = adults + 1;
                updateData({ party_composition: { type: "family", adults: v, kids: kidAges.map(a => ({ age: a })) } });
              }}>+</Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground">Children</span>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => {
                const newAges = kidAges.slice(0, -1);
                setKidAges(newAges);
                updateData({ party_composition: { type: "family", adults, kids: newAges.map(a => ({ age: a })) } });
              }} disabled={numKids === 0}>-</Button>
              <span className="w-8 text-center text-foreground font-medium">{numKids}</span>
              <Button variant="outline" size="sm" onClick={() => {
                const newAges = [...kidAges, 6];
                setKidAges(newAges);
                updateData({ party_composition: { type: "family", adults, kids: newAges.map(a => ({ age: a })) } });
              }}>+</Button>
            </div>
          </div>
          {kidAges.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Children's ages</p>
              <div className="flex flex-wrap gap-3">
                {kidAges.map((age, i) => (
                  <Input
                    key={i}
                    type="number"
                    min={0}
                    max={17}
                    value={age}
                    onChange={(e) => {
                      const newAges = [...kidAges];
                      newAges[i] = parseInt(e.target.value) || 0;
                      setKidAges(newAges);
                      updateData({ party_composition: { type: "family", adults, kids: newAges.map(a => ({ age: a })) } });
                    }}
                    className="w-20 text-center"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (occasion === "friends") {
    const size = (comp as any).size || 2;
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Step 3</p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Who's traveling with you?</h2>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-foreground">Group size (including you)</span>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => {
              const v = Math.max(2, size - 1);
              updateData({ party_composition: { type: "friends", size: v } });
            }}>-</Button>
            <span className="w-8 text-center text-foreground font-medium">{size}</span>
            <Button variant="outline" size="sm" onClick={() => {
              const v = Math.min(10, size + 1);
              updateData({ party_composition: { type: "friends", size: v } });
            }}>+</Button>
          </div>
        </div>
      </div>
    );
  }

  // Other occasions: just me / with others
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Step 3</p>
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">Who's traveling with you?</h2>
      </div>
      <div className="space-y-3">
        {[
          { value: "solo", label: "Just me" },
          { value: "with_others", label: "With others" },
        ].map((opt) => (
          <Card
            key={opt.value}
            onClick={() => updateData({ party_composition: { type: opt.value } })}
            className={`p-5 cursor-pointer transition-all hover:border-primary/50 ${
              (comp as any).type === opt.value ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border"
            }`}
          >
            <span className="text-foreground font-medium">{opt.label}</span>
          </Card>
        ))}
      </div>
    </div>
  );
};

// ─── Q4: Desired Outcome ───────────────────────
const outcomes = [
  { value: "restored", emoji: "🌿", label: "Recharged and restored" },
  { value: "accomplished", emoji: "🏔️", label: "Accomplished and proud" },
  { value: "inspired", emoji: "🎨", label: "Enriched and inspired" },
  { value: "connected", emoji: "💫", label: "Connected and bonded" },
  { value: "transformed", emoji: "🦋", label: "Transformed and changed" },
  { value: "joyful", emoji: "🎉", label: "Joyful and celebratory" },
];

const Q4Outcome = ({ data, updateData }: QProps) => (
  <div className="space-y-8">
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Step 4</p>
      <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">What are you hoping to feel when you return?</h2>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {outcomes.map((o) => (
        <Card
          key={o.value}
          onClick={() => updateData({ desired_outcome: o.value })}
          className={`p-6 cursor-pointer transition-all hover:border-primary/50 ${
            data.desired_outcome === o.value ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border"
          }`}
        >
          <span className="text-3xl mb-2 block">{o.emoji}</span>
          <span className="text-foreground font-medium">{o.label}</span>
        </Card>
      ))}
    </div>
  </div>
);

// ─── Q5: Timeline ───────────────────────────
const timelines = [
  { value: "specific_dates", label: "Specific dates" },
  { value: "flexible_3m", label: "Flexible within 3 months" },
  { value: "flexible_6m", label: "Flexible within 6 months" },
  { value: "exploring", label: "Just exploring options" },
];

const Q5Timeline = ({ data, updateData }: QProps) => (
  <div className="space-y-8">
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Step 5</p>
      <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">When are you planning to travel?</h2>
    </div>
    <div className="space-y-3">
      {timelines.map((t) => (
        <Card
          key={t.value}
          onClick={() => updateData({ timeline: t.value, travel_dates: t.value === "specific_dates" ? data.travel_dates : null })}
          className={`p-5 cursor-pointer transition-all hover:border-primary/50 ${
            data.timeline === t.value ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border"
          }`}
        >
          <span className="text-foreground font-medium">{t.label}</span>
        </Card>
      ))}
    </div>
    <AnimatePresence>
      {data.timeline === "specific_dates" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Start date</label>
            <Input
              type="date"
              value={data.travel_dates?.start || ""}
              onChange={(e) => updateData({ travel_dates: { ...data.travel_dates, start: e.target.value } as any })}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">End date</label>
            <Input
              type="date"
              value={data.travel_dates?.end || ""}
              onChange={(e) => updateData({ travel_dates: { ...data.travel_dates, end: e.target.value } as any })}
              className="h-12"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// ─── Q6: Duration ───────────────────────────
const durations = [
  { value: "weekend", label: "Weekend (2-4 days)" },
  { value: "week", label: "Week (5-7 days)" },
  { value: "two_weeks", label: "Two weeks (8-14 days)" },
  { value: "longer", label: "Longer (15+ days)" },
  { value: "flexible", label: "Flexible" },
];

const Q6Duration = ({ data, updateData }: QProps) => (
  <div className="space-y-8">
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Step 6</p>
      <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">How long do you want to travel?</h2>
    </div>
    <div className="space-y-3">
      {durations.map((d) => (
        <Card
          key={d.value}
          onClick={() => updateData({ duration: d.value })}
          className={`p-5 cursor-pointer transition-all hover:border-primary/50 ${
            data.duration === d.value ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border"
          }`}
        >
          <span className="text-foreground font-medium">{d.label}</span>
        </Card>
      ))}
    </div>
  </div>
);

// ─── Q7: Budget ───────────────────────────
const budgets = [
  { value: "under_3k", label: "Under £3,000" },
  { value: "3k_5k", label: "£3,000 - £5,000" },
  { value: "5k_10k", label: "£5,000 - £10,000" },
  { value: "10k_plus", label: "£10,000+" },
  { value: "flexible", label: "I'm flexible" },
];

const Q7Budget = ({ data, updateData }: QProps) => (
  <div className="space-y-8">
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Step 7</p>
      <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">What's your budget for this trip?</h2>
    </div>
    <div className="space-y-3">
      {budgets.map((b) => (
        <Card
          key={b.value}
          onClick={() => updateData({ budget_range: b.value })}
          className={`p-5 cursor-pointer transition-all hover:border-primary/50 ${
            data.budget_range === b.value ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border"
          }`}
        >
          <span className="text-foreground font-medium">{b.label}</span>
        </Card>
      ))}
    </div>
  </div>
);

export default GeographicIntake;
