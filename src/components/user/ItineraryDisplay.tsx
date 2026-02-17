import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_ACCESS_TOKEN } from '@/lib/mapbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Calendar, Utensils, Hotel, Compass } from "lucide-react";

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
  practical_notes?: {
    dietary_accommodations: string;
    pacing: string;
    flexibility: string;
    companion_considerations: string;
  };
  psychological_insights?: {
    transformation_arc: string;
    growth_opportunities: string;
    comfort_balance: string;
  };
}

interface ItineraryDisplayProps {
  itinerary: ItineraryData;
  destinationName?: string;
}

const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ itinerary, destinationName }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  // Compute center from itinerary coordinates, fallback to first location
  const getMapCenter = (): [number, number] => {
    const allCoords: [number, number][] = [];
    itinerary.days?.forEach(day => {
      day.locations?.forEach(loc => {
        if (loc.coordinates) allCoords.push(loc.coordinates);
      });
    });
    if (allCoords.length > 0) {
      const avgLng = allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length;
      const avgLat = allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length;
      return [avgLng, avgLat];
    }
    return [0, 20]; // World center fallback
  };

  useEffect(() => {
    if (!mapContainer.current || !itinerary.days) return;

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: getMapCenter(),
      zoom: 6
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      const allCoordinates: [number, number][] = [];

      itinerary.days.forEach((day, dayIndex) => {
        day.locations?.forEach((location) => {
          if (!location.coordinates) return;
          const el = document.createElement('div');
          Object.assign(el.style, {
            backgroundColor: '#8884d8',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: '3px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '12px'
          });
          el.textContent = `${dayIndex + 1}`;

          new mapboxgl.Marker(el)
            .setLngLat(location.coordinates)
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <div style="padding: 8px;">
                  <h3 style="font-weight: bold; margin-bottom: 4px;">${location.name}</h3>
                  <p style="font-size: 12px; color: #666; margin-bottom: 4px;">Day ${day.day} - ${location.time}</p>
                  <p style="font-size: 12px; margin-bottom: 4px;">${location.activity}</p>
                </div>
              `)
            )
            .addTo(map.current!);

          allCoordinates.push(location.coordinates);
        });

        if (day.accommodation?.coordinates) {
          const el = document.createElement('div');
          el.innerHTML = '🏨';
          el.style.fontSize = '24px';
          el.style.cursor = 'pointer';

          new mapboxgl.Marker(el)
            .setLngLat(day.accommodation.coordinates)
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <div style="padding: 8px;">
                  <h3 style="font-weight: bold; margin-bottom: 4px;">${day.accommodation.name}</h3>
                  <p style="font-size: 12px; color: #666; margin-bottom: 4px;">${day.accommodation.type}</p>
                  <p style="font-size: 12px;">${day.accommodation.why}</p>
                </div>
              `)
            )
            .addTo(map.current!);
        }
      });

      if (allCoordinates.length > 1) {
        map.current!.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: allCoordinates } }
        });
        map.current!.addLayer({
          id: 'route', type: 'line', source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#8884d8', 'line-width': 3, 'line-opacity': 0.7, 'line-dasharray': [2, 2] }
        });
      }

      if (allCoordinates.length > 0) {
        const bounds = allCoordinates.reduce(
          (bounds, coord) => bounds.extend(coord),
          new mapboxgl.LngLatBounds(allCoordinates[0], allCoordinates[0])
        );
        map.current!.fitBounds(bounds, { padding: 50 });
      }
    });

    return () => { map.current?.remove(); };
  }, [itinerary]);

  const mapTitle = destinationName
    ? `Your route through ${destinationName}`
    : `Your personalized journey`;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10">
        <CardHeader>
          <CardTitle className="text-3xl">{itinerary.title}</CardTitle>
          <CardDescription className="text-lg">Your Personalized Journey</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-foreground whitespace-pre-wrap">{itinerary.overview}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Journey Map
          </CardTitle>
          <CardDescription>{mapTitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={mapContainer} className="w-full h-[500px] rounded-lg" />
        </CardContent>
      </Card>

      <Tabs defaultValue="1">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${itinerary.days?.length || 1}, 1fr)` }}>
          {itinerary.days?.map((day) => (
            <TabsTrigger key={day.day} value={day.day.toString()}>
              Day {day.day}
            </TabsTrigger>
          ))}
        </TabsList>

        {itinerary.days?.map((day) => (
          <TabsContent key={day.day} value={day.day.toString()}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{day.title}</CardTitle>
                    <CardDescription className="mt-2">{day.theme}</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-lg">Day {day.day}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Activities
                  </h3>
                  {day.locations?.map((location, idx) => (
                    <div key={idx} className="p-4 rounded-lg border border-border bg-card space-y-2">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{location.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{location.time}</p>
                        <p className="text-sm mb-2">{location.activity}</p>
                        {location.psychological_alignment && (
                          <p className="text-xs text-muted-foreground italic">✨ {location.psychological_alignment}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {day.accommodation && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2"><Hotel className="h-4 w-4" /> Accommodation</h3>
                    <div className="p-4 rounded-lg border border-border bg-muted/50">
                      <h4 className="font-semibold">{day.accommodation.name}</h4>
                      <Badge variant="outline" className="mt-1">{day.accommodation.type}</Badge>
                      <p className="text-sm mt-2">{day.accommodation.why}</p>
                    </div>
                  </div>
                )}

                {day.meals && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2"><Utensils className="h-4 w-4" /> Dining</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {day.meals.map((meal, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-muted/30 text-sm">{meal}</div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {itinerary.psychological_insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Compass className="h-5 w-5" /> Psychological Design</CardTitle>
            <CardDescription>How this journey supports your inner development</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><h4 className="font-semibold mb-2">Transformation Arc</h4><p className="text-sm text-muted-foreground">{itinerary.psychological_insights.transformation_arc}</p></div>
            <div><h4 className="font-semibold mb-2">Growth Opportunities</h4><p className="text-sm text-muted-foreground">{itinerary.psychological_insights.growth_opportunities}</p></div>
            <div><h4 className="font-semibold mb-2">Comfort Balance</h4><p className="text-sm text-muted-foreground">{itinerary.psychological_insights.comfort_balance}</p></div>
          </CardContent>
        </Card>
      )}

      {itinerary.practical_notes && (
        <Card>
          <CardHeader><CardTitle>Practical Information</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><h4 className="font-semibold text-sm mb-1">Dietary Accommodations</h4><p className="text-sm text-muted-foreground">{itinerary.practical_notes.dietary_accommodations}</p></div>
            <div><h4 className="font-semibold text-sm mb-1">Pacing</h4><p className="text-sm text-muted-foreground">{itinerary.practical_notes.pacing}</p></div>
            <div><h4 className="font-semibold text-sm mb-1">Flexibility</h4><p className="text-sm text-muted-foreground">{itinerary.practical_notes.flexibility}</p></div>
            <div><h4 className="font-semibold text-sm mb-1">Companion Considerations</h4><p className="text-sm text-muted-foreground">{itinerary.practical_notes.companion_considerations}</p></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ItineraryDisplay;
