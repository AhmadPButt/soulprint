import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Globe, Shield, Languages, Banknote, Info, Loader2 } from "lucide-react";

interface DestInfo {
  cultural_customs: string | null;
  language_basics: string | null;
  tipping_etiquette: string | null;
  dress_code: string | null;
  local_customs: string | null;
  safety_tips: string | null;
  emergency_numbers: Record<string, string> | null;
  embassy_contact: string | null;
  currency: string | null;
  timezone: string | null;
  voltage: string | null;
}

interface Props {
  destinationId: string;
  destinationName: string;
}

export function DestinationInfoSection({ destinationId, destinationName }: Props) {
  const [info, setInfo] = useState<DestInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("destination_info")
        .select("*")
        .eq("destination_id", destinationId)
        .maybeSingle();
      setInfo(data as DestInfo | null);
      setLoading(false);
    };
    load();
  }, [destinationId]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (!info) {
    return (
      <Card className="p-8 text-center">
        <Info className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground">Destination information for {destinationName} is coming soon.</p>
      </Card>
    );
  }

  const emergencyNumbers = info.emergency_numbers || {};

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Destination Information</h3>

      {/* Quick facts */}
      <div className="flex flex-wrap gap-3">
        {info.currency && (
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
            <Banknote className="h-3.5 w-3.5" /> {info.currency}
          </Badge>
        )}
        {info.timezone && (
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
            <Globe className="h-3.5 w-3.5" /> {info.timezone}
          </Badge>
        )}
        {info.voltage && (
          <Badge variant="outline" className="gap-1.5 py-1.5 px-3">
            ⚡ {info.voltage}
          </Badge>
        )}
      </div>

      <Accordion type="multiple" className="w-full">
        {info.cultural_customs && (
          <AccordionItem value="cultural">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Cultural Customs</span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{info.cultural_customs}</p>
            </AccordionContent>
          </AccordionItem>
        )}

        {info.dress_code && (
          <AccordionItem value="dress">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">👔 Dress Code</span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{info.dress_code}</p>
            </AccordionContent>
          </AccordionItem>
        )}

        {info.language_basics && (
          <AccordionItem value="language">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2"><Languages className="h-4 w-4 text-primary" /> Language Basics</span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{info.language_basics}</p>
            </AccordionContent>
          </AccordionItem>
        )}

        {info.tipping_etiquette && (
          <AccordionItem value="tipping">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2"><Banknote className="h-4 w-4 text-primary" /> Tipping & Currency</span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{info.tipping_etiquette}</p>
            </AccordionContent>
          </AccordionItem>
        )}

        {(info.safety_tips || Object.keys(emergencyNumbers).length > 0 || info.embassy_contact) && (
          <AccordionItem value="safety">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Safety & Emergency</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-3">
              {Object.keys(emergencyNumbers).length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Emergency Numbers</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(emergencyNumbers).map(([key, num]) => (
                      <a key={key} href={`tel:${num}`} className="flex items-center gap-1.5 bg-destructive/10 text-destructive rounded-md px-3 py-1.5 text-sm hover:bg-destructive/20 transition-colors">
                        <Phone className="h-3 w-3" /> {key}: {num}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {info.embassy_contact && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Embassy / Consulate</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{info.embassy_contact}</p>
                </div>
              )}
              {info.safety_tips && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Safety Tips</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{info.safety_tips}</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {info.local_customs && (
          <AccordionItem value="local">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">🏠 Local Customs</span>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{info.local_customs}</p>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
