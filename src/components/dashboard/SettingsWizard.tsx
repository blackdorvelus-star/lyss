import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCircle, Building2, BadgeCheck, Mic2, Sparkles, Key, FileText,
  Banknote, CreditCard, ShieldAlert, Link2,
  ChevronRight, ChevronLeft, Check, Loader2, Save,
  MessageSquare, Phone, CalendarClock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import SequenceConfig from "./SequenceConfig";

// ── Data ────────────────────────────────────────────────────────────────────

const roles = [
  { value: "adjointe", label: "Adjointe administrative" },
  { value: "secretaire", label: "Secrétaire" },
  { value: "coordonnatrice", label: "Coordonnatrice de bureau" },
];

const voices = [
  { id: "21m00Tcm4TlvDq8ikWAM", label: "Rachel — Chaleureuse (femme)", provider: "elevenlabs" },
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Bella — Douce (femme)", provider: "elevenlabs" },
  { id: "ErXwobaYiN019PkySvjV", label: "Antoni — Professionnel (homme)", provider: "elevenlabs" },
  { id: "VR6AewLTigWG4xSOukaG", label: "Arnold — Autoritaire (homme)", provider: "elevenlabs" },
  { id: "pNInz6obpgDQGcFmaJgB", label: "Adam — Neutre (homme)", provider: "elevenlabs" },
];

const personalities = [
  { value: "chaleureuse", label: "🤗 Chaleureuse", description: "Empathique, amicale, tutoiement naturel" },
  { value: "professionnelle", label: "👔 Professionnelle", description: "Formelle, structurée, vouvoiement" },
  { value: "perseverante", label: "🎯 Persévérante", description: "Directe mais respectueuse, orientée résultat" },
];

const STEPS = [
  { id: "identity", label: "Identité", icon: UserCircle },
  { id: "voice", label: "Voix & ton", icon: Mic2 },
  { id: "payment", label: "Paiement", icon: Banknote },
  { id: "preview", label: "Aperçu", icon: Sparkles },
] as const;

type StepId = typeof STEPS[number]["id"];

// ── Component ───────────────────────────────────────────────────────────────

