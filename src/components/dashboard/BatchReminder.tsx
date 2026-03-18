import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, CheckSquare, Square, Zap, MessageSquare, Mail, Phone,
  AlertTriangle, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LyssAvatar from "@/components/LyssAvatar";

interface BatchInvoice {
  id: string;
  amount: number;
  invoice_number: string | null;
  status: string;
  due_date: string | null;
  clients: { name: string; email: string | null; phone: string | null };
}

const formatMoney = (n: number) =>
  new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

const BatchReminder = () => {
  const [invoices, setInvoices] = useState<BatchInvoice[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [channel, setChannel] = useState<"sms" | "email">("sms");
  const [results, setResults] = useState<{ id: string; success: boolean; error?: string }[]>([]);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    const { data } = await supabase
      .from("invoices")
      .select("id, amount, invoice_number, status, due_date, clients(name, email, phone)")
      .in("status", ["pending", "in_progress"])
      .order("due_date", { ascending: true });

    setInvoices((data as unknown as BatchInvoice[]) || []);
    setLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === eligible.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(eligible.map((i) => i.id)));
    }
  };

  // Filter eligible based on channel
  const eligible = invoices.filter((i) =>
    channel === "sms" ? i.clients?.phone : i.clients?.email
  );

  const handleBatchSend = async () => {
    if (selected.size === 0) return;
    setSending(true);
    setResults([]);
    const batchResults: { id: string; success: boolean; error?: string }[] = [];

    for (const invoiceId of selected) {
      try {
        const { data, error } = await supabase.functions.invoke("generate-reminder", {
          body: { invoice_id: invoiceId, channel },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        batchResults.push({ id: invoiceId, success: true });
      } catch (e: any) {
        batchResults.push({ id: invoiceId, success: false, error: e.message });
      }
    }

    setResults(batchResults);
    const successes = batchResults.filter((r) => r.success).length;
    const failures = batchResults.filter((r) => !r.success).length;

    if (successes > 0) {
      toast.success(`${successes} relance${successes > 1 ? "s" : ""} générée${successes > 1 ? "s" : ""} avec succès !`);
    }
    if (failures > 0) {
      toast.error(`${failures} relance${failures > 1 ? "s" : ""} en échec.`);
    }

    setSending(false);
    setSelected(new Set());
    loadInvoices();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Relance en lot
        </h2>
        <p className="text-xs text-muted-foreground">
          Sélectionne les dossiers à relancer et Lyss génère un message personnalisé pour chacun.
        </p>
      </div>

      {/* Lyss hint */}
      <div className="flex items-start gap-2 bg-primary/5 border border-primary/15 rounded-xl p-3">
        <LyssAvatar size="xs" />
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Lyss</span> — Chaque message sera personnalisé automatiquement 
          selon le client, le montant et l'historique de communication. Aucun doublon ne sera envoyé.
        </p>
      </div>

      {/* Channel selector */}
      <div className="flex gap-2">
        <button
          onClick={() => { setChannel("sms"); setSelected(new Set()); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            channel === "sms" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          SMS
        </button>
        <button
          onClick={() => { setChannel("email"); setSelected(new Set()); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            channel === "email" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mail className="w-4 h-4" />
          Courriel
        </button>
      </div>

      {/* Select all + count */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <button onClick={selectAll} className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
          {selected.size === eligible.length && eligible.length > 0 ? (
            <CheckSquare className="w-4 h-4 text-primary" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          Tout sélectionner ({eligible.length})
        </button>
        {selected.size > 0 && (
          <span className="text-[10px] sm:text-xs font-medium text-primary">
            {selected.size} · {formatMoney(
              invoices.filter((i) => selected.has(i.id)).reduce((s, i) => s + i.amount, 0)
            )}
          </span>
        )}
      </div>

      {/* Invoice list */}
      {eligible.length === 0 ? (
        <div className="text-center py-8">
          <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">
            Aucun dossier éligible pour un {channel === "sms" ? "SMS" : "courriel"}.
            {channel === "sms" ? " Assure-toi que tes clients ont un numéro de téléphone." : " Assure-toi que tes clients ont un courriel."}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {eligible.map((inv) => {
            const isSelected = selected.has(inv.id);
            const result = results.find((r) => r.id === inv.id);
            const isOverdue = inv.due_date && new Date(inv.due_date) < new Date();

            return (
              <motion.button
                key={inv.id}
                layout
                onClick={() => toggleSelect(inv.id)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  isSelected
                    ? "bg-primary/5 border-primary/30"
                    : "bg-card border-border hover:border-primary/20"
                }`}
              >
                {isSelected ? (
                  <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}

                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">{inv.clients?.name?.[0]?.toUpperCase()}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inv.clients?.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {inv.invoice_number && <span>#{inv.invoice_number}</span>}
                    <span className="font-semibold text-foreground">{formatMoney(inv.amount)}</span>
                    {isOverdue && <span className="text-destructive font-medium">En retard</span>}
                  </div>
                </div>

                {result && (
                  result.success ? (
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                  )
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Send button */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="sticky bottom-20 md:bottom-4"
          >
            <Button
              onClick={handleBatchSend}
              disabled={sending}
              className="w-full bg-primary text-primary-foreground font-display h-12 text-sm"
              size="lg"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Génération en cours…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Générer {selected.size} relance{selected.size > 1 ? "s" : ""} {channel === "sms" ? "SMS" : "courriel"}
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BatchReminder;
