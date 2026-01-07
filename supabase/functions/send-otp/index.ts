import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating OTP for email:", email);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete any existing OTPs for this email
    await supabase
      .from("auth_otps")
      .delete()
      .eq("email", email);

    // Generate new OTP
    const otpCode = generateOTP();

    // Store OTP in database
    const { error: insertError } = await supabase
      .from("auth_otps")
      .insert({
        email,
        otp_code: otpCode,
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send OTP via Postmark
    const postmarkToken = Deno.env.get("POSTMARK_API_TOKEN");
    
    if (!postmarkToken) {
      console.error("POSTMARK_API_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailResponse = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkToken,
      },
      body: JSON.stringify({
        From: "noreply@yourdomain.com", // Replace with your verified sender signature email
        To: email,
        Subject: "Your Login OTP Code",
        HtmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; text-align: center;">Your OTP Code</h1>
            <p style="color: #666; text-align: center;">Use the following code to verify your email:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${otpCode}</span>
            </div>
            <p style="color: #999; text-align: center; font-size: 14px;">This code will expire in 10 minutes.</p>
            <p style="color: #999; text-align: center; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
          </div>
        `,
        TextBody: `Your OTP code is: ${otpCode}. This code will expire in 10 minutes.`,
        MessageStream: "outbound",
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Postmark response:", emailResult);

    if (!emailResponse.ok) {
      console.error("Postmark error:", emailResult);
      return new Response(
        JSON.stringify({ error: emailResult.Message || "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
