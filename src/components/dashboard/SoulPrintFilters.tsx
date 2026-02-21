import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface FilterOption {
  label: string;
  category: string;
  check: (dest: any) => boolean;
}

const FILTER_OPTIONS: FilterOption[] = [
  // Pace
  { label: "Slow Travel", category: "Pace", check: (d) => (d.restorative_score ?? 50) > 60 },
  { label: "Active Exploration", category: "Pace", check: (d) => (d.restorative_score ?? 50) < 40 },
  // Energy
  { label: "Restorative", category: "Energy", check: (d) => (d.restorative_score ?? 50) > 60 },
  { label: "High-Stimulation", category: "Energy", check: (d) => (d.restorative_score ?? 50) < 40 },
  // Social
  { label: "Solitude & Intimacy", category: "Social", check: (d) => (d.social_vibe_score ?? 50) < 40 },
  { label: "Vibrant & Social", category: "Social", check: (d) => (d.social_vibe_score ?? 50) > 60 },
  // Sensory
  {
    label: "Calm & Minimal",
    category: "Sensory",
    check: (d) => {
      const scores = [d.visual_score, d.culinary_score, d.nature_score, d.cultural_sensory_score, d.wellness_score].filter((s: any) => s != null);
      const avg = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 50;
      return avg < 40;
    },
  },
  {
    label: "Rich & Immersive",
    category: "Sensory",
    check: (d) => {
      const scores = [d.visual_score, d.culinary_score, d.nature_score, d.cultural_sensory_score, d.wellness_score].filter((s: any) => s != null);
      const avg = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 50;
      return avg > 60;
    },
  },
  // Style
  { label: "Raw & Authentic", category: "Style", check: (d) => (d.luxury_style_score ?? 50) < 40 },
  { label: "Polished & Refined", category: "Style", check: (d) => (d.luxury_style_score ?? 50) > 60 },
];

interface SoulPrintFiltersProps {
  activeFilters: Set<string>;
  onToggle: (label: string) => void;
  onClear: () => void;
}

export function SoulPrintFilters({ activeFilters, onToggle, onClear }: SoulPrintFiltersProps) {
  return (
    <div className="space-y-2">
      <ScrollArea className="w-full">
        <div className="flex gap-1.5 pb-2">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.label}
              onClick={() => onToggle(f.label)}
              className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full border transition-colors ${
                activeFilters.has(f.label)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 hover:text-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      {activeFilters.size > 0 && (
        <button
          onClick={onClear}
          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
        >
          <X className="h-3 w-3" /> Clear all filters
        </button>
      )}
    </div>
  );
}

/** Apply active filters to a list of destinations (from match objects) */
export function applyFilters(matches: any[], activeFilters: Set<string>): any[] {
  if (activeFilters.size === 0) return matches;

  const activeChecks = FILTER_OPTIONS.filter((f) => activeFilters.has(f.label));

  return matches.filter((m) => {
    const dest = m.destination;
    return activeChecks.every((f) => f.check(dest));
  });
}
