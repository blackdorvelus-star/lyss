import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Banknote, CreditCard, Building2, Save, Loader2, Link2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PaymentSettings = () => {
  const [interacEmail, setInteracEmail] = useState("");
  const [interacQuestion, setInteracQuestion] = useState("Paiement");
  const [interacAnswer, setInteracAnswer] = useState("");
  const [stripeLink, setStripeLink] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("payment_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setInteracEmail(data.interac_email || "");
      setInteracQuestion(data.interac_question || "Paiement");
      setInteracAnswer(data.interac_answer || "");
      setStripeLink(data.stripe_link || "");
      setCompanyName(data.company_name || "");
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      interac_email: interacEmail || null,
      interac_question: interacQuestion || null,
      interac_answer: interacAnswer || null,
      stripe_link: stripeLink || null,
      company_name: companyName || null,
    } as any;

    const { error } = await supabase
      .from("payment_settings")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      toast.error("Erreur lors de la sauvegarde.");
    } else {
      toast.success("Paramètres de paiement sauvegardés !");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h3 className="font-display font-bold text-base flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          Portail de paiement client
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Ces informations apparaissent sur le portail de paiement de tes clients.
          Lyss ne traite aucune transaction — les paiements vont directement dans ton compte.
        </p>
      </div>

      {/* Company name */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          Nom de l'entreprise (affiché au client)
        </label>
        <Input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Plomberie Lévis"
          className="bg-card"
        />
      </div>

      {/* Interac section */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Banknote className="w-4 h-4 text-accent" />
          <h4 className="font-medium text-sm">Virement Interac</h4>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Courriel Interac</label>
            <Input
              value={interacEmail}
              onChange={(e) => setInteracEmail(e.target.value)}
              placeholder="paiements@plomberielvis.ca"
              className="bg-secondary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Question de sécurité</label>
              <Input
                value={interacQuestion}
                onChange={(e) => setInteracQuestion(e.target.value)}
                placeholder="Paiement"
                className="bg-secondary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Réponse</label>
              <Input
                value={interacAnswer}
                onChange={(e) => setInteracAnswer(e.target.value)}
                placeholder="facture123"
                className="bg-secondary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stripe section */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />
          <h4 className="font-medium text-sm">Paiement par carte (Stripe)</h4>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">
            Lien Stripe Payment Link (optionnel)
          </label>
          <Input
            value={stripeLink}
            onChange={(e) => setStripeLink(e.target.value)}
            placeholder="https://buy.stripe.com/..."
            className="bg-secondary"
          />
          <p className="text-xs text-muted-foreground">
            Crée un lien depuis ton tableau de bord Stripe → Payment Links.
          </p>
        </div>
      </div>

      <Button
        onClick={saveSettings}
        disabled={saving}
        className="bg-primary text-primary-foreground font-display w-full"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Sauvegarder les paramètres
      </Button>
    </motion.div>
  );
};

export default PaymentSettings;
