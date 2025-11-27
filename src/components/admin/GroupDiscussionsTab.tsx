import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export function GroupDiscussionsTab() {
  const [groups, setGroups] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();

    // Subscribe to real-time updates
    const discussionChannel = supabase
      .channel('admin-discussions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'itinerary_discussions'
        },
        () => loadData()
      )
      .subscribe();

    const pollChannel = supabase
      .channel('admin-polls')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'itinerary_polls'
        },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(discussionChannel);
      supabase.removeChannel(pollChannel);
    };
  }, []);

  const loadData = async () => {
    try {
      // Load groups with itineraries
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select(`
          *,
          group_itineraries (
            id,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;
      setGroups(groupsData || []);

      // Load all discussions
      const { data: discussionsData, error: discussionsError } = await supabase
        .from('itinerary_discussions')
        .select('*')
        .order('created_at', { ascending: false });

      if (discussionsError) throw discussionsError;
      setDiscussions(discussionsData || []);

      // Load all polls
      const { data: pollsData, error: pollsError } = await supabase
        .from('itinerary_polls')
        .select('*')
        .order('created_at', { ascending: false });

      if (pollsError) throw pollsError;
      setPolls(pollsData || []);
    } catch (error) {
      console.error('Error loading discussions:', error);
      toast({
        title: "Error loading discussions",
        description: "Failed to load discussion data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteDiscussion = async (discussionId: string) => {
    try {
      const { error } = await supabase
        .from('itinerary_discussions')
        .delete()
        .eq('id', discussionId);

      if (error) throw error;

      toast({
        title: "Discussion deleted",
        description: "Comment has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete discussion",
        variant: "destructive",
      });
    }
  };

  const getGroupName = (groupItineraryId: string) => {
    const group = groups.find(g => 
      g.group_itineraries?.some((gi: any) => gi.id === groupItineraryId)
    );
    return group?.name || 'Unknown Group';
  };

  const getGroupDiscussionCount = (groupItineraryId: string) => {
    return discussions.filter(d => d.group_itinerary_id === groupItineraryId).length;
  };

  const getGroupPollCount = (groupItineraryId: string) => {
    return polls.filter(p => p.group_itinerary_id === groupItineraryId).length;
  };

  const groupsWithItineraries = groups.filter(g => g.group_itineraries?.length > 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading discussions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Group Discussions Overview
          </CardTitle>
          <CardDescription>
            Monitor and moderate group itinerary discussions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{groupsWithItineraries.length}</div>
                <p className="text-sm text-muted-foreground">Groups with Itineraries</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{discussions.length}</div>
                <p className="text-sm text-muted-foreground">Total Comments</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{polls.length}</div>
                <p className="text-sm text-muted-foreground">Active Polls</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Groups with Active Discussions</h3>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {groupsWithItineraries.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No groups with itineraries yet
                  </p>
                ) : (
                  groupsWithItineraries.map((group) => {
                    const itineraryId = group.group_itineraries[0].id;
                    const commentCount = getGroupDiscussionCount(itineraryId);
                    const pollCount = getGroupPollCount(itineraryId);

                    return (
                      <Card key={group.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{group.name}</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                Code: {group.join_code}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline">
                                  {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
                                </Badge>
                                <Badge variant="outline">
                                  {pollCount} {pollCount === 1 ? 'poll' : 'polls'}
                                </Badge>
                              </div>
                            </div>
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Comments</CardTitle>
          <CardDescription>Latest discussion activity across all groups</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {discussions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No discussions yet
                </p>
              ) : (
                discussions.slice(0, 50).map((discussion) => (
                  <Card key={discussion.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {getGroupName(discussion.group_itinerary_id)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm">{discussion.comment_text}</p>
                          <div className="flex gap-2">
                            {discussion.day_reference && (
                              <Badge variant="outline" className="text-xs">
                                Day {discussion.day_reference}
                              </Badge>
                            )}
                            {discussion.activity_reference && (
                              <Badge variant="outline" className="text-xs">
                                {discussion.activity_reference}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteDiscussion(discussion.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}