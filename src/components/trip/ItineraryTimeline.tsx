import React from "react";
import {
  Plane, Hotel, Utensils, Camera, Compass, Sunset, Coffee,
  Mountain, Waves, TreePine, Music, ShoppingBag, Star, Sparkles,
  Clock, MapPin, PoundSterling, Moon, Sun, Sunrise
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TimelineEvent {
  type: "flight_arrive" | "flight_depart" | "hotel_checkin" | "hotel_checkout" | "activity" | "meal" | "morning" | "afternoon" | "evening";
  time?: string;
  title: string;
  subtitle?: string;
  description?: string;
  cost?: number;
  insight?: string;
  day: number;
}

interface ItineraryTimelineProps {
  itinerary: any;
}

// Maps activity keywords to icons
const getActivityIcon = (text: string = "") => {
  const t = text.toLowerCase();
  if (t.includes("beach") || t.includes("swim") || t.includes("ocean") || t.includes("sea") || t.includes("snorkel") || t.includes("dive")) return Waves;
  if (t.includes("hike") || t.includes("trek") || t.includes("mountain") || t.includes("climb")) return Mountain;
  if (t.includes("forest") || t.includes("jungle") || t.includes("nature") || t.includes("garden")) return TreePine;
  if (t.includes("photo") || t.includes("sight") || t.includes("museum") || t.includes("gallery") || t.includes("view")) return Camera;
  if (t.includes("music") || t.includes("concert") || t.includes("show") || t.includes("perform")) return Music;
  if (t.includes("shop") || t.includes("market") || t.includes("bazaar") || t.includes("souq")) return ShoppingBag;
  if (t.includes("sunset") || t.includes("sunrise") || t.includes("golden hour")) return Sunset;
  if (t.includes("coffee") || t.includes("café") || t.includes("cafe") || t.includes("tea")) return Coffee;
  return Compass;
};

const slotIcon = (slot: string) => {
  if (slot === "morning") return Sunrise;
  if (slot === "afternoon") return Sun;
  if (slot === "evening") return Moon;
  return Clock;
};

const slotLabel = (slot: string) => {
  if (slot === "morning") return "Morning";
  if (slot === "afternoon") return "Afternoon";
  if (slot === "evening") return "Evening";
  return slot;
};

// Visual config per event type
const eventConfig = {
  flight_arrive: {
    icon: Plane,
    color: "bg-sky-500",
    ring: "ring-sky-200",
    label: "Flight Arrival",
    rotate: true,
  },
  flight_depart: {
    icon: Plane,
    color: "bg-sky-600",
    ring: "ring-sky-200",
    label: "Departure",
    rotate: false,
  },
  hotel_checkin: {
    icon: Hotel,
    color: "bg-violet-500",
    ring: "ring-violet-200",
    label: "Hotel Check-in",
    rotate: false,
  },
  hotel_checkout: {
    icon: Hotel,
    color: "bg-violet-400",
    ring: "ring-violet-200",
    label: "Check-out",
    rotate: false,
  },
  activity: {
    icon: Compass,
    color: "bg-primary",
    ring: "ring-primary/30",
    label: "Activity",
    rotate: false,
  },
  meal: {
    icon: Utensils,
    color: "bg-amber-500",
    ring: "ring-amber-200",
    label: "Dining",
    rotate: false,
  },
  morning: {
    icon: Sunrise,
    color: "bg-orange-400",
    ring: "ring-orange-200",
    label: "Morning",
    rotate: false,
  },
  afternoon: {
    icon: Sun,
    color: "bg-yellow-500",
    ring: "ring-yellow-200",
    label: "Afternoon",
    rotate: false,
  },
  evening: {
    icon: Moon,
    color: "bg-indigo-500",
    ring: "ring-indigo-200",
    label: "Evening",
    rotate: false,
  },
};

function buildTimeline(itinerary: any): { dayNum: number; dayTitle: string; dayTheme?: string; events: TimelineEvent[] }[] {
  if (!itinerary?.days) return [];

  return itinerary.days.map((day: any) => {
    const events: TimelineEvent[] = [];
    const dayNum: number = day.day;

    // Day 1: simulate flight arrival
    if (dayNum === 1) {
      events.push({
        type: "flight_arrive",
        time: "Morning",
        title: "Arrive at Destination",
        subtitle: "Flight arrival",
        day: dayNum,
      });
    }

    // Locations-based format
    if (day.locations?.length > 0) {
      day.locations.forEach((loc: any) => {
        events.push({
          type: "activity",
          time: loc.time,
          title: loc.name,
          subtitle: loc.element,
          description: loc.activity,
          insight: loc.psychological_alignment,
          day: dayNum,
        });
      });
    }

    // Slot-based format (morning / afternoon / evening)
    ["morning", "afternoon", "evening"].forEach(slot => {
      const s = day[slot];
      if (!s) return;
      events.push({
        type: slot as TimelineEvent["type"],
        time: s.time,
        title: s.activity,
        description: s.why_it_fits,
        cost: s.estimated_cost_gbp,
        day: dayNum,
      });
    });

    // Meals
    if (day.meals?.length > 0) {
      const mealLabels = ["Breakfast", "Lunch", "Dinner"];
      day.meals.forEach((meal: string, i: number) => {
        if (!meal) return;
        events.push({
          type: "meal",
          title: meal,
          subtitle: mealLabels[i] || `Meal ${i + 1}`,
          day: dayNum,
        });
      });
    }

    // Accommodation
    if (day.accommodation) {
      const isLastDay = dayNum === itinerary.days[itinerary.days.length - 1]?.day;
      events.push({
        type: isLastDay ? "hotel_checkout" : "hotel_checkin",
        time: isLastDay ? "Late morning" : "Evening",
        title: day.accommodation.name,
        subtitle: day.accommodation.type,
        description: day.accommodation.why || day.accommodation.description,
        cost: day.accommodation.estimated_cost_gbp,
        day: dayNum,
      });
    }

    // Last day: simulate departure
    if (dayNum === itinerary.days[itinerary.days.length - 1]?.day) {
      events.push({
        type: "flight_depart",
        time: "Afternoon",
        title: "Depart for Home",
        subtitle: "Departure flight",
        day: dayNum,
      });
    }

    return { dayNum, dayTitle: day.title || day.theme || `Day ${dayNum}`, dayTheme: day.title ? day.theme : undefined, events };
  });
}

const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({ itinerary }) => {
  const days = buildTimeline(itinerary);

  if (days.length === 0) return null;

  return (
    <div className="space-y-0">
      {days.map((day, dayIdx) => (
        <div key={day.dayNum}>
          {/* Day header */}
          <div className="flex items-center gap-3 mb-4 mt-8 first:mt-0">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-sm">
              <span className="text-xs font-bold text-primary-foreground">{day.dayNum}</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm leading-tight">{day.dayTitle}</h3>
              {day.dayTheme && <p className="text-xs text-muted-foreground italic">{day.dayTheme}</p>}
            </div>
            {dayIdx < days.length - 1 && (
              <div className="flex-1 h-px bg-border ml-2" />
            )}
          </div>

          {/* Events */}
          <div className="relative ml-4 pl-6 border-l-2 border-border space-y-0">
            {day.events.map((event, evIdx) => {
              const cfg = eventConfig[event.type] || eventConfig.activity;
              const IconComp = event.type === "activity"
                ? getActivityIcon(event.title + " " + (event.description || ""))
                : slotIcon(event.type).name === slotIcon("activity").name
                  ? cfg.icon
                  : cfg.icon;

              const isLast = evIdx === day.events.length - 1;

              return (
                <div key={evIdx} className={`relative flex gap-4 ${isLast ? "pb-2" : "pb-5"}`}>
                  {/* Dot on timeline */}
                  <div className={`absolute -left-[31px] top-0.5 flex-shrink-0 w-6 h-6 rounded-full ${cfg.color} ring-2 ${cfg.ring} shadow-sm flex items-center justify-center`}>
                    <IconComp
                      className={`h-3 w-3 text-white ${event.type === "flight_arrive" ? "rotate-90" : event.type === "flight_depart" ? "-rotate-90" : ""}`}
                    />
                  </div>

                  {/* Card */}
                  <div className="flex-1 min-w-0 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors p-3.5 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {event.subtitle && (
                            <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full text-white ${cfg.color}`}>
                              {event.type === "morning" || event.type === "afternoon" || event.type === "evening"
                                ? slotLabel(event.type)
                                : event.subtitle}
                            </span>
                          )}
                          {!event.subtitle && (
                            <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full text-white ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          )}
                          {event.time && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />{event.time}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-sm text-foreground mt-1 leading-snug">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{event.description}</p>
                        )}
                      </div>
                      {event.cost && (
                        <Badge variant="outline" className="text-xs shrink-0 gap-1 ml-2">
                          <PoundSterling className="h-2.5 w-2.5" />{event.cost}
                        </Badge>
                      )}
                    </div>
                    {event.insight && (
                      <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-accent/50 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-primary/60 shrink-0" />
                        <p className="text-xs text-primary/80 italic leading-snug">{event.insight}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Journey complete marker */}
      <div className="flex items-center gap-3 mt-6 ml-4 pl-6">
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
          <Star className="h-3 w-3 text-white fill-white" />
        </div>
        <p className="text-sm font-medium text-emerald-600">Journey Complete</p>
      </div>
    </div>
  );
};

export default ItineraryTimeline;
