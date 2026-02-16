import { supabase } from '@/integrations/supabase/client';

// Get or create session ID
let sessionId = sessionStorage.getItem('analytics_session_id');
if (!sessionId) {
  sessionId = crypto.randomUUID();
  sessionStorage.setItem('analytics_session_id', sessionId);
}

export async function trackEvent(
  eventType: string,
  metadata?: Record<string, unknown>,
  userId?: string,
  tripId?: string
) {
  try {
    await (supabase as any).from('analytics_events').insert({
      event_type: eventType,
      user_id: userId || null,
      trip_id: tripId || null,
      session_id: sessionId,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      page_url: window.location.href,
    });
  } catch (error) {
    // Fire-and-forget: don't block UX
    console.error('Analytics tracking error:', error);
  }
}

/**
 * Returns mouse handlers for tracking destination hover (>2s).
 */
export function trackDestinationHover(destinationId: string, userId?: string) {
  let hoverStart: number;

  return {
    onMouseEnter: () => {
      hoverStart = Date.now();
    },
    onMouseLeave: () => {
      const hoverDuration = Date.now() - hoverStart;
      if (hoverDuration > 2000) {
        trackEvent('destination_hovered', {
          destination_id: destinationId,
          hover_duration_ms: hoverDuration,
        }, userId);
      }
    },
  };
}
