import { useEffect, useState } from "react";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import MessagePreview from "@/components/landing/MessagePreview";
import DashboardShowcase from "@/components/landing/DashboardShowcase";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import IntegrationSection from "@/components/landing/IntegrationSection";
import Footer from "@/components/landing/Footer";
import Dashboard from "@/components/dashboard/Dashboard";
import ExitIntentSurvey from "@/components/feedback/ExitIntentSurvey";
import FeedbackWidget from "@/components/dashboard/FeedbackWidget";

type View = "landing" | "dashboard";

const Index = () => {
  const [view, setView] = useState<View>("landing");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    console.info("[Index] mode test sans auth activé");
  }, []);

  useEffect(() => {
    console.info("[Index] état navigation", { view, mobileMenuOpen });
  }, [view, mobileMenuOpen]);

  const handleStart = () => {
    console.info("[Index] ouverture du dashboard sans connexion");
    setView("dashboard");
  };

  const handleBackToLanding = () => {
    console.info("[Index] retour à la landing");
    setView("landing");
  };

  const handleLogout = () => {
    console.info("[Index] fermeture de session simulée en mode test");
    setView("landing");
  };

  if (view === "dashboard") {
    return (
      <>
        <Dashboard onBack={handleBackToLanding} onLogout={handleLogout} />
        <FeedbackWidget />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-5 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <img src="/logo-lyss.png" alt="Lyss" className="h-9 object-contain" />

          <nav className="hidden sm:flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Comment ça marche
            </a>
            <a href="#integrations" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Intégrations
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={handleStart}
              className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-display"
            >
              Tableau de bord →
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden flex flex-col gap-1.5 p-1.5"
              aria-label="Menu"
            >
              <span className={`block w-5 h-0.5 bg-foreground transition-transform ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-5 h-0.5 bg-foreground transition-opacity ${mobileMenuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-0.5 bg-foreground transition-transform ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="sm:hidden mt-3 pb-2 border-t border-border pt-3 flex flex-col gap-3">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Comment ça marche
            </a>
            <a href="#integrations" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Intégrations
            </a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Tarifs
            </a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleStart();
              }}
              className="text-sm text-left text-muted-foreground hover:text-foreground transition-colors"
            >
              Ouvrir le tableau de bord
            </button>
          </nav>
        )}
      </header>

      <HeroSection onStart={handleStart} />
      <div id="how-it-works"><HowItWorks /></div>
      <MessagePreview />
      <div id="integrations"><IntegrationSection /></div>
      <div id="pricing"><PricingSection /></div>
      <div id="faq"><FAQSection /></div>
      <Footer />
      <ExitIntentSurvey />
    </div>
  );
};

export default Index;
