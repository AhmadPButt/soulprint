import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trip_id, respondent_name, respondent_email, destination_name } = await req.json();

    if (!respondent_email) {
      return new Response(
        JSON.stringify({ error: "No email provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const appUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "")
      ? "https://erranza.lovable.app"
      : "https://erranza.lovable.app";

    const surveyUrl = `${appUrl}/trips/${trip_id}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1a1a2e; font-size: 24px; margin-bottom: 5px;">✨ Erranza</h1>
  </div>
  
  <h2 style="color: #1a1a2e; font-size: 20px;">How was your trip to ${destination_name}?</h2>
  
  <p>Hi ${respondent_name},</p>
  
  <p>We hope you had an amazing time in ${destination_name}! We'd love to hear about your experience.</p>
  
  <p>Your feedback helps us improve our recommendations and helps future travelers discover their perfect destinations.</p>
  
  <p style="font-weight: bold;">Complete your trip reflection (2 minutes) and receive £50 credit toward your next adventure.</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${surveyUrl}" style="background-color: #1a1a2e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
      Share Your Experience
    </a>
  </div>
  
  <p style="font-size: 12px; color: #999; text-align: center;">
    Survey must be completed within 30 days of trip completion.
  </p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
  
  <p style="font-size: 12px; color: #999; text-align: center;">
    Erranza — Travel That Transforms<br>
    <a href="${appUrl}" style="color: #666;">erranza.lovable.app</a>
  </p>
</body>
</html>`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Erranza <notifications@erranza.ai>",
        to: [respondent_email],
        subject: `How was your trip to ${destination_name}? Share your experience 🌍`,
        html: emailHtml,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Resend error:", errText);
      throw new Error(`Email send failed: ${emailRes.status}`);
    }

    const result = await emailRes.json();
    console.log(`Survey email sent to ${respondent_email} for trip ${trip_id}`);

    return new Response(
      JSON.stringify({ success: true, email_id: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending survey:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
