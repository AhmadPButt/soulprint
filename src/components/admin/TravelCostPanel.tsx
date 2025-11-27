import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, Hotel, DollarSign, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface TravelCostPanelProps {
  itinerary: any;
}

const TravelCostPanel: React.FC<TravelCostPanelProps> = ({ itinerary }) => {
  const [flightResults, setFlightResults] = useState<any>(null);
  const [hotelResults, setHotelResults] = useState<any>(null);
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const { toast } = useToast();

  const searchFlights = async () => {
    setLoadingFlights(true);
    try {
      // Get first and last locations from itinerary for flight search
      const firstDay = itinerary.days[0];
      const lastDay = itinerary.days[itinerary.days.length - 1];
      
      const { data, error } = await supabase.functions.invoke('search-travel', {
        body: {
          type: 'flights',
          params: {
            origin: 'GYD', // Baku airport code
            destination: 'GYD', // Round trip to Baku
            departure_date: new Date().toISOString().split('T')[0], // Today's date as example
            return_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days later
            adults: 1,
          }
        }
      });

      if (error) throw error;
      setFlightResults(data);
      
      toast({
        title: "Flights Loaded",
        description: "Live flight prices have been retrieved!",
      });
    } catch (error: any) {
      console.error('Error searching flights:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to search flights",
        variant: "destructive",
      });
    } finally {
      setLoadingFlights(false);
    }
  };

  const searchHotels = async () => {
    setLoadingHotels(true);
    try {
      // Use Baku as the main accommodation location
      const { data, error } = await supabase.functions.invoke('search-travel', {
        body: {
          type: 'hotels',
          params: {
            location: 'Baku, Azerbaijan',
            check_in_date: new Date().toISOString().split('T')[0],
            check_out_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Flight Options
          </CardTitle>
          <CardDescription>Live flight prices to/from Baku (GYD)</CardDescription>
        </CardHeader>
        <CardContent>
          {!flightResults ? (
            <Button onClick={searchFlights} disabled={loadingFlights} className="w-full">
              {loadingFlights ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Search Live Flights
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3">Best Flights</h4>
                <div className="space-y-2">
                  {flightResults.best_flights?.map((flight: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg border border-border bg-muted/50 flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{flight.airline}</p>
                        <p className="text-sm text-muted-foreground">
                          {flight.departure_time} → {flight.arrival_time}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {flight.duration} • {flight.stops} {flight.stops === 1 ? 'stop' : 'stops'}
                        </p>
                      </div>
                      <Badge className="text-lg">${flight.price}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              {flightResults.price_insights && (
                <div className="p-3 rounded-lg bg-primary/10">
                  <p className="text-sm font-semibold">💡 Price Insights</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {flightResults.price_insights.lowest_price && 
                      `Lowest price: $${flightResults.price_insights.lowest_price}`}
                  </p>
                </div>
              )}
              
              <Button onClick={searchFlights} variant="outline" size="sm" className="w-full">
                Refresh Prices
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5" />
            Hotel Options
          </CardTitle>
          <CardDescription>Live hotel prices in Baku</CardDescription>
        </CardHeader>
        <CardContent>
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
                  <div key={idx} className="p-3 rounded-lg border border-border bg-muted/50">
                    <div className="flex justify-between items-start mb-2">
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
                      <p className="text-sm text-muted-foreground">
                        Total: ${hotel.total_rate} for 7 nights
                      </p>
                    )}
                    {hotel.amenities && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {hotel.amenities.slice(0, 3).join(' • ')}
                      </p>
                    )}
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
