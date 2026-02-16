import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, MapPin, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function JoinTrip() {
  const { invitationToken } = useParams<{ invitationToken: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [trip, setTrip] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvitation();
  }, [invitationToken]);

  const loadInvitation = async () => {
    try {
      // Find member by token
      const { data: memberData, error: memberError } = await supabase
        .from("trip_members")
        .select("*")
        .eq("invitation_token", invitationToken!)
        .single();

      if (memberError || !memberData) {
        setError("Invalid or expired invitation link.");
        setLoading(false);
        return;
      }

      setMember(memberData);

      // Get trip
      const { data: tripData } = await supabase
        .from("trips")
        .select("*")
        .eq("id", memberData.trip_id)
        .single();

      setTrip(tripData);

      // Get destination
      if (tripData?.destination_id) {
        const { data: destData } = await supabase
          .from("echoprint_destinations")
          .select("*")
          .eq("id", tripData.destination_id)
          .single();
        setDestination(destData);
      }
    } catch (err) {
      setError("Something went wrong loading this invitation.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setAccepting(true);

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Save token and redirect to auth
      sessionStorage.setItem("pending_invitation", invitationToken!);
      navigate("/auth");
      return;
    }

    try {
      // Check if user has a respondent
      const { data: respondent } = await supabase
        .from("respondents")
        .select("id")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Update membership
      await supabase
        .from("trip_members")
        .update({
          user_id: session.user.id,
          invitation_status: "accepted",
          accepted_at: new Date().toISOString(),
          respondent_id: respondent?.id || null,
        })
        .eq("id", member.id);

      toast({ title: "Invitation accepted!" });

      if (!respondent) {
        // Need to complete questionnaire
        navigate("/questionnaire");
      } else {
        navigate(`/trips/${trip.id}`);
      }
    } catch (err: any) {
      toast({ title: "Failed to accept", description: err.message, variant: "destructive" });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive/50 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full overflow-hidden">
        {destination?.image_url && (
          <img src={destination.image_url} alt={destination.name} className="w-full h-48 object-cover" />
        )}
        <CardHeader>
          <CardTitle>You've been invited!</CardTitle>
          <CardDescription>
            Join a trip to {destination?.name || "an amazing destination"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <p className="font-semibold text-lg">{trip?.trip_name}</p>
            {destination && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {destination.name}, {destination.country}
              </p>
            )}
            {trip?.start_date && (
              <p className="text-sm text-muted-foreground">
                {new Date(trip.start_date).toLocaleDateString()} — {trip.end_date ? new Date(trip.end_date).toLocaleDateString() : "TBD"}
              </p>
            )}
          </div>

          {member.invitation_status === "accepted" ? (
            <div className="text-center p-4">
              <Check className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="font-medium">Already accepted!</p>
              <Button className="mt-3" onClick={() => navigate(`/trips/${trip.id}`)}>
                View Trip
              </Button>
            </div>
          ) : (
            <Button onClick={handleAccept} disabled={accepting} className="w-full" size="lg">
              {accepting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Accept Invitation
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
