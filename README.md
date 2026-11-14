# Farkle Stats ChatDeck · démo

Proposition de page de statistiques avancées pour le Farkle de [ChatDeck](https://chatdeck.fr/farkle), pensée pour être intégrée nativement au site. Ce dossier est une **démo statique** : il suffit de le déposer sur un serveur web pour la consulter, avec de vraies parties à l'intérieur.

- Aucune dépendance, aucun build : du HTML, du CSS et du JavaScript lisibles tels quels.
- Toutes les fonctionnalités sont des **options activables une par une** (voir [Paramétrage](#paramétrage)).
- Mobile d'abord : tout a été vérifié à 360 px de large, sans défilement horizontal.

---

## 1. La démarche

### Le besoin
La page « Mes stats » actuelle donne le score, l'Elo et le bilan V/D. Les joueurs n'ont aucun moyen de revoir une partie, de savoir s'ils ont bien joué, ni de mesurer leur chance. Et l'ardoise de fin de partie disparaît dès qu'on quitte la table.

### Comment les données ont été obtenues, dans le respect des CGU
Pour construire cette maquette sans rien demander au site, les données viennent d'une **capture passive** :

1. un userscript (Violentmonkey) **lit** les réponses que le navigateur reçoit déjà pendant une partie (`/farkle/api/partie/<id>`) et le texte de l'ardoise de fin ;
2. il les envoie à un petit collecteur local (Node, `127.0.0.1`) qui les écrit dans des fichiers `.jsonl` ;
3. la page de stats lit ces fichiers.

Le script n'envoie **aucune requête** au site, n'automatise **aucune action**, ne lit que les parties du joueur connecté et ne contourne aucune limite (CGU §8). Ce mécanisme n'a servi qu'à prototyper : **en version native, il disparaît**, puisque le serveur dispose déjà de tous les états de partie.

### Ce que la démo contient
`data/demo.jsonl` regroupe les captures d'une journée de jeu (12 novembre 2026) d'un seul joueur :

- 12 parties détaillées lancer par lancer (Ranked et Amis) ;
- une capture de la page « Mes stats » (191 parties Ranked de la saison), qui sert à recalculer l'historique officiel.

Les **adversaires sont pseudonymisés** (`Joueur01`…`Joueur68`, identifiants Twitch remplacés, avatars retirés) dans toutes les sources : états de partie, page « Mes stats » et texte des ardoises. Seul le joueur de la démo (Toubli) garde son nom. Pour refaire le fichier à partir d'autres captures : `python3 tools/anonymise-demo.py captures.jsonl Pseudo`.

---

## 2. Voir la démo

**Sur un serveur** : déposer le dossier tel quel (Apache, Nginx, o2switch…), puis ouvrir l'URL du dossier. Rien à configurer.

**En local** : la page charge `data/demo.jsonl` avec `fetch`, ce qui ne marche pas en double-cliquant sur `index.html` (`file://`). Lancer un mini-serveur à la racine du dossier :

```bash
python3 -m http.server 8000      # puis http://localhost:8000
# ou
npx serve .
```

> Les bloqueurs de publicité (uBlock Origin et ses listes anti-pistage) bloquent souvent les scripts dont le nom évoque des statistiques ou de l'analyse (`analyse.js`, `/stats/`…). Les fichiers ont été nommés pour l'éviter ; si un fichier manque malgré tout, la page l'affiche en haut au lieu de rester vide.

Raccourcis utiles :

| Lien | Contenu |
|---|---|
| `#saison` | vue d'ensemble de la saison |
| `#jeu` | analyse du jeu : décisions, chance, cartes |
| `#parties` | historique, avec relecture de chaque partie |
| `#partie-12524` | relecture d'une partie (← → et espace au clavier) |
| `#partie-12524-n40` | relecture directement au coup n° 40 |
| `#reglages` | visibilité, modération des emotes, options (« Mon compte » en production) |

---

## 3. Ce que voit le joueur

| Onglet | Contenu |
|---|---|
| **Saison** | Score, rang, série en cours, bilan du jour, victoires par heure, par jour, selon la série et selon la fatigue. |
| **Mon jeu** | **Décisions** : chaque relance ou encaissement jugé sur les chances de gagner, profil gourmand / prudent par nombre de dés, décisions les plus coûteuses, seuils selon le score. **Chance** : farkles observés contre attendus, combinaisons, équité des dés, chanceux et maudits. **Cartes** : ce que sort chacun des six dés équipés. |
| **Parties** | Historique (Ranked, Amis) groupé par jour, relecture coup par coup façon partie d'échecs (dés sélectionnés un à un, verdict sur chaque choix, des deux joueurs), ardoise finale. |
| **Adversaires** | Bilan face à chacun, chance comparée, accès direct à leurs parties. |
| **Trophées** | Records du joueur et du site, catalogue de succès (Bronze → Légendaire). |
| **Réglages** | Ce que voient les autres (Public / Discret / Privé), modération des emotes (équipe uniquement), options. |

### Le modèle de décision
Chaque choix « relancer ou encaisser » est jugé sur la **probabilité de gagner la partie**, pas sur les points du tour. Elle est calculée **exactement** pour chaque situation (ton score, son score, points en jeu, dés restants) :

- règles ChatDeck : 1 = 100, 5 = 50, brelans, ×2 / ×4 / ×8 pour 4, 5, 6 identiques, suites 500 / 750 / 1 500, Hot dice, victoire immédiate à 4 000 ;
- adversaire supposé jouer au mieux ;
- résolution hors ligne par itération de valeur (`tools/farkle-wp-solveur.c`, 15 s), table de 12,8 Ko embarquée, le reste recalculé à la demande en quelques millisecondes.

Exemple de verdict : « ✗ Trop gourmand · Il valait mieux encaisser : 83,9 % de chances de gagner, contre 82,6 % en relançant. »

---

## 4. Organisation du code

Scripts classiques chargés dans l'ordre par `index.html` (pas de modules ni de build : la démo s'ouvre partout). Chaque fichier commence par une ligne qui dit ce qu'il contient.

```
README.md, PROMPT-IA.md     ce document, prompt prêt à l'emploi pour une IA
index.html                 structure de la page, ordre de chargement des scripts
favicon.svg / .ico, apple-touch-icon.png   icônes (dé doré, propre à la démo)
css/style.css              thème sombre façon ChatDeck, règles mobiles (760 / 560 / 400 px)
data/demo.jsonl            captures de la démo (une trame JSON par ligne)
js/
  config/options.js        ★ options activables + seuils de modération des emotes
  model/rules.js           règles : objectif, probabilités de farkle, combinaisons
  model/wp-data.js         table précalculée du modèle de victoire (générée)
  model/win-probability.js modèle de victoire : WP.start(), WP.dec(), WP.seuil()
  model/decisions.js       coût d'une décision en chances de gagner
  decode/api.js            états de partie de l'API → lancers, décisions, emotes
  decode/ardoise.js        texte de l'ardoise du tavernier → tours et scores
  core/utils.js            DOM, formats français, dates
  core/state.js            état de l'interface, routage par ancre, ingestion
  calc/luck.js             indice de chance
  calc/site-history.js     historique Ranked recalculé depuis « Mes stats »
  ui/header.js, charts.js, components.js   en-tête, graphiques SVG, composants
  ui/rank-alert.js         bandeau « points de classement en jeu » (top 10, quota du jour)
  views/*.js               un fichier par écran (saison, mon-jeu, replay, succes…)
  app.js                   rendu, événements, chargement des données (en dernier)
tools/
  farkle-wp-solveur.c      solveur exact du modèle de victoire
  encode-wp.py             base.bin → js/model/wp-data.js
  anonymise-demo.py        captures brutes → data/demo.jsonl (trames utiles, adversaires pseudonymisés)
```

### Format des données
Une trame par ligne. La page n'utilise que ces quatre types :

| Trame | Champs utiles | Rôle |
|---|---|---|
| `src: "http-in"`, `url: …/farkle/api/partie/<id>` | `t`, `json` (état complet : `players`, `state.log`, `state.values`, `state.emote`…) | relecture, décisions, chance, emotes |
| `src: "http-in"`, `url: …/farkle/stats/__data.json` | `json` (format SvelteKit / devalue) | historique Ranked, rang, adversaires |
| `src: "dom"` | `dom.ardoise`, `dom.joueurs` | ardoise de fin de partie (secours si l'API manque) |
| `src: "marker"` | `text` | repères (début de session, fin de partie) |

En natif, `decode/api.js` est la seule pièce à adapter : il suffit de lui donner la suite des états d'une partie, ou directement le journal des coups côté serveur.

---

## 5. Paramétrage

Tout se règle dans des objets en haut de fichier, sans toucher au reste.

### 5.1 Options : `js/config/options.js` → `DEFAULT_OPTIONS`
`on` est la valeur par défaut. Le joueur peut ensuite les basculer dans Réglages (mémorisé dans son navigateur, clé `OPT_KEY`).

| Clé | Effet |
|---|---|
| `alerteClassement` | Bandeau sur tous les onglets quand le joueur est dans le top 10 sans ses parties classées du jour (voir 5.2 bis). |
| `verrouPendantPartie` | Stats masquées pendant une partie en cours (anti-tilt), mises à jour à la fin. |
| `ardoises` | Historique des parties, relecture et ardoises. |
| `records` | Records : meilleur tour, plus grosse perte, chaînes de Hot dice, remontées. |
| `partage` | Image ou texte d'une ardoise à poster (Discord, Twitch). |
| `coachDerniere` | Verdict sur chacune des décisions du joueur dans la relecture, avec ses chances de gagner selon le choix. |
| `analyseAdversaire` | Verdicts sur les coups de l'adversaire dans la relecture (jamais de profil agrégé d'un adversaire). |
| `bilanContinu` | Bilan des décisions : profil gourmand / prudent, erreurs les plus coûteuses. |
| `seuilsChiffres` | Seuils « encaisse dès X » et calculateur selon le score. C'est une antisèche : à désactiver si on préfère ne pas la donner. |
| `chance` | Farkles et combinaisons comparés à la théorie. |
| `classementChance` | Classement « chanceux et maudits » des joueurs croisés. |
| `equite` | Équité des dés : faces et farkles observés contre théorie (test du khi²). |
| `cartes` | Statistiques par carte de dé. |
| `succes` | Catalogue de succès. |
| `moderation` | Classement des lanceurs d'emotes. **Réservé à l'équipe** en production. |
| `visibilite` | Choix Public / Discret / Privé de ce que voient les autres joueurs. |

### 5.2 Modération des emotes : `EMO_RULES` (même fichier)
Une partie est **excessive** pour un joueur si l'un des seuils de son contexte est atteint ; il passe **« à surveiller »** à `flagGames` parties excessives (ou à `rate` emotes par partie en moyenne en Ranked, sur `minGames` parties au moins).

| Seuil | Ranked | Amis | Sens |
|---|---|---|---|
| `perGame` | 6 | 15 | emotes envoyées dans la partie |
| `bursts` | 2 | 6 | rafales (deux emotes à moins de 20 s) |
| `taunts` | 2 | — | emotes juste après un farkle de l'adversaire |
| `oneSided` | 4 | 10 | emotes sans aucune réponse en face |
| `maxReply` | — | 0,25 | entre amis, ne compte que si l'autre en renvoie moins d'une sur 4 |

Le mute de l'adversaire est pris en compte : ses emotes restent comptées (elles sont dans l'état de partie), mais « sans réponse » est ignoré quand le joueur l'avait coupé. En production, le serveur connaît le mute de chacun : **le nombre de mutes reçus** (par des adversaires différents) est probablement le meilleur signal de spam. Le classement n'est qu'un signal : la décision reste humaine.

### 5.2 bis Alerte de classement : `RANK_GUARD` (même fichier)
Règle du site : dans le **top 10**, moins de **5 parties classées dans la journée** coûtent **30 points** de classement. Le bandeau rouge, placé sous les onglets (donc visible partout, relecture comprise), indique le rang, le nombre de parties encore à jouer et le temps restant avant minuit. Il disparaît dès que le quota est atteint ou que le joueur sort du top 10.

```js
var RANK_GUARD = { top: 10, quota: 5, penalty: 30 };
```

Le quota envoyé par la page « Mes stats » du site (champ `quota`) remplace celui de la config quand il est connu. En natif, le rang et le compte de parties du jour viennent directement du serveur ; dans la démo, le rang est celui de la dernière capture de « Mes stats » et le compteur affiche donc 0 sur 5 (aucune partie le jour de la consultation).

### 5.3 Règles du jeu et modèle de victoire
- `js/model/rules.js` : `TARGET` (4 000), probabilités de farkle, combinaisons.
- Si l'objectif ou le barème change, régénérer la table :

```bash
# adapter G (objectif / 50) et le barème dans best() si besoin
gcc -O2 -o wp tools/farkle-wp-solveur.c -lm && ./wp     # ≈ 15 s, écrit base.bin
python3 tools/encode-wp.py base.bin                     # réécrit js/model/wp-data.js
```

- `js/model/decisions.js` : écart en dessous duquel un choix est considéré comme bon (0,3 point de pourcentage, pour ne pas sanctionner les quasi-égalités).

### 5.4 Succès : `js/views/succes.js`
**Les succès de la démo sont des exemples.** Leur liste, leurs conditions, leurs paliers et leurs éventuelles récompenses restent entièrement à la discrétion de l'équipe ChatDeck : ils sont là pour montrer ce que les données permettent, pas pour fixer un catalogue.

Techniquement, le catalogue est un tableau `A` d'objets `{tier, nm, d, prog, …}` : `tier` va de `bronze` à `legendaire`, plus `site` pour les succès qui existent déjà sur le site. Garde-fous en place dans les exemples : comptés en Ranked uniquement, une seule fois par adversaire pour ceux qui en dépendent. Le drapeau `cosmetic: true` marque ceux qui pourraient donner une récompense cosmétique.

### 5.5 Visibilité pour les autres joueurs
Trois niveaux, choisis par le joueur : **Public** (chance chiffrée, records, succès), **Discret** (chance en tendance seulement, meilleur tour, nombre de succès), **Privé** (score et bilan V/D seulement, comme aujourd'hui). La case « Masquer mes stats » équivaut à Privé pour les autres joueurs ; l'équipe garde l'accès (modération, anti-triche). La page Réglages montre un aperçu de ce que voient les autres.

### 5.6 Autres réglages
| Où | Quoi |
|---|---|
| `js/core/state.js` | délai au-delà duquel une partie non terminée n'est plus « en cours » (10 min) |
| `js/ui/components.js` | `lim(mobile, bureau)` : nombre d'éléments affichés avant « Voir plus » |
| `css/style.css` | couleurs (`--gold`, `--win`, `--loss`…) et points de rupture mobile |
| `js/app.js` | `DEMO_URL` : fichier de données chargé quand la page est hébergée |

---

## 6. Limites connues
- Les dés sont supposés équilibrés : un éventuel effet des cartes de dé sur les probabilités n'est pas modélisé.
- Le modèle suppose un adversaire qui joue au mieux ; contre un joueur très prudent ou très gourmand, le meilleur choix peut légèrement différer.
- Dans la démo, les statistiques détaillées ne portent que sur les parties capturées (12) ; l'historique officiel, lui, couvre toute la saison.

## 7. Reproduire ou intégrer avec une IA
[`PROMPT-IA.md`](PROMPT-IA.md) contient un prompt prêt à copier pour demander à un assistant de code d'intégrer ces statistiques nativement dans ChatDeck, en se servant de cette démo comme cahier des charges.

