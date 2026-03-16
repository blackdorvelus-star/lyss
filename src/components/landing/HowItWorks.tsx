import { motion } from "framer-motion";
import { Upload, MessageSquare, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Dépose ta tâche",
    desc: "Facture impayée, rappel de rendez-vous ou suivi client. 30 secondes max.",
    accent: false,
  },
  {
    icon: MessageSquare,
    title: "L'adjointe s'en occupe",
    desc: "Messages professionnels en ton québécois. SMS, courriels et appels inclus.",
    accent: false,
  },
  {
    icon: CheckCircle,
    title: "Résultat livré",
    desc: "Paiement reçu, rendez-vous confirmé, client satisfait. Tu restes informé(e).",
    accent: true,
  },
];

const HowItWorks = () => {
  return (
    <section className="px-5 py-16">
      <div className="max-w-xl mx-auto">
        <h2 className="font-display text-2xl font-bold text-center mb-10">
          Comment ça marche
        </h2>

        <div className="space-y-6">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`flex items-start gap-4 p-5 rounded-xl border ${
                step.accent
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                step.accent ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
              }`}>
                <step.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">0{i + 1}</span>
                  <h3 className="font-display font-semibold">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
