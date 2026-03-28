import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

import Index from "./pages/Index.tsx";

const DemoPage = lazy(() => import("./pages/DemoPage.tsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.tsx"));
const PayerPortal = lazy(() => import("./pages/PayerPortal.tsx"));
const ClientWidget = lazy(() => import("./pages/ClientWidget.tsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.tsx"));
const TarifsPage = lazy(() => import("./pages/TarifsPage.tsx"));
const FeaturesPage = lazy(() => import("./pages/FeaturesPage.tsx"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage.tsx"));
const TermsPage = lazy(() => import("./pages/TermsPage.tsx"));
const LitigesPage = lazy(() => import("./pages/LitigesPage.tsx"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage.tsx"));
const IntegrationGuidePage = lazy(() => import("./pages/IntegrationGuidePage.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/payer/:token" element={<PayerPortal />} />
          <Route path="/widget/:userId" element={<ClientWidget />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/tarifs" element={<TarifsPage />} />
          <Route path="/fonctionnalites" element={<FeaturesPage />} />
          <Route path="/litiges" element={<LitigesPage />} />
          <Route path="/politique-confidentialite" element={<PrivacyPage />} />
          <Route path="/confidentialite" element={<PrivacyPage />} />
          <Route path="/conditions-utilisation" element={<TermsPage />} />
          <Route path="/conditions" element={<TermsPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/guide-integrations" element={<IntegrationGuidePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
