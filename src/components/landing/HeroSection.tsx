import { motion } from "framer-motion";
import { ArrowRight, Sparkles, MessageSquare, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import LyssAvatar from "@/components/LyssAvatar";

interface HeroSectionProps {
  onStart: () => void;
  onDemo?: () => void;
}

const channels = [
  { icon: MessageSquare, label: "SMS" },
  { icon: Mail, label: "Courriel" },
  { icon: Phone, label: "Appel IA" },
];

const HeroSection = ({ onStart, onDemo }: HeroSectionProps) => {
  const navigate = useNavigate();

  return (
    <section className="relative px-5 pt-12 sm:pt-16 pb-8 overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-primary/6 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Top: Text + CTA */}
        <div className="text-center max-w-xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-5"
          >
            <Sparkles className="w-3 h-3" />
            Ta secrétaire IA — disponible 24/7
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight mb-4"
          >
            Ton adjointe IA qui{" "}
            <span className="text-primary">gère ton admin</span>
            {" "}pendant que tu travailles.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-5 max-w-md mx-auto"
          >
            Lyss suit tes factures, relance tes clients, gère les litiges et ferme tes dossiers — 
            du premier rappel au dernier dollar. Zéro stress.
          </motion.p>

          {/* Channel badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 mb-5"
          >
            {channels.map((ch) => (
              <span key={ch.label} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border text-xs text-muted-foreground">
                <ch.icon className="w-3 h-3 text-primary" />
                {ch.label}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex flex-col sm:flex-row gap-2.5 justify-center items-center"
          >
            <Button
              size="lg"
              onClick={onStart}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold text-sm px-7 h-11 animate-pulse-glow"
            >
              Essayer gratuitement
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/demo")}
              className="font-display font-semibold text-sm px-7 h-11 border-primary/30 text-primary hover:bg-primary/5"
            >
              Voir la démo
            </Button>
            <span className="text-xs text-muted-foreground">
              Libère 10h/semaine · 49 $/mois · Sans engagement
            </span>
          </motion.div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
