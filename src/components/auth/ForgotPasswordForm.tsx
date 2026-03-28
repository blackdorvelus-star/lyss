import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { safeSupabase as supabase } from "@/lib/supabase-safe";

interface ForgotPasswordFormProps {
  onBack: () => void;
}

const ForgotPasswordForm = ({ onBack }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Entre ton adresse courriel.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Courriel envoyé !");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="text-4xl">📧</div>
        <h2 className="font-display text-xl font-bold">Vérifie ta boîte courriel</h2>
        <p className="text-sm text-muted-foreground">
          Si un compte existe avec <span className="font-medium text-foreground">{email}</span>, tu recevras un lien pour réinitialiser ton mot de passe.
        </p>
        <button
          onClick={onBack}
          className="text-sm text-primary font-medium hover:underline"
        >
          Retour à la connexion
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h2 className="font-display text-xl font-bold">Mot de passe oublié ?</h2>
      <p className="text-sm text-muted-foreground">
        Entre ton adresse courriel et on t'enverra un lien pour le réinitialiser.
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
            autoFocus
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground font-display font-semibold h-12"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Envoyer le lien
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center">
        <button
          onClick={onBack}
          className="text-primary font-medium hover:underline"
        >
          Retour à la connexion
        </button>
      </p>
    </motion.div>
  );
};

export default ForgotPasswordForm;
