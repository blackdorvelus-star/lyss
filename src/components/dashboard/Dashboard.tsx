import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Clock, CheckCircle2, XCircle, MessageSquare, ChevronDown, ChevronUp,
  Loader2, Banknote, Sparkles, Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import NotificationBell from "@/components/notifications/NotificationBell";
import AppSidebar, { type Section } from "./AppSidebar";
import PerformanceCards from "./PerformanceCards";
import LiveActivityFeed, { type FeedItem } from "./LiveActivityFeed";
import IntegrationStatus from "./IntegrationStatus";
import ActiveDossierIndicator from "./ActiveDossierIndicator";
import SettingsWizard from "./SettingsWizard";
import FinancialHealth from "./FinancialHealth";
import PersonalitySelector, { type Personality } from "./PersonalitySelector";
import VapiCallButton from "./VapiCallButton";
import CallHistory, { type CallLog } from "./CallHistory";
import ClientManagement from "./ClientManagement";
import DisputeCenter from "./DisputeCenter";

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
  clients: { name: string; email: string | null; phone: string | null };
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
  in_progress: { label: "Suivi en cours", icon: MessageSquare, color: "text-primary" },
  recovered: { label: "Réglé", icon: CheckCircle2, color: "text-primary" },
  disputed: { label: "Contesté", icon: XCircle, color: "text-accent" },
  failed: { label: "Non résolu", icon: XCircle, color: "text-destructive" },
  cancelled: { label: "Annulé", icon: XCircle, color: "text-muted-foreground" },
};

