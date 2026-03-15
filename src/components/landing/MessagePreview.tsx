import { motion } from "framer-motion";

const MessagePreview = () => {
  return (
    <section className="px-5 py-12">
      <div className="max-w-lg mx-auto">
        <h2 className="font-display text-2xl font-bold text-center mb-3">
          L'IA parle comme du monde
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Pas de robot froid. Un ton humain, québécois, professionnel.
        </p>

        {/* SMS mockup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card border border-border rounded-2xl p-5 space-y-3"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">IA</div>
            <div>
              <p className="text-sm font-medium">Cash-Flow AI</p>
              <p className="text-xs text-muted-foreground">SMS automatisé</p>
            </div>
          </div>

          <div className="bg-secondary rounded-xl rounded-tl-sm p-4 text-sm leading-relaxed">
            <p>
              Bonjour Marc, c'est un suivi pour la facture #1247 de Plomberie Lévis (850 $, due le 12 mars).
            </p>
            <p className="mt-2">
              On comprend que ça peut arriver ! Si tu préfères, on peut diviser ça en 2 paiements Interac. Clique ici pour régler ça en 2 minutes 👇
            </p>
            <p className="mt-2 text-primary font-medium">
              → payer.cashflow-ai.ca/f/1247
            </p>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            Taux de réponse moyen : <span className="text-accent font-semibold">73 %</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default MessagePreview;
