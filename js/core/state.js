// Farkle Stats ChatDeck · État de l'interface, routage par ancre, ingestion des captures.
"use strict";

// ---------- État ----------
var S = {
  site: null,
  siteAt: null,
  games: [],
  frames: 0,
  live: null,
  tab: "saison",
  jeuView: "decisions",
  period: "season",
  advMode: "most",
  histFilter: "all",
  histQ: "",
  histN: 60,
  anaMode: "all",
  chanceMode: "all",
  partMode: "all",
  wpMy: 0,
  wpOpp: 0,
  emoScope: "noopen",
  emoMute: (function () {
    try {
      return localStorage.getItem("fk-emomute") || "ranked";
    } catch (e) {
      return "ranked";
    }
  })(),
  partPage: 1,
  more: {},
  view: null,
  step: 0,
  steps: null,
  stepsFor: null,
  playing: false,
  timer: null,
  vis: (function () {
    try {
      return localStorage.getItem("fk-vis") || "discret";
    } catch (e) {
      return "discret";
    }
  })(),
  masked: (function () {
    try {
      return localStorage.getItem("fk-masked") === "1";
    } catch (e) {
      return false;
    }
  })()
};
function route() {
  var h = (location.hash || "").slice(1);
  var m = /^(?:partie|ardoise)-([A-Za-z0-9-]+?)(?:-n(\d+))?$/.exec(h);
  stopPlay();
  if (m) {
    S.tab = "parties";
    if (S.view !== m[1]) {
      S.view = m[1];
      S.steps = null;
    }
    S.gotoN = m[2] ? +m[2] : null;
  } else {
    S.view = null;
    if (h) S.tab = h;
  }
}

function ingest(text) {
  var frames = text
    .split("\n")
    .map(function (l) {
      l = l.trim();
      if (!l) return null;
      try {
        return JSON.parse(l);
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);
  S.frames = frames.length;
  S.site = null;
  S.siteAt = null;
  S.live = null;
  var lastPartie = {};
  frames.forEach(function (f) {
    if (f.src !== "http-in") return;
    var m = /\/farkle\/api\/partie\/(\d+)$/.exec(f.url || "");
    if (m && f.json && f.json.status) {
      var cur = lastPartie[m[1]];
      if (!cur || f.t > cur.t) lastPartie[m[1]] = { t: f.t, status: f.json.status };
    }
    if (!/\/farkle\/stats\/__data\.json$/.test(f.url || "")) return;
    var j = payload(f);
    if (!j || !j.nodes) return;
    j.nodes.forEach(function (nd) {
      if (!nd || !nd.data) return;
      try {
        var o = unflatten(nd.data);
        if (o && o.stats && o.stats.duels && (!S.siteAt || f.t > S.siteAt)) {
          S.site = o;
          S.siteAt = f.t;
        }
      } catch (e) {}
    });
  });
  // Partie en cours : dernier état non terminé, vu il y a moins de 10 min.
  Object.keys(lastPartie).forEach(function (id) {
    var x = lastPartie[id];
    if (x.status !== "done" && Date.now() - x.t < 10 * 60e3) S.live = id;
  });
  S.games = decodeRaw(frames).sort(function (a, b) {
    return String(a.date).localeCompare(String(b.date));
  });
  S.games.forEach(function (g) {
    luckOf(g);
  });
}
