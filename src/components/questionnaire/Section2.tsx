import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { QuestionnaireData } from "../SoulPrintQuestionnaire";
import { ArrowLeft, ArrowRight } from "lucide-react";
import SliderQuestion from "./SliderQuestion";

interface Section2Props {
  initialData: QuestionnaireData;
  onNext: (data: QuestionnaireData) => void;
  onBack?: () => void;
}

const Section2 = ({ initialData, onNext, onBack }: Section2Props) => {
  const [responses, setResponses] = useState({
    Q4: initialData.Q4 || 50,
    Q5: initialData.Q5 || 50,
    Q6: initialData.Q6 || 50,
    Q7: initialData.Q7 || 50,
    Q8: initialData.Q8 || 50,
    Q9: initialData.Q9 || 50,
    Q10: initialData.Q10 || 50,
    Q11: initialData.Q11 || 50,
    Q12: initialData.Q12 || 50,
    Q13: initialData.Q13 || 50,
    Q14: initialData.Q14 || 50,
    Q15: initialData.Q15 || 50,
    Q16: initialData.Q16 || 50,
    Q17: initialData.Q17 || 50,
    Q18: initialData.Q18 || 50,
    Q19: initialData.Q19 || 50,
    Q20: initialData.Q20 || 50,
    Q21: initialData.Q21 || 50,
    Q22: initialData.Q22 || 50,
    Q23: initialData.Q23 || 50,
  });

  const handleChange = (key: string, value: number) => {
    setResponses({ ...responses, [key]: value });
  };

  const handleNext = () => {
    onNext(responses);
  };

  const traits = [
    {
      name: "Extraversion",
      emoji: "🌿",
      questions: [
        { id: "Q4", text: "I feel energized by people, shared moments, and movement." },
        { id: "Q5", text: "I naturally gravitate toward conversation and connection." },
        { id: "Q6", text: "I prefer being part of a lively group over quiet solitude." },
        { id: "Q7", text: "Quiet environments restore me more than social ones.", reverse: true },
      ],
    },
    {
      name: "Openness",
      emoji: "🌒",
      questions: [
        { id: "Q8", text: "I'm drawn to unfamiliar ideas, sensations, and landscapes." },
        { id: "Q9", text: "I actively seek out experiences that challenge my perspective." },
        { id: "Q10", text: "Unusual or unconventional places excite me more than famous landmarks." },
        { id: "Q11", text: "I prefer predictable environments over unknown terrain.", reverse: true },
      ],
    },
    {
      name: "Conscientiousness",
      emoji: "📐",
      questions: [
        { id: "Q12", text: "I like structure, clarity, and intentional planning when I travel." },
        { id: "Q13", text: "I follow through on the intentions I set for myself." },
        { id: "Q14", text: "I set clear goals for what I want to accomplish when I travel." },
        { id: "Q15", text: "I often leave tasks incomplete or decisions unmade.", reverse: true },
      ],
    },
    {
      name: "Agreeableness",
      emoji: "🤍",
      questions: [
        { id: "Q16", text: "Harmony and emotional ease matter to me in group settings." },
        { id: "Q17", text: "I adapt gracefully to different people and energies." },
        { id: "Q18", text: "I prioritize group preferences over my personal wishes when traveling." },
        { id: "Q19", text: "I tend to voice disagreement when I don't like a plan.", reverse: true },
      ],
    },
    {
      name: "Emotional Stability",
      emoji: "🌊",
      questions: [
        { id: "Q20", text: "When things shift unexpectedly, I regain balance quickly." },
        { id: "Q21", text: "I stay calm and centered in unfamiliar situations." },
        { id: "Q22", text: "Uncertainty about plans makes me anxious.", reverse: true },
        { id: "Q23", text: "My emotions easily overwhelm me when plans change.", reverse: true },
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12"
    >
      {traits.map((trait, traitIndex) => (
        <div key={trait.name} className="bg-card rounded-2xl p-8 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-4xl">{trait.emoji}</span>
            <h3 className="text-2xl font-heading font-semibold">{trait.name}</h3>
          </div>
          <div className="space-y-8">
            {trait.questions.map((question, qIndex) => (
              <SliderQuestion
                key={question.id}
                question={question.text}
                value={responses[question.id as keyof typeof responses]}
                onChange={(value) => handleChange(question.id, value)}
                reverse={question.reverse}
                delay={traitIndex * 0.1 + qIndex * 0.05}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Navigation */}
      <div className="flex justify-between pt-8">
        {onBack && (
          <Button onClick={onBack} variant="outline" size="lg" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        )}
        <Button onClick={handleNext} size="lg" className="ml-auto gap-2">
          Continue <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default Section2;
