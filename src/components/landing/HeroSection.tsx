import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, MessageSquare, Phone, Mail, Monitor, Radar, Globe, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import LyssAvatar from "@/components/LyssAvatar";
import screenshotDashboard from "@/assets/screenshot-dashboard.jpg";
import screenshotRadar from "@/assets/screenshot-radar.jpg";
import screenshotPortal from "@/assets/screenshot-portal.jpg";
import screenshotMobile from "@/assets/screenshot-mobile.jpg";

interface HeroSectionProps {
  onStart: () => void;
  onDemo?: () => void;
}

const screenshots = [
  { id: "dashboard", label: "Dashboard", icon: Monitor, img: screenshotDashboard },
  { id: "radar", label: "Radar", icon: Radar, img: screenshotRadar },
  { id: "portal", label: "Portail client", icon: Globe, img: screenshotPortal },
  { id: "mobile", label: "Mobile", icon: Smartphone, img: screenshotMobile },
];

const channels = [
  { icon: MessageSquare, label: "SMS" },
  { icon: Mail, label: "Courriel" },
  { icon: Phone, label: "Appel IA" },
];

const HeroSection = ({ onStart }: HeroSectionProps) => {
  const [activeScreen, setActiveScreen] = useState("dashboard");
  const current = screenshots.find((s) => s.id === activeScreen)!;

  return (
    <section className="relative px-5 pt-12 sm:pt-16 pb-8 overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-primary/6 blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Top: Text + CTA */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-5"
          >
            <Sparkles className="w-3 h-3" />
            Adjointe IA pour PME québécoises
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight mb-4"
          >
            Récupère tes{" "}
            <span className="text-primary">factures impayées</span>
            {" "}pendant que tu travailles.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-5 max-w-md mx-auto"
          >
            Lyss relance tes clients par SMS, courriel et appel vocal — 
            avec un ton québécois professionnel. Zéro stress.
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
            <span className="text-xs text-muted-foreground">
              3 crédits offerts · 49 $/mois · Sans engagement
            </span>
          </motion.div>
        </div>

        {/* Dashboard preview — compact with tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          {/* Tab bar */}
          <div className="flex justify-center gap-1 mb-3">
            {screenshots.map((s) => {
              const isActive = activeScreen === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveScreen(s.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <s.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Screenshot frame */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl border border-border bg-card overflow-hidden shadow-xl shadow-primary/5"
            >
              <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border bg-secondary/40">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-destructive/50" />
                  <div className="w-2 h-2 rounded-full bg-accent/50" />
                  <div className="w-2 h-2 rounded-full bg-primary/50" />
                </div>
                <div className="flex-1 mx-6">
                  <div className="bg-background/50 rounded px-2 py-0.5 text-[9px] text-muted-foreground text-center font-mono">
                    lyss.ca/dashboard
                  </div>
                </div>
              </div>
              <img
                src={current.img}
                alt={current.label}
                className="w-full object-cover"
                loading="lazy"
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
