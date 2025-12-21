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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Authentication check - verify the caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { student_id, new_password } = await req.json();

    if (!student_id || !new_password) {
      return new Response(
        JSON.stringify({ error: "student_id and new_password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new_password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the student record
    const { data: student, error: studentError } = await supabaseAdmin
      .from("students")
      .select("user_id, student_id, full_name")
      .eq("id", student_id)
      .single();

    if (studentError || !student) {
      return new Response(
        JSON.stringify({ error: "Student not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authorization check - verify the user is admin OR is the student themselves
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    const isSelfUpdate = student.user_id === user.id;

    if (!isAdmin && !isSelfUpdate) {
      console.error("User", user.id, "not authorized to update password for student", student_id);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access or own account required' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let userId = student.user_id;

    // If student doesn't have a user account, create one (admin only)
    if (!userId) {
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Forbidden - Only admins can create accounts' }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const email = `${student.student_id}@student.local`;
      
      const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: new_password,
        email_confirm: true,
        user_metadata: { full_name: student.full_name, student_id: student.student_id },
      });

      if (authCreateError) {
        return new Response(
          JSON.stringify({ error: authCreateError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = authData.user.id;

      // Link the user to the student record
      await supabaseAdmin
        .from("students")
        .update({ user_id: userId })
        .eq("id", student_id);

      // Assign student role
      await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role: "student",
      });

      // Create profile
      await supabaseAdmin.from("profiles").insert({
        id: userId,
        user_id: userId,
        full_name: student.full_name,
        email,
      });

      console.log("User account created for student", student_id, "by", isAdmin ? "admin" : "self", user.id);

      return new Response(
        JSON.stringify({ success: true, message: "User account created with password" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the existing user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: new_password }
    );

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Password updated for student", student_id, "by", isAdmin ? "admin" : "self", user.id);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error updating password:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
