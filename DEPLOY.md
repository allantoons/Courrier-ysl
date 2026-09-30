# Déploiement PWA Courrier YSL

## 1. Application (GitHub Pages)

Fichiers à la racine du dépôt : `index.html`, `sw.js`, `manifest.json`, `icon-192.png`, `icon-512.png`.
(`worker.js` n'est PAS utilisé par GitHub Pages : il sert à l'étape 2.)

- Settings > Pages > Deploy from branch > main > / (root)
- URL : https://allantoons.github.io/Courrier-ysl/
- iPhone : Safari > Partager > "Sur l'écran d'accueil"

À chaque mise à jour : changer `CACHE = 'courrier-ysl-v2'` dans `sw.js` (v3, v4...).

## 2. Lecture d'étiquette par IA (Cloudflare Worker)

La clé API ne doit jamais être dans index.html : le dépôt est public.

1. Créer une clé API sur console.anthropic.com et y fixer une limite de dépenses mensuelle.
2. Sur dash.cloudflare.com : Workers & Pages > Create > Worker > nommer `courrier-etiquette` > Deploy.
3. Edit code : remplacer tout par le contenu de `worker.js` > Deploy.
4. Settings > Variables and Secrets :
   - `ANTHROPIC_API_KEY` (type Secret) = votre clé
   - `ALLOWED_ORIGIN` = `https://allantoons.github.io`
5. Copier l'URL du Worker (ex. `https://courrier-etiquette.VOTRE-COMPTE.workers.dev`).
6. Dans `index.html`, remplir : `var LABEL_API_URL = 'https://...workers.dev';`

Les menus Cloudflare peuvent avoir changé de nom : suivre leur documentation si besoin.

## 3. Avant mise en production

- Faire valider par la DSI / le DPO l'envoi de photos d'étiquettes (noms, adresses) à un service externe.
- Rendre le dépôt privé ou retirer l'annuaire EMPLOYEES s'il contient de vraies personnes.
- Tester sur une dizaine d'étiquettes réelles par transporteur.

## Fonctionnement

Photo de l'étiquette > champs remplis (tracking, transporteur, expéditeur, destinataire, nombre de colis)
> vérification (champs en orange = lecture incertaine) > Enregistrer > Outlook s'ouvre avec l'e-mail prêt
> au retour dans l'app, confirmation "e-mail envoyé ?" > statut Notifié.
