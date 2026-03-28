import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TelnyxCallButtonProps {
  invoiceId: string;
  clientName: string;
  clientPhone: string | null;
  amount: number;
  invoiceNumber: string | null;
  onCallEnd?: () => void;
}

type CallStatus = "idle" | "connecting" | "active" | "ended";

const TelnyxCallButton = ({
  invoiceId,
  clientName,
  clientPhone,
  amount,
  invoiceNumber,
  onCallEnd,
}: TelnyxCallButtonProps) => {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [callControlId, setCallControlId] = useState<string | null>(null);

  const startCall = async () => {
    if (!clientPhone) {
      toast.error("Ce client n'a pas de numéro de téléphone.");
      return;
    }

    setStatus("connecting");

    try {
      const { data, error } = await supabase.functions.invoke("make-call", {
        body: {
          invoice_id: invoiceId,
          client_phone: clientPhone,
          client_name: clientName,
          amount,
          invoice_number: invoiceNumber,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || "Erreur lors de l'appel");
      }

      setCallControlId(data.call_control_id);
      setStatus("active");
      toast.success(`Appel lancé vers ${clientName}`);
    } catch (error: any) {
      console.error("Failed to start call:", error);
      setStatus("idle");
      toast.error(error.message || "Impossible de démarrer l'appel.");
    }
  };

  const endCall = async () => {
    if (callControlId) {
      try {
        await supabase.functions.invoke("hangup-call", {
          body: { call_control_id: callControlId },
        });
      } catch (e) {
        console.error("Error hanging up:", e);
      }
    }
    setStatus("ended");
    setTimeout(() => {
      setStatus("idle");
      setCallControlId(null);
      onCallEnd?.();
    }, 2000);
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
              {status === "active" && `Appel en cours — ${clientName}`}
              {status === "ended" && "Appel terminé"}
            </span>
          </div>
        </div>

        {status === "active" && (
          <Button
            size="sm"
            variant="destructive"
            onClick={endCall}
            className="gap-1.5"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            Raccrocher
          </Button>
        )}

        {status === "connecting" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Lancement de l'appel via Telnyx…
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default TelnyxCallButton;
