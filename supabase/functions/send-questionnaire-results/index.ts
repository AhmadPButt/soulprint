import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuestionnaireResults {
  responses: Record<string, any>;
  timestamp: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { responses, timestamp, user }: QuestionnaireResults = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Processing questionnaire submission...");

    // Extract user info - prioritize authenticated user data over form data
    const name = user?.name || responses.Q49 || "Anonymous";
    const email = user?.email || responses.Q50 || `anonymous_${Date.now()}@erranza.ai`;
    const userId = user?.id || null;

    // Store in database
    const { data: respondent, error: dbError } = await supabase
      .from("respondents")
      .insert({
        name,
        email,
        user_id: userId,
        country: responses.Q51,
        passport_nationality: responses.Q52,
        travel_companion: responses.Q53,
        room_type: responses.Q54,
        dietary_preferences: responses.Q55,
        raw_responses: responses,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }

    console.log("Stored in database with ID:", respondent.id);

    // Format the responses for email
    const formattedResponses = JSON.stringify(responses, null, 2);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "SoulPrint Questionnaire <onboarding@resend.dev>",
      to: ["ahmad@erranza.ai"],
      subject: `New SoulPrint Questionnaire - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #647ED5;">New SoulPrint Questionnaire Submission</h1>
          <p style="color: #666; font-size: 14px;">Received on ${new Date(timestamp).toLocaleString()}</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; font-size: 16px; margin: 0 0 10px 0;">Respondent Info</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Database ID:</strong> ${respondent.id}</p>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h2 style="color: #333; font-size: 16px; margin-bottom: 15px;">Full Responses:</h2>
            <pre style="background-color: white; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 12px; line-height: 1.5;">${formattedResponses}</pre>
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${supabaseUrl.replace('https://', 'https://app.')}/admin" 
               style="background: #647ED5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View in Admin Dashboard
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px;">© 2025 Erranza</p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      respondent_id: respondent.id,
      emailResponse 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error processing questionnaire:", error);
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
