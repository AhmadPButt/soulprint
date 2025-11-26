import { motion } from "framer-motion";

interface SliderQuestionProps {
  question: string;
  value: number;
  onChange: (value: number) => void;
  reverse?: boolean;
  delay?: number;
}

const SliderQuestion = ({ question, value, onChange, reverse, delay = 0 }: SliderQuestionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="space-y-4"
    >
      <div className="flex justify-between items-start gap-4">
        <p className="text-base leading-relaxed flex-1">
          {question}
          {reverse && <span className="ml-2 text-xs text-accent font-medium">(REVERSE)</span>}
        </p>
        <span className="font-semibold text-lg text-primary min-w-[3rem] text-right">
          {value}
        </span>
      </div>
      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Strongly Disagree</span>
          <span>Neutral</span>
          <span>Strongly Agree</span>
        </div>
      </div>
    </motion.div>
  );
};

export default SliderQuestion;
