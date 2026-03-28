import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "C'est quoi Lyss ?", a: "Lyss est ton adjointe administrative IA. Elle gère tes factures, relance tes clients par SMS, courriel et appel vocal, suit les litiges, vérifie les paiements et ferme tes dossiers — du début à la fin, 24/7." },
  { q: "Est-ce que Lyss perçoit les paiements ?", a: "Non. Lyss ne touche jamais à ton argent. Elle facilite le suivi et guide tes clients vers tes propres méthodes de paiement (Interac, Stripe, virement, etc.). C'est une adjointe, pas un intermédiaire financier." },
  { q: "Qu'est-ce que Lyss fait exactement pour moi ?", a: "Tout ce qu'une secrétaire ferait : suivi de factures, relances multicanales, appels de courtoisie, gestion des litiges, suivi de soumissions, rapports hebdomadaires et prévisions de trésorerie. Elle ne ferme un dossier que quand le paiement est confirmé." },
  { q: "Est-ce légal au Québec ?", a: "Oui. Lyss envoie des suivis de courtoisie professionnels, pas du recouvrement agressif. Aucune menace, aucune pression indue — jamais." },
  { q: "Mes clients sauront que c'est une IA ?", a: "Non. Lyss se présente comme faisant partie de ton équipe, avec le nom de ton entreprise. Messages naturels et personnalisés en québécois." },
  { q: "Si un client est mécontent ?", a: "Lyss respecte immédiatement toute demande de cessation. Le dossier est pausé et tu es notifié pour intervenir personnellement." },
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
