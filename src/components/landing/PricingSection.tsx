import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Calculator, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const plans = [
  {
    name: "Solo",
    price: "49",
    desc: "Travailleur autonome",
    included: "3 dossiers/mois",
    features: ["SMS + courriels", "Tableau de bord", "Ton personnalisable"],
    accent: false,
  },
  {
    name: "Pro",
    price: "149",
    desc: "PME",
    included: "10 dossiers/mois",
    features: ["Tout Solo +", "Appels vocaux IA", "QuickBooks & Sage", "Rapports hebdo"],
    accent: true,
    popular: true,
  },
  {
    name: "Entreprise",
    price: "Sur mesure",
    desc: "Volume élevé",
    included: "Illimité",
    features: ["Tout Pro +", "API complète", "Gestionnaire dédié", "SLA garanti"],
    accent: false,
  },
];

const PricingSection = () => {
  const [invoiceCount, setInvoiceCount] = useState(10);
  const humanCost = invoiceCount * 1.5 * 32;
  const lyssCost = invoiceCount <= 3 ? 49 : invoiceCount <= 10 ? 149 : 149 + (invoiceCount - 10) * 20;
  const savings = humanCost - lyssCost;

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

  return (
    <section className="px-5 py-10">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-1.5">
            Moins cher qu'un café par jour
          </h2>
          <p className="text-xs text-muted-foreground">
            Ton adjointe IA travaille 24/7 — sans vacances ni avantages sociaux.
          </p>
        </motion.div>

        {/* Plans — compact */}
        <div className="grid md:grid-cols-3 gap-3 mb-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`relative rounded-xl p-4 border ${
                plan.accent ? "border-primary/40 bg-primary/5" : "border-border bg-card"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                  Populaire
                </span>
              )}
              <h3 className="font-display font-bold text-sm">{plan.name}</h3>
              <p className="text-[10px] text-muted-foreground mb-2">{plan.desc}</p>
              <div className="mb-2">
                {plan.price === "Sur mesure" ? (
                  <span className="font-display text-xl font-bold">{plan.price}</span>
                ) : (
                  <>
                    <span className="font-display text-2xl font-bold">{plan.price}</span>
                    <span className="text-xs text-muted-foreground"> $/mois</span>
                  </>
                )}
              </div>
              <div className="bg-secondary/50 rounded-md px-2.5 py-1.5 mb-3">
                <p className="text-[10px] font-medium">{plan.included}</p>
              </div>
              <ul className="space-y-1.5 mb-4">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-1.5 text-[11px]">
                    <Check className="w-3 h-3 text-primary flex-shrink-0" />
                    <span className="text-secondary-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                className={`w-full font-display text-xs h-8 ${
                  plan.accent ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {plan.price === "Sur mesure" ? "Contacter" : "Commencer"}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Compact savings calculator */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border border-primary/20 bg-primary/5 rounded-xl p-4 sm:p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-4 h-4 text-primary" />
            <h3 className="font-display text-sm font-bold">Calculateur d'économies</h3>
          </div>
          <div className="sm:flex items-end gap-6">
            <div className="flex-1 mb-4 sm:mb-0">
              <label className="text-xs font-medium mb-2 block">
                Factures en retard par mois : <span className="text-primary font-bold">{invoiceCount}</span>
              </label>
              <Slider value={[invoiceCount]} onValueChange={(v) => setInvoiceCount(v[0])} min={1} max={50} step={1} />
            </div>
            <div className="flex gap-3 text-center">
              <div className="bg-card border border-border rounded-lg px-3 py-2 min-w-[90px]">
                <p className="text-[10px] text-muted-foreground">Humain</p>
                <p className="font-display font-bold text-sm text-destructive">{fmt(humanCost)}</p>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 min-w-[90px]">
                <p className="text-[10px] text-primary">Lyss</p>
                <p className="font-display font-bold text-sm text-primary">{fmt(lyssCost)}</p>
              </div>
              {savings > 0 && (
                <div className="bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 min-w-[90px]">
                  <p className="text-[10px] text-muted-foreground">Économie</p>
                  <p className="font-display font-bold text-sm text-accent">{fmt(savings)}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
