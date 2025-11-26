import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download, RefreshCcw } from "lucide-react";
import { QuestionnaireData } from "../SoulPrintQuestionnaire";

interface ResultsProps {
  responses: QuestionnaireData;
  onRestart: () => void;
}

const Results = ({ responses, onRestart }: ResultsProps) => {
  const handleDownload = () => {
    const dataStr = JSON.stringify(responses, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `soulprint-responses-${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-block mb-6"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-primary via-accent to-secondary rounded-full flex items-center justify-center">
              <span className="text-5xl">✨</span>
            </div>
          </motion.div>
          
          <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Your SoulPrint is Complete
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Thank you for sharing your story. Your responses will help us craft a journey that resonates with your deepest self.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-8 shadow-lg border border-border mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-semibold">Your Responses</h2>
            <Button onClick={handleDownload} variant="outline" className="gap-2">
              <Download className="w-4 h-4" /> Download JSON
            </Button>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-6 overflow-auto max-h-[500px] font-mono text-sm">
            <pre>{JSON.stringify(responses, null, 2)}</pre>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button onClick={onRestart} variant="outline" size="lg" className="gap-2">
            <RefreshCcw className="w-4 h-4" /> Start Over
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            We'll be in touch soon to begin crafting your Azerbaijan experience.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-muted-foreground">
            © 2025 Erranza • Travel Smarter. Wander Better.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Results;
