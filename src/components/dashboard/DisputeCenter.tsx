import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, AlertTriangle, Clock, CheckCircle2, MessageSquare,
  Phone, Mail, ChevronDown, ChevronUp, Loader2, Send, UserCheck,
  XCircle, Pause, Play, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DisputedInvoice {
  id: string;
  amount: number;
  amount_recovered: number | null;
  status: string;
  invoice_number: string | null;
  created_at: string;
  due_date: string | null;
  clients: { id: string; name: string; email: string | null; phone: string | null };
}

interface Reminder {
  id: string;
  channel: string;
  message_content: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  response: string | null;
}

interface CallLog {
  id: string;
  invoice_id: string;
  status: string;
  duration_seconds: number | null;
  client_sentiment: string | null;
  call_result: string | null;
  summary: string | null;
  created_at: string;
}

type DisputeAction = "resolve" | "reactivate" | "note";

const DisputeCenter = () => {
  const [invoices, setInvoices] = useState<DisputedInvoice[]>([]);
  const [remindersMap, setRemindersMap] = useState<Record<string, Reminder[]>>({});
  const [callsMap, setCallsMap] = useState<Record<string, CallLog[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { loadDisputes(); }, []);

  const loadDisputes = async () => {
    setLoading(true);
    const { data: inv } = await supabase
      .from("invoices")
      .select("*, clients(*)")
      .eq("status", "disputed")
      .order("created_at", { ascending: false });

    if (inv && inv.length > 0) {
      setInvoices(inv as unknown as DisputedInvoice[]);
      const ids = inv.map(i => i.id);

      const [{ data: rems }, { data: calls }] = await Promise.all([
        supabase.from("reminders").select("*").in("invoice_id", ids).order("created_at", { ascending: false }),
        supabase.from("call_logs" as any).select("*").in("invoice_id", ids).order("created_at", { ascending: false }),
      ]);

      if (rems) {
        const grouped: Record<string, Reminder[]> = {};
        for (const r of rems) {
          if (!grouped[r.invoice_id]) grouped[r.invoice_id] = [];
          grouped[r.invoice_id].push(r as Reminder);
        }
        setRemindersMap(grouped);
      }

      if (calls) {
        const grouped: Record<string, CallLog[]> = {};
        for (const c of calls as any[]) {
          if (!grouped[c.invoice_id]) grouped[c.invoice_id] = [];
          grouped[c.invoice_id].push(c);
        }
        setCallsMap(grouped);
      }
    } else {
      setInvoices([]);
    }

    setLoading(false);
  };

  const handleAction = async (invoiceId: string, action: DisputeAction) => {
    setProcessing(invoiceId);
    try {
      if (action === "resolve") {
        const { error } = await supabase
          .from("invoices")
          .update({ status: "recovered" })
          .eq("id", invoiceId);
        if (error) throw error;
        toast.success("Litige résolu — dossier marqué comme réglé !");
      } else if (action === "reactivate") {
        const { error } = await supabase
          .from("invoices")
          .update({ status: "in_progress" })
          .eq("id", invoiceId);
        if (error) throw error;
        toast.success("Relances réactivées pour ce dossier.");
      } else if (action === "note" && actionNote.trim()) {
        // Create a reminder as an internal note
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Non connecté");

        const { error } = await supabase.from("reminders").insert({
          user_id: user.id,
          invoice_id: invoiceId,
          channel: "email",
          message_content: `[NOTE INTERNE] ${actionNote.trim()}`,
          status: "sent",
          sent_at: new Date().toISOString(),
        });
        if (error) throw error;
        toast.success("Note ajoutée au dossier.");
        setActionNote("");
      }
      loadDisputes();
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setProcessing(null);
    }
  };

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" });
  const formatDateTime = (d: string) =>
    new Date(d).toLocaleDateString("fr-CA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  // Build unified timeline for each invoice
  const buildTimeline = (invoiceId: string) => {
    const reminders = remindersMap[invoiceId] || [];
    const calls = callsMap[invoiceId] || [];

    const items: { id: string; type: string; icon: any; color: string; text: string; time: string; date: string; detail?: string }[] = [];

    reminders.forEach(r => {
      const isNote = r.message_content.startsWith("[NOTE INTERNE]");
      items.push({
        id: r.id,
        type: isNote ? "note" : r.channel,
        icon: isNote ? FileText : r.channel === "sms" ? MessageSquare : Mail,
        color: isNote ? "text-accent" : r.channel === "sms" ? "text-accent" : "text-primary",
        text: isNote
          ? r.message_content.replace("[NOTE INTERNE] ", "")
          : `${r.channel === "sms" ? "SMS" : "Courriel"} — ${r.status === "sent" ? "Envoyé" : r.status === "delivered" ? "Livré" : r.status === "replied" ? "Répondu" : r.status}`,
        time: formatDateTime(r.sent_at || r.created_at),
        date: r.sent_at || r.created_at,
        detail: isNote ? undefined : r.message_content,
      });

      if (r.response) {
        items.push({
          id: `${r.id}-resp`,
          type: "response",
          icon: MessageSquare,
          color: "text-destructive",
          text: `Réponse du client : ${r.response}`,
          time: formatDateTime(r.sent_at || r.created_at),
          date: r.sent_at || r.created_at,
        });
      }
    });

    calls.forEach(c => {
      const sentimentEmoji = c.client_sentiment === "negative" ? "😤" : c.client_sentiment === "positive" ? "😊" : "😐";
      items.push({
        id: c.id,
        type: "call",
        icon: Phone,
        color: c.client_sentiment === "negative" ? "text-destructive" : "text-accent",
        text: `Appel ${c.duration_seconds ? `(${Math.floor(c.duration_seconds / 60)}m${(c.duration_seconds % 60).toString().padStart(2, "0")}s)` : ""} ${sentimentEmoji}`,
        time: formatDateTime(c.created_at),
        date: c.created_at,
        detail: c.summary || undefined,
      });
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-accent" />
          Centre de litiges
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Dossiers contestés par les clients — les relances automatiques sont suspendues. C'est ici que l'humain reprend le relais.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 text-center">
          <p className="font-display text-xl font-bold text-accent">{invoices.length}</p>
          <p className="text-[10px] text-muted-foreground">Litiges actifs</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="font-display text-xl font-bold">
            {formatMoney(invoices.reduce((s, i) => s + i.amount, 0))}
          </p>
          <p className="text-[10px] text-muted-foreground">Montant en jeu</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="font-display text-xl font-bold">
            {invoices.filter(i => {
              const calls = callsMap[i.id] || [];
              return calls.some(c => c.client_sentiment === "negative");
            }).length}
          </p>
          <p className="text-[10px] text-muted-foreground">Sentiments négatifs</p>
        </div>
      </div>

      {/* Empty state */}
      {invoices.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground font-medium">Aucun litige en cours 🎉</p>
          <p className="text-xs text-muted-foreground mt-1">Tous les dossiers sont en règle.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv, i) => {
            const isExpanded = expandedId === inv.id;
            const timeline = buildTimeline(inv.id);
            const hasNegative = (callsMap[inv.id] || []).some(c => c.client_sentiment === "negative");
            const daysSinceDispute = Math.floor((Date.now() - new Date(inv.created_at).getTime()) / 86400000);

            return (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                  className="w-full text-left p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {hasNegative ? (
                        <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                      ) : (
                        <Pause className="w-4 h-4 text-accent flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{inv.clients.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {inv.invoice_number ? `#${inv.invoice_number} · ` : ""}{formatDate(inv.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-lg">{formatMoney(inv.amount)}</p>
                      <div className="flex items-center gap-1.5 justify-end mt-0.5">
                        <Badge variant="outline" className="text-[10px] border-accent/30 text-accent">
                          Contesté
                        </Badge>
                        {daysSinceDispute > 7 && (
                          <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">
                            {daysSinceDispute}j
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      Relances suspendues
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border px-4 py-4 space-y-4">
                        {/* Client info */}
                        <div className="bg-secondary rounded-lg p-3 text-xs space-y-1">
                          <p><span className="font-medium text-foreground">Client :</span> {inv.clients.name}</p>
                          {inv.clients.email && <p><span className="font-medium text-foreground">Courriel :</span> {inv.clients.email}</p>}
                          {inv.clients.phone && <p><span className="font-medium text-foreground">Tél :</span> {inv.clients.phone}</p>}
                          {inv.due_date && <p><span className="font-medium text-foreground">Échéance :</span> {formatDate(inv.due_date)}</p>}
                        </div>

                        {/* Timeline */}
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                            Historique des échanges
                          </h4>
                          {timeline.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-4">Aucun échange enregistré.</p>
                          ) : (
                            <div className="space-y-1 relative">
                              <div className="absolute left-[13px] top-3 bottom-3 w-px bg-border" />
                              {timeline.map(item => {
                                const Icon = item.icon;
                                return (
                                  <div key={item.id} className="flex items-start gap-2.5 py-1.5 relative">
                                    <div className={cn(
                                      "w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 z-10",
                                      item.type === "note" ? "bg-accent/10" :
                                      item.type === "response" ? "bg-destructive/10" :
                                      item.type === "call" ? "bg-accent/10" : "bg-primary/10"
                                    )}>
                                      <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-foreground">{item.text}</p>
                                      <p className="text-[10px] text-muted-foreground">{item.time}</p>
                                      {item.detail && (
                                        <p className="text-[11px] text-muted-foreground mt-1 bg-secondary rounded-lg p-2 leading-relaxed whitespace-pre-wrap">
                                          {item.detail}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="space-y-3 pt-2">
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Actions manuelles
                          </h4>

                          {/* Add note */}
                          <div className="flex gap-2">
                            <Textarea
                              value={actionNote}
                              onChange={e => setActionNote(e.target.value)}
                              placeholder="Ajouter une note au dossier (ex: Client rappelé, entente de paiement convenue)…"
                              className="bg-secondary min-h-[60px] text-sm flex-1"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!actionNote.trim() || processing === inv.id}
                              onClick={() => handleAction(inv.id, "note")}
                              className="text-xs"
                            >
                              <Send className="w-3.5 h-3.5 mr-1" />
                              Ajouter la note
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAction(inv.id, "resolve")}
                              disabled={processing === inv.id}
                              className="text-xs bg-primary text-primary-foreground"
                            >
                              {processing === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <UserCheck className="w-3.5 h-3.5 mr-1" />}
                              Résoudre le litige
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(inv.id, "reactivate")}
                              disabled={processing === inv.id}
                              className="text-xs border-accent/30 text-accent hover:bg-accent/10"
                            >
                              <Play className="w-3.5 h-3.5 mr-1" />
                              Réactiver les relances
                            </Button>
                          </div>
                        </div>
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
  );
};

export default DisputeCenter;
