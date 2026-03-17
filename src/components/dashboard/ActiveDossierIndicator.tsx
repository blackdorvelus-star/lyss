import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface ActiveDossierIndicatorProps {
  activeDossiers: number;
}

const ActiveDossierIndicator = ({ activeDossiers }: ActiveDossierIndicatorProps) => {
  if (activeDossiers === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-lg px-3 py-2"
    >
      <div className="relative">
        <Sparkles className="w-4 h-4 text-primary" />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Sparkles className="w-4 h-4 text-primary" />
        </motion.div>
      </div>
      <span className="text-xs text-primary font-medium">
        Lyss travaille sur {activeDossiers} dossier{activeDossiers > 1 ? "s" : ""}…
      </span>
    </motion.div>
  );
};

export default ActiveDossierIndicator;
