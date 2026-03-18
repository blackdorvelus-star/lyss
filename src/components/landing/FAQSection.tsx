import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "C'est quoi Lyss ?", a: "Une adjointe administrative IA qui relance tes clients par SMS, courriel et appel vocal — avec un ton québécois professionnel." },
  { q: "Est-ce légal au Québec ?", a: "Oui. Lyss envoie des suivis de courtoisie, pas du recouvrement agressif. Aucune menace, jamais." },
  { q: "Mes clients sauront que c'est une IA ?", a: "Non. Lyss se présente comme faisant partie de ton équipe. Messages naturels et personnalisés." },
  { q: "Combien de relances par dossier ?", a: "Jusqu'à 5 SMS, 3 courriels et 2 appels vocaux. Arrêt automatique dès le paiement reçu." },
  { q: "Si un client est mécontent ?", a: "L'adjointe respecte toute demande de cessation. Le dossier est pausé et tu es notifié." },
  { q: "Puis-je annuler ?", a: "Oui, en tout temps, sans frais ni pénalité depuis ton tableau de bord." },
];

const FAQSection = () => {
  return (
    <section className="px-5 py-10">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-1">Questions fréquentes</h2>
        </motion.div>

        <Accordion type="single" collapsible className="space-y-1.5">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-border rounded-lg px-4 bg-card data-[state=open]:border-primary/20"
            >
              <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-3 hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-3">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
