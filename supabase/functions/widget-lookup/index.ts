import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, search } = await req.json();

    if (!user_id || !search || search.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'Paramètres invalides' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const searchTerm = search.trim();

    // Search by invoice number
    const { data: byNumber } = await supabase
      .from('invoices')
      .select('id, invoice_number, amount, amount_recovered, due_date, status, client_id, clients(name)')
      .eq('user_id', user_id)
      .ilike('invoice_number', `%${searchTerm}%`)
      .limit(5);

    // Search by client name
    const { data: byName } = await supabase
      .from('invoices')
      .select('id, invoice_number, amount, amount_recovered, due_date, status, client_id, clients!inner(name)')
      .eq('user_id', user_id)
      .ilike('clients.name', `%${searchTerm}%`)
      .limit(5);

    // Merge and deduplicate
    const allResults = [...(byNumber || []), ...(byName || [])];
    const seen = new Set<string>();
    const results = allResults.filter(inv => {
      if (seen.has(inv.id)) return false;
      seen.add(inv.id);
      return true;
    }).map(inv => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      amount: inv.amount,
      amount_recovered: inv.amount_recovered || 0,
      remaining: inv.amount - (inv.amount_recovered || 0),
      due_date: inv.due_date,
      status: inv.status,
      client_name: (inv as any).clients?.name || 'Client',
    }));

    // Get business info for branding
    const { data: settings } = await supabase
      .from('payment_settings')
      .select('company_name, company_logo_url, allow_disputes')
      .eq('user_id', user_id)
      .single();

    return new Response(JSON.stringify({
      results,
      business: {
        company_name: settings?.company_name || 'Entreprise',
        company_logo_url: settings?.company_logo_url || null,
        allow_disputes: settings?.allow_disputes ?? false,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Widget lookup error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
