// Farkle Stats ChatDeck · Options activables par le dev et seuils de modération des emotes.
"use strict";

// ---------- Options ----------
// Chaque bloc de la page s'active séparément. « on » = valeur par défaut ; le joueur peut ensuite
// les basculer dans Réglages (mémorisé dans son navigateur). Démo : tout est activé.
var DEFAULT_OPTIONS = {
  verrouPendantPartie: {
    on: true,
    label: "Verrou pendant une partie",
    desc: "Stats inaccessibles tant qu'une partie est en cours, mises à jour à la fin."
  },
  ardoises: {
    on: true,
    label: "Ardoises dans l'historique",
    desc: "Le détail tour par tour de chaque partie reste consultable."
  },
  records: {
    on: true,
    label: "Records",
    desc: "Meilleur tour, plus grosse perte, chaînes de Hot dice, remontées…"
  },
  partage: {
    on: true,
    label: "Partage",
    desc: "Image ou résumé d'une ardoise à poster sur Discord ou Twitch."
  },
  coachDerniere: {
    on: true,
    label: "Analyse coup par coup",
    desc: "Dans la relecture, chacune de tes décisions reçoit un verdict, avec tes chances de gagner selon le choix."
  },
  analyseAdversaire: {
    on: true,
    label: "Analyse des coups adverses",
    desc: "Dans la relecture d'une partie, les choix de l'adversaire sont aussi commentés. Jamais de profil agrégé d'un adversaire."
  },
  bilanContinu: {
    on: true,
    label: "Bilan de mes décisions",
    desc: "Profil gourmand / prudent par nombre de dés, erreurs les plus coûteuses."
  },
  seuilsChiffres: {
    on: true,
    label: "Seuils optimaux chiffrés",
    desc: "Les seuils « encaisse dès X » et le calculateur selon le score. C'est une antisèche : à désactiver en production si le dev préfère."
  },
  chance: {
    on: true,
    label: "Chance",
    desc: "Farkles et combinaisons comparés à la théorie, par partie et par adversaire."
  },
  classementChance: {
    on: true,
    label: "Chanceux et Maudits",
    desc: "Classement de chance des joueurs croisés."
  },
  equite: {
    on: true,
    label: "Équité des dés",
    desc: "Faces et farkles de tous les lancers observés comparés à la théorie."
  },
  cartes: { on: true, label: "Stats par carte", desc: "Ce que sort chacun de tes six dés." },
  succes: { on: true, label: "Succès", desc: "Catalogue Bronze → Légendaire, comptés en Ranked." },
  moderation: {
    on: true,
    label: "Modération des emotes",
    desc: "Classement de saison des lanceurs d'emotes pour repérer spam et harcèlement. Visible par l'équipe ChatDeck uniquement."
  },
  visibilite: {
    on: true,
    label: "Réglage de visibilité",
    desc: "Public / Discret / Privé pour ce que voient les autres joueurs."
  }
};
var OPT_KEY = "fk-demo-options"; // clé localStorage des choix du joueur
var OPT = (function () {
  var o = JSON.parse(JSON.stringify(DEFAULT_OPTIONS));
  try {
    var s = JSON.parse(localStorage.getItem(OPT_KEY) || "{}");
    Object.keys(s).forEach(function (k) {
      if (o[k]) o[k].on = !!s[k];
    });
  } catch (e) {}
  return o;
})();
function on(k) {
  return OPT[k] && OPT[k].on;
}
function saveOpt() {
  try {
    var s = {};
    Object.keys(OPT).forEach(function (k) {
      s[k] = OPT[k].on;
    });
    localStorage.setItem(OPT_KEY, JSON.stringify(s));
  } catch (e) {}
}

// Seuils de modération des emotes, par contexte. Réglables par le dev.
// En partie amie, on ne signale que le spam à sens unique : les échanges entre potes sont attendus.
// Une partie est « excessive » pour un joueur si l'un des seuils de son contexte est atteint.
var EMO_RULES = {
  ranked: {
    perGame: 6, //   emotes envoyées dans la partie
    bursts: 2, //    rafales : deux emotes à moins de 20 s
    taunts: 2, //    emotes juste après un farkle de l'adversaire
    oneSided: 4, //  emotes sans aucune réponse de l'adversaire
    rate: 3, //      moyenne par partie qui suffit à signaler le joueur…
    minGames: 3 //   …à partir de ce nombre de parties
  },
  open: {
    // Parties amies : seul le spam à sens unique compte.
    perGame: 15,
    bursts: 6,
    taunts: null, // ignoré entre amis
    oneSided: 10,
    rate: null, //   pas de signalement à la moyenne
    minGames: 3,
    maxReply: 0.25 // l'adversaire renvoie moins d'une emote sur 4
  },
  flagGames: 2 // parties excessives pour passer « à surveiller »
};
