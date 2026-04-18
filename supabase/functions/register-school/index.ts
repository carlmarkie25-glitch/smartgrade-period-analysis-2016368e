import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const PLAN_LIMITS: Record<string, number> = {
  starter: 200,
  pro: 1000,
  premium: 100000,
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "school";
}

// Always return HTTP 200 with { ok, ... } so the client can read the real error
// instead of seeing a generic "Edge Function returned a non-2xx status code".
function respond(payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), { status: 200, headers: corsHeaders });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const {
      school_name, country, phone, address,
      admin_full_name, admin_email, admin_password,
      plan = "starter",
    } = body;

    if (!school_name || !admin_full_name || !admin_email || !admin_password) {
      return respond({ ok: false, error: "Missing required fields" });
    }
    if (admin_password.length < 6) {
      return respond({ ok: false, error: "Password must be at least 6 characters" });
    }

    // 1) Create auth user
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
      user_metadata: { full_name: admin_full_name },
    });
    if (authErr || !authData.user) {
      const msg = authErr?.message ?? "Failed to create user";
      // Friendlier message for the most common case
      const friendly = /already.*registered|already exists|duplicate/i.test(msg)
        ? "An account with this email already exists. Please sign in instead."
        : msg;
      return respond({ ok: false, error: friendly });
    }
    const userId = authData.user.id;

    // 2) Generate unique slug
    let baseSlug = slugify(school_name);
    let slug = baseSlug;
    for (let i = 0; i < 20; i++) {
      const { data: existing } = await admin.from("schools").select("id").eq("slug", slug).maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;
    }

    // 3) Create school
    const { data: school, error: schoolErr } = await admin.from("schools").insert({
      name: school_name,
      slug,
      country: country ?? null,
      phone: phone ?? null,
      address: address ?? null,
      email: admin_email,
      subscription_plan: plan,
      subscription_status: "trialing",
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      max_students: PLAN_LIMITS[plan] ?? 200,
      owner_user_id: userId,
    }).select().single();

    if (schoolErr || !school) {
      await admin.auth.admin.deleteUser(userId);
      return respond({ ok: false, error: schoolErr?.message ?? "Failed to create school" });
    }

    // 4) Profile + membership + admin role
    await admin.from("profiles").insert({
      id: userId, user_id: userId, full_name: admin_full_name, email: admin_email, school_id: school.id,
    });
    await admin.from("user_schools").insert({ user_id: userId, school_id: school.id, is_primary: true });
    await admin.from("user_roles").insert({ user_id: userId, role: "admin" });

    return respond({ ok: true, success: true, school_id: school.id, slug: school.slug });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("register-school error:", msg);
    return respond({ ok: false, error: msg });
  }
});
