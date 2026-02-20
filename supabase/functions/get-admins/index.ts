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

    // Verify the caller is an admin or moderator using anon client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Use service role to check roles and fetch data
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check caller has admin or moderator role
    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "moderator"])
      .maybeSingle();

    if (!callerRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    // Fetch all admin/moderator roles
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "moderator"]);

    if (rolesError) throw rolesError;

    const admins = [];
    for (const role of roles || []) {
      const { data: respondent } = await supabaseAdmin
        .from("respondents")
        .select("email, name, created_at")
        .eq("user_id", role.user_id)
        .maybeSingle();

      admins.push({
        user_id: role.user_id,
        email: respondent?.email || "Unknown",
        name: respondent?.name || (role.role === "admin" ? "Admin" : "Moderator"),
        created_at: respondent?.created_at || new Date().toISOString(),
        role: role.role,
      });
    }

    // Sort: master admin first (ahmad@erranza.ai), then admins, then moderators
    const MASTER_ADMIN_EMAIL = "ahmad@erranza.ai";
    admins.sort((a, b) => {
      if (a.email === MASTER_ADMIN_EMAIL) return -1;
      if (b.email === MASTER_ADMIN_EMAIL) return 1;
      if (a.role === "admin" && b.role !== "admin") return -1;
      if (b.role === "admin" && a.role !== "admin") return 1;
      return 0;
    });

    return new Response(JSON.stringify({ admins }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});
