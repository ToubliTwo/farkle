// Farkle Stats ChatDeck · Décodage de l'ardoise du tavernier (texte de fin de partie).
"use strict";

// ---------- Décodage des captures brutes (ardoise du tavernier) ----------
var SP = /[\s  ]/g;
function pnum(x) {
  return Number(String(x).replace(SP, "").replace(/[−–]/g, "-").replace("+", "").replace("✦", ""));
}
function strHash(str) {
  var h = 2166136261;
  for (var i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}
function parseArdoise(text) {
  var L = String(text)
    .split("\n")
    .map(function (x) {
      return x.replace(/ | /g, " ").trim();
    })
    .filter(Boolean);
  var i0 = L.findIndex(function (x) {
    return /Ardoise du tavernier/i.test(x);
  });
  if (i0 < 0) return null;
  var out = {
    tours: null,
    manches: null,
    names: [],
    rows: [],
    partial: false,
    hiddenTurns: 0,
    totals: null,
    farkles: null,
    lost: null,
    hot: null
  };
  var mm = /(\d+)\s*tours?\s*·\s*(\d+)\s*manches?/.exec(L[i0 + 1] || "");
  if (mm) {
    out.tours = +mm[1];
    out.manches = +mm[2];
  }
  var j = L.indexOf("N°");
  if (j < 0) return null;
  out.names = [L[j + 1], L[j + 2]];
  var isInt = function (x) {
    return /^\d{1,2}$/.test(x);
  };
  var isCum = function (x) {
    return /^\d[\d ]*$/.test(x);
  };
  var isDelta = function (x) {
    return /^\+\d[\d ]*( ?✦)?$/.test(x);
  };
  var isLost = function (x) {
    return /^[−–-]\d[\d ]*$/.test(x);
  };
  function cell(k) {
    var a = L[k];
    if (a === "F") {
      return isLost(L[k + 1])
        ? { bust: true, pts: Math.abs(pnum(L[k + 1])), next: k + 2 }
        : { bust: true, pts: 0, next: k + 1 };
    }
    if (a === "–" || a === "-" || a === "—") return { none: true, next: k + 1 };
    if (isCum(a) && isDelta(L[k + 1]))
      return { cum: pnum(a), pts: pnum(L[k + 1]), hot: /✦/.test(L[k + 1]), next: k + 2 };
    return null;
  }
  var k = j + 3;
  while (k < L.length && L[k] !== "Total") {
    if (L[k] === "⁂") {
      out.partial = true;
      while (k < L.length && !/^Déplier/.test(L[k])) k++;
      var dm = /·\s*(\d+)\s*tours?/.exec(L[k] || "");
      if (dm) out.hiddenTurns += +dm[1];
      out.rows.push({ gap: true });
      k++;
      continue;
    }
    if (/^(Déplier|Replier)/.test(L[k])) {
      k++;
      continue;
    }
    if (isInt(L[k])) {
      var c1 = cell(k + 1);
      var c2 = c1 ? cell(c1.next) : null;
      if (c1 && c2) {
        out.rows.push({ n: +L[k], me: c1, opp: c2 });
        k = c2.next;
        continue;
      }
    }
    k++;
  }
  var t = L.indexOf("Total");
  if (t >= 0) out.totals = [pnum(L[t + 1]), pnum(L[t + 2])];
  function pair(label) {
    var idx = L.findIndex(function (x) {
      return label.test(x);
    });
    if (idx < 0) return null;
    var m = /([\d ]+)\s*\/\s*([\d ]+)/.exec(L[idx + 1] || "");
    return m ? [pnum(m[1]), pnum(m[2])] : null;
  }
  out.farkles = pair(/^Farkles$/);
  out.lost = pair(/^Points perdus$/);
  out.hot = pair(/Mains pleines/);
  return out;
}
function eloOf(s) {
  var m = /([\d ]+)\s*Elo/.exec(String(s || "").replace(/ | /g, " "));
  return m ? pnum(m[1]) : null;
}
function gameFromDom(f, modeHint) {
  var a = parseArdoise(f.dom.ardoise);
  if (!a || !a.totals || !a.rows.length) return null;
  var res = f.dom.resultat || "";
  var win = /Partie gagnée/i.test(res)
    ? true
    : /Partie perdue/i.test(res)
      ? false
      : a.totals[0] > a.totals[1];
  var played = a.rows.filter(function (r) {
    return !r.gap;
  });
  if (!played.length) return null;
  var last = played[played.length - 1];
  var bothLast = !last.me.none && !last.opp.none;
  var starter = bothLast ? (win ? "opp" : "me") : win ? "me" : "opp";
  var me = [],
    opp = [],
    cm = 0,
    co = 0,
    maxDef = 0,
    maxLead = 0;
  a.rows.forEach(function (r) {
    if (r.gap) {
      cm = null;
      co = null;
      return;
    }
    if (!r.me.none) {
      me.push({ pts: r.me.pts, bust: !!r.me.bust, hot: !!r.me.hot });
      if (r.me.cum != null) cm = r.me.cum;
    }
    if (!r.opp.none) {
      opp.push({ pts: r.opp.pts, bust: !!r.opp.bust, hot: !!r.opp.hot });
      if (r.opp.cum != null) co = r.opp.cum;
    }
    if (cm != null && co != null) {
      maxDef = Math.max(maxDef, co - cm);
      maxLead = Math.max(maxLead, cm - co);
    }
  });
  var joueurs = f.dom.joueurs || [];
  var dk = /\+(\d+)\s*Deckoins/.exec(res.replace(/\n/g, " "));
  var banked = me
    .filter(function (x) {
      return !x.bust;
    })
    .map(function (x) {
      return x.pts;
    });
  var g = {
    date: new Date(f.t).toISOString(),
    result: win ? "win" : "loss",
    myScore: a.totals[0],
    oppScore: a.totals[1],
    opponent: a.names[1],
    turns: me.length + (a.partial ? Math.round(a.hiddenTurns / 2) : 0),
    manches: a.manches,
    starter: starter,
    farkles: a.farkles
      ? a.farkles[0]
      : me.filter(function (x) {
          return x.bust;
        }).length,
    hotDice: a.hot ? a.hot[0] : null,
    oppFarkles: a.farkles ? a.farkles[1] : null,
    lostPoints: a.lost ? a.lost[0] : null,
    oppLost: a.lost ? a.lost[1] : null,
    oppHot: a.hot ? a.hot[1] : null,
    bestTurn: banked.length ? Math.max.apply(null, banked) : null,
    turnLog: me,
    oppTurnLog: opp,
    maxDeficit: maxDef,
    maxLead: maxLead,
    elo: eloOf(joueurs[0]),
    oppElo: eloOf(joueurs[1]),
    deckoins: dk ? +dk[1] : null,
    partial: a.partial,
    source: "capture"
  };
  if (modeHint) g.mode = modeHint;
  else if (g.elo != null || g.deckoins != null) g.mode = "ranked"; // l'en-tête Elo et les Deckoins n'apparaissent qu'en Ranked
  g.id =
    "cd-" +
    strHash(
      [g.opponent, g.myScore, g.oppScore, a.tours, a.manches, g.elo, g.oppElo, g.date.slice(0, 13)].join("|")
    );
  return g;
}
