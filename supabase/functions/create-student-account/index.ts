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

    const { student_id, password, full_name, class_id, department_id, date_of_birth, photo_base64, photo_content_type } = await req.json();

    console.log("Received request with photo_base64 length:", photo_base64?.length || 0);
    console.log("Photo content type:", photo_content_type);

    if (!student_id || !password || !full_name || !class_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to create auth user, handling duplicate email by trying next IDs
    let currentId = parseInt(student_id);
    let authData = null;
    let finalStudentId = student_id;
    
    for (let attempt = 0; attempt < 10; attempt++) {
      const email = `${currentId}@student.local`;
      console.log(`Attempting to create user with ID: ${currentId}, email: ${email}`);
      
      const result = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, student_id: String(currentId) },
      });

      if (!result.error) {
        authData = result.data;
        finalStudentId = String(currentId);
        console.log(`Successfully created user with ID: ${finalStudentId}`);
        break;
      }
      
      if (result.error.message.includes("already been registered")) {
        console.log(`ID ${currentId} already exists, trying next...`);
        currentId++;
        continue;
      }
      
      // Other error, return it
      return new Response(
        JSON.stringify({ error: result.error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!authData) {
      return new Response(
        JSON.stringify({ error: "Could not create user after multiple attempts" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upload photo if provided
    let uploadedPhotoUrl: string | null = null;
    if (photo_base64 && photo_content_type) {
      console.log("Attempting to upload photo...");
      try {
        const photoData = decode(photo_base64);
        console.log("Decoded photo data length:", photoData.length);
        const fileExt = photo_content_type.split('/')[1] || 'jpg';
        const fileName = `${student_id}-${Date.now()}.${fileExt}`;
        console.log("Uploading to filename:", fileName);
        
        const { error: uploadError, data: uploadData } = await supabaseAdmin.storage
          .from('student-photos')
          .upload(fileName, photoData, {
            contentType: photo_content_type,
          });
        
        console.log("Upload result - error:", uploadError, "data:", uploadData);
        
        if (!uploadError) {
          const { data: urlData } = supabaseAdmin.storage
            .from('student-photos')
            .getPublicUrl(fileName);
          uploadedPhotoUrl = urlData.publicUrl;
          console.log("Photo URL:", uploadedPhotoUrl);
        } else {
          console.error('Storage upload error:', uploadError);
        }
      } catch (photoError) {
        console.error('Photo upload error:', photoError);
      }
    } else {
      console.log("No photo provided - base64:", !!photo_base64, "contentType:", !!photo_content_type);
    }

    // Create student record linked to the auth user
    const { data: studentData, error: studentError } = await supabaseAdmin
      .from("students")
      .insert({
        student_id: finalStudentId,
        full_name,
        class_id,
        department_id,
        date_of_birth: date_of_birth || null,
        user_id: authData.user.id,
        photo_url: uploadedPhotoUrl,
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
      email: `${finalStudentId}@student.local`,
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
