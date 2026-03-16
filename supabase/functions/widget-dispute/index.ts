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
    const { user_id, invoice_id, client_name, message } = await req.json();

    if (!user_id || !message?.trim()) {
      return new Response(JSON.stringify({ error: 'Paramètres invalides' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const title = `Signalement de ${client_name || 'un client'}`;
    const notifMessage = message.trim().length > 200
      ? message.trim().substring(0, 200) + '…'
      : message.trim();

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        invoice_id: invoice_id || null,
        title,
        message: notifMessage,
        type: 'warning',
      });

    if (error) {
      console.error('Notification insert error:', error);
      throw new Error(error.message);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Widget dispute error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
