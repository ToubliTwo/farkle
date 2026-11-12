// Farkle Stats ChatDeck · Décodage des états de partie de l'API : chaque lancer, chaque décision, des deux joueurs.
"use strict";

// Décodage des états de partie de l'API (/farkle/api/partie/<id>) : chaque lancer des deux joueurs.
function gameFromApi(states) {
  states.sort(function (x, y) {
    return (x.json.version || 0) - (y.json.version || 0) || x.t - y.t;
  });
  var fin = states[states.length - 1].json,
    me = fin.me,
    op = me === "a" ? "b" : "a";
  if (fin.status !== "done" || !fin.winner) return null;
  var ev = {};
  var emotes = [],
    lastEm = 0;
  states.forEach(function (f) {
    var st = f.json.state || {},
      l = st.last;
    if (l && l.n != null && !ev[l.n]) ev[l.n] = { e: l, tp: st.turnPts || 0, sc: st.scores || {} };
    var em = st.emote;
    if (em && em.n > lastEm) {
      // "n" compte toutes les emotes de la partie ; si plusieurs sont passées entre deux relevés, seule la dernière est connue.
      for (var j = lastEm + 1; j <= em.n; j++)
        emotes.push({
          by: em.by,
          i: j === em.n ? em.i : null,
          at: (em.at || {})[em.by] || null,
          after: l ? { by: l.by, kind: l.kind, n: l.n } : null
        });
      lastEm = em.n;
    }
  });
  var ns = Object.keys(ev)
    .map(Number)
    .sort(function (a, b) {
      return a - b;
    });
  var missing = 0;
  for (var i = 1; i <= ns[ns.length - 1]; i++) if (!ev[i]) missing++;
  var R = { a: [], b: [] },
    D = { a: [], b: [] },
    T = { a: [], b: [] },
    TC = { a: 0, b: 0 },
    cards = null;
  states.forEach(function (f) {
    var d = (f.json.state || {}).dice;
    if (!cards && d && d.a) cards = d;
  });
  ns.forEach(function (n, k) {
    var x = ev[n],
      e = x.e,
      who = e.by,
      nxt = ev[ns[k + 1]],
      prv = ev[ns[k - 1]];
    var turnStart = !prv || prv.e.by !== who || prv.e.kind === "bank" || prv.e.kind === "farkle";
    if ((e.kind === "roll" || e.kind === "farkle") && turnStart) TC[who]++;
    if (e.kind === "roll" || e.kind === "farkle") {
      var vals = (e.idx || []).map(function (i) {
        return e.values[i];
      });
      R[who].push({
        n: vals.length,
        f: e.kind === "farkle",
        v: vals,
        p: (e.idx || []).slice(),
        first: turnStart,
        ti: TC[who] - 1,
        en: n
      });
    }
    if (e.kind === "farkle") T[who].push({ pts: e.pts || 0, bust: true, hot: !!e.hot });
    if (e.kind === "bank") T[who].push({ pts: e.pts || 0, bust: false, hot: !!e.hot });
    // Décision prise après un lancer réussi : relancer ou encaisser.
    if (e.kind === "roll" && nxt && nxt.e.by === who && ns[k + 1] === n + 1) {
      var thrown = (e.idx || []).length,
        mine = x.sc[who] || 0,
        theirs = x.sc[who === "a" ? "b" : "a"] || 0;
      if (nxt.e.kind === "bank") {
        var left = thrown - (nxt.e.idx || []).length;
        D[who].push({
          act: "bank",
          pts: nxt.e.pts || 0,
          left: left === 0 ? 6 : left,
          my: mine,
          opp: theirs,
          ti: TC[who] - 1
        });
      } else if (nxt.e.kind === "roll" || nxt.e.kind === "farkle") {
        D[who].push({
          act: "roll",
          pts: nxt.e.kind === "farkle" ? nxt.e.pts || 0 : nxt.tp,
          left: (nxt.e.idx || []).length,
          my: mine,
          opp: theirs,
          ti: TC[who] - 1,
          out: nxt.e.kind
        });
      }
    }
  });
  var P0 = states[0].json.players || {},
    P = fin.players || {},
    pm = P[me] || {},
    s0 = P0[me] || {},
    po = P0[op] || P[op] || {};
  var sc = (fin.state || {}).scores || {};
  var banked = T[me]
    .filter(function (t) {
      return !t.bust;
    })
    .map(function (t) {
      return t.pts;
    });
  var cm = 0,
    co = 0,
    maxDef = 0,
    maxLead = 0;
  ns.forEach(function (n) {
    var e = ev[n].e;
    if (e.kind === "bank") {
      if (e.by === me) cm += e.pts;
      else co += e.pts;
      maxDef = Math.max(maxDef, co - cm);
      maxLead = Math.max(maxLead, cm - co);
    }
  });
  var g = {
    id: "cdp-" + fin.id,
    date: new Date(fin.now || states[states.length - 1].t).toISOString(),
    result: fin.winner === me ? "win" : "loss",
    myScore: sc[me] || 0,
    oppScore: sc[op] || 0,
    opponent: po.name || "",
    mode: fin.ranked ? "ranked" : "open",
    starter: (fin.state || {}).home === me ? "me" : "opp",
    turns: T[me].length,
    manches: Math.max(T.a.length, T.b.length),
    farkles: T[me].filter(function (t) {
      return t.bust;
    }).length,
    oppFarkles: T[op].filter(function (t) {
      return t.bust;
    }).length,
    hotDice: R[me].filter(function (r, i) {
      return r.n === 6 && !r.first;
    }).length,
    oppHot: R[op].filter(function (r) {
      return r.n === 6 && !r.first;
    }).length,
    lostPoints: T[me]
      .filter(function (t) {
        return t.bust;
      })
      .reduce(function (s, t) {
        return s + t.pts;
      }, 0),
    oppLost: T[op]
      .filter(function (t) {
        return t.bust;
      })
      .reduce(function (s, t) {
        return s + t.pts;
      }, 0),
    bestTurn: banked.length ? Math.max.apply(null, banked) : null,
    turnLog: T[me],
    oppTurnLog: T[op],
    rolls: R[me],
    oppRolls: R[op],
    decisions: D[me],
    oppDecisions: D[op],
    maxDeficit: maxDef,
    maxLead: maxLead,
    elo: s0.elo != null ? s0.elo : pm.elo,
    oppElo: po.elo,
    winProb: s0.stake ? s0.stake.pct / 100 : null,
    eloWin: s0.stake ? s0.stake.win : null,
    eloLoss: s0.stake ? s0.stake.loss : null,
    source: "capture"
  };
  g.emotes = emotes.map(function (x) {
    return {
      by: x.by === me ? "me" : "opp",
      i: x.i,
      at: x.at,
      after: x.after ? { by: x.after.by === me ? "me" : "opp", kind: x.after.kind, n: x.after.n } : null
    };
  });
  g.emotesSent = g.emotes.filter(function (x) {
    return x.by === "me";
  }).length;
  g.emotesRecv = g.emotes.length - g.emotesSent;
  if (cards) {
    var mapC = function (L) {
      return (L || []).map(function (c) {
        return { t: c.title, img: c.image, r: c.rarity, id: c.cardId };
      });
    };
    g.cards = mapC(cards[me]);
    g.oppCards = mapC(cards[op]);
  }
  if (Math.max(g.myScore, g.oppScore) < TARGET) g.abandon = true;
  // Repères (numéro d'action) des moments forts, pour ouvrir la relecture pile au bon coup.
  var mk = { best: null, worst: null, hot: null, one: null },
    bp = -1,
    wp = -1,
    hc = {},
    oc = {},
    hm = 0,
    om = 0;
  ns.forEach(function (n) {
    var e = ev[n].e;
    if (e.by !== me) return;
    if (e.kind === "bank" && e.pts > bp) {
      bp = e.pts;
      mk.best = n;
    }
    if (e.kind === "farkle" && e.pts > wp) {
      wp = e.pts;
      mk.worst = n;
    }
  });
  R[me].forEach(function (r) {
    if (r.n === 6 && !r.first) {
      hc[r.ti] = (hc[r.ti] || 0) + 1;
      if (hc[r.ti] > hm) {
        hm = hc[r.ti];
        mk.hot = r.en;
      }
    }
    if (r.n === 1 && !r.f) {
      oc[r.ti] = (oc[r.ti] || 0) + 1;
      if (oc[r.ti] > om) {
        om = oc[r.ti];
        mk.one = r.en;
      }
    }
  });
  g.marks = mk;
  // Séquence complète pour la relecture : chaque action avec l'état du tour et le score.
  g.events = ns.map(function (n) {
    var x = ev[n],
      e = x.e,
      s2 = x.sc || {};
    return {
      n: n,
      by: e.by === me ? "me" : "opp",
      kind: e.kind,
      values: (e.values || []).slice(0, 6),
      idx: (e.idx || []).slice(),
      pts: e.pts || 0,
      hot: !!e.hot,
      tp: x.tp || 0,
      my: s2[me] || 0,
      opp: s2[op] || 0
    };
  });
  var perTurn = {};
  R[me].forEach(function (r) {
    var x = perTurn[r.ti] || (perTurn[r.ti] = { hot: 0, one: 0 });
    if (r.n === 6 && !r.first) x.hot++;
    if (r.n === 1 && !r.f) x.one++;
  });
  g.maxHotChain = 0;
  g.maxOneDie = 0;
  Object.keys(perTurn).forEach(function (k) {
    g.maxHotChain = Math.max(g.maxHotChain, perTurn[k].hot);
    g.maxOneDie = Math.max(g.maxOneDie, perTurn[k].one);
  });
  var worst = T[me]
    .filter(function (t) {
      return t.bust;
    })
    .map(function (t) {
      return t.pts;
    });
  g.worstLoss = worst.length ? Math.max.apply(null, worst) : 0;
  if (missing) {
    g.partial = true;
    g.missing = missing;
  }
  return g;
}
function decodeRaw(frames) {
  var best = {},
    mode = {};
  frames.sort(function (x, y) {
    return (x.t || 0) - (y.t || 0);
  });
  frames.forEach(function (f) {
    if (!f) return;
    if (f.src === "marker" && !f.auto && /\b(open|ouverte|ranked|class)/i.test(f.text || ""))
      mode[f.sid] = /open|ouverte/i.test(f.text) ? "open" : "ranked";
    if (f.src !== "dom" || !f.dom || !f.dom.ardoise) return;
    var g = gameFromDom(f, mode[f.sid]);
    if (!g) return;
    var score = (g.partial ? 0 : 4) + (f.dom.resultat ? 2 : 0) + (g.elo != null ? 1 : 0);
    var cur = best[g.id];
    if (!cur || score > cur.score) best[g.id] = { g: g, score: score, first: cur ? cur.first : g.date };
  });
  var games = Object.keys(best).map(function (k) {
    var b = best[k];
    b.g.date = b.first;
    return b.g;
  });
  // Parties complètes depuis l'API ; elles remplacent l'ardoise de la même partie.
  var byId = {};
  frames.forEach(function (f) {
    var m = f && f.src === "http-in" && f.json && /\/farkle\/api\/partie\/(\d+)$/.exec(f.url || "");
    if (m && f.json.state) (byId[m[1]] = byId[m[1]] || []).push(f);
  });
  Object.keys(byId).forEach(function (id) {
    var g = gameFromApi(byId[id]);
    if (!g) return;
    games = games.filter(function (d) {
      return !(
        d.source === "capture" &&
        d.id.indexOf("cd-") === 0 &&
        d.opponent === g.opponent &&
        d.myScore === g.myScore &&
        d.oppScore === g.oppScore
      );
    });
    games.push(g);
  });
  return games;
}
function rawFramesFrom(txt) {
  var t = txt.trim();
  if (t[0] === "{" && t.indexOf("\n{") > 0) {
    return t
      .split("\n")
      .map(function (l) {
        try {
          return JSON.parse(l);
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
  }
  try {
    var d = JSON.parse(t);
    if (d && d.kind === "chatdeck-farkle-raw") return d.frames || [];
  } catch (e) {}
  return null;
}
