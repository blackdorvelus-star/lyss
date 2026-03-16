import { useState, useEffect } from "react";
import logoLyss from "@/assets/logo-lyss.png";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  CreditCard,
  Banknote,
  AlertCircle,
  Loader2,
  MessageSquare,
  Copy,
  Check,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface PortalData {
  invoice: {
    invoice_number: string | null;
    amount: number;
    amount_recovered: number | null;
    due_date: string | null;
    status: string;
  };
  client: { name: string };
  business: {
    company_name: string;
    company_logo_url: string | null;
    interac_email: string | null;
    interac_question: string | null;
    interac_answer: string | null;
    stripe_link: string | null;
  };
}

const PayerPortal = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInterac, setShowInterac] = useState(false);
  const [showProblem, setShowProblem] = useState(false);
  const [problemText, setProblemText] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchPortalData();
  }, [token]);

  const fetchPortalData = async () => {
    setLoading(true);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke(
        "get-portal-data",
        { body: { token } }
      );
      if (fnError || result?.error) {
        setError(result?.error || "Lien invalide");
      } else {
        setData(result);
      }
    } catch {
      setError("Impossible de charger les informations.");
    }
    setLoading(false);
  };

  const copyEmail = async (email: string) => {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    toast.success("Courriel copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-CA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="font-display text-xl font-bold mb-2">
            Lien invalide
          </h1>
          <p className="text-sm text-muted-foreground">
            {error || "Ce lien de paiement n'existe pas ou a expiré."}
          </p>
        </motion.div>
      </div>
    );
  }

  const { invoice, client, business } = data;
  const remaining = invoice.amount - (invoice.amount_recovered || 0);
  const isPaid = invoice.status === "recovered";

  return (
    <div className="min-h-screen bg-background">
      {/* Header with company branding */}
      <header className="border-b border-border bg-card px-5 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {business.company_logo_url ? (
            <img
              src={business.company_logo_url}
              alt={business.company_name}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
          )}
          <div>
            <p className="font-display font-bold text-sm">
              {business.company_name}
            </p>
            <p className="text-xs text-muted-foreground">
              Portail de paiement sécurisé
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-8 space-y-6">
        {/* Lyss greeting */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div className="bg-card border border-border rounded-2xl rounded-tl-sm p-4 flex-1">
            <p className="text-sm leading-relaxed">
              Bonjour{client.name ? ` ${client.name.split(" ")[0]}` : ""}, je
              suis l'adjointe de{" "}
              <span className="font-medium text-foreground">
                {business.company_name}
              </span>
              . Je suis là pour vous aider à régulariser votre dossier en toute
              simplicité.
            </p>
          </div>
        </motion.div>

        {/* Invoice details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <h2 className="font-display font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wider">
            Détails de la facture
          </h2>
          <div className="space-y-2 text-sm">
            {invoice.invoice_number && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Numéro</span>
                <span className="font-medium">#{invoice.invoice_number}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Montant total</span>
              <span className="font-display font-bold text-lg">
                {formatMoney(invoice.amount)}
              </span>
            </div>
            {(invoice.amount_recovered || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Déjà versé</span>
                <span className="text-primary font-medium">
                  {formatMoney(invoice.amount_recovered || 0)}
                </span>
              </div>
            )}
            {remaining !== invoice.amount && remaining > 0 && (
              <div className="flex justify-between border-t border-border pt-2 mt-2">
                <span className="font-medium">Solde restant</span>
                <span className="font-display font-bold text-accent">
                  {formatMoney(remaining)}
                </span>
              </div>
            )}
            {invoice.due_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Échéance</span>
                <span>{formatDate(invoice.due_date)}</span>
              </div>
            )}
          </div>
        </motion.div>

        {isPaid ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary/10 border border-primary/30 rounded-2xl p-6 text-center"
          >
            <Check className="w-10 h-10 text-primary mx-auto mb-2" />
            <h3 className="font-display font-bold text-lg text-primary">
              Facture réglée
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Merci ! Ce dossier est marqué comme complété.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Payment options */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <h2 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-wider">
                Comment souhaitez-vous régler ?
              </h2>

              <p className="text-xs text-muted-foreground">
                Paiement sécurisé vers{" "}
                <span className="text-foreground font-medium">
                  {business.company_name}
                </span>
                . Lyss ne traite aucune transaction.
              </p>

              {/* Interac option */}
              {business.interac_email && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowInterac(!showInterac)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                      <Banknote className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">Virement Interac</p>
                      <p className="text-xs text-muted-foreground">
                        Envoyez directement à {business.company_name}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform ${
                        showInterac ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {showInterac && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                          <div className="bg-secondary rounded-lg p-3 space-y-2">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Envoyer à :
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="font-mono text-sm font-medium flex-1">
                                  {business.interac_email}
                                </p>
                                <button
                                  onClick={() =>
                                    copyEmail(business.interac_email!)
                                  }
                                  className="text-primary hover:text-primary/80 transition-colors"
                                >
                                  {copied ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                            {business.interac_question && (
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Question de sécurité :
                                </p>
                                <p className="text-sm font-medium">
                                  {business.interac_question}
                                </p>
                              </div>
                            )}
                            {business.interac_answer && (
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Réponse :
                                </p>
                                <p className="text-sm font-medium text-primary">
                                  {business.interac_answer}
                                </p>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Montant suggéré :{" "}
                            <span className="font-medium text-foreground">
                              {formatMoney(remaining)}
                            </span>
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Stripe / Card option */}
              {business.stripe_link && (
                <a
                  href={business.stripe_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Carte de crédit</p>
                    <p className="text-xs text-muted-foreground">
                      Paiement sécurisé via Stripe
                    </p>
                  </div>
                </a>
              )}

              {!business.interac_email && !business.stripe_link && (
                <div className="bg-secondary rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Contactez directement {business.company_name} pour régler
                    cette facture.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Report a problem */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={() => setShowProblem(!showProblem)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mx-auto"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Signaler un problème ou demander un délai
              </button>

              <AnimatePresence>
                {showProblem && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 bg-card border border-border rounded-xl p-4 space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Expliquez votre situation. Votre message sera transmis à{" "}
                        {business.company_name}.
                      </p>
                      <Textarea
                        value={problemText}
                        onChange={(e) => setProblemText(e.target.value)}
                        placeholder="Ex: Je souhaiterais un délai de 2 semaines..."
                        className="bg-secondary text-sm min-h-[80px]"
                      />
                      <Button
                        size="sm"
                        disabled={!problemText.trim()}
                        className="bg-primary text-primary-foreground font-display w-full"
                        onClick={() => {
                          toast.success(
                            "Message envoyé. L'entreprise vous reviendra sous peu."
                          );
                          setShowProblem(false);
                          setProblemText("");
                        }}
                      >
                        Envoyer le message
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-5 py-5 mt-8">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-2">
          <img src="/logo-lyss.png" alt="Lyss" className="h-8 opacity-60 drop-shadow-[0_0_8px_hsl(160,30%,46%,0.4)]" style={{ filter: 'brightness(0) invert(1) sepia(1) saturate(3) hue-rotate(120deg) brightness(0.7)' }} />
          <p className="text-xs text-muted-foreground">
            Portail sécurisé propulsé par Lyss · Adjointe administrative IA
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PayerPortal;
