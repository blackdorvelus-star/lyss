import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCircle, Building2, BadgeCheck, Mic2, Sparkles, Key, FileText,
  Banknote, CreditCard, ShieldAlert, CalendarClock,
  Loader2, Save, ChevronDown,
  MessageSquare, Phone, Mail, Bell, Brain, Clock, Globe,
  HandCoins, Handshake,
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
  { value: "assistante", label: "Assistante de direction" },
  { value: "agente", label: "Agente de facturation" },
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

const allDays = [
  { value: "lun", label: "L" },
  { value: "mar", label: "M" },
  { value: "mer", label: "Me" },
  { value: "jeu", label: "J" },
  { value: "ven", label: "V" },
  { value: "sam", label: "S" },
  { value: "dim", label: "D" },
];

const channelsList = [
  { value: "sms", label: "SMS", icon: MessageSquare, color: "text-accent" },
  { value: "email", label: "Courriel", icon: Mail, color: "text-primary" },
  { value: "phone", label: "Appel vocal", icon: Phone, color: "text-accent" },
];

// ── Component ───────────────────────────────────────────────────────────────

const SettingsWizard = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("identity");

  // Identity
  const [name, setName] = useState("Lyss");
  const [role, setRole] = useState("adjointe");
  const [company, setCompany] = useState("");

  // Communication
  const [tone, setTone] = useState("tu");
  const [personality, setPersonality] = useState("chaleureuse");
  const [greetingStyle, setGreetingStyle] = useState("prenom");
  const [followUpClosing, setFollowUpClosing] = useState("Bonne journée !");

  // Channels & hours
  const [activeChannels, setActiveChannels] = useState<string[]>(["sms", "email", "phone"]);
  const [workStart, setWorkStart] = useState("08:00");
  const [workEnd, setWorkEnd] = useState("18:00");
  const [workDays, setWorkDays] = useState<string[]>(["lun", "mar", "mer", "jeu", "ven"]);

  // Voice
  // Vapi key removed - calls via Telnyx
  const [customInstructions, setCustomInstructions] = useState("");
  const [firstMessageTemplate, setFirstMessageTemplate] = useState("");

  // AI behavior
  const [aiProposePlan, setAiProposePlan] = useState(true);
  const [aiNegotiate, setAiNegotiate] = useState(false);
  const [aiMaxDiscount, setAiMaxDiscount] = useState(0);

  // Messages
  const [smsSignature, setSmsSignature] = useState("");
  const [emailSignature, setEmailSignature] = useState("");

  // Payment
  const [interacEmail, setInteracEmail] = useState("");
  const [interacQuestion, setInteracQuestion] = useState("Paiement");
  const [interacAnswer, setInteracAnswer] = useState("");
  const [stripeLink, setStripeLink] = useState("");
  const [allowDisputes, setAllowDisputes] = useState(false);

  // Notifications
  const [notifyResponse, setNotifyResponse] = useState(true);
  const [notifyPayment, setNotifyPayment] = useState(true);
  const [notifyDispute, setNotifyDispute] = useState(true);
  const [notifyNegative, setNotifyNegative] = useState(true);

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
      setTone(d.tone || "tu");
      setPersonality(d.vapi_personality || "chaleureuse");
      setGreetingStyle(d.greeting_style || "prenom");
      setFollowUpClosing(d.follow_up_closing || "Bonne journée !");
      setActiveChannels(d.active_channels || ["sms", "email", "phone"]);
      setWorkStart(d.working_hours_start || "08:00");
      setWorkEnd(d.working_hours_end || "18:00");
      setWorkDays(d.working_days || ["lun", "mar", "mer", "jeu", "ven"]);
      setVapiPublicKey(d.vapi_public_key || "");
      setVoiceId(d.vapi_voice_id || "21m00Tcm4TlvDq8ikWAM");
      setCustomInstructions(d.vapi_custom_instructions || "");
      setFirstMessageTemplate(d.vapi_first_message_template || "");
      setAiProposePlan(d.ai_propose_payment_plan ?? true);
      setAiNegotiate(d.ai_negotiate ?? false);
      setAiMaxDiscount(d.ai_max_discount_percent ?? 0);
      setSmsSignature(d.sms_signature || "");
      setEmailSignature(d.email_signature || "");
      setInteracEmail(d.interac_email || "");
      setInteracQuestion(d.interac_question || "Paiement");
      setInteracAnswer(d.interac_answer || "");
      setStripeLink(d.stripe_link || "");
      setAllowDisputes(d.allow_disputes ?? false);
      setNotifyResponse(d.notify_on_response ?? true);
      setNotifyPayment(d.notify_on_payment ?? true);
      setNotifyDispute(d.notify_on_dispute ?? true);
      setNotifyNegative(d.notify_on_negative_sentiment ?? true);
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
        tone,
        vapi_personality: personality,
        greeting_style: greetingStyle,
        follow_up_closing: followUpClosing,
        active_channels: activeChannels,
        working_hours_start: workStart,
        working_hours_end: workEnd,
        working_days: workDays,
        vapi_public_key: vapiPublicKey || null,
        vapi_voice_provider: selectedVoice?.provider || "elevenlabs",
        vapi_voice_id: voiceId,
        vapi_custom_instructions: customInstructions || null,
        vapi_first_message_template: firstMessageTemplate || null,
        ai_propose_payment_plan: aiProposePlan,
        ai_negotiate: aiNegotiate,
        ai_max_discount_percent: aiMaxDiscount,
        sms_signature: smsSignature || null,
        email_signature: emailSignature || null,
        interac_email: interacEmail || null,
        interac_question: interacQuestion || null,
        interac_answer: interacAnswer || null,
        stripe_link: stripeLink || null,
        allow_disputes: allowDisputes,
        notify_on_response: notifyResponse,
        notify_on_payment: notifyPayment,
        notify_on_dispute: notifyDispute,
        notify_on_negative_sentiment: notifyNegative,
      } as any, { onConflict: "user_id" });

    if (error) {
      toast.error("Erreur lors de la sauvegarde.");
    } else {
      toast.success("Réglages sauvegardés ✓");
    }
    setSaving(false);
  };

  const toggleChannel = (ch: string) => {
    setActiveChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
  };

  const toggleDay = (day: string) => {
    setWorkDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggle = (id: string) => setOpenSection(openSection === id ? null : id);

  const roleLabel = roles.find(r => r.value === role)?.label || "Adjointe";
  const companyDisplay = company || "Ton entreprise";
  const selectedPersonality = personalities.find(p => p.value === personality);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-3">
      {/* ── 1. Identity ── */}
      <SettingsSection
        id="identity"
        icon={UserCircle}
        title="Identité de l'adjointe"
        description={`${name} · ${roleLabel} · ${companyDisplay}`}
        open={openSection === "identity"}
        onToggle={() => toggle("identity")}
      >
        <div className="space-y-4">
          <Field icon={UserCircle} label="Prénom" hint="Utilisé dans chaque message.">
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Lyss" className="bg-secondary" />
          </Field>
          <Field icon={Building2} label="Entreprise" hint="Injecté dans les SMS, courriels et appels.">
            <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Plomberie Lévis" className="bg-secondary" />
          </Field>
          <Field icon={BadgeCheck} label="Titre professionnel">
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </SettingsSection>

      {/* ── 2. Tone & style ── */}
      <SettingsSection
        id="tone"
        icon={Globe}
        title="Ton & style de communication"
        description={`${tone === "tu" ? "Tutoiement" : "Vouvoiement"} · ${selectedPersonality?.label}`}
        open={openSection === "tone"}
        onToggle={() => toggle("tone")}
      >
        <div className="space-y-4">
          {/* Tu / Vous toggle */}
          <div>
            <p className="text-sm font-medium mb-2">Niveau de langage</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "tu", label: "Tutoiement", desc: "Construction, services, PME" },
                { value: "vous", label: "Vouvoiement", desc: "Professions libérales" },
              ].map(t => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all",
                    tone === t.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <span className="text-sm font-semibold">{t.label}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Personality */}
          <div>
            <p className="text-sm font-medium mb-2">Personnalité</p>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {personalities.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPersonality(p.value)}
                  className={cn(
                    "flex flex-col items-center text-center p-2.5 sm:p-3 rounded-xl border transition-all",
                    personality === p.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <span className="text-xl mb-0.5">{p.label.split(" ")[0]}</span>
                  <span className="text-[10px] sm:text-xs font-semibold leading-tight">{p.label.split(" ").slice(1).join(" ")}</span>
                  <span className="text-[9px] text-muted-foreground mt-0.5 leading-tight hidden sm:block">{p.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Greeting style */}
          <Field icon={MessageSquare} label="Comment saluer le client ?">
            <Select value={greetingStyle} onValueChange={setGreetingStyle}>
              <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="prenom">Par le prénom (« Bonjour Marc »)</SelectItem>
                <SelectItem value="nom_famille">Par le nom de famille (« M. Tremblay »)</SelectItem>
                <SelectItem value="entreprise">Par le nom d'entreprise</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {/* Closing */}
          <Field icon={FileText} label="Formule de clôture" hint="Ajoutée à la fin de chaque message.">
            <Input value={followUpClosing} onChange={e => setFollowUpClosing(e.target.value)} placeholder="Bonne journée !" className="bg-secondary" />
          </Field>
        </div>
      </SettingsSection>

      {/* ── 3. AI Behavior ── */}
      <SettingsSection
        id="ai"
        icon={Brain}
        title="Comportement de l'IA"
        description={`${aiProposePlan ? "Plans de paiement activés" : "Sans plan de paiement"}${aiNegotiate ? " · Négo activée" : ""}`}
        open={openSection === "ai"}
        onToggle={() => toggle("ai")}
      >
        <div className="space-y-4">
          <ToggleRow
            icon={HandCoins}
            title="Proposer des plans de paiement"
            description="Lyss suggère de diviser le montant en 2-3 versements"
            checked={aiProposePlan}
            onChange={setAiProposePlan}
          />
          <ToggleRow
            icon={Handshake}
            title="Autoriser la négociation"
            description="Lyss peut proposer un rabais pour paiement immédiat"
            checked={aiNegotiate}
            onChange={setAiNegotiate}
          />
          {aiNegotiate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              <Field icon={Banknote} label="Rabais maximum autorisé (%)" hint="Ex: 5% = max 50$ de rabais sur une facture de 1000$.">
                <Input
                  type="number"
                  value={aiMaxDiscount}
                  onChange={e => setAiMaxDiscount(parseInt(e.target.value) || 0)}
                  className="bg-secondary w-24"
                  min={0}
                  max={25}
                />
              </Field>
            </motion.div>
          )}
          <Field icon={FileText} label="Instructions personnalisées (optionnel)" hint="Ajoutées au prompt de l'IA. Ex: mentionner la promo du mois.">
            <Textarea value={customInstructions} onChange={e => setCustomInstructions(e.target.value)} placeholder="Toujours mentionner que le paiement Interac est instantané…" className="bg-secondary min-h-[70px] text-sm" />
          </Field>
        </div>
      </SettingsSection>

      {/* ── 4. Channels & hours ── */}
      <SettingsSection
        id="channels"
        icon={Clock}
        title="Canaux & horaires"
        description={`${activeChannels.length} canal${activeChannels.length > 1 ? "x" : ""} · ${workStart}–${workEnd}`}
        open={openSection === "channels"}
        onToggle={() => toggle("channels")}
      >
        <div className="space-y-4">
          {/* Active channels */}
          <div>
            <p className="text-sm font-medium mb-2">Canaux actifs</p>
            <div className="flex gap-2">
              {channelsList.map(ch => {
                const active = activeChannels.includes(ch.value);
                return (
                  <button
                    key={ch.value}
                    onClick={() => toggleChannel(ch.value)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all flex-1 justify-center",
                      active
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border bg-card hover:border-primary/30 opacity-50"
                    )}
                  >
                    <ch.icon className={`w-4 h-4 ${active ? ch.color : "text-muted-foreground"}`} />
                    <span className="text-xs font-medium">{ch.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Working hours */}
          <div>
            <p className="text-sm font-medium mb-2">Heures de contact</p>
            <div className="flex items-center gap-3">
              <Input type="time" value={workStart} onChange={e => setWorkStart(e.target.value)} className="bg-secondary w-28" />
              <span className="text-sm text-muted-foreground">à</span>
              <Input type="time" value={workEnd} onChange={e => setWorkEnd(e.target.value)} className="bg-secondary w-28" />
            </div>
          </div>

          {/* Working days */}
          <div>
            <p className="text-sm font-medium mb-2">Jours actifs</p>
            <div className="flex gap-1.5">
              {allDays.map(d => {
                const active = workDays.includes(d.value);
                return (
                  <button
                    key={d.value}
                    onClick={() => toggleDay(d.value)}
                    className={cn(
                      "w-9 h-9 rounded-lg text-xs font-semibold transition-all",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    )}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* ── 5. Voice ── */}
      <SettingsSection
        id="voice"
        icon={Mic2}
        title="Voix de l'agent"
        description={voices.find(v => v.id === voiceId)?.label || "Non configuré"}
        open={openSection === "voice"}
        onToggle={() => toggle("voice")}
      >
        <div className="space-y-4">
          <Field icon={Mic2} label="Voix ElevenLabs">
            <Select value={voiceId} onValueChange={setVoiceId}>
              <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
              <SelectContent>
                {voices.map(v => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field icon={MessageSquare} label="Premier message de l'appel" hint="Variables : {prénom}, {montant}, {facture}, {nom_assistant}, {entreprise}">
            <Textarea value={firstMessageTemplate} onChange={e => setFirstMessageTemplate(e.target.value)} placeholder="Bonjour {prénom}, c'est {nom_assistant}…" className="bg-secondary min-h-[60px] text-sm" />
          </Field>
          <Field icon={Key} label="Clé publique Vapi (optionnel)" hint="Dashboard Vapi → Settings → Public Key.">
            <Input value={vapiPublicKey} onChange={e => setVapiPublicKey(e.target.value)} placeholder="xxxxxxxx-xxxx-…" className="bg-secondary font-mono text-xs" />
          </Field>
        </div>
      </SettingsSection>

      {/* ── 6. Messages ── */}
      <SettingsSection
        id="messages"
        icon={MessageSquare}
        title="Signatures & messages"
        description={smsSignature ? "Signature configurée" : "Aucune signature"}
        open={openSection === "messages"}
        onToggle={() => toggle("messages")}
      >
        <div className="space-y-4">
          <Field icon={MessageSquare} label="Signature SMS" hint="Ajoutée à la fin de chaque SMS. Ex: — Lyss, Plomberie Lévis">
            <Input value={smsSignature} onChange={e => setSmsSignature(e.target.value)} placeholder="— Lyss, Plomberie Lévis" className="bg-secondary" />
          </Field>
          <Field icon={Mail} label="Signature courriel" hint="Bloc de signature ajouté aux courriels de suivi.">
            <Textarea value={emailSignature} onChange={e => setEmailSignature(e.target.value)} placeholder="Lyss&#10;Adjointe administrative&#10;Plomberie Lévis" className="bg-secondary min-h-[70px] text-sm" />
          </Field>
        </div>
      </SettingsSection>

      {/* ── 7. Sequences ── */}
      <SettingsSection
        id="sequences"
        icon={CalendarClock}
        title="Séquence automatique"
        description="J+3 SMS, J+7 courriel, J+14 appel"
        open={openSection === "sequences"}
        onToggle={() => toggle("sequences")}
      >
        <SequenceConfig />
      </SettingsSection>

      {/* ── 8. Payment ── */}
      <SettingsSection
        id="payment"
        icon={Banknote}
        title="Méthodes de paiement"
        description={interacEmail ? `Interac · ${interacEmail}` : "Non configuré"}
        open={openSection === "payment"}
        onToggle={() => toggle("payment")}
      >
        <div className="space-y-4">
          <div className="bg-secondary/50 border border-border/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Banknote className="w-4 h-4 text-accent" />
              <h4 className="font-medium text-sm">Virement Interac</h4>
            </div>
            <Input value={interacEmail} onChange={e => setInteracEmail(e.target.value)} placeholder="paiements@entreprise.ca" className="bg-card" />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Question</label>
                <Input value={interacQuestion} onChange={e => setInteracQuestion(e.target.value)} placeholder="Paiement" className="bg-card" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Réponse</label>
                <Input value={interacAnswer} onChange={e => setInteracAnswer(e.target.value)} placeholder="facture123" className="bg-card" />
              </div>
            </div>
          </div>

          <div className="bg-secondary/50 border border-border/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <h4 className="font-medium text-sm">Paiement par carte (Stripe)</h4>
            </div>
            <Input value={stripeLink} onChange={e => setStripeLink(e.target.value)} placeholder="https://buy.stripe.com/…" className="bg-card" />
            <p className="text-xs text-muted-foreground">Crée un lien depuis Stripe → Payment Links.</p>
          </div>

          <ToggleRow
            icon={ShieldAlert}
            title="Contestations"
            description="Clients peuvent signaler un problème via le portail"
            checked={allowDisputes}
            onChange={setAllowDisputes}
          />
        </div>
      </SettingsSection>

      {/* ── 9. Notifications ── */}
      <SettingsSection
        id="notifications"
        icon={Bell}
        title="Notifications"
        description="Ce que Lyss te signale"
        open={openSection === "notifications"}
        onToggle={() => toggle("notifications")}
      >
        <div className="space-y-3">
          <ToggleRow icon={MessageSquare} title="Réponse d'un client" description="Un client a répondu à un SMS" checked={notifyResponse} onChange={setNotifyResponse} />
          <ToggleRow icon={Banknote} title="Paiement reçu" description="Un dossier est marqué comme réglé" checked={notifyPayment} onChange={setNotifyPayment} />
          <ToggleRow icon={ShieldAlert} title="Contestation" description="Un client conteste une facture" checked={notifyDispute} onChange={setNotifyDispute} />
          <ToggleRow icon={Phone} title="Sentiment négatif" description="L'IA détecte une réaction négative" checked={notifyNegative} onChange={setNotifyNegative} />
        </div>
      </SettingsSection>

      {/* ── Preview card ── */}
      <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-primary">Aperçu en direct</h3>
        </div>
        <div className="bg-secondary rounded-xl rounded-tl-sm p-4 text-sm leading-relaxed mb-3">
          <p>
            {tone === "tu" ? "Bonjour" : "Bonjour"}{" "}
            {greetingStyle === "prenom" ? "Marc" : greetingStyle === "nom_famille" ? "M. Tremblay" : companyDisplay}, c'est{" "}
            <span className="text-primary font-medium">{name || "Lyss"}</span>,{" "}
            {roleLabel.charAt(0).toLowerCase() + roleLabel.slice(1)} chez{" "}
            <span className="text-primary font-medium">{companyDisplay}</span>.{" "}
            {tone === "tu"
              ? "Suivi pour ta facture #1247 (850 $). On comprend que ça peut arriver !"
              : "Je vous contacte concernant votre facture #1247 (850 $). Nous comprenons que cela peut arriver."
            }
            {aiProposePlan && (tone === "tu"
              ? " Si tu préfères, on peut diviser ça en 2 paiements."
              : " Si vous le souhaitez, nous pouvons diviser ce montant en 2 versements."
            )}
          </p>
          {smsSignature && <p className="mt-2 text-xs text-muted-foreground">{smsSignature}</p>}
          <p className="mt-1 text-xs text-muted-foreground italic">{followUpClosing}</p>
        </div>
      </div>

      {/* Save button */}
      <Button
        onClick={saveAll}
        disabled={saving}
        className="w-full bg-primary text-primary-foreground font-display h-11 text-sm"
        size="lg"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Sauvegarder tous les réglages
      </Button>
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────

interface SettingsSectionProps {
  id: string;
  icon: any;
  title: string;
  description: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const SettingsSection = ({ icon: Icon, title, description, open, onToggle, children }: SettingsSectionProps) => (
  <div className="bg-card border border-border rounded-xl overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/30 transition-colors"
    >
      <div className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
        open ? "bg-primary/10" : "bg-secondary"
      )}>
        <Icon className={cn("w-4.5 h-4.5", open ? "text-primary" : "text-muted-foreground")} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-[11px] text-muted-foreground truncate">{description}</p>
      </div>
      <ChevronDown className={cn(
        "w-4 h-4 text-muted-foreground transition-transform flex-shrink-0",
        open && "rotate-180"
      )} />
    </button>
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="px-4 pb-4 pt-1 border-t border-border/50">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const ToggleRow = ({ icon: Icon, title, description, checked, onChange }: {
  icon: any; title: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-3 py-1">
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
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
