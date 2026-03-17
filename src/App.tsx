import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Eager: landing page (critical path)
import Index from "./pages/Index.tsx";

// Lazy: all secondary routes
const PayerPortal = lazy(() => import("./pages/PayerPortal.tsx"));
const ClientWidget = lazy(() => import("./pages/ClientWidget.tsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.tsx"));
const TarifsPage = lazy(() => import("./pages/TarifsPage.tsx"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage.tsx"));
const TermsPage = lazy(() => import("./pages/TermsPage.tsx"));
const LitigesPage = lazy(() => import("./pages/LitigesPage.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min
      gcTime: 10 * 60 * 1000,   // 10 min
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/payer/:token" element={<PayerPortal />} />
            <Route path="/widget/:userId" element={<ClientWidget />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/tarifs" element={<TarifsPage />} />
            <Route path="/litiges" element={<LitigesPage />} />
            <Route path="/politique-confidentialite" element={<PrivacyPage />} />
            <Route path="/confidentialite" element={<PrivacyPage />} />
            <Route path="/conditions-utilisation" element={<TermsPage />} />
            <Route path="/conditions" element={<TermsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
