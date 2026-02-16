import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";

interface FavoriteButtonProps {
  destinationId: string;
  size?: "sm" | "default";
  className?: string;
}

export function FavoriteButton({ destinationId, size = "default", className = "" }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFavorite();
  }, [destinationId]);

  const checkFavorite = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await (supabase as any)
      .from("destination_favorites")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("destination_id", destinationId)
      .maybeSingle();

    setIsFavorited(!!data);
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to save favorites");
      setLoading(false);
      return;
    }

    if (isFavorited) {
      await (supabase as any)
        .from("destination_favorites")
        .delete()
        .eq("user_id", session.user.id)
        .eq("destination_id", destinationId);
      setIsFavorited(false);
      toast.success("Removed from favorites");
    } else {
      await (supabase as any)
        .from("destination_favorites")
        .insert({ user_id: session.user.id, destination_id: destinationId });
      setIsFavorited(true);
      toast.success("Saved to favorites!");
    }
    setLoading(false);
  };

  return (
    <Button
      variant="ghost"
      size={size === "sm" ? "icon" : "default"}
      className={`${className} ${isFavorited ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-400"}`}
      onClick={toggleFavorite}
      disabled={loading}
    >
      <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
      {size !== "sm" && <span className="ml-1.5">{isFavorited ? "Saved" : "Save"}</span>}
    </Button>
  );
}
