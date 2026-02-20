import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bell, UserPlus, Plane, CheckCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: 'new_traveler' | 'new_trip' | 'trip_completed' | 'soulprint_computed';
  message: string;
  timestamp: string;
  metadata?: any;
}

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadRecentActivity();

    // Subscribe to real-time updates for new travelers and trips
    const respondentChannel = supabase
      .channel('admin-notifications-respondents')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'respondents' }, (payload) => {
        const n: Notification = {
          id: payload.new.id as string,
          type: 'new_traveler',
          message: `New traveler registered: "${payload.new.name as string}" (${payload.new.email as string})`,
          timestamp: payload.new.created_at as string,
          metadata: payload.new
        };
        setNotifications(prev => [n, ...prev].slice(0, 50));
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    const tripChannel = supabase
      .channel('admin-notifications-trips')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trips' }, (payload) => {
        const n: Notification = {
          id: payload.new.id as string,
          type: 'new_trip',
          message: `New trip created: "${payload.new.trip_name as string}"`,
          timestamp: payload.new.created_at as string,
          metadata: payload.new
        };
        setNotifications(prev => [n, ...prev].slice(0, 50));
        setUnreadCount(prev => prev + 1);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips' }, (payload) => {
        if (payload.new.status === 'completed' && payload.old.status !== 'completed') {
          const n: Notification = {
            id: payload.new.id as string + '-completed',
            type: 'trip_completed',
            message: `Trip completed: "${payload.new.trip_name as string}"`,
            timestamp: new Date().toISOString(),
            metadata: payload.new
          };
          setNotifications(prev => [n, ...prev].slice(0, 50));
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();

    const scoresChannel = supabase
      .channel('admin-notifications-scores')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'computed_scores' }, (payload) => {
        const n: Notification = {
          id: payload.new.id as string,
          type: 'soulprint_computed',
          message: `SoulPrint computed for a new traveler`,
          timestamp: payload.new.computed_at as string,
          metadata: payload.new
        };
        setNotifications(prev => [n, ...prev].slice(0, 50));
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(respondentChannel);
      supabase.removeChannel(tripChannel);
      supabase.removeChannel(scoresChannel);
    };
  }, []);

  const loadRecentActivity = async () => {
    try {
      const activityNotifications: Notification[] = [];

      // Load recent respondents (non-admin status)
      const { data: respondents } = await supabase
        .from('respondents')
        .select('*')
        .neq('status', 'admin')
        .order('created_at', { ascending: false })
        .limit(15);

      if (respondents) {
        respondents.forEach(r => {
          activityNotifications.push({
            id: r.id,
            type: 'new_traveler',
            message: `New traveler: "${r.name}" (${r.email})`,
            timestamp: r.created_at,
            metadata: r
          });
        });
      }

      // Load recent trips
      const { data: trips } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

      if (trips) {
        trips.forEach(t => {
          activityNotifications.push({
            id: t.id,
            type: t.status === 'completed' ? 'trip_completed' : 'new_trip',
            message: t.status === 'completed' ? `Trip completed: "${t.trip_name}"` : `New trip: "${t.trip_name}"`,
            timestamp: t.created_at || new Date().toISOString(),
            metadata: t
          });
        });
      }

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
      case 'new_traveler': return <UserPlus className="h-4 w-4" />;
      case 'new_trip': return <Plane className="h-4 w-4" />;
      case 'trip_completed': return <CheckCircle className="h-4 w-4" />;
      case 'soulprint_computed': return <Bell className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getVariant = (type: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (type) {
      case 'new_traveler': return 'default';
      case 'new_trip': return 'secondary';
      case 'trip_completed': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alerts
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">{unreadCount} new</Badge>
              )}
            </CardTitle>
            <CardDescription>Real-time activity — new travelers, trips, and SoulPrints</CardDescription>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Mark all as read
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recent activity</p>
            ) : (
              notifications.map((notification, idx) => (
                <div key={notification.id + idx} className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
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
