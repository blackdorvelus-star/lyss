import { motion } from "framer-motion";
import { Check, Shield, Zap } from "lucide-react";

const benefits = [
  "0 $ à l'inscription",
  "Aucun abonnement mensuel",
  "20 $ par facture traitée — SMS, courriels et appels inclus",
  "Paye seulement quand l'IA commence les relances",
  "3 crédits gratuits pour essayer le service",
];

const PricingSection = () => {
  return (
    <section className="px-5 py-16">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border border-primary/30 bg-primary/5 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl font-bold">Simple et transparent</h2>
          </div>

          {/* Price card */}
          <div className="bg-card rounded-xl p-5 border border-border mb-6 text-center">
            <p className="text-xs text-muted-foreground mb-1">Par facture traitée</p>
            <p className="font-display text-4xl font-bold text-primary">20 $</p>
            <p className="text-xs text-muted-foreground mt-1">Jusqu'à 5 SMS + 3 courriels + 2 appels IA</p>
          </div>

          <div className="space-y-3 mb-6">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-secondary-foreground">{b}</p>
              </div>
            ))}
          </div>

          {/* Free trial badge */}
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 flex items-center gap-3">
            <Zap className="w-5 h-5 text-accent flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Pack de bienvenue</p>
              <p className="text-xs text-muted-foreground">
                Tes 3 premières factures sont gratuites. Aucune carte de crédit requise.
              </p>
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border mt-4">
            <p className="text-sm text-muted-foreground mb-1">Exemple concret</p>
            <p className="text-sm leading-relaxed">
              Tu as une facture de <span className="text-accent font-semibold">1 200 $</span> en retard.
              Tu paies <span className="font-semibold">20 $</span> pour activer l'assistant.
              L'IA relance ton client et tu récupères{" "}
              <span className="text-primary font-bold">1 200 $</span>. ROI :{" "}
              <span className="text-primary font-bold">60x</span>.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
