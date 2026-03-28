import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/components/dashboard/Dashboard";
import FeedbackWidget from "@/components/dashboard/FeedbackWidget";
import AuthPage from "@/components/auth/AuthPage";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthPage onAuth={() => navigate("/dashboard")} />;
  }

  return (
    <>
      <Dashboard
        onBack={() => navigate("/")}
        onLogout={async () => {
          const { supabase } = await import("@/integrations/supabase/client");
          await supabase.auth.signOut();
          navigate("/");
        }}
      />
      <FeedbackWidget />
    </>
  );
};

export default DashboardPage;
