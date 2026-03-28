import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, ThumbsUp, ThumbsDown, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { safeSupabase } from "@/lib/supabase-safe";
import { toast } from "sonner";
import LyssAvatar from "@/components/LyssAvatar";

const FEEDBACK_TOPICS = [
  { id: "feature", label: "Suggestion de fonctionnalité", emoji: "💡" },
  { id: "bug", label: "Problème technique", emoji: "🐛" },
  { id: "tone", label: "Ton des messages de Lyss", emoji: "🗣️" },
  { id: "ux", label: "Facilité d'utilisation", emoji: "🎯" },
  { id: "other", label: "Autre", emoji: "📝" },
];

const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sentiment, setSentiment] = useState<"positive" | "negative" | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setSending(true);
    try {
      await safeSupabase.from("visitor_feedback").insert({
        feedback_type: "user_feedback",
        reason: topic,
        details: `[${sentiment}] ${message}`.trim(),
        page_url: "/dashboard",
      });
      setSubmitted(true);
      toast.success("Merci pour ton feedback ! 🙏");
    } catch {
      toast.error("Erreur lors de l'envoi.");
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setSentiment(null);
    setTopic(null);
    setMessage("");
    setSubmitted(false);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 md:bottom-6 left-4 z-40 bg-card border border-border shadow-lg rounded-full px-3 py-2 flex items-center gap-2 hover:border-primary/30 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageSquare className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium text-foreground hidden sm:inline">Feedback</span>
      </motion.button>

      {/* Feedback panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-36 md:bottom-16 left-4 z-50 bg-card border border-border rounded-xl shadow-2xl w-80 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
              <div className="flex items-center gap-2">
                <LyssAvatar size="xs" />
                <span className="text-sm font-display font-bold">Ton avis compte</span>
              </div>
              <button onClick={reset} className="p-1 rounded hover:bg-secondary transition-colors">
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            <div className="px-4 py-4">
              {submitted ? (
                <div className="text-center py-4">
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="text-sm font-medium mb-1">Merci !</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Lyss s'améliore grâce à toi.
                  </p>
                  <Button onClick={reset} variant="outline" size="sm">
                    Fermer
                  </Button>
                </div>
              ) : (
                <>
                  {/* Step 1: Sentiment */}
                  {!sentiment && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Comment trouves-tu Lyss jusqu'ici ?
                      </p>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={() => setSentiment("positive")}
                          className="flex flex-col items-center gap-1.5 px-6 py-3 rounded-xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors"
                        >
                          <ThumbsUp className="w-6 h-6 text-primary" />
                          <span className="text-xs font-medium">J'aime 👍</span>
                        </button>
                        <button
                          onClick={() => setSentiment("negative")}
                          className="flex flex-col items-center gap-1.5 px-6 py-3 rounded-xl border border-border hover:border-destructive/30 hover:bg-destructive/5 transition-colors"
                        >
                          <ThumbsDown className="w-6 h-6 text-destructive" />
                          <span className="text-xs font-medium">À améliorer</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Topic */}
                  {sentiment && !topic && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <p className="text-sm text-muted-foreground mb-3">
                        {sentiment === "positive" ? "Super ! Qu'est-ce qui te plaît ?" : "Qu'est-ce qu'on pourrait améliorer ?"}
                      </p>
                      <div className="space-y-1.5">
                        {FEEDBACK_TOPICS.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setTopic(t.id)}
                            className="w-full text-left px-3 py-2 rounded-lg border border-border hover:border-primary/30 text-sm transition-colors"
                          >
                            <span className="mr-2">{t.emoji}</span>{t.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Message */}
                  {sentiment && topic && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <p className="text-sm text-muted-foreground mb-3">
                        Dis-nous en plus (optionnel) :
                      </p>
                      <Textarea
                        placeholder="Ton message ici…"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        className="text-sm resize-none mb-3"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSubmit}
                          disabled={sending}
                          className="flex-1 bg-primary text-primary-foreground font-display gap-1.5"
                          size="sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {sending ? "Envoi…" : "Envoyer"}
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          variant="ghost"
                          size="sm"
                          disabled={sending}
                          className="text-xs text-muted-foreground"
                        >
                          Passer
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackWidget;
