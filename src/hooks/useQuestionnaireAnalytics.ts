import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useQuestionnaireAnalytics = (
  currentSection: number,
  email: string | null
) => {
  const sessionIdRef = useRef<string>(
    crypto.randomUUID()
  );
  const sectionStartTimeRef = useRef<number>(Date.now());
  const hasStartedRef = useRef(false);

  // Track questionnaire start
  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      trackEvent("started", undefined, email);
    }
  }, [email]);

  // Track section completion
  useEffect(() => {
    if (currentSection > 0) {
      const timeSpent = Math.floor((Date.now() - sectionStartTimeRef.current) / 1000);
      trackEvent("section_completed", currentSection, email, timeSpent);
      sectionStartTimeRef.current = Date.now();
    }
  }, [currentSection, email]);

  // Track abandonment on unmount
  useEffect(() => {
    return () => {
      if (currentSection < 8) {
        trackEvent("abandoned", currentSection, email);
      }
    };
  }, [currentSection, email]);

  const trackEvent = async (
    eventType: "started" | "section_completed" | "abandoned" | "completed",
    sectionNumber?: number,
    userEmail?: string | null,
    timeSpent?: number
  ) => {
    try {
      await supabase.from("questionnaire_analytics").insert({
        session_id: sessionIdRef.current,
        event_type: eventType,
        section_number: sectionNumber,
        email: userEmail || null,
        time_spent_seconds: timeSpent || null,
        metadata: {
          user_agent: navigator.userAgent,
          screen_size: `${window.screen.width}x${window.screen.height}`,
        },
      });
      console.log(`Tracked event: ${eventType}`, { sectionNumber, timeSpent });
    } catch (error) {
      console.error("Error tracking analytics:", error);
    }
  };

  const trackCompletion = () => {
    const timeSpent = Math.floor((Date.now() - sectionStartTimeRef.current) / 1000);
    trackEvent("completed", 8, email, timeSpent);
  };

  return { trackCompletion };
};
