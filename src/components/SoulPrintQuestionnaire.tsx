import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Section1 from "./questionnaire/Section1";
import Section2 from "./questionnaire/Section2";
import Section3 from "./questionnaire/Section3";
import Section4 from "./questionnaire/Section4";
import Section5 from "./questionnaire/Section5";
import Section6 from "./questionnaire/Section6";
import Section7 from "./questionnaire/Section7";
import Section8 from "./questionnaire/Section8";
import Results from "./questionnaire/Results";
import ProgressBar from "./questionnaire/ProgressBar";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

export interface QuestionnaireData {
  [key: string]: any;
}

const STORAGE_KEY = "soulprint_questionnaire_progress";

const SoulPrintQuestionnaire = () => {
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState(0);
  const [responses, setResponses] = useState<QuestionnaireData>({});
  const [showResults, setShowResults] = useState(false);
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false);

  const totalSections = 8;
  const progress = ((currentSection + 1) / totalSections) * 100;

  const sections = [
    { component: Section1, title: "The Land of Fire", subtitle: "Tell us why this land calls to you." },
    { component: Section2, title: "Core Traits", subtitle: "A moment to calibrate your inner architecture." },
    { component: Section3, title: "Travel Behavior", subtitle: "Tell us how you move through the world." },
    { component: Section4, title: "Elemental Resonance", subtitle: "Which terrains speak to your deeper self?" },
    { component: Section5, title: "Inner Compass", subtitle: "What do you travel for?" },
    { component: Section6, title: "State Assessment", subtitle: "Where are you inwardly, at this moment?" },
    { component: Section7, title: "Narrative Identity", subtitle: "Your story matters to the journey." },
    { component: Section8, title: "Practicalities", subtitle: "Essential details for your journey." },
  ];

  const CurrentComponent = sections[currentSection]?.component;

  // Load saved progress on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem(STORAGE_KEY);
    if (savedProgress && !hasRestoredProgress) {
      try {
        const { section, data, timestamp } = JSON.parse(savedProgress);
        const hoursSinceLastSave = (Date.now() - timestamp) / (1000 * 60 * 60);
        
        // Only restore if saved within last 7 days
        if (hoursSinceLastSave < 168) {
          setCurrentSection(section);
          setResponses(data);
          setHasRestoredProgress(true);
          
          toast({
            title: "Progress Restored",
            description: `Continuing from Section ${section + 1}`,
            duration: 4000,
          });
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error("Failed to restore progress:", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [hasRestoredProgress, toast]);

  // Save progress to localStorage whenever responses or section changes
  useEffect(() => {
    if (hasRestoredProgress || currentSection > 0 || Object.keys(responses).length > 0) {
      const progressData = {
        section: currentSection,
        data: responses,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progressData));
    }
  }, [currentSection, responses, hasRestoredProgress]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          showResults) {
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentSection, showResults]);

  const handleNext = (sectionData: QuestionnaireData) => {
    const updatedResponses = { ...responses, ...sectionData };
    setResponses(updatedResponses);
    
    if (currentSection < totalSections - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      setShowResults(true);
      // Clear saved progress when completing
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleBack = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleRestart = () => {
    setCurrentSection(0);
    setResponses({});
    setShowResults(false);
    setHasRestoredProgress(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (showResults) {
    return <Results responses={responses} onRestart={handleRestart} />;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-card border-b border-border/30 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-thin tracking-tight text-foreground">
                SoulPrint
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Erranza</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-foreground/80">
                {currentSection + 1} / {totalSections}
              </p>
              <div className="flex items-center gap-2 justify-end">
                <p className="text-xs text-muted-foreground">Azerbaijan Edition</p>
                {hasRestoredProgress && (
                  <span className="text-xs text-lavender-accent flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Auto-saved
                  </span>
                )}
              </div>
            </div>
          </motion.div>
          <ProgressBar progress={progress} />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ 
              duration: 0.5,
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            {/* Section Header */}
            <div className="mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  Chapter {currentSection + 1}
                </p>
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
                  {sections[currentSection].title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {sections[currentSection].subtitle}
                </p>
              </motion.div>
            </div>

            {/* Section Content - Glass Card */}
            <div className="glass-card p-8 md:p-12">
              {CurrentComponent && (
                <CurrentComponent
                  initialData={responses}
                  onNext={handleNext}
                  onBack={currentSection > 0 ? handleBack : undefined}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 mt-20 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <p className="text-xs text-muted-foreground">
              © 2025 Erranza
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="hidden sm:inline">Press <kbd className="px-2 py-1 bg-border/30 rounded text-[10px]">ESC</kbd> to go back</span>
              <span className="text-[10px] opacity-60">Progress auto-saved</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SoulPrintQuestionnaire;
