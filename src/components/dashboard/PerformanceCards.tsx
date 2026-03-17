import { motion } from "framer-motion";
import { Clock, TrendingUp, Handshake, DollarSign, Sparkles } from "lucide-react";

interface PerformanceCardsProps {
  hoursSaved: number;
  successRate: number;
  paymentPromises: number;
  predictedIncome: number;
}

const PerformanceCards = ({ hoursSaved, successRate, paymentPromises, predictedIncome }: PerformanceCardsProps) => {
  const formatMoney = (n: number) =>
    new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

  const cards = [
    {
      label: "Temps admin. sauvé",
      value: `${hoursSaved.toFixed(1)}h`,
      sublabel: "cette semaine",
      icon: Clock,
      gradient: "from-primary/15 to-primary/5",
      iconBg: "bg-primary/20",
      iconColor: "text-primary",
      valueColor: "text-primary",
    },
    {
      label: "Taux de succès",
      value: `${successRate}%`,
      sublabel: "des suivis",
      icon: TrendingUp,
      gradient: "from-accent/15 to-accent/5",
      iconBg: "bg-accent/20",
      iconColor: "text-accent",
      valueColor: "text-accent",
    },
    {
      label: "Promesses reçues",
      value: formatMoney(paymentPromises),
      sublabel: "en attente",
      icon: Handshake,
      gradient: "from-primary/15 to-primary/5",
      iconBg: "bg-primary/20",
      iconColor: "text-primary",
      valueColor: "text-primary",
    },
    {
      label: "Prévu d'ici vendredi",
      value: formatMoney(predictedIncome),
      sublabel: "estimation IA",
      icon: Sparkles,
      gradient: "from-accent/15 to-accent/5",
      iconBg: "bg-accent/20",
      iconColor: "text-accent",
      valueColor: "text-accent",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 15, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: i * 0.08, type: "spring", stiffness: 200 }}
          className={`relative bg-gradient-to-br ${card.gradient} border border-border rounded-xl p-3 sm:p-4 overflow-hidden`}
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${card.iconBg} flex items-center justify-center`}>
              <card.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${card.iconColor}`} />
            </div>
          </div>
          <p className={`font-display text-xl sm:text-2xl font-bold ${card.valueColor} leading-tight`}>{card.value}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">{card.label}</p>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground/60 mt-0.5 hidden sm:block">{card.sublabel}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default PerformanceCards;
