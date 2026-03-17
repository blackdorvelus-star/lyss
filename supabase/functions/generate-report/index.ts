import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!);
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { month, year } = await req.json();
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
    const monthName = new Date(year, month - 1).toLocaleDateString("fr-CA", { month: "long", year: "numeric" });

    // Fetch company name
    const { data: settings } = await supabase
      .from("payment_settings")
      .select("company_name, assistant_name")
      .eq("user_id", user.id)
      .maybeSingle();

    const companyName = settings?.company_name || "Mon entreprise";
    const assistantName = settings?.assistant_name || "Lyss";

    // Fetch invoices for the period
    const { data: allInvoices } = await supabase
      .from("invoices")
      .select("*, clients(name)")
      .eq("user_id", user.id);

    const invoices = allInvoices || [];

    // Invoices created this month
    const monthInvoices = invoices.filter(
      (i: any) => i.created_at >= startDate && i.created_at <= endDate
    );

    // Recovered this month (status changed to recovered in this period)
    const recovered = invoices.filter(
      (i: any) => i.status === "recovered" && i.updated_at >= startDate && i.updated_at <= endDate
    );

    // All-time stats
    const totalOutstanding = invoices
      .filter((i: any) => i.status === "pending" || i.status === "in_progress")
      .reduce((s: number, i: any) => s + i.amount - (i.amount_recovered || 0), 0);

    const totalRecoveredAmount = recovered.reduce((s: number, i: any) => s + (i.amount_recovered || i.amount), 0);
    const totalRecoveredCount = recovered.length;

    // DSO calculation (Days Sales Outstanding)
    const paidInvoices = invoices.filter((i: any) => i.status === "recovered" && i.due_date);
    let avgDSO = 0;
    if (paidInvoices.length > 0) {
      const totalDays = paidInvoices.reduce((sum: number, inv: any) => {
        const created = new Date(inv.created_at).getTime();
        const updated = new Date(inv.updated_at).getTime();
        return sum + Math.max(0, Math.floor((updated - created) / (1000 * 60 * 60 * 24)));
      }, 0);
      avgDSO = Math.round(totalDays / paidInvoices.length);
    }

    // Reminders this month
    const { data: reminders } = await supabase
      .from("reminders")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    const totalReminders = reminders?.length || 0;
    const smsCount = reminders?.filter((r: any) => r.channel === "sms").length || 0;
    const emailCount = reminders?.filter((r: any) => r.channel === "email").length || 0;
    const deliveredCount = reminders?.filter((r: any) => r.delivery_status === "delivered").length || 0;
    const responsesCount = reminders?.filter((r: any) => r.sms_response).length || 0;

    // Call logs this month
    const { data: calls } = await supabase
      .from("call_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    const totalCalls = calls?.length || 0;
    const promisedCalls = calls?.filter((c: any) => c.call_result === "payment_promised").length || 0;

    // Success rate
    const successRate = invoices.length > 0
      ? Math.round((invoices.filter((i: any) => i.status === "recovered").length / invoices.length) * 100)
      : 0;

    // Hours saved estimate
    const hoursSaved = Math.round((totalReminders * 5 + totalCalls * 15) / 60 * 10) / 10;

    // Top recovered invoices
    const topRecovered = recovered
      .sort((a: any, b: any) => (b.amount_recovered || b.amount) - (a.amount_recovered || a.amount))
      .slice(0, 5);

    // Format money
    const fmt = (n: number) => new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

    // Generate PDF as HTML (will be rendered client-side)
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Rapport ${monthName} — ${companyName}</title>
<style>
  @page { margin: 40px 50px; size: letter; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a2e; background: white; padding: 40px 50px; line-height: 1.5; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; border-bottom: 3px solid #6C5CE7; padding-bottom: 20px; }
  .header h1 { font-size: 22px; font-weight: 800; color: #6C5CE7; }
  .header .subtitle { font-size: 13px; color: #666; margin-top: 4px; }
  .header .period { font-size: 14px; font-weight: 600; color: #1a1a2e; text-align: right; }
  .header .company { font-size: 12px; color: #666; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
  .kpi { background: #f8f7ff; border: 1px solid #e8e5ff; border-radius: 12px; padding: 16px; text-align: center; }
  .kpi .value { font-size: 24px; font-weight: 800; color: #6C5CE7; }
  .kpi .label { font-size: 11px; color: #666; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .section { margin-bottom: 28px; }
  .section h2 { font-size: 15px; font-weight: 700; margin-bottom: 12px; color: #1a1a2e; border-left: 3px solid #6C5CE7; padding-left: 10px; }
  .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
  .stat-row .label { color: #666; }
  .stat-row .value { font-weight: 600; color: #1a1a2e; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; padding: 10px 8px; background: #f8f7ff; color: #6C5CE7; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 10px 8px; border-bottom: 1px solid #f0f0f0; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 600; }
  .badge-success { background: #e8f5e9; color: #2e7d32; }
  .badge-pending { background: #fff3e0; color: #e65100; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 11px; color: #999; text-align: center; }
  .highlight { background: linear-gradient(135deg, #6C5CE7 0%, #a29bfe 100%); color: white; border-radius: 12px; padding: 20px; margin-bottom: 28px; display: flex; justify-content: space-around; text-align: center; }
  .highlight .big { font-size: 28px; font-weight: 800; }
  .highlight .small { font-size: 11px; opacity: 0.85; margin-top: 4px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>📊 Rapport mensuel</h1>
      <div class="subtitle">Généré par ${assistantName}, ton adjointe IA</div>
    </div>
    <div>
      <div class="period">${monthName.charAt(0).toUpperCase() + monthName.slice(1)}</div>
      <div class="company">${companyName}</div>
    </div>
  </div>

  <div class="highlight">
    <div>
      <div class="big">${fmt(totalRecoveredAmount)}</div>
      <div class="small">Récupéré ce mois</div>
    </div>
    <div>
      <div class="big">${avgDSO} jours</div>
      <div class="small">DSO moyen</div>
    </div>
    <div>
      <div class="big">${successRate}%</div>
      <div class="small">Taux de succès</div>
    </div>
    <div>
      <div class="big">${hoursSaved}h</div>
      <div class="small">Temps économisé</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi">
      <div class="value">${monthInvoices.length}</div>
      <div class="label">Nouveaux dossiers</div>
    </div>
    <div class="kpi">
      <div class="value">${totalRecoveredCount}</div>
      <div class="label">Dossiers réglés</div>
    </div>
    <div class="kpi">
      <div class="value">${fmt(totalOutstanding)}</div>
      <div class="label">Encours restant</div>
    </div>
    <div class="kpi">
      <div class="value">${totalReminders}</div>
      <div class="label">Relances envoyées</div>
    </div>
  </div>

  <div class="section">
    <h2>Activité de ${assistantName}</h2>
    <div class="stat-row"><span class="label">SMS envoyés</span><span class="value">${smsCount}</span></div>
    <div class="stat-row"><span class="label">Courriels envoyés</span><span class="value">${emailCount}</span></div>
    <div class="stat-row"><span class="label">Appels effectués</span><span class="value">${totalCalls}</span></div>
    <div class="stat-row"><span class="label">Messages livrés</span><span class="value">${deliveredCount}</span></div>
    <div class="stat-row"><span class="label">Réponses reçues</span><span class="value">${responsesCount}</span></div>
    <div class="stat-row"><span class="label">Promesses de paiement</span><span class="value">${promisedCalls}</span></div>
  </div>

  ${topRecovered.length > 0 ? `
  <div class="section">
    <h2>Top récupérations du mois</h2>
    <table>
      <thead>
        <tr><th>Client</th><th>Facture</th><th>Montant récupéré</th></tr>
      </thead>
      <tbody>
        ${topRecovered.map((inv: any) => `
          <tr>
            <td>${inv.clients?.name || "—"}</td>
            <td>${inv.invoice_number || "—"}</td>
            <td><strong>${fmt(inv.amount_recovered || inv.amount)}</strong></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>
  ` : ""}

  <div class="section">
    <h2>Indicateurs financiers</h2>
    <div class="stat-row"><span class="label">DSO moyen (jours pour être payé)</span><span class="value">${avgDSO} jours</span></div>
    <div class="stat-row"><span class="label">Taux de recouvrement global</span><span class="value">${successRate}%</span></div>
    <div class="stat-row"><span class="label">Montant total en encours</span><span class="value">${fmt(totalOutstanding)}</span></div>
    <div class="stat-row"><span class="label">Temps admin économisé (estimé)</span><span class="value">${hoursSaved} heures</span></div>
  </div>

  <div class="footer">
    Rapport généré automatiquement par ${assistantName} · ${new Date().toLocaleDateString("fr-CA")} · Lyss — Adjointe administrative IA
  </div>
</body>
</html>`;

    return new Response(
      JSON.stringify({ html, month: monthName, company: companyName }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("generate-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
