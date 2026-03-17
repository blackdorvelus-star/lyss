import { TrendingDown } from "lucide-react";

interface FinancialHealthProps {
  invoices: { created_at: string; amount: number; amount_recovered: number | null; status: string }[];
}

const FinancialHealth = ({ invoices }: FinancialHealthProps) => {
  const total = invoices.length;
  const recovered = invoices.filter((i) => i.status === "recovered").length;
  const inProgress = invoices.filter((i) => i.status === "in_progress").length;
  const pending = invoices.filter((i) => i.status === "pending").length;

  const recoveryRate = total > 0 ? Math.round((recovered / total) * 100) : 0;

  // Simulated DSO reduction
  const avgDSOBefore = 45;
  const avgDSONow = total > 0 ? Math.max(12, avgDSOBefore - recovered * 5 - inProgress * 2) : avgDSOBefore;
  const dsoReduction = avgDSOBefore - avgDSONow;

  const segments = [
    { label: "Réglé", count: recovered, color: "bg-primary" },
    { label: "En cours", count: inProgress, color: "bg-accent" },
    { label: "En attente", count: pending, color: "bg-muted-foreground/30" },
  ];

  const barTotal = Math.max(total, 1);

  return (
    <div className="bg-card border border-border rounded-xl p-3.5 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Santé financière
        </h3>
        {dsoReduction > 0 && (
          <div className="flex items-center gap-1 text-xs text-primary font-medium">
            <TrendingDown className="w-3.5 h-3.5" />
            DSO −{dsoReduction} jours
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-3 rounded-full bg-secondary overflow-hidden flex mb-3">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={`${seg.color} transition-all duration-500`}
            style={{ width: `${(seg.count / barTotal) * 100}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${seg.color}`} />
            <span className="text-xs text-muted-foreground">{seg.label} ({seg.count})</span>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <p className="font-display text-2xl font-bold text-primary">{recoveryRate}%</p>
          <p className="text-xs text-muted-foreground">Taux de règlement</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <p className="font-display text-2xl font-bold">{avgDSONow}<span className="text-sm font-normal text-muted-foreground"> j</span></p>
          <p className="text-xs text-muted-foreground">Délai moyen (DSO)</p>
        </div>
      </div>
    </div>
  );
};

export default FinancialHealth;
