import { useState } from "react";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorks from "@/components/landing/HowItWorks";
import MessagePreview from "@/components/landing/MessagePreview";
import PricingSection from "@/components/landing/PricingSection";
import Footer from "@/components/landing/Footer";
import InvoiceUpload from "@/components/dashboard/InvoiceUpload";

const Index = () => {
  const [view, setView] = useState<"landing" | "upload">("landing");

  if (view === "upload") {
    return <InvoiceUpload onBack={() => setView("landing")} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-5 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="font-display font-bold text-primary text-lg">Cash-Flow AI</span>
          <button
            onClick={() => setView("upload")}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Commencer →
          </button>
        </div>
      </header>

      <HeroSection onStart={() => setView("upload")} />
      <HowItWorks />
      <MessagePreview />
      <PricingSection />
      <Footer />
    </div>
  );
};

export default Index;
