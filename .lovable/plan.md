
Objectif: rendre l’intégration QuickBooks et Sage réellement utilisable pour les employeurs depuis leur compte Lyss, même dans le preview.

Constat
- Les tables backend existent bien pour `quickbooks_connections` et `sage_connections`, avec RLS en place.
- Les secrets nécessaires sont configurés.
- Les fonctions backend `quickbooks-auth`, `sage-auth`, `quickbooks-callback` et `sage-callback` existent déjà.
- Le screenshot montre très probablement un blocage d’affichage dans l’iframe du preview. C’est cohérent avec les pages OAuth de QuickBooks/Sage, qui refusent souvent d’être ouvertes dans un frame.

Problème réel
- Aujourd’hui, le bouton lance `window.location.href = data.auth_url` depuis l’app affichée dans le preview.
- Comme le preview est embarqué dans un iframe, l’écran d’autorisation externe peut être bloqué.
- En plus, après retour OAuth, les callbacks renvoient vers `/?qb_connected=true` ou `/?sage_connected=true`, ce qui ne garantit pas que l’utilisateur revienne directement dans la section Intégrations du dashboard.

Plan d’implémentation
1. Corriger l’ouverture OAuth
- Remplacer la redirection embarquée par une ouverture dans le contexte top-level du navigateur.
- Approche prévue:
  - tenter `window.top.location.href = data.auth_url` si disponible,
  - sinon fallback `window.open(data.auth_url, "_blank", "noopener,noreferrer")`.
- Ajouter un message d’aide visible si l’ouverture est bloquée: “ouvre ce lien dans un nouvel onglet”.

2. Fiabiliser le retour après autorisation
- Modifier `quickbooks-callback` et `sage-callback` pour rediriger vers une URL qui ramène l’utilisateur directement au bon endroit, par ex. `/#integrations?qb_connected=true` ou équivalent plus robuste.
- Conserver les paramètres de succès/erreur pour afficher un toast clair côté frontend.

3. Améliorer le frontend des cartes d’intégration
- Ajouter un vrai état “connexion en cours”.
- Si l’URL d’autorisation est reçue, afficher aussi un lien cliquable “Ouvrir QuickBooks” / “Ouvrir Sage” comme secours.
- Afficher des messages d’erreur plus utiles:
  - non connecté,
  - popup bloquée,
  - autorisation annulée,
  - erreur backend.

4. Stabiliser le chargement de l’état connecté
- Garder le chargement actuel des connexions, mais mieux gérer les cas:
  - utilisateur non connecté,
  - aucune connexion encore enregistrée,
  - retour OAuth réussi mais données pas encore relues.
- Après succès, relancer explicitement `loadConnection()` et forcer l’affichage de la section intégrations si besoin.

5. Vérifier la cohérence du parcours utilisateur
- Parcours cible:
  ```text
  Dashboard > Intégrations
    > Connecter QuickBooks/Sage
    > autorisation externe dans le navigateur
    > retour dans Lyss sur Intégrations
    > statut "Connecté"
    > bouton "Synchroniser les factures"
  ```

Détails techniques
- Fichiers frontend à ajuster:
  - `src/components/dashboard/QuickBooksConnect.tsx`
  - `src/components/dashboard/SageConnect.tsx`
  - éventuellement `src/components/dashboard/Dashboard.tsx` pour restaurer automatiquement la section `integrations` après retour
- Fichiers backend à ajuster:
  - `supabase/functions/quickbooks-callback/index.ts`
  - `supabase/functions/sage-callback/index.ts`
- Aucune nouvelle table n’est nécessaire.
- La sécurité backend actuelle est globalement suffisante pour cette correction.

Résultat attendu
- Les boutons QuickBooks et Sage deviennent réellement utilisables.
- L’autorisation ne casse plus dans le preview.
- L’employeur peut connecter son logiciel comptable à Lyss, revenir automatiquement dans son espace, puis synchroniser ses factures impayées.

Risques / points à surveiller
- Les navigateurs peuvent bloquer `window.open` si l’action n’est pas perçue comme directement liée au clic; d’où le lien de secours visible.
- Il faudra tester les deux cas:
  - dans le preview Lovable,
  - sur l’URL publiée `lyss.lovable.app`, où le comportement sera normalement meilleur.

<lov-actions>
<lov-suggestion message="Test the QuickBooks and Sage connection flow end-to-end in the published app and in the preview to verify the OAuth redirect works.">Verify that it works</lov-suggestion>
<lov-suggestion message="Add a step-by-step integration helper panel that explains how employers connect QuickBooks or Sage and what happens after sync.">Add integration guide</lov-suggestion>
<lov-suggestion message="Show imported invoices in a dedicated synced invoices view with source badges for QuickBooks and Sage.">Add synced invoices view</lov-suggestion>
<lov-suggestion message="Add automatic sync history with last sync time, imported count, and error logs for each accounting integration.">Add sync history</lov-suggestion>
<lov-suggestion message="Let employers choose which unpaid invoices from QuickBooks or Sage should be imported into Lyss before starting reminders.">Add import review step</lov-suggestion>
</lov-actions>
