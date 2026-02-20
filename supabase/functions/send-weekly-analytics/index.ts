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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require service role key or admin JWT
  const authHeader = req.headers.get("Authorization");
  let isAuthorized = false;

  if (authHeader === `Bearer ${supabaseServiceKey}`) {
    isAuthorized = true;
  } else if (authHeader?.startsWith("Bearer ")) {
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data, error } = await supabaseAnon.auth.getUser();
    if (!error && data?.user) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data: roleData } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .single();
      if (roleData) isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    console.log("Starting weekly analytics report generation...");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get date range for the past week
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all analytics data for the past week
    const { data: weeklyEvents, error } = await supabase
      .from("questionnaire_analytics")
      .select("*")
      .gte("timestamp", startDate.toISOString())
      .lte("timestamp", endDate.toISOString())
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching analytics:", error);
      throw error;
    }

    console.log(`Fetched ${weeklyEvents?.length || 0} events`);

    // Calculate metrics
    const starts = weeklyEvents?.filter((e) => e.event_type === "started").length || 0;
    const completions = weeklyEvents?.filter((e) => e.event_type === "completed").length || 0;
    const completionRate = starts > 0 ? ((completions / starts) * 100).toFixed(1) : "0.0";

    // Calculate section dropoffs
    const abandonments = weeklyEvents?.filter((e) => e.event_type === "abandoned") || [];
    const dropoffCounts = new Map<number, number>();
    abandonments.forEach((e) => {
      if (e.section_number) {
        dropoffCounts.set(e.section_number, (dropoffCounts.get(e.section_number) || 0) + 1);
      }
    });

    // Calculate average completion time
    const completedEvents = weeklyEvents?.filter((e) => e.event_type === "completed") || [];
    const avgCompletionTime = completedEvents.length > 0
      ? Math.floor(
          completedEvents.reduce((sum, e) => sum + (e.time_spent_seconds || 0), 0) /
            completedEvents.length / 60
        )
      : 0;

    // Format dropoffs for email
    const dropoffList = Array.from(dropoffCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([section, count]) => `Section ${section}: ${count} dropoffs`)
      .join("<br>");

    // Create HTML email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; }
            .metric { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .metric-title { font-size: 14px; color: #666; margin-bottom: 5px; }
            .metric-value { font-size: 32px; font-weight: bold; color: #667eea; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .highlight { color: ${parseFloat(completionRate) >= 50 ? "#10b981" : "#ef4444"}; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Weekly SoulPrint Analytics</h1>
              <p>${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
            </div>
            <div class="content">
              <div class="metric">
                <div class="metric-title">Total Starts</div>
                <div class="metric-value">${starts}</div>
              </div>
              
              <div class="metric">
                <div class="metric-title">Total Completions</div>
                <div class="metric-value">${completions}</div>
              </div>
              
              <div class="metric">
                <div class="metric-title">Completion Rate</div>
                <div class="metric-value highlight">${completionRate}%</div>
              </div>
              
              <div class="metric">
                <div class="metric-title">Average Completion Time</div>
                <div class="metric-value">${avgCompletionTime} minutes</div>
              </div>
              
              ${dropoffList ? `
                <div class="metric">
                  <div class="metric-title">Top Dropoff Points</div>
                  <p style="margin-top: 10px;">${dropoffList}</p>
                </div>
              ` : ''}
            </div>
            <div class="footer">
              <p>This is an automated weekly report for the Erranza team.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email
    console.log("Sending email to ahmad@erranza.ai");
    const emailResponse = await resend.emails.send({
      from: "SoulPrint Analytics <onboarding@resend.dev>",
      to: ["ahmad@erranza.ai"],
      subject: `📊 Weekly Analytics Report - ${completionRate}% Completion Rate`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailResponse,
        metrics: { starts, completions, completionRate, avgCompletionTime }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-weekly-analytics function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
