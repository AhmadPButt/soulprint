import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { QuestionnaireData } from "../SoulPrintQuestionnaire";
import { ArrowLeft, ArrowRight } from "lucide-react";
import SliderQuestion from "./SliderQuestion";

interface Section3Props {
  initialData: QuestionnaireData;
  onNext: (data: QuestionnaireData) => void;
  onBack?: () => void;
}

const Section3 = ({ initialData, onNext, onBack }: Section3Props) => {
  const [responses, setResponses] = useState({
    Q24: initialData.Q24 || 50,
    Q25: initialData.Q25 || 50,
    Q26: initialData.Q26 || 50,
    Q27: initialData.Q27 || 50,
    Q28: initialData.Q28 || 50,
    Q29: initialData.Q29 || 50,
    Q30: initialData.Q30 || 50,
    Q31: initialData.Q31 || 50,
    Q32: initialData.Q32 || 50,
    Q33: initialData.Q33 || 50,
  });

  const handleChange = (key: string, value: number) => {
    setResponses({ ...responses, [key]: value });
  };

  const handleNext = () => {
    onNext(responses);
  };

  const behaviors = [
    {
      name: "Spontaneity & Flexibility",
      emoji: "🎭",
      questions: [
        { id: "Q24", text: "For this trip, I want to flow with changing plans without stress." },
        { id: "Q25", text: "On this trip, I'd feel energized when a day opens up unexpectedly." },
        { id: "Q26", text: "For this trip, I want to enjoy not knowing exactly what will happen next." },
        { id: "Q27", text: "On this trip, I'll get tense when structure disappears.", reverse: true },
      ],
    },
    {
      name: "Adventure Orientation",
      emoji: "🔥",
      questions: [
        { id: "Q28", text: "For this trip, I want gentle adventure — movement, discovery, the unexpected." },
        { id: "Q29", text: "On this trip, experiences will feel richer when there is some uncertainty." },
        { id: "Q30", text: "For this trip, I prefer days that are calm and predictable.", reverse: true },
      ],
    },
    {
      name: "Environmental Adaptation",
      emoji: "🌍",
      questions: [
        { id: "Q31", text: "For this trip, new landscapes won't intimidate me." },
        { id: "Q32", text: "On this trip, I'll adjust easily to different climates, foods, and surroundings." },
        { id: "Q33", text: "For this trip, physical discomfort will significantly impact my mood.", reverse: true },
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12"
    >
      {behaviors.map((behavior, behaviorIndex) => (
        <div key={behavior.name} className="bg-card rounded-2xl p-8 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-4xl">{behavior.emoji}</span>
            <h3 className="text-2xl font-heading font-semibold">{behavior.name}</h3>
          </div>
          <div className="space-y-8">
            {behavior.questions.map((question, qIndex) => (
              <SliderQuestion
                key={question.id}
                question={question.text}
                value={responses[question.id as keyof typeof responses]}
                onChange={(value) => handleChange(question.id, value)}
                reverse={question.reverse}
                delay={behaviorIndex * 0.1 + qIndex * 0.05}
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

export default Section3;
