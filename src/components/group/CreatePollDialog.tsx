import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

interface CreatePollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupItineraryId: string;
  days: { index: number; title: string }[];
  activities: string[];
}

export function CreatePollDialog({
  open,
  onOpenChange,
  groupItineraryId,
  days,
  activities,
}: CreatePollDialogProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [contextType, setContextType] = useState<"general" | "day" | "activity">("general");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async () => {
    if (!question.trim()) {
      toast({
        title: "Question required",
        description: "Please enter a poll question",
        variant: "destructive",
      });
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      toast({
        title: "Options required",
        description: "Please provide at least 2 options",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create polls",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const pollData = {
      group_itinerary_id: groupItineraryId,
      created_by: user.id,
      question,
      options: validOptions,
      day_reference: contextType === "day" ? selectedDay : null,
      activity_reference: contextType === "activity" ? selectedActivity : null,
    };

    const { error } = await supabase
      .from('itinerary_polls')
      .insert(pollData);

    if (error) {
      toast({
        title: "Error creating poll",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Poll created",
        description: "Your poll has been added to the discussion",
      });
      onOpenChange(false);
      // Reset form
      setQuestion("");
      setOptions(["", ""]);
      setContextType("general");
      setSelectedDay(null);
      setSelectedActivity(null);
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Poll</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Question</Label>
            <Input
              placeholder="What would you like to ask?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Context</Label>
            <Select value={contextType} onValueChange={(value: any) => setContextType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="day">Specific Day</SelectItem>
                <SelectItem value="activity">Specific Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {contextType === "day" && (
            <div className="space-y-2">
              <Label>Select Day</Label>
              <Select value={selectedDay?.toString()} onValueChange={(value) => setSelectedDay(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a day" />
                </SelectTrigger>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day.index} value={day.index.toString()}>
                      {day.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {contextType === "activity" && (
            <div className="space-y-2">
              <Label>Select Activity</Label>
              <Select value={selectedActivity || ""} onValueChange={setSelectedActivity}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an activity" />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((activity) => (
                    <SelectItem key={activity} value={activity}>
                      {activity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Options</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddOption}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            </div>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                />
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            Create Poll
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}