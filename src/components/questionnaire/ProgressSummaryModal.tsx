import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";

interface ProgressSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSection: number;
  completedSections: boolean[];
  onJumpToSection: (section: number) => void;
  sections: Array<{ title: string; subtitle: string }>;
}

const ProgressSummaryModal = ({
  open,
  onOpenChange,
  currentSection,
  completedSections,
  onJumpToSection,
  sections,
}: ProgressSummaryModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">Progress Summary</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 mt-6">
          {sections.map((section, index) => {
            const isCompleted = completedSections[index];
            const isCurrent = index === currentSection;
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant={isCurrent ? "default" : "outline"}
                  className="w-full justify-start h-auto py-4 px-4"
                  onClick={() => {
                    onJumpToSection(index);
                    onOpenChange(false);
                  }}
                >
                  <div className="flex items-start gap-3 w-full text-left">
                    <div className="mt-0.5">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Section {index + 1}
                        </span>
                        {isCurrent && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm mt-1">{section.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {section.subtitle}
                      </p>
                    </div>
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProgressSummaryModal;
