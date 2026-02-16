import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  planning: "bg-primary/20 text-primary border-primary/30",
  booked: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  in_progress: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  completed: "bg-muted text-muted-foreground border-border",
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

    // Get trips created by user
    const { data: ownTrips } = await supabase
      .from("trips")
      .select("*, destination:echoprint_destinations(name, country, image_url)")
      .eq("created_by", session.user.id)
      .order("created_at", { ascending: false });

    // Get member counts
    const tripsWithCounts: Trip[] = [];
    for (const trip of ownTrips || []) {
      const { count } = await supabase
        .from("trip_members")
        .select("*", { count: "exact", head: true })
        .eq("trip_id", trip.id);

      tripsWithCounts.push({
        ...trip,
        destination: trip.destination as Trip["destination"],
        member_count: count || 0,
      });
    }

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
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">My Trips</h1>
              <p className="text-muted-foreground">Manage your travel plans</p>
            </div>
          </div>
          <Button onClick={() => navigate("/intake")} className="gap-2">
            <Plus className="h-4 w-4" /> New Trip
          </Button>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All ({trips.length})</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="booked">Booked</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Trip Cards */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(trip => (
              <Card
                key={trip.id}
                className="cursor-pointer hover:border-primary/40 transition-colors overflow-hidden"
                onClick={() => navigate(`/trips/${trip.id}`)}
              >
                <div className="flex h-full">
                  {/* Thumbnail */}
                  <div className="w-32 min-h-[140px] bg-muted flex-shrink-0">
                    {trip.destination?.image_url ? (
                      <img src={trip.destination.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <MapPin className="h-6 w-6 text-primary/40" />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-lg leading-tight">{trip.trip_name}</h3>
                        <Badge variant="outline" className={`text-xs shrink-0 ${statusColors[trip.status] || ""}`}>
                          {trip.status.replace("_", " ")}
                        </Badge>
                      </div>
                      {trip.destination && (
                        <p className="text-sm text-muted-foreground">
                          {trip.destination.name}, {trip.destination.country}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      {trip.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(trip.start_date).toLocaleDateString()}
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
          </div>
        ) : (
          <Card className="p-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No trips yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by completing your SoulPrint and discovering your perfect destinations.
            </p>
            <Button onClick={() => navigate("/intake")}>Start Planning</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