const Dashboard = ({ onBack, onNewInvoice, onLogout }: DashboardProps) => {
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([]);
  const [reminders, setReminders] = useState<Record<string, Reminder[]>>({});
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [vapiPublicKey, setVapiPublicKey] = useState<string | null>(null);
  const [vapiConfig, setVapiConfig] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryId, setRecoveryId] = useState<string | null>(null);
  const [recoveryAmount, setRecoveryAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("billing");
  const [personality, setPersonality] = useState<Personality>("chaleureuse");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: inv } = await supabase
      .from("invoices")
      .select("*, clients(*)")
      .order("created_at", { ascending: false });

    if (inv) {
      setInvoices(inv as unknown as InvoiceWithClient[]);
      const ids = inv.map((i) => i.id);
      if (ids.length > 0) {
        const { data: rems } = await supabase
          .from("reminders")
          .select("*")
          .in("invoice_id", ids)
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

    const { data: calls } = await supabase
      .from("call_logs" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (calls) setCallLogs(calls as any as CallLog[]);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: settings } = await supabase
        .from("payment_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      let publicKey = (settings as any)?.vapi_public_key || null;
      if (!publicKey) {
        try {
          const { data: keyData } = await supabase.functions.invoke("get-vapi-key");
          if (keyData?.key) publicKey = keyData.key;
        } catch (e) {
          console.log("Could not fetch default Vapi key");
        }
      }

      setVapiPublicKey(publicKey);
      if (settings) {
        const s = settings as any;
        setVapiConfig({
          voiceId: s.vapi_voice_id,
          voiceProvider: s.vapi_voice_provider,
          personality: s.vapi_personality,
          customInstructions: s.vapi_custom_instructions,
          firstMessageTemplate: s.vapi_first_message_template,
          assistantName: s.assistant_name,
          assistantRole: s.assistant_role,
          companyName: s.company_name,
        });
      }
    }

    setLoading(false);
  };

  const markRecovered = async (invoiceId: string, amount: number, maxAmount: number) => {
    if (amount <= 0 || amount > maxAmount) {
      toast.error(`Le montant doit être entre 1 $ et ${maxAmount} $.`);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("invoices")
      .update({ amount_recovered: amount, status: amount >= maxAmount ? "recovered" : "in_progress" })
      .eq("id", invoiceId);
    if (error) {
      toast.error("Erreur lors de la mise à jour.");
    } else {
      toast.success(
        amount >= maxAmount
          ? `${formatMoney(amount)} réglé ! Dossier complété 🎉`
          : `${formatMoney(amount)} reçu sur ${formatMoney(maxAmount)}.`
      );
      setRecoveryId(null);
      setRecoveryAmount("");
      fetchData();
    }
    setSaving(false);
  };

  const totalRecovered = invoices.reduce((s, i) => s + (i.amount_recovered || 0), 0);
  const settledCount = invoices.filter((i) => i.status === "recovered").length;
  const inProgressCount = invoices.filter((i) => i.status === "in_progress").length;
  const pendingCount = invoices.filter((i) => i.status === "pending").length;

  // Performance metrics
  const hoursSaved = (invoices.length * 30) / 60;
  const successRate = invoices.length > 0 ? Math.round((settledCount / invoices.length) * 100) : 0;
  const paymentPromises = callLogs.filter(c => c.call_result === "payment_promised")
    .reduce((sum, c) => {
      const inv = invoices.find(i => i.id === c.invoice_id);
      return sum + (inv?.amount || 0);
    }, 0);
  const predictedIncome = invoices
    .filter(i => i.status === "in_progress" || i.status === "pending")
    .reduce((sum, i) => sum + i.amount - (i.amount_recovered || 0), 0) * 0.6;

  // Build live activity feed
  const feedItems: FeedItem[] = useMemo(() => {
    const allRems = Object.entries(reminders).flatMap(([invoiceId, rems]) =>
      rems.map((r) => {
        const inv = invoices.find((i) => i.id === invoiceId);
        const clientName = inv?.clients?.name || "Client";
        const channelLabel = r.channel === "sms" ? "SMS" : r.channel === "phone" ? "Appel" : "Courriel";
        const statusLabel =
          r.status === "sent" || r.status === "delivered" ? "envoyé" :
          r.status === "scheduled" ? "planifié" :
          r.status === "replied" ? "— réponse reçue" : "";
        return {
          id: r.id,
          icon: (r.channel === "sms" ? "sms" : r.channel === "phone" ? "phone" : "email") as FeedItem["icon"],
          text: `${channelLabel} de suivi ${statusLabel} à ${clientName}`,
          time: r.sent_at
            ? new Date(r.sent_at).toLocaleDateString("fr-CA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
            : "Planifié",
          date: r.sent_at || r.created_at,
          isNew: r.sent_at ? (Date.now() - new Date(r.sent_at).getTime()) < 3600000 : false,
        };
      })
    );

    const paymentEvents = invoices
      .filter((i) => i.status === "recovered" && i.amount_recovered)
      .map((i) => ({
        id: `pay-${i.id}`,
        icon: "payment" as FeedItem["icon"],
        text: `Paiement de ${formatMoney(i.amount_recovered!)} confirmé — ${i.clients.name}`,
        time: new Date(i.created_at).toLocaleDateString("fr-CA", { day: "numeric", month: "short" }),
        date: i.created_at,
        isNew: false,
      }));

    const callEvents = callLogs.slice(0, 5).map((c) => {
      const inv = invoices.find(i => i.id === c.invoice_id);
      const clientName = inv?.clients?.name || "Client";
      const resultText = c.call_result === "payment_promised" ? "Paiement promis ✓" :
        c.call_result === "callback_requested" ? "Rappel demandé" :
        c.call_result === "no_answer" ? "Sans réponse" :
        c.call_result === "refused" ? "Refusé" : "Appel terminé";
      return {
        id: `call-${c.id}`,
        icon: "phone" as FeedItem["icon"],
        text: `Appel à ${clientName} — ${resultText}`,
        time: new Date(c.created_at).toLocaleDateString("fr-CA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
        date: c.created_at,
        isNew: (Date.now() - new Date(c.created_at).getTime()) < 3600000,
      };
    });

    // Alert events for negative sentiment
    const alertEvents = callLogs
      .filter(c => c.client_sentiment === "negative")
      .slice(0, 3)
      .map(c => {
        const inv = invoices.find(i => i.id === c.invoice_id);
        return {
          id: `alert-${c.id}`,
          icon: "alert" as FeedItem["icon"],
          text: `⚠️ ${inv?.clients?.name || "Client"} a répondu négativement — intervention suggérée`,
          time: new Date(c.created_at).toLocaleDateString("fr-CA", { day: "numeric", month: "short" }),
          date: c.created_at,
          isNew: true,
        };
      });

    return [...allRems, ...paymentEvents, ...callEvents, ...alertEvents]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 15);
  }, [reminders, invoices, callLogs]);

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-CA", { day: "numeric", month: "short" });

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} onLogout={onLogout} />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h1 className="font-display font-bold text-sm sm:text-base truncate">
                {activeSection === "clients" && "Relations clients"}
                {activeSection === "billing" && "Centre de commandement"}
                {activeSection === "disputes" && "Centre de litiges"}
                {activeSection === "calendar" && "Gestion d'agenda"}
                {activeSection === "settings" && "Réglages"}
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:block">
                <IntegrationStatus />
              </div>
              <NotificationBell />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 pb-20 md:pb-6">
          {activeSection === "billing" ? (
            <div className="max-w-6xl space-y-4 sm:space-y-6">
              {/* Performance KPI Cards */}
              <PerformanceCards
                hoursSaved={hoursSaved}
                successRate={successRate}
                paymentPromises={paymentPromises}
                predictedIncome={predictedIncome}
              />

              {/* Active dossier indicator */}
              <ActiveDossierIndicator activeDossiers={inProgressCount} />

              {/* Main content: Left (Health + Dossiers) | Right (Live Feed) */}
              <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                  <FinancialHealth invoices={invoices} />

                  {/* Call History */}
                  <CallHistory
                    calls={callLogs}
                    getClientName={(invoiceId) => {
                      const inv = invoices.find((i) => i.id === invoiceId);
                      return inv?.clients?.name || "Client";
                    }}
                  />

                  {/* Personality selector */}
                  <PersonalitySelector value={personality} onChange={setPersonality} />

                  {/* Dossiers clients */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="font-display text-base sm:text-lg font-bold">Dossiers clients</h2>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {inProgressCount} suivi{inProgressCount !== 1 ? "s" : ""} actif{inProgressCount !== 1 ? "s" : ""} · {pendingCount} en attente
                      </p>
                    </div>
                    <Button size="sm" onClick={onNewInvoice} className="bg-primary text-primary-foreground font-display text-xs sm:text-sm flex-shrink-0">
                      <Plus className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Confier un dossier</span>
                    </Button>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : invoices.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                      <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                      <p className="text-muted-foreground mb-4">Aucun dossier confié à l'adjointe.</p>
                      <Button onClick={onNewInvoice} className="bg-primary text-primary-foreground font-display">
                        <Plus className="w-4 h-4 mr-1" />
                        Confier un premier dossier
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
                            transition={{ delay: i * 0.04 }}
                          >
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                              className="w-full text-left bg-card border border-border rounded-xl p-3 sm:p-4 hover:border-primary/20 transition-colors"
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
                                      {invReminders.length} suivi{invReminders.length > 1 ? "s" : ""}
                                    </span>
                                  )}
                                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                </div>
                              </div>
                              {(inv.amount_recovered || 0) > 0 && (
                                <div className="mt-2 bg-primary/10 rounded-lg px-3 py-1.5">
                                  <p className="text-xs text-primary font-medium">
                                    Reçu : {formatMoney(inv.amount_recovered || 0)} / {formatMoney(inv.amount)}
                                  </p>
                                  <div className="mt-1 h-1.5 bg-primary/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, ((inv.amount_recovered || 0) / inv.amount) * 100)}%` }} />
                                  </div>
                                </div>
                              )}
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                  <div className="pt-2 pb-1 space-y-2">
                                    <div className="bg-secondary rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                                      <p><span className="font-medium text-foreground">Client :</span> {inv.clients.name}</p>
                                      {inv.clients.email && <p><span className="font-medium text-foreground">Courriel :</span> {inv.clients.email}</p>}
                                      {inv.clients.phone && <p><span className="font-medium text-foreground">Tél :</span> {inv.clients.phone}</p>}
                                      {inv.due_date && <p><span className="font-medium text-foreground">Échéance :</span> {formatDate(inv.due_date)}</p>}
                                    </div>

                                    {inv.status !== "recovered" && inv.clients.phone && (
                                      <div className="pt-1">
                                        <VapiCallButton
                                          invoiceId={inv.id}
                                          clientName={inv.clients.name}
                                          clientPhone={inv.clients.phone}
                                          amount={inv.amount}
                                          invoiceNumber={inv.invoice_number}
                                          vapiPublicKey={vapiPublicKey}
                                          vapiConfig={vapiConfig}
                                          onCallEnd={fetchData}
                                        />
                                      </div>
                                    )}

                                    {inv.status !== "recovered" && (
                                      <div className="bg-primary/5 border border-primary/15 rounded-lg p-3">
                                        {recoveryId === inv.id ? (
                                          <div className="space-y-2">
                                            <p className="text-xs font-medium text-foreground">Montant reçu ($)</p>
                                            <div className="flex gap-2">
                                              <Input type="number" placeholder={`Max ${inv.amount}`} value={recoveryAmount} onChange={(e) => setRecoveryAmount(e.target.value)} className="bg-card h-9 text-sm" max={inv.amount} min={1} autoFocus />
                                              <Button size="sm" disabled={saving || !recoveryAmount} onClick={(e) => { e.stopPropagation(); markRecovered(inv.id, parseFloat(recoveryAmount), inv.amount); }} className="bg-primary text-primary-foreground h-9 px-4 font-display whitespace-nowrap">
                                                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirmer"}
                                              </Button>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); setRecoveryId(null); setRecoveryAmount(""); }} className="text-xs text-muted-foreground hover:text-foreground">Annuler</button>
                                          </div>
                                        ) : (
                                          <button onClick={(e) => { e.stopPropagation(); setRecoveryId(inv.id); setRecoveryAmount(String(inv.amount)); }} className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors w-full">
                                            <Banknote className="w-4 h-4" />
                                            Marquer comme réglé
                                          </button>
                                        )}
                                      </div>
                                    )}

                                    {invReminders.length === 0 ? (
                                      <p className="text-xs text-muted-foreground text-center py-3">L'adjointe n'a pas encore envoyé de message pour ce dossier.</p>
                                    ) : (
                                      invReminders.map((rem) => (
                                        <div key={rem.id} className="bg-secondary rounded-lg p-3">
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rem.channel === "sms" ? "bg-accent/20 text-accent" : "bg-primary/15 text-primary"}`}>
                                              {rem.channel === "sms" ? "SMS" : "Courriel"}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{rem.sent_at ? formatDate(rem.sent_at) : "Planifié"}</span>
                                            <span className={`text-xs ml-auto ${rem.status === "sent" || rem.status === "delivered" ? "text-primary" : rem.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>
                                              {rem.status === "scheduled" && "⏳ Planifié"}
                                              {rem.status === "sent" && "✓ Envoyé"}
                                              {rem.status === "delivered" && "✓✓ Livré"}
                                              {rem.status === "replied" && "💬 Répondu"}
                                              {rem.status === "failed" && "✕ Échoué"}
                                            </span>
                                          </div>
                                          <p className="text-xs text-secondary-foreground leading-relaxed whitespace-pre-wrap">{rem.message_content}</p>
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

                {/* Right column: Live Activity Feed */}
                <div className="lg:col-span-1">
                  <div className="sticky top-20">
                    <LiveActivityFeed items={feedItems} />
                  </div>
                </div>
              </div>
            </div>
          ) : activeSection === "clients" ? (
            <ClientManagement />
          ) : activeSection === "disputes" ? (
            <DisputeCenter />
          ) : activeSection === "settings" ? (
            <SettingsWizard />
          ) : (
            <PlaceholderSection title="Gestion d'agenda" desc="La prise de rendez-vous et les confirmations automatiques arrivent bientôt." />
          )}
        </main>
      </div>
    </div>
  );
};

const PlaceholderSection = ({ title, desc }: { title: string; desc: string }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-24 text-center">
    <Sparkles className="w-12 h-12 text-muted-foreground mb-4 opacity-40" />
    <h2 className="font-display text-xl font-bold mb-2">{title}</h2>
    <p className="text-sm text-muted-foreground max-w-sm">{desc}</p>
    <span className="mt-4 text-xs text-primary font-medium px-3 py-1 rounded-full border border-primary/30 bg-primary/10">Bientôt disponible</span>
  </motion.div>
);

export default Dashboard;
