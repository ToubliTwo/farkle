// Farkle Stats ChatDeck · Relecture d'une partie, coup par coup, comme aux échecs.
"use strict";

// ---------- Relecture (comme une partie d'échecs) ----------
var PIPS = {
  1: [[50, 50]],
  2: [
    [28, 28],
    [72, 72]
  ],
  3: [
    [26, 26],
    [50, 50],
    [74, 74]
  ],
  4: [
    [28, 28],
    [72, 28],
    [28, 72],
    [72, 72]
  ],
  5: [
    [27, 27],
    [73, 27],
    [50, 50],
    [27, 73],
    [73, 73]
  ],
  6: [
    [28, 24],
    [72, 24],
    [28, 50],
    [72, 50],
    [28, 76],
    [72, 76]
  ]
};
function die(v, cls, i, k) {
  return (
    '<svg class="die ' +
    (cls || "") +
    '" viewBox="0 0 100 100" style="--i:' +
    (i || 0) +
    ";--k:" +
    (k || 0) +
    '" aria-label="Dé ' +
    v +
    '"><rect x="4" y="4" width="92" height="92" rx="20"/>' +
    (PIPS[v] || [])
      .map(function (p) {
        return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="9"/>';
      })
      .join("") +
    "</svg>"
  );
}
function buildSteps(g) {
  var E = g.events || [],
    st = [],
    kept = { me: [], opp: [] },
    turn = { me: 0, opp: 0 };
  E.forEach(function (e, k) {
    var nx = E[k + 1],
      pv = E[k - 1];
    if (e.kind !== "roll" && e.kind !== "farkle") return;
    var first = !pv || pv.by !== e.by || pv.kind === "bank" || pv.kind === "farkle",
      hot = !first && e.idx.length === 6;
    if (first) {
      kept[e.by] = [];
      turn[e.by]++;
    } else if (hot) kept[e.by] = [];
    var vals = e.idx.map(function (i) {
      return e.values[i];
    });
    if (e.kind === "farkle") {
      st.push({
        type: "farkle",
        who: e.by,
        turn: turn[e.by],
        vals: vals,
        kept: kept[e.by].slice(),
        lost: e.pts,
        tp: e.pts,
        my: e.my,
        opp: e.opp,
        n: e.n,
        hot: hot,
        first: first
      });
      kept[e.by] = [];
      return;
    }
    st.push({
      type: "throw",
      who: e.by,
      turn: turn[e.by],
      vals: vals,
      kept: kept[e.by].slice(),
      tp: e.tp,
      my: e.my,
      opp: e.opp,
      n: e.n,
      hot: hot,
      first: first
    });
    if (!nx || nx.by !== e.by) return;
    var act, sel, tpAfter, left;
    if (nx.kind === "bank") {
      act = "bank";
      sel = nx.idx.slice();
      tpAfter = nx.pts;
      left = e.idx.length - sel.length || 6;
    } else {
      act = "roll";
      left = nx.idx.length;
      tpAfter = nx.kind === "farkle" ? nx.pts : nx.tp;
      sel =
        left === 6
          ? e.idx.slice()
          : e.idx.filter(function (i) {
              return nx.values[i] == null;
            });
    }
    var selVals = sel.map(function (i) {
        return e.values[i];
      }),
      selMask = e.idx.map(function (i) {
        return sel.indexOf(i) >= 0;
      });
    kept[e.by] = kept[e.by].concat(selVals);
    var d = {
      act: act,
      pts: tpAfter,
      left: left,
      my: e.by === "me" ? e.my : e.opp,
      opp: e.by === "me" ? e.opp : e.my
    };
    st.push({
      type: act === "bank" ? "bank" : "keep",
      who: e.by,
      turn: turn[e.by],
      vals: vals,
      selMask: selMask,
      selVals: selVals,
      kept: kept[e.by].slice(),
      gain: tpAfter - e.tp,
      tp: tpAfter,
      left: left,
      d: d,
      cost: decCost(d),
      my: act === "bank" ? nx.my : e.my,
      opp: act === "bank" ? nx.opp : e.opp,
      n: nx.n,
      out: nx.kind
    });
  });
  (g.emotes || []).forEach(function (em) {
    if (!em.after || em.after.n == null) return;
    for (var i = st.length - 1; i >= 0; i--) {
      if (st[i].n <= em.after.n) {
        (st[i].emotes = st[i].emotes || []).push(em);
        break;
      }
    }
  });
  return st;
}
function stepText(x, g) {
  var me = x.who === "me",
    nm = esc(g.opponent),
    dd = function (n) {
      return n + (n > 1 ? " dés" : " dé");
    },
    sel = x.selVals ? x.selVals.join(" · ") : "";
  if (x.type === "throw") {
    if (x.hot) return "Hot dice ! " + (me ? "Tu relances" : nm + " relance") + " les 6 dés";
    return me
      ? (x.first ? "Tu lances " : "Tu relances ") + dd(x.vals.length)
      : nm + (x.first ? " lance " : " relance ") + dd(x.vals.length);
  }
  if (x.type === "farkle")
    return (
      "Farkle ! " +
      (x.lost
        ? (me ? "Tu perds " : nm + " perd ") + fmt(x.lost) + " points"
        : me
          ? "Tu ne marques rien"
          : nm + " ne marque rien")
    );
  if (x.type === "keep")
    return me
      ? "Tu gardes " + sel + " (+" + fmt(x.gain) + ") et tu relances " + dd(x.left)
      : nm + " garde " + sel + " (+" + fmt(x.gain) + ") et relance " + dd(x.left);
  return me
    ? "Tu gardes " + sel + " (+" + fmt(x.gain) + ") et tu encaisses " + fmt(x.tp)
    : nm + " garde " + sel + " (+" + fmt(x.gain) + ") et encaisse " + fmt(x.tp);
}
function stepShort(x) {
  var dd = function (n) {
      return n + (n > 1 ? " dés" : " dé");
    },
    sel = x.selVals ? x.selVals.join(" ") : "";
  if (x.type === "throw")
    return x.hot
      ? "Hot dice : relance des 6 dés"
      : (x.first ? "Lancer de " : "Relance de ") + dd(x.vals.length);
  if (x.type === "farkle") return "Farkle" + (x.lost ? " −" + fmt(x.lost) : "");
  if (x.type === "keep") return "Garde " + sel + " +" + fmt(x.gain) + " · relance " + x.left;
  return "Garde " + sel + " +" + fmt(x.gain) + " · encaisse";
}
function turnLabel(who, n, g) {
  return who === "me" ? "Ton tour " + n : "Tour " + n + " de " + esc(g.opponent);
}
function verdict(x, g) {
  if (!x.d || !on(x.who === "me" ? "coachDerniere" : "analyseAdversaire")) return "";
  var me = x.who === "me",
    nm = esc(g.opponent),
    win = x.d.my + x.d.pts >= TARGET,
    e = decWP(x.d),
    bank = x.d.act === "bank";
  var cls = me ? "" : " opp",
    pour = me ? "" : " pour " + nm;
  if (win)
    return x.cost === 0
      ? '<div class="verdict ok' +
          cls +
          '"><b>✓ Victoire</b><span>4 000 atteint, la partie est gagnée.</span></div>'
      : '<div class="verdict ko' +
          cls +
          '"><b>✗ ' +
          (me ? "Trop gourmand" : "Coup trop gourmand de " + nm) +
          "</b><span>" +
          (me ? "Tu pouvais" : nm + " pouvait") +
          " encaisser et gagner la partie.</span></div>";
  var pB = e ? pct(e.bank, 1) : "",
    pR = e ? pct(e.roll, 1) : "";
  if (x.cost === 0) {
    var t = me ? "Bon choix" : "Bon choix de " + nm;
    var why = !e
      ? ""
      : bank
        ? "En encaissant, " +
          (me ? "tu gardes " : nm + " garde ") +
          pB +
          " de chances de gagner, contre " +
          pR +
          " en relançant."
        : "En relançant, " +
          (me ? "tu as " : nm + " a ") +
          pR +
          " de chances de gagner, contre " +
          pB +
          " en encaissant.";
    return '<div class="verdict ok' + cls + '"><b>✓ ' + t + "</b><span>" + why + "</span></div>";
  }
  var t2 = bank
    ? me
      ? "Trop prudent"
      : "Coup trop prudent de " + nm
    : me
      ? "Trop gourmand"
      : "Coup trop gourmand de " + nm;
  var why2 = bank
    ? "Il valait mieux relancer : " +
      pR +
      " de chances de gagner" +
      pour +
      ", contre " +
      pB +
      " en encaissant."
    : "Il valait mieux encaisser : " +
      pB +
      " de chances de gagner" +
      pour +
      ", contre " +
      pR +
      " en relançant.";
  return (
    '<div class="verdict ko' +
    cls +
    '"><b>✗ ' +
    t2 +
    "</b><span>" +
    why2 +
    (x.out === "farkle" ? " Le farkle a suivi." : "") +
    "</span></div>"
  );
}
function renderReplay() {
  var g = S.games.find(function (x) {
    return x.id.replace(/^cdp-/, "") === S.view;
  });
  var back = '<a class="back" href="#parties">‹ Toutes les parties</a>';
  if (!g) return '<section class="card">' + back + '<p class="empty">Partie introuvable.</p></section>';
  var emS = (g.emotes || []).filter(function (e) {
      return e.by === "me";
    }).length,
    emR = (g.emotes || []).length - emS;
  var emChip = (g.emotes || []).length
    ? '<span class="chip" title="Emotes pendant la partie">💬 Toi ' +
      emS +
      " · " +
      esc(g.opponent) +
      " " +
      emR +
      "</span>"
    : "";
  var head =
    '<div class="head" style="margin-bottom:6px">' +
    back +
    emChip +
    (g.events ? '<button class="btn sm" data-scroll="ardoise-finale">🧾 Ardoise finale</button>' : "") +
    '<span class="sub">' +
    dshort(Date.parse(g.date)) +
    " · " +
    hhmm(Date.parse(g.date)) +
    " · " +
    (g.mode === "ranked"
      ? '<span class="chip r">Ranked</span>'
      : g.mode === "open"
        ? '<span class="chip o">Amis</span>'
        : "") +
    "</span></div>";
  if (!g.events || !g.events.length)
    return (
      '<section class="card">' +
      head +
      "<p class=\"note\">Partie lue sur l'ardoise : la relecture coup par coup n'est pas disponible pour elle.</p>" +
      slateHTML(g) +
      "</section>"
    );
  var st =
    S.steps && S.stepsFor === g.id
      ? S.steps
      : ((S.steps = buildSteps(g)), (S.stepsFor = g.id), (S.step = 0), S.steps);
  if (S.gotoN != null) {
    var at = st.findIndex(function (y) {
      return y.n === S.gotoN && y.type !== "keep";
    });
    if (at < 0)
      at = st.findIndex(function (y) {
        return y.n >= S.gotoN;
      });
    if (at >= 0) S.step = at;
    S.gotoN = null;
  }
  return (
    '<section class="card replay" id="replay">' +
    head +
    '<div id="rp">' +
    replayInner(g, st) +
    "</div></section>" +
    '<section class="card" id="ardoise-finale"><h2>Ardoise finale</h2>' +
    slateHTML(g) +
    (on("partage")
      ? '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn gold" data-share-img="' +
        esc(g.id) +
        '">🖼️ Image de l\'ardoise</button><button class="btn" data-share-txt="' +
        esc(g.id) +
        '">📋 Copier le résumé</button></div>'
      : "") +
    cardsHTML(g) +
    "</section>"
  );
}
function replayInner(g, st) {
  var i = Math.max(0, Math.min(S.step, st.length - 1)),
    x = st[i];
  var pbox = function (who) {
    var me = who === "me",
      sc = me ? x.my : x.opp,
      act = x.who === who;
    return (
      '<div class="pbox' +
      (act ? " act" : "") +
      (me ? "" : " opp") +
      '"><div class="pn">' +
      (me ? "Toi" : esc(g.opponent)) +
      (g.starter === who ? ' <span title="Joue à domicile, commence">🎲</span>' : "") +
      '</div><div class="ps mono">' +
      fmt(sc) +
      ' <span class="sub">/ 4 000</span></div><div class="pbar"><i style="width:' +
      Math.min(100, (sc / TARGET) * 100) +
      '%"></i></div>' +
      (act
        ? '<div class="ptp mono">' +
          (x.type === "farkle"
            ? '<span class="l">Farkle −' + fmt(x.lost) + "</span>"
            : "en jeu : " + fmt(x.tp)) +
          "</div>"
        : '<div class="ptp">&nbsp;</div>') +
      "</div>"
    );
  };
  // Choix : les dés gardés s'allument un par un, puis le commentaire apparaît.
  var nSel = x.selMask ? x.selMask.filter(Boolean).length : 0,
    ord = 0;
  var thrown = x.vals
    .map(function (v, k) {
      if (x.selMask) return x.selMask[k] ? die(v, "sel seq", k, ord++) : die(v, "dim seq", k, nSel);
      return die(v, (x.type === "farkle" ? "dead " : "") + "roll", k);
    })
    .join("");
  var late = x.selMask ? ' late" style="--d:' + (nSel * 450 + 350) + "ms" : "";
  var keptBefore =
    x.type === "keep" || x.type === "bank" ? x.kept.slice(0, x.kept.length - x.selVals.length) : x.kept;
  var kept = keptBefore.length
    ? '<div class="kept"><span class="sub">Déjà gardés</span>' +
      keptBefore
        .map(function (v) {
          return die(v, "mini");
        })
        .join("") +
      "</div>"
    : "";
  var em = "";
  var badge =
    x.type === "farkle"
      ? '<span class="tag bad">Farkle !</span>'
      : x.hot
        ? '<span class="tag hot">✦ Hot dice</span>'
        : x.type === "bank"
          ? '<span class="tag ok">Encaissé</span>'
          : "";
  var h =
    '<div class="players">' +
    pbox("me") +
    '<div class="vs"><span class="sub">coup</span>' +
    (i + 1) +
    '<span class="sub">sur ' +
    st.length +
    "</span></div>" +
    pbox("opp") +
    "</div>";
  h +=
    '<div class="mat"><div class="mt"><span>' +
    turnLabel(x.who, x.turn, g) +
    "</span>" +
    badge +
    em +
    '</div><div class="dice">' +
    thrown +
    "</div>" +
    kept +
    emoteBanner(x, g) +
    '<div class="cap' +
    late +
    '">' +
    stepText(x, g) +
    "</div></div>";
  var vd = verdict(x, g);
  if (vd && late)
    vd = vd.replace('class="verdict ', 'style="--d:' + (nSel * 450 + 650) + 'ms" class="late verdict ');
  h +=
    vd ||
    (x.who === "opp" && (x.type === "keep" || x.type === "bank")
      ? '<div class="verdict neutral"><span>Décision de l\'adversaire (analyse désactivée).</span></div>'
      : '<div class="verdict neutral"><span>' +
        (x.type === "farkle"
          ? "Aucun dé ne marque : les points du tour sont perdus."
          : "Le choix arrive à l'étape suivante.") +
        "</span></div>");
  h +=
    '<div class="ctrl"><button class="btn" data-rp="first" aria-label="Début">⏮</button><button class="btn" data-rp="prev" aria-label="Coup précédent">◀</button><button class="btn gold" data-rp="play" aria-label="Lecture">' +
    (S.playing ? "⏸ Pause" : "▶ Lecture") +
    '</button><button class="btn" data-rp="next" aria-label="Coup suivant">▶</button><button class="btn" data-rp="last" aria-label="Fin">⏭</button>' +
    '<input type="range" id="rpRange" min="0" max="' +
    (st.length - 1) +
    '" value="' +
    i +
    '" aria-label="Position dans la partie"></div><p class="sub" style="text-align:center;margin:4px 0 0">Flèches ← → du clavier pour avancer coup par coup.</p>';
  // Liste des coups, groupée par tour
  var list = "",
    curT = null;
  st.forEach(function (y, k) {
    var key = y.who + y.turn;
    if (key !== curT) {
      curT = key;
      list += '<div class="mvh">' + turnLabel(y.who, y.turn, g) + "</div>";
    }
    var mark =
      y.cost != null && y.d && on(y.who === "me" ? "coachDerniere" : "analyseAdversaire")
        ? y.cost === 0
          ? '<span class="w">✓</span>'
          : '<span class="l">✗</span>'
        : y.type === "farkle"
          ? '<span class="l">F</span>'
          : "";
    list +=
      '<button class="mv' +
      (k === i ? " cur" : "") +
      (y.who === "me" ? "" : " op") +
      '" data-go="' +
      k +
      '">' +
      mark +
      " " +
      esc(stepShort(y)) +
      (y.emotes
        ? ' <span class="mvem" title="Emote">💬' +
          (y.emotes.length > 1 ? "×" + y.emotes.length : "") +
          "</span>"
        : "") +
      "</button>";
  });
  return '<div class="rpgrid"><div>' + h + '</div><div class="moves" id="moves">' + list + "</div></div>";
}
function goStep(k) {
  var g = S.games.find(function (x) {
    return x.id.replace(/^cdp-/, "") === S.view;
  });
  if (!g || !S.steps) return;
  S.step = Math.max(0, Math.min(S.steps.length - 1, k));
  var rp = $("rp");
  if (!rp) {
    render();
    return;
  }
  rp.innerHTML = replayInner(g, S.steps);
  var cur = rp.querySelector(".mv.cur"),
    mv = $("moves");
  if (cur && mv) mv.scrollTop = cur.offsetTop - mv.offsetTop - 80;
  if (S.step >= S.steps.length - 1 && S.playing && !S.timer) stopPlay();
}
function stopPlay() {
  if (S.timer) {
    clearTimeout(S.timer);
    S.timer = null;
  }
  if (S.playing) {
    S.playing = false;
    var b = document.querySelector('[data-rp="play"]');
    if (b) b.textContent = "▶ Lecture";
  }
}
// Une emote envoyée pendant ce coup : qui, laquelle, et à quel moment de la partie.
function emoteText(e, g) {
  var nm = esc(g.opponent),
    who = e.by === "me" ? "Tu envoies" : nm + " envoie",
    which = e.i == null ? "une emote" : "l'emote n° " + e.i,
    a = e.after,
    when = "";
  if (a) {
    var self = a.by === e.by,
      whose = a.by === "me" ? "ton " : "le ",
      of = a.by === "me" ? "" : " de " + nm;
    if (a.kind === "farkle")
      when = self ? " juste après son propre farkle" : " juste après " + whose + "farkle" + of;
    else if (a.kind === "bank")
      when = self
        ? " juste après avoir encaissé"
        : " juste après " + (a.by === "me" ? "ton encaissement" : "l'encaissement de " + nm);
    else when = a.by === "me" ? " pendant ton tour" : self ? " pendant son tour" : " pendant le tour de " + nm;
    if (self && a.by === "me") when = when.replace("son propre", "ton propre");
  }
  return who + " " + which + when + ".";
}
function emoteBanner(x, g) {
  if (!x.emotes || !x.emotes.length) return "";
  return x.emotes
    .map(function (e) {
      return (
        '<div class="emoteb' +
        (e.by === "me" ? " me" : "") +
        '"><span class="ic">💬</span><span>' +
        emoteText(e, g) +
        "</span></div>"
      );
    })
    .join("");
}
function stepDuration(x) {
  if (!x) return 1500;
  if (x.emotes) return stepDurationBase(x) + 1600; // le temps de lire le bandeau
  return stepDurationBase(x);
}
function stepDurationBase(x) {
  if (x.type === "throw") return 1300 + x.vals.length * 90;
  if (x.type === "farkle") return 2600;
  var nSel = x.selMask ? x.selMask.filter(Boolean).length : 1,
    commented = x.d && on(x.who === "me" ? "coachDerniere" : "analyseAdversaire");
  return 900 + nSel * 450 + (commented ? 2800 : 1400) + (commented && x.cost > 0 ? 1500 : 0);
}
function scheduleNext() {
  S.timer = setTimeout(function () {
    if (!S.playing) return;
    if (S.step >= S.steps.length - 1) {
      stopPlay();
      return;
    }
    goStep(S.step + 1);
    scheduleNext();
  }, stepDuration(S.steps[S.step]));
}
function togglePlay() {
  if (S.playing) {
    stopPlay();
    return;
  }
  if (S.step >= S.steps.length - 1) S.step = 0;
  S.playing = true;
  goStep(S.step);
  scheduleNext();
}
