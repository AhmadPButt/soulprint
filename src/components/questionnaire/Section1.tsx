import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [Q1, setQ1] = useState<string[]>(initialData.Q1 || []);
  const [Q2, setQ2] = useState(initialData.Q2 || "");
  const [Q3, setQ3] = useState(initialData.Q3 || 50);

  const q1Options = [
    "The Land of Fire and its ancient mystique",
    "A shift or transition I'm moving through",
    "A desire for depth, meaning, and clarity",
    "The fusion of modern architecture and old stone",
    "The sense of unfamiliar terrain calling me",
  ];

  const q2Options = [
    { value: "slow", label: "Slow, intentional, unhurried" },
    { value: "balanced", label: "Balanced — depth with movement" },
    { value: "adventurous", label: "Adventurous, energetic, open to the unexpected" },
  ];

  const handleQ1Change = (option: string, checked: boolean) => {
    if (checked) {
      setQ1([...Q1, option]);
    } else {
      setQ1(Q1.filter((item) => item !== option));
    }
  };

  const handleNext = () => {
    onNext({ Q1, Q2, Q3 });
  };

  const isValid = Q1.length > 0 && Q2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12"
    >
      {/* Q1 */}
      <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
        <h3 className="text-2xl font-heading font-semibold mb-6">
          What draws you to Azerbaijan at this moment in your life?
        </h3>
        <p className="text-sm text-muted-foreground mb-6">Select all that apply</p>
        <div className="space-y-4">
          {q1Options.map((option, index) => (
            <motion.div
              key={option}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-3 p-4 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <Checkbox
                id={`q1-${index}`}
                checked={Q1.includes(option)}
                onCheckedChange={(checked) => handleQ1Change(option, checked as boolean)}
              />
              <Label
                htmlFor={`q1-${index}`}
                className="text-base cursor-pointer leading-relaxed"
              >
                {option}
              </Label>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Q2 */}
      <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
        <h3 className="text-2xl font-heading font-semibold mb-6">
          What pace feels right for this journey?
        </h3>
        <RadioGroup value={Q2} onValueChange={setQ2} className="space-y-4">
          {q2Options.map((option, index) => (
            <motion.div
              key={option.value}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-3 p-4 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <RadioGroupItem value={option.value} id={`q2-${option.value}`} />
              <Label
                htmlFor={`q2-${option.value}`}
                className="text-base cursor-pointer leading-relaxed"
              >
                {option.label}
              </Label>
            </motion.div>
          ))}
        </RadioGroup>
      </div>

      {/* Q3 */}
      <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
        <h3 className="text-2xl font-heading font-semibold mb-6">
          What emotional rhythm do you seek when you travel?
        </h3>
        <div className="space-y-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Calm</span>
            <span className="font-semibold text-foreground text-lg">{Q3}</span>
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
          className="min-w-[200px] gap-2"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default Section1;
