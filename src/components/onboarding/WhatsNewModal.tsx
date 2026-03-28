import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Wrench, Bell, Sparkles, ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: typeof Calendar;
  category: 'new' | 'improved' | 'fixed';
  learnMoreUrl?: string;
  section?: string; // Which dashboard section this belongs to
}

const features: Feature[] = [
  {
    id: 'calendar',
    title: 'Agenda intégré',
    description: 'Planifiez des rendez-vous avec vos clients directement depuis Lyss. Créez des types de rendez-vous, générez des créneaux disponibles, et envoyez des confirmations automatiques.',
    icon: Calendar,
    category: 'new',
    learnMoreUrl: '#calendar',
    section: 'calendar'
  },
  {
    id: 'integration-monitoring',
    title: 'Surveillance des intégrations',
    description: 'Vérifiez en un clin d\'œil l\'état de vos connexions QuickBooks, Sage, Telnyx et Relevance AI. Recevez des alertes en cas de problème de configuration.',
    icon: Wrench,
    category: 'new',
    learnMoreUrl: '#integrations',
    section: 'integrations'
  },
  {
    id: 'unified-states',
    title: 'États visuels unifiés',
    description: 'Loaders, messages d\'erreur et états vides cohérents dans toute l\'application pour une meilleure expérience utilisateur.',
    icon: Sparkles,
    category: 'improved',
    section: 'all'
  },
  {
    id: 'terminology',
    title: 'Terminologie améliorée',
    description: 'Navigation plus intuitive avec des termes clairs : "Nouvelle facture", "Factures en cours", "Devis", "Automatisation", etc.',
    icon: CheckCircle,
    category: 'improved',
    section: 'all'
  }
];

const getCategoryColor = (category: Feature['category']) => {
  switch (category) {
    case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'improved': return 'bg-green-100 text-green-800 border-green-200';
    case 'fixed': return 'bg-amber-100 text-amber-800 border-amber-200';
  }
};

const getCategoryLabel = (category: Feature['category']) => {
  switch (category) {
    case 'new': return 'Nouveau';
    case 'improved': return 'Amélioré';
    case 'fixed': return 'Corrigé';
  }
};

const WhatsNewModal = () => {
  const [open, setOpen] = useState(false);
  const [seenFeatures, setSeenFeatures] = useState<string[]>([]);

  useEffect(() => {
    // Check if user has seen the latest features
    const stored = localStorage.getItem('lyss_seen_features');
    const lastSeenVersion = localStorage.getItem('lyss_features_version');
    const currentVersion = '2026-03-27'; // Update this when adding new features
    
    if (stored) {
      setSeenFeatures(JSON.parse(stored));
    }

    // Show modal if new version or first time
    if (lastSeenVersion !== currentVersion || !stored) {
      setTimeout(() => {
        setOpen(true);
      }, 1000); // Small delay so page loads first
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem('lyss_seen_features', JSON.stringify(features.map(f => f.id)));
    localStorage.setItem('lyss_features_version', '2026-03-27');
  };

  const handleNavigate = (section?: string) => {
    if (section) {
      window.location.hash = section;
    }
    handleClose();
  };

  const unseenFeatures = features.filter(f => !seenFeatures.includes(f.id));

  if (unseenFeatures.length === 0 && !open) {
    return null;
  }

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Nouveautés dans Lyss
                </DialogTitle>
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary">
                  <Bell className="w-4 h-4 inline mr-2" />
                  {unseenFeatures.length} nouvelle(s) fonctionnalité(s) depuis votre dernière visite
                </p>
              </div>

              <div className="space-y-3">
                {features.map(feature => {
                  const Icon = feature.icon;
                  const isNew = !seenFeatures.includes(feature.id);
                  
                  return (
                    <motion.div
                      key={feature.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 border rounded-lg ${isNew ? 'border-primary/30 bg-primary/5' : 'border-border'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isNew ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Icon className={`w-5 h-5 ${isNew ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{feature.title}</h3>
                            <Badge variant="outline" className={getCategoryColor(feature.category)}>
                              {getCategoryLabel(feature.category)}
                            </Badge>
                            {isNew && (
                              <Badge variant="default" className="bg-primary">
                                Nouveau
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {feature.description}
                          </p>
                          
                          <div className="flex items-center gap-2">
                            {feature.learnMoreUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleNavigate(feature.section)}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Découvrir
                              </Button>
                            )}
                            
                            {feature.section && feature.section !== 'all' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleNavigate(feature.section)}
                              >
                                Aller à la section
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <Button variant="outline" onClick={handleClose}>
                    Fermer
                  </Button>
                  <Button onClick={handleClose}>
                    C'est parti !
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Vous pouvez toujours consulter ces nouveautés depuis les paramètres → Aide
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default WhatsNewModal;
