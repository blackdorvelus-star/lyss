import { motion } from "framer-motion";
import { Upload, Bot, Banknote } from "lucide-react";

const steps = [
  {
    icon: Upload,
    num: "01",
    title: "Dépose ta facture",
    desc: "Manuel, CSV ou QuickBooks. 30 secondes.",
  },
  {
    icon: Bot,
    num: "02",
    title: "Lyss fait le suivi",
    desc: "SMS, courriels et appels — ton québécois pro.",
  },
  {
    icon: Banknote,
    num: "03",
    title: "Ton client te paie",
    desc: "Directement dans ton Interac ou Stripe. 73 % de réponse.",
  },
];

const HowItWorks = () => {
  return (
    <section className="px-5 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-3 gap-3 sm:gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-3 sm:p-5 rounded-xl border border-border bg-card"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2.5">
                <step.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">{step.num}</span>
              <h3 className="font-display font-bold text-xs sm:text-sm mt-0.5 mb-1">{step.title}</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-snug">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
