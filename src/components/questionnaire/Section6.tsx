import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { QuestionnaireData } from "../SoulPrintQuestionnaire";
import { ArrowLeft, ArrowRight } from "lucide-react";
import SliderQuestion from "./SliderQuestion";

interface Section6Props {
  initialData: QuestionnaireData;
  onNext: (data: QuestionnaireData) => void;
  onBack?: () => void;
}

const Section6 = ({ initialData, onNext, onBack }: Section6Props) => {
  const [Q43, setQ43] = useState(initialData.Q43 || "");
  const [Q44, setQ44] = useState(initialData.Q44 || "");
  const [burdens, setBurdens] = useState({
    overwhelm: initialData.Q45_overwhelm || 50,
    uncertainty: initialData.Q45_uncertainty || 50,
    burnout: initialData.Q45_burnout || 50,
    disconnection: initialData.Q45_disconnection || 50,
  });
  const [Q46, setQ46] = useState(initialData.Q46 || "");

  const handleNext = () => {
    onNext({
      Q43,
      Q44,
      Q45_overwhelm: burdens.overwhelm,
      Q45_uncertainty: burdens.uncertainty,
      Q45_burnout: burdens.burnout,
      Q45_disconnection: burdens.disconnection,
      Q46,
    });
  };

  const q43Options = [
    "A transition",
    "A quiet rebuilding",
    "An awakening",
    "A deepening",
    "A search",
    "A soft unfolding",
  ];

  const q44Options = ["Calm", "Courage", "Clarity", "Softness", "Aliveness", "Reset"];

  const q46Options = [
    "Let go",
    "Begin again",
    "Understand",
    "Restore",
    "Transform",
    "Feel again",
  ];

  const isValid = Q43 && Q44 && Q46;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12"
    >
      {/* Q43 */}
      <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
        <h3 className="text-2xl font-heading font-semibold mb-6">
          Your life right now feels like...
        </h3>
        <RadioGroup value={Q43} onValueChange={setQ43} className="space-y-4">
          {q43Options.map((option, index) => (
            <motion.div
              key={option}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-3 p-4 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <RadioGroupItem value={option} id={`q43-${option}`} />
              <Label htmlFor={`q43-${option}`} className="text-base cursor-pointer">
                {option}
              </Label>
            </motion.div>
          ))}
        </RadioGroup>
      </div>

      {/* Q44 */}
      <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
        <h3 className="text-2xl font-heading font-semibold mb-6">
          Which emotional shift calls to you most?
        </h3>
        <RadioGroup value={Q44} onValueChange={setQ44} className="space-y-4">
          {q44Options.map((option, index) => (
            <motion.div
              key={option}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-3 p-4 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <RadioGroupItem value={option} id={`q44-${option}`} />
              <Label htmlFor={`q44-${option}`} className="text-base cursor-pointer">
                {option}
              </Label>
            </motion.div>
          ))}
        </RadioGroup>
      </div>

      {/* Q45 - Emotional Burden */}
      <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
        <h3 className="text-2xl font-heading font-semibold mb-8">
          What weight do you quietly carry at the moment?
        </h3>
        <div className="space-y-8">
          <SliderQuestion
            question="Overwhelm"
            value={burdens.overwhelm}
            onChange={(value) => setBurdens({ ...burdens, overwhelm: value })}
          />
          <SliderQuestion
            question="Uncertainty"
            value={burdens.uncertainty}
            onChange={(value) => setBurdens({ ...burdens, uncertainty: value })}
            delay={0.1}
          />
          <SliderQuestion
            question="Burnout"
            value={burdens.burnout}
            onChange={(value) => setBurdens({ ...burdens, burnout: value })}
            delay={0.2}
          />
          <SliderQuestion
            question="Disconnection"
            value={burdens.disconnection}
            onChange={(value) => setBurdens({ ...burdens, disconnection: value })}
            delay={0.3}
          />
        </div>
      </div>

      {/* Q46 */}
      <div className="bg-card rounded-2xl p-8 shadow-sm border border-border">
        <h3 className="text-2xl font-heading font-semibold mb-6">
          This journey would feel complete if it helped me...
        </h3>
        <RadioGroup value={Q46} onValueChange={setQ46} className="space-y-4">
          {q46Options.map((option, index) => (
            <motion.div
              key={option}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-3 p-4 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <RadioGroupItem value={option} id={`q46-${option}`} />
              <Label htmlFor={`q46-${option}`} className="text-base cursor-pointer">
                {option}
              </Label>
            </motion.div>
          ))}
        </RadioGroup>
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

export default Section6;
