import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const getRequiredEnv = (name: string) => {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`${name} not configured`);
  return value;
};

async function refreshTokenIfNeeded(supabase: any, connection: any) {
  const expiresAt = new Date(connection.token_expires_at);
  if (expiresAt.getTime() - Date.now() > 5 * 60 * 1000) {
    return connection.access_token;
  }

  const response = await fetch("https://oauth.accounting.sage.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: getRequiredEnv("SAGE_CLIENT_ID"),
      client_secret: getRequiredEnv("SAGE_CLIENT_SECRET"),
      refresh_token: connection.refresh_token,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${await response.text()}`);
  }

  const tokens = await response.json();
  const newExpiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();

  await supabase.from("sage_connections").update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expires_at: newExpiresAt,
  }).eq("id", connection.id);

  return tokens.access_token;
}

async function syncForUser(supabaseService: any, connection: any) {
  const userId = connection.user_id;
  const accessToken = await refreshTokenIfNeeded(supabaseService, connection);

  const sageRes = await fetch(
    "https://api.accounting.sage.com/v3.1/sales_invoices?attributes=items_count&status_id=UNPAID&items_per_page=100",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  if (!sageRes.ok) {
    throw new Error(`Sage API error [${sageRes.status}]: ${await sageRes.text()}`);
  }

  const sageData = await sageRes.json();
  const sageInvoices = sageData.$items || [];
  let imported = 0;
  let skipped = 0;

  for (const inv of sageInvoices) {
    const clientName = inv.contact_name || inv.contact?.name || "Client inconnu";
    const amount = parseFloat(inv.outstanding_amount) || parseFloat(inv.total_amount) || 0;
    const invoiceNumber = inv.displayed_as?.split(" ")[0] || inv.invoice_number || null;
    const dueDate = inv.due_date || null;

    const { data: existingClients } = await supabaseService
      .from("clients")
      .select("id")
      .eq("name", clientName)
      .eq("user_id", userId)
      .limit(1);

    let clientId: string;
    if (existingClients?.length) {
      clientId = existingClients[0].id;
    } else {
      const { data: newClient, error: clientErr } = await supabaseService
        .from("clients")
        .insert({ user_id: userId, name: clientName })
        .select("id")
        .single();

      if (clientErr || !newClient) {
        skipped++;
        continue;
      }

      clientId = newClient.id;
    }

    if (invoiceNumber) {
      const { data: existing } = await supabaseService
        .from("invoices")
        .select("id")
        .eq("invoice_number", invoiceNumber)
        .eq("user_id", userId)
        .limit(1);

      if (existing?.length) {
        await supabaseService.from("invoices").update({ amount, due_date: dueDate }).eq("id", existing[0].id);
        skipped++;
        continue;
      }
    }

    const { error: invoiceError } = await supabaseService.from("invoices").insert({
      user_id: userId,
      client_id: clientId,
      amount,
      invoice_number: invoiceNumber,
      due_date: dueDate,
      status: "pending",
    });

    if (invoiceError) {
      skipped++;
    } else {
      imported++;
    }
  }

  return { imported, skipped, total: sageInvoices.length };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = getRequiredEnv("SUPABASE_ANON_KEY");
    const supabaseService = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let body: { scheduled?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    if (body.scheduled) {
      const { data: connections } = await supabaseService.from("sage_connections").select("*");
      if (!connections?.length) {
        return new Response(JSON.stringify({ success: true, message: "No Sage connections" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results = [];
      for (const conn of connections) {
        try {
          results.push({ user_id: conn.user_id, ...(await syncForUser(supabaseService, conn)) });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Sage sync failed for user ${conn.user_id}:`, errorMessage);
          results.push({ user_id: conn.user_id, error: errorMessage });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } },
    });

    const { data, error } = await userClient.auth.getClaims(token);
    if (error || !data?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: connection } = await supabaseService
      .from("sage_connections")
      .select("*")
      .eq("user_id", data.claims.sub)
      .maybeSingle();

    if (!connection) {
      return new Response(JSON.stringify({ error: "Sage non connecté" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await syncForUser(supabaseService, connection);
    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Sage sync error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
