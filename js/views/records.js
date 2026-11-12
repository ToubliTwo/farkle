// Farkle Stats ChatDeck · Records personnels et du site.
"use strict";

// ---------- Records ----------
function renderRecords() {
  if (!on("records")) return off("records");
  var G = S.games.filter(function (g) {
    return g.turnLog && g.turnLog.length;
  });
  if (!G.length) return '<section class="card"><p class="empty">Aucune partie capturée.</p></section>';
  function best(f, cmp) {
    var b = null;
    G.forEach(function (g) {
      var v = f(g);
      if (v != null && (b == null || cmp(v, b.v))) b = { g: g, v: v };
    });
    return b;
  }
  var gt = function (a, b) {
      return a > b;
    },
    lt = function (a, b) {
      return a < b;
    };
  var wins = function (f) {
    return function (g) {
      return g.result === "win" && !g.abandon ? f(g) : null;
    };
  };
  var R = [
    [
      "Meilleur tour",
      best(function (g) {
        return g.bestTurn;
      }, gt),
      function (v) {
        return '<span class="w">+' + fmt(v) + "</span>";
      },
      "best"
    ],
    [
      "Plus grosse perte",
      best(function (g) {
        return g.worstLoss || null;
      }, gt),
      function (v) {
        return '<span class="l">−' + fmt(v) + "</span>";
      },
      "worst"
    ],
    [
      "Plus longue chaîne de Hot dice",
      best(function (g) {
        return g.maxHotChain || null;
      }, gt),
      function (v) {
        return v + " ✦ dans un tour";
      },
      "hot"
    ],
    [
      "Plus grosse remontée",
      best(
        wins(function (g) {
          return g.maxDeficit || null;
        }),
        gt
      ),
      function (v) {
        return "mené de " + fmt(v);
      }
    ],
    [
      "Victoire la plus rapide",
      best(
        wins(function (g) {
          return (g.turnLog || []).length;
        }),
        lt
      ),
      function (v) {
        return v + " tours";
      }
    ],
    [
      "Plus large victoire",
      best(
        wins(function (g) {
          return g.myScore - g.oppScore;
        }),
        gt
      ),
      function (v) {
        return "+" + fmt(v);
      }
    ],
    [
      "Plus de farkles en une partie",
      best(function (g) {
        return g.farkles;
      }, gt),
      function (v) {
        return v + " farkles";
      }
    ],
    [
      "Relances à 1 dé réussies",
      best(function (g) {
        return g.maxOneDie || null;
      }, gt),
      function (v) {
        return v + " dans un tour";
      },
      "one"
    ],
    [
      "Partie la plus chanceuse",
      best(function (g) {
        return g.luck;
      }, gt),
      function (v) {
        return '<span class="w">' + sgn(v, 1) + "</span> farkle";
      }
    ],
    [
      "Partie la plus maudite",
      best(function (g) {
        return g.luck;
      }, lt),
      function (v) {
        return '<span class="l">' + sgn(v, 1) + "</span> farkle";
      }
    ]
  ];
  // Lancer le plus rare
  var rare = null,
    order = [
      ["six1", "six 1"],
      ["six", "six identiques"],
      ["five", "cinq identiques"],
      ["s16", "suite 1 à 6"],
      ["four", "quatre identiques"],
      ["s26", "suite 2 à 6"],
      ["s15", "suite 1 à 5"],
      ["three", "brelan"]
    ];
  G.forEach(function (g) {
    (g.rolls || []).forEach(function (r) {
      if (!r.v) return;
      var c = combos(r.v);
      order.forEach(function (o, i) {
        if (c[o[0]] && (!rare || i < rare.i)) rare = { i: i, g: g, v: r.v, lab: o[1], n: r.n, en: r.en };
      });
    });
  });
  var boxes = R.filter(function (r) {
      return r[1];
    }),
    nRec = S.more.rec ? 1e9 : lim(6, 99),
    restRec = Math.max(0, boxes.length + (rare ? 1 : 0) - nRec);
  var h =
    '<section class="card"><h2>Records des parties capturées</h2><div class="grid2">' +
    boxes
      .slice(0, nRec)
      .map(function (r) {
        return r[1]
          ? recBox(
              r[0],
              r[2](r[1].v),
              "contre " + esc(r[1].g.opponent) + " · " + dshort(Date.parse(r[1].g.date)),
              r[1].g,
              r[3] && r[1].g.marks ? r[1].g.marks[r[3]] : null
            )
          : "";
      })
      .join("") +
    (rare
      ? recBox(
          "Lancer le plus rare",
          rare.lab,
          rare.v.join(" · ") +
            " · probabilité " +
            pct(COMBO[rare.n] && COMBO[rare.n][order[rare.i][0]], 2) +
            " à " +
            rare.n +
            " dés",
          rare.g,
          rare.en
        )
      : ""
    ).replace(/^[\s\S]*$/, function (x) {
      return boxes.length < nRec ? x : "";
    }) +
    "</div>" +
    (S.more.rec ? lessBtn("rec") : moreBtn("rec", restRec, "Voir tous les records")) +
    '<p class="note">Calculés sur les ' +
    G.length +
    " parties capturées. En natif, sur toutes les parties de la saison.</p></section>";
  return h;
}
function combos(v) {
  var c = {};
  v.forEach(function (x) {
    c[x] = (c[x] || 0) + 1;
  });
  var mx = 0;
  Object.keys(c).forEach(function (k) {
    mx = Math.max(mx, c[k]);
  });
  var has = function (a) {
    return a.every(function (x) {
      return c[x];
    });
  };
  return {
    six1: mx === 6 && c[1] === 6,
    six: mx >= 6,
    five: mx === 5,
    four: mx === 4,
    three: mx === 3,
    s16: v.length === 6 && has([1, 2, 3, 4, 5, 6]),
    s15: has([1, 2, 3, 4, 5]),
    s26: has([2, 3, 4, 5, 6])
  };
}
