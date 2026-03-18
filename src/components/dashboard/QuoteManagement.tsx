import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSignature, Plus, Pencil, Trash2, Loader2, Search, X, Save,
  CheckCircle2, Clock, XCircle, Send, CalendarClock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase-safe";
import { toast } from "sonner";
import LyssAvatar from "@/components/LyssAvatar";

interface Quote {
  id: string;
  client_id: string;
  quote_number: string | null;
  amount: number;
  description: string | null;
  status: string;
  sent_at: string | null;
  expires_at: string | null;
  created_at: string;
  clients: { name: string; email: string | null; phone: string | null };
}

interface Client {
  id: string;
  name: string;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  draft: { label: "Brouillon", icon: FileSignature, color: "text-muted-foreground", bg: "bg-muted" },
  sent: { label: "Envoyée", icon: Send, color: "text-accent", bg: "bg-accent/10" },
  accepted: { label: "Acceptée", icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10" },
  declined: { label: "Refusée", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  expired: { label: "Expirée", icon: CalendarClock, color: "text-muted-foreground", bg: "bg-muted" },
};

const formatMoney = (n: number) =>
  new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" });

const QuoteManagement = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ quote_number: "", amount: "", description: "", status: "", expires_at: "" });
  const [newQuote, setNewQuote] = useState({
    client_id: "", quote_number: "", amount: "", description: "", expires_at: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [quotesRes, clientsRes] = await Promise.all([
      supabase
        .from("quotes" as any)
        .select("*, clients(name, email, phone)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("clients")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name"),
    ]);

    setQuotes((quotesRes.data as any) || []);
    setClients(clientsRes.data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newQuote.client_id || !newQuote.amount) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("quotes" as any).insert({
      user_id: user.id,
      client_id: newQuote.client_id,
      quote_number: newQuote.quote_number.trim() || null,
      amount: parseFloat(newQuote.amount),
      description: newQuote.description.trim() || null,
      status: "sent",
      expires_at: newQuote.expires_at || null,
    } as any);

    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success("Soumission ajoutée !");
      setNewQuote({ client_id: "", quote_number: "", amount: "", description: "", expires_at: "" });
      setShowAdd(false);
      loadData();
    }
    setSaving(false);
  };

  const handleUpdate = async (quoteId: string) => {
    setSaving(true);
    const updates: Record<string, any> = {};
    if (editForm.quote_number !== undefined) updates.quote_number = editForm.quote_number.trim() || null;
    if (editForm.amount) updates.amount = parseFloat(editForm.amount);
    if (editForm.description !== undefined) updates.description = editForm.description.trim() || null;
    if (editForm.status) updates.status = editForm.status;
    if (editForm.expires_at !== undefined) updates.expires_at = editForm.expires_at || null;

    const { error } = await supabase.from("quotes" as any).update(updates).eq("id", quoteId);
    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success("Soumission mise à jour !");
      setEditingId(null);
      loadData();
    }
    setSaving(false);
  };

  const handleDelete = async (quoteId: string, clientName: string) => {
    if (!confirm(`Supprimer la soumission pour ${clientName} ?`)) return;
    const { error } = await supabase.from("quotes" as any).delete().eq("id", quoteId);
    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success("Soumission supprimée.");
      loadData();
    }
  };

  const markStatus = async (quoteId: string, status: string) => {
    const { error } = await supabase.from("quotes" as any).update({ status }).eq("id", quoteId);
    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success(status === "accepted" ? "Soumission acceptée ! 🎉" : "Statut mis à jour.");
      loadData();
    }
  };

  const filtered = quotes.filter(
    (q) =>
      q.clients?.name?.toLowerCase().includes(search.toLowerCase()) ||
      q.quote_number?.toLowerCase().includes(search.toLowerCase()) ||
      q.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const totalSent = quotes.filter((q) => q.status === "sent").length;
  const totalAccepted = quotes.filter((q) => q.status === "accepted").length;
  const totalDeclined = quotes.filter((q) => q.status === "declined").length;
  const totalValue = quotes.filter((q) => q.status === "sent").reduce((s, q) => s + q.amount, 0);
  const conversionRate = quotes.length > 0 ? Math.round((totalAccepted / quotes.length) * 100) : 0;

  // Check expired quotes
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    quotes.forEach(async (q) => {
      if (q.status === "sent" && q.expires_at && q.expires_at < today) {
        await supabase.from("quotes" as any).update({ status: "expired" }).eq("id", q.id);
      }
    });
  }, [quotes]);

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-primary" />
            Soumissions
          </h2>
          <p className="text-xs text-muted-foreground">
            {quotes.length} soumission{quotes.length !== 1 ? "s" : ""} · Taux de conversion : {conversionRate}%
          </p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} size="sm" variant={showAdd ? "outline" : "default"}>
          {showAdd ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
          {showAdd ? "Annuler" : "Nouvelle"}
        </Button>
      </div>

      {/* Stats chips */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-accent/10 text-accent ring-1 ring-accent/20">
          {totalSent} en attente · {formatMoney(totalValue)}
        </span>
        <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
          {totalAccepted} acceptée{totalAccepted !== 1 ? "s" : ""}
        </span>
        <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/20">
          {totalDeclined} refusée{totalDeclined !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Lyss hint */}
      {totalSent > 0 && (
        <div className="flex items-start gap-2 bg-primary/5 border border-primary/15 rounded-xl p-3">
          <LyssAvatar size="xs" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Lyss</span> — {totalSent} soumission{totalSent > 1 ? "s" : ""} en attente de réponse. 
            Je peux relancer automatiquement les clients qui n'ont pas encore répondu.
          </p>
        </div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <select
                value={newQuote.client_id}
                onChange={(e) => setNewQuote({ ...newQuote, client_id: e.target.value })}
                className="w-full bg-secondary text-sm rounded-md border border-border px-3 py-2"
              >
                <option value="">Sélectionner un client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="No. soumission (ex: S-2026-01)"
                  value={newQuote.quote_number}
                  onChange={(e) => setNewQuote({ ...newQuote, quote_number: e.target.value })}
                  className="bg-secondary"
                />
                <Input
                  type="number"
                  placeholder="Montant ($)"
                  value={newQuote.amount}
                  onChange={(e) => setNewQuote({ ...newQuote, amount: e.target.value })}
                  className="bg-secondary"
                />
              </div>
              <Input
                type="date"
                placeholder="Date d'expiration"
                value={newQuote.expires_at}
                onChange={(e) => setNewQuote({ ...newQuote, expires_at: e.target.value })}
                className="bg-secondary"
              />
              <Textarea
                placeholder="Description des travaux / notes…"
                value={newQuote.description}
                onChange={(e) => setNewQuote({ ...newQuote, description: e.target.value })}
                className="bg-secondary min-h-[60px]"
              />
              <Button onClick={handleAdd} disabled={!newQuote.client_id || !newQuote.amount || saving} className="w-full" size="sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                Ajouter la soumission
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une soumission…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card"
        />
      </div>

      {/* Quote list */}
      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <FileSignature className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">
            {search ? "Aucune soumission trouvée." : "Aucune soumission encore. Crée ta première !"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((quote) => {
            const cfg = statusConfig[quote.status] || statusConfig.sent;
            const StatusIcon = cfg.icon;
            const isExpired = quote.expires_at && new Date(quote.expires_at) < new Date() && quote.status === "sent";

            return (
              <motion.div
                key={quote.id}
                layout
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div className="flex items-center gap-3 p-4">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">{quote.clients?.name?.[0]?.toUpperCase()}</span>
                  </div>

                  {editingId === quote.id ? (
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input value={editForm.quote_number} onChange={(e) => setEditForm({ ...editForm, quote_number: e.target.value })} placeholder="No." className="bg-secondary h-8 text-sm" />
                        <Input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} placeholder="Montant" className="bg-secondary h-8 text-sm" />
                      </div>
                      <Input type="date" value={editForm.expires_at} onChange={(e) => setEditForm({ ...editForm, expires_at: e.target.value })} className="bg-secondary h-8 text-sm" />
                      <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="bg-secondary text-sm min-h-[40px]" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdate(quote.id)} disabled={saving} className="h-7 text-xs">
                          <Save className="w-3 h-3 mr-1" /> Sauvegarder
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-7 text-xs">Annuler</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{quote.clients?.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {quote.quote_number && <span>#{quote.quote_number}</span>}
                          <span className="font-semibold text-foreground">{formatMoney(quote.amount)}</span>
                        </div>
                        {quote.description && (
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{quote.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                          {quote.expires_at && (
                            <span className={`text-[10px] ${isExpired ? "text-destructive" : "text-muted-foreground"}`}>
                              {isExpired ? "Expirée" : `Expire le ${formatDate(quote.expires_at)}`}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {quote.status === "sent" && (
                          <>
                            <button
                              onClick={() => markStatus(quote.id, "accepted")}
                              className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                              title="Marquer acceptée"
                            >
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                            </button>
                            <button
                              onClick={() => markStatus(quote.id, "declined")}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                              title="Marquer refusée"
                            >
                              <XCircle className="w-4 h-4 text-destructive" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setEditingId(quote.id);
                            setEditForm({
                              quote_number: quote.quote_number || "",
                              amount: String(quote.amount),
                              description: quote.description || "",
                              status: quote.status,
                              expires_at: quote.expires_at || "",
                            });
                          }}
                          className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(quote.id, quote.clients?.name || "")}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuoteManagement;
