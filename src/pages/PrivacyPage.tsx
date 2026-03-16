import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/landing/Footer";

const PrivacyPage = () => {
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
        <h1 className="font-display text-3xl font-bold mb-2">Politique de confidentialité</h1>
        <p className="text-sm text-muted-foreground mb-10">Dernière mise à jour : {new Date().toLocaleDateString("fr-CA")}</p>

        <div className="prose-custom space-y-8">
          <Section title="1. Introduction">
            <p>
              Lyss («&nbsp;nous&nbsp;», «&nbsp;notre&nbsp;», «&nbsp;l'application&nbsp;») est un service de gestion administrative automatisée destiné aux petites et moyennes entreprises (PME) du Québec. La présente politique de confidentialité décrit comment nous recueillons, utilisons, conservons et protégeons vos renseignements personnels conformément à la <strong>Loi sur la protection des renseignements personnels dans le secteur privé</strong> (RLRQ, c. P-39.1) du Québec et à la <strong>Loi 25</strong>.
            </p>
          </Section>

          <Section title="2. Renseignements recueillis">
            <p>Nous recueillons les catégories de renseignements suivantes :</p>
            <ul>
              <li><strong>Informations de compte :</strong> adresse courriel, nom de l'entreprise, mot de passe (chiffré).</li>
              <li><strong>Données de facturation :</strong> noms et coordonnées de vos clients, montants des factures, historique de suivi de courtoisie.</li>
              <li><strong>Données de paiement :</strong> Lyss ne traite aucune transaction financière. Nous stockons uniquement les informations de redirection vers vos propres comptes de paiement (courriel Interac, lien Stripe).</li>
              <li><strong>Données d'utilisation :</strong> journaux de connexion, interactions avec le tableau de bord, préférences de configuration.</li>
              <li><strong>Données vocales :</strong> si vous utilisez les appels vocaux IA, des enregistrements ou transcriptions peuvent être générés et conservés pour le suivi de vos dossiers.</li>
            </ul>
          </Section>

          <Section title="3. Finalités de la collecte">
            <p>Vos renseignements sont utilisés aux fins suivantes :</p>
            <ul>
              <li>Fournir et améliorer le service de suivi de facturation automatisé.</li>
              <li>Générer des messages de suivi de courtoisie personnalisés pour vos clients.</li>
              <li>Afficher les informations de paiement de votre entreprise à vos clients via le portail sécurisé.</li>
              <li>Vous fournir des rapports et statistiques sur votre activité.</li>
              <li>Assurer la sécurité et le bon fonctionnement de la plateforme.</li>
            </ul>
          </Section>

          <Section title="4. Consentement">
            <p>
              En créant un compte et en utilisant Lyss, vous consentez à la collecte et à l'utilisation de vos renseignements tels que décrits dans cette politique. Vous pouvez retirer votre consentement en tout temps en supprimant votre compte ou en nous contactant.
            </p>
          </Section>

          <Section title="5. Partage des renseignements">
            <p>Nous ne vendons jamais vos renseignements personnels. Nous pouvons partager certaines données avec :</p>
            <ul>
              <li><strong>Fournisseurs de services tiers :</strong> hébergement (infrastructure infonuagique), services d'IA pour la génération de messages, services de téléphonie pour les appels vocaux.</li>
              <li><strong>Vos clients :</strong> uniquement les informations que vous choisissez d'afficher (nom de l'entreprise, coordonnées de paiement) via le portail client.</li>
              <li><strong>Autorités compétentes :</strong> si requis par la loi ou une ordonnance judiciaire.</li>
            </ul>
          </Section>

          <Section title="6. Conservation des données">
            <p>
              Vos données sont conservées aussi longtemps que votre compte est actif. Après la fermeture de votre compte, nous conservons vos données pendant une période maximale de <strong>90 jours</strong> avant leur suppression définitive, sauf obligation légale contraire.
            </p>
          </Section>

          <Section title="7. Sécurité">
            <p>
              Nous mettons en œuvre des mesures de sécurité raisonnables pour protéger vos renseignements, incluant le chiffrement des données en transit et au repos, le contrôle d'accès basé sur les rôles, et la surveillance continue de notre infrastructure.
            </p>
          </Section>

          <Section title="8. Vos droits">
            <p>Conformément à la Loi 25, vous disposez des droits suivants :</p>
            <ul>
              <li><strong>Droit d'accès :</strong> consulter les renseignements que nous détenons à votre sujet.</li>
              <li><strong>Droit de rectification :</strong> corriger toute information inexacte.</li>
              <li><strong>Droit de suppression :</strong> demander la suppression de vos données.</li>
              <li><strong>Droit à la portabilité :</strong> obtenir une copie de vos données dans un format structuré.</li>
              <li><strong>Droit de retrait du consentement :</strong> retirer votre consentement en tout temps.</li>
            </ul>
            <p>
              Pour exercer ces droits, contactez-nous à <strong>support@lyss.ca</strong>.
            </p>
          </Section>

          <Section title="9. Responsable de la protection des renseignements personnels">
            <p>
              Le responsable de la protection des renseignements personnels peut être joint à l'adresse <strong>support@lyss.ca</strong>. Toute plainte relative à la gestion de vos renseignements peut également être adressée à la <strong>Commission d'accès à l'information du Québec</strong> (CAI).
            </p>
          </Section>

          <Section title="10. Modifications">
            <p>
              Nous nous réservons le droit de modifier cette politique en tout temps. Toute modification importante vous sera communiquée par courriel ou via une notification dans l'application.
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

export default PrivacyPage;
