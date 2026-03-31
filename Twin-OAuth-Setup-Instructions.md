# Twin.so OAuth Setup Instructions for Lyss

## 🎯 Objectif
Configurer l'authentification OAuth entre GitHub et Twin.so pour automatiser la synchronisation des agents.

## 📋 Prérequis

### 1. Comptes nécessaires
- ✅ **GitHub** : Compte avec accès au dépôt `blackdorvelus-star/lyss`
- ✅ **Twin.so** : Compte Twin.so (peut être créé avec GitHub OAuth)

### 2. Permissions nécessaires
- **GitHub** : Admin ou write permissions sur le dépôt
- **Twin.so** : Accès pour créer des agents et webhooks

## 🚀 Étapes de configuration

### Étape 1 : Installer l'application GitHub Twin.so

1. **Ouvrez** le lien d'installation :
   ```
   https://app.twin.so/integrations/github
   ```

2. **Cliquez** sur "Install GitHub App"

3. **Sélectionnez** votre compte GitHub

4. **Choisissez** le dépôt :
   - ✅ `blackdorvelus-star/lyss`
   - ❌ Tous les dépôts (optionnel, mais spécifique recommandé)

5. **Autorisez** les permissions :
   - ✅ Repository contents: **Read & write**
   - ✅ Workflows: **Read & write**
   - ✅ Metadata: **Read-only**
   - ✅ Pull requests: **Read-only**

6. **Cliquez** sur "Install"

### Étape 2 : Vérifier l'installation

1. **Allez** sur GitHub Installed Apps :
   ```
   https://github.com/settings/installations
   ```

2. **Trouvez** "Twin.so" dans la liste

3. **Vérifiez** que le dépôt `blackdorvelus-star/lyss` est bien sélectionné

4. **Cliquez** sur "Configure" pour voir les détails

### Étape 3 : Lancer le test de connexion

1. **Allez** sur GitHub Actions du dépôt Lyss :
   ```
   https://github.com/blackdorvelus-star/lyss/actions
   ```

2. **Trouvez** le workflow "Test Twin.so Connection"

3. **Cliquez** sur "Run workflow"

4. **Attendez** l'exécution (1-2 minutes)

5. **Vérifiez** que le test passe

### Étape 4 : Synchroniser les agents

Une fois l'OAuth configuré :

1. **Le workflow** `twin-agents.yml` s'exécutera automatiquement
2. **Les 3 agents** seront synchronisés avec Twin.so :
   - `lyss-docs-agent`
   - `lyss-tests-agent`
   - `lyss-deploy-agent`

3. **Les webhooks** seront configurés automatiquement

## 🔧 Configuration technique créée

### Fichiers créés automatiquement :

1. **`.github/workflows/twin-oauth-setup.yml`**
   - Workflow pour configurer OAuth
   - S'exécute manuellement ou sur push

2. **`.github/workflows/test-twin-connection.yml`**
   - Test quotidien de la connexion
   - Vérifie que OAuth fonctionne

3. **`scripts/setup-twin-oauth.js`**
   - Script de configuration OAuth
   - Crée la configuration nécessaire

4. **`.twin/oauth-config.json`**
   - Configuration OAuth
   - Paramètres d'authentification

5. **`.github/twin-github-app-manifest.yml`**
   - Manifeste pour GitHub App
   - Template pour automatisation future

## 🛠️ Dépannage

### Problème 1 : "Installation not found"
**Symptôme** : Le workflow échoue avec "GitHub App not installed"
**Solution** :
1. Vérifiez https://github.com/settings/installations
2. Assurez-vous que Twin.so est installé
3. Vérifiez que le dépôt Lyss est sélectionné

### Problème 2 : "Permissions denied"
**Symptôme** : Erreurs d'autorisation
**Solution** :
1. Allez sur https://github.com/settings/installations
2. Cliquez sur "Configure" pour Twin.so
3. Vérifiez/modifiez les permissions
4. Réinstallez si nécessaire

### Problème 3 : "OAuth token invalid"
**Symptôme** : Token expiré ou invalide
**Solution** :
1. Réinstallez l'application GitHub
2. Générez un nouveau token OAuth
3. Mettez à jour la configuration

### Problème 4 : "Webhooks not working"
**Symptôme** : Les événements GitHub ne déclenchent pas Twin.so
**Solution** :
1. Vérifiez les webhooks dans GitHub :
   ```
   https://github.com/blackdorvelus-star/lyss/settings/hooks
   ```
2. Vérifiez que Twin.so reçoit les webhooks
3. Testez manuellement un webhook

## 📊 Surveillance

### 1. Logs GitHub Actions
- **Workflow** : `Test Twin.so Connection`
- **Fréquence** : Quotidienne (midi)
- **Alertes** : Slack/email en cas d'échec

### 2. Dashboard Twin.so
- **Agents** : Statut d'exécution
- **Webhooks** : Événements reçus
- **Logs** : Détails d'exécution

### 3. GitHub Installed Apps
- **Statut** : Application installée/fonctionnelle
- **Permissions** : À jour et suffisantes
- **Webhooks** : Configurés et actifs

## 🔄 Maintenance

### Mises à jour régulières
1. **Vérifier** les permissions (mensuellement)
2. **Tester** la connexion (quotidiennement)
3. **Mettre à jour** les tokens (si expirés)
4. **Réviser** la configuration (trimestriellement)

### Renouvellement des tokens
Les tokens OAuth expirent généralement après :
- 30 jours (tokens standard)
- 90 jours (tokens long-term)

**Action** : Réinstaller l'application si le token expire

## 🚀 Automatisation future

### Améliorations planifiées
1. **Renouvellement automatique** des tokens
2. **Surveillance proactive** de la santé OAuth
3. **Alertes avancées** pour problèmes de connexion
4. **Backup** de la configuration OAuth

### Intégrations supplémentaires
1. **Slack** : Notifications en temps réel
2. **Email** : Rapports hebdomadaires
3. **Dashboard** : Vue d'ensemble de la santé
4. **API** : Accès programmatique aux métriques

## 📞 Support

### Ressources
- **Documentation Twin.so** : https://docs.twin.so
- **GitHub Apps Docs** : https://docs.github.com/en/apps
- **OAuth Documentation** : https://oauth.net

### Contacts
- **GitHub Support** : https://support.github.com
- **Twin.so Support** : support@twin.so
- **Dépôt Lyss** : https://github.com/blackdorvelus-star/lyss

### Communauté
- **Discord Twin.so** : https://discord.gg/twin
- **GitHub Discussions** : Pour questions techniques
- **Slack** : #lyss-devops pour support interne

## 📝 Notes importantes

### Sécurité
- Les tokens OAuth sont stockés de manière sécurisée par GitHub
- Ne jamais exposer de tokens dans les logs
- Révoquer les tokens compromis immédiatement

### Conformité
- Cette configuration respecte les politiques de sécurité GitHub
- Les permissions sont minimales nécessaires
- Audit régulier des accès

### Backup
- La configuration est versionnée dans Git
- Backup automatique via GitHub
- Restauration possible en cas de problème

---

**Dernière mise à jour** : 2026-03-31  
**Version** : 1.0.0  
**Statut** : Configuration prête, attente installation manuelle