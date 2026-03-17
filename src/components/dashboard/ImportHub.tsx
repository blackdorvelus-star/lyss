import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, Send, Plus, FileSpreadsheet, Pencil, Code, Copy, Check, ExternalLink, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import CsvImport from "./CsvImport";

type ImportMethod = "manual" | "csv";

interface InvoiceForm {
  id: string;
  file?: File;
  clientName: string;
  amount: string;
  email: string;
  phone: string;
}

const emptyInvoice = (): InvoiceForm => ({
  id: crypto.randomUUID(),
  clientName: "",
  amount: "",
  email: "",
  phone: "",
});

interface ImportHubProps {
  onComplete: () => void;
}

const ImportHub = ({ onComplete }: ImportHubProps) => {
  const [method, setMethod] = useState<ImportMethod | null>(null);
  const [invoices, setInvoices] = useState<InvoiceForm[]>([emptyInvoice()]);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const active = invoices[activeIdx];

  const updateField = (field: keyof InvoiceForm, value: string) => {
    setInvoices((prev) =>
      prev.map((inv, i) => (i === activeIdx ? { ...inv, [field]: value } : inv))
    );
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInvoices((prev) =>
        prev.map((inv, i) => (i === activeIdx ? { ...inv, file } : inv))
      );
    }
  };

  const addInvoice = () => {
    const next = emptyInvoice();
    setInvoices((prev) => [...prev, next]);
    setActiveIdx(invoices.length);
  };

  const removeInvoice = (idx: number) => {
    if (invoices.length <= 1) return;
    setInvoices((prev) => prev.filter((_, i) => i !== idx));
    setActiveIdx((prev) => Math.min(prev, invoices.length - 2));
  };

  const handleSubmit = async () => {
    for (const inv of invoices) {
      if (!inv.clientName.trim() || !inv.amount.trim()) {
        toast.error("Remplis au minimum le nom du client et le montant pour chaque dossier.");
        return;
      }
      const amount = parseFloat(inv.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error(`Montant invalide pour ${inv.clientName || "un dossier"}.`);
        return;
      }
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Tu dois être connecté(e).");
        setSending(false);
        return;
      }

      for (const inv of invoices) {
        const { data: existingClients } = await supabase
          .from("clients")
          .select("id")
          .eq("name", inv.clientName.trim())
          .eq("user_id", user.id)
          .limit(1);

        let clientId: string;

        if (existingClients && existingClients.length > 0) {
          clientId = existingClients[0].id;
          const updates: Record<string, string> = {};
          if (inv.email.trim()) updates.email = inv.email.trim();
          if (inv.phone.trim()) updates.phone = inv.phone.trim();
          if (Object.keys(updates).length > 0) {
            await supabase.from("clients").update(updates).eq("id", clientId);
          }
        } else {
          const { data: newClient, error: clientError } = await supabase
            .from("clients")
            .insert({
              user_id: user.id,
              name: inv.clientName.trim(),
              email: inv.email.trim() || null,
              phone: inv.phone.trim() || null,
            })
            .select("id")
            .single();

          if (clientError || !newClient) throw new Error(clientError?.message || "Erreur création client");
          clientId = newClient.id;
        }

        let fileUrl: string | null = null;
        if (inv.file) {
          const ext = inv.file.name.split(".").pop();
          const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
          const { error: uploadError } = await supabase.storage.from("invoices").upload(filePath, inv.file);
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from("invoices").getPublicUrl(filePath);
            fileUrl = urlData.publicUrl;
          }
        }

        const { data: newInvoice, error: invoiceError } = await supabase
          .from("invoices")
          .insert({
            user_id: user.id,
            client_id: clientId,
            amount: parseFloat(inv.amount),
            file_url: fileUrl,
            status: "pending",
          })
          .select("id")
          .single();

        if (invoiceError || !newInvoice) throw new Error(invoiceError?.message || "Erreur création dossier");

        try {
          const { data: session } = await supabase.auth.getSession();
          const token = session?.session?.access_token;
          await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-reminder`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ invoice_id: newInvoice.id }),
          });
        } catch {}
      }

      toast.success(
        invoices.length === 1
          ? "Dossier soumis ! L'adjointe commence le suivi sous 24h."
          : `${invoices.length} dossiers soumis ! Suivis en cours.`
      );
      setInvoices([emptyInvoice()]);
      setActiveIdx(0);
      setMethod(null);
      onComplete();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(`Erreur : ${message}`);
    } finally {
      setSending(false);
    }
  };

  if (!method) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="font-display text-xl font-bold mb-1">Confier un dossier</h2>
          <p className="text-sm text-muted-foreground">
            Choisis comment ajouter tes dossiers. L'adjointe s'occupe du reste.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => setMethod("manual")}
            className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-center"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Pencil className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-display font-bold text-sm">Entrée manuelle</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ajoute un dossier à la fois avec le nom du client et le montant dû.
              </p>
            </div>
          </button>

          <button
            onClick={() => setMethod("csv")}
            className="group flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-center"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-display font-bold text-sm">Import CSV / Excel</p>
              <p className="text-xs text-muted-foreground mt-1">
                Importe plusieurs dossiers d'un coup depuis un fichier .csv ou .xlsx.
              </p>
            </div>
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Tu peux aussi connecter <button onClick={() => {}} className="text-primary hover:underline">QuickBooks ou Sage</button> depuis la section Intégrations.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setMethod(null)}>
          ← Retour
        </Button>
        <h2 className="font-display text-lg font-bold">
          {method === "manual" ? "Entrée manuelle" : "Import CSV / Excel"}
        </h2>
      </div>

      {method === "csv" && (
        <CsvImport onComplete={() => { setMethod(null); onComplete(); }} />
      )}

      {method === "manual" && (
        <>
          {invoices.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {invoices.map((inv, i) => (
                <button
                  key={inv.id}
                  onClick={() => setActiveIdx(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    i === activeIdx
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-secondary text-muted-foreground border border-transparent"
                  }`}
                >
                  Dossier {i + 1}
                  {invoices.length > 1 && (
                    <X
                      className="w-3 h-3 hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); removeInvoice(i); }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
              >
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} className="hidden" />
                {active.file ? (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm font-medium">{active.file.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">PDF ou photo de la facture</p>
                    <p className="text-xs text-muted-foreground mt-1">Optionnel — tu peux remplir manuellement</p>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Nom du client *</label>
                  <Input placeholder="ex: Marc Tremblay" value={active.clientName} onChange={(e) => updateField("clientName", e.target.value)} className="bg-card" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Montant dû ($) *</label>
                  <Input type="number" placeholder="ex: 2500" value={active.amount} onChange={(e) => updateField("amount", e.target.value)} className="bg-card" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Courriel du client</label>
                  <Input type="email" placeholder="ex: marc@email.com" value={active.email} onChange={(e) => updateField("email", e.target.value)} className="bg-card" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Téléphone du client</label>
                  <Input type="tel" placeholder="ex: 514-555-1234" value={active.phone} onChange={(e) => updateField("phone", e.target.value)} className="bg-card" />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3">
            <Button variant="outline" onClick={addInvoice} className="text-xs">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter un dossier
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={sending}
              className="flex-1 bg-primary text-primary-foreground font-display"
            >
              {sending ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Envoi…</span>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Confier {invoices.length} dossier{invoices.length > 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ImportHub;
