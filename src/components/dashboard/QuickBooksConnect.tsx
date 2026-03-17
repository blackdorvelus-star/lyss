import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Unplug, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QBConnection {
  id: string;
  realm_id: string;
  company_name: string | null;
  updated_at: string;
}

const QuickBooksConnect = () => {
  const [connection, setConnection] = useState<QBConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  useEffect(() => {
    loadConnection();
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    if (params.get('qb_connected') === 'true' || hash.includes('qb_connected=true')) {
      toast.success("QuickBooks connecté avec succès !");
      window.history.replaceState({}, '', window.location.pathname + '#integrations');
      loadConnection();
    }
    if (params.get('qb_error') || hash.includes('qb_error')) {
      const err = params.get('qb_error') || new URLSearchParams(hash.replace('#integrations?', '')).get('qb_error');
      toast.error(`Erreur QuickBooks : ${err === 'token_exchange_failed' ? "Échange de jeton échoué" : err === 'db_error' ? "Erreur de sauvegarde" : err}`);
      window.history.replaceState({}, '', window.location.pathname + '#integrations');
    }
  }, []);

  const loadConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await (supabase
      .from("quickbooks_connections" as any)
      .select("id, realm_id, company_name, updated_at")
      .eq("user_id", user.id)
      .maybeSingle() as any);

    setConnection(data as QBConnection | null);
    setLoading(false);
  };

  const openOAuthUrl = (url: string) => {
    try {
      // Try top-level navigation to escape iframe
      if (window.top && window.top !== window) {
        window.top.location.href = url;
        return;
      }
    } catch (e) {
      // Cross-origin iframe, can't access window.top
    }

    // Try window.open as fallback
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (!popup) {
      // Popup blocked — show fallback link
      setFallbackUrl(url);
      setConnecting(false);
      toast.error("La fenêtre a été bloquée. Utilise le lien ci-dessous.");
      return;
    }

    // Direct navigation as last resort
    window.location.href = url;
  };

  const handleConnect = async () => {
    setConnecting(true);
    setFallbackUrl(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) {
        toast.error("Tu dois être connecté pour lier QuickBooks.");
        setConnecting(false);
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quickbooks-auth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");

      openOAuthUrl(data.auth_url);
    } catch (err: any) {
      console.error("QuickBooks connect error:", err);
      toast.error(`Erreur : ${err.message}`);
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quickbooks-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de synchronisation");

      toast.success(
        `Synchronisation terminée : ${data.imported} importée(s), ${data.skipped} mise(s) à jour.`
      );
      loadConnection();
    } catch (err: any) {
      toast.error(`Erreur : ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase
        .from("quickbooks_connections" as any)
        .delete()
        .eq("user_id", user.id) as any);

      setConnection(null);
      toast.success("QuickBooks déconnecté.");
    } catch (err: any) {
      toast.error(`Erreur : ${err.message}`);
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#2CA01C]/10 flex items-center justify-center">
            <span className="text-lg font-bold text-[#2CA01C]">QB</span>
          </div>
          <div>
            <h4 className="font-display font-bold text-sm">QuickBooks Online</h4>
            <p className="text-xs text-muted-foreground">
              {connection
                ? `Connecté — ${connection.company_name || connection.realm_id}`
                : "Non connecté"}
            </p>
          </div>
        </div>

        {connection && (
          <CheckCircle2 className="w-5 h-5 text-[#2CA01C]" />
        )}
      </div>

      {connection ? (
        <div className="flex gap-2">
          <Button onClick={handleSync} disabled={syncing} className="flex-1" variant="default">
            {syncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Synchroniser les factures
          </Button>
          <Button onClick={handleDisconnect} disabled={disconnecting} variant="outline" size="icon">
            {disconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unplug className="w-4 h-4" />}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full bg-[#2CA01C] hover:bg-[#248a17] text-white"
          >
            {connecting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ExternalLink className="w-4 h-4 mr-2" />
            )}
            Connecter QuickBooks
          </Button>
          {fallbackUrl && (
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-xs text-primary underline hover:text-primary/80"
            >
              Ouvrir QuickBooks dans un nouvel onglet →
            </a>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Synchronise automatiquement tes factures impayées depuis QuickBooks Online.
      </p>
    </motion.div>
  );
};

export default QuickBooksConnect;
