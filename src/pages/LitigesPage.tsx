import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { safeSupabase as supabase } from "@/lib/supabase-safe";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import DisputeCenter from "@/components/dashboard/DisputeCenter";

const LitigesPage = () => {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate("/", { replace: true });
      } else {
        setAuthed(true);
      }
    });
  }, [navigate]);

  if (!authed) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-4 sm:px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-display font-bold text-sm sm:text-base">Centre de litiges</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Gestion des dossiers contestés</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <DisputeCenter />
      </main>
    </div>
  );
};

export default LitigesPage;
