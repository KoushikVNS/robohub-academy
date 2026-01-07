import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp, password, full_name, enrollment_id, batch_number, mobile_number } = await req.json();

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!password || password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Verifying OTP for email:", email);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if OTP exists and is valid
    const { data: otpRecord, error: fetchError } = await supabase
      .from("auth_otps")
      .select("*")
      .eq("email", email)
      .eq("otp_code", otp)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (fetchError || !otpRecord) {
      console.log("Invalid or expired OTP:", fetchError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as verified
    await supabase
      .from("auth_otps")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      console.log("User already exists:", email);
      return new Response(
        JSON.stringify({ error: "An account with this email already exists. Please sign in with your password." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new user with password
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: "Failed to create user: " + createError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User created successfully:", newUser.user?.id);

    // Create profile for the new user
    if (newUser.user && full_name && enrollment_id && batch_number) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: newUser.user.id,
          full_name,
          enrollment_id,
          batch_number,
          mobile_number: mobile_number || null,
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        // Don't fail the whole signup if profile creation fails
      } else {
        console.log("Profile created for user:", newUser.user.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account created successfully. Please sign in with your password.",
        email
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
