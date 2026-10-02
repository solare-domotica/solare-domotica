# Suivi des prospects abandonnés — fichier `abandoned.txt` automatique

Objectif : un fichier texte **dans ton propre dépôt GitHub** (`leads/abandoned.txt`),
qui s'allonge tout seul à chaque prospect ayant quitté le simulateur sans le
terminer, et qui repart de zéro — sans aucune trace de ce qui a été supprimé —
si tu vides son contenu.

## Pourquoi ça ne peut pas écrire directement sur ton ordinateur

Le site est 100 % statique (GitHub Pages) : il n'y a aucun serveur qui tourne,
nulle part. Le navigateur d'un visiteur ne peut jamais écrire de fichier sur
TON disque dur — ce n'est pas une limite du site, c'est une règle de sécurité
du web (sinon n'importe quel site pourrait écrire n'importe quoi sur
l'ordinateur de ses visiteurs). Il faut donc un minuscule relais, hébergé
quelque part, qui reçoit l'information et l'écrit à ta place — je l'ai construit
pour écrire directement **dans ton dépôt GitHub `solaris`**, pas sur un service
tiers type Google : le fichier reste dans ton écosystème actuel, consultable et
téléchargeable sur github.com comme n'importe quel autre fichier du site.

Le relais utilisé est un **Cloudflare Worker** (gratuit jusqu'à 100 000
requêtes/jour, largement suffisant). Mise en place : environ 10 minutes,
aucune compétence de développeur requise — copier/coller uniquement.

## Étape 1 — Créer un token GitHub (pour autoriser l'écriture du fichier)

1. Sur github.com : **photo de profil → Settings → Developer settings →
   Personal access tokens → Fine-grained tokens → Generate new token**.
2. Nom : `solaris-leads-writer`.
3. Expiration : au choix (ex. 1 an, renouvelable).
4. **Repository access** : *Only select repositories* → choisis `solaris`.
5. **Permissions → Repository permissions → Contents** : passe sur **Read and write**.
6. **Generate token**, puis **copie immédiatement la valeur** (elle ne sera
   plus jamais réaffichée — garde-la de côté un instant, tu en as besoin à l'étape 3).

## Étape 2 — Créer le Cloudflare Worker

1. Va sur [dash.cloudflare.com](https://dash.cloudflare.com), crée un compte
   gratuit si besoin.
2. Menu de gauche **Workers & Pages → Create → Create Worker**.
3. Donne-lui un nom, par exemple `solaris-leads`. Déploie (le code par défaut).
4. Clique **Edit code** (ou "Modifier le code").
5. Supprime tout le contenu de l'éditeur et colle exactement le contenu du
   fichier **`leads-worker.js`** fourni à la racine de ce projet.
6. **Save and deploy**.

## Étape 3 — Configurer les variables du Worker

Toujours sur la page du Worker : **Settings → Variables and Secrets → Add**.
Ajoute ces 5 variables (respecte les noms exactement) :

| Nom | Type | Valeur |
|---|---|---|
| `GITHUB_TOKEN` | **Secret** | le token copié à l'étape 1 |
| `GITHUB_OWNER` | Text | `maxmcneil` |
| `GITHUB_REPO` | Text | `solaris` |
| `GITHUB_PATH` | Text | `leads/abandoned.txt` |
| `GITHUB_BRANCH` | Text | `main` |

**Save and deploy** pour appliquer.

## Étape 4 — Copier l'URL du Worker dans le site

1. En haut de la page du Worker, copie son URL — elle ressemble à
   `https://solaris-leads.<ton-sous-domaine>.workers.dev`.
2. Ouvre `assets/js/main.js`, tout en haut, trouve :
   ```javascript
   var LEAD_WEBHOOK_URL = "";
   ```
3. Colle l'URL entre les guillemets :
   ```javascript
   var LEAD_WEBHOOK_URL = "https://solaris-leads.xxx.workers.dev";
   ```
4. Enregistre et republie le site (comme d'habitude).

Tant que cette ligne reste vide (`""`), rien n'est envoyé nulle part — le site
fonctionne normalement sans cette fonctionnalité.

## Étape 5 — Tester

1. Ouvre le site publié, démarre le simulateur, réponds à une ou deux questions
   (idéalement jusqu'à taper un prénom et un téléphone à la dernière étape).
2. **Ferme l'onglet sans cliquer sur le bouton final** (c'est ça, "abandonner").
3. Sur GitHub, dans le dépôt `solaris`, un fichier `leads/abandoned.txt` doit
   apparaître (ou s'allonger) au bout de quelques secondes, avec un nouveau
   commit automatique du Worker.

Seuls les abandons créent une ligne — une demande **terminée** part directement
par WhatsApp et n'a pas besoin d'être dupliquée dans ce fichier.

## Lire le fichier

`leads/abandoned.txt` est un texte simple, une ligne par prospect, colonnes
séparées par une tabulation :

```
when    lang    page    stepLabel    type    goal    budget    address    firstname    lastname    phone    email
```

`type`, `goal` et `budget` utilisent de courts codes internes (stables quelle
que soit la langue du visiteur) : `individual/apartment/business/other` pour
le type de projet (ou `connect` si la demande vient du formulaire express
SOLARIS Connect, auquel cas `goal` contient `home/car/office/all`), `bill/produce/secure/automate/all` pour l'objectif,
`low/mid/high/veryhigh/unknown` pour la consommation mensuelle — reportés
directement du simulateur du site.

Ouvrable directement sur GitHub, dans un éditeur de texte, ou importable dans
Excel/Numbers/Google Sheets (import avec séparateur "tabulation") si tu veux
trier/filtrer ponctuellement — sans que la donnée n'y reste stockée en continu.

## Vider le fichier (recommencer à zéro)

Sur GitHub, ouvre `leads/abandoned.txt`, clique l'icône crayon (Edit), sélectionne
tout, supprime, puis **Commit changes**. Le prochain prospect abandonné réécrira
l'en-tête des colonnes et repartira du début — sans aucune trace de ce qui a
été supprimé, nulle part (ni sur GitHub, ni dans le Worker, qui ne conserve
aucune copie de son côté).

## Vie privée

Conserver les coordonnées d'un formulaire non terminé (nom, téléphone, email)
est une collecte de données personnelles, même partielle — c'est déjà mentionné
dans `confidentialite.html` (section « Relance des demandes non terminées »).
Pense à :
- garder le dépôt GitHub **privé** si tu veux limiter qui peut voir ce fichier
  (Settings du repo → Change visibility → Private) ;
- supprimer la ligne d'un prospect qui te le demande explicitement (édition
  manuelle du fichier, comme ci-dessus) ;
- ne jamais utiliser ces données à d'autres fins que le rappel commercial
  pour ce projet précis.
