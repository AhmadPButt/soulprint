import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bell, MessageSquare, Vote, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: 'comment' | 'poll' | 'group';
  message: string;
  timestamp: string;
  metadata?: any;
}

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadRecentActivity();

    // Subscribe to real-time updates
    const discussionChannel = supabase
      .channel('admin-notifications-discussions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'itinerary_discussions'
        },
        (payload) => {
          const newNotification: Notification = {
            id: payload.new.id as string,
            type: 'comment',
            message: `New comment: "${(payload.new.comment_text as string).substring(0, 50)}${(payload.new.comment_text as string).length > 50 ? '...' : ''}"`,
            timestamp: payload.new.created_at as string,
            metadata: payload.new
          };
          setNotifications(prev => [newNotification, ...prev].slice(0, 50));
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    const pollChannel = supabase
      .channel('admin-notifications-polls')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'itinerary_polls'
        },
        (payload) => {
          const newNotification: Notification = {
            id: payload.new.id as string,
            type: 'poll',
            message: `New poll created: "${(payload.new.question as string).substring(0, 50)}${(payload.new.question as string).length > 50 ? '...' : ''}"`,
            timestamp: payload.new.created_at as string,
            metadata: payload.new
          };
          setNotifications(prev => [newNotification, ...prev].slice(0, 50));
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    const groupChannel = supabase
      .channel('admin-notifications-groups')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'groups'
        },
        (payload) => {
          const newNotification: Notification = {
            id: payload.new.id as string,
            type: 'group',
            message: `New group created: "${payload.new.name as string}"`,
            timestamp: payload.new.created_at as string,
            metadata: payload.new
          };
          setNotifications(prev => [newNotification, ...prev].slice(0, 50));
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(discussionChannel);
      supabase.removeChannel(pollChannel);
      supabase.removeChannel(groupChannel);
    };
  }, []);

  const loadRecentActivity = async () => {
    try {
      const activityNotifications: Notification[] = [];

      // Load recent discussions
      const { data: discussions } = await supabase
        .from('itinerary_discussions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (discussions) {
        discussions.forEach(d => {
          activityNotifications.push({
            id: d.id,
            type: 'comment',
            message: `New comment: "${d.comment_text.substring(0, 50)}${d.comment_text.length > 50 ? '...' : ''}"`,
            timestamp: d.created_at,
            metadata: d
          });
        });
      }

      // Load recent polls
      const { data: polls } = await supabase
        .from('itinerary_polls')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (polls) {
        polls.forEach(p => {
          activityNotifications.push({
            id: p.id,
            type: 'poll',
            message: `New poll: "${p.question.substring(0, 50)}${p.question.length > 50 ? '...' : ''}"`,
            timestamp: p.created_at,
            metadata: p
          });
        });
      }

      // Load recent groups
      const { data: groups } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (groups) {
        groups.forEach(g => {
          activityNotifications.push({
            id: g.id,
            type: 'group',
            message: `New group: "${g.name}"`,
            timestamp: g.created_at,
            metadata: g
          });
        });
      }

      // Sort all notifications by timestamp
      activityNotifications.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setNotifications(activityNotifications.slice(0, 50));
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="h-4 w-4" />;
      case 'poll':
        return <Vote className="h-4 w-4" />;
      case 'group':
        return <Users className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getVariant = (type: string) => {
    switch (type) {
      case 'comment':
        return 'default';
      case 'poll':
        return 'secondary';
      case 'group':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Real-time activity feed for discussions, polls, and groups
            </CardDescription>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No recent activity
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Badge variant={getVariant(notification.type)} className="mt-1">
                      {getIcon(notification.type)}
                    </Badge>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
