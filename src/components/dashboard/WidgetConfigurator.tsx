import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, ExternalLink, Check, Code2, Link, Eye, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase-safe";
import { toast } from "sonner";

const WidgetConfigurator = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("Mon entreprise");
  const [allowDisputes, setAllowDisputes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const widgetUrl = userId
    ? `${window.location.origin}/widget/${userId}`
    : "";

  const embedSnippet = userId
    ? `<iframe
  src="${widgetUrl}"
  width="100%"
  height="700"
  style="border:none; border-radius:12px; max-width:480px;"
  allow="clipboard-write"
  title="Espace client – ${companyName}"
></iframe>`
    : "";

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data } = await supabase
      .from("payment_settings")
      .select("company_name, allow_disputes")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setCompanyName(data.company_name || "Mon entreprise");
      setAllowDisputes(data.allow_disputes ?? false);
    }
  };

  const handleSaveDisputes = async (value: boolean) => {
    setAllowDisputes(value);
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase
      .from("payment_settings")
      .update({ allow_disputes: value })
      .eq("user_id", userId);
    if (error) {
      toast.error("Erreur de sauvegarde");
    } else {
      toast.success(value ? "Litiges activés dans le widget" : "Litiges désactivés");
    }
    setSaving(false);
  };

  const copyToClipboard = async (text: string, type: "snippet" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "snippet") {
        setCopiedSnippet(true);
        setTimeout(() => setCopiedSnippet(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
      toast.success("Copié !");
    } catch {
      toast.error("Impossible de copier");
    }
  };

  if (!userId) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold mb-1">Widget embarqué</h2>
        <p className="text-sm text-muted-foreground">
          Offre à tes clients un portail pour consulter leurs factures, discuter avec l'adjointe IA et signaler un problème — directement sur ton site web.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Link className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm">Lien direct</h4>
              <p className="text-xs text-muted-foreground">Partage ce lien à tes clients</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              value={widgetUrl}
              readOnly
              className="bg-secondary text-xs font-mono"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => copyToClipboard(widgetUrl, "link")}
              className="flex-shrink-0"
            >
              {copiedLink ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.open(widgetUrl, "_blank")}
          >
            <ExternalLink className="w-3.5 h-3.5 mr-2" />
            Ouvrir le widget
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm">Code d'intégration</h4>
              <p className="text-xs text-muted-foreground">Colle-le sur ton site web</p>
            </div>
          </div>
          <div className="relative">
            <pre className="bg-secondary rounded-lg p-3 text-[11px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto">
              {embedSnippet}
            </pre>
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 h-7 w-7"
              onClick={() => copyToClipboard(embedSnippet, "snippet")}
            >
              {copiedSnippet ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-5 space-y-4"
      >
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-4 h-4 text-primary" />
          <h3 className="font-display font-bold text-sm">Configuration du widget</h3>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <Label className="text-sm font-medium">Permettre les signalements</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Les clients pourront signaler un problème directement depuis le widget.
            </p>
          </div>
          <Switch
            checked={allowDisputes}
            onCheckedChange={handleSaveDisputes}
            disabled={saving}
          />
        </div>

        <div className="border-t border-border pt-4">
          <Label className="text-sm font-medium">Nom affiché</Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-2">
            Le nom de ton entreprise tel qu'il apparaît dans le widget. Modifiable dans les Réglages.
          </p>
          <div className="bg-secondary rounded-lg px-3 py-2 text-sm font-medium">
            {companyName}
          </div>
        </div>
      </motion.div>

      {/* Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setPreviewOpen(!previewOpen)}
        >
          <Eye className="w-4 h-4 mr-2" />
          {previewOpen ? "Masquer l'aperçu" : "Voir l'aperçu du widget"}
        </Button>

        {previewOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 overflow-hidden"
          >
            <div className="border border-border rounded-xl overflow-hidden bg-secondary/30">
              <div className="bg-card px-4 py-2 border-b border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono">
                  {widgetUrl}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => window.open(widgetUrl, "_blank")}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Plein écran
                </Button>
              </div>
              <iframe
                src={widgetUrl}
                className="w-full border-0"
                style={{ height: 600, maxWidth: 480, margin: "0 auto", display: "block" }}
                title={`Aperçu widget – ${companyName}`}
              />
            </div>
          </motion.div>
        )}
      </motion.div>

      <p className="text-xs text-muted-foreground text-center">
        Le widget s'adapte automatiquement au thème clair ou sombre de ton site. Les clients n'ont pas besoin de créer un compte.
      </p>
    </div>
  );
};

export default WidgetConfigurator;
