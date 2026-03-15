import { motion } from "framer-motion";
import { Check, Shield } from "lucide-react";

const benefits = [
  "0 $ à l'inscription",
  "Aucun abonnement mensuel",
  "Commission de 10 % seulement sur le montant récupéré",
  "Si on récupère rien, tu paies rien",
  "Conforme aux lois québécoises sur le recouvrement",
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
            <h2 className="font-display text-xl font-bold">Zéro risque</h2>
          </div>

          <div className="space-y-3 mb-6">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-secondary-foreground">{b}</p>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground mb-1">Exemple concret</p>
            <p className="text-sm leading-relaxed">
              Tu as <span className="text-accent font-semibold">12 000 $</span> de factures en retard. 
              On en récupère <span className="text-primary font-semibold">8 500 $</span>. 
              Tu nous donnes <span className="font-semibold">850 $</span>, tu gardes{" "}
              <span className="text-primary font-bold">7 650 $</span> que t'avais déjà oublié.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
