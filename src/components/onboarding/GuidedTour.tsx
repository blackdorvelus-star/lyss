import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Sparkles, FileText, Radar, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import LyssAvatar from "@/components/LyssAvatar";

interface GuidedTourProps {
  userName?: string;
  urgentCount?: number;
  onComplete: () => void;
  onNavigate?: (section: string) => void;
}

const tourSteps = [
  {
    icon: Sparkles,
    title: "Bienvenue ! Je suis Lyss, ton adjointe.",
    body: "Je m'occupe de relancer tes clients par SMS, courriel et appels téléphoniques — avec un ton professionnel québécois. Tu restes toujours informé(e).",
    cta: "Enchanté !",
  },
  {
    icon: FileText,
    title: "Confie-moi tes dossiers",
    body: "Importe tes factures impayées (manuellement ou via QuickBooks / Sage). Je génère automatiquement les messages et lance les suivis.",
    cta: "Compris",
    section: "import",
  },
  {
    icon: Radar,
    title: "Le Radar de priorités",
    body: "Les dossiers urgents remontent ici automatiquement : interventions requises, promesses de paiement, nouvelles réponses. Zéro dossier oublié.",
    cta: "Suivant",
  },
  {
    icon: MessageSquare,
    title: "Le Journal en temps réel",
    body: "Chaque action que je fais apparaît ici : SMS envoyé, courriel livré, appel complété. Tu peux même ajuster mon ton en un clic.",
    cta: "C'est parti ! 🚀",
  },
];

const GuidedTour = ({ userName, urgentCount = 0, onComplete, onNavigate }: GuidedTourProps) => {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const current = tourSteps[step];
  const isLast = step === tourSteps.length - 1;
  const Icon = current.icon;

  const handleNext = () => {
    if (isLast) {
      setVisible(false);
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    setVisible(false);
    onComplete();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleSkip} />

          {/* Card */}
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-card border border-border rounded-2xl shadow-2xl shadow-primary/10 max-w-sm w-full p-6"
          >
            {/* Close */}
            <button
              onClick={handleSkip}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Progress */}
            <div className="flex gap-1.5 mb-5">
              {tourSteps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= step ? "bg-primary" : "bg-border"
                  }`}
                />
              ))}
            </div>

            {/* Avatar + Icon */}
            <div className="flex items-center gap-3 mb-4">
              <LyssAvatar size="md" pulse />
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-4.5 h-4.5 text-primary" />
              </div>
            </div>

            {/* Content */}
            <h3 className="font-display text-lg font-bold mb-2">{current.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{current.body}</p>

            {/* Urgent count callout on first step */}
            {step === 0 && urgentCount > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
                <p className="text-xs text-destructive font-medium">
                  🔥 Tu as {urgentCount} dossier{urgentCount > 1 ? "s" : ""} urgent{urgentCount > 1 ? "s" : ""} qui nécessite{urgentCount > 1 ? "nt" : ""} ton attention.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Passer le tour →
              </button>
              <Button
                onClick={handleNext}
                className="bg-primary text-primary-foreground font-display"
              >
                {current.cta}
                {!isLast && <ArrowRight className="w-3.5 h-3.5 ml-1" />}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GuidedTour;
