import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { QuestionnaireData } from "../SoulPrintQuestionnaire";
import { ArrowLeft, ArrowRight } from "lucide-react";
import SliderQuestion from "./SliderQuestion";

interface Section5Props {
  initialData: QuestionnaireData;
  onNext: (data: QuestionnaireData) => void;
  onBack?: () => void;
}

const Section5 = ({ initialData, onNext, onBack }: Section5Props) => {
  const [responses, setResponses] = useState({
    Q35: initialData.Q35 || 50,
    Q36: initialData.Q36 || 50,
    Q37: initialData.Q37 || 50,
    Q38: initialData.Q38 || 50,
    Q39: initialData.Q39 || 50,
    Q40: initialData.Q40 || 50,
    Q41: initialData.Q41 || 50,
    Q42: initialData.Q42 || 50,
  });

  const handleChange = (key: string, value: number) => {
    setResponses({ ...responses, [key]: value });
  };

  const handleNext = () => {
    onNext(responses);
  };

  const compass = [
    {
      name: "Transformation",
      emoji: "🦋",
      questions: [
        { id: "Q35", text: "I travel hoping to return home somehow changed." },
        { id: "Q36", text: "A successful trip shifts something inside me." },
      ],
    },
    {
      name: "Clarity",
      emoji: "🔍",
      questions: [
        { id: "Q37", text: "I often travel to gain perspective on my life." },
        { id: "Q38", text: "Distance from my routine helps me think more clearly." },
      ],
    },
    {
      name: "Aliveness",
      emoji: "⚡",
      questions: [
        { id: "Q39", text: "I travel to feel fully awake and present." },
        { id: "Q40", text: "New experiences make me feel more alive." },
      ],
    },
    {
      name: "Connection",
      emoji: "🤝",
      questions: [
        { id: "Q41", text: "Human connection is a core part of why I travel." },
        { id: "Q42", text: "Shared experiences matter more to me than solo discoveries." },
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12"
    >
      {compass.map((dimension, dimIndex) => (
        <div key={dimension.name} className="bg-card rounded-2xl p-8 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-4xl">{dimension.emoji}</span>
            <h3 className="text-2xl font-heading font-semibold">{dimension.name}</h3>
          </div>
          <div className="space-y-8">
            {dimension.questions.map((question, qIndex) => (
              <SliderQuestion
                key={question.id}
                question={question.text}
                value={responses[question.id as keyof typeof responses]}
                onChange={(value) => handleChange(question.id, value)}
                delay={dimIndex * 0.1 + qIndex * 0.05}
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

export default Section5;
