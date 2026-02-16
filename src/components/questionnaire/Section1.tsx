import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { QuestionnaireData } from "../SoulPrintQuestionnaire";
import { ArrowRight } from "lucide-react";

interface Section1Props {
  initialData: QuestionnaireData;
  onNext: (data: QuestionnaireData) => void;
  onBack?: () => void;
}

const Section1 = ({ initialData, onNext }: Section1Props) => {
  const [Q2, setQ2] = useState(initialData.Q2 || "");
  const [Q3, setQ3] = useState(initialData.Q3 || 50);

  const q2Options = [
    { value: "slow", label: "Slow, intentional, unhurried" },
    { value: "balanced", label: "Balanced — depth with movement" },
    { value: "adventurous", label: "Adventurous, energetic, open to the unexpected" },
  ];

  const handleNext = () => {
    onNext({ Q2, Q3 });
  };

  const isValid = !!Q2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Q2 */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">
          What pace feels right for this trip?
        </h3>
        <RadioGroup value={Q2} onValueChange={setQ2} className="space-y-3">
          {q2Options.map((option, index) => (
            <motion.div
              key={option.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-foreground/5 transition-colors"
            >
              <RadioGroupItem value={option.value} id={`q2-${option.value}`} />
              <Label
                htmlFor={`q2-${option.value}`}
                className="text-sm cursor-pointer leading-relaxed text-foreground/90"
              >
                {option.label}
              </Label>
            </motion.div>
          ))}
        </RadioGroup>
      </div>

      {/* Q3 */}
      <div className="space-y-4 pt-6 border-t border-border/50">
        <h3 className="text-lg font-medium text-foreground">
          What emotional rhythm do you seek on this trip?
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Calm</span>
            <span className="font-medium text-foreground text-sm">{Q3}</span>
            <span>Stimulating</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Q3}
            onChange={(e) => setQ3(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-8">
        <Button
          onClick={handleNext}
          disabled={!isValid}
          size="lg"
          className="gap-2"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default Section1;
