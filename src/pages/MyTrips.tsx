import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, MapPin, Users, Calendar, ArrowLeft } from "lucide-react";
import erranzaLogo from "@/assets/erranza-logo.png";

interface Trip {
  id: string;
  trip_name: string;
  trip_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  destination: {
    name: string;
    country: string;
    image_url: string | null;
  } | null;
  member_count: number;
}

const statusColors: Record<string, string> = {
  planning: "bg-amber-50 text-amber-700 border-amber-200",
  booked: "bg-emerald-100 text-emerald-800 border-emerald-300",
  in_progress: "bg-accent text-accent-foreground border-primary/20",
  completed: "bg-secondary text-secondary-foreground border-border",
};

export default function MyTrips() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }

    // Get trips created by user with destination info
    const { data: ownTrips } = await supabase
      .from("trips")
      .select("*, destination:echoprint_destinations(name, country, image_url)")
      .eq("created_by", session.user.id)
      .order("created_at", { ascending: false });

    if (!ownTrips || ownTrips.length === 0) {
      setTrips([]);
      setLoading(false);
      return;
    }

    // Fix N+1: fetch all member counts in a single query
    const tripIds = ownTrips.map(t => t.id);
    const { data: memberCounts } = await supabase
      .from("trip_members")
      .select("trip_id")
      .in("trip_id", tripIds);

    const countMap: Record<string, number> = {};
    (memberCounts || []).forEach(m => {
      countMap[m.trip_id] = (countMap[m.trip_id] || 0) + 1;
    });

    const tripsWithCounts: Trip[] = ownTrips.map(trip => ({
      ...trip,
      destination: trip.destination as Trip["destination"],
      member_count: countMap[trip.id] || 0,
    }));

    setTrips(tripsWithCounts);
    setLoading(false);
  };

  const filtered = filter === "all" ? trips : trips.filter(t => t.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Trips</h1>
              <p className="text-sm text-muted-foreground">Manage your travel plans and itineraries</p>
            </div>
          </div>
          <Button onClick={() => navigate("/intake")} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> New Trip
          </Button>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList className="grid w-full grid-cols-5 bg-secondary/50 p-1 rounded-xl h-auto">
            <TabsTrigger value="all" className="rounded-lg">All ({trips.length})</TabsTrigger>
            <TabsTrigger value="planning" className="rounded-lg">Planning</TabsTrigger>
            <TabsTrigger value="booked" className="rounded-lg">Booked</TabsTrigger>
            <TabsTrigger value="in_progress" className="rounded-lg">In Progress</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Trip Cards */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(trip => (
              <Card
                key={trip.id}
                className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 overflow-hidden group"
                onClick={() => navigate(`/trips/${trip.id}`)}
              >
                <div className="flex h-full">
                  {/* Thumbnail */}
                  <div className="w-36 min-h-[150px] bg-secondary flex-shrink-0 overflow-hidden">
                    {trip.destination?.image_url ? (
                      <img
                        src={trip.destination.image_url}
                        alt={trip.destination.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-accent">
                        <MapPin className="h-6 w-6 text-primary/40" />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-semibold text-base leading-tight text-foreground">{trip.trip_name}</h3>
                        <Badge variant="outline" className={`text-xs shrink-0 font-medium ${statusColors[trip.status] || ""}`}>
                          {trip.status.replace("_", " ")}
                        </Badge>
                      </div>
                      {trip.destination && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {trip.destination.name}, {trip.destination.country}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      {trip.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(trip.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {trip.member_count > 1 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {trip.member_count} travelers
                        </span>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}

            {/* Create new trip card */}
            <Card
              className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 border-dashed"
              onClick={() => navigate("/intake")}
            >
              <div className="flex h-full min-h-[150px] items-center justify-center flex-col gap-2 p-6 text-muted-foreground">
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <Plus className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">Create new trip</p>
              </div>
            </Card>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-7 w-7 text-primary/60" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">No trips yet</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-xs mx-auto">
              Start by completing your SoulPrint and discovering your perfect destinations.
            </p>
            <Button onClick={() => navigate("/intake")}>Start Planning</Button>
          </div>
        )}
      </div>
    </div>
  );
}
