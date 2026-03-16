import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "C'est quoi exactement Admin-Flow ?",
    a: "Admin-Flow est une adjointe administrative propulsée par l'intelligence artificielle. Elle s'occupe de tes suivis de facturation — messages de courtoisie par SMS, courriel et appels — pour que tu te concentres sur ton métier au lieu de courir après tes paiements.",
  },
  {
    q: "Est-ce que c'est légal au Québec ?",
    a: "Absolument. Admin-Flow est un service de messagerie administrative, pas une agence de recouvrement. L'adjointe envoie des suivis de courtoisie professionnels. Nos messages respectent la Loi sur le recouvrement de certaines créances (RLRQ, c. R-2.2) : aucune menace, aucun harcèlement, jamais.",
  },
  {
    q: "Comment l'adjointe contacte mes clients ?",
    a: "Selon les coordonnées que tu fournis : SMS, courriel ou appel vocal IA. Chaque message est rédigé dans un ton québécois professionnel et inclut un lien de paiement sécurisé. Tu peux choisir la personnalité de l'adjointe (chaleureuse, professionnelle ou persévérante).",
  },
  {
    q: "Mes clients vont-ils savoir que c'est une IA ?",
    a: "L'adjointe se présente comme faisant partie de ton équipe administrative. Les messages sont naturels, personnalisés et rédigés dans un français québécois authentique. Le but est que ton client se sente contacté par une vraie personne de ton bureau.",
  },
  {
    q: "Combien de tentatives par dossier ?",
    a: "Chaque dossier inclut jusqu'à 5 SMS, 3 courriels et 2 appels vocaux IA, étalés sur une période raisonnable. Si le client répond ou paie, l'adjointe arrête automatiquement les suivis.",
  },
  {
    q: "Et si mon client est mécontent d'être contacté ?",
    a: "L'adjointe respecte toujours les demandes de cessation de contact. Si un client demande qu'on arrête, le dossier est mis en pause immédiatement et tu en es notifié. Le ton reste toujours respectueux et professionnel.",
  },
  {
    q: "Puis-je annuler en tout temps ?",
    a: "Oui, sans frais ni pénalité. Tu peux annuler ton abonnement à n'importe quel moment depuis ton tableau de bord. Les dossiers en cours seront complétés, mais aucun nouveau suivi ne sera lancé.",
  },
  {
    q: "Est-ce que ça fonctionne pour les gros montants ?",
    a: "Oui. L'adjointe est aussi efficace pour une facture de 200 $ que pour une de 25 000 $. Pour les montants importants, on recommande la personnalité « Professionnelle » qui adopte un ton plus formel et propose des plans de paiement structurés.",
  },
];

const FAQSection = () => {
  return (
    <section className="px-5 py-16">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-2xl font-bold mb-2">Questions fréquentes</h2>
          <p className="text-sm text-muted-foreground">
            Tout ce que tu dois savoir avant de confier tes dossiers à l'adjointe.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-border rounded-xl px-5 bg-card data-[state=open]:border-primary/20"
              >
                <AccordionTrigger className="text-sm font-medium text-left py-4 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
