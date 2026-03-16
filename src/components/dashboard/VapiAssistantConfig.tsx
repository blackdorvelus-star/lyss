import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Mic2, Sparkles, Save, Loader2, Check, FileText, Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const voices = [
  { id: "21m00Tcm4TlvDq8ikWAM", label: "Rachel — Chaleureuse (femme)", provider: "elevenlabs" },
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Bella — Douce (femme)", provider: "elevenlabs" },
  { id: "ErXwobaYiN019PkySvjV", label: "Antoni — Professionnel (homme)", provider: "elevenlabs" },
  { id: "VR6AewLTigWG4xSOukaG", label: "Arnold — Autoritaire (homme)", provider: "elevenlabs" },
  { id: "pNInz6obpgDQGcFmaJgB", label: "Adam — Neutre (homme)", provider: "elevenlabs" },
];

const personalities = [
  { value: "chaleureuse", label: "Chaleureuse", description: "Empathique, amicale, tutoiement naturel" },
  { value: "professionnelle", label: "Professionnelle", description: "Formelle, structurée, vouvoiement" },
  { value: "perseverante", label: "Persévérante", description: "Directe mais respectueuse, orientée résultat" },
];

export interface VapiConfig {
  voiceProvider: string;
  voiceId: string;
  personality: string;
  customInstructions: string;
  firstMessageTemplate: string;
}

interface VapiAssistantConfigProps {
  onConfigChange?: (config: VapiConfig) => void;
}

const VapiAssistantConfig = ({ onConfigChange }: VapiAssistantConfigProps) => {
  const [vapiPublicKey, setVapiPublicKey] = useState("");
  const [voiceId, setVoiceId] = useState("21m00Tcm4TlvDq8ikWAM");
  const [personality, setPersonality] = useState("chaleureuse");
  const [customInstructions, setCustomInstructions] = useState("");
  const [firstMessageTemplate, setFirstMessageTemplate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("payment_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      const d = data as any;
      setVapiPublicKey(d.vapi_public_key || "");
      setVoiceId(d.vapi_voice_id || "21m00Tcm4TlvDq8ikWAM");
      setPersonality(d.vapi_personality || "chaleureuse");
      setCustomInstructions(d.vapi_custom_instructions || "");
      setFirstMessageTemplate(d.vapi_first_message_template || "");
    }
    setLoading(false);
  };

  const saveConfig = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const selectedVoice = voices.find(v => v.id === voiceId);

    const { error } = await supabase
      .from("payment_settings")
      .upsert({
        user_id: user.id,
        vapi_public_key: vapiPublicKey || null,
        vapi_voice_provider: selectedVoice?.provider || "elevenlabs",
        vapi_voice_id: voiceId,
        vapi_personality: personality,
        vapi_custom_instructions: customInstructions || null,
        vapi_first_message_template: firstMessageTemplate || null,
      } as any, { onConflict: "user_id" });

    if (error) {
      toast.error("Erreur lors de la sauvegarde.");
    } else {
      setSaved(true);
      toast.success("Configuration de l'agent vocal sauvegardée !");
      onConfigChange?.({
        voiceProvider: selectedVoice?.provider || "elevenlabs",
        voiceId,
        personality,
        customInstructions,
        firstMessageTemplate,
      });
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const selectedPersonality = personalities.find(p => p.value === personality);
  const selectedVoice = voices.find(v => v.id === voiceId);

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
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          Agent vocal Vapi
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Configure la voix, la personnalité et les instructions de ton agent de suivi téléphonique.
        </p>
      </div>

      {/* Voice selection */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Mic2 className="w-4 h-4 text-primary" />
          <h4 className="font-medium text-sm">Voix de l'agent</h4>
        </div>
        <Select value={voiceId} onValueChange={setVoiceId}>
          <SelectTrigger className="bg-secondary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {voices.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Voix ElevenLabs utilisée lors des appels de suivi.
        </p>
      </div>

      {/* Personality selection */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <h4 className="font-medium text-sm">Personnalité</h4>
        </div>
        <div className="grid gap-2">
          {personalities.map((p) => (
            <button
              key={p.value}
              onClick={() => setPersonality(p.value)}
              className={`text-left rounded-lg border p-3 transition-all ${
                personality === p.value
                  ? "border-primary bg-primary/5"
                  : "border-border bg-secondary hover:border-primary/30"
              }`}
            >
              <span className="text-sm font-medium">{p.label}</span>
              <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom instructions */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h4 className="font-medium text-sm">Instructions personnalisées</h4>
        </div>
        <Textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder="Ex: Toujours proposer un plan de paiement en 3 versements. Mentionner que nous acceptons les virements Interac."
          className="bg-secondary min-h-[100px] text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Instructions additionnelles injectées dans le prompt de l'agent. Laisse vide pour utiliser le comportement par défaut.
        </p>
      </div>

      {/* First message template */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Mic2 className="w-4 h-4 text-accent" />
          <h4 className="font-medium text-sm">Premier message (optionnel)</h4>
        </div>
        <Textarea
          value={firstMessageTemplate}
          onChange={(e) => setFirstMessageTemplate(e.target.value)}
          placeholder="Bonjour {prénom}, c'est {nom_assistant}, {rôle} chez {entreprise}. Je t'appelle pour un petit suivi..."
          className="bg-secondary min-h-[80px] text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Variables disponibles : {"{prénom}"}, {"{montant}"}, {"{facture}"}, {"{nom_assistant}"}, {"{rôle}"}, {"{entreprise}"}
        </p>
      </div>

      <Button
        onClick={saveConfig}
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
        {saved ? "Sauvegardé !" : "Sauvegarder la configuration"}
      </Button>

      {/* Live preview */}
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Aperçu du comportement
        </p>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${voiceId}-${personality}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-2"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mic2 className="w-3.5 h-3.5" />
              <span>Voix : {selectedVoice?.label}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Style : {selectedPersonality?.label} — {selectedPersonality?.description}</span>
            </div>
            <div className="bg-secondary rounded-xl rounded-tl-sm p-4 text-sm leading-relaxed italic text-secondary-foreground mt-3">
              {personality === "chaleureuse" && (
                <p>« Bonjour Marc, c'est Lyss ! Je t'appelle juste pour un petit suivi concernant ta facture. T'inquiète pas, c'est vraiment informel — on veut juste s'assurer que tout est beau de ton côté. »</p>
              )}
              {personality === "professionnelle" && (
                <p>« Bonjour Monsieur Tremblay, ici Lyss, adjointe administrative. Je vous contacte dans le cadre d'un suivi de courtoisie concernant votre dossier de facturation. Auriez-vous un moment ? »</p>
              )}
              {personality === "perseverante" && (
                <p>« Bonjour Marc, c'est Lyss. Je te rappelle au sujet de ta facture en attente. On aimerait trouver une solution ensemble rapidement — est-ce qu'on peut en discuter maintenant ? »</p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VapiAssistantConfig;
