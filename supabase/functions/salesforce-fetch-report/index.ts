import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { report_id } = await req.json();

    if (!report_id) {
      throw new Error("Missing report_id");
    }

    // Get stored connection
    const { data: connData, error: connError } = await supabaseClient
      .from("sf_connection")
      .select("access_token_encrypted, instance_url")
      .single();

    if (connError || !connData) {
      throw new Error("No Salesforce connection found");
    }

    if (!connData.access_token_encrypted || !connData.instance_url) {
      throw new Error("Salesforce not connected");
    }

    // Fetch the report data from Salesforce Analytics API
    const reportUrl = `${connData.instance_url}/services/data/v59.0/analytics/reports/${report_id}`;

    const reportResponse = await fetch(reportUrl, {
      headers: {
        Authorization: `Bearer ${connData.access_token_encrypted}`,
        "Content-Type": "application/json",
      },
    });

    if (!reportResponse.ok) {
      const errorText = await reportResponse.text();
      throw new Error(`Salesforce API error: ${reportResponse.status} - ${errorText}`);
    }

    const reportData = await reportResponse.json();

    // Parse the report data into a usable format
    const factMap = reportData.factMap || {};
    const reportMetadata = reportData.reportMetadata || {};
    const groupingsDown = reportMetadata.groupingsDown || [];
    const aggregates = reportMetadata.aggregates || [];

    // Get column info
    const detailColumns = reportMetadata.detailColumns || [];
    const columnInfo = reportData.reportExtendedMetadata?.detailColumnInfo || {};
    const groupingColumnInfo = reportData.reportExtendedMetadata?.groupingColumnInfo || {};

    // Parse the data based on report type
    const reportFormat = reportMetadata.reportFormat;
    let parsedData: Record<string, unknown>[] = [];

    if (reportFormat === "TABULAR") {
      // Tabular report - rows are in T!T
      const rows = factMap["T!T"]?.rows || [];
      parsedData = rows.map((row: { dataCells: { label: string; value: unknown }[] }) => {
        const record: Record<string, unknown> = {};
        row.dataCells.forEach((cell: { label: string; value: unknown }, index: number) => {
          const colName = detailColumns[index] || `col_${index}`;
          const colLabel = columnInfo[colName]?.label || colName;
          record[colLabel] = cell.label || cell.value;
        });
        return record;
      });
    } else if (reportFormat === "SUMMARY") {
      // Summary report - has groupings
      // Get summary data from each grouping
      const groupingColumn = groupingsDown[0]?.name;
      const groupingLabel = groupingColumnInfo[groupingColumn]?.label || groupingColumn || "Group";

      Object.entries(factMap).forEach(([key, value]) => {
        if (key === "T!T") return; // Skip grand total

        const factValue = value as {
          rows?: { dataCells: { label: string; value: unknown }[] }[];
          aggregates?: { label: string; value: number }[];
        };
        const aggregateValues = factValue.aggregates || [];

        // Get the grouping value from the key
        const keyParts = key.split("!");
        const groupIndex = parseInt(keyParts[0]) || 0;

        // Get grouping labels from reportData
        const groupings = reportData.groupingsDown?.groupings || [];
        const grouping = groupings[groupIndex];
        const groupName = grouping?.label || `Group ${groupIndex}`;

        if (aggregateValues.length > 0) {
          const record: Record<string, unknown> = {
            name: groupName,
            [groupingLabel]: groupName,
          };

          aggregateValues.forEach((agg: { label: string; value: number }, index: number) => {
            const aggLabel = aggregates[index]?.label || `Value ${index}`;
            record[aggLabel] = agg.value;
            // Also set a generic "value" for simple charts
            if (index === 0) {
              record.value = agg.value;
            }
          });

          parsedData.push(record);
        }
      });
    } else if (reportFormat === "MATRIX") {
      // Matrix report - more complex, flatten to rows
      Object.entries(factMap).forEach(([key, value]) => {
        if (key === "T!T") return;

        const factValue = value as { aggregates?: { label: string; value: number }[] };
        const aggregateValues = factValue.aggregates || [];

        if (aggregateValues.length > 0) {
          parsedData.push({
            name: key,
            value: aggregateValues[0]?.value || 0,
          });
        }
      });
    }

    // Save snapshot to database
    const { error: snapshotError } = await supabaseClient
      .from("report_snapshots")
      .upsert({
        sf_report_id: report_id,
        data: parsedData,
        row_count: parsedData.length,
        captured_at: new Date().toISOString(),
      }, { onConflict: "sf_report_id" });

    if (snapshotError) {
      console.error("Snapshot save error:", snapshotError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        report_name: reportMetadata.name,
        report_format: reportFormat,
        row_count: parsedData.length,
        data: parsedData,
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
