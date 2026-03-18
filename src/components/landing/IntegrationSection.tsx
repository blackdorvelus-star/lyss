import { motion } from "framer-motion";
import { Pencil, FileSpreadsheet, Code, Link2 } from "lucide-react";

const methods = [
  { icon: Pencil, title: "Manuel", desc: "Ajoute tes factures une par une." },
  { icon: FileSpreadsheet, title: "Import CSV", desc: "Importe en lot depuis ton logiciel." },
  { icon: Code, title: "QuickBooks & Sage", desc: "Sync automatique des impayés." },
  { icon: Link2, title: "Widget web", desc: "Portail client sur ton site." },
];

const IntegrationSection = () => {
  return (
    <section className="py-10 px-5">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-1.5">
            S'intègre en 2 minutes
          </h2>
          <p className="text-xs text-muted-foreground">
            Pas besoin de changer tes habitudes. Lyss s'adapte.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {methods.map((m, i) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl p-3.5 text-center hover:border-primary/20 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <m.icon className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-display font-bold text-xs mb-0.5">{m.title}</h3>
              <p className="text-[10px] text-muted-foreground leading-snug">{m.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntegrationSection;
