import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plane } from "lucide-react";

interface Trip {
  id: string;
  trip_name: string;
  status: string;
  destination?: { name: string; country: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  booked: "Booked",
  in_progress: "In Progress",
  completed: "Completed",
};

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-amber-50 text-amber-700 border-amber-200",
  booked: "bg-emerald-50 text-emerald-700 border-emerald-200",
  in_progress: "bg-accent text-accent-foreground border-primary/20",
  completed: "bg-secondary text-secondary-foreground border-border",
};

interface TripStatusControlProps {
  userId: string;
  respondentName: string;
}

export function TripStatusControl({ userId, respondentName }: TripStatusControlProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadTrips();
  }, [userId]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("trips")
        .select("id, trip_name, status, destination:echoprint_destinations(name, country)")
        .eq("created_by", userId)
        .order("created_at", { ascending: false });
      setTrips((data as any[]) || []);
    } catch (err) {
      console.error("Error loading trips for", userId, err);
    } finally {
      setLoading(false);
    }
  };

  const updateTripStatus = async (tripId: string, newStatus: string, tripName: string) => {
    setUpdating(tripId);
    try {
      const { error } = await supabase.from("trips").update({ status: newStatus }).eq("id", tripId);
      if (error) throw error;
      setTrips(trips.map(t => t.id === tripId ? { ...t, status: newStatus } : t));
      toast.success(`"${tripName}" moved to ${STATUS_LABELS[newStatus]}`);
    } catch (err: any) {
      toast.error("Failed to update trip status: " + err.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="border border-border rounded-lg p-3 bg-background/50">
        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
          <Plane className="h-3.5 w-3.5" /> Trip Status
        </p>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (trips.length === 0) return null;

  return (
    <div className="border border-border rounded-lg p-3 bg-background/50">
      <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1">
        <Plane className="h-3.5 w-3.5" /> Trip Status
      </p>
      <div className="space-y-2">
        {trips.map(trip => (
          <div key={trip.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border bg-background">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{trip.trip_name}</p>
              {trip.destination && (
                <p className="text-xs text-muted-foreground">{(trip.destination as any).name}, {(trip.destination as any).country}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className={`text-xs ${STATUS_COLORS[trip.status] || ""}`}>
                {STATUS_LABELS[trip.status] || trip.status}
              </Badge>
              {updating === trip.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Select
                  value={trip.status}
                  onValueChange={(val) => updateTripStatus(trip.id, val, trip.trip_name)}
                >
                  <SelectTrigger className="w-[130px] h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
