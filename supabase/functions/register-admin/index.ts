import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub;
    const { secret_key, admin_name, admin_email, role = "admin" } = await req.json();

    // Validate role
    if (!["admin", "moderator"].includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role. Must be 'admin' or 'moderator'" }), { status: 400, headers: corsHeaders });
    }

    if (!secret_key) {
      return new Response(JSON.stringify({ error: "Secret key is required" }), { status: 400, headers: corsHeaders });
    }

    const adminSecretKey = Deno.env.get("ADMIN_SECRET_KEY");
    if (!adminSecretKey || secret_key !== adminSecretKey) {
      return new Response(JSON.stringify({ error: "Invalid secret key" }), { status: 403, headers: corsHeaders });
    }

    // Use service role to insert role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if already has this role
    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", role)
      .maybeSingle();

    if (existingRole) {
      return new Response(JSON.stringify({ message: `Already a ${role}` }), { headers: corsHeaders });
    }

    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role });

    if (insertError) {
      console.error("Error inserting role:", insertError);
      return new Response(JSON.stringify({ error: "Failed to register role" }), { status: 500, headers: corsHeaders });
    }

    // Update user metadata if provided
    if (admin_name || admin_email) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { admin_name: admin_name || "", admin_email: admin_email || "" }
      });
    }

    // Save to respondents table so they appear in the panel
    const resolvedName = admin_name || (role === "admin" ? "Admin" : "Moderator");
    const resolvedEmail = admin_email || claimsData.claims.email || "";

    const { data: existingRespondent } = await supabaseAdmin
      .from("respondents")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingRespondent) {
      await supabaseAdmin.from("respondents").insert({
        user_id: userId,
        name: resolvedName,
        email: resolvedEmail,
        raw_responses: {},
        status: role,
      });
    }

    return new Response(JSON.stringify({ message: `${role} role granted successfully` }), { headers: corsHeaders });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});
