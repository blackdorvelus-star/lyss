import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MessageSquare, AlertCircle, Loader2, Building2,
  Send, FileText, ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface InvoiceResult {
  id: string;
  invoice_number: string | null;
  amount: number;
  amount_recovered: number;
  remaining: number;
  due_date: string | null;
  status: string;
  client_name: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type WidgetView = "search" | "results" | "chat" | "dispute";

const ClientWidget = () => {
  const { userId } = useParams<{ userId: string }>();
  const [view, setView] = useState<WidgetView>("search");
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<InvoiceResult[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceResult | null>(null);
  const [businessName, setBusinessName] = useState("Entreprise");
  const [businessLogo, setBusinessLogo] = useState<string | null>(null);
  const [allowDisputes, setAllowDisputes] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Dispute state
  const [disputeText, setDisputeText] = useState("");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const formatMoney = (n: number) =>
    new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" });

  const handleSearch = async () => {
    if (!search.trim() || search.trim().length < 2) {
      toast.error("Entrez au moins 2 caractères.");
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/widget-lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
        body: JSON.stringify({ user_id: userId, search: search.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.results || []);
      setBusinessName(data.business?.company_name || "Entreprise");
      setBusinessLogo(data.business?.company_logo_url || null);
      setAllowDisputes(data.business?.allow_disputes ?? false);
      setView("results");
    } catch (err: any) {
      toast.error(err.message || "Erreur de recherche");
    } finally {
      setSearching(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/widget-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
        body: JSON.stringify({
          user_id: userId,
          invoice_id: selectedInvoice?.id || null,
          message: userMsg.content,
          history: chatMessages.slice(-10),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Désolée, je ne peux pas répondre pour le moment." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const selectInvoice = (inv: InvoiceResult) => {
    setSelectedInvoice(inv);
    setChatMessages([]);
  };

  const handleDispute = () => {
    if (!disputeText.trim()) return;
    toast.success("Votre message a été transmis. L'entreprise vous reviendra sous peu.");
    setDisputeText("");
    setView("results");
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Widget non configuré.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-5 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {businessLogo ? (
            <img src={businessLogo} alt={businessName} className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
          )}
          <div>
            <p className="font-display font-bold text-sm">{businessName}</p>
            <p className="text-xs text-muted-foreground">Espace client sécurisé</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6">
        <AnimatePresence mode="wait">
          {/* SEARCH VIEW */}
          {view === "search" && (
            <motion.div key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="text-center pt-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-primary" />
                </div>
                <h1 className="font-display text-xl font-bold mb-1">Consulter mon dossier</h1>
                <p className="text-sm text-muted-foreground">
                  Entrez votre nom ou numéro de facture pour voir votre solde.
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Nom, numéro de facture..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="bg-card"
                />
                <Button onClick={handleSearch} disabled={searching} className="bg-primary text-primary-foreground">
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </motion.div>
          )}

          {/* RESULTS VIEW */}
          {view === "results" && (
            <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <button onClick={() => { setView("search"); setSelectedInvoice(null); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" /> Nouvelle recherche
              </button>

              {results.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-muted-foreground">Aucun résultat pour « {search} »</p>
                  <p className="text-xs text-muted-foreground mt-1">Vérifiez l'orthographe ou contactez {businessName}.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">{results.length} dossier(s) trouvé(s)</p>
                  {results.map((inv) => (
                    <motion.div
                      key={inv.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => selectInvoice(inv)}
                      className={`bg-card border rounded-xl p-4 cursor-pointer transition-all hover:border-primary/40 ${
                        selectedInvoice?.id === inv.id ? "border-primary ring-1 ring-primary/20" : "border-border"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-display font-bold text-sm">{inv.client_name}</p>
                          {inv.invoice_number && <p className="text-xs text-muted-foreground">Facture #{inv.invoice_number}</p>}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          inv.status === "recovered"
                            ? "bg-primary/10 text-primary"
                            : inv.status === "overdue"
                            ? "bg-accent/10 text-accent"
                            : "bg-secondary text-muted-foreground"
                        }`}>
                          {inv.status === "recovered" ? "Réglé" : inv.status === "overdue" ? "En retard" : "En cours"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Solde restant</span>
                        <span className="font-display font-bold text-accent">{formatMoney(inv.remaining)}</span>
                      </div>
                      {inv.due_date && (
                        <p className="text-xs text-muted-foreground mt-1">Échéance : {formatDate(inv.due_date)}</p>
                      )}
                    </motion.div>
                  ))}
                </>
              )}

              {/* Action buttons when invoice selected */}
              {selectedInvoice && selectedInvoice.status !== "recovered" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 pt-2">
                  <Button onClick={() => { setView("chat"); setChatMessages([]); }} variant="default" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" /> Discuter avec l'adjointe
                  </Button>
                  {allowDisputes && (
                  <Button onClick={() => setView("dispute")} variant="outline" className="flex-1">
                    <AlertCircle className="w-4 h-4 mr-2" /> Signaler un problème
                  </Button>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* CHAT VIEW */}
          {view === "chat" && (
            <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col h-[calc(100vh-120px)]">
              <button onClick={() => setView("results")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
                <ChevronLeft className="w-4 h-4" /> Retour
              </button>

              {selectedInvoice && (
                <div className="bg-card border border-border rounded-xl p-3 mb-3 text-xs">
                  <span className="text-muted-foreground">Dossier :</span>{" "}
                  <span className="font-medium">{selectedInvoice.client_name}</span>
                  {selectedInvoice.invoice_number && <span className="text-muted-foreground"> — #{selectedInvoice.invoice_number}</span>}
                  <span className="float-right font-display font-bold text-accent">{formatMoney(selectedInvoice.remaining)}</span>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 pb-3">
                {chatMessages.length === 0 && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="bg-card border border-border rounded-2xl rounded-tl-sm p-3 flex-1">
                      <p className="text-sm">
                        Bonjour ! Je suis l'adjointe de <span className="font-medium">{businessName}</span>. Comment puis-je vous aider avec votre dossier ?
                      </p>
                    </div>
                  </div>
                )}

                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-card border border-border rounded-tl-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                    </div>
                    <div className="bg-card border border-border rounded-2xl rounded-tl-sm p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: "0.2s" }} />
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: "0.4s" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="flex gap-2 pt-2 border-t border-border">
                <Input
                  placeholder="Votre message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleChat()}
                  disabled={chatLoading}
                  className="bg-card"
                />
                <Button onClick={handleChat} disabled={chatLoading || !chatInput.trim()} size="icon" className="bg-primary text-primary-foreground">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* DISPUTE VIEW */}
          {view === "dispute" && (
            <motion.div key="dispute" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <button onClick={() => setView("results")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" /> Retour
              </button>

              <div>
                <h2 className="font-display font-bold text-lg mb-1">Signaler un problème</h2>
                <p className="text-sm text-muted-foreground">
                  Votre message sera transmis directement à {businessName}.
                </p>
              </div>

              {selectedInvoice && (
                <div className="bg-card border border-border rounded-xl p-3 text-xs">
                  <span className="text-muted-foreground">Dossier :</span>{" "}
                  <span className="font-medium">{selectedInvoice.client_name}</span>
                  {selectedInvoice.invoice_number && <span> — #{selectedInvoice.invoice_number}</span>}
                </div>
              )}

              <Textarea
                value={disputeText}
                onChange={(e) => setDisputeText(e.target.value)}
                placeholder="Ex : Je souhaiterais un délai de 2 semaines pour régler cette facture..."
                className="bg-card min-h-[120px]"
              />

              <Button onClick={handleDispute} disabled={!disputeText.trim()} className="w-full bg-primary text-primary-foreground font-display">
                <Send className="w-4 h-4 mr-2" /> Envoyer le message
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-5 py-4 mt-auto">
        <div className="max-w-lg mx-auto flex flex-col items-center gap-1.5">
          <img src="/logo-lyss.png" alt="Lyss" className="h-7 object-contain opacity-70" />
          <p className="text-[10px] text-muted-foreground">Espace client propulsé par Lyss</p>
        </div>
      </footer>
    </div>
  );
};

export default ClientWidget;
