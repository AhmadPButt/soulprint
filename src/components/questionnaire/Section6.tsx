import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft, CheckCircle, Lock } from "lucide-react";

interface Section6Props {
  initialData: QuestionnaireData;
  onNext: (data: QuestionnaireData) => void;
  onBack?: () => void;
  authName?: string;
  authEmail?: string;
}

const Section6 = ({ initialData, onNext, onBack, authName = "", authEmail = "" }: Section6Props) => {
  const [phone, setPhone] = useState(initialData.Q44_phone || "");
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Use auth data as source of truth; fallback to any previously saved data
  const name = authName || initialData.Q42_name || "";
  const email = authEmail || initialData.Q43_email || "";

  const handleSubmit = () => {
    onNext({ Q42_name: name, Q43_email: email, Q44_phone: phone });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="bg-card rounded-2xl p-8 shadow-sm border border-border space-y-8">
        {/* Name — read-only from auth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Label className="text-lg font-semibold">Full Name</Label>
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              <Lock className="h-3 w-3" /> From your account
            </span>
          </div>
          <Input
            value={name}
            readOnly
            disabled
            className="text-base bg-muted/50 cursor-not-allowed"
          />
        </motion.div>

        {/* Email — read-only from auth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Label className="text-lg font-semibold">Email</Label>
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              <Lock className="h-3 w-3" /> From your account
            </span>
          </div>
          <Input
            type="email"
            value={email}
            readOnly
            disabled
            className="text-base bg-muted/50 cursor-not-allowed"
          />
        </motion.div>

        {/* Phone — editable */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <Label htmlFor="phone" className="text-lg font-semibold">
            Phone <span className="text-muted-foreground font-normal text-sm">(optional)</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+44 7700 000000"
            className="text-base"
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
          disabled={!name || !email}
          size="lg"
          className="ml-auto gap-2"
        >
          Complete SoulPrint <CheckCircle className="w-4 h-4" />
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
                Your responses will be used to match you with your perfect destination and craft a personalized itinerary.
              </p>
              <p className="text-sm text-muted-foreground">
                Ready to submit your SoulPrint assessment?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>Review Answers</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Submit Assessment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default Section6;
