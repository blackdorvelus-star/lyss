import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Unplug, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SageConnection {
  id: string;
  resource_owner_id: string;
  business_name: string | null;
  updated_at: string;
}

const SageConnect = () => {
  const [connection, setConnection] = useState<SageConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    loadConnection();
    const params = new URLSearchParams(window.location.search);
    if (params.get('sage_connected') === 'true') {
      toast.success("Sage connecté avec succès !");
      window.history.replaceState({}, '', window.location.pathname);
      loadConnection();
    }
  }, []);

  const loadConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await (supabase
      .from("sage_connections" as any)
      .select("id, resource_owner_id, business_name, updated_at")
      .eq("user_id", user.id)
      .maybeSingle() as any);

    setConnection(data as SageConnection | null);
    setLoading(false);
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sage-auth`,
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
      window.location.href = data.auth_url;
    } catch (err: any) {
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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sage-sync`,
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
        .from("sage_connections" as any)
        .delete()
        .eq("user_id", user.id) as any);

      setConnection(null);
      toast.success("Sage déconnecté.");
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
          <div className="w-10 h-10 rounded-lg bg-[#00DC82]/10 flex items-center justify-center">
            <span className="text-base font-bold text-[#00DC82]">Sage</span>
          </div>
          <div>
            <h4 className="font-display font-bold text-sm">Sage Business Cloud</h4>
            <p className="text-xs text-muted-foreground">
              {connection
                ? `Connecté — ${connection.business_name || connection.resource_owner_id}`
                : "Non connecté"}
            </p>
          </div>
        </div>
        {connection && <CheckCircle2 className="w-5 h-5 text-[#00DC82]" />}
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
        <Button onClick={handleConnect} disabled={connecting} className="w-full bg-[#00DC82] hover:bg-[#00b86b] text-white">
          {connecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ExternalLink className="w-4 h-4 mr-2" />}
          Connecter Sage
        </Button>
      )}

      <p className="text-xs text-muted-foreground">
        Synchronise automatiquement tes factures impayées depuis Sage Business Cloud.
      </p>
    </motion.div>
  );
};

export default SageConnect;
