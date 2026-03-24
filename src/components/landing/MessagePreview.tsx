import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, Phone, Mail, CreditCard, Clock, HandshakeIcon, Check } from "lucide-react";
import LyssAvatar from "@/components/LyssAvatar";

type Formality = "tu" | "vous";

const smsVariants: Record<Formality, { greeting: string; body: string }> = {
  tu: {
    greeting: "Bonjour Marc, c'est Lyss de Plomberie Lévis. Je fais un suivi pour la facture #1247 (850 $, due le 12 mars).",
    body: "On comprend que ça peut arriver ! Tu peux envoyer ton paiement directement à Plomberie Lévis par Interac. Si tu préfères, on peut diviser ça en 2 versements 👇",
  },
  vous: {
    greeting: "Bonjour M. Tremblay, c'est Lyss de Plomberie Lévis. Nous effectuons un suivi concernant la facture #1247 (850 $, échéance : 12 mars).",
    body: "Nous comprenons que des imprévus peuvent survenir. Vous pouvez effectuer votre paiement directement à Plomberie Lévis par Interac ou en 2 versements.",
  },
};

const actions = [
  { id: "sms", label: "SMS", icon: MessageSquare },
  { id: "email", label: "Courriel", icon: Mail },
  { id: "call", label: "Appel IA", icon: Phone },
  { id: "payment", label: "Plan paiement", icon: CreditCard },
  { id: "schedule", label: "Rappel", icon: Clock },
  { id: "negotiate", label: "Négociation", icon: HandshakeIcon },
];

const MessagePreview = () => {
  const [formality, setFormality] = useState<Formality>("tu");
  const [enabled, setEnabled] = useState<Set<string>>(new Set(["sms", "email", "payment"]));
  const variant = smsVariants[formality];

  const toggle = (id: string) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <section className="px-5 py-10">
      <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-4">
        {/* Left: actions */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <h3 className="font-display font-bold text-sm mb-1">Que doit faire Lyss ?</h3>
          <p className="text-[10px] text-muted-foreground mb-3">Active ou désactive les canaux selon tes besoins.</p>
          <div className="grid grid-cols-3 gap-1.5">
            {actions.map((a) => {
              const isOn = enabled.has(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => toggle(a.id)}
                  className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium transition-all border ${
                    isOn
                      ? "bg-primary/10 border-primary/30 text-primary"
                      : "bg-secondary/30 border-border text-muted-foreground hover:border-primary/20"
                  }`}
                >
                  {isOn ? <Check className="w-3.5 h-3.5" /> : <a.icon className="w-3.5 h-3.5" />}
                  {a.label}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2.5 text-center">
            <span className="text-primary font-semibold">{enabled.size}</span> action{enabled.size > 1 ? "s" : ""} activée{enabled.size > 1 ? "s" : ""}
          </p>
        </motion.div>

        {/* Right: SMS preview */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <LyssAvatar size="xs" />
              <div>
                <p className="text-xs font-medium">Lyss</p>
                <p className="text-[10px] text-muted-foreground">SMS automatisé</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-medium ${formality === "tu" ? "text-primary" : "text-muted-foreground"}`}>Tu</span>
              <Switch
                checked={formality === "vous"}
                onCheckedChange={(c) => setFormality(c ? "vous" : "tu")}
                className="scale-75"
              />
              <span className={`text-[10px] font-medium ${formality === "vous" ? "text-primary" : "text-muted-foreground"}`}>Vous</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={formality}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="bg-secondary rounded-lg rounded-tl-sm p-3 text-xs leading-relaxed"
            >
              <p>{variant.greeting}</p>
              <p className="mt-1.5">{variant.body}</p>
              <p className="mt-1.5 text-primary font-medium">→ Lien de paiement sécurisé</p>
            </motion.div>
          </AnimatePresence>

          <p className="text-[10px] text-muted-foreground text-center mt-2.5">
            Taux de réponse moyen : <span className="text-accent font-semibold">73 %</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default MessagePreview;
