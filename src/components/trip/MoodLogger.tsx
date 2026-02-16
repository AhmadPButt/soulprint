import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Smile, Meh, Frown, Heart, Zap, Cloud, Sun } from "lucide-react";

interface MoodLoggerProps {
  respondentId: string;
  tripId?: string;
  destinationName?: string;
  onLogComplete?: () => void;
}

const emotionOptions = [
  { label: "Happy", value: "happy", icon: Smile, color: "text-yellow-500" },
  { label: "Excited", value: "excited", icon: Zap, color: "text-orange-500" },
  { label: "Peaceful", value: "peaceful", icon: Cloud, color: "text-blue-400" },
  { label: "Content", value: "content", icon: Sun, color: "text-amber-500" },
  { label: "Neutral", value: "neutral", icon: Meh, color: "text-gray-500" },
  { label: "Anxious", value: "anxious", icon: Heart, color: "text-red-400" },
  { label: "Sad", value: "sad", icon: Frown, color: "text-blue-600" },
];

export function MoodLogger({ respondentId, tripId, destinationName, onLogComplete }: MoodLoggerProps) {
  const { toast } = useToast();
  const [moodScore, setMoodScore] = useState(5);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const [activityReference, setActivityReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmotionToggle = (emotion: string) => {
    setSelectedEmotions(prev =>
      prev.includes(emotion)
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('mood_logs')
        .insert({
          respondent_id: respondentId,
          trip_id: tripId || null,
          mood_score: moodScore,
          emotions: { selected: selectedEmotions },
          notes: notes || null,
          location: location || null,
          activity_reference: activityReference || null,
        } as any);

      if (error) throw error;

      toast({
        title: "Mood Logged",
        description: "Your emotional state has been recorded successfully!",
      });

      // Reset form
      setMoodScore(5);
      setSelectedEmotions([]);
      setNotes("");
      setLocation("");
      setActivityReference("");

      if (onLogComplete) onLogComplete();
    } catch (error: any) {
      console.error("Error logging mood:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to log mood",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Your Mood</CardTitle>
        <CardDescription>
          {destinationName ? `How are you feeling in ${destinationName}?` : "Track your emotional state during your journey"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mood Score Slider */}
        <div className="space-y-2">
          <Label>How are you feeling? (1-10)</Label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="10"
              value={moodScore}
              onChange={(e) => setMoodScore(Number(e.target.value))}
              className="flex-1"
            />
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
              {moodScore}
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Very Low</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Emotion Selection */}
        <div className="space-y-2">
          <Label>Select Emotions</Label>
          <div className="flex flex-wrap gap-2">
            {emotionOptions.map((emotion) => {
              const Icon = emotion.icon;
              const isSelected = selectedEmotions.includes(emotion.value);
              return (
                <button
                  key={emotion.value}
                  onClick={() => handleEmotionToggle(emotion.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${emotion.color}`} />
                  <span className="text-sm">{emotion.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Current Location (Optional)</Label>
          <Input
            id="location"
            placeholder="e.g., Baku Old City, Gobustan"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Activity Reference */}
        <div className="space-y-2">
          <Label htmlFor="activity">Current Activity (Optional)</Label>
          <Input
            id="activity"
            placeholder="e.g., Exploring ancient rock art"
            value={activityReference}
            onChange={(e) => setActivityReference(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="How are you feeling? What's on your mind?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? "Logging..." : "Log Mood"}
        </Button>
      </CardContent>
    </Card>
  );
}
