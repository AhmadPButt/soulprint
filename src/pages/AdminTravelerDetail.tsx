import { useEffect, useState, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, User, Fingerprint, MapPin, Brain, FileJson, CheckCircle,
  Plane, BedDouble, Utensils, Loader2, Globe, Phone, CreditCard, FileText, Route, Plane as PlaneIcon
} from "lucide-react";
import { TripStatusControl } from "@/components/admin/TripStatusControl";
import { AdminDocumentUpload } from "@/components/admin/AdminDocumentUpload";

const SoulPrintVisualization = lazy(() => import("@/components/admin/SoulPrintVisualization"));
const ItineraryVisualization = lazy(() => import("@/components/admin/ItineraryVisualization"));

type NavSection = "profile" | "soulprint" | "itinerary" | "trips" | "payments" | "documents";

const navItems: { id: NavSection; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  { id: "soulprint", label: "SoulPrint", icon: <Fingerprint className="h-4 w-4" /> },
  { id: "itinerary", label: "Itinerary", icon: <Route className="h-4 w-4" /> },
  { id: "trips", label: "Trips", icon: <PlaneIcon className="h-4 w-4" /> },
  { id: "payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
  { id: "documents", label: "Documents", icon: <FileText className="h-4 w-4" /> },
];

export default function AdminTravelerDetail() {
  const { respondentId } = useParams<{ respondentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [respondent, setRespondent] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<NavSection>("profile");
  const [computingId, setComputingId] = useState<string | null>(null);
  const [generatingItinerary, setGeneratingItinerary] = useState<string | null>(null);
  const [showSoulPrint, setShowSoulPrint] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);

  useEffect(() => {
    loadRespondent();
  }, [respondentId]);

  const loadRespondent = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("respondents")
      .select(`*, computed_scores(*), narrative_insights(*), itineraries(*)`)
      .eq("id", respondentId!)
      .single();

    if (error || !data) {
      toast({ title: "Traveler not found", variant: "destructive" });
      navigate("/admin");
      return;
    }
    setRespondent(data);
    setLoading(false);
  };

  const computeSoulPrint = async () => {
    setComputingId(respondent.id);
    try {
      const { error } = await supabase.functions.invoke("compute-soulprint", {
        body: { respondent_id: respondent.id },
      });
      if (error) throw error;
      toast({ title: "SoulPrint Computed" });
      loadRespondent();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setComputingId(null);
    }
  };

  const generateItinerary = async (forceRegenerate = false) => {
    setGeneratingItinerary(respondent.id);
    try {
      const { error } = await supabase.functions.invoke("generate-itinerary", {
        body: { respondent_id: respondent.id, force_regenerate: forceRegenerate },
      });
      if (error) throw error;
      toast({ title: forceRegenerate ? "Itinerary Regenerated" : "Itinerary Generated" });
      loadRespondent();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingItinerary(null);
    }
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(respondent.raw_responses, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soulprint_${respondent.name.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const togglePaymentStatus = async (field: 'paid_flights' | 'paid_hotels' | 'paid_activities', currentValue: boolean) => {
    const { error } = await supabase.from("respondents").update({ [field]: !currentValue }).eq("id", respondent.id);
    if (!error) {
      setRespondent({ ...respondent, [field]: !currentValue });
      toast({ title: `${field.replace("paid_", "").replace("_", " ")} updated` });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!respondent) return null;

  const hasComputed = respondent.computed_scores?.length > 0;
  const itineraries = Array.isArray(respondent.itineraries) ? respondent.itineraries : [];
  const itinerary = itineraries[0];
  const itineraryData = itinerary?.itinerary_data;
  const scores = respondent.computed_scores?.[0];
  const narrative = respondent.narrative_insights?.[0];

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "Full Name", value: respondent.name },
                    { label: "Email", value: respondent.email },
                    { label: "Country", value: respondent.country || "—" },
                    { label: "Passport Nationality", value: respondent.passport_nationality || "—" },
                    { label: "Travel Companion", value: respondent.travel_companion || "—" },
                    { label: "Room Type", value: respondent.room_type || "—" },
                    { label: "Dietary Preferences", value: respondent.dietary_preferences || "—" },
                    { label: "Status", value: respondent.status || "pending" },
                    { label: "Registered", value: new Date(respondent.created_at).toLocaleDateString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="space-y-1">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium capitalize">{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {narrative && (
              <Card>
                <CardHeader><CardTitle className="text-base">SoulPrint Narrative</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {narrative.headline && <p className="font-semibold text-lg">{narrative.headline}</p>}
                  {narrative.tagline && <p className="text-sm text-muted-foreground italic">"{narrative.tagline}"</p>}
                  {narrative.traveler_archetype && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Archetype</p>
                      <Badge>{narrative.traveler_archetype}</Badge>
                    </div>
                  )}
                  {narrative.soulprint_summary && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Summary</p>
                      <p className="text-sm">{narrative.soulprint_summary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={downloadJSON}>
                <FileJson className="h-4 w-4 mr-1.5" /> Download JSON
              </Button>
              {!hasComputed && (
                <Button size="sm" onClick={computeSoulPrint} disabled={!!computingId}>
                  <Brain className="h-4 w-4 mr-1.5" />
                  {computingId ? "Computing..." : "Compute SoulPrint"}
                </Button>
              )}
              {hasComputed && (
                <Button size="sm" variant="secondary" onClick={() => { setActiveSection("soulprint"); }}>
                  <Fingerprint className="h-4 w-4 mr-1.5" /> View SoulPrint
                </Button>
              )}
            </div>
          </div>
        );

      case "soulprint":
        return (
          <div className="space-y-4">
            {!hasComputed ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center space-y-4">
                  <Fingerprint className="h-12 w-12 mx-auto text-muted-foreground/30" />
                  <p className="text-muted-foreground">No SoulPrint computed yet</p>
                  <Button onClick={computeSoulPrint} disabled={!!computingId}>
                    <Brain className="h-4 w-4 mr-1.5" />
                    {computingId ? "Computing..." : "Compute SoulPrint"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
                <SoulPrintVisualization
                  computed={scores}
                  narrative={narrative}
                  respondentId={respondent.id}
                  onRegenerateComplete={loadRespondent}
                />
              </Suspense>
            )}
          </div>
        );

      case "itinerary":
        return (
          <div className="space-y-4">
            {!itinerary ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center space-y-4">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground/30" />
                  <p className="text-muted-foreground">No itinerary generated yet</p>
                  {hasComputed && (
                    <Button onClick={() => generateItinerary()} disabled={!!generatingItinerary}>
                      <MapPin className="h-4 w-4 mr-1.5" />
                      {generatingItinerary ? "Generating..." : "Generate Itinerary"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{itineraryData?.title || "Personalized Journey"}</h3>
                    <p className="text-sm text-muted-foreground">{itineraryData?.duration || "7 days"}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => generateItinerary(true)} disabled={!!generatingItinerary}>
                    {generatingItinerary ? "Regenerating..." : "Regenerate"}
                  </Button>
                </div>
                <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
                  <ItineraryVisualization
                    itinerary={itineraryData}
                    itineraryId={itinerary?.id}
                    respondentId={respondent.id}
                    respondentName={respondent.name}
                    onItineraryUpdate={() => loadRespondent()}
                  />
                </Suspense>
              </div>
            )}
          </div>
        );

      case "trips":
        return (
          <div className="space-y-4">
            {respondent.user_id ? (
              <TripStatusControl userId={respondent.user_id} respondentName={respondent.name} />
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <PlaneIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No account linked — traveler has not signed up yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "payments":
        return (
          <Card>
            <CardHeader><CardTitle className="text-base">Payment Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { field: "paid_flights" as const, label: "Flights", icon: <Plane className="h-4 w-4" /> },
                { field: "paid_hotels" as const, label: "Hotels", icon: <BedDouble className="h-4 w-4" /> },
                { field: "paid_activities" as const, label: "Activities", icon: <Utensils className="h-4 w-4" /> },
              ].map(({ field, label, icon }) => (
                <div key={field} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <Button
                    size="sm"
                    variant={respondent[field] ? "default" : "outline"}
                    onClick={() => togglePaymentStatus(field, respondent[field])}
                    className="gap-1.5"
                  >
                    <CheckCircle className={`h-3.5 w-3.5 ${respondent[field] ? "" : "opacity-30"}`} />
                    {respondent[field] ? "Paid" : "Mark Paid"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case "documents":
        return (
          <AdminDocumentUpload
            respondentId={respondent.id}
            respondentName={respondent.name}
            userId={respondent.user_id}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="rounded-full shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold truncate">{respondent.name}</h1>
              <p className="text-xs text-muted-foreground truncate">{respondent.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2">
            {hasComputed && (
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                <Fingerprint className="h-3 w-3 mr-1" /> SoulPrint ✓
              </Badge>
            )}
            {itinerary && (
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                Itinerary ✓
              </Badge>
            )}
            {!hasComputed && (
              <Badge variant="secondary" className="text-xs">Pending</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="container max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-48 shrink-0 hidden md:flex flex-col">
          <nav className="sticky top-20 flex flex-col gap-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  activeSection === item.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden w-full">
          <div className="flex gap-1 overflow-x-auto pb-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeSection === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground bg-secondary"
                }`}
              >
                {item.icon}{item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}
