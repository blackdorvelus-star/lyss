import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Calculator, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

const plans = [
  {
    name: "Solo",
    price: "49",
    period: "/mois",
    desc: "Pour les travailleurs autonomes et micro-entreprises.",
    included: "3 dossiers inclus",
    extra: "25 $/dossier supplémentaire",
    features: [
      "Adjointe IA disponible 24/7",
      "SMS + courriels automatisés",
      "Tableau de bord en temps réel",
      "Ton personnalisable",
      "Numéro dédié québécois",
    ],
    accent: false,
    popular: false,
  },
  {
    name: "Pro",
    price: "149",
    period: "/mois",
    desc: "Pour les PME avec plusieurs clients à suivre.",
    included: "10 dossiers inclus",
    extra: "15 $/dossier supplémentaire",
    features: [
      "Tout le plan Solo, plus :",
      "Appels vocaux IA avancés",
      "Négociation de plans de paiement",
      "Message d'accueil personnalisé",
      "Rapports hebdomadaires",
      "Priorité sur le support",
    ],
    accent: true,
    popular: true,
  },
  {
    name: "Entreprise",
    price: "Sur mesure",
    period: "",
    desc: "Pour les entreprises avec un volume élevé.",
    included: "Dossiers illimités",
    extra: "Tarification sur mesure",
    features: [
      "Tout le plan Pro, plus :",
      "Intégration QuickBooks / Xero",
      "API complète",
      "Gestionnaire de compte dédié",
      "SLA garanti",
      "Facturation personnalisée",
    ],
    accent: false,
    popular: false,
  },
];

const PricingSection = () => {
  const [invoiceCount, setInvoiceCount] = useState(10);
  const [avgAmount, setAvgAmount] = useState(1500);

  // Calculations
  const humanCostPerHour = 32;
  const hoursPerInvoice = 1.5;
  const humanMonthlyCost = invoiceCount * hoursPerInvoice * humanCostPerHour;
  const humanYearlyCost = humanMonthlyCost * 12;

  const getLyssCost = () => {
    if (invoiceCount <= 3) return 49;
    if (invoiceCount <= 10) return 149 + Math.max(0, invoiceCount - 10) * 15;
    return 149 + (invoiceCount - 10) * 15;
  };
  const lyssMonthlyCost = getLyssCost();
  const savings = humanMonthlyCost - adminFlowMonthlyCost;
  const savingsPercent = humanMonthlyCost > 0 ? Math.round((savings / humanMonthlyCost) * 100) : 0;
  const potentialRecovery = invoiceCount * avgAmount * 0.7; // 70% recovery rate

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

  return (
    <section className="px-5 py-20" id="pricing">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl font-bold mb-3">
            Moins cher qu'un café par jour
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Pour le prix d'une fraction d'heure de secrétariat, 
            ton adjointe IA travaille 24/7 sans vacances ni avantages sociaux.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-4 mb-16">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 border ${
                plan.accent
                  ? "border-primary/40 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Populaire
                  </span>
                </div>
              )}

              <h3 className="font-display text-lg font-bold mb-1">{plan.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">{plan.desc}</p>

              <div className="mb-4">
                <span className="font-display text-3xl font-bold">
                  {plan.price === "Sur mesure" ? "" : ""}
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                )}
                {plan.price === "Sur mesure" && (
                  <span className="text-sm text-muted-foreground ml-1"> $</span>
                )}
              </div>

              <div className="bg-secondary/50 rounded-lg px-3 py-2 mb-4">
                <p className="text-xs font-medium text-foreground">{plan.included}</p>
                <p className="text-xs text-muted-foreground">{plan.extra}</p>
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-secondary-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full font-display ${
                  plan.accent
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {plan.price === "Sur mesure" ? "Nous contacter" : "Commencer"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Savings Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border border-primary/30 bg-primary/5 rounded-2xl p-6 md:p-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <Calculator className="w-5 h-5 text-primary" />
            <h3 className="font-display text-xl font-bold">Calculateur d'économies</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Factures en retard par mois : <span className="text-primary font-bold">{invoiceCount}</span>
                </label>
                <Slider
                  value={[invoiceCount]}
                  onValueChange={(v) => setInvoiceCount(v[0])}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Montant moyen par facture ($)
                </label>
                <Input
                  type="number"
                  value={avgAmount}
                  onChange={(e) => setAvgAmount(Number(e.target.value) || 0)}
                  className="bg-card"
                  placeholder="1500"
                />
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Créances totales en jeu</p>
                <p className="font-display text-2xl font-bold text-accent">
                  {formatMoney(invoiceCount * avgAmount)}
                </p>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Coût d'une adjointe humaine</p>
                <p className="font-display text-xl font-bold text-destructive">
                  {formatMoney(humanMonthlyCost)}<span className="text-sm font-normal text-muted-foreground">/mois</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {invoiceCount} factures × {hoursPerInvoice}h × {humanCostPerHour} $/h
                </p>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                <p className="text-xs text-primary mb-1">Coût avec Admin-Flow</p>
                <p className="font-display text-xl font-bold text-primary">
                  {formatMoney(adminFlowMonthlyCost)}<span className="text-sm font-normal text-muted-foreground">/mois</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Forfait {invoiceCount <= 3 ? "Solo" : "Pro"} + dossiers
                </p>
              </div>

              {savings > 0 && (
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-center">
                  <Sparkles className="w-5 h-5 text-accent mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Tu économises</p>
                  <p className="font-display text-2xl font-bold text-accent">
                    {formatMoney(savings)}<span className="text-sm font-normal">/mois</span>
                  </p>
                  <p className="text-xs text-primary font-medium mt-1">
                    {savingsPercent} % d'économie · {formatMoney(potentialRecovery)} en règlements potentiels
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Bottom note */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Tous les prix sont en dollars canadiens. Taxes en sus. Annulation en tout temps.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
