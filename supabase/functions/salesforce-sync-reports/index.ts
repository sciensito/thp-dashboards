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
      .select("access_token_encrypted, instance_url, id")
      .single();

    if (connError || !connData) {
      throw new Error("No Salesforce connection found. Please connect first.");
    }

    if (!connData.access_token_encrypted || !connData.instance_url) {
      throw new Error("Salesforce not connected. Please authorize access first.");
    }

    // Query Salesforce for reports
    const reportsQuery = encodeURIComponent(
      "SELECT Id, Name, DeveloperName, FolderName, Format, LastRunDate FROM Report ORDER BY LastRunDate DESC NULLS LAST LIMIT 100"
    );

    const reportsResponse = await fetch(
      `${connData.instance_url}/services/data/v59.0/query?q=${reportsQuery}`,
      {
        headers: {
          Authorization: `Bearer ${connData.access_token_encrypted}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!reportsResponse.ok) {
      const errorText = await reportsResponse.text();
      throw new Error(`Salesforce API error: ${reportsResponse.status} - ${errorText}`);
    }

    const reportsData = await reportsResponse.json();
    const reports = reportsData.records || [];

    // Upsert reports to database
    const reportsToUpsert = reports.map((report: {
      Id: string;
      Name: string;
      DeveloperName: string;
      FolderName: string;
      Format: string;
      LastRunDate: string;
    }) => ({
      sf_report_id: report.Id,
      name: report.Name,
      folder_name: report.FolderName,
      report_type: report.Format.toLowerCase(),
      last_synced_at: new Date().toISOString(),
      metadata: {
        developer_name: report.DeveloperName,
        last_run_date: report.LastRunDate,
      },
    }));

    let upsertErrorMessage: string | null = null;

    if (reportsToUpsert.length > 0) {
      const { error: upsertError } = await supabaseClient
        .from("sf_reports")
        .upsert(reportsToUpsert, { onConflict: "sf_report_id" });

      if (upsertError) {
        console.error("Upsert error:", upsertError);
        upsertErrorMessage = upsertError.message;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: reports.length,
        saved: !upsertErrorMessage,
        upsertError: upsertErrorMessage,
        reports: reports.map((r: { Id: string; Name: string; FolderName: string; Format: string; LastRunDate: string }) => ({
          id: r.Id,
          name: r.Name,
          folder: r.FolderName,
          format: r.Format,
          lastRunDate: r.LastRunDate,
        })),
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
