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

    const { student_id, photo_base64, photo_content_type } = await req.json();

    if (!student_id || !photo_base64 || !photo_content_type) {
      return new Response(
        JSON.stringify({ error: "student_id, photo_base64, and photo_content_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      return new Response(
        JSON.stringify({ error: uploadError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('student-photos')
      .getPublicUrl(fileName);
    
    const photoUrl = urlData.publicUrl;

    return new Response(
      JSON.stringify({ success: true, photo_url: photoUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
