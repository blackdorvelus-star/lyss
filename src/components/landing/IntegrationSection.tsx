import { motion } from "framer-motion";
import { Pencil, FileSpreadsheet, Code, Link2, ArrowRight } from "lucide-react";

const methods = [
  {
    icon: Pencil,
    title: "Entrée manuelle",
    description: "Ajoute tes factures une par une depuis le tableau de bord. Idéal pour quelques dossiers.",
    status: "available" as const,
  },
  {
    icon: FileSpreadsheet,
    title: "Import CSV",
    description: "Exporte tes factures depuis ton logiciel comptable et importe-les en lot. Détection automatique des colonnes.",
    status: "available" as const,
  },
  {
    icon: Code,
    title: "API comptable",
    description: "Connecte QuickBooks ou Sage Business Cloud pour synchroniser automatiquement tes factures impayées.",
    status: "available" as const,
  },
  {
    icon: Link2,
    title: "Widget embarqué",
    description: "Installe un widget sur ton site web pour que tes clients puissent consulter et régler leurs factures directement.",
    status: "coming" as const,
  },
];

const IntegrationSection = () => {
  return (
    <section className="py-20 px-5">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-xs font-medium text-primary px-3 py-1 rounded-full border border-primary/30 bg-primary/10">
            Intégrations
          </span>
          <h2 className="font-display text-3xl font-bold mt-4 mb-3">
            S'intègre à ton entreprise en 2 minutes
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Pas besoin de changer tes habitudes. Lyss s'adapte à ton flux de travail existant — que tu gères 3 ou 300 factures.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4">
          {methods.map((method, i) => (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <method.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-display font-bold text-sm">{method.title}</h3>
                    {method.status === "available" ? (
                      <span className="text-[10px] font-medium text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                        Disponible
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded-full bg-secondary border border-border">
                        Bientôt
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {method.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8"
        >
          <p className="text-xs text-muted-foreground">
            Tu utilises un logiciel qui n'est pas listé ?{" "}
            <a href="mailto:info@lyss.ca" className="text-primary hover:underline inline-flex items-center gap-1">
              Dis-le nous <ArrowRight className="w-3 h-3" />
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default IntegrationSection;
