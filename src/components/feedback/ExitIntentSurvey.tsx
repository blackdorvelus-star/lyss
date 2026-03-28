import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { safeSupabase } from "@/lib/supabase-safe";
import { toast } from "sonner";

const EXIT_REASONS = [
  { id: "price", label: "Le prix est trop élevé", emoji: "💰" },
  { id: "not_ready", label: "Je ne suis pas prêt·e", emoji: "⏳" },
  { id: "not_clear", label: "Je ne comprends pas le service", emoji: "🤔" },
  { id: "competitor", label: "J'utilise déjà un autre outil", emoji: "🔄" },
  { id: "no_need", label: "Je n'ai pas ce problème", emoji: "✅" },
  { id: "other", label: "Autre raison", emoji: "💬" },
];

const MIN_TIME_SECONDS = 10; // Don't show immediately
const SHORT_VISIT_SECONDS = 300; // 5 minutes

const ExitIntentSurvey = () => {
  const [show, setShow] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const startTime = useRef(Date.now());
  const hasShown = useRef(false);
  const dismissed = useRef(false);

  const getTimeOnPage = () => Math.floor((Date.now() - startTime.current) / 1000);

  const triggerSurvey = useCallback(() => {
    if (hasShown.current || dismissed.current) return;
    if (getTimeOnPage() < MIN_TIME_SECONDS) return;
    hasShown.current = true;
    setShow(true);
  }, []);

  useEffect(() => {
    // Exit intent: mouse leaves viewport (desktop)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) triggerSurvey();
    };

    // Short visit timer: show after 5 min if still on page
    const timer = setTimeout(() => {
      if (!hasShown.current) triggerSurvey();
    }, SHORT_VISIT_SECONDS * 1000);

    // Tab visibility: user switches away
    const handleVisibility = () => {
      if (document.hidden && getTimeOnPage() > 30) triggerSurvey();
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearTimeout(timer);
    };
  }, [triggerSurvey]);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setSending(true);

    try {
      await safeSupabase.from("visitor_feedback").insert({
        feedback_type: "exit_intent",
        reason: selectedReason,
        details: details.trim() || null,
        page_time_seconds: getTimeOnPage(),
        page_url: window.location.pathname,
      });
      setSubmitted(true);
    } catch {
      toast.error("Erreur lors de l'envoi. Merci quand même !");
    } finally {
      setSending(false);
    }
  };

  const handleDismiss = () => {
    dismissed.current = true;
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && handleDismiss()}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-primary/5 border-b border-border px-6 py-5">
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base">
                    {submitted ? "Merci beaucoup ! 🙏" : "Un instant avant de partir…"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {submitted
                      ? "Ton feedback nous aide à s'améliorer."
                      : "Ton avis nous aiderait énormément à s'améliorer."}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {submitted ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Si jamais tu changes d'idée, Lyss sera toujours là pour t'aider avec tes factures.
                  </p>
                  <Button onClick={handleDismiss} variant="outline" size="sm">
                    Fermer
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Qu'est-ce qui t'a retenu de commencer ?
                  </p>

                  <div className="grid grid-cols-1 gap-2 mb-4">
                    {EXIT_REASONS.map((reason) => (
                      <button
                        key={reason.id}
                        onClick={() => setSelectedReason(reason.id)}
                        className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                          selectedReason === reason.id
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border hover:border-primary/30 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="mr-2">{reason.emoji}</span>
                        {reason.label}
                      </button>
                    ))}
                  </div>

                  {selectedReason && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                    >
                      <Textarea
                        placeholder="Un détail à ajouter ? (optionnel)"
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        className="mb-4 text-sm resize-none"
                        rows={2}
                      />
                    </motion.div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={!selectedReason || sending}
                      className="flex-1 bg-primary text-primary-foreground font-display"
                    >
                      {sending ? "Envoi…" : "Envoyer mon avis"}
                    </Button>
                    <Button onClick={handleDismiss} variant="ghost" className="text-muted-foreground">
                      Non merci
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentSurvey;
