import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RefreshCcw, CheckCircle2 } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { QuestionnaireData } from "../SoulPrintQuestionnaire";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ResultsProps {
  responses: QuestionnaireData;
  onRestart: () => void;
  user: User;
}

const Results = ({ responses, onRestart, user }: ResultsProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
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
            timestamp: new Date().toISOString(),
            user: {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            }
          }
        });

        if (error) throw error;

        setEmailSent(true);
        toast({
          title: "Responses Submitted!",
          description: "Your SoulPrint questionnaire has been sent to Erranza.",
        });
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
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
          
          <h1 className="text-5xl md:text-6xl font-heading font-thin mb-6 text-foreground">
            Your SoulPrint is Complete
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {isSending ? "Sending your responses..." : emailSent ? "Your responses have been sent to Erranza!" : "Thank you for sharing your story. Your responses will help us match you with your perfect destination."}
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
                ? "Sending your SoulPrint responses to Erranza..." 
                : emailSent 
                ? "Your SoulPrint has been successfully submitted. We'll use your profile to find your perfect destination and craft a personalized itinerary." 
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
            We'll be in touch soon to share your destination matches.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-muted-foreground">
            © 2025 Erranza
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Results;
