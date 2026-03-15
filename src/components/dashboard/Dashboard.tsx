import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Loader2,
  Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DashboardProps {
  onBack: () => void;
  onNewInvoice: () => void;
  onLogout?: () => void;
}

interface InvoiceWithClient {
  id: string;
  amount: number;
  amount_recovered: number | null;
  status: string;
  invoice_number: string | null;
  created_at: string;
  due_date: string | null;
  clients: {
    name: string;
    email: string | null;
    phone: string | null;
  };
}

interface Reminder {
  id: string;
  channel: string;
  message_content: string;
  status: string;
  sent_at: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: "En attente", icon: Clock, color: "text-accent" },
  in_progress: { label: "Relances en cours", icon: MessageSquare, color: "text-primary" },
  recovered: { label: "Récupéré", icon: CheckCircle2, color: "text-primary" },
  failed: { label: "Échoué", icon: XCircle, color: "text-destructive" },
  cancelled: { label: "Annulé", icon: XCircle, color: "text-muted-foreground" },
};

const Dashboard = ({ onBack, onNewInvoice, onLogout }: DashboardProps) => {
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([]);
  const [reminders, setReminders] = useState<Record<string, Reminder[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryId, setRecoveryId] = useState<string | null>(null);
  const [recoveryAmount, setRecoveryAmount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: inv } = await supabase
      .from("invoices")
      .select("*, clients(*)")
      .order("created_at", { ascending: false });

    if (inv) {
      setInvoices(inv as unknown as InvoiceWithClient[]);

      // Fetch reminders for all invoices
      const invoiceIds = inv.map((i) => i.id);
      if (invoiceIds.length > 0) {
        const { data: rems } = await supabase
          .from("reminders")
          .select("*")
          .in("invoice_id", invoiceIds)
          .order("created_at", { ascending: false });

        if (rems) {
          const grouped: Record<string, Reminder[]> = {};
          for (const r of rems) {
            if (!grouped[r.invoice_id]) grouped[r.invoice_id] = [];
            grouped[r.invoice_id].push(r as Reminder);
          }
          setReminders(grouped);
        }
      }
    }
    setLoading(false);
  };

  // Stats
  const totalOwed = invoices.reduce((s, i) => s + i.amount, 0);
  const totalRecovered = invoices.reduce((s, i) => s + (i.amount_recovered || 0), 0);
  const activeCount = invoices.filter((i) => i.status === "in_progress").length;
  const totalReminders = Object.values(reminders).flat().length;

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-CA", { day: "numeric", month: "short" });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-5 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Accueil
          </button>
          <div className="flex items-center gap-3">
            {onLogout && (
              <button onClick={onLogout} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Déconnexion
              </button>
            )}
            <span className="font-display font-bold text-primary text-sm">Cash-Flow AI</span>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Total dû</p>
            <p className="font-display text-xl font-bold">{formatMoney(totalOwed)}</p>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <p className="text-xs text-primary mb-1">Récupéré</p>
            <p className="font-display text-xl font-bold text-primary">{formatMoney(totalRecovered)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Relances actives</p>
            <p className="font-display text-xl font-bold">{activeCount}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Messages envoyés</p>
            <p className="font-display text-xl font-bold">{totalReminders}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg font-bold">Mes factures</h2>
          <Button size="sm" onClick={onNewInvoice} className="bg-primary text-primary-foreground font-display">
            <Plus className="w-4 h-4 mr-1" />
            Nouvelle
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : invoices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground mb-4">Aucune facture soumise encore.</p>
            <Button onClick={onNewInvoice} className="bg-primary text-primary-foreground font-display">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter ta première facture
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv, i) => {
              const config = statusConfig[inv.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              const invReminders = reminders[inv.id] || [];
              const isExpanded = expandedId === inv.id;

              return (
                <motion.div
                  key={inv.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {/* Invoice card */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                    className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{inv.clients.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {inv.invoice_number ? `#${inv.invoice_number} · ` : ""}
                          {formatDate(inv.created_at)}
                        </p>
                      </div>
                      <p className="font-display font-bold text-lg ml-3">{formatMoney(inv.amount)}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-1.5 text-xs font-medium ${config.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {config.label}
                      </div>
                      <div className="flex items-center gap-2">
                        {invReminders.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {invReminders.length} relance{invReminders.length > 1 ? "s" : ""}
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {(inv.amount_recovered || 0) > 0 && (
                      <div className="mt-2 bg-primary/10 rounded-lg px-3 py-1.5">
                        <p className="text-xs text-primary font-medium">
                          Récupéré : {formatMoney(inv.amount_recovered || 0)} / {formatMoney(inv.amount)}
                        </p>
                        <div className="mt-1 h-1.5 bg-primary/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.min(100, ((inv.amount_recovered || 0) / inv.amount) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Expanded reminders */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 pb-1 space-y-2">
                          {/* Client info */}
                          <div className="bg-secondary rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                            <p><span className="font-medium text-foreground">Client :</span> {inv.clients.name}</p>
                            {inv.clients.email && <p><span className="font-medium text-foreground">Courriel :</span> {inv.clients.email}</p>}
                            {inv.clients.phone && <p><span className="font-medium text-foreground">Tél :</span> {inv.clients.phone}</p>}
                            {inv.due_date && <p><span className="font-medium text-foreground">Échéance :</span> {formatDate(inv.due_date)}</p>}
                          </div>

                          {invReminders.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-3">
                              Aucune relance générée encore.
                            </p>
                          ) : (
                            invReminders.map((rem) => (
                              <div
                                key={rem.id}
                                className="bg-secondary rounded-lg p-3"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                    rem.channel === "sms"
                                      ? "bg-accent/20 text-accent"
                                      : "bg-primary/15 text-primary"
                                  }`}>
                                    {rem.channel === "sms" ? "SMS" : "Courriel"}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {rem.sent_at ? formatDate(rem.sent_at) : "Planifié"}
                                  </span>
                                  <span className={`text-xs ml-auto ${
                                    rem.status === "sent" || rem.status === "delivered"
                                      ? "text-primary"
                                      : rem.status === "failed"
                                      ? "text-destructive"
                                      : "text-muted-foreground"
                                  }`}>
                                    {rem.status === "scheduled" && "⏳ Planifié"}
                                    {rem.status === "sent" && "✓ Envoyé"}
                                    {rem.status === "delivered" && "✓✓ Livré"}
                                    {rem.status === "replied" && "💬 Répondu"}
                                    {rem.status === "failed" && "✕ Échoué"}
                                  </span>
                                </div>
                                <p className="text-xs text-secondary-foreground leading-relaxed whitespace-pre-wrap">
                                  {rem.message_content}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
