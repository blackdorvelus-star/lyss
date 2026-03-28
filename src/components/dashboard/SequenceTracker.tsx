import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Rocket, RefreshCw, Clock, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CollectionSequence {
  id: string;
  company_id: string;
  invoice_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  amount_due: number;
  due_date: string | null;
  status: string;
  sequence_step: string;
  next_action_at: string | null;
  last_action_at: string | null;
  stopped_reason: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  waiting: { label: "En attente", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
  paid: { label: "Payée", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  escalated: { label: "Escaladée", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertTriangle },
  active: { label: "Active", color: "bg-primary/20 text-primary border-primary/30", icon: Rocket },
};

const stepLabels: Record<string, string> = {
  email_1: "Courriel initial",
  sms: "SMS de suivi",
  email_2: "Courriel final",
  "1_email_initial": "Courriel initial",
  "2_waiting_check_j3": "Vérification J+3",
  "3_sms_sent": "SMS envoyé",
  "4_waiting_check_j7": "Vérification J+7",
  "5_email_final": "Courriel final",
  "6_waiting_escalation": "Pré-escalade",
  "7_escalated": "Escaladée",
  "8_paid": "Payée",
};

const SequenceTracker = () => {
  const [sequences, setSequences] = useState<CollectionSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  const fetchSequences = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("collection_sequences" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sequences:", error);
      toast.error("Erreur lors du chargement des séquences");
    } else {
      setSequences((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSequences(); }, []);

  const triggerSequence = async (seq: CollectionSequence) => {
    setTriggeringId(seq.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: settings } = await supabase
        .from("payment_settings")
        .select("company_name")
        .eq("user_id", user.id)
        .single();

      const { data, error } = await supabase.functions.invoke("relevance-ai-trigger", {
        body: {
          invoiceId: seq.invoice_id,
          companyId: seq.company_id || settings?.company_name || "Mon entreprise",
          customerName: seq.customer_name,
          customerEmail: seq.customer_email,
          amountDue: seq.amount_due,
        },
      });

      if (error) throw error;
      toast.success(`Relance lancée pour ${seq.customer_name}`);
      fetchSequences();
    } catch (err: any) {
      console.error("Trigger error:", err);
      toast.error(err.message || "Erreur lors du déclenchement");
    } finally {
      setTriggeringId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Séquences de recouvrement</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Suivi en temps réel des relances automatisées par Lyss
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSequences}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "En attente", count: sequences.filter(s => s.status === "waiting" || s.status === "active").length, color: "text-amber-400" },
          { label: "Payées", count: sequences.filter(s => s.status === "paid").length, color: "text-emerald-400" },
          { label: "Escaladées", count: sequences.filter(s => s.status === "escalated").length, color: "text-red-400" },
          { label: "Total", count: sequences.length, color: "text-foreground" },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold font-display ${s.color}`}>{s.count}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {sequences.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <Rocket className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Aucune séquence de recouvrement active.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Les séquences sont créées automatiquement lorsqu'une facture est confiée à Lyss.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-xs">Client</TableHead>
                <TableHead className="text-xs">Montant</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Étape</TableHead>
                <TableHead className="text-xs">Statut</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Prochaine action</TableHead>
                <TableHead className="text-xs text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sequences.map((seq) => {
                const cfg = statusConfig[seq.status] || statusConfig.waiting;
                const Icon = cfg.icon;
                return (
                  <TableRow key={seq.id} className="border-border/30">
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{seq.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{seq.customer_email || "—"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-semibold">
                      {Number(seq.amount_due).toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {stepLabels[seq.sequence_step] || seq.sequence_step}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${cfg.color} border text-[10px] gap-1`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {seq.next_action_at
                        ? format(new Date(seq.next_action_at), "d MMM yyyy HH:mm", { locale: fr })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={seq.status === "paid" || seq.status === "escalated" ? "outline" : "default"}
                        disabled={seq.status === "paid" || triggeringId === seq.id}
                        onClick={() => triggerSequence(seq)}
                        className="text-xs h-8"
                      >
                        {triggeringId === seq.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Rocket className="w-3.5 h-3.5 mr-1" />
                            Relancer
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default SequenceTracker;
