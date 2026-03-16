import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onStart: () => void;
}

const HeroSection = ({ onStart }: HeroSectionProps) => {
  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-5 pt-20 pb-12 overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/6 blur-[120px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Adjointe administrative IA
        </motion.div>

        <h1 className="font-display text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight mb-5">
          Ton bureau virtuel{" "}
          <span className="text-primary">qui travaille pour toi.</span>
        </h1>

        <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-md mx-auto">
          Suivi de facturation, gestion des rendez-vous, relations clients — 
          Admin-Flow s'occupe de ton administratif pendant que tu te concentres sur ton métier.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button
            size="lg"
            onClick={onStart}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold text-base px-8 h-13 animate-pulse-glow"
          >
            Essayer gratuitement
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 text-sm text-muted-foreground"
        >
          3 tâches gratuites · 20 $/facture traitée · Aucun abonnement
        </motion.p>
      </motion.div>
    </section>
  );
};

export default HeroSection;
