import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function refreshTokenIfNeeded(supabase: any, connection: any) {
  const expiresAt = new Date(connection.token_expires_at);
  const now = new Date();
  if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
    return connection.access_token;
  }

  const clientId = Deno.env.get("QUICKBOOKS_CLIENT_ID")!;
  const clientSecret = Deno.env.get("QUICKBOOKS_CLIENT_SECRET")!;
  const basicAuth = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch(
    "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: connection.refresh_token,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${await res.text()}`);
  }

  const tokens = await res.json();
  const newExpiresAt = new Date(
    Date.now() + tokens.expires_in * 1000
  ).toISOString();

  await supabase
    .from("quickbooks_connections")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: newExpiresAt,
    })
    .eq("id", connection.id);

  return tokens.access_token;
}

async function syncForUser(supabaseService: any, connection: any) {
  const userId = connection.user_id;
  const accessToken = await refreshTokenIfNeeded(supabaseService, connection);

  const query = encodeURIComponent(
    "SELECT * FROM Invoice WHERE Balance > '0' ORDERBY DueDate DESC MAXRESULTS 100"
  );
  const qbRes = await fetch(
    `https://quickbooks.api.intuit.com/v3/company/${connection.realm_id}/query?query=${query}&minorversion=65`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  if (!qbRes.ok) {
    const errText = await qbRes.text();
    throw new Error(`QuickBooks API error [${qbRes.status}]: ${errText}`);
  }

  const qbData = await qbRes.json();
  const qbInvoices = qbData.QueryResponse?.Invoice || [];

  let imported = 0;
  let skipped = 0;

  for (const qbInv of qbInvoices) {
    const clientName = qbInv.CustomerRef?.name || "Client inconnu";
    const amount = parseFloat(qbInv.Balance) || 0;
    const invoiceNumber = qbInv.DocNumber || null;
    const dueDate = qbInv.DueDate || null;

    // Find or create client
    const { data: existingClients } = await supabaseService
      .from("clients")
      .select("id")
      .eq("name", clientName)
      .eq("user_id", userId)
      .limit(1);

    let clientId: string;
    if (existingClients && existingClients.length > 0) {
      clientId = existingClients[0].id;
    } else {
      const { data: newClient, error: clientErr } = await supabaseService
        .from("clients")
        .insert({ user_id: userId, name: clientName })
        .select("id")
        .single();
      if (clientErr || !newClient) {
        console.warn(`Skipping client ${clientName}:`, clientErr);
        skipped++;
        continue;
      }
      clientId = newClient.id;
    }

    // Check if invoice already exists
    if (invoiceNumber) {
      const { data: existing } = await supabaseService
        .from("invoices")
        .select("id")
        .eq("invoice_number", invoiceNumber)
        .eq("user_id", userId)
        .limit(1);

      if (existing && existing.length > 0) {
        await supabaseService
          .from("invoices")
          .update({ amount, due_date: dueDate })
          .eq("id", existing[0].id);
        skipped++;
        continue;
      }
    }

    const { error: invErr } = await supabaseService.from("invoices").insert({
      user_id: userId,
      client_id: clientId,
      amount,
      invoice_number: invoiceNumber,
      due_date: dueDate,
      status: "pending",
    });

    if (invErr) {
      console.warn(`Error importing invoice ${invoiceNumber}:`, invErr);
      skipped++;
    } else {
      imported++;
    }
  }

  return { imported, skipped, total: qbInvoices.length };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseService = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if this is a scheduled call (no specific user) or manual
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    if (body.scheduled) {
      // Scheduled: sync ALL connected users
      const { data: connections, error: connErr } = await supabaseService
        .from("quickbooks_connections")
        .select("*");

      if (connErr || !connections?.length) {
        return new Response(
          JSON.stringify({
            success: true,
            message: "No QB connections to sync",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const results = [];
      for (const conn of connections) {
        try {
          const result = await syncForUser(supabaseService, conn);
          results.push({ user_id: conn.user_id, ...result });
          console.log(
            `Synced user ${conn.user_id}: ${result.imported} imported, ${result.skipped} skipped`
          );
        } catch (err) {
          console.error(
            `Sync failed for user ${conn.user_id}:`,
            err.message
          );
          results.push({ user_id: conn.user_id, error: err.message });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Manual: authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAnon = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseAnon.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: connection, error: connError } = await supabaseService
      .from("quickbooks_connections")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: "QuickBooks non connecté" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await syncForUser(supabaseService, connection);

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("QuickBooks sync error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
