import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshTokenIfNeeded(supabase: any, connection: any) {
  const expiresAt = new Date(connection.token_expires_at);
  if (expiresAt.getTime() - Date.now() > 5 * 60 * 1000) {
    return connection.access_token;
  }

  const res = await fetch('https://api.freshbooks.com/auth/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: Deno.env.get('FRESHBOOKS_CLIENT_ID')!,
      client_secret: Deno.env.get('FRESHBOOKS_CLIENT_SECRET')!,
      refresh_token: connection.refresh_token,
    }),
  });

  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);

  const tokens = await res.json();
  const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabase
    .from('freshbooks_connections')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: newExpiresAt,
    })
    .eq('id', connection.id);

  return tokens.access_token;
}

async function syncForUser(supabaseService: any, connection: any) {
  const userId = connection.user_id;
  const accessToken = await refreshTokenIfNeeded(supabaseService, connection);
  const accountId = connection.account_id;

  // Fetch unpaid invoices from FreshBooks
  const fbRes = await fetch(
    `https://api.freshbooks.com/accounting/account/${accountId}/invoices/invoices?search[status]=unpaid&per_page=100`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!fbRes.ok) {
    const errText = await fbRes.text();
    throw new Error(`FreshBooks API error [${fbRes.status}]: ${errText}`);
  }

  const fbData = await fbRes.json();
  const fbInvoices = fbData.response?.result?.invoices || [];

  let imported = 0;
  let skipped = 0;

  for (const fbInv of fbInvoices) {
    const clientName = fbInv.organization || fbInv.fname
      ? `${fbInv.fname || ''} ${fbInv.lname || ''}`.trim()
      : 'Client inconnu';
    const amount = parseFloat(fbInv.outstanding?.amount) || parseFloat(fbInv.amount?.amount) || 0;
    const invoiceNumber = fbInv.invoice_number || null;
    const dueDate = fbInv.due_date || null;

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

    // Check if invoice already exists
    if (invoiceNumber) {
      const { data: existing } = await supabaseService
        .from('invoices')
        .select('id')
        .eq('invoice_number', invoiceNumber)
        .eq('user_id', userId)
        .limit(1);

      if (existing && existing.length > 0) {
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

  return { imported, skipped, total: fbInvoices.length };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseService = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    let body: any = {};
    try { body = await req.json(); } catch {}

    if (body.scheduled) {
      const { data: connections } = await supabaseService
        .from('freshbooks_connections')
        .select('*');

      if (!connections?.length) {
        return new Response(JSON.stringify({ success: true, message: 'No FB connections' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const results = [];
      for (const conn of connections) {
        try {
          const result = await syncForUser(supabaseService, conn);
          results.push({ user_id: conn.user_id, ...result });
        } catch (err) {
          console.error(`FreshBooks sync failed for user ${conn.user_id}:`, err.message);
          results.push({ user_id: conn.user_id, error: err.message });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Manual: authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: connection } = await supabaseService
      .from('freshbooks_connections')
      .select('*')
      .eq('user_id', claimsData.claims.sub)
      .single();

    if (!connection) {
      return new Response(JSON.stringify({ error: 'FreshBooks non connecté' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const result = await syncForUser(supabaseService, connection);
    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('FreshBooks sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
