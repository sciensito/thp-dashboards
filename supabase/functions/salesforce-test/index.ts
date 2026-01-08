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

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get stored connection
    const { data: connData, error: connError } = await supabaseClient
      .from("sf_connection")
      .select("access_token_encrypted, instance_url")
      .single();

    if (connError || !connData) {
      throw new Error("No Salesforce connection found. Please connect first.");
    }

    if (!connData.access_token_encrypted || !connData.instance_url) {
      throw new Error("Salesforce not connected. Please authorize access first.");
    }

    // Test the connection by calling Salesforce API
    const testResponse = await fetch(
      `${connData.instance_url}/services/data/v59.0/limits`,
      {
        headers: {
          Authorization: `Bearer ${connData.access_token_encrypted}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      throw new Error(`Salesforce API error: ${testResponse.status} - ${errorText}`);
    }

    const limits = await testResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Connection successful",
        api_requests_remaining: limits.DailyApiRequests?.Remaining,
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
