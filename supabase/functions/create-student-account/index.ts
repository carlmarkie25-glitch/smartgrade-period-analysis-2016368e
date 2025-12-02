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

    const { student_id, password, full_name, class_id, department_id, date_of_birth, photo_url } = await req.json();

    if (!student_id || !password || !full_name || !class_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user with student_id as email (using a fake domain)
    const email = `${student_id}@student.local`;
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, student_id },
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create student record linked to the auth user
    const { data: studentData, error: studentError } = await supabaseAdmin
      .from("students")
      .insert({
        student_id,
        full_name,
        class_id,
        department_id,
        date_of_birth: date_of_birth || null,
        user_id: authData.user.id,
        photo_url: photo_url || null,
      })
      .select()
      .single();

    if (studentError) {
      // Rollback: delete the auth user if student creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: studentError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Assign student role
    await supabaseAdmin.from("user_roles").insert({
      user_id: authData.user.id,
      role: "student",
    });

    // Create profile for the student
    await supabaseAdmin.from("profiles").insert({
      id: authData.user.id,
      user_id: authData.user.id,
      full_name,
      email,
    });

    return new Response(
      JSON.stringify({ success: true, student: studentData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
