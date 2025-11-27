import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import fingerprintImage from "@/assets/fingerprint.png";
import erranzaLogo from "@/assets/erranza-logo.png";
import TermsDialog from "@/components/TermsDialog";

const Landing = () => {
  const navigate = useNavigate();
  const [showTermsDialog, setShowTermsDialog] = useState(false);

  const handleBeginAssessment = () => {
    setShowTermsDialog(true);
  };

  const handleTermsAccepted = () => {
    setShowTermsDialog(false);
    navigate("/auth");
  };

  const handleTermsCancelled = () => {
    setShowTermsDialog(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background/95" />
      
      {/* Animated lavender glow behind fingerprint */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
        <motion.div
          className="absolute inset-0 rounded-full bg-lavender-accent/30 blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header with Erranza logo */}
        <header className="glass-card border-b border-border/30">
          <div className="container mx-auto px-4 py-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-center"
            >
              <img 
                src={erranzaLogo} 
                alt="Erranza" 
                className="h-8 w-auto"
              />
            </motion.div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="container max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="text-6xl md:text-7xl lg:text-8xl font-heading font-thin mb-16 text-foreground">
                SoulPrint
              </h2>
            </motion.div>

            {/* Fingerprint with glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="relative mb-16 group cursor-pointer"
            >
              <div className="relative inline-block">
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-lavender-accent/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-110" />
                
                <img 
                  src={fingerprintImage} 
                  alt="SoulPrint Fingerprint" 
                  className="w-[400px] md:w-[500px] h-auto mx-auto relative z-10 opacity-90 transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <Button
                onClick={handleBeginAssessment}
                size="lg"
                className="text-lg px-12 py-6 h-auto bg-lavender-accent hover:bg-lavender-accent/90 text-white font-heading font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
              >
                Begin SoulPrint Assessment
              </Button>
              
              <Button
                onClick={() => navigate("/auth")}
                variant="outline"
                size="lg"
                className="text-lg px-12 py-6 h-auto font-heading font-semibold w-full sm:w-auto"
              >
                Sign In (Returning User)
              </Button>
              
              <p className="text-sm text-muted-foreground mt-2">
                Azerbaijan Edition
              </p>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="glass-card border-t border-border/30">
          <div className="container mx-auto px-4 py-6 text-center">
            <p className="text-xs text-muted-foreground">
              © 2025 Erranza • All rights reserved •{" "}
              <a href="/admin" className="hover:text-foreground transition-colors">
                Admin
              </a>
            </p>
          </div>
        </footer>
      </div>

      <TermsDialog
        open={showTermsDialog}
        onAccept={handleTermsAccepted}
        onCancel={handleTermsCancelled}
      />
    </div>
  );
};

export default Landing;
