import { useNavigate } from "react-router-dom";
import Dashboard from "@/components/dashboard/Dashboard";
import FeedbackWidget from "@/components/dashboard/FeedbackWidget";

const DashboardPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Dashboard
        onBack={() => navigate("/")}
        onLogout={() => navigate("/")}
      />
      <FeedbackWidget />
    </>
  );
};

export default DashboardPage;
