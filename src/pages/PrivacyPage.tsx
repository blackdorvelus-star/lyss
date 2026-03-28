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
              Lyss («&nbsp;nous&nbsp;», «&nbsp;notre&nbsp;», «&nbsp;l'application&nbsp;») est un service de gestion administrative automatisée destiné aux petites et moyennes entreprises (PME) du Québec. La présente politique de confidentialité décrit comment nous recueillons, utilisons, conservons et protégeons vos renseignements personnels conformément à la <strong>Loi sur la protection des renseignements personnels dans le secteur privé</strong> (RLRQ, c. P-39.1) du Québec et à la <strong>Loi 25</strong> (Loi modernisant des dispositions législatives en matière de protection des renseignements personnels, 2021, chapitre 25).
            </p>
          </Section>

          <Section title="2. Responsable de la protection des renseignements personnels">
            <p>
              Conformément à l'article 3.1 de la Loi sur le secteur privé, nous avons désigné un responsable de la protection des renseignements personnels. Toute question, demande d'accès, de rectification ou de suppression peut être adressée à :
            </p>
            <div className="bg-secondary rounded-lg p-4 my-3">
              <p className="font-medium">Responsable de la protection des renseignements personnels</p>
              <p>Courriel : <strong>vie-privee@lyss.ca</strong></p>
              <p>Adresse : Québec (QC), Canada</p>
            </div>
          </Section>

          <Section title="3. Renseignements recueillis">
            <p>Nous recueillons les catégories de renseignements suivantes :</p>
            <ul>
              <li><strong>Informations de compte :</strong> adresse courriel, nom de l'entreprise, mot de passe (chiffré).</li>
              <li><strong>Données de facturation :</strong> noms et coordonnées de vos clients, montants des factures, historique de suivi de courtoisie.</li>
              <li><strong>Données de paiement :</strong> Lyss ne traite aucune transaction financière. Nous stockons uniquement les informations de redirection vers vos propres comptes de paiement (courriel Interac, lien Stripe).</li>
              <li><strong>Données d'utilisation :</strong> journaux de connexion, interactions avec le tableau de bord, préférences de configuration.</li>
              <li><strong>Données vocales :</strong> si vous utilisez les appels vocaux IA, des enregistrements ou transcriptions peuvent être générés et conservés pour le suivi de vos dossiers.</li>
              <li><strong>Données de communication :</strong> contenu des SMS et courriels envoyés par l'adjointe, réponses des clients, sentiments détectés.</li>
            </ul>
          </Section>

          <Section title="4. Finalités de la collecte">
            <p>Vos renseignements sont utilisés aux fins suivantes :</p>
            <ul>
              <li>Fournir et améliorer le service de suivi de facturation automatisé.</li>
              <li>Générer des messages de suivi de courtoisie personnalisés pour vos clients.</li>
              <li>Afficher les informations de paiement de votre entreprise à vos clients via le portail sécurisé.</li>
              <li>Vous fournir des rapports et statistiques sur votre activité.</li>
              <li>Assurer la sécurité et le bon fonctionnement de la plateforme.</li>
              <li>Détecter les situations nécessitant une intervention humaine (escalade automatique).</li>
            </ul>
          </Section>

          <Section title="5. Consentement">
            <p>
              En créant un compte et en utilisant Lyss, vous consentez à la collecte et à l'utilisation de vos renseignements tels que décrits dans cette politique. Vous pouvez retirer votre consentement en tout temps en supprimant votre compte ou en nous contactant à <strong>vie-privee@lyss.ca</strong>.
            </p>
            <p>
              Le retrait du consentement entraîne la cessation du traitement de vos données à des fins non essentielles, mais n'affecte pas la légalité du traitement effectué avant le retrait.
            </p>
          </Section>

          <Section title="6. Partage des renseignements">
            <p>Nous ne vendons jamais vos renseignements personnels. Nous pouvons partager certaines données avec :</p>
            <ul>
              <li><strong>Fournisseurs de services tiers :</strong> hébergement (infrastructure infonuagique), services d'IA pour la génération de messages, services de téléphonie pour les appels vocaux et SMS. Ces fournisseurs sont contractuellement tenus de protéger vos données.</li>
              <li><strong>Vos clients :</strong> uniquement les informations que vous choisissez d'afficher (nom de l'entreprise, coordonnées de paiement) via le portail client.</li>
              <li><strong>Autorités compétentes :</strong> si requis par la loi ou une ordonnance judiciaire.</li>
            </ul>
            <p>
              <strong>Aucun transfert hors Québec</strong> n'est effectué sans que des mesures de protection équivalentes soient en place, conformément à l'article 17 de la Loi sur le secteur privé.
            </p>
          </Section>

          <Section title="7. Conservation et suppression des données">
            <p>
              Vos données sont conservées aussi longtemps que votre compte est actif. Voici notre politique de conservation détaillée :
            </p>
            <ul>
              <li><strong>Données de compte :</strong> conservées pendant la durée de l'abonnement + 90 jours après fermeture.</li>
              <li><strong>Données de facturation :</strong> conservées 7 ans après la dernière transaction (obligation fiscale).</li>
              <li><strong>Données vocales (enregistrements d'appels) :</strong> conservées 180 jours maximum, puis supprimées automatiquement.</li>
              <li><strong>Journaux d'audit :</strong> conservés 3 ans pour conformité légale.</li>
              <li><strong>Données de communication (SMS, courriels) :</strong> conservées pendant la durée de l'abonnement + 90 jours.</li>
            </ul>
            <p>
              <strong>Droit de suppression :</strong> Vous pouvez demander la suppression anticipée de vos données en tout temps en écrivant à <strong>vie-privee@lyss.ca</strong>. La suppression sera effectuée dans un délai maximal de <strong>30 jours</strong>, sauf pour les données soumises à une obligation légale de conservation.
            </p>
          </Section>

          <Section title="8. Sécurité">
            <p>
              Nous mettons en œuvre des mesures de sécurité raisonnables pour protéger vos renseignements, incluant :
            </p>
            <ul>
              <li>Chiffrement des données en transit (TLS 1.3) et au repos (AES-256).</li>
              <li>Contrôle d'accès basé sur les rôles (RLS — Row Level Security).</li>
              <li>Surveillance continue de notre infrastructure et journal d'audit complet.</li>
              <li>Authentification sécurisée et mots de passe chiffrés (bcrypt).</li>
              <li>Cloisonnement des données entre les comptes utilisateurs.</li>
            </ul>
          </Section>

          <Section title="9. Vos droits (Loi 25)">
            <p>Conformément à la Loi 25, vous disposez des droits suivants :</p>
            <ul>
              <li><strong>Droit d'accès :</strong> consulter les renseignements que nous détenons à votre sujet.</li>
              <li><strong>Droit de rectification :</strong> corriger toute information inexacte ou incomplète.</li>
              <li><strong>Droit de suppression (droit à l'oubli) :</strong> demander la suppression de vos données lorsque leur conservation n'est plus justifiée.</li>
              <li><strong>Droit à la portabilité :</strong> obtenir une copie de vos données dans un format structuré, couramment utilisé et lisible par machine.</li>
              <li><strong>Droit de retrait du consentement :</strong> retirer votre consentement en tout temps.</li>
              <li><strong>Droit à la désindexation :</strong> demander la cessation de la diffusion de vos renseignements.</li>
            </ul>
            <p>
              Pour exercer ces droits, contactez notre responsable à <strong>vie-privee@lyss.ca</strong>. Nous répondrons dans un délai maximal de <strong>30 jours</strong>.
            </p>
          </Section>

          <Section title="10. Utilisation de l'intelligence artificielle">
            <p>
              Lyss utilise des technologies d'intelligence artificielle pour générer des messages de suivi personnalisés et analyser les réponses des clients. Aucune décision finale n'est prise par l'IA sans la possibilité d'intervention humaine. L'entrepreneur conserve en tout temps le contrôle total sur les actions de l'adjointe et peut ajuster son comportement, suspendre les relances ou intervenir directement.
            </p>
          </Section>

          <Section title="11. Incident de confidentialité">
            <p>
              En cas d'incident de confidentialité présentant un risque de préjudice sérieux, nous nous engageons à :
            </p>
            <ul>
              <li>Aviser la Commission d'accès à l'information du Québec (CAI) dans les meilleurs délais.</li>
              <li>Aviser les personnes concernées lorsque l'incident présente un risque de préjudice sérieux.</li>
              <li>Tenir un registre de tous les incidents de confidentialité.</li>
            </ul>
          </Section>

          <Section title="12. Plainte">
            <p>
              Si vous estimez que vos droits n'ont pas été respectés, vous pouvez déposer une plainte auprès de la <strong>Commission d'accès à l'information du Québec</strong> (CAI) :
            </p>
            <div className="bg-secondary rounded-lg p-4 my-3">
              <p className="font-medium">Commission d'accès à l'information du Québec</p>
              <p>Téléphone : 1-888-528-7741</p>
              <p>Site Web : <a href="https://www.cai.gouv.qc.ca" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.cai.gouv.qc.ca</a></p>
            </div>
          </Section>

          <Section title="13. Modifications">
            <p>
              Nous nous réservons le droit de modifier cette politique en tout temps. Toute modification importante vous sera communiquée par courriel ou via une notification dans l'application <strong>au moins 30 jours</strong> avant son entrée en vigueur.
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
