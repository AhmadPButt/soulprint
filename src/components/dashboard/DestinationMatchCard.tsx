import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight } from "lucide-react";
import { trackEvent, trackDestinationHover } from "@/lib/analytics";
import { FavoriteButton } from "@/components/FavoriteButton";
import {
  getAffinityLabel,
  getAffinityColor,
  generateWhyItFits,
  getElementalPills,
} from "@/lib/destination-narratives";
import type { TraitScores } from "@/lib/soulprint-traits";

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
    climate_tags: string[] | null;
    restorative_score: number | null;
    social_vibe_score: number | null;
    luxury_style_score: number | null;
  };
}

interface DestinationMatchCardProps {
  match: DestinationMatch;
  index: number;
  traits?: TraitScores | null;
}

const DestinationMatchCard = ({ match, index, traits }: DestinationMatchCardProps) => {
  const navigate = useNavigate();
  const dest = match.destination;
  const score = Math.round(match.fit_score);
  const breakdown = match.fit_breakdown as Record<string, number>;

  // Get narrative from fit_breakdown or generate client-side
  const narrative =
    (breakdown as any)?.narrative ??
    (traits
      ? generateWhyItFits(dest.name, traits, breakdown, dest)
      : dest.short_description || dest.description?.slice(0, 140) + "...");

  const pills = getElementalPills(dest);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      {...trackDestinationHover(dest.id)}
    >
      <Card className="overflow-hidden group hover:border-primary/40 transition-colors">
        {/* Compact hero */}
        <div className="relative h-28 overflow-hidden bg-muted">
          {dest.image_url ? (
            <img
              src={dest.image_url}
              alt={dest.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <MapPin className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Header: Name + Affinity Label */}
          <div>
            <h3 className="text-lg font-bold text-foreground leading-tight">{dest.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`text-xs font-semibold px-2 py-0.5 border ${getAffinityColor(score)}`}>
                {getAffinityLabel(score)}
              </Badge>
              <span className="text-xs text-muted-foreground">{dest.country}</span>
            </div>
          </div>

          {/* Why This Fits You */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {narrative}
          </p>

          {/* Elemental Resonance Pills */}
          {pills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {pills.map((pill, i) => (
                <span
                  key={i}
                  className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full"
                >
                  {pill}
                </span>
              ))}
            </div>
          )}

          {/* Footer: Explore + Favorite */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                trackEvent("destination_clicked", {
                  destination_id: dest.id,
                  rank: match.rank,
                  fit_score: match.fit_score,
                });
                navigate(`/destination/${dest.id}`);
              }}
            >
              Explore <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <FavoriteButton
              destinationId={dest.id}
              size="sm"
              className="bg-muted/50 rounded-full h-8 w-8"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DestinationMatchCard;
