import { motion } from "framer-motion";
import { AlertTriangle, Banknote, MessageSquare, ArrowRight, Clock, FileSignature } from "lucide-react";

interface PriorityItem {
  id: string;
  type: "promise" | "negative" | "response" | "quote";
  clientName: string;
  detail: string;
  date: string;
}

interface PriorityRadarProps {
  items: PriorityItem[];
  onNavigate?: (invoiceId: string) => void;
}

const typeConfig = {
  promise: {
    icon: Banknote,
    label: "Promesse de paiement",
    bg: "bg-primary/10",
    ring: "ring-primary/20",
    color: "text-primary",
    dot: "bg-primary",
  },
  negative: {
    icon: AlertTriangle,
    label: "Intervention requise",
    bg: "bg-destructive/10",
    ring: "ring-destructive/20",
    color: "text-destructive",
    dot: "bg-destructive",
  },
  response: {
    icon: MessageSquare,
    label: "Nouvelle réponse",
    bg: "bg-accent/10",
    ring: "ring-accent/20",
    color: "text-accent",
    dot: "bg-accent",
  },
  quote: {
    icon: FileSignature,
    label: "Soumission sans réponse",
    bg: "bg-amber-500/10",
    ring: "ring-amber-500/20",
    color: "text-amber-500",
    dot: "bg-amber-500",
  },
};

const PriorityRadar = ({ items, onNavigate }: PriorityRadarProps) => {
  const promises = items.filter((i) => i.type === "promise");
  const negatives = items.filter((i) => i.type === "negative");
  const responses = items.filter((i) => i.type === "response");
  const quotes = items.filter((i) => i.type === "quote");

  const groups = [
    { key: "negative", items: negatives },
    { key: "promise", items: promises },
    { key: "response", items: responses },
    { key: "quote", items: quotes },
  ].filter((g) => g.items.length > 0);

  if (items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-xs text-muted-foreground font-medium mb-4 uppercase tracking-wider">
          Radar de priorités
        </h3>
        <div className="flex flex-col items-center justify-center py-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Aucune action urgente détectée.<br />
            Lyss surveille vos dossiers en continu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Radar de priorités
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
          </span>
          <span className="text-[10px] text-destructive font-medium">{items.length} action{items.length > 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {negatives.length > 0 && (
          <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/20">
            {negatives.length} intervention{negatives.length > 1 ? "s" : ""}
          </span>
        )}
        {promises.length > 0 && (
          <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
            {promises.length} promesse{promises.length > 1 ? "s" : ""}
          </span>
        )}
        {responses.length > 0 && (
          <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-accent/10 text-accent ring-1 ring-accent/20">
            {responses.length} réponse{responses.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Items */}
      <div className="space-y-2">
        {groups.map((group) => {
          const cfg = typeConfig[group.key as keyof typeof typeConfig];
          return group.items.map((item, i) => {
            const Icon = cfg.icon;
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onNavigate?.(item.id)}
                className="w-full text-left flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-secondary/60 transition-colors group"
              >
                <div className={`w-7 h-7 rounded-md ${cfg.bg} flex items-center justify-center flex-shrink-0 ring-1 ${cfg.ring}`}>
                  <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{item.clientName}</p>
                  <p className="text-[10px] text-muted-foreground leading-snug">{item.detail}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{item.date}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0" />
              </motion.button>
            );
          });
        })}
      </div>
    </div>
  );
};

export type { PriorityItem };
export default PriorityRadar;
