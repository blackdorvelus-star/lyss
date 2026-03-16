import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Check, MessageSquare, Phone, Mail, CreditCard, Clock, HandshakeIcon } from "lucide-react";

type Formality = "tu" | "vous";

interface AiAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
}

const smsVariants: Record<Formality, { greeting: string; body: string }> = {
  tu: {
    greeting: "Bonjour Marc, c'est un suivi pour la facture #1247 de Plomberie Lévis (850 $, due le 12 mars).",
    body: "On comprend que ça peut arriver ! Si tu préfères, on peut diviser ça en 2 paiements Interac. Clique ici pour régler ça en 2 minutes 👇",
  },
  vous: {
    greeting: "Bonjour M. Tremblay, nous effectuons un suivi concernant la facture #1247 de Plomberie Lévis (850 $, échéance : 12 mars).",
    body: "Nous comprenons que des imprévus peuvent survenir. Si vous le souhaitez, il est possible de diviser ce montant en 2 versements par Interac. Vous pouvez régler le tout en quelques minutes 👇",
  },
};

const MessagePreview = () => {
  const [formality, setFormality] = useState<Formality>("tu");
  const [actions, setActions] = useState<AiAction[]>([
    { id: "sms", label: "SMS de courtoisie", icon: <MessageSquare className="w-3.5 h-3.5" />, enabled: true },
    { id: "email", label: "Courriel de suivi", icon: <Mail className="w-3.5 h-3.5" />, enabled: true },
    { id: "call", label: "Appel vocal IA", icon: <Phone className="w-3.5 h-3.5" />, enabled: false },
    { id: "payment", label: "Plan de paiement", icon: <CreditCard className="w-3.5 h-3.5" />, enabled: true },
    { id: "schedule", label: "Rappel planifié", icon: <Clock className="w-3.5 h-3.5" />, enabled: false },
    { id: "negotiate", label: "Négociation souple", icon: <HandshakeIcon className="w-3.5 h-3.5" />, enabled: false },
  ]);

  const toggleAction = (id: string) => {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const activeCount = actions.filter((a) => a.enabled).length;
  const variant = smsVariants[formality];

  return (
    <section className="px-5 py-16">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="font-display text-2xl font-bold mb-2">
            L'IA parle comme du monde
          </h2>
          <p className="text-sm text-muted-foreground">
            Pas de robot froid. Un ton humain, québécois, professionnel.
          </p>
        </motion.div>

        {/* Action selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card border border-border rounded-2xl p-5 mb-4"
        >
          <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wider">
            Que doit faire Lyss pour toi ?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => toggleAction(action.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium transition-all border ${
                  action.enabled
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/20"
                }`}
              >
                {action.enabled ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  action.icon
                )}
                {action.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            <span className="text-primary font-semibold">{activeCount}</span> action{activeCount > 1 ? "s" : ""} activée{activeCount > 1 ? "s" : ""}
          </p>
        </motion.div>

        {/* Tu/Vous toggle + SMS preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card border border-border rounded-2xl p-5 space-y-3"
        >
          {/* Header row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                IA
              </div>
              <div>
                <p className="text-sm font-medium">Lyss</p>
                <p className="text-xs text-muted-foreground">SMS automatisé</p>
              </div>
            </div>
            {/* Tu/Vous toggle */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${formality === "tu" ? "text-primary" : "text-muted-foreground"}`}>
                Tu
              </span>
              <Switch
                checked={formality === "vous"}
                onCheckedChange={(checked) => setFormality(checked ? "vous" : "tu")}
                className="scale-90"
              />
              <span className={`text-xs font-medium ${formality === "vous" ? "text-primary" : "text-muted-foreground"}`}>
                Vous
              </span>
            </div>
          </div>

          {/* Message bubble */}
          <AnimatePresence mode="wait">
            <motion.div
              key={formality}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="bg-secondary rounded-xl rounded-tl-sm p-4 text-sm leading-relaxed"
            >
              <p>{variant.greeting}</p>
              <p className="mt-2">{variant.body}</p>
              <p className="mt-2 text-primary font-medium">
                → Lien de paiement sécurisé
              </p>
            </motion.div>
          </AnimatePresence>

          <p className="text-xs text-muted-foreground text-center pt-2">
            Taux de réponse moyen : <span className="text-accent font-semibold">73 %</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default MessagePreview;
