import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  respondentName: string;
}

const elementColors: Record<string, string> = {
  fire: '#FF6B6B',
  water: '#4ECDC4',
  stone: '#95A5A6',
  urban: '#F7DC6F',
  desert: '#E8B87E',
};

const ItineraryVisualization: React.FC<ItineraryVisualizationProps> = ({ 
  itinerary, 
  respondentName 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoiYWhtYWRwYnV0dCIsImEiOiJjbWhtbWRkbHYyNzZ3MmtxdHQ0a3NzcmtnIn0.mvlVt71TYheyTVVBBnumzA';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [47.5769, 40.1431], // Center of Azerbaijan
      zoom: 6.5,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      // Add all location markers and connecting lines
      const allCoordinates: [number, number][] = [];
      const markers: mapboxgl.Marker[] = [];

      itinerary.days.forEach((day, dayIndex) => {
        day.locations.forEach((location, locIndex) => {
          const el = document.createElement('div');
          el.className = 'custom-marker';
          el.style.backgroundColor = elementColors[location.element] || '#8884d8';
          el.style.width = '30px';
          el.style.height = '30px';
          el.style.borderRadius = '50%';
          el.style.border = '3px solid white';
          el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
          el.style.cursor = 'pointer';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.color = 'white';
          el.style.fontWeight = 'bold';
          el.style.fontSize = '12px';
          el.textContent = `${dayIndex + 1}`;

          const marker = new mapboxgl.Marker(el)
            .setLngLat(location.coordinates)
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                  <div style="padding: 8px;">
                    <h3 style="font-weight: bold; margin-bottom: 4px;">${location.name}</h3>
                    <p style="font-size: 12px; color: #666; margin-bottom: 4px;">Day ${day.day} - ${location.time}</p>
                    <p style="font-size: 12px; margin-bottom: 4px;">${location.activity}</p>
                    <p style="font-size: 11px; color: #888; font-style: italic;">${location.psychological_alignment}</p>
                  </div>
                `)
            )
            .addTo(map.current!);

          markers.push(marker);
          allCoordinates.push(location.coordinates);
        });

        // Add accommodation marker
        if (day.accommodation) {
          const el = document.createElement('div');
          el.innerHTML = '🏨';
          el.style.fontSize = '24px';
          el.style.cursor = 'pointer';

          new mapboxgl.Marker(el)
            .setLngLat(day.accommodation.coordinates)
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
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

      // Add route lines connecting locations
      if (allCoordinates.length > 1) {
        map.current!.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: allCoordinates,
            },
          },
        });

        map.current!.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#8884d8',
            'line-width': 3,
            'line-opacity': 0.7,
            'line-dasharray': [2, 2],
          },
        });
      }

      // Fit map to show all markers
      if (allCoordinates.length > 0) {
        const bounds = allCoordinates.reduce(
          (bounds, coord) => bounds.extend(coord),
          new mapboxgl.LngLatBounds(allCoordinates[0], allCoordinates[0])
        );
        map.current!.fitBounds(bounds, { padding: 50 });
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [itinerary]);

  const currentDay = itinerary.days.find(d => d.day === selectedDay) || itinerary.days[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10">
        <CardHeader>
          <CardTitle className="text-3xl">{itinerary.title}</CardTitle>
          <CardDescription className="text-lg">{respondentName}'s Personalized Journey</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-foreground whitespace-pre-wrap">{itinerary.overview}</p>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Journey Map
          </CardTitle>
          <CardDescription>Your route through Azerbaijan</CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={mapContainer} className="w-full h-[500px] rounded-lg" />
          <div className="mt-4 flex gap-4 flex-wrap">
            {Object.entries(elementColors).map(([element, color]) => (
              <div key={element} className="flex items-center gap-2">
                <div 
                  style={{ backgroundColor: color }} 
                  className="w-4 h-4 rounded-full border-2 border-white"
                />
                <span className="text-sm capitalize">{element}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Day-by-Day Itinerary */}
      <Tabs value={selectedDay.toString()} onValueChange={(v) => setSelectedDay(parseInt(v))}>
        <TabsList className="grid w-full grid-cols-7">
          {itinerary.days.map((day) => (
            <TabsTrigger key={day.day} value={day.day.toString()}>
              Day {day.day}
            </TabsTrigger>
          ))}
        </TabsList>

        {itinerary.days.map((day) => (
          <TabsContent key={day.day} value={day.day.toString()}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{day.title}</CardTitle>
                    <CardDescription className="mt-2">{day.theme}</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-lg">
                    Day {day.day}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Locations */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Activities
                  </h3>
                  {day.locations.map((location, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 rounded-lg border border-border bg-card space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{location.name}</h4>
                            <Badge 
                              style={{ 
                                backgroundColor: elementColors[location.element],
                                color: 'white' 
                              }}
                            >
                              {location.element}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{location.time}</p>
                          <p className="text-sm mb-2">{location.activity}</p>
                          <p className="text-xs text-muted-foreground italic">
                            ✨ {location.psychological_alignment}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Accommodation */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Hotel className="h-4 w-4" />
                    Accommodation
                  </h3>
                  <div className="p-4 rounded-lg border border-border bg-muted/50">
                    <h4 className="font-semibold">{day.accommodation.name}</h4>
                    <Badge variant="outline" className="mt-1">{day.accommodation.type}</Badge>
                    <p className="text-sm mt-2">{day.accommodation.why}</p>
                  </div>
                </div>

                {/* Meals */}
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Utensils className="h-4 w-4" />
                    Dining
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {day.meals.map((meal, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-muted/30 text-sm">
                        {meal}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Psychological Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5" />
            Psychological Design
          </CardTitle>
          <CardDescription>How this journey supports your inner development</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Transformation Arc</h4>
            <p className="text-sm text-muted-foreground">
              {itinerary.psychological_insights.transformation_arc}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Growth Opportunities</h4>
            <p className="text-sm text-muted-foreground">
              {itinerary.psychological_insights.growth_opportunities}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Comfort Balance</h4>
            <p className="text-sm text-muted-foreground">
              {itinerary.psychological_insights.comfort_balance}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Practical Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Practical Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-1">Dietary Accommodations</h4>
            <p className="text-sm text-muted-foreground">
              {itinerary.practical_notes.dietary_accommodations}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">Pacing</h4>
            <p className="text-sm text-muted-foreground">
              {itinerary.practical_notes.pacing}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">Flexibility</h4>
            <p className="text-sm text-muted-foreground">
              {itinerary.practical_notes.flexibility}
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">Companion Considerations</h4>
            <p className="text-sm text-muted-foreground">
              {itinerary.practical_notes.companion_considerations}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ItineraryVisualization;