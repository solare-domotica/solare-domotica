# SOLARIS — site vitrine

Site vitrine ultra-rapide et mobile-first pour SOLARIS (photovoltaïque, sécurité, domotique), conçu pour transformer un visiteur en prospect qualifié.

**Site 100 % statique** : HTML / CSS / JS vanilla, aucune dépendance, aucun build, aucun serveur nécessaire. Compatible GitHub Pages.

## Mise en ligne (GitHub Pages)

1. Poussez ce contenu sur la branche `main` de votre dépôt `solaris`.
2. Dans **Settings → Pages**, choisissez la branche `main` et le dossier `/ (root)`.
3. Le site est en ligne à l'adresse `https://<votre-compte>.github.io/solaris/`.

Pour un nom de domaine personnalisé, ajoutez un fichier `CNAME` à la racine avec votre domaine, et configurez les DNS chez votre registrar (enregistrement `CNAME` vers `<votre-compte>.github.io`).

## Structure

```
index.html              Page d'accueil (funnel complet + simulateur)
connect.html              SOLARIS Connect — domotique autonome + solaire, contrôle à distance (maison/voiture/bureaux), formulaire express 2 étapes
photovoltaique.html      Page SEO Photovoltaïque
securite.html             Page SEO Sécurité
domotique.html            Page SEO Domotique
mentions-legales.html     Mentions légales (modèle à compléter)
confidentialite.html      Politique de confidentialité (modèle à compléter)
404.html                  Page d'erreur
robots.txt / sitemap.xml  SEO technique
manifest.json             Ajout à l'écran d'accueil (mobile)
assets/css/style.css      Feuille de style unique
assets/js/i18n.js         Dictionnaire de traduction FR / EN / IT
assets/js/main.js         Comportement du site (nav, simulateur, WhatsApp, FAQ)
assets/img/               Logo et favicons (générés depuis le logo fourni)
leads-worker.js            Relais Cloudflare Worker (prospects abandonnés → GitHub)
LEAD-CAPTURE-SETUP.md      Guide de mise en place du suivi des prospects
```

## Langue automatique

Le site détecte la langue du navigateur (`navigator.languages`) : français si elle commence par `fr`, italien si elle commence par `it`, anglais pour tout le reste. Le visiteur peut aussi forcer la langue via les boutons **FR / EN / IT** dans le header (le choix est mémorisé dans son navigateur). Pour ajouter une langue supplémentaire, dupliquez le bloc `it: { ... }` dans `assets/js/i18n.js`, ajoutez le code dans `detectLang()` (`assets/js/main.js`) et un bouton `data-lang="xx"` dans le header de chaque page.

## Contact 100 % WhatsApp

Aucun formulaire n'envoie de données vers un serveur ou par email. Tous les CTA (« Appeler SOLARIS », simulateur, boutons de contact) ouvrent une conversation WhatsApp pré-remplie vers **+39 351 386 6250**, via des liens `wa.me`. Le numéro est défini une seule fois, en haut de `assets/js/main.js` :

```js
var WHATSAPP_NUMBER = "393513866250";
```

## Simulateur

Le simulateur (`#simulateur` sur la page d'accueil) est un parcours en 5 étapes, sans backend. Cliquer sur un choix (étapes 1 à 3) sélectionne la réponse et fait automatiquement avancer à l'étape suivante après une courte pause — pas besoin de cliquer sur « Continuer ». À la dernière étape, WhatsApp s'ouvre **automatiquement** avec le message pré-rempli (le bouton « Ouvrir WhatsApp » de l'écran de confirmation reste disponible en secours, si le navigateur bloque l'ouverture automatique). Les 4 cartes « Quel est votre objectif ? » de la page d'accueil pré-remplissent l'étape 2 du simulateur et y font défiler la page.

## Suivi des prospects abandonnés (optionnel)

Le site peut enregistrer, dans un fichier texte `leads/abandoned.txt` **directement dans ce dépôt GitHub** (pas de Google, pas de service tiers à consulter ailleurs), chaque prospect qui quitte le simulateur sans le terminer — utile pour le rappeler. Cette fonctionnalité est **désactivée par défaut** — le site fonctionne parfaitement sans elle. Pour l'activer (~10 minutes, copier/coller uniquement), suis le guide **[LEAD-CAPTURE-SETUP.md](./LEAD-CAPTURE-SETUP.md)** avec le relais fourni dans **`leads-worker.js`** : le fichier s'allonge tout seul à chaque abandon, et repart de zéro sans aucune trace si tu le vides.

## À compléter avant mise en ligne définitive

- **Mentions légales / confidentialité** : remplacer les champs `[à compléter]` (raison sociale, SIREN, adresse) — à faire valider par un professionnel du droit.
- **Réalisations** : remplacer les vignettes d'exemple par de vraies photos de chantier (section « Réalisations » de la page d'accueil).
- **Avis clients** : la section est volontairement vide (aucun avis n'est inventé). Elle peut être remplacée par un widget Google Avis une fois la fiche établissement disponible.
- **Domaine** : les URL canoniques, `sitemap.xml`, `robots.txt` et les données structurées pointent vers `https://maxmcneil.github.io/solaris/` (déduit du nom du dépôt). Si le site est finalement publié ailleurs ou sur un domaine personnalisé, remplacez cette URL partout (recherche/remplace global dans les fichiers `.html`, `sitemap.xml`, `robots.txt`).
- **Analytics** : aucun outil de mesure n'est installé par défaut. Le bandeau cookies (`assets/js/main.js`, `initCookieBar`) se réduit et disparaît après 8 secondes sans réponse — **conformément au RGPD, ce silence n'est jamais traité comme un consentement** : tant que le visiteur n'a pas cliqué « Accepter », aucun cookie non essentiel n'est activé, et une petite icône 🍪 reste affichée pour rouvrir le bandeau à tout moment. Il est prêt à conditionner le chargement d'un outil compatible RGPD si besoin.

## Performance

Pas de web font externe, pas de framework, images compressées en WebP, un seul fichier CSS et deux fichiers JS courts : l'objectif est un chargement quasi instantané, y compris sur mobile en 4G.
