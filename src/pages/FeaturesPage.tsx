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
  FileText,
  Phone,
  CalendarCheck,
  BookOpen,
  Send,
  Eye,
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
    stat: "10 h",
    label: "économisées par semaine",
    desc: "Suivi de factures, relances, appels, rapports — Lyss fait le travail administratif que tu repousses chaque jour.",
  },
  {
    icon: TrendingUp,
    stat: "73 %",
    label: "de réponse en 48 h",
    desc: "Tes clients sont relancés au bon moment, sur le bon canal. Résultat : ils paient plus vite.",
  },
  {
    icon: ShieldCheck,
    stat: "24/7",
    label: "sans pause ni vacances",
    desc: "Lyss travaille les soirs, fins de semaine et jours fériés. Ton bureau ne ferme jamais.",
  },
];

const duties = [
  {
    icon: FileText,
    title: "Gestion des factures",
    desc: "Import manuel, CSV, QuickBooks ou Sage. Lyss classe, organise et suit chaque facture de l'émission au paiement.",
  },
  {
    icon: Send,
    title: "Relances automatiques",
    desc: "Courriels, SMS et appels vocaux — dans l'ordre, avec les bons délais. Lyss ne lâche pas tant que c'est pas payé.",
  },
  {
    icon: Phone,
    title: "Appels professionnels",
    desc: "Lyss appelle tes clients avec un ton professionnel québécois. Elle négocie, prend des engagements et te fait un résumé.",
  },
  {
    icon: MessageSquare,
    title: "Gestion des litiges",
    desc: "Un client conteste ? Lyss suspend les relances, analyse la situation et te propose une réponse. Toi tu décides.",
  },
  {
    icon: Users,
    title: "Relations clients",
    desc: "Fiche complète par client : historique des factures, échanges, comportement de paiement. Lyss connaît tes clients.",
  },
  {
    icon: BarChart3,
    title: "Rapports et prévisions",
    desc: "Tableau de bord en temps réel, prévisions de cashflow, rapports hebdomadaires. Tu sais exactement où en est ton argent.",
  },
  {
    icon: CalendarCheck,
    title: "Suivi de soumissions",
    desc: "Lyss suit aussi tes soumissions envoyées. Rappels automatiques avant expiration pour ne perdre aucun contrat.",
  },
  {
    icon: BookOpen,
    title: "Piste d'audit complète",
    desc: "Chaque action est enregistrée : relance envoyée, appel passé, réponse reçue. Traçabilité totale pour ta tranquillité.",
  },
  {
    icon: Eye,
    title: "Portail client sécurisé",
    desc: "Ton client voit son solde, paie en ligne, discute avec Lyss ou signale un problème — sans t'appeler.",
  },
];

const scenarios = [
  {
    title: "Lyss ouvre un dossier et ne lâche pas.",
    steps: [
      "Tu déposes ta facture — manuellement, par CSV ou via QuickBooks/Sage.",
      "Lyss ouvre un dossier de suivi et planifie la séquence complète.",
      "Premier rappel courtois par courriel, 3 jours après l'échéance.",
      "Pas de réponse ? SMS automatique avec lien de paiement sécurisé.",
      "Toujours rien ? Appel vocal IA — professionnel, jamais agressif.",
      "Lyss vérifie le paiement (QuickBooks, Sage, Stripe) avant chaque relance.",
      "Dossier fermé seulement quand le paiement est confirmé.",
    ],
  },
  {
    title: "Ton client conteste ? Le dossier continue, adapté.",
    steps: [
      "Le client signale un problème via son portail sécurisé.",
      "Les relances sont suspendues automatiquement — pas de harcèlement.",
      "Lyss analyse le ton et propose une réponse empathique.",
      "Tu valides, ajustes, ou reprends le suivi — toujours toi qui décides.",
      "L'historique complet du dossier reste accessible : échanges, paiements partiels, notes.",
    ],
  },
];

const objections = [
  {
    q: "C'est quoi la différence avec une vraie secrétaire ?",
    a: "Lyss fait le même travail administratif — suivi, relances, classement, rapports — mais elle travaille 24/7, ne prend pas de vacances, et coûte 49 $/mois au lieu de 3 500 $. Elle ne remplace pas ton jugement : elle exécute ce que tu décides.",
  },
  {
    q: "C'est pas du harcèlement, ça ?",
    a: "Non. Lyss envoie des rappels de courtoisie, pas des menaces. Le ton est calibré, les délais sont respectueux, et ton client peut répondre ou contester à tout moment.",
  },
  {
    q: "Mes clients vont mal le prendre ?",
    a: "Au contraire. 78 % des retards sont des oublis. Un rappel poli au bon moment, c'est un service. Ton client apprécie qu'on le traite avec respect.",
  },
  {
    q: "Je peux quand même garder le contrôle ?",
    a: "Absolument. Tu personnalises le ton, les délais, les canaux. Tu approuves les litiges. Lyss est ton adjointe, pas ta remplaçante.",
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
            Ton adjointe administrative IA
          </motion.p>
          <motion.h1
            {...fade(0.1)}
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight mb-4"
          >
            Tout ce qu'une secrétaire fait.{" "}
            <span className="text-primary">Sans en embaucher une.</span>
          </motion.h1>
          <motion.p {...fade(0.2)} className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
            Suivi de factures, relances par SMS, courriel et appel, gestion des litiges,
            rapports financiers, relations clients — Lyss gère toute ton administration
            de facturation du début à la fin. Tu travailles, elle s'occupe du reste.
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

      {/* What Lyss does — full secretary duties */}
      <section className="px-5 py-12 bg-card/50">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fade()} className="text-center mb-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">
              Tout ce que Lyss fait pour toi
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Le même travail qu'une adjointe administrative — automatisé, précis, et disponible 24/7.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {duties.map((d, i) => (
              <motion.div
                key={i}
                {...fade(i * 0.04)}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2.5">
                  <d.icon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-display font-bold text-sm mb-1">{d.title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{d.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Scenarios */}
      <section className="px-5 py-12">
        <div className="max-w-3xl mx-auto space-y-12">
          <motion.div {...fade()} className="text-center mb-4">
            <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">
              Comment ça se passe, concrètement
            </h2>
          </motion.div>
          {scenarios.map((s, i) => (
            <motion.div key={i} {...fade()}>
              <div className="flex items-center gap-3 mb-4">
                {i === 0 && <Zap className="w-5 h-5 text-primary flex-shrink-0" />}
                {i === 1 && <MessageSquare className="w-5 h-5 text-primary flex-shrink-0" />}
                <h3 className="font-display text-lg font-bold">{s.title}</h3>
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
      <section className="px-5 py-12 bg-card/50">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fade()} className="text-center mb-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold mb-2">
              Fait pour toi si…
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { icon: Users, text: "Tu es travailleur autonome et tu n'as pas les moyens d'embaucher une secrétaire." },
              { icon: Bell, text: "Tu gères une PME et personne ne fait le suivi administratif de tes factures." },
              { icon: Clock, text: "Tu passes des heures chaque semaine sur de l'administratif au lieu de travailler sur ton métier." },
              { icon: ShieldCheck, text: "Tu veux un suivi professionnel sans confrontation — tes clients sont aussi tes relations." },
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
      <section className="px-5 py-12">
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
            Ton adjointe commence aujourd'hui.
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
