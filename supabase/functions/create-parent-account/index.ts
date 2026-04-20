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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const isAdmin = roles?.some((r: any) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden - Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, full_name, student_ids } = await req.json();

    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get caller's school
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("school_id")
      .eq("user_id", user.id)
      .maybeSingle();

    // Clean up any orphaned profile rows with this email that have no matching auth user
    // (can happen if a parent was previously partially-created or only had role removed)
    const { data: existingProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id, user_id")
      .eq("email", email);

    if (existingProfiles && existingProfiles.length > 0) {
      for (const p of existingProfiles) {
        const { data: existingAuth } = await supabaseAdmin.auth.admin.getUserById(p.user_id);
        if (!existingAuth?.user) {
          // Orphaned: remove dependent rows then the profile
          await supabaseAdmin.from("user_roles").delete().eq("user_id", p.user_id);
          await supabaseAdmin.from("parent_student_assignments").delete().eq("parent_user_id", p.user_id);
          await supabaseAdmin.from("profiles").delete().eq("id", p.id);
        }
      }
    }

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createErr || !created?.user) {
      return new Response(JSON.stringify({ error: createErr?.message || "Failed to create user" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = created.user.id;

    // Upsert profile (in case a profile row already exists from a prior attempt)
    const { error: profileErr } = await supabaseAdmin.from("profiles").upsert({
      id: newUserId,
      user_id: newUserId,
      full_name,
      email,
      school_id: callerProfile?.school_id ?? null,
    }, { onConflict: "user_id" });
    if (profileErr) {
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: profileErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabaseAdmin.from("user_roles").insert({
      user_id: newUserId,
      role: "parent",
    });

    if (Array.isArray(student_ids) && student_ids.length > 0) {
      const rows = student_ids.map((sid: string) => ({
        parent_user_id: newUserId,
        student_id: sid,
        school_id: callerProfile?.school_id ?? null,
      }));
      await supabaseAdmin.from("parent_student_assignments").insert(rows);
    }

    return new Response(
      JSON.stringify({ success: true, user_id: newUserId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
