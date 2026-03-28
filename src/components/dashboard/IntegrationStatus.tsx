import { useState, useEffect } from "react";
import { Link2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { safeSupabase as supabase } from "@/lib/supabase-safe";

interface Integration {
  name: string;
  connected: boolean;
  loading: boolean;
  companyName?: string | null;
}

const IntegrationStatus = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([
    { name: "QuickBooks", connected: false, loading: true },
    { name: "Sage", connected: false, loading: true },
  ]);

  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: qb }, { data: sage }] = await Promise.all([
      supabase.from("quickbooks_connections").select("company_name").eq("user_id", user.id).maybeSingle(),
      supabase.from("sage_connections").select("business_name").eq("user_id", user.id).maybeSingle(),
    ]);

    setIntegrations([
      { name: "QuickBooks", connected: !!qb, loading: false, companyName: qb?.company_name },
      { name: "Sage", connected: !!sage, loading: false, companyName: sage?.business_name },
    ]);
  };

  return (
    <div className="flex items-center gap-3">
      <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
      {integrations.map((int) => (
        <div key={int.name} className="flex items-center gap-1.5">
          {int.loading ? (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          ) : int.connected ? (
            <CheckCircle className="w-3 h-3 text-primary" />
          ) : (
            <XCircle className="w-3 h-3 text-muted-foreground/50" />
          )}
          <span className={`text-[11px] font-medium ${int.connected ? "text-foreground" : "text-muted-foreground/60"}`}>
            {int.name}
            {int.companyName && <span className="text-muted-foreground font-normal"> · {int.companyName}</span>}
          </span>
        </div>
      ))}
    </div>
  );
};

export default IntegrationStatus;
