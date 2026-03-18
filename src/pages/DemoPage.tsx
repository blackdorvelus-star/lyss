import { useNavigate } from "react-router-dom";
import Dashboard from "@/components/dashboard/Dashboard";
import FeedbackWidget from "@/components/dashboard/FeedbackWidget";

const DemoPage = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* Banner démo */}
      <div className="sticky top-0 z-[60] bg-amber-500/90 text-amber-950 text-center text-sm font-medium py-2 px-4 backdrop-blur-sm">
        🎯 Mode démo — Données fictives pour illustration.{" "}
        <button
          onClick={() => navigate("/")}
          className="underline font-bold hover:text-amber-900 transition-colors"
        >
          Créez un compte gratuit pour commencer&nbsp;→
        </button>
      </div>
      <Dashboard
        onBack={() => navigate("/")}
        onLogout={() => navigate("/")}
        demo
      />
      <FeedbackWidget />
    </>
  );
};

export default DemoPage;
