import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { BarChart } from "lucide-react";

interface PollCardProps {
  poll: any;
}

export function PollCard({ poll }: PollCardProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVotes();
    checkIfVoted();

    const channel = supabase
      .channel(`poll-votes-${poll.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'poll_votes',
          filter: `poll_id=eq.${poll.id}`
        },
        () => {
          fetchVotes();
          checkIfVoted();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [poll.id]);

  const fetchVotes = async () => {
    const { data } = await supabase
      .from('poll_votes')
      .select('*')
      .eq('poll_id', poll.id);

    setVotes(data || []);
  };

  const checkIfVoted = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('poll_votes')
      .select('selected_option')
      .eq('poll_id', poll.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setHasVoted(true);
      setSelectedOption(data.selected_option);
    }
  };

  const handleVote = async () => {
    if (!selectedOption) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to vote",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('poll_votes')
      .insert({
        poll_id: poll.id,
        user_id: user.id,
        selected_option: selectedOption,
      });

    if (error) {
      toast({
        title: "Error submitting vote",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setHasVoted(true);
      toast({
        title: "Vote submitted",
        description: "Thank you for your input!",
      });
    }
    
    setLoading(false);
  };

  const getVotePercentage = (option: string) => {
    if (votes.length === 0) return 0;
    const optionVotes = votes.filter(v => v.selected_option === option).length;
    return Math.round((optionVotes / votes.length) * 100);
  };

  const options = poll.options as string[];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          {poll.question}
        </CardTitle>
        {poll.day_reference && (
          <span className="text-xs text-muted-foreground">Day {poll.day_reference}</span>
        )}
        {poll.activity_reference && (
          <span className="text-xs text-muted-foreground">{poll.activity_reference}</span>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasVoted ? (
          <>
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
              {options.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
            <Button onClick={handleVote} disabled={!selectedOption || loading}>
              Submit Vote
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Total votes: {votes.length}
            </p>
            {options.map((option) => {
              const percentage = getVotePercentage(option);
              const voteCount = votes.filter(v => v.selected_option === option).length;
              return (
                <div key={option} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={selectedOption === option ? "font-semibold" : ""}>
                      {option} {selectedOption === option && "(Your vote)"}
                    </span>
                    <span>{voteCount} ({percentage}%)</span>
                  </div>
                  <Progress value={percentage} />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}