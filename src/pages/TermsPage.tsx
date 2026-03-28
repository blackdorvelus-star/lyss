import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/landing/Footer";

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-5 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <img src="/logo-lyss.png" alt="Lyss" className="h-8 object-contain" />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-12">
        <h1 className="font-display text-3xl font-bold mb-2">Conditions d'utilisation</h1>
        <p className="text-sm text-muted-foreground mb-10">Dernière mise à jour : {new Date().toLocaleDateString("fr-CA")}</p>

        <div className="space-y-8">
          <Section title="1. Acceptation des conditions">
            <p>
              En accédant à Lyss ou en utilisant nos services, vous acceptez d'être lié par les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le service.
            </p>
          </Section>

          <Section title="2. Description du service">
            <p>
              Lyss est une plateforme de gestion administrative automatisée qui offre des services de suivi de facturation, de gestion de relations clients et de communications automatisées par intelligence artificielle. Lyss agit en tant qu'outil de <strong>suivi de courtoisie</strong> et ne constitue pas un service de recouvrement de créances au sens de la <strong>Loi sur le recouvrement de certaines créances</strong> (RLRQ, c. R-2.2).
            </p>
          </Section>

          <Section title="3. Admissibilité">
            <p>
              Le service est destiné aux entreprises et travailleurs autonomes enregistrés au Québec, Canada. Vous devez avoir au moins 18 ans et la capacité juridique de conclure un contrat pour utiliser Lyss.
            </p>
          </Section>

          <Section title="4. Compte utilisateur">
            <ul>
              <li>Vous êtes responsable de maintenir la confidentialité de vos identifiants de connexion.</li>
              <li>Vous êtes responsable de toute activité effectuée sous votre compte.</li>
              <li>Vous devez nous informer immédiatement de toute utilisation non autorisée de votre compte.</li>
              <li>Nous nous réservons le droit de suspendre ou de supprimer tout compte en violation de ces conditions.</li>
            </ul>
          </Section>

          <Section title="5. Utilisation acceptable">
            <p>En utilisant Lyss, vous vous engagez à :</p>
            <ul>
              <li>Utiliser le service uniquement à des fins légales et conformément aux lois applicables au Québec.</li>
              <li>Ne pas utiliser le service pour du harcèlement, de l'intimidation ou des communications abusives envers vos clients.</li>
              <li>Respecter la fréquence et le ton appropriés dans les communications de suivi de courtoisie.</li>
              <li>Fournir des informations exactes concernant vos factures et vos clients.</li>
              <li>Ne pas tenter de contourner les mesures de sécurité de la plateforme.</li>
            </ul>
          </Section>

          <Section title="6. Traitement des paiements">
            <p>
              <strong>Lyss ne traite aucune transaction financière.</strong> Notre service se limite à faciliter la communication entre vous et vos clients concernant les paiements dus. Les paiements sont effectués directement entre votre client et vos propres comptes de paiement (virement Interac, Stripe, etc.). Lyss ne détient jamais les fonds de vos clients.
            </p>
          </Section>

          <Section title="7. Intelligence artificielle">
            <p>
              Lyss utilise des technologies d'intelligence artificielle pour générer des messages de suivi de courtoisie et faciliter les communications. Bien que nous nous efforcions d'assurer la qualité et la pertinence de ces messages :
            </p>
            <ul>
              <li>Les messages générés par l'IA sont des suggestions et vous demeurez responsable de leur contenu.</li>
              <li>Nous ne garantissons pas que les messages seront parfaitement adaptés à chaque situation.</li>
              <li>Vous avez la possibilité de personnaliser le ton et le contenu des communications.</li>
            </ul>
          </Section>

          <Section title="8. Tarification et facturation">
            <ul>
              <li>Les tarifs sont affichés en dollars canadiens (CAD), taxes en sus.</li>
              <li>Les abonnements sont facturés mensuellement selon le plan choisi.</li>
              <li>Les dossiers supplémentaires au-delà de votre forfait sont facturés au tarif de 20 $ par dossier.</li>
              <li>Vous pouvez annuler votre abonnement en tout temps. L'annulation prend effet à la fin de la période de facturation en cours.</li>
              <li>Aucun remboursement n'est offert pour les périodes partiellement utilisées.</li>
            </ul>
          </Section>

          <Section title="9. Propriété intellectuelle">
            <p>
              L'ensemble du contenu, des fonctionnalités et de la technologie de Lyss demeure notre propriété exclusive. Vous conservez la propriété de toutes les données que vous téléversez ou saisissez dans la plateforme.
            </p>
          </Section>

          <Section title="10. Limitation de responsabilité">
            <ul>
              <li>Lyss est fourni «&nbsp;tel quel&nbsp;» sans garantie de quelque nature que ce soit.</li>
              <li>Nous ne garantissons pas que le service sera disponible en tout temps ou exempt d'erreurs.</li>
              <li>Nous ne sommes pas responsables des résultats de vos efforts de suivi de facturation.</li>
              <li>Notre responsabilité totale est limitée au montant que vous avez payé pour le service au cours des 12 derniers mois.</li>
            </ul>
          </Section>

          <Section title="11. Résiliation">
            <p>
              Nous pouvons résilier ou suspendre votre accès au service, sans préavis, pour toute violation de ces conditions. Vous pouvez résilier votre compte en tout temps en nous contactant à <strong>support@lyss.ca</strong>.
            </p>
          </Section>

          <Section title="12. Loi applicable et juridiction">
            <p>
              Les présentes conditions sont régies par les lois de la province de Québec et les lois fédérales du Canada qui s'y appliquent. Tout litige sera soumis à la juridiction exclusive des tribunaux du district judiciaire de Québec.
            </p>
          </Section>

          <Section title="13. Modifications">
            <p>
              Nous nous réservons le droit de modifier ces conditions en tout temps. Les modifications entreront en vigueur dès leur publication. Votre utilisation continue du service après la publication constitue votre acceptation des conditions modifiées.
            </p>
          </Section>

          <Section title="14. Contact">
            <p>
              Pour toute question concernant ces conditions d'utilisation, contactez-nous à <strong>support@lyss.ca</strong>.
            </p>
          </Section>
        </div>
      </div>

      <Footer />
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h2 className="font-display text-lg font-bold mb-3">{title}</h2>
    <div className="text-sm text-secondary-foreground leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-sm">
      {children}
    </div>
  </div>
);

export default TermsPage;
