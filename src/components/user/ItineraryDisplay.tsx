import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_ACCESS_TOKEN } from '@/lib/mapbox';
import { Badge } from "@/components/ui/badge";
import { MapPin, Utensils, Hotel, Compass, Clock, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

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
  const [activeDay, setActiveDay] = useState<number>(1);

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
    return [0, 20];
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
            backgroundColor: 'hsl(255, 47%, 62%)',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: '2.5px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '700',
            fontSize: '11px',
            fontFamily: 'system-ui, sans-serif'
          });
          el.textContent = `${dayIndex + 1}`;

          new mapboxgl.Marker(el)
            .setLngLat(location.coordinates)
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <div style="padding:10px;font-family:system-ui,sans-serif;">
                  <p style="font-weight:700;margin-bottom:3px;font-size:13px;">${location.name}</p>
                  <p style="font-size:11px;color:#888;margin-bottom:3px;">Day ${day.day} · ${location.time}</p>
                  <p style="font-size:12px;">${location.activity}</p>
                </div>
              `)
            )
            .addTo(map.current!);

          allCoordinates.push(location.coordinates);
        });

        if (day.accommodation?.coordinates) {
          const el = document.createElement('div');
          el.innerHTML = '🏨';
          el.style.fontSize = '20px';
          el.style.cursor = 'pointer';

          new mapboxgl.Marker(el)
            .setLngLat(day.accommodation.coordinates)
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <div style="padding:10px;font-family:system-ui,sans-serif;">
                  <p style="font-weight:700;margin-bottom:3px;font-size:13px;">${day.accommodation.name}</p>
                  <p style="font-size:11px;color:#888;">${day.accommodation.type}</p>
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
          paint: { 'line-color': 'hsl(255, 47%, 62%)', 'line-width': 2.5, 'line-opacity': 0.6, 'line-dasharray': [2, 2] }
        });
      }

      if (allCoordinates.length > 0) {
        const bounds = allCoordinates.reduce(
          (b, coord) => b.extend(coord),
          new mapboxgl.LngLatBounds(allCoordinates[0], allCoordinates[0])
        );
        map.current!.fitBounds(bounds, { padding: 60 });
      }
    });

    return () => { map.current?.remove(); };
  }, [itinerary]);

  const activeDay_ = itinerary.days?.find(d => d.day === activeDay);

  return (
    <div className="space-y-0">
      {/* Hero Header */}
      <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm mb-6">
        <div className="bg-gradient-to-br from-brand-lavender-haze via-accent to-background px-8 py-10">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary/70 mb-2">Your Itinerary</p>
          <h1 className="text-3xl font-bold text-foreground mb-2">{itinerary.title}</h1>
          {destinationName && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-sm">{destinationName}</span>
            </div>
          )}
        </div>
        {itinerary.overview && (
          <div className="px-8 py-6 border-t border-border">
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{itinerary.overview}</p>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Journey Map</h2>
          {destinationName && <span className="text-xs text-muted-foreground ml-1">· {destinationName}</span>}
        </div>
        <div ref={mapContainer} className="w-full h-[380px]" />
      </div>

      {/* Day Navigation + Content */}
      {itinerary.days?.length > 0 && (
        <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm mb-6">
          {/* Day tabs */}
          <div className="border-b border-border px-6 py-0 flex gap-1 overflow-x-auto">
            {itinerary.days.map((day) => (
              <button
                key={day.day}
                onClick={() => setActiveDay(day.day)}
                className={`px-4 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeDay === day.day
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Day {day.day}
              </button>
            ))}
          </div>

          {/* Active day content */}
          {activeDay_ && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{activeDay_.title}</h2>
                {activeDay_.theme && (
                  <p className="text-sm text-muted-foreground mt-1 italic">{activeDay_.theme}</p>
                )}
              </div>

              {/* Activities */}
              {activeDay_.locations?.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> Activities
                  </div>
                  {activeDay_.locations.map((location, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-xl border border-border bg-background hover:border-primary/30 transition-colors">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-lavender-haze flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">{location.name}</h4>
                          {location.time && (
                            <span className="text-xs text-muted-foreground shrink-0 mt-0.5">{location.time}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{location.activity}</p>
                        {location.psychological_alignment && (
                          <div className="mt-2 px-3 py-1.5 rounded-lg bg-brand-lavender-haze/50 flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3 text-primary/60 shrink-0" />
                            <p className="text-xs text-primary/80 italic">{location.psychological_alignment}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Accommodation */}
              {activeDay_.accommodation && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    <Hotel className="h-3.5 w-3.5" /> Stay
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-background flex gap-3 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-warm-stone flex items-center justify-center text-base">🏨</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground">{activeDay_.accommodation.name}</h4>
                        <Badge variant="outline" className="text-xs">{activeDay_.accommodation.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{activeDay_.accommodation.why}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Meals */}
              {activeDay_.meals?.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    <Utensils className="h-3.5 w-3.5" /> Dining
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {["Breakfast", "Lunch", "Dinner"].map((label, idx) => (
                      activeDay_.meals[idx] && (
                        <div key={idx} className="p-3 rounded-xl border border-border bg-background text-center">
                          <p className="text-xs text-muted-foreground mb-1 font-medium">{label}</p>
                          <p className="text-sm font-medium text-foreground">{activeDay_.meals[idx]}</p>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Psychological Design */}
      {itinerary.psychological_insights && (
        <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Psychological Design</h2>
          </div>
          <div className="p-6 space-y-5">
            {[
              { label: "Transformation Arc", value: itinerary.psychological_insights.transformation_arc },
              { label: "Growth Opportunities", value: itinerary.psychological_insights.growth_opportunities },
              { label: "Comfort Balance", value: itinerary.psychological_insights.comfort_balance },
            ].map(({ label, value }) => value && (
              <div key={label}>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">{label}</p>
                <p className="text-sm text-foreground leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Practical Notes */}
      {itinerary.practical_notes && (
        <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">Practical Information</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { label: "Dietary Accommodations", value: itinerary.practical_notes.dietary_accommodations },
              { label: "Pacing", value: itinerary.practical_notes.pacing },
              { label: "Flexibility", value: itinerary.practical_notes.flexibility },
              { label: "Companion Considerations", value: itinerary.practical_notes.companion_considerations },
            ].map(({ label, value }) => value && (
              <div key={label}>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
                <p className="text-sm text-foreground leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryDisplay;
