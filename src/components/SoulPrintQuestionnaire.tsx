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
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">
                Erranza
              </h1>
              <p className="text-sm text-muted-foreground mt-1">SoulPrint Questionnaire v2.1</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">
                Section {currentSection + 1} of {totalSections}
              </p>
              <p className="text-xs text-muted-foreground mt-1">~9.5 minutes</p>
            </div>
          </motion.div>
          <ProgressBar progress={progress} />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Section Header */}
            <div className="mb-12 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="inline-block px-4 py-2 bg-secondary/30 rounded-full mb-4">
                  <p className="text-sm font-medium text-secondary-foreground uppercase tracking-wider">
                    Chapter {currentSection + 1}
                  </p>
                </div>
                <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  {sections[currentSection].title}
                </h2>
                <p className="text-lg text-muted-foreground italic">
                  "{sections[currentSection].subtitle}"
                </p>
              </motion.div>
            </div>

            {/* Section Content */}
            {CurrentComponent && (
              <CurrentComponent
                initialData={responses}
                onNext={handleNext}
                onBack={currentSection > 0 ? handleBack : undefined}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Erranza • Travel Smarter. Wander Better.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SoulPrintQuestionnaire;
