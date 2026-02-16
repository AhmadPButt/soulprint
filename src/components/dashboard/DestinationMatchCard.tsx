import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plane, DollarSign, Calendar, MapPin, Star } from "lucide-react";

interface DestinationMatch {
  id: string;
  fit_score: number;
  fit_breakdown: any;
  rank: number;
  destination: {
    id: string;
    name: string;
    country: string;
    region: string;
    short_description: string;
    description: string;
    image_url: string | null;
    image_credit: string | null;
    flight_time_from_uk_hours: number | null;
    avg_cost_per_day_gbp: number | null;
    best_time_to_visit: string | null;
    highlights: string[] | null;
  };
}

interface DestinationMatchCardProps {
  match: DestinationMatch;
  index: number;
}

function getMatchColor(score: number) {
  if (score >= 85) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (score >= 70) return "bg-primary/15 text-primary border-primary/30";
  return "bg-accent/15 text-accent-foreground border-accent/30";
}

const DestinationMatchCard = ({ match, index }: DestinationMatchCardProps) => {
  const dest = match.destination;
  const score = Math.round(match.fit_score);
  const breakdown = match.fit_breakdown as Record<string, number>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
    >
      <Card className="overflow-hidden group hover:border-primary/40 transition-colors">
        {/* Hero Image */}
        <div className="relative h-48 overflow-hidden bg-muted">
          {dest.image_url ? (
            <img
              src={dest.image_url}
              alt={dest.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <MapPin className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}

          {/* Fit Score Badge */}
          <div className="absolute top-3 right-3">
            <Badge className={`text-sm font-bold px-3 py-1 border ${getMatchColor(score)}`}>
              <Star className="h-3.5 w-3.5 mr-1" />
              {score}% match
            </Badge>
          </div>

          {/* Rank Badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur text-foreground font-bold">
              #{match.rank}
            </Badge>
          </div>

          {dest.image_credit && (
            <p className="absolute bottom-1 right-2 text-[10px] text-foreground/50">
              {dest.image_credit}
            </p>
          )}
        </div>

        <CardContent className="p-5 space-y-3">
          {/* Title */}
          <div>
            <h3 className="text-xl font-bold text-foreground">{dest.name}</h3>
            <p className="text-sm text-muted-foreground">{dest.country} · {dest.region}</p>
          </div>

          {/* Short Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {dest.short_description || dest.description?.slice(0, 120) + "..."}
          </p>

          {/* Stats Pills */}
          <div className="flex flex-wrap gap-2">
            {dest.flight_time_from_uk_hours != null && (
              <span className="inline-flex items-center gap-1 text-xs bg-muted/50 px-2.5 py-1 rounded-full text-muted-foreground">
                <Plane className="h-3 w-3" />
                {dest.flight_time_from_uk_hours}h from UK
              </span>
            )}
            {dest.avg_cost_per_day_gbp != null && (
              <span className="inline-flex items-center gap-1 text-xs bg-muted/50 px-2.5 py-1 rounded-full text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                £{dest.avg_cost_per_day_gbp}/day
              </span>
            )}
            {dest.best_time_to_visit && (
              <span className="inline-flex items-center gap-1 text-xs bg-muted/50 px-2.5 py-1 rounded-full text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {dest.best_time_to_visit}
              </span>
            )}
          </div>

          {/* Fit Breakdown Mini-Bars */}
          {breakdown && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-2 border-t border-border/50">
              {Object.entries(breakdown).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-14 truncate">{key}</span>
                  <div className="flex-1 h-1 rounded-full bg-muted/50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${Math.min(100, Math.round(Number(val)))}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-6 text-right">{Math.round(Number(val))}</span>
                </div>
              ))}
            </div>
          )}

          {/* Highlights */}
          {dest.highlights && dest.highlights.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {dest.highlights.slice(0, 3).map((h, i) => (
                <Badge key={i} variant="outline" className="text-[10px] font-normal">
                  {h}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DestinationMatchCard;
