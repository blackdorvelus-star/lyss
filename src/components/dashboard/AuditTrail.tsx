import { useState, useEffect } from "react";
import {
  ScrollText, Loader2, FileText, MessageSquare, Phone, FileSignature,
  ArrowRight, Filter, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import LyssAvatar from "@/components/LyssAvatar";

interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  details: Record<string, any>;
  created_at: string;
}

const entityConfig: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  invoice: { icon: FileText, label: "Facture", color: "text-primary" },
  reminder: { icon: MessageSquare, label: "Relance", color: "text-accent" },
  call: { icon: Phone, label: "Appel", color: "text-primary" },
  quote: { icon: FileSignature, label: "Soumission", color: "text-accent" },
};

const actionLabels: Record<string, string> = {
  created: "Créé",
  status_changed: "Statut modifié",
  deleted: "Supprimé",
  updated: "Mis à jour",
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-CA", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const formatMoney = (n: number) =>
  new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

const AuditTrail = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    loadLogs();
  }, [filter, limit]);

  const loadLogs = async () => {
    setLoading(true);
    let query = supabase
      .from("audit_logs" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (filter !== "all") {
      query = query.eq("entity_type", filter);
    }

    const { data } = await query;
    setLogs((data as any) || []);
    setLoading(false);
  };

  const renderDetails = (log: AuditLog) => {
    const d = log.details;
    if (!d || Object.keys(d).length === 0) return null;

    if (log.action === "status_changed") {
      return (
        <span className="flex items-center gap-1 text-[10px]">
          <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{d.from}</span>
          <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{d.to}</span>
          {d.amount && <span className="text-muted-foreground ml-1">· {formatMoney(d.amount)}</span>}
        </span>
      );
    }

    if (log.action === "created" && d.amount) {
      return (
        <span className="text-[10px] text-muted-foreground">
          {d.invoice_number || d.quote_number ? `#${d.invoice_number || d.quote_number} · ` : ""}
          {formatMoney(d.amount)}
        </span>
      );
    }

    if (log.action === "updated" && d.call_result) {
      const resultText: Record<string, string> = {
        payment_promised: "Paiement promis ✓",
        callback_requested: "Rappel demandé",
        no_answer: "Sans réponse",
        refused: "Refusé",
      };
      return (
        <span className="text-[10px] text-muted-foreground">
          {resultText[d.call_result] || d.call_result}
          {d.duration_seconds && ` · ${Math.round(d.duration_seconds / 60)} min`}
          {d.client_sentiment === "negative" && <span className="text-destructive ml-1">⚠️ Négatif</span>}
        </span>
      );
    }

    if (log.action === "created" && d.channel) {
      return (
        <span className="text-[10px] text-muted-foreground">
          {d.channel === "sms" ? "SMS" : d.channel === "email" ? "Courriel" : "Appel"}
        </span>
      );
    }

    return null;
  };

  const exportCSV = () => {
    const header = "Date,Type,Action,Détails\n";
    const rows = logs.map((l) =>
      `"${formatDate(l.created_at)}","${entityConfig[l.entity_type]?.label || l.entity_type}","${actionLabels[l.action] || l.action}","${JSON.stringify(l.details).replace(/"/g, '""')}"`
    ).join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" />
            Journal d'audit
          </h2>
          <p className="text-xs text-muted-foreground">
            Historique complet et horodaté de toutes les actions pour conformité juridique.
          </p>
        </div>
        <Button onClick={exportCSV} size="sm" variant="outline" disabled={logs.length === 0}>
          <Download className="w-4 h-4 mr-1" />
          Exporter CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        {[
          { key: "all", label: "Tout" },
          { key: "invoice", label: "Factures" },
          { key: "reminder", label: "Relances" },
          { key: "call", label: "Appels" },
          { key: "quote", label: "Soumissions" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12">
          <ScrollText className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">Aucune entrée dans le journal.</p>
          <div className="flex items-start gap-2 mt-4 bg-primary/5 border border-primary/15 rounded-xl p-3 max-w-sm mx-auto">
            <LyssAvatar size="xs" />
            <p className="text-xs text-muted-foreground text-left">
              <span className="font-medium text-foreground">Lyss</span> — Le journal se remplit automatiquement 
              dès que des actions sont effectuées sur tes dossiers.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-1">
            {logs.map((log) => {
              const cfg = entityConfig[log.entity_type] || entityConfig.invoice;
              const Icon = cfg.icon;

              return (
                <div key={log.id} className="flex items-start gap-3 pl-1 py-2">
                  <div className="relative z-10 w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center flex-shrink-0">
                    <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium">{cfg.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        {actionLabels[log.action] || log.action}
                      </span>
                    </div>
                    <div className="mt-0.5">{renderDetails(log)}</div>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatDate(log.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load more */}
          {logs.length >= limit && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLimit((l) => l + 50)}
                className="text-xs"
              >
                Charger plus d'entrées
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditTrail;
