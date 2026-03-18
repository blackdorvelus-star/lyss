import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Radar, Globe, Smartphone } from "lucide-react";
import screenshotDashboard from "@/assets/screenshot-dashboard.jpg";
import screenshotRadar from "@/assets/screenshot-radar.jpg";
import screenshotPortal from "@/assets/screenshot-portal.jpg";
import screenshotMobile from "@/assets/screenshot-mobile.jpg";

const tabs = [
  { id: "dashboard", label: "Tableau de bord", icon: Monitor, img: screenshotDashboard, desc: "KPIs en temps réel, activité de Lyss, dossiers clients — tout en un coup d'œil." },
  { id: "radar", label: "Radar de priorités", icon: Radar, img: screenshotRadar, desc: "Les dossiers urgents remontent automatiquement : interventions, promesses, réponses." },
  { id: "portal", label: "Portail client", icon: Globe, img: screenshotPortal, desc: "Vos clients paient directement via Interac ou Stripe. Chat IA intégré." },
  { id: "mobile", label: "Mobile", icon: Smartphone, img: screenshotMobile, desc: "Gérez vos dossiers partout avec l'interface mobile optimisée." },
];

const DashboardShowcase = () => {
  const [active, setActive] = useState("dashboard");
  const current = tabs.find((t) => t.id === active)!;

  return (
    <section className="px-5 py-16 sm:py-24">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
            Vois ce que Lyss fait <span className="text-primary">pour toi</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            Un dashboard pensé pour les entrepreneurs québécois. Pas de complexité inutile — juste l'essentiel.
          </p>
        </motion.div>

        {/* Tab bar */}
        <div className="flex justify-center gap-1 sm:gap-2 mb-8 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Screenshot display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-2xl shadow-primary/5">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/50">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-accent/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/60" />
                </div>
                <div className="flex-1 mx-8">
                  <div className="bg-background/60 rounded-md px-3 py-1 text-[10px] text-muted-foreground text-center font-mono">
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
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">{current.desc}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default DashboardShowcase;
