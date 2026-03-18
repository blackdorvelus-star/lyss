import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import MessagePreview from "@/components/landing/MessagePreview";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import IntegrationSection from "@/components/landing/IntegrationSection";
import Footer from "@/components/landing/Footer";

import Dashboard from "@/components/dashboard/Dashboard";
import AuthPage from "@/components/auth/AuthPage";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

type View = "landing" | "auth" | "onboarding" | "dashboard";

const Index = () => {
  const [view, setView] = useState<View>("landing");
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkOnboarding = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from("payment_settings")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .single();

    return (data as any)?.onboarding_completed === true;
  };

  const handleStart = async () => {
    // Skip auth for testing — go directly to dashboard
    if (session) {
      const completed = await checkOnboarding();
      setView(completed ? "dashboard" : "onboarding");
    } else {
      setView("dashboard");
    }
  };

  const handleAuth = async () => {
    const completed = await checkOnboarding();
    setView(completed ? "dashboard" : "onboarding");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView("landing");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (view === "auth" && !session) {
    return <AuthPage onAuth={handleAuth} />;
  }

  if (view === "onboarding") {
    return <OnboardingWizard onComplete={() => setView("dashboard")} />;
  }

  if (view === "dashboard") {
    return (
      <Dashboard
        onBack={() => setView("landing")}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-5 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <img src="/logo-lyss.png" alt="Lyss" className="h-9 object-contain" />

          {/* Desktop nav */}
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
            {session && (
              <button
                onClick={handleLogout}
                className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Déconnexion
              </button>
            )}
            <button
              onClick={handleStart}
              className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-display"
            >
              {session ? "Tableau de bord →" : "Connexion →"}
            </button>

            {/* Mobile hamburger */}
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

        {/* Mobile menu */}
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
            {session && (
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                Déconnexion
              </button>
            )}
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
    </div>
  );
};

export default Index;
