import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Plan = "free" | "solo" | "pro" | "enterprise";

export interface PlanLimits {
  plan: Plan;
  maxDossiers: number;
  label: string;
  canUseIntegrations: boolean;
  canUseVoice: boolean;
  canUseWidget: boolean;
}

const PLAN_CONFIG: Record<Plan, Omit<PlanLimits, "plan" | "maxDossiers">> = {
  free: { label: "Gratuit", canUseIntegrations: false, canUseVoice: false, canUseWidget: false },
  solo: { label: "Solo — 49 $/mois", canUseIntegrations: false, canUseVoice: true, canUseWidget: true },
  pro: { label: "Pro — 149 $/mois", canUseIntegrations: true, canUseVoice: true, canUseWidget: true },
  enterprise: { label: "Entreprise", canUseIntegrations: true, canUseVoice: true, canUseWidget: true },
};

export const usePlan = () => {
  const [planLimits, setPlanLimits] = useState<PlanLimits>({
    plan: "free",
    maxDossiers: 1,
    label: "Gratuit",
    canUseIntegrations: false,
    canUseVoice: false,
    canUseWidget: false,
  });
  const [loading, setLoading] = useState(true);
  const [dossierCount, setDossierCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Get subscription
      const { data: sub } = await supabase
        .from("subscriptions" as any)
        .select("plan, max_dossiers")
        .eq("user_id", user.id)
        .maybeSingle();

      const plan = (sub?.plan as Plan) || "free";
      const maxDossiers = sub?.max_dossiers || 1;
      const config = PLAN_CONFIG[plan];

      setPlanLimits({ plan, maxDossiers, ...config });

      // Count active dossiers (invoices not recovered)
      const { count } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .neq("status", "recovered");

      setDossierCount(count || 0);
      setLoading(false);
    };

    load();
  }, []);

  const canCreateDossier = planLimits.maxDossiers === 9999 || dossierCount < planLimits.maxDossiers;
  const remainingDossiers = planLimits.maxDossiers === 9999 ? Infinity : Math.max(0, planLimits.maxDossiers - dossierCount);

  return { ...planLimits, loading, dossierCount, canCreateDossier, remainingDossiers };
};
