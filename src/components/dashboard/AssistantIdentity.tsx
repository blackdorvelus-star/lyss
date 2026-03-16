import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCircle, Building2, BadgeCheck, MessageSquare, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const roles = [
  { value: "adjointe", label: "Adjointe administrative" },
  { value: "secretaire", label: "Secrétaire" },
  { value: "coordonnatrice", label: "Coordonnatrice de bureau" },
];

const AssistantIdentity = () => {
  const [name, setName] = useState("Lyss");
  const [role, setRole] = useState("adjointe");
  const [company, setCompany] = useState("");

  const roleLabel = roles.find((r) => r.value === role)?.label || "Adjointe administrative";
  const companyDisplay = company || "Votre entreprise";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold">Identité de l'adjointe</h2>
        <p className="text-xs text-muted-foreground">
          Personnalise comment l'IA se présente auprès de tes clients.
        </p>
      </div>

      {/* Config fields */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <UserCircle className="w-4 h-4 text-primary" />
            Prénom de l'adjointe
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Lyss"
            className="bg-card"
          />
          <p className="text-xs text-muted-foreground">
            Le prénom utilisé dans les SMS, courriels et appels.
          </p>
        </div>

        {/* Company */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Nom de ton entreprise
          </label>
          <Input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Plomberie Lévis"
            className="bg-card"
          />
          <p className="text-xs text-muted-foreground">
            Injecté automatiquement dans chaque message.
          </p>
        </div>

        {/* Role */}
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-primary" />
            Titre professionnel
          </label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Le titre influence la perception juridique et professionnelle du contact.
          </p>
        </div>
      </div>

      {/* Live preview */}
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Prévisualisation en temps réel
        </p>

        {/* SMS preview */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${name}-${role}-${company}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-4"
          >
            {/* SMS */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-primary">SMS</span>
              </div>
              <div className="bg-secondary rounded-xl rounded-tl-sm p-4 text-sm leading-relaxed">
                <p>
                  Bonjour Marc, c'est{" "}
                  <span className="text-primary font-medium">{name || "Lyss"}</span>,{" "}
                  <span className="text-primary font-medium">
                    {roleLabel.charAt(0).toLowerCase() + roleLabel.slice(1)}
                  </span>{" "}
                  chez{" "}
                  <span className="text-primary font-medium">{companyDisplay}</span>.
                  Suivi pour la facture #1247 (850 $, due le 12 mars).
                </p>
                <p className="mt-2">
                  On comprend que ça peut arriver ! Si tu préfères, on peut diviser ça en 2 paiements Interac.
                </p>
                <p className="mt-2 text-primary font-medium">→ payer.lyss.ca/f/1247</p>
              </div>
            </div>

            {/* Call intro */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-accent" />
                <span className="text-xs font-medium text-accent">Appel vocal</span>
              </div>
              <div className="bg-secondary rounded-xl rounded-tl-sm p-4 text-sm leading-relaxed italic text-secondary-foreground">
                « Bonjour, ici{" "}
                <span className="text-foreground font-medium not-italic">{name || "Lyss"}</span>,{" "}
                <span className="text-foreground font-medium not-italic">
                  {roleLabel.charAt(0).toLowerCase() + roleLabel.slice(1)}
                </span>{" "}
                chez{" "}
                <span className="text-foreground font-medium not-italic">{companyDisplay}</span>.
                Je vous appelle concernant un dossier de facturation… »
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <p className="text-xs text-muted-foreground text-center">
          Ces paramètres s'appliquent à tous les futurs messages envoyés par l'adjointe.
        </p>
      </div>
    </div>
  );
};

export default AssistantIdentity;
