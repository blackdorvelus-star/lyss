import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://lyss.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Non autorisé");

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) throw new Error("Non autorisé");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Accès refusé — admin requis");

    // Handle POST for plan updates
    if (req.method === "POST") {
      const { action, userId, plan, maxDossiers } = await req.json();

      if (action === "update_plan") {
        const { error } = await supabase
          .from("subscriptions")
          .upsert({
            user_id: userId,
            plan,
            max_dossiers: maxDossiers,
          }, { onConflict: "user_id" });

        if (error) throw new Error(error.message);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error("Action inconnue");
    }

    // GET: Fetch global stats
    const [
      { count: totalUsers },
      { count: totalClients },
      { count: totalInvoices },
      { data: invoiceStats },
      { data: recentUsers },
      { data: allSubs },
    ] = await Promise.all([
      supabase.from("payment_settings").select("*", { count: "exact", head: true }),
      supabase.from("clients").select("*", { count: "exact", head: true }),
      supabase.from("invoices").select("*", { count: "exact", head: true }),
      supabase.from("invoices").select("amount, status, amount_recovered"),
      supabase.auth.admin.listUsers({ perPage: 50, page: 1 }),
      supabase.from("subscriptions").select("user_id, plan, max_dossiers"),
    ]);

    const totalAmount = invoiceStats?.reduce((sum: number, i: any) => sum + Number(i.amount), 0) || 0;
    const totalRecovered = invoiceStats?.reduce((sum: number, i: any) => sum + Number(i.amount_recovered || 0), 0) || 0;
    const pendingCount = invoiceStats?.filter((i: any) => i.status === "pending").length || 0;
    const recoveredCount = invoiceStats?.filter((i: any) => i.status === "recovered").length || 0;

    const { data: allRoles } = await supabase.from("user_roles").select("user_id, role");

    const users = (recentUsers?.users || []).map((u: any) => {
      const sub = allSubs?.find((s: any) => s.user_id === u.id);
      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        roles: allRoles?.filter((r: any) => r.user_id === u.id).map((r: any) => r.role) || [],
        plan: sub?.plan || "free",
        max_dossiers: sub?.max_dossiers || 1,
      };
    });

    // Plan distribution
    const planCounts = { free: 0, solo: 0, pro: 0, enterprise: 0 };
    users.forEach((u: any) => {
      if (planCounts[u.plan as keyof typeof planCounts] !== undefined) {
        planCounts[u.plan as keyof typeof planCounts]++;
      }
    });

    return new Response(JSON.stringify({
      stats: {
        totalUsers: totalUsers || 0,
        totalClients: totalClients || 0,
        totalInvoices: totalInvoices || 0,
        totalAmount,
        totalRecovered,
        pendingCount,
        recoveredCount,
        recoveryRate: totalAmount > 0 ? Math.round((totalRecovered / totalAmount) * 100) : 0,
        planCounts,
      },
      users,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
