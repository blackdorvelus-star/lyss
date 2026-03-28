import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, X, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface FeatureTooltipProps {
  featureId: string;
  title: string;
  description: string;
  children: ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  section?: string;
  once?: boolean; // Show only once per session
}

const FeatureTooltip = ({
  featureId,
  title,
  description,
  children,
  position = 'top',
  section,
  once = true
}: FeatureTooltipProps) => {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (once) {
      const dismissedFeatures = JSON.parse(localStorage.getItem('lyss_dismissed_tooltips') || '[]');
      setDismissed(dismissedFeatures.includes(featureId));
    }
  }, [featureId, once]);

  const handleDismiss = () => {
    setOpen(false);
    if (once) {
      const dismissedFeatures = JSON.parse(localStorage.getItem('lyss_dismissed_tooltips') || '[]');
      dismissedFeatures.push(featureId);
      localStorage.setItem('lyss_dismissed_tooltips', JSON.stringify(dismissedFeatures));
      setDismissed(true);
    }
  };

  const handleNavigate = () => {
    if (section) {
      window.location.hash = section;
    }
    handleDismiss();
  };

  if (dismissed) {
    return <>{children}</>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative inline-block">
          {children}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-1 -right-1"
          >
            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
          </motion.div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80" side={position} align="start">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded">
                <HelpCircle className="w-4 h-4 text-primary" />
              </div>
              <h4 className="font-semibold">{title}</h4>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              <X className="w-3 h-3" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
          
          <div className="flex items-center justify-between pt-2 border-t">
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              Compris
            </Button>
            
            {section && (
              <Button variant="outline" size="sm" onClick={handleNavigate}>
                Voir la section
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Pre-configured tooltips for common new features
export const CalendarTooltip = ({ children }: { children: ReactNode }) => (
  <FeatureTooltip
    featureId="calendar_intro"
    title="Nouvel agenda intégré"
    description="Planifiez des rendez-vous avec vos clients. Créez des types de rendez-vous, générez des créneaux disponibles, et envoyez des confirmations automatiques."
    section="calendar"
  >
    {children}
  </FeatureTooltip>
);

export const IntegrationTooltip = ({ children }: { children: ReactNode }) => (
  <FeatureTooltip
    featureId="integration_monitoring"
    title="Surveillance des intégrations"
    description="Vérifiez l'état de vos connexions QuickBooks, Sage, Telnyx et Relevance AI. Recevez des alertes en cas de problème."
    section="integrations"
  >
    {children}
  </FeatureTooltip>
);

export const SequenceTooltip = ({ children }: { children: ReactNode }) => (
  <FeatureTooltip
    featureId="sequences_intro"
    title="Automatisation des suivis"
    description="Créez des séquences de messages automatiques pour suivre vos clients sans effort."
    section="sequences"
  >
    {children}
  </FeatureTooltip>
);

export default FeatureTooltip;
