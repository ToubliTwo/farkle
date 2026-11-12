// Farkle Stats ChatDeck · Historique Ranked officiel, recalculé depuis la page « Mes stats » du site.
"use strict";

// ---------- Stats officielles (historique Ranked) ----------
function siteCalc() {
  var st = S.site.stats,
    cfg = S.site.cfg || {},
    D = (st.duels || []).slice().sort(function (a, b) {
      return a.at - b.at;
    });
  var w = D.filter(function (d) {
      return d.won;
    }).length,
    streak = 0,
    streakWin = null;
  for (var i = D.length - 1; i >= 0; i--) {
    if (streakWin == null) streakWin = D[i].won;
    if (D[i].won === streakWin) streak++;
    else break;
  }
  var best = null,
    run = 0,
    bestRun = 0,
    bigGain = null,
    bigLoss = null,
    days = {};
  D.forEach(function (d) {
    if (!best || d.e > best.e) best = d;
    run = d.won ? run + 1 : 0;
    bestRun = Math.max(bestRun, run);
    if (!bigGain || d.d > bigGain.d) bigGain = d;
    if (!bigLoss || d.d < bigLoss.d) bigLoss = d;
    var k = dayKey(d.at);
    var x = days[k] || (days[k] = { k: k, v: 0, l: 0, delta: 0, end: 0 });
    if (d.won) x.v++;
    else x.l++;
    x.delta += d.d;
    x.end = d.e;
  });
  var dayList = Object.keys(days)
    .sort()
    .reverse()
    .map(function (k) {
      return days[k];
    });
  var wins = D.filter(function (d) {
      return d.won;
    }),
    losses = D.filter(function (d) {
      return !d.won;
    });
  return {
    D: D,
    opps: st.opps || {},
    place: st.place || {},
    cfg: cfg,
    n: D.length,
    w: w,
    streak: streak,
    streakWin: streakWin,
    best: best,
    bestRun: bestRun,
    bigGain: bigGain,
    bigLoss: bigLoss,
    days: dayList,
    bestDay: dayList.slice().sort(function (a, b) {
      return b.delta - a.delta;
    })[0],
    season: st.current || st.season,
    avgWin: wins.length
      ? wins.reduce(function (s, d) {
          return s + d.d;
        }, 0) / wins.length
      : null,
    avgLoss: losses.length
      ? losses.reduce(function (s, d) {
          return s + d.d;
        }, 0) / losses.length
      : null
  };
}
function oppName(c, id) {
  var o = c.opps[id];
  return o ? o.name || o.login : "Joueur " + String(id).slice(-4);
}
function oppAv(c, id) {
  var o = c.opps[id];
  return o && o.av ? o.av : "";
}
function gameById(id) {
  return S.games.find(function (g) {
    return g.id === "cdp-" + id;
  });
}
