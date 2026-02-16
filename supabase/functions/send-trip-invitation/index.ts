import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { trip_id, member_id, invitation_token, inviter_name } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get trip + destination
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('*, destination:echoprint_destinations(name, country, image_url)')
      .eq('id', trip_id)
      .single();

    if (tripError || !trip) {
      throw new Error('Trip not found');
    }

    // Get member email
    const { data: member, error: memberError } = await supabase
      .from('trip_members')
      .select('email, invitation_token')
      .eq('id', member_id)
      .single();

    if (memberError || !member) {
      throw new Error('Member not found');
    }

    const token = invitation_token || member.invitation_token;
    const appUrl = Deno.env.get('APP_URL') || supabaseUrl.replace('.supabase.co', '.lovable.app');
    const invitationUrl = `${appUrl}/join-trip/${token}`;

    const destName = trip.destination?.name || 'an amazing destination';
    const destCountry = trip.destination?.country || '';

    // Send email via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      console.warn('RESEND_API_KEY not configured, skipping email');
      return new Response(JSON.stringify({ success: true, email_sent: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resend = new Resend(resendKey);

    const emailResponse = await resend.emails.send({
      from: 'Erranza <onboarding@resend.dev>',
      to: [member.email],
      subject: `Join ${inviter_name}'s trip to ${destName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #647ED5;">You've been invited to plan a trip!</h1>
          <p><strong>${inviter_name}</strong> has invited you to join their trip to <strong>${destName}, ${destCountry}</strong>.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; font-size: 16px; margin: 0 0 10px 0;">Trip: ${trip.trip_name}</h2>
            ${trip.start_date ? `<p>Dates: ${trip.start_date} to ${trip.end_date || 'TBD'}</p>` : ''}
          </div>
          <p>To join this trip, complete your travel profile:</p>
          <a href="${invitationUrl}" 
             style="background: #647ED5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Join Trip
          </a>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px;">&copy; 2026 Erranza</p>
          </div>
        </div>
      `,
    });

    console.log('Invitation email sent:', emailResponse);

    return new Response(JSON.stringify({ success: true, email_sent: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error sending invitation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
