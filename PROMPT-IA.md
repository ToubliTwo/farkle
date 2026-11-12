# Prompt pour un assistant de code

À copier tel quel dans l'assistant (Claude Code, Cursor, Copilot…), **après lui avoir donné accès au dossier de cette démo et au dépôt de ChatDeck**. Les passages entre crochets sont à compléter ou à supprimer.

---

```text
Tu vas intégrer nativement, dans le site ChatDeck (jeu Farkle), une page de statistiques avancées.
Une démo complète et fonctionnelle existe déjà : elle sert de cahier des charges.

## Sources à lire d'abord
- Le dossier de la démo [chemin du dossier farkle-stats-demo] :
  - README.md : démarche, écrans, paramétrage, format des données, limites.
  - js/ : la logique de référence (un fichier par rôle). Les calculs y sont justes et testés :
    reprends-les, ne les réinvente pas.
  - data/demo.jsonl : des états de partie réels (pseudonymisés), utiles comme jeux de test.
- Le dépôt ChatDeck [chemin] : stack [SvelteKit / base de données / ORM à préciser], le code du Farkle,
  la page actuelle « Mes stats » (/farkle/stats) et la page « Mon compte ».

Avant d'écrire du code, résume-moi comment le Farkle stocke aujourd'hui une partie (états, journal
des coups, scores, emotes, cartes de dés) et pose-moi tes questions sur ce qui n'est pas clair.

## Ce qu'il faut construire
1. Calcul côté serveur, à la fin de chaque partie, à partir des états et du journal des coups
   que le serveur possède déjà (plus besoin du userscript ni du collecteur de la démo) :
   - pour chaque joueur : lancers, farkles, Hot dice, tours, records, décisions
     (relancer / encaisser) avec leur coût en chances de gagner, indice de chance, emotes ;
   - logique de référence : js/decode/api.js, js/model/*.js, js/calc/*.js.
2. Stockage : un résumé par partie et par joueur, plus ce qu'il faut pour la relecture coup par coup
   (la suite des lancers et des dés gardés). Propose un schéma et une migration.
3. Une API de lecture pour la page (saison, parties, relecture, adversaires, mon jeu, trophées),
   limitée aux données du joueur connecté, sauf la vue de modération (rôle équipe uniquement).
4. Les écrans, en composants du site, fidèles à la démo :
   Saison · Mon jeu · Parties (dont relecture) · Adversaires · Trophées, et les réglages dans
   « Mon compte ». Mobile d'abord : aucun défilement horizontal à 360 px, libellés sur une ligne.
   Textes en français, en tutoyant le joueur.
5. Les options de js/config/options.js deviennent des réglages côté serveur (activables par l'équipe),
   avec les mêmes valeurs par défaut.
6. Modèle de victoire : garder la table précalculée (js/model/wp-data.js, 12,8 Ko) et le calcul
   à la demande de js/model/win-probability.js. Le solveur tools/farkle-wp-solveur.c la régénère
   si les règles changent (objectif, barème).
7. Modération des emotes (vue équipe) : reprendre EMO_RULES, calculer sur tous les joueurs de la saison,
   tenir compte du mute réel de chaque joueur, et ajouter le nombre de joueurs différents
   qui l'ont muté. Le classement n'est qu'un signal : aucune sanction automatique.
8. Visibilité : Public / Discret / Privé et « Masquer mes stats », comme dans la démo ;
   l'équipe garde l'accès.
9. Verrou anti-tilt : stats indisponibles pendant une partie en cours, mises à jour à la fin.

## Points laissés à l'équipe ChatDeck
- Les succès de la démo sont des exemples : liste, conditions et récompenses sont à décider par l'équipe.
  Prévois un catalogue facile à modifier, sans coder chaque succès en dur dans les vues.
- Activation ou non des seuils chiffrés (« encaisse dès X »), qui sont une antisèche.

## Contraintes
- Respect des CGU et du RGPD : finalités « statistiques de jeu » et « modération » à documenter ;
  conservation limitée pour la modération (la saison) ; adversaires anonymisés quand leur compte
  est supprimé ; le joueur peut supprimer ses propres statistiques.
- Ne jamais exposer à un joueur un profil agrégé d'un autre joueur au-delà de ce que montre la démo.
- Performances : calculer une fois en fin de partie, pas à chaque affichage.
- Tests : rejouer les parties de data/demo.jsonl et vérifier que tes résultats sont identiques
  à ceux de la démo (décisions justes, coûts, chance, records).

## Méthode
Procède par étapes et montre-moi chaque étape avant de passer à la suivante :
1. état des lieux et questions ;
2. schéma de données et calcul de fin de partie, avec les tests ;
3. API ;
4. écrans, onglet par onglet ;
5. réglages, modération, visibilité ;
6. reprise de l'historique existant (si possible, recalculer les parties déjà jouées).
```
