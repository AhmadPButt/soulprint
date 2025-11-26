import { useState } from "react";
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

export interface QuestionnaireData {
  [key: string]: any;
}

const SoulPrintQuestionnaire = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const [responses, setResponses] = useState<QuestionnaireData>({});
  const [showResults, setShowResults] = useState(false);

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

  const handleNext = (sectionData: QuestionnaireData) => {
    setResponses({ ...responses, ...sectionData });
    
    if (currentSection < totalSections - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      setShowResults(true);
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
              <p className="text-xs text-muted-foreground">Azerbaijan Edition</p>
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
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            © 2025 Erranza
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SoulPrintQuestionnaire;
