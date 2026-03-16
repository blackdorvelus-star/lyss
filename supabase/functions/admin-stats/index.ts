import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    // Fetch global stats
    const [
      { count: totalUsers },
      { count: totalClients },
      { count: totalInvoices },
      { data: invoiceStats },
      { data: recentUsers },
    ] = await Promise.all([
      supabase.from("payment_settings").select("*", { count: "exact", head: true }),
      supabase.from("clients").select("*", { count: "exact", head: true }),
      supabase.from("invoices").select("*", { count: "exact", head: true }),
      supabase.from("invoices").select("amount, status, amount_recovered"),
      supabase.auth.admin.listUsers({ perPage: 50, page: 1 }),
    ]);

    const totalAmount = invoiceStats?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
    const totalRecovered = invoiceStats?.reduce((sum, i) => sum + Number(i.amount_recovered || 0), 0) || 0;
    const pendingCount = invoiceStats?.filter(i => i.status === "pending").length || 0;
    const recoveredCount = invoiceStats?.filter(i => i.status === "recovered").length || 0;

    // Get user roles
    const { data: allRoles } = await supabase.from("user_roles").select("user_id, role");

    const users = (recentUsers?.users || []).map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      roles: allRoles?.filter(r => r.user_id === u.id).map(r => r.role) || [],
    }));

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
      },
      users,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
