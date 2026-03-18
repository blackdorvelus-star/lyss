import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { safeSupabase as supabase } from "@/lib/supabase-safe";
import { lovable } from "@/integrations/lovable/index";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

interface AuthPageProps {
  onAuth: () => void;
}

const AuthPage = ({ onAuth }: AuthPageProps) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Remplis tous les champs.");
      return;
    }
    if (password.length < 6) {
      toast.error("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: "https://lyss.ca" },
        });
        if (error) throw error;
        toast.success("Compte créé ! Tu es connecté(e).");
        onAuth();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("Bienvenue !");
        onAuth();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("apple", {
        redirect_uri: window.location.origin + "/dashboard",
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(message);
    } finally {
      setAppleLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/dashboard",
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(message);
    } finally {
      setGoogleLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 py-4">
        <img src="/logo-lyss.png" alt="Lyss" className="h-10 object-contain" />
      </header>

      <div className="flex-1 flex items-center justify-center px-5 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="font-display text-2xl font-bold">
              {mode === "login" ? "Bon retour 👋" : "Crée ton compte"}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mb-8">
            {mode === "login"
              ? "Connecte-toi pour accéder à ton bureau virtuel."
              : "Inscris-toi pour accéder à ton adjointe IA. 3 tâches gratuites incluses."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="ton@courriel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-card pl-10"
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Mot de passe (6+ caractères)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-card pl-10"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-primary text-primary-foreground font-display font-semibold h-12"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Se connecter" : "Créer mon compte"}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={loading || googleLoading}
            onClick={handleGoogleSignIn}
            className="w-full h-12 font-display font-semibold gap-3"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continuer avec Google
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={loading || googleLoading || appleLoading}
            onClick={handleAppleSignIn}
            className="w-full h-12 font-display font-semibold gap-3"
          >
            {appleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continuer avec Apple
              </>
            )}
          </Button>

          <p className="text-sm text-muted-foreground text-center mt-6">
            {mode === "login" ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-primary font-medium hover:underline"
            >
              {mode === "login" ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
