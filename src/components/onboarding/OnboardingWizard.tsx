import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, User, Sparkles, Send, ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OnboardingWizardProps {
  onComplete: () => void;
}

const steps = [
  { icon: Building2, title: "Ton entreprise", subtitle: "Comment s'appelle ton entreprise ?" },
  { icon: User, title: "Premier client", subtitle: "Ajoute ton premier client à suivre." },
  { icon: Sparkles, title: "Ton adjointe", subtitle: "Personnalise l'identité de Lyss." },
  { icon: Send, title: "Premier dossier", subtitle: "Lance ton premier suivi de facturation." },
];

const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Company
  const [companyName, setCompanyName] = useState("");
  const [interacEmail, setInteracEmail] = useState("");
  const [stripeLink, setStripeLink] = useState("");

  // Step 2: First client
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  // Step 3: Assistant
  const [assistantName, setAssistantName] = useState("Lyss");
  const [assistantRole, setAssistantRole] = useState("adjointe");

  // Step 4: First invoice
  const [invoiceAmount, setInvoiceAmount] = useState("");

  const canProceed = () => {
    switch (step) {
      case 0: return companyName.trim().length > 0;
      case 1: return clientName.trim().length > 0;
      case 2: return assistantName.trim().length > 0;
      case 3: return invoiceAmount.trim().length > 0 && parseFloat(invoiceAmount) > 0;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    // Final step: save everything
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      // Save company & assistant settings
      await supabase.from("payment_settings").upsert({
        user_id: user.id,
        company_name: companyName.trim(),
        interac_email: interacEmail.trim() || null,
        stripe_link: stripeLink.trim() || null,
        assistant_name: assistantName.trim(),
        assistant_role: assistantRole.trim(),
        onboarding_completed: true,
      } as any, { onConflict: "user_id" });

      // Create client
      const { data: newClient, error: clientErr } = await supabase
        .from("clients")
        .insert({
          user_id: user.id,
          name: clientName.trim(),
          email: clientEmail.trim() || null,
          phone: clientPhone.trim() || null,
        })
        .select("id")
        .single();

      if (clientErr || !newClient) throw new Error(clientErr?.message || "Erreur client");

      // Create invoice
      const { data: newInvoice, error: invErr } = await supabase
        .from("invoices")
        .insert({
          user_id: user.id,
          client_id: newClient.id,
          amount: parseFloat(invoiceAmount),
          status: "pending",
        })
        .select("id")
        .single();

      if (invErr || !newInvoice) throw new Error(invErr?.message || "Erreur facture");

      // Generate first reminder
      try {
        const { data: session } = await supabase.auth.getSession();
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-reminder`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ invoice_id: newInvoice.id }),
        });
      } catch {}

      toast.success("Bienvenue ! Ton premier dossier est lancé. 🎉");
      onComplete();
    } catch (err: any) {
      toast.error(`Erreur : ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo-lyss.png" alt="Lyss" className="h-10 mx-auto mb-4 object-contain" />
          <h1 className="font-display text-2xl font-bold">Configuration initiale</h1>
          <p className="text-sm text-muted-foreground mt-1">4 étapes rapides pour démarrer</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Step header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            {(() => { const Icon = steps[step].icon; return <Icon className="w-5 h-5 text-primary" />; })()}
          </div>
          <div>
            <h2 className="font-display font-bold text-base">{steps[step].title}</h2>
            <p className="text-xs text-muted-foreground">{steps[step].subtitle}</p>
          </div>
          <span className="ml-auto text-xs text-muted-foreground">{step + 1}/4</span>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {step === 0 && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Nom de l'entreprise *</label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="ex: Plomberie Lévis"
                    className="bg-card"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Courriel Interac (optionnel)</label>
                  <Input
                    value={interacEmail}
                    onChange={(e) => setInteracEmail(e.target.value)}
                    placeholder="paiements@tonentreprise.ca"
                    className="bg-card"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Pour recevoir les paiements directement de tes clients.
                  </p>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Nom du client *</label>
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="ex: Marc Tremblay"
                    className="bg-card"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Courriel</label>
                  <Input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="marc@exemple.com"
                    className="bg-card"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Téléphone</label>
                  <Input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="418-555-0123"
                    className="bg-card"
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Nom de l'adjointe *</label>
                  <Input
                    value={assistantName}
                    onChange={(e) => setAssistantName(e.target.value)}
                    placeholder="Lyss"
                    className="bg-card"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Rôle</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["adjointe", "assistante", "secrétaire", "coordonnatrice"].map((role) => (
                      <button
                        key={role}
                        onClick={() => setAssistantRole(role)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all capitalize ${
                          assistantRole === role
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Aperçu :</span> « Bonjour, je suis{" "}
                    <span className="text-primary font-medium">{assistantName || "Lyss"}</span>,{" "}
                    {assistantRole} de <span className="text-primary font-medium">{companyName || "votre entreprise"}</span>. »
                  </p>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm mb-1">
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-medium">{clientName}</span>
                  </div>
                  {clientEmail && <p className="text-xs text-muted-foreground ml-6">{clientEmail}</p>}
                  {clientPhone && <p className="text-xs text-muted-foreground ml-6">{clientPhone}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Montant dû ($) *</label>
                  <Input
                    type="number"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    placeholder="ex: 2500"
                    className="bg-card"
                    autoFocus
                  />
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-primary inline mr-1" />
                    {assistantName} enverra le premier suivi de courtoisie dans les 24h.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={saving}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Retour
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed() || saving}
            className="flex-1 bg-primary text-primary-foreground font-display"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : step === 3 ? (
              <>
                <Sparkles className="w-4 h-4 mr-1" /> Lancer le suivi
              </>
            ) : (
              <>
                Suivant <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>

        {/* Skip */}
        {step < 3 && (
          <button
            onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await supabase.from("payment_settings").upsert({
                  user_id: user.id,
                  onboarding_completed: true,
                } as any, { onConflict: "user_id" });
              }
              onComplete();
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto block mt-4"
          >
            Passer la configuration →
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;
