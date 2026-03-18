import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Pencil, Trash2, Loader2, Search, Phone, Mail,
  FileText, ChevronDown, ChevronUp, Save, X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
}

interface Invoice {
  id: string;
  amount: number;
  amount_recovered: number | null;
  status: string;
  invoice_number: string | null;
  due_date: string | null;
  created_at: string;
}

const ClientManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });
  const [invoicesMap, setInvoicesMap] = useState<Record<string, Invoice[]>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setClients(data || []);
    setLoading(false);
  };

  const loadInvoices = async (clientId: string) => {
    if (invoicesMap[clientId]) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("invoices")
      .select("id, amount, amount_recovered, status, invoice_number, due_date, created_at")
      .eq("client_id", clientId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setInvoicesMap((prev) => ({ ...prev, [clientId]: data || [] }));
  };

  const toggleExpand = (clientId: string) => {
    if (expandedId === clientId) {
      setExpandedId(null);
    } else {
      setExpandedId(clientId);
      loadInvoices(clientId);
    }
  };

  const handleAdd = async () => {
    if (!newClient.name.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("clients").insert({
      user_id: user.id,
      name: newClient.name.trim(),
      email: newClient.email.trim() || null,
      phone: newClient.phone.trim() || null,
    });

    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success("Client ajouté !");
      setNewClient({ name: "", email: "", phone: "" });
      setShowAdd(false);
      loadClients();
    }
    setSaving(false);
  };

  const handleEdit = async (clientId: string) => {
    setSaving(true);
    const updates: Record<string, string | null> = {};
    if (editForm.name.trim()) updates.name = editForm.name.trim();
    updates.email = editForm.email.trim() || null;
    updates.phone = editForm.phone.trim() || null;

    const { error } = await supabase.from("clients").update(updates).eq("id", clientId);
    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success("Client mis à jour !");
      setEditingId(null);
      loadClients();
    }
    setSaving(false);
  };

  const handleDelete = async (clientId: string, clientName: string) => {
    if (!confirm(`Supprimer ${clientName} et tous ses dossiers ?`)) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Delete invoices first (due to FK)
    await supabase.from("invoices").delete().eq("client_id", clientId).eq("user_id", user.id);
    const { error } = await supabase.from("clients").delete().eq("id", clientId);

    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success("Client supprimé.");
      loadClients();
    }
  };

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

  const statusLabel: Record<string, string> = {
    pending: "En attente",
    in_progress: "Suivi en cours",
    recovered: "Réglé",
    disputed: "Contesté",
    failed: "Non résolu",
    cancelled: "Annulé",
  };

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

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
            <Users className="w-5 h-5 text-primary" />
            Mes clients
          </h2>
          <p className="text-xs text-muted-foreground">{clients.length} client{clients.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} size="sm" variant={showAdd ? "outline" : "default"}>
          {showAdd ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
          {showAdd ? "Annuler" : "Ajouter"}
        </Button>
      </div>

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
               <Input placeholder="ex: Construction Roy inc." value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} className="bg-secondary" />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="ex: info@constructionroy.ca" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} className="bg-secondary" />
                <Input placeholder="ex: 418-555-3210" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} className="bg-secondary" />
              </div>
              <Button onClick={handleAdd} disabled={!newClient.name.trim() || saving} className="w-full" size="sm">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                Ajouter le client
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un client… ex: Tremblay"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card"
        />
      </div>

      {/* Client list */}
      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">
            {search ? "Aucun client trouvé." : "Aucun client encore. Ajoute ton premier client !"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((client) => (
            <motion.div
              key={client.id}
              layout
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              {/* Client row */}
              <div className="flex items-center gap-3 p-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{client.name[0]?.toUpperCase()}</span>
                </div>

                {editingId === client.id ? (
                  <div className="flex-1 space-y-2">
                    <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="bg-secondary h-8 text-sm" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Courriel" className="bg-secondary h-8 text-sm" />
                      <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Téléphone" className="bg-secondary h-8 text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={() => handleEdit(client.id)} disabled={saving} className="h-7 text-xs">
                        <Save className="w-3 h-3 mr-1" /> Sauvegarder
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-7 text-xs">Annuler</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpand(client.id)}>
                      <p className="font-medium text-sm truncate">{client.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {client.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{client.email}</span>}
                        {client.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingId(client.id); setEditForm({ name: client.name, email: client.email || "", phone: client.phone || "" }); }}
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id, client.name)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                      <button onClick={() => toggleExpand(client.id)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                        {expandedId === client.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Expanded: invoices */}
              <AnimatePresence>
                {expandedId === client.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border px-4 py-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> Factures
                      </p>
                      {!invoicesMap[client.id] ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : invoicesMap[client.id].length === 0 ? (
                        <p className="text-xs text-muted-foreground">Aucune facture.</p>
                      ) : (
                        invoicesMap[client.id].map((inv) => (
                          <div key={inv.id} className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2 text-xs">
                            <div>
                              <span className="font-medium">{inv.invoice_number ? `#${inv.invoice_number}` : "Facture"}</span>
                              <span className="text-muted-foreground ml-2">{formatMoney(inv.amount)}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full font-medium ${
                              inv.status === "recovered" ? "bg-primary/10 text-primary" :
                              inv.status === "disputed" ? "bg-accent/10 text-accent" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {statusLabel[inv.status] || inv.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
