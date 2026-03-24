import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCircle, Building2, BadgeCheck, MessageSquare, Phone, Save, Loader2, Check, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { safeSupabase as supabase } from "@/lib/supabase-safe";
import { toast } from "sonner";
import { usePlan } from "@/hooks/usePlan";

const roles = [
  { value: "adjointe", label: "Adjointe administrative" },
  { value: "secretaire", label: "Secrétaire" },
  { value: "coordonnatrice", label: "Coordonnatrice de bureau" },
];

const AssistantIdentity = () => {
  const { plan } = usePlan();
  const canCustomizeName = plan === "pro" || plan === "enterprise";
  const [name, setName] = useState("Lyss");
  const [role, setRole] = useState("adjointe");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("payment_settings")
      .select("assistant_name, assistant_role, company_name")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setName(data.assistant_name || "Lyss");
      setRole(data.assistant_role || "adjointe");
      setCompany(data.company_name || "");
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("payment_settings")
      .upsert({
        user_id: user.id,
        assistant_name: name || "Lyss",
        assistant_role: role,
        company_name: company || null,
      }, { onConflict: "user_id" });

    if (error) {
      toast.error("Erreur lors de la sauvegarde.");
    } else {
      setSaved(true);
      toast.success("Identité de l'adjointe sauvegardée !");
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const roleLabel = roles.find((r) => r.value === role)?.label || "Adjointe administrative";
  const companyDisplay = company || "Votre entreprise";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold">Identité de l'adjointe</h2>
        <p className="text-xs text-muted-foreground">
          Personnalise comment l'IA se présente auprès de tes clients.
        </p>
      </div>

      {/* Config fields */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <UserCircle className="w-4 h-4 text-primary" />
            Prénom de l'adjointe
            {!canCustomizeName && <Lock className="w-3 h-3 text-muted-foreground" />}
          </label>
          <Input
            value={canCustomizeName ? name : "Lyss"}
            onChange={(e) => setName(e.target.value)}
            placeholder="Lyss"
            className="bg-card"
            disabled={!canCustomizeName}
          />
          <p className="text-xs text-muted-foreground">
            {canCustomizeName
              ? "Le prénom utilisé dans les SMS, courriels et appels."
              : "Disponible avec le plan Pro ou Entreprise. Passe au Pro pour personnaliser le nom."}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Nom de ton entreprise
          </label>
          <Input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Plomberie Lévis"
            className="bg-card"
          />
          <p className="text-xs text-muted-foreground">
            Injecté automatiquement dans chaque message.
          </p>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-primary" />
            Titre professionnel
          </label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Le titre influence la perception juridique et professionnelle du contact.
          </p>
        </div>
      </div>

      {/* Save button */}
      <Button
        onClick={saveSettings}
        disabled={saving}
        className="bg-primary text-primary-foreground font-display w-full"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : saved ? (
          <Check className="w-4 h-4 mr-2" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        {saved ? "Sauvegardé !" : "Sauvegarder l'identité"}
      </Button>

      {/* Live preview */}
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Prévisualisation en temps réel
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${name}-${role}-${company}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary">SMS</span>
              </div>
              <div className="bg-secondary rounded-xl rounded-tl-sm p-4 text-sm leading-relaxed">
                <p>
                  Bonjour Marc, c'est{" "}
                  <span className="text-primary font-medium">{name || "Lyss"}</span>,{" "}
                  <span className="text-primary font-medium">
                    {roleLabel.charAt(0).toLowerCase() + roleLabel.slice(1)}
                  </span>{" "}
                  chez{" "}
                  <span className="text-primary font-medium">{companyDisplay}</span>.
                  Suivi pour la facture #1247 (850 $, due le 12 mars).
                </p>
                <p className="mt-2">
                  On comprend que ça peut arriver ! Si tu préfères, on peut diviser ça en 2 paiements Interac.
                </p>
                <p className="mt-2 text-primary font-medium">→ Lien de paiement sécurisé</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-accent" />
                <span className="text-xs font-medium text-accent">Appel vocal</span>
              </div>
              <div className="bg-secondary rounded-xl rounded-tl-sm p-4 text-sm leading-relaxed italic text-secondary-foreground">
                « Bonjour, ici{" "}
                <span className="text-foreground font-medium not-italic">{name || "Lyss"}</span>,{" "}
                <span className="text-foreground font-medium not-italic">
                  {roleLabel.charAt(0).toLowerCase() + roleLabel.slice(1)}
                </span>{" "}
                chez{" "}
                <span className="text-foreground font-medium not-italic">{companyDisplay}</span>.
                Je vous appelle concernant un dossier de facturation… »
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <p className="text-xs text-muted-foreground text-center">
          Ces paramètres s'appliquent à tous les futurs messages envoyés par l'adjointe.
        </p>
      </div>
    </div>
  );
};

export default AssistantIdentity;
