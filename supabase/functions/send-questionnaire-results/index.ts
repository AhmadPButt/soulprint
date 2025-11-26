import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuestionnaireResults {
  responses: Record<string, any>;
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { responses, timestamp }: QuestionnaireResults = await req.json();

    console.log("Sending questionnaire results to ahmad@erranza.ai");

    // Format the responses for better readability in email
    const formattedResponses = JSON.stringify(responses, null, 2);

    const emailResponse = await resend.emails.send({
      from: "SoulPrint Questionnaire <onboarding@resend.dev>",
      to: ["ahmad@erranza.ai"],
      subject: `New SoulPrint Questionnaire Submission - ${timestamp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #647ED5;">New SoulPrint Questionnaire Submission</h1>
          <p style="color: #666; font-size: 14px;">Received on ${new Date(timestamp).toLocaleString()}</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h2 style="color: #333; font-size: 16px; margin-bottom: 15px;">Questionnaire Responses:</h2>
            <pre style="background-color: white; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px; line-height: 1.5;">${formattedResponses}</pre>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px;">© 2025 Erranza • Travel Smarter. Wander Better.</p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending questionnaire results:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
