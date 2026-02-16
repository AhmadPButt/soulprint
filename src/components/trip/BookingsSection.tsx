import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Plane, Hotel, UtensilsCrossed, Car, Ticket, Copy,
  Phone, Mail, MapPin, Loader2, Trash2
} from "lucide-react";

interface Booking {
  id: string;
  booking_type: string;
  provider_name: string | null;
  confirmation_number: string | null;
  booking_date: string | null;
  booking_time: string | null;
  location_name: string | null;
  location_address: string | null;
  cost_gbp: number | null;
  currency: string | null;
  notes: string | null;
  contact_phone: string | null;
  contact_email: string | null;
}

const BOOKING_TYPES = [
  { value: "flight", label: "Flight", icon: Plane },
  { value: "hotel", label: "Hotel", icon: Hotel },
  { value: "activity", label: "Activity", icon: Ticket },
  { value: "restaurant", label: "Restaurant", icon: UtensilsCrossed },
  { value: "transport", label: "Transport", icon: Car },
];

function getBookingIcon(type: string) {
  const found = BOOKING_TYPES.find(b => b.value === type);
  const Icon = found?.icon || Ticket;
  return <Icon className="h-4 w-4" />;
}

interface Props {
  tripId: string;
  bookings: Booking[];
  onReload: () => void;
}

export function BookingsSection({ tripId, bookings, onReload }: Props) {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    booking_type: "flight",
    provider_name: "",
    confirmation_number: "",
    booking_date: "",
    booking_time: "",
    location_name: "",
    location_address: "",
    cost_gbp: "",
    notes: "",
    contact_phone: "",
    contact_email: "",
  });

  const filtered = filter === "all" ? bookings : bookings.filter(b => b.booking_type === filter);

  const handleSave = async () => {
    if (!form.booking_type) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("trip_bookings").insert({
        trip_id: tripId,
        booking_type: form.booking_type,
        provider_name: form.provider_name || null,
        confirmation_number: form.confirmation_number || null,
        booking_date: form.booking_date || null,
        booking_time: form.booking_time || null,
        location_name: form.location_name || null,
        location_address: form.location_address || null,
        cost_gbp: form.cost_gbp ? parseInt(form.cost_gbp) : null,
        notes: form.notes || null,
        contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null,
      } as any);
      if (error) throw error;
      toast({ title: "Booking added!" });
      setShowAdd(false);
      setForm({ booking_type: "flight", provider_name: "", confirmation_number: "", booking_date: "", booking_time: "", location_name: "", location_address: "", cost_gbp: "", notes: "", contact_phone: "", contact_email: "" });
      onReload();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("trip_bookings").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Booking deleted" });
    onReload();
  };

  const copyConfirmation = (num: string) => {
    navigator.clipboard.writeText(num);
    toast({ title: "Copied!", description: num });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bookings</h3>
        <Button size="sm" onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Booking
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[{ value: "all", label: "All" }, ...BOOKING_TYPES].map(t => (
          <Button
            key={t.value}
            variant={filter === t.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <Ticket className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No bookings yet. Add your flights, hotels, and activities.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <Card key={b.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      {getBookingIcon(b.booking_type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{b.provider_name || "Unnamed"}</span>
                        <Badge variant="outline" className="text-xs capitalize">{b.booking_type}</Badge>
                      </div>
                      {b.confirmation_number && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground font-mono">{b.confirmation_number}</span>
                          <button onClick={() => copyConfirmation(b.confirmation_number!)} className="text-primary hover:text-primary/80">
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      {b.booking_date && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(b.booking_date).toLocaleDateString()}
                          {b.booking_time && ` at ${b.booking_time}`}
                        </p>
                      )}
                      {b.location_name && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {b.location_name}
                          {b.location_address && ` — ${b.location_address}`}
                        </p>
                      )}
                      <div className="flex items-center gap-3 pt-1">
                        {b.contact_phone && (
                          <a href={`tel:${b.contact_phone}`} className="text-xs text-primary flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {b.contact_phone}
                          </a>
                        )}
                        {b.contact_email && (
                          <a href={`mailto:${b.contact_email}`} className="text-xs text-primary flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {b.contact_email}
                          </a>
                        )}
                      </div>
                      {b.notes && <p className="text-xs text-muted-foreground italic mt-1">{b.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {b.cost_gbp != null && (
                      <span className="text-sm font-semibold">£{b.cost_gbp}</span>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(b.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Booking Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Booking</DialogTitle>
            <DialogDescription>Enter your booking details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={form.booking_type} onValueChange={v => setForm(p => ({ ...p, booking_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BOOKING_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Provider</Label><Input value={form.provider_name} onChange={e => setForm(p => ({ ...p, provider_name: e.target.value }))} placeholder="e.g. British Airways" /></div>
              <div className="space-y-1"><Label>Confirmation #</Label><Input value={form.confirmation_number} onChange={e => setForm(p => ({ ...p, confirmation_number: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Date</Label><Input type="date" value={form.booking_date} onChange={e => setForm(p => ({ ...p, booking_date: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Time</Label><Input type="time" value={form.booking_time} onChange={e => setForm(p => ({ ...p, booking_time: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Location</Label><Input value={form.location_name} onChange={e => setForm(p => ({ ...p, location_name: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Cost (£)</Label><Input type="number" value={form.cost_gbp} onChange={e => setForm(p => ({ ...p, cost_gbp: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label>Address</Label><Input value={form.location_address} onChange={e => setForm(p => ({ ...p, location_address: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Phone</Label><Input value={form.contact_phone} onChange={e => setForm(p => ({ ...p, contact_phone: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Email</Label><Input value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
