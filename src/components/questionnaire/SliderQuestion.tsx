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
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay, 
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{ scale: 1.01 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-start gap-4">
        <motion.p 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + 0.1, duration: 0.4 }}
          className="text-sm text-foreground/90 leading-relaxed flex-1"
        >
          {question}
        </motion.p>
      </div>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.2, duration: 0.4 }}
        className="space-y-3"
      >
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full cursor-pointer transition-all duration-200 hover:scale-105"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Disagree</span>
          <span>Neutral</span>
          <span>Agree</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SliderQuestion;
