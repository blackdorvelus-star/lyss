import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Loader2, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Vapi from "@vapi-ai/web";

interface VapiCallButtonProps {
  invoiceId: string;
  clientName: string;
  clientPhone: string | null;
  amount: number;
  invoiceNumber: string | null;
  vapiPublicKey: string | null;
  vapiConfig?: {
    voiceId?: string;
    voiceProvider?: string;
    personality?: string;
    customInstructions?: string;
    firstMessageTemplate?: string;
    assistantName?: string;
    assistantRole?: string;
    companyName?: string;
  };
  onCallEnd?: () => void;
}

type CallStatus = "idle" | "connecting" | "active" | "ended";

const VapiCallButton = ({
  invoiceId,
  clientName,
  clientPhone,
  amount,
  invoiceNumber,
  vapiPublicKey,
  vapiConfig,
  onCallEnd,
}: VapiCallButtonProps) => {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const vapiRef = useRef<Vapi | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callLogIdRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
      if (vapiRef.current) {
        vapiRef.current.stop();
        vapiRef.current = null;
      }
    };
  }, [cleanup]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(n);

  const startCall = async () => {
    if (!vapiPublicKey) {
      toast.error("Configure ta clé publique Vapi dans les réglages.");
      return;
    }

    if (!clientPhone) {
      toast.error("Ce client n'a pas de numéro de téléphone.");
      return;
    }

    setStatus("connecting");

    try {
      const vapi = new Vapi(vapiPublicKey);
      vapiRef.current = vapi;

      vapi.on("call-start", async () => {
        setStatus("active");
        setDuration(0);
        timerRef.current = setInterval(() => {
          setDuration((d) => d + 1);
        }, 1000);

        // Create call log immediately with vapi call id
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const vapiCallId = (vapi as any).call?.id || null;
          const { data } = await supabase.from("call_logs").insert({
            user_id: user.id,
            invoice_id: invoiceId,
            status: "active",
            vapi_call_id: vapiCallId,
          }).select("id").single();
          if (data) callLogIdRef.current = data.id;
        }
      });

      vapi.on("call-end", async () => {
        cleanup();
        setStatus("ended");

        // Update call log with local duration (webhook will overwrite with accurate data)
        if (callLogIdRef.current) {
          await supabase.from("call_logs")
            .update({
              status: "completed",
              duration_seconds: duration,
              ended_at: new Date().toISOString(),
            })
            .eq("id", callLogIdRef.current);
          callLogIdRef.current = null;
        }

        setTimeout(() => {
          setStatus("idle");
          setDuration(0);
          onCallEnd?.();
        }, 2000);
      });

      vapi.on("error", (error: any) => {
        console.error("Vapi error:", error);
        cleanup();
        setStatus("idle");
        toast.error("Erreur lors de l'appel. Vérifie ta configuration Vapi.");
      });

      const voiceId = vapiConfig?.voiceId || "21m00Tcm4TlvDq8ikWAM";
      const voiceProvider = vapiConfig?.voiceProvider || "elevenlabs";
      const personality = vapiConfig?.personality || "chaleureuse";
      const assistantName = vapiConfig?.assistantName || "Lyss";
      const assistantRole = vapiConfig?.assistantRole || "adjointe administrative";
      const companyName = vapiConfig?.companyName || "";
      const customInstructions = vapiConfig?.customInstructions || "";

      const personalityPrompts: Record<string, string> = {
        chaleureuse: "Parle en français québécois professionnel, naturel et chaleureux. Tutoie le client. Sois empathique et compréhensif.",
        professionnelle: "Parle en français formel et structuré. Vouvoie le client. Reste courtois et professionnel en tout temps.",
        perseverante: "Parle en français québécois professionnel. Tutoie le client. Sois direct mais respectueux, orienté vers la résolution rapide.",
      };

      const companyContext = companyName ? ` chez ${companyName}` : "";

      // Build first message
      let firstMessage = vapiConfig?.firstMessageTemplate || "";
      if (firstMessage) {
        firstMessage = firstMessage
          .replace("{prénom}", clientName.split(" ")[0])
          .replace("{montant}", formatMoney(amount))
          .replace("{facture}", invoiceNumber || "N/A")
          .replace("{nom_assistant}", assistantName)
          .replace("{rôle}", assistantRole)
          .replace("{entreprise}", companyName || "l'entreprise");
      } else {
        firstMessage = `Bonjour ${clientName.split(" ")[0]}, c'est ${assistantName}, ${assistantRole}${companyContext}. Je t'appelle pour un petit suivi de courtoisie concernant ta facture${invoiceNumber ? ` numéro ${invoiceNumber}` : ""} de ${formatMoney(amount)}. As-tu quelques minutes?`;
      }

      await vapi.start({
        model: {
          provider: "openai",
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `Tu es ${assistantName}, ${assistantRole}${companyContext}. Tu fais un appel de suivi de courtoisie pour une facture en attente.

CONTEXTE :
- Nom du client : ${clientName}
- Montant dû : ${formatMoney(amount)}
- Numéro de facture : ${invoiceNumber || "N/A"}

PERSONNALITÉ :
${personalityPrompts[personality] || personalityPrompts.chaleureuse}

RÈGLES :
- Propose des solutions flexibles (paiement en plusieurs fois, virement Interac)
- Ne menace JAMAIS, ne parle JAMAIS de conséquences légales
- Utilise le terme "suivi de courtoisie"
- Garde l'appel court et efficace (2-3 minutes max)
${customInstructions ? `\nINSTRUCTIONS SUPPLÉMENTAIRES :\n${customInstructions}` : ""}`,
            },
          ],
        },
        voice: {
          provider: voiceProvider as any,
          voiceId,
        },
        name: `Suivi - ${clientName}`,
        firstMessage,
      });
    } catch (error) {
      console.error("Failed to start Vapi call:", error);
      setStatus("idle");
      toast.error("Impossible de démarrer l'appel.");
    }
  };

  const endCall = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
  };

  const toggleMute = () => {
    if (vapiRef.current) {
      vapiRef.current.setMuted(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  if (status === "idle") {
    return (
      <Button
        size="sm"
        onClick={startCall}
        className="bg-primary text-primary-foreground font-display gap-1.5"
        disabled={!clientPhone}
      >
        <Phone className="w-3.5 h-3.5" />
        Lancer l'appel de suivi
      </Button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-primary/10 border border-primary/20 rounded-xl p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                status === "connecting"
                  ? "bg-accent animate-pulse"
                  : status === "active"
                  ? "bg-primary animate-pulse"
                  : "bg-muted-foreground"
              }`}
            />
            <span className="text-sm font-medium">
              {status === "connecting" && "Connexion en cours…"}
              {status === "active" && `Appel en cours — ${formatDuration(duration)}`}
              {status === "ended" && "Appel terminé"}
            </span>
          </div>
          {status === "active" && (
            <span className="text-xs text-muted-foreground">
              {clientName}
            </span>
          )}
        </div>

        {status === "active" && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={toggleMute}
              className="gap-1.5"
            >
              {isMuted ? (
                <MicOff className="w-3.5 h-3.5" />
              ) : (
                <Mic className="w-3.5 h-3.5" />
              )}
              {isMuted ? "Réactiver" : "Sourdine"}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={endCall}
              className="gap-1.5"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              Raccrocher
            </Button>
          </div>
        )}

        {status === "connecting" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Initialisation de l'agent vocal…
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default VapiCallButton;
