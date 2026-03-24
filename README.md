# Lyss — Système d'Exploitation de Revenus pour PME Québécoises

> **Lyss** est une adjointe administrative propulsée par l'IA, conçue pour les PME du Québec. Elle automatise le suivi de facturation, les relances de paiement et la relation client — pour que les entrepreneurs se concentrent sur ce qu'ils font de mieux.

---

## 🧠 Architecture 5-Agents

Lyss repose sur une architecture multi-agents orchestrée par Relevance AI :

| Agent | Rôle | Description |
|-------|------|-------------|
| **Agent 1 — Le Collecteur** | Relance automatisée | Séquences email → SMS → appel avec escalade intelligente |
| **Agent 2 — L'Analyste** | Intelligence financière | Scoring de risque, prévisions de cashflow, détection d'anomalies |
| **Agent 3 — Le Négociateur** | Gestion des litiges | Propositions de plans de paiement, médiation IA |
| **Agent 4 — Le Marketeur** | Acquisition de clients | Prospection automatisée, tracking de conversion (`?source=ai_marketer`) |
| **Agent 5 — Le Concierge** | Onboarding & support | Accueil personnalisé, configuration guidée, assistance continue |

---

## ⚙️ Stack Technique

| Couche | Technologie |
|--------|-------------|
| **Frontend** | React · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion |
| **Backend** | Supabase (Auth, Database, Edge Functions, Storage) |
| **IA — Contenu** | Google Gemini |
| **IA — Orchestration** | Relevance AI |
| **Communications** | Telnyx (SMS + Appels vocaux) |
| **Paiements SaaS** | Stripe |
| **Comptabilité** | QuickBooks · Sage (OAuth2) |
| **Déploiement** | Lovable Cloud |

---

## 🔄 Flux de Recouvrement

```
Facture échue
  → Email 1 (J+0)
    → Vérification paiement (J+3)
      → SMS (J+3 si impayé)
        → Vérification paiement (J+7)
          → Email 2 (J+7 si impayé)
            → Vérification paiement (J+10)
              → Escalade admin (J+10 si impayé)

⚡ Arrêt instantané si paiement détecté (webhook)
```

---

## 🛡️ Conformité — Loi 25 du Québec

Lyss est **rigoureusement conforme** à la Loi 25 sur la protection des renseignements personnels :

- 🏛️ **Responsable désigné** : vie-privee@lyss.ca
- 📅 **Conservation des données** : 7 ans (facturation), 180 jours (vocal), 90 jours (comptes inactifs)
- 🗑️ **Droit de suppression** : traitement sous 30 jours
- 🤖 **Transparence IA** : divulgation complète de l'usage de l'intelligence artificielle
- 🚨 **Procédure d'incident** : protocole documenté avec notification à la CAI
- 🔒 **RLS (Row-Level Security)** : isolation stricte des données par entreprise

---

## 📊 Fonctionnalités Clés

- **Dashboard temps réel** — KPIs, cashflow, activité en direct
- **Import CSV / QuickBooks / Sage** — synchronisation automatique des factures
- **Séquences de relance** — mode automatique ou manuel
- **Portail payeur** — le débiteur peut payer, contester ou négocier
- **Widget client** — chat IA intégrable sur site externe
- **Gestion des litiges** — centre de médiation avec réponses IA
- **Rapports mensuels** — génération automatique PDF
- **Notifications intelligentes** — alertes par type d'événement
- **Gestion des leads** — suivi des prospects avec attribution marketing

---

## 🚀 Démarrage Rapide

```bash
git clone https://github.com/blackdorvelus-star/lyss.git
cd lyss
npm install
npm run dev
```

---

## 📄 Licence

Propriétaire — © 2026 Lyss. Tous droits réservés.

---

> *« Récupère tes milliers de dollars en attente. »*
