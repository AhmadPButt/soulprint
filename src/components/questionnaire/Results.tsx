import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RefreshCcw, CheckCircle2 } from "lucide-react";
import { QuestionnaireData } from "../SoulPrintQuestionnaire";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface ResultsProps {
  responses: QuestionnaireData;
  onRestart: () => void;
}

const Results = ({ responses, onRestart }: ResultsProps) => {
  const { toast } = useToast();
  const [emailSent, setEmailSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const sendEmail = async () => {
      if (emailSent || isSending) return;
      
      setIsSending(true);
      try {
        const { data, error } = await supabase.functions.invoke('send-questionnaire-results', {
          body: {
            responses,
            timestamp: new Date().toISOString()
          }
        });

        if (error) throw error;

        setEmailSent(true);
        toast({
          title: "Responses Submitted!",
          description: "Your SoulPrint questionnaire has been sent to Erranza.",
        });
      } catch (error) {
        console.error('Error sending questionnaire results:', error);
        toast({
          title: "Submission Error",
          description: "There was an issue sending your responses. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setIsSending(false);
      }
    };

    sendEmail();
  }, [responses, emailSent, isSending, toast]);

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
          
          <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6 bg-gradient-to-r from-brand-lavender-mood via-brand-lavender-haze to-brand-coastal-indigo bg-clip-text text-transparent">
            Your SoulPrint is Complete
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {isSending ? "Sending your responses..." : emailSent ? "Your responses have been sent to Erranza!" : "Thank you for sharing your story. Your responses will help us craft a journey that resonates with your deepest self."}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-8 shadow-lg border border-border mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            {emailSent && <CheckCircle2 className="w-8 h-8 text-brand-lavender-mood" />}
            <h2 className="text-2xl font-heading font-semibold">
              {emailSent ? "Successfully Submitted" : isSending ? "Submitting..." : "Submission Status"}
            </h2>
          </div>
          
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {isSending 
                ? "Sending your questionnaire responses to Erranza..." 
                : emailSent 
                ? "Your SoulPrint questionnaire has been successfully sent to our team at Erranza. We'll be in touch soon to begin crafting your Azerbaijan experience." 
                : "Preparing to send your responses..."}
            </p>
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
