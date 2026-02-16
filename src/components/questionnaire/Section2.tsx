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
        { id: "Q4", text: "For this trip, I want to be energized by people, shared moments, and movement." },
        { id: "Q5", text: "On this trip, I want to gravitate toward conversation and connection." },
        { id: "Q6", text: "For this trip, I prefer being part of a lively group over quiet solitude." },
        { id: "Q7", text: "On this trip, I prefer quiet environments to recharge.", reverse: true },
      ],
    },
    {
      name: "Openness",
      emoji: "🌒",
      questions: [
        { id: "Q8", text: "For this trip, I want to seek out unfamiliar ideas, sensations, and landscapes." },
        { id: "Q9", text: "On this trip, I want experiences that challenge my perspective." },
        { id: "Q10", text: "For this trip, unusual or unconventional places excite me more than famous landmarks." },
        { id: "Q11", text: "On this trip, I prefer predictable environments over unknown terrain.", reverse: true },
      ],
    },
    {
      name: "Conscientiousness",
      emoji: "📐",
      questions: [
        { id: "Q12", text: "For this trip, I want structure, clarity, and intentional planning." },
        { id: "Q13", text: "On this trip, I intend to follow through on the intentions I set." },
        { id: "Q14", text: "For this trip, I want clear goals for what I accomplish." },
        { id: "Q15", text: "On this trip, I'm likely to leave decisions unmade and go with the flow.", reverse: true },
      ],
    },
    {
      name: "Agreeableness",
      emoji: "🤍",
      questions: [
        { id: "Q16", text: "For this trip, harmony and emotional ease matter to me in group settings." },
        { id: "Q17", text: "On this trip, I want to adapt gracefully to different people and energies." },
        { id: "Q18", text: "For this trip, I'll prioritize group preferences over my personal wishes." },
        { id: "Q19", text: "On this trip, I'll voice disagreement when I don't like a plan.", reverse: true },
      ],
    },
    {
      name: "Emotional Stability",
      emoji: "🌊",
      questions: [
        { id: "Q20", text: "On this trip, when things shift unexpectedly, I'll regain balance quickly." },
        { id: "Q21", text: "For this trip, I expect to stay calm and centered in unfamiliar situations." },
        { id: "Q22", text: "On this trip, uncertainty about plans will make me anxious.", reverse: true },
        { id: "Q23", text: "For this trip, my emotions may overwhelm me when plans change.", reverse: true },
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
