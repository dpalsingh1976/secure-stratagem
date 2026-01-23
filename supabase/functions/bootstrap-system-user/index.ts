import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";
const SYSTEM_USER_EMAIL = "system-guest-advisor@securestratagem.internal";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // Check if system user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(SYSTEM_USER_ID);
    
    if (existingUser?.user) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "System user already exists",
        userId: SYSTEM_USER_ID 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    // Create the system user with specific UUID
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      id: SYSTEM_USER_ID,
      email: SYSTEM_USER_EMAIL,
      email_confirm: true,
      user_metadata: { 
        is_system_user: true,
        purpose: "guest_client_advisor" 
      }
    });

    if (error) throw error;

    // Add advisor role for this system user
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: SYSTEM_USER_ID,
      role: "advisor"
    });

    if (roleError) {
      console.error("Role insert error:", roleError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "System user created successfully",
      userId: data.user?.id 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }});

  } catch (error) {
    console.error("Bootstrap error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
  }
});
