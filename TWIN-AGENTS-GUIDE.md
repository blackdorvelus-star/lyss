# Twin.so Agents pour Lyss - Guide Complet

## 🎯 Objectif
Configurer des agents Twin.so pour automatiser le développement, les tests et le déploiement du projet Lyss.

## 📋 Agents Configurés

### 1. **`lyss-docs-agent`** - Documentation Automatique
**Description** : Génère et maintient la documentation du projet Lyss automatiquement.

**Fonctionnalités** :
- ✅ Analyse la structure du projet
- ✅ Extrait les commentaires et docstrings
- ✅ Génère la documentation Markdown
- ✅ Met à jour README.md automatiquement
- ✅ Commit et push les changements

**Triggers** :
- Push sur le dépôt Lyss
- Exécution quotidienne à minuit
- Demande manuelle via interface

**Fichier de configuration** : `.twin/lyss-docs-agent.yml`

---

### 2. **`lyss-tests-agent`** - Tests Automatiques
**Description** : Exécute les tests et génère des rapports pour le projet Lyss.

**Fonctionnalités** :
- ✅ Exécute les tests unitaires, d'intégration et E2E
- ✅ Génère des rapports de couverture
- ✅ Analyse les résultats des tests
- ✅ Suggère des corrections
- ✅ Notifie les échecs

**Triggers** :
- Avant chaque merge sur main
- Exécution toutes les nuits (3h du matin)
- Sur demande manuelle
- Quand du code est modifié

**Fichier de configuration** : `.twin/lyss-tests-agent.yml`

---

### 3. **`lyss-deploy-agent`** - Déploiement Automatique
**Description** : Gère le déploiement automatique de l'application Lyss.

**Fonctionnalités** :
- ✅ Vérifications avant déploiement
- ✅ Build de l'application
- ✅ Déploiement vers les environnements
- ✅ Validation après déploiement
- ✅ Procédure de rollback

**Triggers** :
- Déploiement en production après validation
- Déploiement en staging pour tests
- Déploiement manuel sur demande
- Rollback en cas de problème

**Fichier de configuration** : `.twin/lyss-deploy-agent.yml`

## 🚀 Installation et Configuration

### Prérequis
1. **Compte Twin.so** : https://app.twin.so
2. **Clé API Twin.so** : `twin_e7e60bd074d97d29db2e97ec570fbc56_aKVKxX1GJGu4B9E-bDJrLL0-w7YudFuw_gaNdFAXCkA`
3. **Accès GitHub** avec permissions d'écriture

### Étapes d'installation

#### 1. Synchroniser avec Twin.so
```bash
# Le workflow GitHub Actions se charge de la synchronisation automatique
# Vérifiez que le workflow s'exécute correctement
```

#### 2. Configurer les webhooks
1. Allez sur https://app.twin.so
2. Naviguez vers "Integrations" → "GitHub"
3. Connectez votre dépôt Lyss
4. Configurez les webhooks pour les événements :
   - `push`
   - `pull_request`
   - `workflow_run`

#### 3. Vérifier la configuration
```bash
# Vérifiez que les fichiers de configuration sont valides
python3 -c "import yaml; yaml.safe_load(open('.twin/lyss-docs-agent.yml'))"
```

## 🔧 Utilisation

### Exécution manuelle des agents

#### Via Twin.so Dashboard
1. Connectez-vous à https://app.twin.so
2. Naviguez vers "Agents"
3. Sélectionnez l'agent souhaité
4. Cliquez sur "Run Now"

#### Via GitHub Actions
```bash
# Déclencher manuellement le workflow
gh workflow run "Twin.so Agents Sync"
```

### Surveillance

#### Logs d'exécution
- **Twin.so Dashboard** : Logs détaillés de chaque exécution
- **GitHub Actions** : Logs de synchronisation
- **Slack** : Notifications en temps réel (si configuré)

#### Métriques
- Taux de réussite des agents
- Temps d'exécution
- Couverture de documentation/tests
- Fréquence de déploiement

## 🛠️ Développement d'agents supplémentaires

### Structure d'un agent
```yaml
agent:
  name: "nom-de-l-agent"
  description: "Description de l'agent"
  
  triggers:
    - name: "trigger_name"
      conditions: [...]
      
  actions:
    - name: "action_name"
      steps: [...]
```

### Bonnes pratiques
1. **Nommage** : Utiliser le préfixe `lyss-` pour tous les agents Lyss
2. **Documentation** : Documenter chaque agent dans `docs/agents/`
3. **Tests** : Tester la configuration YAML avant commit
4. **Sécurité** : Ne pas exposer de secrets dans les configurations

### Ajouter un nouvel agent
1. Créez un fichier `.twin/nouvel-agent.yml`
2. Suivez le schéma existant
3. Testez la syntaxe YAML
4. Ajoutez la documentation dans `docs/agents/`
5. Soumettez une pull request

## 🔍 Dépannage

### Problèmes courants

#### 1. Agent non synchronisé
**Symptôme** : L'agent n'apparaît pas dans Twin.so
**Solution** :
- Vérifiez les permissions GitHub
- Vérifiez la configuration des webhooks
- Exécutez manuellement le workflow de synchronisation

#### 2. Erreurs de configuration
**Symptôme** : Échec de validation YAML
**Solution** :
```bash
# Valider la syntaxe YAML
python3 -c "import yaml; yaml.safe_load(open('.twin/agent.yml'))"
```

#### 3. Échecs d'exécution
**Symptôme** : L'agent échoue lors de l'exécution
**Solution** :
- Consultez les logs dans Twin.so
- Vérifiez les dépendances
- Vérifiez les permissions

### Support
- **Documentation Twin.so** : https://docs.twin.so
- **GitHub Issues** : Pour les problèmes techniques
- **Slack** : #lyss-dev pour le support communautaire

## 📈 Amélioration continue

### Roadmap des agents
1. **Phase 1** (Actuelle) : Documentation, tests, déploiement
2. **Phase 2** : Surveillance, alertes, optimisation
3. **Phase 3** : Apprentissage automatique, prédictions

### Métriques de succès
- Réduction du temps de développement
- Amélioration de la qualité du code
- Augmentation de la fréquence de déploiement
- Réduction des incidents en production

## 🤝 Contribution

### Comment contribuer
1. Forkez le dépôt
2. Créez une branche pour votre fonctionnalité
3. Développez et testez votre agent
4. Soumettez une pull request

### Standards de code
- Suivre le schéma YAML existant
- Documenter toutes les nouvelles fonctionnalités
- Inclure des tests si applicable
- Mettre à jour ce guide

## 📚 Ressources

### Documentation
- [Documentation Twin.so](https://docs.twin.so)
- [Schéma YAML des agents](https://docs.twin.so/agents/yaml-schema)
- [API Twin.so](https://docs.twin.so/api)

### Exemples
- [Agents Jurisscan](../jurisscan/.twin/) - Configuration similaire
- [Repository d'exemples Twin.so](https://github.com/twin-so/examples)

### Support
- [Communauté Discord Twin.so](https://discord.gg/twin)
- [GitHub Issues](https://github.com/blackdorvelus-star/lyss/issues)
- [Email support](support@twin.so)

---

**Dernière mise à jour** : 2026-03-31  
**Version** : 1.0.0  
**Mainteneurs** : Équipe Lyss