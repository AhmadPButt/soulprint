import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Star, Heart, Camera, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TripReflectionProps {
  respondentId: string;
}

export function TripReflection({ respondentId }: TripReflectionProps) {
  const { toast } = useToast();
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [tripSummary, setTripSummary] = useState("");
  const [favoriteMoment, setFavoriteMoment] = useState("");
  const [personalGrowth, setPersonalGrowth] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReflection, setExistingReflection] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExistingReflection();
  }, [respondentId]);

  const loadExistingReflection = async () => {
    try {
      const { data, error } = await supabase
        .from('trip_reflections')
        .select('*')
        .eq('respondent_id', respondentId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setExistingReflection(data);
        setNpsScore(data.nps_score);
        setReviewText(data.review_text || '');
        setTripSummary(data.trip_summary || '');
        setPersonalGrowth(data.personal_growth || '');
        setWouldRecommend(data.would_recommend);
        if (data.favorite_moments && data.favorite_moments.length > 0) {
          setFavoriteMoment(data.favorite_moments[0]);
        }
      }
    } catch (error) {
      console.error('Error loading reflection:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (npsScore === null) {
      toast({
        title: "Missing NPS Score",
        description: "Please rate your overall experience",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const reflectionData = {
        respondent_id: respondentId,
        nps_score: npsScore,
        review_text: reviewText || null,
        trip_summary: tripSummary || null,
        favorite_moments: favoriteMoment ? [favoriteMoment] : [],
        personal_growth: personalGrowth || null,
        would_recommend: wouldRecommend,
        updated_at: new Date().toISOString()
      };

      let error;
      if (existingReflection) {
        const { error: updateError } = await supabase
          .from('trip_reflections')
          .update(reflectionData)
          .eq('id', existingReflection.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('trip_reflections')
          .insert(reflectionData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Reflection Saved",
        description: "Thank you for sharing your journey with us!",
      });

      await loadExistingReflection();
    } catch (error: any) {
      console.error("Error saving reflection:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save reflection",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNPSCategory = (score: number | null) => {
    if (score === null) return null;
    if (score >= 9) return { label: "Promoter", color: "text-green-600" };
    if (score >= 7) return { label: "Passive", color: "text-yellow-600" };
    return { label: "Detractor", color: "text-red-600" };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  const npsCategory = getNPSCategory(npsScore);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Trip Reflection & Review
        </CardTitle>
        <CardDescription>
          Share your experience and help us improve future journeys
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* NPS Score */}
        <div className="space-y-3">
          <Label className="text-base">
            How likely are you to recommend this experience? (0-10)
          </Label>
          <div className="flex gap-2 flex-wrap">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <button
                key={score}
                onClick={() => setNpsScore(score)}
                className={`w-12 h-12 rounded-lg border-2 transition-all ${
                  npsScore === score
                    ? 'border-primary bg-primary text-primary-foreground font-bold'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {score}
              </button>
            ))}
          </div>
          {npsCategory && (
            <Badge variant="outline" className={npsCategory.color}>
              {npsCategory.label}
            </Badge>
          )}
        </div>

        {/* Would Recommend */}
        <div className="space-y-2">
          <Label className="text-base">Would you travel with us again?</Label>
          <div className="flex gap-4">
            <Button
              variant={wouldRecommend === true ? "default" : "outline"}
              onClick={() => setWouldRecommend(true)}
              className="flex-1"
            >
              <Heart className="h-4 w-4 mr-2" />
              Yes, Absolutely!
            </Button>
            <Button
              variant={wouldRecommend === false ? "default" : "outline"}
              onClick={() => setWouldRecommend(false)}
              className="flex-1"
            >
              Maybe Later
            </Button>
          </div>
        </div>

        {/* Trip Summary */}
        <div className="space-y-2">
          <Label htmlFor="tripSummary">Your Trip in a Nutshell</Label>
          <Textarea
            id="tripSummary"
            placeholder="Summarize your journey in a few sentences..."
            value={tripSummary}
            onChange={(e) => setTripSummary(e.target.value)}
            rows={3}
          />
        </div>

        {/* Favorite Moment */}
        <div className="space-y-2">
          <Label htmlFor="favoriteMoment" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Your Favorite Moment
          </Label>
          <Input
            id="favoriteMoment"
            placeholder="What was the highlight of your trip?"
            value={favoriteMoment}
            onChange={(e) => setFavoriteMoment(e.target.value)}
          />
        </div>

        {/* Personal Growth */}
        <div className="space-y-2">
          <Label htmlFor="personalGrowth">Personal Growth & Reflections</Label>
          <Textarea
            id="personalGrowth"
            placeholder="How did this journey change you? What did you learn about yourself?"
            value={personalGrowth}
            onChange={(e) => setPersonalGrowth(e.target.value)}
            rows={4}
          />
        </div>

        {/* Detailed Review */}
        <div className="space-y-2">
          <Label htmlFor="reviewText">Detailed Review (Optional)</Label>
          <Textarea
            id="reviewText"
            placeholder="Share more about your experience, what you loved, and any suggestions for improvement..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={5}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || npsScore === null}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? "Saving..." : existingReflection ? "Update Reflection" : "Submit Reflection"}
        </Button>

        {existingReflection && (
          <p className="text-xs text-center text-muted-foreground">
            Last updated: {new Date(existingReflection.updated_at).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
