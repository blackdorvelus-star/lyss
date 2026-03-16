import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');

    if (!code || !stateParam) {
      return new Response('Missing required parameters', { status: 400 });
    }

    const state = JSON.parse(atob(stateParam));
    const userId = state.user_id;

    const clientId = Deno.env.get('FRESHBOOKS_CLIENT_ID')!;
    const clientSecret = Deno.env.get('FRESHBOOKS_CLIENT_SECRET')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const redirectUri = `${supabaseUrl}/functions/v1/freshbooks-callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://api.freshbooks.com/auth/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('FreshBooks token exchange failed:', errBody);
      return new Response(`Token exchange failed: ${errBody}`, { status: 500 });
    }

    const tokens = await tokenRes.json();

    // Get current user's identity to find account_id and business name
    let accountId = '';
    let businessName: string | null = null;
    try {
      const meRes = await fetch('https://api.freshbooks.com/auth/api/v1/users/me', {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` },
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        const memberships = meData.response?.business_memberships || [];
        if (memberships.length > 0) {
          accountId = memberships[0].business?.account_id || '';
          businessName = memberships[0].business?.name || null;
        }
      }
    } catch (e) {
      console.warn('Could not fetch FreshBooks user info:', e);
    }

    if (!accountId) {
      return new Response('Could not determine FreshBooks account ID', { status: 500 });
    }

    // Store tokens
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error: upsertError } = await supabase
      .from('freshbooks_connections')
      .upsert({
        user_id: userId,
        account_id: accountId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        business_name: businessName,
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('DB upsert error:', upsertError);
      return new Response(`Database error: ${upsertError.message}`, { status: 500 });
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://id-preview--2f322a4e-87fe-4310-950d-30fbd705cb39.lovable.app';
    return new Response(null, {
      status: 302,
      headers: { 'Location': `${appUrl}/?fb_connected=true` },
    });
  } catch (error) {
    console.error('FreshBooks callback error:', error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});
