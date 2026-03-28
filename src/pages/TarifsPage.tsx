import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight, ArrowLeft, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import Footer from "@/components/landing/Footer";

const plans = [
  {
    name: "Gratuit",
    price: "0",
    period: "",
    desc: "Pour essayer Lyss sans engagement.",
    included: "1 dossier inclus",
    extra: "Aucun dossier supplémentaire",
    features: [
      "Adjointe IA de base",
      "Tableau de bord",
      "1 relance par courriel",
    ],
    accent: false,
    popular: false,
  },
  {
    name: "Solo",
    price: "49",
    period: "/mois",
    desc: "Pour les travailleurs autonomes et micro-entreprises.",
    included: "3 dossiers inclus",
    extra: "20 $/dossier supplémentaire",
    features: [
      "Adjointe IA disponible 24/7",
      "SMS + courriels automatisés",
      "Tableau de bord en temps réel",
      "Ton personnalisable",
      "Widget client embarqué",
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
    extra: "20 $/dossier supplémentaire",
    features: [
      "Tout le plan Solo, plus :",
      "Nom d'adjointe personnalisable (marque blanche)",
      "Appels vocaux IA avancés",
      "Négociation de plans de paiement",
      "Intégration QuickBooks & Sage",
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
    extra: "Tarification dégressive",
    features: [
      "Tout le plan Pro, plus :",
      "Marque blanche complète",
      "Synchronisation comptable avancée",
      "API complète",
      "Gestionnaire de compte dédié",
      "SLA garanti",
      "Facturation personnalisée",
    ],
    accent: false,
    popular: false,
  },
];

const formatMoney = (n: number) =>
  new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

const TarifsPage = () => {
  const navigate = useNavigate();
  const [invoiceCount, setInvoiceCount] = useState(10);
  const [avgAmount, setAvgAmount] = useState(1500);

  const humanCostPerHour = 32;
  const hoursPerInvoice = 1.5;
  const humanMonthlyCost = invoiceCount * hoursPerInvoice * humanCostPerHour;
  const getLyssCost = () => {
    if (invoiceCount <= 1) return 0;
    if (invoiceCount <= 3) return 49;
    if (invoiceCount <= 10) return 149;
    return 149 + (invoiceCount - 10) * 20;
  };
  const lyssMonthlyCost = getLyssCost();
  const savings = humanMonthlyCost - lyssMonthlyCost;
  const savingsPercent = humanMonthlyCost > 0 ? Math.round((savings / humanMonthlyCost) * 100) : 0;
  const potentialRecovery = invoiceCount * avgAmount * 0.7;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-5 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src="/logo-lyss.png" alt="Lyss" className="h-9 object-contain" />
          </button>
          <nav className="hidden sm:flex items-center gap-6">
            <a onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              Accueil
            </a>
            <span className="text-sm text-foreground font-medium">Tarifs</span>
          </nav>
          <Button onClick={() => navigate("/")} className="bg-primary text-primary-foreground font-display text-sm">
            Commencer →
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <h1 className="font-display text-4xl font-bold mb-3">
            Des tarifs <span className="text-primary">simples et transparents</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-lg">
            Choisis le plan qui correspond à tes besoins. Commence gratuitement, évolue à ton rythme.
          </p>
        </motion.div>

        {/* Plans grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`relative rounded-2xl p-5 border ${
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
                {plan.price === "Sur mesure" ? (
                  <span className="font-display text-2xl font-bold">{plan.price}</span>
                ) : (
                  <>
                    <span className="font-display text-3xl font-bold">{plan.price} $</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </>
                )}
              </div>

              <div className="bg-secondary/50 rounded-lg px-3 py-2 mb-4">
                <p className="text-xs font-medium text-foreground">{plan.included}</p>
                <p className="text-xs text-muted-foreground">{plan.extra}</p>
              </div>

              <ul className="space-y-2 mb-5">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-secondary-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => navigate("/")}
                className={`w-full font-display ${
                  plan.accent
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {plan.price === "0" ? "Essayer" : plan.price === "Sur mesure" ? "Nous contacter" : "Commencer"}
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
          className="border border-primary/30 bg-primary/5 rounded-2xl p-6 md:p-8 mb-12"
        >
          <div className="flex items-center gap-2 mb-6">
            <Calculator className="w-5 h-5 text-primary" />
            <h3 className="font-display text-xl font-bold">Calculateur d'économies</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Factures en retard par mois : <span className="text-primary font-bold">{invoiceCount}</span>
                </label>
                <Slider
                  value={[invoiceCount]}
                  onValueChange={(v) => setInvoiceCount(v[0])}
                  min={1} max={50} step={1}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Montant moyen par facture ($)</label>
                <Input
                  type="number"
                  value={avgAmount}
                  onChange={(e) => setAvgAmount(Number(e.target.value) || 0)}
                  className="bg-card"
                />
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Créances totales en jeu</p>
                <p className="font-display text-2xl font-bold text-accent">{formatMoney(invoiceCount * avgAmount)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Coût d'une adjointe humaine</p>
                <p className="font-display text-xl font-bold text-destructive">{formatMoney(humanMonthlyCost)}<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                <p className="text-xs text-primary mb-1">Coût avec Lyss</p>
                <p className="font-display text-xl font-bold text-primary">{formatMoney(lyssMonthlyCost)}<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
              </div>
              {savings > 0 && (
                <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-center">
                  <Sparkles className="w-5 h-5 text-accent mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Tu économises</p>
                  <p className="font-display text-2xl font-bold text-accent">{formatMoney(savings)}<span className="text-sm font-normal">/mois</span></p>
                  <p className="text-xs text-primary font-medium mt-1">{savingsPercent} % d'économie · {formatMoney(potentialRecovery)} en récupération potentielle</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Bottom note */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Chaque dossier inclut tout :</span> appels vocaux IA, SMS, courriels de suivi, négociation, tableau de bord — aucun frais caché.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Tous les prix sont en dollars canadiens. Taxes en sus. Annulation en tout temps.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TarifsPage;
