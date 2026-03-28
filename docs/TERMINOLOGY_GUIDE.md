# Guide de Terminologie Lyss

## 📋 Principes généraux
- **Clarté** : Termes compréhensibles par tous (pas de jargon technique)
- **Consistance** : Même terme = même signification partout
- **Action-oriented** : Verbes plutôt que noms abstraits
- **User-first** : Termes du point de vue de l'utilisateur

## 🎯 Terminologie standardisée

### Navigation principale
| Ancien terme | Nouveau terme | Description |
|-------------|--------------|-------------|
| Confier | **Nouvelle facture** | Ajouter une facture à suivre |
| Soumissions | **Devis** | Gérer les devis/estimations |
| Lot | **Traitement par lot** | Actions groupées sur plusieurs factures |
| Audit | **Journal** | Historique des actions système |
| - | **Factures en cours** | Factures actives (sent, viewed, overdue) |
| - | **Automatisation** | Séquences de relance automatiques |

### États des factures
| Terme | Signification |
|-------|--------------|
| **Brouillon** | Facture créée mais non envoyée |
| **Envoyée** | Facture envoyée au client |
| **Consultée** | Client a ouvert la facture |
| **En retard** | Date d'échéance dépassée |
| **Payée** | Facture réglée |
| **Contestée** | Client conteste la facture |
| **Annulée** | Facture annulée |

### Actions utilisateur
| Terme | Utilisation |
|-------|------------|
| **Relancer** | Envoyer un rappel pour une facture |
| **Contacter** | Appeler/emailer le client |
| **Exporter** | Télécharger les données (CSV, PDF) |
| **Importer** | Charger des factures depuis un fichier |
| **Planifier** | Créer un rendez-vous |
| **Automatiser** | Configurer une séquence de relance |

### Intégrations
| Terme | Description |
|-------|------------|
| **QuickBooks** | Synchronisation comptabilité |
| **Sage** | Synchronisation comptabilité |
| **Telnyx** | Appels/SMS automatisés |
| **Relevance AI** | Analyse IA des conversations |

## 🚫 Termes à éviter
- ❌ "Confier" (trop vague)
- ❌ "Soumissions" (ambigu)
- ❌ "Lot" (trop technique)
- ❌ "Audit" (trop intimidant)
- ❌ "Workflow" (préférer "Automatisation")
- ❌ "Pipeline" (préférer "Flux de travail")

## ✅ Bonnes pratiques

### Pour les nouveaux composants
1. **Vérifier ce guide** avant de nommer une feature
2. **Utiliser les termes standardisés**
3. **Maintenir la cohérence** avec l'existant
4. **Documenter** tout nouveau terme nécessaire

### Pour les mises à jour
1. **Mettre à jour l'UI** et la documentation
2. **Mettre à jour les messages** (toasts, erreurs, confirmations)
3. **Tester** que les utilisateurs comprennent

## 🔄 Processus de changement
1. **Proposer** le changement dans une PR
2. **Discuter** avec l'équipe produit
3. **Mettre à jour** tous les usages
4. **Tester** l'expérience utilisateur
5. **Documenter** dans ce guide

---

*Dernière mise à jour : 2026-03-27*
*Responsable : Équipe produit Lyss*
