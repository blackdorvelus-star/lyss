import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const getRequiredEnv = (name: string) => {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`${name} not configured`);
  return value;
};

const getAppUrl = () => Deno.env.get("APP_URL")?.trim() || "https://lyss.lovable.app";

const redirectWithStatus = (status: string) =>
  new Response(null, {
    status: 302,
    headers: { Location: `${getAppUrl()}/#integrations?${status}` },
  });

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");
    const authError = url.searchParams.get("error");

    if (authError) {
      return redirectWithStatus(`sage_error=${encodeURIComponent(authError)}`);
    }

    if (!code || !stateParam) {
      return redirectWithStatus("sage_error=missing_params");
    }

    const state = JSON.parse(atob(stateParam));
    const userId = state.user_id;
    if (!userId) {
      return redirectWithStatus("sage_error=invalid_state");
    }

    const clientId = getRequiredEnv("SAGE_CLIENT_ID");
    const clientSecret = getRequiredEnv("SAGE_CLIENT_SECRET");
    const supabaseUrl = getRequiredEnv("SUPABASE_URL");
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const redirectUri = `${supabaseUrl}/functions/v1/sage-callback`;

    const tokenRes = await fetch("https://oauth.accounting.sage.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      console.error("Sage token exchange failed:", await tokenRes.text());
      return redirectWithStatus("sage_error=token_exchange_failed");
    }

    const tokens = await tokenRes.json();
    let resourceOwnerId = "";
    let businessName: string | null = null;

    try {
      const meRes = await fetch("https://api.accounting.sage.com/v3.1/user", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: "application/json",
        },
      });

      if (meRes.ok) {
        const meData = await meRes.json();
        resourceOwnerId = meData.resource_owner_id || tokens.resource_owner_id || "";
      }

      const bizRes = await fetch("https://api.accounting.sage.com/v3.1/business", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          Accept: "application/json",
        },
      });

      if (bizRes.ok) {
        const bizData = await bizRes.json();
        businessName = bizData.name || null;
      }
    } catch (error) {
      console.warn("Sage info fetch warning:", error);
    }

    if (!resourceOwnerId) {
      resourceOwnerId = tokens.resource_owner_id || "unknown";
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();

    const { error: upsertError } = await supabase.from("sage_connections").upsert(
      {
        user_id: userId,
        resource_owner_id: resourceOwnerId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        business_name: businessName,
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      console.error("Sage DB upsert error:", upsertError);
      return redirectWithStatus("sage_error=db_error");
    }

    return redirectWithStatus("sage_connected=true");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Sage callback error:", errorMessage);
    return redirectWithStatus("sage_error=unknown");
  }
});