const SettingsWizard = () => {
  const [step, setStep] = useState<StepId>("identity");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Identity
  const [name, setName] = useState("Lyss");
  const [role, setRole] = useState("adjointe");
  const [company, setCompany] = useState("");

  // Voice
  const [vapiPublicKey, setVapiPublicKey] = useState("");
  const [voiceId, setVoiceId] = useState("21m00Tcm4TlvDq8ikWAM");
  const [personality, setPersonality] = useState("chaleureuse");
  const [customInstructions, setCustomInstructions] = useState("");
  const [firstMessageTemplate, setFirstMessageTemplate] = useState("");

  // Payment
  const [interacEmail, setInteracEmail] = useState("");
  const [interacQuestion, setInteracQuestion] = useState("Paiement");
  const [interacAnswer, setInteracAnswer] = useState("");
  const [stripeLink, setStripeLink] = useState("");
  const [allowDisputes, setAllowDisputes] = useState(false);

  const stepIndex = STEPS.findIndex(s => s.id === step);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("payment_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      const d = data as any;
      setName(d.assistant_name || "Lyss");
      setRole(d.assistant_role || "adjointe");
      setCompany(d.company_name || "");
      setVapiPublicKey(d.vapi_public_key || "");
      setVoiceId(d.vapi_voice_id || "21m00Tcm4TlvDq8ikWAM");
      setPersonality(d.vapi_personality || "chaleureuse");
      setCustomInstructions(d.vapi_custom_instructions || "");
      setFirstMessageTemplate(d.vapi_first_message_template || "");
      setInteracEmail(d.interac_email || "");
      setInteracQuestion(d.interac_question || "Paiement");
      setInteracAnswer(d.interac_answer || "");
      setStripeLink(d.stripe_link || "");
      setAllowDisputes(d.allow_disputes ?? false);
    }
    setLoading(false);
  };

  const saveAll = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const selectedVoice = voices.find(v => v.id === voiceId);

    const { error } = await supabase
      .from("payment_settings")
      .upsert({
        user_id: user.id,
        assistant_name: name || "Lyss",
        assistant_role: role,
        company_name: company || null,
        vapi_public_key: vapiPublicKey || null,
        vapi_voice_provider: selectedVoice?.provider || "elevenlabs",
        vapi_voice_id: voiceId,
        vapi_personality: personality,
        vapi_custom_instructions: customInstructions || null,
        vapi_first_message_template: firstMessageTemplate || null,
        interac_email: interacEmail || null,
        interac_question: interacQuestion || null,
        interac_answer: interacAnswer || null,
        stripe_link: stripeLink || null,
        allow_disputes: allowDisputes,
      } as any, { onConflict: "user_id" });

    if (error) {
      toast.error("Erreur lors de la sauvegarde.");
    } else {
      toast.success("Tous les réglages ont été sauvegardés !");
    }
    setSaving(false);
  };

  const goNext = () => {
    const i = stepIndex;
    if (i < STEPS.length - 1) setStep(STEPS[i + 1].id);
  };
  const goPrev = () => {
    const i = stepIndex;
    if (i > 0) setStep(STEPS[i - 1].id);
  };

  const roleLabel = roles.find(r => r.value === role)?.label || "Adjointe administrative";
  const companyDisplay = company || "Votre entreprise";
  const selectedPersonality = personalities.find(p => p.value === personality);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4 sm:space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const isActive = s.id === step;
          const isDone = i < stepIndex;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className="flex-1 group"
            >
              <div className={cn(
                "h-1.5 sm:h-1 rounded-full mb-1.5 sm:mb-2 transition-all",
                isActive ? "bg-primary" : isDone ? "bg-primary/40" : "bg-border"
              )} />
              <div className={cn(
                "flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium transition-colors",
                isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
              )}>
                {isDone ? (
                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                ) : (
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === "identity" && (
            <StepCard
              title="Qui est ton adjointe ?"
              subtitle="Ces infos seront utilisées dans chaque message envoyé par Lyss."
            >
              <div className="space-y-4">
                <Field icon={UserCircle} label="Prénom de l'adjointe" hint="Le prénom utilisé dans les SMS, courriels et appels.">
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Lyss" className="bg-secondary" />
                </Field>
                <Field icon={Building2} label="Nom de ton entreprise" hint="Injecté automatiquement dans chaque message.">
                  <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Plomberie Lévis" className="bg-secondary" />
                </Field>
                <Field icon={BadgeCheck} label="Titre professionnel" hint="Le titre influence la perception professionnelle du contact.">
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {roles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </StepCard>
          )}

          {step === "voice" && (
            <StepCard
              title="Comment Lyss parle ?"
              subtitle="Choisis la voix, la personnalité et le style de communication."
            >
              <div className="space-y-4">
                {/* Personality — big visual cards */}
                <div>
                  <p className="text-sm font-medium mb-2">Personnalité</p>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {personalities.map(p => (
                      <button
                        key={p.value}
                        onClick={() => setPersonality(p.value)}
                        className={cn(
                          "flex flex-col items-center text-center p-2.5 sm:p-4 rounded-xl border transition-all",
                          personality === p.value
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border bg-card hover:border-primary/30"
                        )}
                      >
                        <span className="text-xl sm:text-2xl mb-0.5 sm:mb-1">{p.label.split(" ")[0]}</span>
                        <span className="text-[10px] sm:text-xs font-semibold leading-tight">{p.label.split(" ").slice(1).join(" ")}</span>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 sm:mt-1 leading-tight hidden sm:block">{p.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Field icon={Mic2} label="Voix de l'agent" hint="Voix ElevenLabs utilisée lors des appels.">
                  <Select value={voiceId} onValueChange={setVoiceId}>
                    <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {voices.map(v => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>

                <Field icon={Key} label="Clé publique Vapi (optionnel)" hint="Disponible dans ton tableau de bord Vapi → Settings → Public Key.">
                  <Input value={vapiPublicKey} onChange={e => setVapiPublicKey(e.target.value)} placeholder="xxxxxxxx-xxxx-…" className="bg-secondary font-mono text-xs" />
                </Field>

                <Field icon={FileText} label="Instructions personnalisées (optionnel)" hint="Ajoutées au prompt de l'agent. Ex: proposer un plan de paiement en 3 versements.">
                  <Textarea value={customInstructions} onChange={e => setCustomInstructions(e.target.value)} placeholder="Toujours proposer un plan de paiement…" className="bg-secondary min-h-[80px] text-sm" />
                </Field>

                <Field icon={Mic2} label="Premier message (optionnel)" hint="Variables : {prénom}, {montant}, {facture}, {nom_assistant}, {rôle}, {entreprise}">
                  <Textarea value={firstMessageTemplate} onChange={e => setFirstMessageTemplate(e.target.value)} placeholder="Bonjour {prénom}, c'est {nom_assistant}…" className="bg-secondary min-h-[60px] text-sm" />
                </Field>
              </div>
            </StepCard>
          )}

          {step === "payment" && (
            <StepCard
              title="Comment tes clients paient ?"
              subtitle="Lyss ne traite aucune transaction — elle redirige vers tes propres méthodes."
            >
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-accent" />
                    <h4 className="font-medium text-sm">Virement Interac</h4>
                  </div>
                  <Input value={interacEmail} onChange={e => setInteracEmail(e.target.value)} placeholder="paiements@entreprise.ca" className="bg-secondary" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Question</label>
                      <Input value={interacQuestion} onChange={e => setInteracQuestion(e.target.value)} placeholder="Paiement" className="bg-secondary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Réponse</label>
                      <Input value={interacAnswer} onChange={e => setInteracAnswer(e.target.value)} placeholder="facture123" className="bg-secondary" />
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <h4 className="font-medium text-sm">Paiement par carte (Stripe)</h4>
                  </div>
                  <Input value={stripeLink} onChange={e => setStripeLink(e.target.value)} placeholder="https://buy.stripe.com/…" className="bg-secondary" />
                  <p className="text-xs text-muted-foreground">Crée un lien depuis Stripe → Payment Links.</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="w-4 h-4 text-accent" />
                      <div>
                        <h4 className="font-medium text-sm">Contestations</h4>
                        <p className="text-xs text-muted-foreground">Clients peuvent signaler un problème via le portail.</p>
                      </div>
                    </div>
                    <Switch checked={allowDisputes} onCheckedChange={setAllowDisputes} />
                  </div>
                </div>
              </div>
            </StepCard>
          )}

          {step === "preview" && (
            <StepCard
              title="Aperçu en temps réel"
              subtitle="Voici comment Lyss se présentera auprès de tes clients."
            >
              <div className="space-y-4">
                {/* SMS preview */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-primary">SMS</span>
                  </div>
                  <div className="bg-secondary rounded-xl rounded-tl-sm p-4 text-sm leading-relaxed">
                    <p>
                      Bonjour Marc, c'est{" "}
                      <span className="text-primary font-medium">{name || "Lyss"}</span>,{" "}
                      <span className="text-primary font-medium">{roleLabel.charAt(0).toLowerCase() + roleLabel.slice(1)}</span>{" "}
                      chez <span className="text-primary font-medium">{companyDisplay}</span>.
                      Suivi pour la facture #1247 (850 $, due le 12 mars).
                    </p>
                    <p className="mt-2">On comprend que ça peut arriver ! Si tu préfères, on peut diviser ça en 2 paiements Interac.</p>
                    <p className="mt-2 text-primary font-medium">→ Lien de paiement sécurisé</p>
                  </div>
                </div>

                {/* Voice preview */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-accent" />
                    <span className="text-xs font-medium text-accent">Appel vocal · {selectedPersonality?.label}</span>
                  </div>
                  <div className="bg-secondary rounded-xl rounded-tl-sm p-4 text-sm leading-relaxed italic text-secondary-foreground">
                    {personality === "chaleureuse" && (
                      <p>« Bonjour Marc, c'est {name || "Lyss"} ! Je t'appelle juste pour un petit suivi concernant ta facture. T'inquiète pas, c'est vraiment informel — on veut juste s'assurer que tout est beau de ton côté. »</p>
                    )}
                    {personality === "professionnelle" && (
                      <p>« Bonjour Monsieur Tremblay, ici {name || "Lyss"}, {roleLabel.toLowerCase()} chez {companyDisplay}. Je vous contacte dans le cadre d'un suivi de courtoisie concernant votre dossier. Auriez-vous un moment ? »</p>
                    )}
                    {personality === "perseverante" && (
                      <p>« Bonjour Marc, c'est {name || "Lyss"}. Je te rappelle au sujet de ta facture en attente. On aimerait trouver une solution ensemble rapidement — est-ce qu'on peut en discuter maintenant ? »</p>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 space-y-2">
                  <h4 className="text-sm font-medium text-primary">Récapitulatif</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <p>Adjointe : <span className="text-foreground font-medium">{name || "Lyss"}</span></p>
                    <p>Entreprise : <span className="text-foreground font-medium">{companyDisplay}</span></p>
                    <p>Titre : <span className="text-foreground font-medium">{roleLabel}</span></p>
                    <p>Personnalité : <span className="text-foreground font-medium">{selectedPersonality?.label}</span></p>
                    <p>Interac : <span className="text-foreground font-medium">{interacEmail || "Non configuré"}</span></p>
                    <p>Stripe : <span className="text-foreground font-medium">{stripeLink ? "Configuré" : "Non configuré"}</span></p>
                  </div>
                </div>
              </div>
            </StepCard>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={goPrev}
          disabled={stepIndex === 0}
          className="text-muted-foreground"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Précédent
        </Button>

        {stepIndex < STEPS.length - 1 ? (
          <Button size="sm" onClick={goNext} className="font-display">
            Suivant
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button size="sm" onClick={saveAll} disabled={saving} className="font-display bg-primary text-primary-foreground">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Tout sauvegarder
          </Button>
        )}
      </div>
    </div>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const StepCard = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
  <div className="space-y-4 sm:space-y-5">
    <div>
      <h2 className="font-display text-base sm:text-lg font-bold">{title}</h2>
      <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{subtitle}</p>
    </div>
    {children}
  </div>
);

const Field = ({ icon: Icon, label, hint, children }: { icon: any; label: string; hint?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium flex items-center gap-2">
      <Icon className="w-4 h-4 text-primary" />
      {label}
    </label>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

export default SettingsWizard;
