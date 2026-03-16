import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');
    const realmId = url.searchParams.get('realmId');

    if (!code || !stateParam || !realmId) {
      return new Response('Missing required parameters', { status: 400 });
    }

    const state = JSON.parse(atob(stateParam));
    const userId = state.user_id;

    const clientId = Deno.env.get('QUICKBOOKS_CLIENT_ID')!;
    const clientSecret = Deno.env.get('QUICKBOOKS_CLIENT_SECRET')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const redirectUri = `${supabaseUrl}/functions/v1/quickbooks-callback`;

    // Exchange code for tokens
    const basicAuth = btoa(`${clientId}:${clientSecret}`);
    const tokenRes = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('Token exchange failed:', errBody);
      return new Response(`Token exchange failed: ${errBody}`, { status: 500 });
    }

    const tokens = await tokenRes.json();

    // Get company info
    let companyName: string | null = null;
    try {
      const companyRes = await fetch(
        `https://quickbooks.api.intuit.com/v3/company/${realmId}/companyinfo/${realmId}?minorversion=65`,
        {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Accept': 'application/json',
          },
        }
      );
      if (companyRes.ok) {
        const companyData = await companyRes.json();
        companyName = companyData.CompanyInfo?.CompanyName || null;
      }
    } catch (e) {
      console.warn('Could not fetch company name:', e);
    }

    // Store tokens using service role
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error: upsertError } = await supabase
      .from('quickbooks_connections')
      .upsert({
        user_id: userId,
        realm_id: realmId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        company_name: companyName,
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('DB upsert error:', upsertError);
      return new Response(`Database error: ${upsertError.message}`, { status: 500 });
    }

    // Redirect back to dashboard with success
    const appUrl = Deno.env.get('APP_URL') || 'https://id-preview--2f322a4e-87fe-4310-950d-30fbd705cb39.lovable.app';
    return new Response(null, {
      status: 302,
      headers: { 'Location': `${appUrl}/?qb_connected=true` },
    });
  } catch (error) {
    console.error('QuickBooks callback error:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});
