import { useMemo } from "react";
import { TrendingUp, CalendarDays, DollarSign, ArrowUpRight } from "lucide-react";
import LyssAvatar from "@/components/LyssAvatar";

interface ForecastInvoice {
  amount: number;
  amount_recovered: number | null;
  status: string;
  due_date: string | null;
  created_at: string;
}

interface ForecastQuote {
  amount: number;
  status: string;
  expires_at: string | null;
}

interface ForecastPromise {
  amount: number;
  date: string;
}

interface CashflowForecastProps {
  invoices: ForecastInvoice[];
  quotes?: ForecastQuote[];
  paymentPromises?: ForecastPromise[];
}

const formatMoney = (n: number) =>
  new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

const CashflowForecast = ({ invoices, quotes = [], paymentPromises = [] }: CashflowForecastProps) => {
  const forecast = useMemo(() => {
    const now = new Date();
    const d30 = new Date(now.getTime() + 30 * 86400000);
    const d60 = new Date(now.getTime() + 60 * 86400000);
    const d90 = new Date(now.getTime() + 90 * 86400000);

    // Historical recovery rate
    const totalInv = invoices.length;
    const recoveredInv = invoices.filter((i) => i.status === "recovered").length;
    const histRate = totalInv > 0 ? recoveredInv / totalInv : 0.5;

    // Active invoices (not recovered/cancelled)
    const activeInvoices = invoices.filter(
      (i) => i.status !== "recovered" && i.status !== "cancelled"
    );

    // Promises (high confidence ~85%)
    const promiseTotal = paymentPromises.reduce((s, p) => s + p.amount, 0);

    // Pending quotes (weighted by conversion rate ~30%)
    const pendingQuotes = quotes.filter((q) => q.status === "sent");
    const quoteValue = pendingQuotes.reduce((s, q) => s + q.amount, 0);

    // Bucket invoices by due date
    const bucket = (deadline: Date) => {
      return activeInvoices
        .filter((i) => {
          const due = i.due_date ? new Date(i.due_date) : new Date(i.created_at);
          return due <= deadline;
        })
        .reduce((s, i) => s + i.amount - (i.amount_recovered || 0), 0);
    };

    const inv30 = bucket(d30);
    const inv60 = bucket(d60);
    const inv90 = bucket(d90);

    // Forecasts with weighted confidence
    const forecast30 = Math.round(inv30 * histRate * 0.9 + promiseTotal * 0.85);
    const forecast60 = Math.round(inv60 * histRate * 0.75 + promiseTotal * 0.85 + quoteValue * 0.15);
    const forecast90 = Math.round(inv90 * histRate * 0.6 + promiseTotal * 0.85 + quoteValue * 0.3);

    // Max for bar scaling
    const maxVal = Math.max(forecast30, forecast60, forecast90, 1);

    return {
      periods: [
        { label: "30 jours", value: forecast30, confidence: 90, color: "bg-primary" },
        { label: "60 jours", value: forecast60, confidence: 75, color: "bg-accent" },
        { label: "90 jours", value: forecast90, confidence: 60, color: "bg-muted-foreground" },
      ],
      maxVal,
      totalPipeline: activeInvoices.reduce((s, i) => s + i.amount - (i.amount_recovered || 0), 0) + quoteValue,
      promiseTotal,
      quoteValue,
      histRate: Math.round(histRate * 100),
    };
  }, [invoices, quotes, paymentPromises]);

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          Prévisions de trésorerie
        </h3>
        <span className="text-[10px] text-muted-foreground">
          Taux historique : {forecast.histRate}%
        </span>
      </div>

      {/* Forecast bars */}
      <div className="space-y-3 mb-4">
        {forecast.periods.map((period) => (
          <div key={period.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-medium">{period.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-sm font-bold">{formatMoney(period.value)}</span>
                <span className="text-[10px] text-muted-foreground">({period.confidence}%)</span>
              </div>
            </div>
            <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full ${period.color} rounded-full transition-all duration-700`}
                style={{ width: `${(period.value / forecast.maxVal) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
          <p className="font-display text-sm font-bold text-foreground">{formatMoney(forecast.totalPipeline)}</p>
          <p className="text-[10px] text-muted-foreground">Pipeline total</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
          <p className="font-display text-sm font-bold text-primary">{formatMoney(forecast.promiseTotal)}</p>
          <p className="text-[10px] text-muted-foreground">Promesses</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
          <p className="font-display text-sm font-bold text-accent">{formatMoney(forecast.quoteValue)}</p>
          <p className="text-[10px] text-muted-foreground">Soumissions</p>
        </div>
      </div>

      {/* Lyss insight */}
      <div className="flex items-start gap-2 mt-4 bg-primary/5 border border-primary/15 rounded-lg p-2.5">
        <LyssAvatar size="xs" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">Lyss</span> — Basé sur ton historique de recouvrement ({forecast.histRate}%), 
          les promesses de paiement et les soumissions en cours. Les prévisions s'affinent avec chaque dossier traité.
        </p>
      </div>
    </div>
  );
};

export default CashflowForecast;
