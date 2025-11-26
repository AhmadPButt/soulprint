import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuestionnaireData } from "../SoulPrintQuestionnaire";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Section4Props {
  initialData: QuestionnaireData;
  onNext: (data: QuestionnaireData) => void;
  onBack?: () => void;
}

const Section4 = ({ initialData, onNext, onBack }: Section4Props) => {
  const [Q34, setQ34] = useState(initialData.Q34 || "");

  const handleNext = () => {
    onNext({ Q34 });
  };

  const elements = [
    { emoji: "🔥", name: "FIRE", description: "Volcanic, intense, transformative landscapes" },
    { emoji: "🌊", name: "WATER", description: "Calm, still, emotionally regulating spaces" },
    { emoji: "🪨", name: "STONE", description: "Ancient, sacred, grounded environments" },
    { emoji: "🏙", name: "URBAN", description: "Modern, buzzing, architecturally stimulating" },
    { emoji: "🏜", name: "DESERT", description: "Silent, minimal, open horizons" },
  ];

  const isValid = Q34.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12"
    >
      <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
        <h3 className="text-2xl font-heading font-semibold mb-6">
          Rank these landscape types from most to least resonant with your soul.
        </h3>
        <p className="text-sm text-muted-foreground mb-8">
          Enter the order as comma-separated values (e.g., "Fire, Water, Stone, Urban, Desert")
        </p>

        {/* Element Cards */}
        <div className="grid gap-4 mb-8">
          {elements.map((element, index) => (
            <motion.div
              key={element.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <span className="text-3xl">{element.emoji}</span>
              <div className="flex-1">
                <h4 className="font-semibold text-lg">{element.name}</h4>
                <p className="text-sm text-muted-foreground">{element.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input */}
        <div className="space-y-3">
          <Label htmlFor="ranking">Your Ranking (1 = Most Resonant)</Label>
          <Input
            id="ranking"
            placeholder="e.g., Fire, Water, Stone, Urban, Desert"
            value={Q34}
            onChange={(e) => setQ34(e.target.value)}
            className="text-base"
          />
          <p className="text-xs text-muted-foreground">
            Scoring: Rank 1 = 100 points, Rank 2 = 75 points, Rank 3 = 50 points, Rank 4 = 25 points, Rank 5 = 0 points
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-8">
        {onBack && (
          <Button onClick={onBack} variant="outline" size="lg" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        )}
        <Button onClick={handleNext} disabled={!isValid} size="lg" className="ml-auto gap-2">
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default Section4;
