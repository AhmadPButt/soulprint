import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { QuestionnaireData } from "../SoulPrintQuestionnaire";
import { ArrowLeft, ArrowRight } from "lucide-react";
import SliderQuestion from "./SliderQuestion";

interface Section4Props {
  initialData: QuestionnaireData;
  onNext: (data: QuestionnaireData) => void;
  onBack?: () => void;
}

const Section4 = ({ initialData, onNext, onBack }: Section4Props) => {
  const [responses, setResponses] = useState({
    Q34: initialData.Q34 || 50,
    Q35: initialData.Q35 || 50,
    Q36: initialData.Q36 || 50,
    Q37: initialData.Q37 || 50,
    Q38: initialData.Q38 || 50,
    Q39: initialData.Q39 || 50,
    Q40: initialData.Q40 || 50,
  });

  const handleChange = (key: string, value: number) => {
    setResponses({ ...responses, [key]: value });
  };

  const handleNext = () => {
    onNext(responses);
  };

  const dimensions = [
    {
      name: "Luxury Style",
      emoji: "💎",
      questions: [
        { id: "Q34", text: "For this trip, I want everything to be perfectly polished and seamless." },
        { id: "Q35", text: "On this trip, I prefer authentic character even if it means some imperfections.", reverse: true },
        { id: "Q36", text: "For this trip, I value five-star service and attention to detail." },
        { id: "Q37", text: "On this trip, I want experiences that feel real and unfiltered, not curated.", reverse: true },
      ],
    },
    {
      name: "Pace & Rhythm",
      emoji: "🎵",
      questions: [
        { id: "Q38", text: "For this trip, I want long, lingering experiences — no rushing." },
        { id: "Q39", text: "On this trip, I want to maximize experiences and see as much as possible.", reverse: true },
        { id: "Q40", text: "For this trip, I prefer days with 1-2 activities, leaving time to breathe." },
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12"
    >
      {dimensions.map((dimension, dimIndex) => (
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
                reverse={question.reverse}
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

export default Section4;
