import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Banknote, CreditCard, Building2, Save, Loader2, Link2, ShieldAlert, Landmark, Mail, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { safeSupabase as supabase } from "@/lib/supabase-safe";
import { toast } from "sonner";

const PaymentSettings = () => {
  const [interacEmail, setInteracEmail] = useState("");
  const [interacQuestion, setInteracQuestion] = useState("Paiement");
  const [interacAnswer, setInteracAnswer] = useState("");
  const [stripeLink, setStripeLink] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [allowDisputes, setAllowDisputes] = useState(false);
  const [paypalLink, setPaypalLink] = useState("");
  const [bankInstitution, setBankInstitution] = useState("");
  const [bankTransit, setBankTransit] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [chequeAddress, setChequeAddress] = useState("");
  const [depositInstructions, setDepositInstructions] = useState("");
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
      setAllowDisputes((data as any).allow_disputes ?? false);
      setPaypalLink((data as any).paypal_link || "");
      setBankInstitution((data as any).bank_institution || "");
      setBankTransit((data as any).bank_transit || "");
      setBankAccount((data as any).bank_account || "");
      setBankName((data as any).bank_name || "");
      setChequeAddress((data as any).cheque_address || "");
      setDepositInstructions((data as any).deposit_instructions || "");
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
      allow_disputes: allowDisputes,
      paypal_link: paypalLink || null,
      bank_institution: bankInstitution || null,
      bank_transit: bankTransit || null,
      bank_account: bankAccount || null,
      bank_name: bankName || null,
      cheque_address: chequeAddress || null,
      deposit_instructions: depositInstructions || null,
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
          Configure les moyens de paiement que tes clients verront sur le portail.
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
          <h4 className="font-medium text-sm">Carte de crédit / débit (Stripe)</h4>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">
            Lien Stripe Payment Link
          </label>
          <Input
            value={stripeLink}
            onChange={(e) => setStripeLink(e.target.value)}
            placeholder="https://buy.stripe.com/..."
            className="bg-secondary"
          />
          <p className="text-xs text-muted-foreground">
            Accepte Visa, Mastercard, débit Visa et plus. Crée un lien depuis ton tableau de bord Stripe.
          </p>
        </div>
      </div>

      {/* PayPal section */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-blue-500" />
          <h4 className="font-medium text-sm">PayPal</h4>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">
            Lien PayPal.me ou adresse PayPal
          </label>
          <Input
            value={paypalLink}
            onChange={(e) => setPaypalLink(e.target.value)}
            placeholder="https://paypal.me/monentreprise ou paiements@entreprise.ca"
            className="bg-secondary"
          />
        </div>
      </div>

      {/* Virement bancaire direct */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-emerald-500" />
          <h4 className="font-medium text-sm">Virement bancaire direct</h4>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Nom de la banque</label>
            <Input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Desjardins, BMO, TD..."
              className="bg-secondary"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">No institution</label>
              <Input
                value={bankInstitution}
                onChange={(e) => setBankInstitution(e.target.value)}
                placeholder="815"
                className="bg-secondary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">No transit</label>
              <Input
                value={bankTransit}
                onChange={(e) => setBankTransit(e.target.value)}
                placeholder="12345"
                className="bg-secondary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">No compte</label>
              <Input
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="1234567"
                className="bg-secondary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chèque */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-orange-500" />
          <h4 className="font-medium text-sm">Chèque par la poste</h4>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">
            Adresse postale pour les chèques
          </label>
          <Textarea
            value={chequeAddress}
            onChange={(e) => setChequeAddress(e.target.value)}
            placeholder="Plomberie Lévis Inc.&#10;123 rue Principale&#10;Lévis, QC G6V 1A1"
            className="bg-secondary min-h-[70px] text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Le chèque doit être libellé au nom de ton entreprise.
          </p>
        </div>
      </div>

      {/* Dépôt direct */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-violet-500" />
          <h4 className="font-medium text-sm">Dépôt direct</h4>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">
            Instructions pour le dépôt direct
          </label>
          <Textarea
            value={depositInstructions}
            onChange={(e) => setDepositInstructions(e.target.value)}
            placeholder="Instructions spécifiques pour le dépôt direct..."
            className="bg-secondary min-h-[70px] text-sm"
          />
        </div>
      </div>

      {/* Disputes toggle */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-4 h-4 text-accent" />
            <div>
              <h4 className="font-medium text-sm">Autoriser les contestations</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permet à tes clients de signaler un problème ou demander un délai via le portail et le widget.
              </p>
            </div>
          </div>
          <Switch checked={allowDisputes} onCheckedChange={setAllowDisputes} />
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