import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshTokenIfNeeded(supabase: any, connection: any) {
  const expiresAt = new Date(connection.token_expires_at);
  const now = new Date();
  // Refresh if less than 5 minutes left
  if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
    return connection.access_token;
  }

  const clientId = Deno.env.get('QUICKBOOKS_CLIENT_ID')!;
  const clientSecret = Deno.env.get('QUICKBOOKS_CLIENT_SECRET')!;
  const basicAuth = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: connection.refresh_token,
    }),
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${await res.text()}`);
  }

  const tokens = await res.json();
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabase
    .from('quickbooks_connections')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: newExpiresAt,
    })
    .eq('id', connection.id);

  return tokens.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseService = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Validate user
    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } }
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const userId = claimsData.claims.sub;

    // Get QB connection
    const { data: connection, error: connError } = await supabaseService
      .from('quickbooks_connections')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (connError || !connection) {
      return new Response(JSON.stringify({ error: 'QuickBooks non connecté' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const accessToken = await refreshTokenIfNeeded(supabaseService, connection);

    // Fetch unpaid invoices from QuickBooks
    const query = encodeURIComponent("SELECT * FROM Invoice WHERE Balance > '0' ORDERBY DueDate DESC MAXRESULTS 100");
    const qbRes = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${connection.realm_id}/query?query=${query}&minorversion=65`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
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
      const clientName = qbInv.CustomerRef?.name || 'Client inconnu';
      const amount = parseFloat(qbInv.Balance) || 0;
      const invoiceNumber = qbInv.DocNumber || null;
      const dueDate = qbInv.DueDate || null;

      // Find or create client
      const { data: existingClients } = await supabaseService
        .from('clients')
        .select('id')
        .eq('name', clientName)
        .eq('user_id', userId)
        .limit(1);

      let clientId: string;
      if (existingClients && existingClients.length > 0) {
        clientId = existingClients[0].id;
      } else {
        const { data: newClient, error: clientErr } = await supabaseService
          .from('clients')
          .insert({ user_id: userId, name: clientName })
          .select('id')
          .single();
        if (clientErr || !newClient) {
          console.warn(`Skipping client ${clientName}:`, clientErr);
          skipped++;
          continue;
        }
        clientId = newClient.id;
      }

      // Check if invoice already exists (by invoice_number)
      if (invoiceNumber) {
        const { data: existing } = await supabaseService
          .from('invoices')
          .select('id')
          .eq('invoice_number', invoiceNumber)
          .eq('user_id', userId)
          .limit(1);

        if (existing && existing.length > 0) {
          // Update amount if changed
          await supabaseService
            .from('invoices')
            .update({ amount, due_date: dueDate })
            .eq('id', existing[0].id);
          skipped++;
          continue;
        }
      }

      const { error: invErr } = await supabaseService
        .from('invoices')
        .insert({
          user_id: userId,
          client_id: clientId,
          amount,
          invoice_number: invoiceNumber,
          due_date: dueDate,
          status: 'pending',
        });

      if (invErr) {
        console.warn(`Error importing invoice ${invoiceNumber}:`, invErr);
        skipped++;
      } else {
        imported++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      imported,
      skipped,
      total: qbInvoices.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('QuickBooks sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
