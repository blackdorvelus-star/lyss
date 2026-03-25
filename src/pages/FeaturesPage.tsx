import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  TrendingUp,
  ShieldCheck,
  Zap,
  MessageSquare,
  BarChart3,
  Bell,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/landing/Footer";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { delay, duration: 0.5 },
});

const results = [
  {
    icon: Clock,
    stat: "73 %",
    label: "de réponse en moins de 48 h",
    desc: "Tes clients reçoivent un rappel courtois au bon moment — avant que la facture devienne un problème.",
  },
  {
    icon: TrendingUp,
    stat: "2×",
    label: "plus vite que le suivi manuel",
    desc: "Ce qui te prenait 3 heures par semaine se fait maintenant tout seul, pendant que tu travailles.",
  },
  {
    icon: ShieldCheck,
    stat: "0",
    label: "appel gênant à passer",
    desc: "Lyss communique avec le ton que tu choisis. Professionnel, chaleureux, direct — jamais agressif.",
  },
];

const scenarios = [
  {
    title: "Tu envoies une facture. Lyss fait le reste.",
    steps: [
      "Tu déposes ta facture — manuellement, par CSV ou via QuickBooks.",
      "Lyss envoie un premier rappel courtois par courriel, 3 jours après l'échéance.",
      "Pas de réponse ? Un SMS poli suit automatiquement.",
      "Toujours rien ? Lyss passe un appel vocal professionnel.",
      "Ton client paie. Tu reçois une notification. C'est tout.",
    ],
  },
  {
    title: "Ton client conteste ? Lyss gère la conversation.",
    steps: [
      "Le client signale un problème via le portail sécurisé.",
      "Lyss analyse le ton et propose une réponse empathique.",
      "Tu valides ou ajustes — toujours toi qui décides.",
      "L'historique complet reste dans ton dossier.",
    ],
  },
  {
    title: "Tu veux savoir où en est ton argent ? Un coup d'œil suffit.",
    steps: [
      "Tableau de bord en temps réel : montants dus, recouvrés, en attente.",
      "Prévisions de cashflow pour les 30 prochains jours.",
      "Rapports hebdomadaires envoyés automatiquement.",
      "Radar de priorité pour tes dossiers urgents.",
    ],
  },
];

const objections = [
  {
    q: "C'est pas du harcèlement, ça ?",
    a: "Non. Lyss envoie des rappels de courtoisie, pas des menaces. Le ton est calibré, les délais sont respectueux, et ton client peut répondre ou contester à tout moment.",
  },
  {
    q: "Mes clients vont mal le prendre ?",
    a: "Au contraire. 78 % des retards sont des oublis. Un rappel poli au bon moment, c'est un service, pas une agression. Ton client apprécie qu'on le traite avec respect.",
  },
  {
    q: "Je peux quand même garder le contrôle ?",
    a: "Absolument. Tu personnalises le ton, les délais, les canaux. Tu approuves les litiges. Lyss est ton adjointe, pas ta remplaçante.",
  },
  {
    q: "Et si j'ai juste 3-4 factures en retard ?",
    a: "Le plan Solo est fait pour toi : 49 $/mois, 3 dossiers inclus. Moins cher qu'une heure de ton temps à courir après un chèque.",
  },
];

const FeaturesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-5 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src="/logo-lyss.png" alt="Lyss" className="h-9 object-contain" />
          </button>
          <Button
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-display text-xs"
          >
            Essayer gratuitement
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 pt-16 pb-12 text-center">
        <div className="max-w-2xl mx-auto">
          <motion.p {...fade()} className="text-xs font-medium text-primary mb-3 tracking-wide uppercase">
            Comment ça fonctionne
          </motion.p>
          <motion.h1
            {...fade(0.1)}
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight mb-4"
          >
            Tes factures rentrent.{" "}
            <span className="text-primary">Tu fais autre chose.</span>
          </motion.h1>
          <motion.p {...fade(0.2)} className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
            Lyss est ton adjointe administrative IA. Elle fait le suivi de tes factures
            en retard par SMS, courriel et appel vocal — avec le ton que tu choisis.
            Pas de stress. Pas de confrontation. Juste des résultats.
          </motion.p>
        </div>
      </section>

      {/* Results */}
      <section className="px-5 pb-12">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-4">
          {results.map((r, i) => (
            <motion.div
              key={i}
              {...fade(i * 0.08)}
              className="bg-card border border-border rounded-xl p-5"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <r.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-display text-2xl font-bold text-primary">{r.stat}</span>
                <span className="text-xs text-muted-foreground">{r.label}</span>
              </div>
              <p className="text-xs text-secondary-foreground leading-relaxed">{r.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Scenarios */}
      <section className="px-5 py-12 bg-card/50">
        <div className="max-w-3xl mx-auto space-y-12">
          {scenarios.map((s, i) => (
            <motion.div key={i} {...fade()}>
              <div className="flex items-center gap-3 mb-4">
                {i === 0 && <Zap className="w-5 h-5 text-primary flex-shrink-0" />}
                {i === 1 && <MessageSquare className="w-5 h-5 text-primary flex-shrink-0" />}
                {i === 2 && <BarChart3 className="w-5 h-5 text-primary flex-shrink-0" />}
                <h2 className="font-display text-lg sm:text-xl font-bold">{s.title}</h2>
              </div>
              <div className="space-y-2.5 ml-8">
                {s.steps.map((step, j) => (
                  <div key={j} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-secondary-foreground leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="px-5 py-12">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fade()} className="text-center mb-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">
              Fait pour toi si…
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: Users, text: "Tu es travailleur autonome et tu perds du temps à courir après tes paiements." },
              { icon: Bell, text: "Tu gères une PME et tes factures en retard s'accumulent sans que personne ne fasse le suivi." },
              { icon: Clock, text: "Tu passes des heures chaque semaine à écrire des courriels de rappel qui restent sans réponse." },
              { icon: ShieldCheck, text: "Tu veux un suivi professionnel sans confrontation — parce que tes clients sont aussi tes relations." },
            ].map((item, i) => (
              <motion.div
                key={i}
                {...fade(i * 0.05)}
                className="flex items-start gap-3 bg-card border border-border rounded-xl p-4"
              >
                <item.icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-secondary-foreground leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Objections */}
      <section className="px-5 py-12 bg-card/50">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fade()} className="text-center mb-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">
              Les questions qu'on nous pose
            </h2>
          </motion.div>
          <div className="space-y-4">
            {objections.map((o, i) => (
              <motion.div
                key={i}
                {...fade(i * 0.05)}
                className="bg-card border border-border rounded-xl p-5"
              >
                <h3 className="font-display font-bold text-sm mb-2">{o.q}</h3>
                <p className="text-xs text-secondary-foreground leading-relaxed">{o.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-16 text-center">
        <div className="max-w-lg mx-auto">
          <motion.h2 {...fade()} className="font-display text-2xl sm:text-3xl font-bold mb-3">
            Prêt à récupérer ton argent ?
          </motion.h2>
          <motion.p {...fade(0.1)} className="text-sm text-muted-foreground mb-6">
            3 crédits offerts. Aucun engagement. Configuration en 2 minutes.
          </motion.p>
          <motion.div {...fade(0.2)} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/dashboard")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold text-sm px-8 h-11"
            >
              Commencer gratuitement
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/demo")}
              className="font-display font-semibold text-sm px-8 h-11 border-primary/30 text-primary hover:bg-primary/5"
            >
              Voir la démo
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FeaturesPage;
