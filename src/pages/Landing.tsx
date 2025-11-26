import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import fingerprintImage from "@/assets/fingerprint.png";

const Landing = () => {
  const navigate = useNavigate();

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
              <div className="text-center">
                <h1 className="text-2xl font-heading font-bold tracking-tight text-foreground">
                  ERRANZA
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Travel Smarter. Wander Better.
                </p>
              </div>
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
              <h2 className="text-6xl md:text-7xl lg:text-8xl font-heading font-bold mb-8 bg-gradient-to-r from-lavender-accent via-cream-accent to-lavender-accent bg-clip-text text-transparent">
                SoulPrint
              </h2>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-lg md:text-xl text-muted-foreground mb-16 max-w-2xl mx-auto"
              >
                A journey begins not with a destination, but with understanding who travels.
              </motion.p>
            </motion.div>

            {/* Fingerprint with glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="relative mb-16"
            >
              <div className="relative inline-block">
                <img 
                  src={fingerprintImage} 
                  alt="SoulPrint Fingerprint" 
                  className="w-[400px] md:w-[500px] h-auto mx-auto relative z-10 opacity-90"
                />
              </div>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              <Button
                onClick={() => navigate("/questionnaire")}
                size="lg"
                className="text-lg px-12 py-6 h-auto bg-lavender-accent hover:bg-lavender-accent/90 text-background font-heading font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Begin SoulPrint Assessment
              </Button>
              
              <p className="text-sm text-muted-foreground mt-6">
                ~9.5 minutes • Azerbaijan Edition
              </p>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="glass-card border-t border-border/30">
          <div className="container mx-auto px-4 py-6 text-center">
            <p className="text-xs text-muted-foreground">
              © 2025 Erranza • All rights reserved
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
