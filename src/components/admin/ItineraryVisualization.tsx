import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Utensils, Hotel, Compass, Edit, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TravelCostPanel from './TravelCostPanel';

// Define interfaces for Itinerary Data
interface Location {
  name: string;
  coordinates: [number, number];
  time: string;
  activity: string;
  psychological_alignment: string;
  element: string;
}

interface Day {
  day: number;
  title: string;
  theme: string;
  locations: Location[];
  accommodation: {
    name: string;
    coordinates: [number, number];
    type: string;
    why: string;
  };
  meals: string[];
}

interface ItineraryData {
  title: string;
  overview: string;
  days: Day[];
  practical_notes: {
    dietary_accommodations: string;
    pacing: string;
    flexibility: string;
    companion_considerations: string;
  };
  psychological_insights: {
    transformation_arc: string;
    growth_opportunities: string;
    comfort_balance: string;
  };
}

interface ItineraryVisualizationProps {
  itinerary: ItineraryData;
  itineraryId: string;
  respondentId: string;
  respondentName: string;
  onItineraryUpdate: (updatedItinerary: ItineraryData) => void;
}

const SortableActivity: React.FC<{ location: Location; idx: number; dayNumber: number }> = ({ location, idx, dayNumber }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `${dayNumber}-${idx}` });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      {...attributes}
      {...listeners}
      className="p-4 rounded-lg border border-border bg-card space-y-2 cursor-move hover:border-primary transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold mb-1">{location.name}</h4>
          <p className="text-sm text-muted-foreground mb-2">{location.time}</p>
          <p className="text-sm mb-2">{location.activity}</p>
          {location.psychological_alignment && (
            <p className="text-xs text-muted-foreground italic">✨ {location.psychological_alignment}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const ItineraryVisualization: React.FC<ItineraryVisualizationProps> = ({ itinerary, itineraryId, respondentId, respondentName, onItineraryUpdate }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editSuggestions, setEditSuggestions] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [localItinerary, setLocalItinerary] = useState<ItineraryData>(itinerary);
  const { toast } = useToast();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => { setLocalItinerary(itinerary); }, [itinerary]);

  // Compute map center from coordinates
  const getMapCenter = (): [number, number] => {
    const allCoords: [number, number][] = [];
    localItinerary.days?.forEach(day => {
      day.locations?.forEach(loc => {
        if (loc.coordinates) allCoords.push(loc.coordinates);
      });
    });
    if (allCoords.length > 0) {
      const avgLng = allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length;
      const avgLat = allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length;
      return [avgLng, avgLat];
    }
    return [0, 20];
  };

  useEffect(() => {
    if (!mapContainer.current) return;
    mapboxgl.accessToken = 'pk.eyJ1IjoiYWhtYWRwYnV0dCIsImEiOiJjbWhtbWRkbHYyNzZ3MmtxdHQ0a3NzcmtnIn0.mvlVt71TYheyTVVBBnumzA';
    map.current = new mapboxgl.Map({ container: mapContainer.current, style: 'mapbox://styles/mapbox/light-v11', center: getMapCenter(), zoom: 6 });
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.on('load', () => {
      const allCoordinates: [number, number][] = [];
      localItinerary.days.forEach((day, dayIndex) => {
        day.locations?.forEach((location) => {
          if (!location.coordinates) return;
          const el = document.createElement('div');
          Object.assign(el.style, { backgroundColor: '#8884d8', width: '30px', height: '30px', borderRadius: '50%', border: '3px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '12px' });
          el.textContent = `${dayIndex + 1}`;
          new mapboxgl.Marker(el).setLngLat(location.coordinates).setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<div style=\"padding: 8px;\"><h3 style=\"font-weight: bold; margin-bottom: 4px;\">${location.name}</h3><p style=\"font-size: 12px; color: #666; margin-bottom: 4px;\">Day ${day.day} - ${location.time}</p><p style=\"font-size: 12px; margin-bottom: 4px;\">${location.activity}</p></div>`)).addTo(map.current!);
          allCoordinates.push(location.coordinates);
        });
        if (day.accommodation?.coordinates) {
          const el = document.createElement('div');
          el.innerHTML = '🏨';
          el.style.fontSize = '24px';
          el.style.cursor = 'pointer';
          new mapboxgl.Marker(el).setLngLat(day.accommodation.coordinates).setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<div style=\"padding: 8px;\"><h3 style=\"font-weight: bold; margin-bottom: 4px;\">${day.accommodation.name}</h3><p style=\"font-size: 12px; color: #666; margin-bottom: 4px;\">${day.accommodation.type}</p><p style=\"font-size: 12px;\">${day.accommodation.why}</p></div>`)).addTo(map.current!);
        }
      });
      if (allCoordinates.length > 1) {
        map.current!.addSource('route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: allCoordinates } } });
        map.current!.addLayer({ id: 'route', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#8884d8', 'line-width': 3, 'line-opacity': 0.7, 'line-dasharray': [2, 2] } });
      }
      if (allCoordinates.length > 0) {
        const bounds = allCoordinates.reduce((bounds, coord) => bounds.extend(coord), new mapboxgl.LngLatBounds(allCoordinates[0], allCoordinates[0]));
        map.current!.fitBounds(bounds, { padding: 50 });
      }
    });
    return () => { map.current?.remove(); };
  }, [localItinerary]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const [activeDayStr, activeIdxStr] = String(active.id).split('-');
    const [overDayStr, overIdxStr] = String(over.id).split('-');
    const activeDay = parseInt(activeDayStr), activeIdx = parseInt(activeIdxStr), overDay = parseInt(overDayStr), overIdx = parseInt(overIdxStr);
    setLocalItinerary((prev) => {
      const newDays = [...prev.days];
      if (activeDay === overDay) {
        const dayIndex = newDays.findIndex(d => d.day === activeDay);
        newDays[dayIndex] = { ...newDays[dayIndex], locations: arrayMove([...newDays[dayIndex].locations], activeIdx, overIdx) };
      } else {
        const sourceDayIndex = newDays.findIndex(d => d.day === activeDay), targetDayIndex = newDays.findIndex(d => d.day === overDay);
        const sourceLocations = [...newDays[sourceDayIndex].locations], targetLocations = [...newDays[targetDayIndex].locations];
        const [movedItem] = sourceLocations.splice(activeIdx, 1);
        targetLocations.splice(overIdx, 0, movedItem);
        newDays[sourceDayIndex] = { ...newDays[sourceDayIndex], locations: sourceLocations };
        newDays[targetDayIndex] = { ...newDays[targetDayIndex], locations: targetLocations };
      }
      const updated = { ...prev, days: newDays };
      saveItineraryUpdate(updated);
      return updated;
    });
  };

  const saveItineraryUpdate = async (updatedItinerary: ItineraryData) => {
    try {
      const { error } = await supabase.from('itineraries').update({ itinerary_data: updatedItinerary as any }).eq('id', itineraryId);
      if (error) throw error;
      onItineraryUpdate(updatedItinerary);
      toast({ title: "Itinerary Updated", description: "Changes saved successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    }
  };

  const handleSubmitSuggestions = async () => {
    if (!editSuggestions.trim()) return;
    setIsUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-itinerary", { body: { respondent_id: respondentId, edit_suggestions: editSuggestions } });
      if (error) throw error;
      setLocalItinerary(data.itinerary);
      onItineraryUpdate(data.itinerary);
      setShowEditDialog(false);
      setEditSuggestions('');
      toast({ title: "Itinerary Updated", description: "Your suggestions have been applied!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update itinerary", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  // Derive destination name from itinerary title
  const journeyLabel = localItinerary.title
    ? `${respondentName}'s route — ${localItinerary.title}`
    : `${respondentName}'s personalized journey`;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl">{localItinerary.title}</CardTitle>
              <CardDescription className="text-lg">{respondentName}'s Personalized Journey</CardDescription>
            </div>
            <Button onClick={() => setShowEditDialog(true)} variant="outline"><Edit className="h-4 w-4 mr-2" />Edit Itinerary</Button>
          </div>
        </CardHeader>
        <CardContent><p className="text-foreground whitespace-pre-wrap">{localItinerary.overview}</p></CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Journey Map</CardTitle>
          <CardDescription>{journeyLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={mapContainer} className="w-full h-[500px] rounded-lg" />
        </CardContent>
      </Card>

      <Tabs value={selectedDay.toString()} onValueChange={(v) => setSelectedDay(parseInt(v))}>
        <TabsList className="grid w-full grid-cols-8">
          {localItinerary.days.map((day) => (<TabsTrigger key={day.day} value={day.day.toString()}>Day {day.day}</TabsTrigger>))}
          <TabsTrigger value="costs">Bookings</TabsTrigger>
        </TabsList>
        {localItinerary.days.map((day) => (
          <TabsContent key={day.day} value={day.day.toString()}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div><CardTitle className="text-2xl">{day.title}</CardTitle><CardDescription className="mt-2">{day.theme}</CardDescription></div>
                  <Badge variant="outline" className="text-lg">Day {day.day}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" />Activities (Drag to reorder)</h3>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={day.locations.map((_, idx) => `${day.day}-${idx}`)} strategy={verticalListSortingStrategy}>
                      {day.locations.map((location, idx) => (<SortableActivity key={`${day.day}-${idx}`} location={location} idx={idx} dayNumber={day.day} />))}
                    </SortableContext>
                  </DndContext>
                </div>
                {day.accommodation && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2"><Hotel className="h-4 w-4" />Accommodation</h3>
                    <div className="p-4 rounded-lg border border-border bg-muted/50">
                      <h4 className="font-semibold">{day.accommodation.name}</h4>
                      <Badge variant="outline" className="mt-1">{day.accommodation.type}</Badge>
                      <p className="text-sm mt-2">{day.accommodation.why}</p>
                    </div>
                  </div>
                )}
                {day.meals && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2"><Utensils className="h-4 w-4" />Dining</h3>
                    <div className="grid grid-cols-3 gap-3">{day.meals.map((meal, idx) => (<div key={idx} className="p-3 rounded-lg bg-muted/30 text-sm">{meal}</div>))}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
        <TabsContent value="costs">
          <TravelCostPanel itinerary={localItinerary} />
        </TabsContent>
      </Tabs>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Compass className="h-5 w-5" />Psychological Design</CardTitle></CardHeader><CardContent className="space-y-4"><div><h4 className="font-semibold mb-2">Transformation Arc</h4><p className="text-sm text-muted-foreground">{localItinerary.psychological_insights?.transformation_arc}</p></div><div><h4 className="font-semibold mb-2">Growth Opportunities</h4><p className="text-sm text-muted-foreground">{localItinerary.psychological_insights?.growth_opportunities}</p></div><div><h4 className="font-semibold mb-2">Comfort Balance</h4><p className="text-sm text-muted-foreground">{localItinerary.psychological_insights?.comfort_balance}</p></div></CardContent></Card>
      <Card><CardHeader><CardTitle>Practical Information</CardTitle></CardHeader><CardContent className="space-y-3"><div><h4 className="font-semibold text-sm mb-1">Dietary Accommodations</h4><p className="text-sm text-muted-foreground">{localItinerary.practical_notes?.dietary_accommodations}</p></div><div><h4 className="font-semibold text-sm mb-1">Pacing</h4><p className="text-sm text-muted-foreground">{localItinerary.practical_notes?.pacing}</p></div><div><h4 className="font-semibold text-sm mb-1">Flexibility</h4><p className="text-sm text-muted-foreground">{localItinerary.practical_notes?.flexibility}</p></div><div><h4 className="font-semibold text-sm mb-1">Companion Considerations</h4><p className="text-sm text-muted-foreground">{localItinerary.practical_notes?.companion_considerations}</p></div></CardContent></Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Itinerary</DialogTitle><DialogDescription>Provide suggestions to update this itinerary while maintaining psychological alignment.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <Textarea placeholder="E.g., Add more time for cultural experiences, include a cooking class..." value={editSuggestions} onChange={(e) => setEditSuggestions(e.target.value)} rows={8} className="resize-none" />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowEditDialog(false); setEditSuggestions(''); }}>Cancel</Button>
              <Button onClick={handleSubmitSuggestions} disabled={isUpdating}><Send className="h-4 w-4 mr-2" />{isUpdating ? 'Updating...' : 'Apply Changes'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItineraryVisualization;
