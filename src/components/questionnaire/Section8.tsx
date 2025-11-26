import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { QuestionnaireData } from "../SoulPrintQuestionnaire";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { countries } from "@/lib/countries";

interface Section8Props {
  initialData: QuestionnaireData;
  onNext: (data: QuestionnaireData) => void;
  onBack?: () => void;
}

const Section8 = ({ initialData, onNext, onBack }: Section8Props) => {
  const [Q49, setQ49] = useState(initialData.Q49 || "");
  const [Q50, setQ50] = useState(initialData.Q50 || "");
  const [Q51, setQ51] = useState(initialData.Q51 || "");
  const [Q52, setQ52] = useState(initialData.Q52 || "");
  const [Q53, setQ53] = useState(initialData.Q53 || "");
  const [Q54, setQ54] = useState(initialData.Q54 || "");
  const [Q55, setQ55] = useState(initialData.Q55 || "");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = () => {
    onNext({ Q49, Q50, Q51, Q52, Q53, Q54, Q55 });
  };

  const isValid = Q49 && Q50 && Q51 && Q52 && Q53 && Q54;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="bg-card rounded-2xl p-8 shadow-sm border border-border space-y-8">
        {/* Q49 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <Label htmlFor="q49" className="text-lg font-semibold">Full Name</Label>
          <Input
            id="q49"
            value={Q49}
            onChange={(e) => setQ49(e.target.value)}
            placeholder="Your full name"
            className="text-base"
          />
        </motion.div>

        {/* Q50 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-3"
        >
          <Label htmlFor="q50" className="text-lg font-semibold">Email</Label>
          <Input
            id="q50"
            type="email"
            value={Q50}
            onChange={(e) => setQ50(e.target.value)}
            placeholder="your.email@example.com"
            className="text-base"
          />
        </motion.div>

        {/* Q51 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <Label htmlFor="q51" className="text-lg font-semibold">Country of Residence</Label>
          <Select value={Q51} onValueChange={setQ51}>
            <SelectTrigger id="q51" className="text-base">
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {countries.map((country) => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Q52 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-3"
        >
          <Label htmlFor="q52" className="text-lg font-semibold">Passport Nationality</Label>
          <Select value={Q52} onValueChange={setQ52}>
            <SelectTrigger id="q52" className="text-base">
              <SelectValue placeholder="Select your nationality" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {countries.map((country) => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Q53 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <Label className="text-lg font-semibold">Solo or with someone?</Label>
          <RadioGroup value={Q53} onValueChange={setQ53} className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/30">
              <RadioGroupItem value="solo" id="q53-solo" />
              <Label htmlFor="q53-solo" className="cursor-pointer">Solo traveler</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/30">
              <RadioGroupItem value="partner" id="q53-partner" />
              <Label htmlFor="q53-partner" className="cursor-pointer">With a partner</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/30">
              <RadioGroupItem value="friend" id="q53-friend" />
              <Label htmlFor="q53-friend" className="cursor-pointer">With a friend/friends</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/30">
              <RadioGroupItem value="family" id="q53-family" />
              <Label htmlFor="q53-family" className="cursor-pointer">With family</Label>
            </div>
          </RadioGroup>
        </motion.div>

        {/* Q54 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-3"
        >
          <Label className="text-lg font-semibold">Preferred room type</Label>
          <RadioGroup value={Q54} onValueChange={setQ54} className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/30">
              <RadioGroupItem value="single" id="q54-single" />
              <Label htmlFor="q54-single" className="cursor-pointer">Single room</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/30">
              <RadioGroupItem value="double" id="q54-double" />
              <Label htmlFor="q54-double" className="cursor-pointer">Double room</Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/30">
              <RadioGroupItem value="shared" id="q54-shared" />
              <Label htmlFor="q54-shared" className="cursor-pointer">Shared accommodation</Label>
            </div>
          </RadioGroup>
        </motion.div>

        {/* Q55 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <Label htmlFor="q55" className="text-lg font-semibold">Dietary preferences</Label>
          <Textarea
            id="q55"
            value={Q55}
            onChange={(e) => setQ55(e.target.value)}
            placeholder="Any dietary requirements or preferences? (vegetarian, allergies, etc.)"
            className="min-h-[120px] text-base resize-none"
          />
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-8">
        {onBack && (
          <Button onClick={onBack} variant="outline" size="lg" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        )}
        <Button 
          onClick={() => setShowConfirmation(true)} 
          disabled={!isValid} 
          size="lg" 
          className="ml-auto gap-2"
        >
          Complete Questionnaire <CheckCircle className="w-4 h-4" />
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-heading">
              Complete Your SoulPrint?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 pt-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>All required fields completed</span>
              </div>
              <p className="text-base text-foreground/80">
                Your responses will be sent to Erranza to craft your personalized Azerbaijan journey. 
                This process typically takes 2-3 business days.
              </p>
              <p className="text-sm text-muted-foreground">
                Ready to submit your SoulPrint assessment?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>Review Answers</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} className="bg-lavender-accent hover:bg-lavender-accent/90">
              Submit Assessment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default Section8;
