import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hotel, DollarSign, Loader2, Calendar as CalendarIcon, Check, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TravelCostPanelProps {
  itinerary: any;
}

const TravelCostPanel: React.FC<TravelCostPanelProps> = ({ itinerary }) => {
  const [hotelResults, setHotelResults] = useState<any>(null);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const { toast } = useToast();

  const searchHotels = async () => {
    if (!checkInDate || !checkOutDate) {
      toast({
        title: "Dates Required",
        description: "Please select check-in and check-out dates",
        variant: "destructive",
      });
      return;
    }

    setLoadingHotels(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-travel', {
        body: {
          type: 'hotels',
          params: {
            location: 'Baku, Azerbaijan',
            check_in_date: format(checkInDate, 'yyyy-MM-dd'),
            check_out_date: format(checkOutDate, 'yyyy-MM-dd'),
            adults: 1,
            currency: 'USD',
          }
        }
      });

      if (error) throw error;
      setHotelResults(data);
      
      toast({
        title: "Hotels Loaded",
        description: "Live hotel prices have been retrieved!",
      });
    } catch (error: any) {
      console.error('Error searching hotels:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to search hotels",
        variant: "destructive",
      });
    } finally {
      setLoadingHotels(false);
    }
  };

  const calculateTotalCost = () => {
    let total = 0;
    if (selectedHotel && checkInDate && checkOutDate) {
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      total += selectedHotel.price * nights;
    }
    return total;
  };

  return (
    <div className="space-y-4">
      {selectedHotel && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              Selected Hotel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedHotel && (
              <div className="p-4 rounded-lg bg-primary/10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{selectedHotel.name}</p>
                    {selectedHotel.rating && (
                      <Badge variant="outline" className="text-xs mt-1">
                        ⭐ {selectedHotel.rating}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${selectedHotel.price}</p>
                    <p className="text-xs text-muted-foreground">per night</p>
                  </div>
                </div>
              </div>
            )}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Estimated Hotel Cost</span>
                <span className="text-2xl font-bold text-primary">${calculateTotalCost()}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * Accommodation only. Flights, activities and meals not included.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5" />
            Hotel Options
          </CardTitle>
          <CardDescription>Live hotel prices in Baku</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Check-in Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !checkInDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {checkInDate ? format(checkInDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={checkInDate} onSelect={setCheckInDate} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Check-out Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !checkOutDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {checkOutDate ? format(checkOutDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={checkOutDate} onSelect={setCheckOutDate} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {!hotelResults ? (
            <Button onClick={searchHotels} disabled={loadingHotels} className="w-full">
              {loadingHotels ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Search Live Hotels
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {hotelResults.properties?.slice(0, 5).map((hotel: any, idx: number) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "p-3 rounded-lg border bg-muted/50",
                      selectedHotel?.name === hotel.name
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <div className="flex-1">
                        <p className="font-semibold">{hotel.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {hotel.rating && (
                            <Badge variant="outline" className="text-xs">
                              ⭐ {hotel.rating}
                            </Badge>
                          )}
                          {hotel.type && (
                            <Badge variant="outline" className="text-xs">
                              {hotel.type}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${hotel.price}</p>
                        <p className="text-xs text-muted-foreground">per night</p>
                      </div>
                    </div>
                    {hotel.total_rate && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Total: ${hotel.total_rate}
                      </p>
                    )}
                    {hotel.amenities && (
                      <p className="text-xs text-muted-foreground mb-3">
                        {hotel.amenities.slice(0, 3).join(' • ')}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={selectedHotel?.name === hotel.name ? "default" : "outline"}
                        onClick={() => setSelectedHotel(hotel)}
                        className="flex-1"
                      >
                        {selectedHotel?.name === hotel.name ? <Check className="h-4 w-4 mr-2" /> : null}
                        {selectedHotel?.name === hotel.name ? "Selected" : "Select"}
                      </Button>
                      {hotel.link && (
                        <Button
                          size="sm"
                          variant="ghost"
                          asChild
                        >
                          <a href={hotel.link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={searchHotels} variant="outline" size="sm" className="w-full">
                Refresh Prices
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TravelCostPanel;
