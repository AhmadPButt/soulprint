import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MASTER_ADMIN_EMAIL = "ahmad@erranza.ai";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is the master admin
    const { data: callerRespondent } = await supabaseAdmin
      .from("respondents")
      .select("email")
      .eq("user_id", user.id)
      .maybeSingle();

    if (callerRespondent?.email !== MASTER_ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Only the Master Admin can remove roles." }), { status: 403, headers: corsHeaders });
    }

    const { target_user_id, role } = await req.json();

    if (!target_user_id || !role) {
      return new Response(JSON.stringify({ error: "target_user_id and role are required" }), { status: 400, headers: corsHeaders });
    }

    // Prevent master admin from removing themselves
    if (target_user_id === user.id) {
      return new Response(JSON.stringify({ error: "Cannot remove your own role." }), { status: 400, headers: corsHeaders });
    }

    // Prevent removing another master admin
    const { data: targetRespondent } = await supabaseAdmin
      .from("respondents")
      .select("email")
      .eq("user_id", target_user_id)
      .maybeSingle();

    if (targetRespondent?.email === MASTER_ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Cannot remove the Master Admin." }), { status: 403, headers: corsHeaders });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", target_user_id)
      .eq("role", role);

    if (deleteError) {
      console.error("Error removing role:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to remove role" }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ message: `${role} role removed successfully` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});
