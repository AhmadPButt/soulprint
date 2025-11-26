import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { QuestionnaireData } from "../SoulPrintQuestionnaire";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Section7Props {
  initialData: QuestionnaireData;
  onNext: (data: QuestionnaireData) => void;
  onBack?: () => void;
}

const Section7 = ({ initialData, onNext, onBack }: Section7Props) => {
  const [Q47, setQ47] = useState(initialData.Q47 || "");
  const [Q48, setQ48] = useState(initialData.Q48 || "");

  const handleNext = () => {
    onNext({ Q47, Q48 });
  };

  const isValid = Q47.trim().length > 0 && Q48.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12"
    >
      {/* Q47 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-8 shadow-sm border border-border"
      >
        <Label htmlFor="q47" className="text-2xl font-heading font-semibold mb-4 block">
          Why Azerbaijan, now?
        </Label>
        <p className="text-sm text-muted-foreground mb-6 italic">
          Your story matters to the journey. Share what calls you to this place at this moment.
        </p>
        <Textarea
          id="q47"
          value={Q47}
          onChange={(e) => setQ47(e.target.value)}
          placeholder="Share your thoughts..."
          className="min-h-[200px] text-base resize-none"
        />
      </motion.div>

      {/* Q48 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl p-8 shadow-sm border border-border"
      >
        <Label htmlFor="q48" className="text-2xl font-heading font-semibold mb-4 block">
          What shape do you hope this journey carves into you?
        </Label>
        <p className="text-sm text-muted-foreground mb-6 italic">
          Describe the transformation, insight, or feeling you hope to carry home.
        </p>
        <Textarea
          id="q48"
          value={Q48}
          onChange={(e) => setQ48(e.target.value)}
          placeholder="Share your thoughts..."
          className="min-h-[200px] text-base resize-none"
        />
      </motion.div>

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

export default Section7;
