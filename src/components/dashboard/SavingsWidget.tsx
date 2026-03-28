import { Clock, DollarSign, TrendingUp } from "lucide-react";

interface SavingsWidgetProps {
  tasksHandled: number;
  totalRecovered: number;
  minutesPerTask?: number;
  hourlyRate?: number;
}

const SavingsWidget = ({
  tasksHandled,
  totalRecovered,
  minutesPerTask = 30,
  hourlyRate = 32,
}: SavingsWidgetProps) => {
  const hoursSaved = (tasksHandled * minutesPerTask) / 60;
  const moneySaved = hoursSaved * hourlyRate;
  const totalValue = moneySaved + totalRecovered;

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-xs text-muted-foreground font-medium mb-4 uppercase tracking-wider">
        Économies réalisées
      </h3>
      
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="text-center">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
          <p className="font-display text-base sm:text-lg font-bold">{hoursSaved.toFixed(1)}h</p>
          <p className="text-[9px] sm:text-xs text-muted-foreground leading-tight">Temps libéré</p>
        </div>

        <div className="text-center">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
          </div>
          <p className="font-display text-base sm:text-lg font-bold">{formatMoney(moneySaved)}</p>
          <p className="text-[9px] sm:text-xs text-muted-foreground leading-tight">Valeur du temps</p>
        </div>

        <div className="text-center">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          </div>
          <p className="font-display text-base sm:text-lg font-bold">{formatMoney(totalValue)}</p>
          <p className="text-[9px] sm:text-xs text-muted-foreground leading-tight">Valeur totale</p>
        </div>
      </div>

      <div className="mt-4 bg-primary/5 border border-primary/15 rounded-lg px-3 py-2 text-center">
        <p className="text-xs text-muted-foreground">
          L'adjointe a géré <span className="text-primary font-semibold">{tasksHandled} dossiers</span> — 
          l'équivalent de <span className="text-accent font-semibold">{formatMoney(moneySaved)}</span> en salaire d'adjointe humaine.
        </p>
      </div>
    </div>
  );
};

export default SavingsWidget;
