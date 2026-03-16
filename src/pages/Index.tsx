import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import MessagePreview from "@/components/landing/MessagePreview";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import Footer from "@/components/landing/Footer";
import InvoiceUpload from "@/components/dashboard/InvoiceUpload";
import Dashboard from "@/components/dashboard/Dashboard";
import AuthPage from "@/components/auth/AuthPage";

type View = "landing" | "auth" | "upload" | "dashboard";

const Index = () => {
  const [view, setView] = useState<View>("landing");
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleStart = () => {
    if (session) {
      setView("dashboard");
    } else {
      setView("auth");
    }
  };

  const handleAuth = () => {
    setView("dashboard");
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

  if (view === "dashboard") {
    return (
      <Dashboard
        onBack={() => setView("landing")}
        onNewInvoice={() => setView("upload")}
        onLogout={handleLogout}
      />
    );
  }

  if (view === "upload") {
    return (
      <InvoiceUpload
        onBack={() => setView("dashboard")}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-5 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <img src="/logo-lyss.png" alt="Lyss" className="h-9 object-contain" style={{ filter: 'brightness(3) contrast(1.2) drop-shadow(0 0 10px hsl(160 30% 46% / 0.6))' }} />
          <div className="flex items-center gap-3">
            {session && (
              <button
                onClick={handleLogout}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Déconnexion
              </button>
            )}
            <button
              onClick={handleStart}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {session ? "Tableau de bord →" : "Commencer →"}
            </button>
          </div>
        </div>
      </header>

      <HeroSection onStart={handleStart} />
      <HowItWorks />
      <MessagePreview />
      <PricingSection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Index;
