import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number;
}

const ProgressBar = ({ progress }: ProgressBarProps) => {
  return (
    <div className="mt-6 w-full bg-muted/30 rounded-full h-2 overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-secondary via-primary to-accent rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
};

export default ProgressBar;
