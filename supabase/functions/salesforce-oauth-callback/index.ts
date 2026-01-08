import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Skip JWT verification - this function uses service role key internally

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { code, redirect_uri } = await req.json();

    if (!code || !redirect_uri) {
      throw new Error("Missing code or redirect_uri");
    }

    // Get stored credentials
    const { data: connData, error: connError } = await supabaseClient
      .from("sf_connection")
      .select("consumer_key, consumer_secret_encrypted")
      .single();

    if (connError || !connData) {
      throw new Error("No credentials found. Please save credentials first.");
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://login.salesforce.com/services/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: connData.consumer_key,
        client_secret: connData.consumer_secret_encrypted,
        redirect_uri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(
        JSON.stringify({ error: tokenData.error, error_description: tokenData.error_description }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save tokens to database
    const { error: updateError } = await supabaseClient
      .from("sf_connection")
      .update({
        access_token_encrypted: tokenData.access_token,
        refresh_token_encrypted: tokenData.refresh_token,
        instance_url: tokenData.instance_url,
        updated_at: new Date().toISOString(),
      })
      .eq("consumer_key", connData.consumer_key);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        instance_url: tokenData.instance_url
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
