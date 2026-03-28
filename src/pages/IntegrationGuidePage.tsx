import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const IntegrationGuidePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Scroll to hash if present
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <div className="prose prose-lg max-w-none">
          <h1>Guide de Configuration des Intégrations Lyss</h1>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg my-6">
            <p className="text-blue-800">
              <strong>Note :</strong> Ce guide est également disponible sous forme de fichier Markdown pour les administrateurs techniques.
            </p>
          </div>

          <h2 id="quickbooks">📋 Configuration QuickBooks Online</h2>
          
          <h3>1. Variables d'environnement nécessaires</h3>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
{`QUICKBOOKS_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
QUICKBOOKS_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
APP_URL=https://votre-domaine.lyss.ca`}
          </pre>

          <h3>2. Créer une app Intuit Developer</h3>
          <ol>
            <li>Allez sur <a href="https://developer.intuit.com" target="_blank" rel="noopener noreferrer">developer.intuit.com</a></li>
            <li>Créez une nouvelle app "QuickBooks Online"</li>
            <li>Dans "Keys & OAuth" → copiez :
              <ul>
                <li><strong>Client ID</strong> → <code>QUICKBOOKS_CLIENT_ID</code></li>
                <li><strong>Client Secret</strong> → <code>QUICKBOOKS_CLIENT_SECRET</code></li>
              </ul>
            </li>
          </ol>

          <h3>3. Configurer les Redirect URIs</h3>
          <p>Dans l'app Intuit, ajoutez ces Redirect URIs :</p>
          <pre className="bg-muted p-4 rounded-lg">
{`https://[votre-project-id].supabase.co/functions/v1/quickbooks-callback
https://votre-domaine.lyss.ca`}
          </pre>

          <h3>4. Activer les scopes nécessaires</h3>
          <ul>
            <li><code>com.intuit.quickbooks.accounting</code> (pour lire les factures)</li>
          </ul>

          <h2 id="sage">🔧 Configuration Sage</h2>
          
          <h3>1. Variables d'environnement nécessaires</h3>
          <pre className="bg-muted p-4 rounded-lg">
{`SAGE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SAGE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
APP_URL=https://votre-domaine.lyss.ca`}
          </pre>

          <h3>2. Créer une app Sage Developer</h3>
          <ol>
            <li>Allez sur <a href="https://developer.sage.com" target="_blank" rel="noopener noreferrer">developer.sage.com</a></li>
            <li>Créez une nouvelle app "Accounting API"</li>
            <li>Copiez les credentials</li>
          </ol>

          <h3>3. Configurer les Redirect URIs</h3>
          <pre className="bg-muted p-4 rounded-lg">
{`https://[votre-project-id].supabase.co/functions/v1/sage-callback
https://votre-domaine.lyss.ca`}
          </pre>

          <h2 id="telnyx">📞 Configuration Telnyx (SMS/Appels)</h2>
          <p>Telnyx est pré-configuré avec Lyss. Aucune action requise.</p>

          <h2 id="relevance">🤖 Configuration Relevance AI</h2>
          <p>Relevance AI est pré-configuré avec Lyss. Aucune action requise.</p>

          <h2>🚀 Déploiement</h2>
          
          <h3>1. Ajouter les secrets à Supabase</h3>
          <pre className="bg-muted p-4 rounded-lg">
{`# Via Supabase Dashboard
Settings → Edge Functions → Secrets

# Via CLI
supabase secrets set QUICKBOOKS_CLIENT_ID=xxx
supabase secrets set QUICKBOOKS_CLIENT_SECRET=xxx
supabase secrets set SAGE_CLIENT_ID=xxx
supabase secrets set SAGE_CLIENT_SECRET=xxx
supabase secrets set APP_URL=https://votre-domaine.lyss.ca`}
          </pre>

          <h3>2. Déployer les Edge Functions</h3>
          <pre className="bg-muted p-4 rounded-lg">
{`supabase functions deploy quickbooks-auth --no-verify-jwt
supabase functions deploy quickbooks-callback --no-verify-jwt
supabase functions deploy quickbooks-sync --no-verify-jwt
supabase functions deploy sage-auth --no-verify-jwt
supabase functions deploy sage-callback --no-verify-jwt
supabase functions deploy sage-sync --no-verify-jwt`}
          </pre>

          <h2>🧪 Tests</h2>
          
          <h3>Tester QuickBooks :</h3>
          <ol>
            <li>Connectez-vous à Lyss</li>
            <li>Allez dans "Intégrations"</li>
            <li>Cliquez sur "Connecter QuickBooks"</li>
            <li>Vérifiez que :
              <ul>
                <li>La redirection OAuth fonctionne</li>
                <li>Le token est sauvegardé</li>
                <li>La synchronisation importe des factures</li>
              </ul>
            </li>
          </ol>

          <h3>Tester Sage :</h3>
          <p>Même procédure que QuickBooks</p>

          <h2>🔍 Dépannage</h2>
          
          <h3>Erreur commune : "QUICKBOOKS_CLIENT_ID not configured"</h3>
          <ul>
            <li>Vérifiez que le secret est bien défini dans Supabase</li>
            <li>Redéployez la fonction après avoir ajouté le secret</li>
          </ul>

          <h3>Erreur : "Redirect URI mismatch"</h3>
          <ul>
            <li>Vérifiez que l'URL dans Intuit/Sage correspond exactement à celle dans le code</li>
            <li>Incluez le protocol <code>https://</code></li>
          </ul>

          <h3>Erreur : "Invalid scope"</h3>
          <ul>
            <li>Assurez-vous d'avoir activé les scopes nécessaires dans le dashboard développeur</li>
          </ul>

          <h3>Les factures ne s'importent pas</h3>
          <ul>
            <li>Vérifiez que le compte QuickBooks/Sage contient des factures "impayées"</li>
            <li>Consultez les logs Edge Functions dans Supabase Dashboard</li>
          </ul>

          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="text-amber-800">📞 Support</h3>
            <p className="text-amber-700">
              Si les problèmes persistent :
              <ol className="mt-2">
                <li>Consultez les logs Edge Functions dans Supabase</li>
                <li>Vérifiez les tables <code>quickbooks_connections</code> / <code>sage_connections</code></li>
                <li>Contactez <a href="mailto:support@lyss.ca" className="underline">support@lyss.ca</a> avec :
                  <ul>
                    <li>L'erreur exacte</li>
                    <li>Les logs pertinents</li>
                    <li>Votre project ID Supabase</li>
                  </ul>
                </li>
              </ol>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Note :</strong> Les intégrations nécessitent un compte développeur actif chez Intuit/Sage. 
              Les comptes d'essai peuvent avoir des limitations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationGuidePage;
