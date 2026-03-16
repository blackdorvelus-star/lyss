import { motion } from "framer-motion";
import { Phone, Clock, ThumbsUp, ThumbsDown, Minus, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export interface CallLog {
  id: string;
  invoice_id: string;
  vapi_call_id: string | null;
  status: string;
  duration_seconds: number | null;
  client_sentiment: string | null;
  call_result: string | null;
  summary: string | null;
  created_at: string;
  ended_at: string | null;
}

interface CallHistoryProps {
  calls: CallLog[];
  getClientName: (invoiceId: string) => string;
}

const sentimentConfig: Record<string, { label: string; icon: typeof ThumbsUp; color: string }> = {
  positive: { label: "Positif", icon: ThumbsUp, color: "text-primary" },
  neutral: { label: "Neutre", icon: Minus, color: "text-muted-foreground" },
  negative: { label: "Négatif", icon: ThumbsDown, color: "text-destructive" },
};

const resultConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  payment_promised: { label: "Paiement promis", icon: CheckCircle2, color: "text-primary" },
  callback_requested: { label: "Rappel demandé", icon: Phone, color: "text-accent" },
  no_answer: { label: "Sans réponse", icon: AlertCircle, color: "text-muted-foreground" },
  refused: { label: "Refusé", icon: XCircle, color: "text-destructive" },
  completed: { label: "Complété", icon: CheckCircle2, color: "text-primary" },
  initiated: { label: "Initié", icon: Phone, color: "text-accent" },
};

const formatDuration = (secs: number | null) => {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m${s.toString().padStart(2, "0")}s`;
};

const CallHistory = ({ calls, getClientName }: CallHistoryProps) => {
  if (calls.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-4 h-4 text-primary" />
          <h3 className="font-display font-bold text-sm">Historique des appels</h3>
        </div>
        <p className="text-xs text-muted-foreground text-center py-6">
          Aucun appel de suivi n'a encore été effectué.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Phone className="w-4 h-4 text-primary" />
        <h3 className="font-display font-bold text-sm">Historique des appels</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {calls.length} appel{calls.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-2">
        {calls.map((call) => {
          const sentiment = call.client_sentiment
            ? sentimentConfig[call.client_sentiment]
            : null;
          const result = resultConfig[call.call_result || call.status] || resultConfig.initiated;
          const SentimentIcon = sentiment?.icon;
          const ResultIcon = result.icon;

          return (
            <div
              key={call.id}
              className="bg-secondary rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ResultIcon className={`w-3.5 h-3.5 ${result.color}`} />
                  <span className="text-xs font-medium">{getClientName(call.invoice_id)}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(call.created_at).toLocaleDateString("fr-CA", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 ${result.color}`}>
                  {result.label}
                </span>

                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(call.duration_seconds)}
                </span>

                {sentiment && SentimentIcon && (
                  <span className={`text-xs flex items-center gap-1 ${sentiment.color}`}>
                    <SentimentIcon className="w-3 h-3" />
                    {sentiment.label}
                  </span>
                )}
              </div>

              {call.summary && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {call.summary}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default CallHistory;
