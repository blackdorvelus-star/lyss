# Guide de Configuration des Intégrations Lyss

## 📋 Prérequis

### Variables d'environnement nécessaires dans Supabase :

**QuickBooks Online :**
```
QUICKBOOKS_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
QUICKBOOKS_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

**Sage :**
```
SAGE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SAGE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

**App URL (pour les callbacks) :**
```
APP_URL=https://votre-domaine.lyss.ca
```

## 🔧 Configuration QuickBooks

### 1. Créer une app Intuit Developer
1. Allez sur [developer.intuit.com](https://developer.intuit.com)
2. Créez une nouvelle app "QuickBooks Online"
3. Dans "Keys & OAuth" → copiez :
   - **Client ID** → `QUICKBOOKS_CLIENT_ID`
   - **Client Secret** → `QUICKBOOKS_CLIENT_SECRET`

### 2. Configurer les Redirect URIs
Dans l'app Intuit, ajoutez ces Redirect URIs :
```
https://[votre-project-id].supabase.co/functions/v1/quickbooks-callback
https://votre-domaine.lyss.ca
```

### 3. Activer les scopes nécessaires
- `com.intuit.quickbooks.accounting` (pour lire les factures)

### 4. Tester la connexion
1. Déployez les Edge Functions
2. Allez dans Lyss → Intégrations → QuickBooks
3. Cliquez sur "Connecter QuickBooks"
4. Autorisez l'accès dans l'interface Intuit

## 🔧 Configuration Sage

### 1. Créer une app Sage Developer
1. Allez sur [developer.sage.com](https://developer.sage.com)
2. Créez une nouvelle app "Accounting API"
3. Copiez les credentials

### 2. Configurer les Redirect URIs
```
https://[votre-project-id].supabase.co/functions/v1/sage-callback
https://votre-domaine.lyss.ca
```

## 🚀 Déploiement

### 1. Ajouter les secrets à Supabase
```bash
# Via Supabase Dashboard
Settings → Edge Functions → Secrets

# Via CLI
supabase secrets set QUICKBOOKS_CLIENT_ID=xxx
supabase secrets set QUICKBOOKS_CLIENT_SECRET=xxx
supabase secrets set SAGE_CLIENT_ID=xxx
supabase secrets set SAGE_CLIENT_SECRET=xxx
supabase secrets set APP_URL=https://votre-domaine.lyss.ca
```

### 2. Déployer les Edge Functions
```bash
supabase functions deploy quickbooks-auth --no-verify-jwt
supabase functions deploy quickbooks-callback --no-verify-jwt
supabase functions deploy quickbooks-sync --no-verify-jwt
supabase functions deploy sage-auth --no-verify-jwt
supabase functions deploy sage-callback --no-verify-jwt
supabase functions deploy sage-sync --no-verify-jwt
```

### 3. Appliquer les migrations SQL
```bash
supabase db push
```

## 🧪 Tests

### Tester QuickBooks :
1. Connectez-vous à Lyss
2. Allez dans "Intégrations"
3. Cliquez sur "Connecter QuickBooks"
4. Vérifiez que :
   - La redirection OAuth fonctionne
   - Le token est sauvegardé dans `quickbooks_connections`
   - La synchronisation importe des factures

### Tester Sage :
Même procédure que QuickBooks

## 🔍 Dépannage

### Erreur commune : "QUICKBOOKS_CLIENT_ID not configured"
- Vérifiez que le secret est bien défini dans Supabase
- Redéployez la fonction après avoir ajouté le secret

### Erreur : "Redirect URI mismatch"
- Vérifiez que l'URL dans Intuit/Sage correspond exactement à celle dans le code
- Incluez le protocol `https://`

### Erreur : "Invalid scope"
- Assurez-vous d'avoir activé les scopes nécessaires dans le dashboard développeur

### Les factures ne s'importent pas
- Vérifiez que le compte QuickBooks/Sage contient des factures "impayées"
- Consultez les logs Edge Functions dans Supabase Dashboard

## 📞 Support

Si les problèmes persistent :
1. Consultez les logs Edge Functions dans Supabase
2. Vérifiez les tables `quickbooks_connections` / `sage_connections`
3. Contactez support@lyss.ca avec :
   - L'erreur exacte
   - Les logs pertinents
   - Votre project ID Supabase

---

**Note :** Les intégrations nécessitent un compte développeur actif chez Intuit/Sage. Les comptes d'essai peuvent avoir des limitations.
