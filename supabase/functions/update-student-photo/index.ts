import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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

    const { student_id, photo_base64, photo_content_type } = await req.json();

    if (!student_id || !photo_base64 || !photo_content_type) {
      return new Response(
        JSON.stringify({ error: "student_id, photo_base64, and photo_content_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the student record to check ownership
    const { data: student, error: studentError } = await supabaseAdmin
      .from("students")
      .select("user_id")
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
      console.error("User", user.id, "not authorized to update photo for student", student_id);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access or own account required' }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upload photo
    const photoData = decode(photo_base64);
    const fileExt = photo_content_type.split('/')[1] || 'jpg';
    const fileName = `${student_id}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from('student-photos')
      .upload(fileName, photoData, {
        contentType: photo_content_type,
      });
    
    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      return new Response(
        JSON.stringify({ error: uploadError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('student-photos')
      .getPublicUrl(fileName);
    
    const photoUrl = urlData.publicUrl;

    console.log("Photo uploaded for student", student_id, "by", isAdmin ? "admin" : "self", user.id);

    return new Response(
      JSON.stringify({ success: true, photo_url: photoUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error uploading photo:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
