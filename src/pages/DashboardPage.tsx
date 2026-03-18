import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { safeSupabase as supabase } from "@/lib/supabase-safe";
import Dashboard from "@/components/dashboard/Dashboard";
import FeedbackWidget from "@/components/dashboard/FeedbackWidget";
import AuthPage from "@/components/auth/AuthPage";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: any) => {
        setSession(session);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
          await supabase.auth.signOut();
          navigate("/");
        }}
      />
      <FeedbackWidget />
    </>
  );
};

export default DashboardPage;
