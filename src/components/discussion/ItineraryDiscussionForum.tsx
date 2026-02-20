import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Plus } from "lucide-react";
import { DiscussionComment } from "@/components/group/DiscussionComment";
import { PollCard } from "@/components/group/PollCard";
import { CreatePollDialog } from "@/components/group/CreatePollDialog";

interface ItineraryDiscussionForumProps {
  itineraryId?: string;
  groupItineraryId?: string;
  itineraryData: any;
  isGroup?: boolean;
}

export function ItineraryDiscussionForum({ 
  itineraryId, 
  groupItineraryId,
  itineraryData,
  isGroup = false
}: ItineraryDiscussionForumProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const referenceId = groupItineraryId || itineraryId;
  const referenceColumn = groupItineraryId ? 'group_itinerary_id' : 'itinerary_id';

  useEffect(() => {
    if (!referenceId) return;
    
    fetchDiscussions();
    fetchPolls();
    
    // Subscribe to real-time updates
    const discussionChannel = supabase
      .channel(`itinerary-discussions-${referenceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'itinerary_discussions',
          filter: `${referenceColumn}=eq.${referenceId}`
        },
        () => fetchDiscussions()
      )
      .subscribe();

    const pollChannel = supabase
      .channel(`itinerary-polls-${referenceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'itinerary_polls',
          filter: `${referenceColumn}=eq.${referenceId}`
        },
        () => fetchPolls()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(discussionChannel);
      supabase.removeChannel(pollChannel);
    };
  }, [referenceId, referenceColumn]);

  const fetchDiscussions = async () => {
    if (!referenceId) return;

    const { data, error } = await supabase
      .from('itinerary_discussions')
      .select('*')
      .eq(referenceColumn, referenceId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error fetching discussions",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setComments(data || []);
    }
  };

  const fetchPolls = async () => {
    if (!referenceId) return;

    const { data, error } = await supabase
      .from('itinerary_polls')
      .select('*')
      .eq(referenceColumn, referenceId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error fetching polls",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setPolls(data || []);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !referenceId) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to post comments",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const commentData: any = {
      user_id: user.id,
      comment_text: newComment,
      comment_type: activeTab,
      day_reference: selectedDay,
      activity_reference: selectedActivity,
    };

    // Set the appropriate reference
    if (groupItineraryId) {
      commentData.group_itinerary_id = groupItineraryId;
    } else {
      commentData.itinerary_id = itineraryId;
    }

    const { error } = await supabase
      .from('itinerary_discussions')
      .insert(commentData);

    if (error) {
      toast({
        title: "Error posting comment",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setNewComment("");
      toast({
        title: "Comment posted",
        description: "Your comment has been added to the discussion",
      });
    }
    
    setLoading(false);
  };

  const getFilteredComments = () => {
    return comments.filter((comment) => {
      if (activeTab === "general") return comment.comment_type === "general";
      if (activeTab === "days" && selectedDay !== null) {
        return comment.comment_type === "day" && comment.day_reference === selectedDay;
      }
      if (activeTab === "activities" && selectedActivity) {
        return comment.comment_type === "activity" && comment.activity_reference === selectedActivity;
      }
      return false;
    });
  };

  const getDays = () => {
    if (!itineraryData?.days) return [];
    return itineraryData.days.map((day: any, index: number) => ({
      index: index + 1,
      title: day.day || `Day ${index + 1}`,
    }));
  };

  const getActivities = () => {
    if (!itineraryData?.days) return [];
    const activities: string[] = [];
    itineraryData.days.forEach((day: any) => {
      if (day.activities) {
        day.activities.forEach((activity: any) => {
          if (activity.title && !activities.includes(activity.title)) {
            activities.push(activity.title);
          }
        });
      }
      if (day.locations) {
        day.locations.forEach((location: any) => {
          if (location.name && !activities.includes(location.name)) {
            activities.push(location.name);
          }
        });
      }
    });
    return activities;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {isGroup ? "Group Discussion" : "Itinerary Discussion"}
            </CardTitle>
            <Button onClick={() => setIsCreatingPoll(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Poll
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="days">By Day</TabsTrigger>
              <TabsTrigger value="activities">By Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Share your thoughts about the itinerary..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handlePostComment} disabled={loading}>
                    Post Comment
                  </Button>
                </div>
                <div className="space-y-3">
                  {getFilteredComments().map((comment) => (
                    <DiscussionComment key={comment.id} comment={comment} />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="days" className="space-y-4">
              <div className="flex gap-2 flex-wrap mb-4">
                {getDays().map((day) => (
                  <Button
                    key={day.index}
                    variant={selectedDay === day.index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDay(day.index)}
                  >
                    {day.title}
                  </Button>
                ))}
              </div>
              {selectedDay !== null && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      placeholder={`Comment on Day ${selectedDay}...`}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handlePostComment} disabled={loading}>
                      Post Comment
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {getFilteredComments().map((comment) => (
                      <DiscussionComment key={comment.id} comment={comment} />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="activities" className="space-y-4">
              <div className="flex gap-2 flex-wrap mb-4">
                {getActivities().map((activity) => (
                  <Button
                    key={activity}
                    variant={selectedActivity === activity ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedActivity(activity)}
                  >
                    {activity}
                  </Button>
                ))}
              </div>
              {selectedActivity && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      placeholder={`Comment on ${selectedActivity}...`}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handlePostComment} disabled={loading}>
                      Post Comment
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {getFilteredComments().map((comment) => (
                      <DiscussionComment key={comment.id} comment={comment} />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {polls.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Polls</h3>
          {polls.map((poll) => (
            <PollCard key={poll.id} poll={poll} />
          ))}
        </div>
      )}

      <CreatePollDialog
        open={isCreatingPoll}
        onOpenChange={setIsCreatingPoll}
        itineraryId={itineraryId}
        groupItineraryId={groupItineraryId}
        days={getDays()}
        activities={getActivities()}
      />
    </div>
  );
}