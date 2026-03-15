import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import MessagePreview from "@/components/landing/MessagePreview";
import PricingSection from "@/components/landing/PricingSection";
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
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="font-display font-bold text-primary text-lg">Cash-Flow AI</span>
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
      <Footer />
    </div>
  );
};

export default Index;
