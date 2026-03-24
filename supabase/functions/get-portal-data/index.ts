import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: "Token requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get token data
    const { data: tokenData, error: tokenError } = await supabase
      .from("payment_tokens")
      .select("*, invoices(*, clients(name, email, phone))")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: "Lien invalide ou expiré" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiration
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Ce lien a expiré" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get payment settings for the business owner
    const { data: settings } = await supabase
      .from("payment_settings")
      .select("*")
      .eq("user_id", tokenData.user_id)
      .single();

    const invoice = tokenData.invoices;
    const client = invoice?.clients;

    return new Response(
      JSON.stringify({
        user_id: tokenData.user_id,
        invoice_id: invoice?.id,
        invoice: {
          invoice_number: invoice?.invoice_number,
          amount: invoice?.amount,
          amount_recovered: invoice?.amount_recovered,
          due_date: invoice?.due_date,
          status: invoice?.status,
        },
        client: {
          name: client?.name,
        },
        business: {
          company_name: settings?.company_name || "Entreprise",
          company_logo_url: settings?.company_logo_url,
          interac_email: settings?.interac_email,
          interac_question: settings?.interac_question,
          interac_answer: settings?.interac_answer,
          stripe_link: settings?.stripe_link,
          paypal_link: settings?.paypal_link,
          bank_name: settings?.bank_name,
          bank_institution: settings?.bank_institution,
          bank_transit: settings?.bank_transit,
          bank_account: settings?.bank_account,
          cheque_address: settings?.cheque_address,
          deposit_instructions: settings?.deposit_instructions,
          allow_disputes: settings?.allow_disputes ?? false,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Portal error:", err);
    return new Response(JSON.stringify({ error: "Erreur interne" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
