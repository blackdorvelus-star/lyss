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
    const { user_id, invoice_id, message, history } = await req.json();

    if (!user_id || !message?.trim()) {
      return new Response(JSON.stringify({ error: 'Paramètres invalides' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get business info
    const { data: settings } = await supabase
      .from('payment_settings')
      .select('company_name, assistant_name')
      .eq('user_id', user_id)
      .single();

    const companyName = settings?.company_name || 'l\'entreprise';
    const assistantName = settings?.assistant_name || 'Lyss';

    // Get invoice context if provided
    let invoiceContext = '';
    if (invoice_id) {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('invoice_number, amount, amount_recovered, due_date, status, clients(name)')
        .eq('id', invoice_id)
        .single();

      if (invoice) {
        const remaining = invoice.amount - (invoice.amount_recovered || 0);
        invoiceContext = `
Contexte de la facture :
- Client : ${(invoice as any).clients?.name || 'Inconnu'}
- Numéro : ${invoice.invoice_number || 'Non spécifié'}
- Montant : ${invoice.amount} $
- Déjà versé : ${invoice.amount_recovered || 0} $
- Solde restant : ${remaining} $
- Échéance : ${invoice.due_date || 'Non spécifiée'}
- Statut : ${invoice.status}
`;
      }
    }

    const systemPrompt = `Tu es ${assistantName}, l'adjointe administrative IA de ${companyName}. Tu communiques en français québécois avec un ton professionnel et courtois (vouvoiement).

Ton rôle :
- Répondre aux questions des clients sur leurs factures
- Aider à comprendre les détails de facturation
- Transmettre les demandes de délai ou contestations à ${companyName}
- Tu ne traites JAMAIS de paiements toi-même — tu rediriges TOUJOURS vers ${companyName} pour le paiement
- TRÈS IMPORTANT : L'argent est dû à ${companyName}, PAS à toi (${assistantName}) ni à Lyss. Dis toujours "payer ${companyName}" ou "envoyer votre paiement à ${companyName}". Ne laisse JAMAIS entendre que le client paie Lyss ou ${assistantName}.
- Tu ne modifies JAMAIS les montants des factures
- Si le client a une plainte complexe, invite-le à contacter ${companyName} directement

${invoiceContext}

Sois concise (2-3 phrases max), empathique et serviable.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-10),
      { role: 'user', content: message.trim() },
    ];

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API error: ${errText}`);
    }

    const result = await response.json();
    const reply = result.choices?.[0]?.message?.content || "Je suis désolée, je n'ai pas pu traiter votre demande.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Widget chat error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
