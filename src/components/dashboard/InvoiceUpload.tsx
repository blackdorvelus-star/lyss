import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, Send, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface InvoiceForm {
  id: string;
  file?: File;
  clientName: string;
  amount: string;
  email: string;
  phone: string;
}

interface InvoiceUploadProps {
  onBack: () => void;
  onLogout?: () => void;
}

const emptyInvoice = (): InvoiceForm => ({
  id: crypto.randomUUID(),
  clientName: "",
  amount: "",
  email: "",
  phone: "",
});

const InvoiceUpload = ({ onBack }: InvoiceUploadProps) => {
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
    // Validate all invoices
    for (const inv of invoices) {
      if (!inv.clientName.trim() || !inv.amount.trim()) {
        toast.error("Remplis au minimum le nom du client et le montant pour chaque facture.");
        return;
      }
      const amount = parseFloat(inv.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error(`Montant invalide pour ${inv.clientName || "une facture"}.`);
        return;
      }
    }

    setSending(true);

    try {
      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Tu dois être connecté pour soumettre une facture.");
        setSending(false);
        return;
      }

      for (const inv of invoices) {
        // 1. Upsert client
        const { data: existingClients } = await supabase
          .from("clients")
          .select("id")
          .eq("name", inv.clientName.trim())
          .eq("user_id", user.id)
          .limit(1);

        let clientId: string;

        if (existingClients && existingClients.length > 0) {
          clientId = existingClients[0].id;
          // Update contact info if provided
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

          if (clientError || !newClient) {
            throw new Error(clientError?.message || "Erreur création client");
          }
          clientId = newClient.id;
        }

        // 2. Upload file if present
        let fileUrl: string | null = null;
        if (inv.file) {
          const ext = inv.file.name.split(".").pop();
          const filePath = `${user.id}/${crypto.randomUUID()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from("invoices")
            .upload(filePath, inv.file);

          if (uploadError) {
            console.error("Upload error:", uploadError);
          } else {
            const { data: urlData } = supabase.storage
              .from("invoices")
              .getPublicUrl(filePath);
            fileUrl = urlData.publicUrl;
          }
        }

        // 3. Create invoice
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

        if (invoiceError || !newInvoice) {
          throw new Error(invoiceError?.message || "Erreur création facture");
        }

        // 4. Generate AI reminder
        try {
          const { data: session } = await supabase.auth.getSession();
          const token = session?.session?.access_token;
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-reminder`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
              body: JSON.stringify({ invoice_id: newInvoice.id }),
            }
          );
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            console.warn("Reminder generation issue:", errData);
          }
        } catch (reminderErr) {
          // Non-blocking — invoice is saved, reminder gen is best-effort
          console.warn("Could not generate reminder:", reminderErr);
        }
      }

      toast.success(
        invoices.length === 1
          ? "Facture soumise ! L'IA commence les relances sous 24h."
          : `${invoices.length} factures soumises ! Relances en cours.`,
        { description: invoices.map((i) => `${i.clientName} — ${i.amount} $`).join(", ") }
      );
      setInvoices([emptyInvoice()]);
      setActiveIdx(0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(`Erreur : ${message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-5 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <span className="font-display font-bold text-primary text-sm">Cash-Flow AI</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 py-8">
        <h1 className="font-display text-2xl font-bold mb-1">Nouvelle relance</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Ajoute les détails de la facture impayée. L'IA s'occupe du reste.
        </p>

        {/* Invoice tabs */}
        {invoices.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
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
                Facture {i + 1}
                {invoices.length > 1 && (
                  <X
                    className="w-3 h-3 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeInvoice(i);
                    }}
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
            {/* File upload */}
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

            {/* Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nom du client *</label>
                <Input
                  placeholder="ex: Marc Tremblay"
                  value={active.clientName}
                  onChange={(e) => updateField("clientName", e.target.value)}
                  className="bg-card"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Montant dû ($) *</label>
                <Input
                  type="number"
                  placeholder="ex: 2500"
                  value={active.amount}
                  onChange={(e) => updateField("amount", e.target.value)}
                  className="bg-card"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Courriel du client</label>
                <Input
                  type="email"
                  placeholder="marc@exemple.com"
                  value={active.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="bg-card"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Téléphone du client</label>
                <Input
                  type="tel"
                  placeholder="418-555-0123"
                  value={active.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="bg-card"
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <Button variant="outline" onClick={addInvoice} className="flex-shrink-0">
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={sending}
            className="flex-1 bg-primary text-primary-foreground font-display font-semibold"
          >
            {sending ? (
              "Envoi en cours..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-1" />
                Lancer la relance
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          L'IA enverra le premier message dans les 24 heures.
          Tu seras notifié à chaque réponse de ton client.
        </p>
      </div>
    </div>
  );
};

export default InvoiceUpload;
