// Farkle Stats ChatDeck · Mon jeu : décisions, tours, situations de jeu.
"use strict";

// ---------- Analyse ----------
function full(g) {
  return Array.isArray(g.rolls) && g.rolls.length;
}
function anaGames() {
  return S.games.filter(function (g) {
    return S.anaMode === "all" || g.mode === S.anaMode;
  });
}
function renderAna() {
  var G = anaGames(),
    F = G.filter(full),
    P = G.filter(function (g) {
      return !g.abandon;
    });
  var h = '<section class="card"><h2>Résumé</h2>';
  if (!G.length) return h + '<p class="empty">Aucune partie capturée pour ce filtre.</p></section>';
  var w = G.filter(function (g) {
      return g.result === "win";
    }).length,
    T = [],
    OT = [],
    RR = [];
  F.forEach(function (g) {
    if (!g.abandon) {
      T = T.concat(g.turnLog || []);
      OT = OT.concat(g.oppTurnLog || []);
    }
    RR = RR.concat(g.rolls || []);
  });
  var avgT = function (L) {
    return L.length
      ? L.reduce(function (s, t) {
          return s + (t.bust ? 0 : t.pts);
        }, 0) / L.length
      : null;
  };
  var rpt = {};
  F.forEach(function (g) {
    (g.rolls || []).forEach(function (r) {
      var k = g.id + ":" + r.ti;
      rpt[k] = (rpt[k] || 0) + 1;
    });
  });
  var rk = Object.keys(rpt);
  h +=
    '<div class="tiles">' +
    tile(
      "Parties",
      G.length,
      F.length +
        " détaillées" +
        (function (n) {
          return n ? " · " + n + " abandon" + (n > 1 ? "s" : "") : "";
        })(
          G.filter(function (g) {
            return g.abandon;
          }).length
        )
    ) +
    tile("Victoires", pct(w / G.length), w + " V · " + (G.length - w) + " D") +
    tile("Points par tour", fmt(avgT(T)), "adversaires : " + fmt(avgT(OT))) +
    tile(
      "Lancers par tour",
      fmt(
        rk.length
          ? rk.reduce(function (s, k) {
              return s + rpt[k];
            }, 0) / rk.length
          : null,
        1
      ),
      "tours perdus : " +
        pct(
          T.length
            ? T.filter(function (t) {
                return t.bust;
              }).length / T.length
            : null
        )
    ) +
    "</div>" +
    '<div class="tiles" style="margin-top:10px">' +
    tile(
      "Farkles / partie",
      fmt(
        P.reduce(function (s, g) {
          return s + (g.farkles || 0);
        }, 0) / (P.length || 1),
        1
      ),
      "adversaires : " +
        fmt(
          P.reduce(function (s, g) {
            return s + (g.oppFarkles || 0);
          }, 0) / (P.length || 1),
          1
        )
    ) +
    tile(
      "Perdus / partie",
      fmt(
        P.reduce(function (s, g) {
          return s + (g.lostPoints || 0);
        }, 0) / (P.length || 1)
      ),
      "adversaires : " +
        fmt(
          P.reduce(function (s, g) {
            return s + (g.oppLost || 0);
          }, 0) / (P.length || 1)
        )
    ) +
    tile(
      "Hot dice / partie",
      fmt(
        P.reduce(function (s, g) {
          return s + (g.hotDice || 0);
        }, 0) / (P.length || 1),
        1
      ),
      "adversaires : " +
        fmt(
          P.reduce(function (s, g) {
            return s + (g.oppHot || 0);
          }, 0) / (P.length || 1),
          1
        )
    ) +
    tile(
      "Manches par partie",
      fmt(
        P.reduce(function (s, g) {
          return s + (g.manches || 0);
        }, 0) / (P.length || 1),
        1
      ),
      ""
    ) +
    "</div>" +
    (G.length < 20
      ? '<p class="note">Échantillon de ' +
        G.length +
        " partie(s) : les tendances deviennent fiables vers 20 à 30 parties.</p>"
      : "") +
    "</section>";

  // Dernière partie coup par coup
  var lastF = F[F.length - 1];
  if (lastF && lastF.events)
    h +=
      '<a class="card prow lastcard" href="#partie-' +
      esc(lastF.id.replace("cdp-", "")) +
      '"><span class="sub">Ta dernière partie</span><div class="lrow">' +
      gameRow(lastF) +
      '</div><span class="btn gold">▶ Revoir la partie coup par coup</span></a>';

  // Bilan des décisions
  var Dc = [];
  F.forEach(function (g) {
    (g.decisions || []).forEach(function (d) {
      Dc.push(Object.assign({ g: g, cost: decCost(d) }, d));
    });
  });
  if (on("bilanContinu")) {
    h +=
      '<section class="card"><h2>Bilan de tes décisions</h2><p class="sub">Chaque choix (relancer ou encaisser) est jugé sur tes chances de gagner la partie, selon les deux scores, les points en jeu et les dés restants. Le coût estimé, c\'est le nombre de victoires perdues en moyenne.</p>';
    if (!Dc.length) h += '<p class="empty">Aucune décision capturée.</p>';
    else {
      var dev = Dc.filter(function (d) {
          return d.cost > 0;
        }),
        greedy = dev.filter(function (d) {
          return d.act === "roll";
        });
      h +=
        '<div class="tiles">' +
        tile(
          "Décisions justes",
          pct(1 - dev.length / Dc.length),
          Dc.length - dev.length + " / " + Dc.length
        ) +
        tile("Trop gourmand", greedy.length, "relances de trop") +
        tile("Trop prudent", dev.length - greedy.length, "encaissé trop tôt") +
        (function (v) {
          return tile(
            "Coût estimé",
            "−" + fmt(v, 1),
            "victoire" + (v >= 2 ? "s" : "") + " sur " + F.length + " partie" + (F.length > 1 ? "s" : "")
          );
        })(
          dev.reduce(function (s, d) {
            return s + d.cost;
          }, 0) / 100
        ) +
        "</div>";
      var per = F.filter(function (g) {
        return (g.decisions || []).length;
      }).map(function (g) {
        var L = g.decisions,
          ok = L.filter(function (d) {
            return decCost(d) === 0;
          }).length;
        return { y: Math.round((ok / L.length) * 100), lab: dshort(Date.parse(g.date)) };
      });
      if (per.length > 1)
        h +=
          "<h3>Décisions justes, partie par partie</h3>" +
          lineChart(per, {
            min: 0,
            max: 100,
            step: 25,
            h: 180,
            id: "c",
            color: "#33c46a",
            fmt: function (v) {
              return v + "%";
            },
            label: "Décisions justes par partie"
          });
      h += '<h3>Ton profil selon les dés restants</h3><div class="mrows">';
      for (var n = 6; n >= 1; n--) {
        var L = Dc.filter(function (d) {
          return d.left === n;
        });
        if (!L.length) continue;
        var g1 = L.filter(function (d) {
            return d.cost > 0 && d.act === "roll";
          }).length,
          p1 = L.filter(function (d) {
            return d.cost > 0 && d.act === "bank";
          }).length,
          ok1 = L.length - g1 - p1;
        var errR = (g1 + p1) / L.length;
        var tag =
          errR < 0.1
            ? '<span class="chip good">équilibré</span>'
            : g1 >= p1
              ? '<span class="chip bad">plutôt gourmand</span>'
              : '<span class="chip blue">plutôt prudent</span>';
        h +=
          '<div class="mrow"><div class="top">' +
          diceIcons(n) +
          '<span class="ttl">' +
          n +
          (n > 1 ? " dés restants" : " dé restant") +
          "<small>" +
          L.length +
          " décision" +
          (L.length > 1 ? "s" : "") +
          "</small></span>" +
          tag +
          "</div>" +
          '<div class="stack"><i style="flex:' +
          ok1 +
          ';background:var(--win)"></i><i style="flex:' +
          g1 +
          ';background:var(--loss)"></i><i style="flex:' +
          p1 +
          ';background:var(--blue)"></i></div>' +
          '<div class="leg"><span><i class="dot" style="background:var(--win)"></i>Justes <b>' +
          ok1 +
          "</b></span>" +
          (g1
            ? '<span><i class="dot" style="background:var(--loss)"></i>Trop gourmand <b>' + g1 + "</b></span>"
            : "") +
          (p1
            ? '<span><i class="dot" style="background:var(--blue)"></i>Trop prudent <b>' + p1 + "</b></span>"
            : "") +
          "</div>" +
          (on("seuilsChiffres")
            ? (function (t) {
                return (
                  '<div class="seuil">🎯 À 0–0 : ' +
                  (t == null
                    ? ""
                    : isFinite(t)
                      ? "encaisse dès <b>" + fmt(t) + "</b> points"
                      : "<b>relance toujours</b>") +
                  "</div>"
                );
              })(WP.seuil(0, 0, n))
            : "") +
          "</div>";
      }
      h += "</div>";
      var top = dev
        .slice()
        .sort(function (a, b) {
          return b.cost - a.cost;
        })
        .slice(0, 3);
      if (on("seuilsChiffres")) h += seuilCalc();
      if (top.length)
        h +=
          '<h3>Tes 3 décisions les plus coûteuses</h3><div class="coach">' +
          top
            .map(function (d) {
              return (
                '<a class="cl" href="#partie-' +
                esc(d.g.id.replace("cdp-", "")) +
                '" style="color:inherit"><span class="grow" style="min-width:0"><span class="ell">' +
                (d.act === "roll" ? "Relancé à " : "Encaissé à ") +
                fmt(d.pts) +
                " avec " +
                d.left +
                " dé" +
                (d.left > 1 ? "s" : "") +
                '</span><span class="sub ell" style="font-size:12.5px">' +
                esc(d.g.opponent) +
                " · " +
                dshort(Date.parse(d.g.date)) +
                " · " +
                fmt(d.my) +
                "–" +
                fmt(d.opp) +
                "</span>" +
                (function (e) {
                  if (!e) return "";
                  var mine = d.act === "bank" ? e.bank : e.roll,
                    oth = d.act === "bank" ? e.roll : e.bank;
                  return (
                    '<span class="sub ell" style="font-size:12.5px">Victoire : toi ' +
                    pct(mine) +
                    " · " +
                    (d.act === "bank" ? "relancer " : "encaisser ") +
                    pct(oth) +
                    "</span>"
                  );
                })(decWP(d)) +
                '</span><span class="ko">−' +
                pp(d.cost) +
                "</span></a>"
              );
            })
            .join("") +
          "</div>" +
          (function (d) {
            var e = decWP(d);
            if (!e) return "";
            var best = Math.max(e.bank, e.roll),
              mine = d.act === "bank" ? e.bank : e.roll;
            return (
              "<p class=\"note\">Le chiffre rouge, c'est ce que le choix t'a coûté en chances de gagner la partie. Pour la première : " +
              pct(best) +
              " avec le meilleur choix, " +
              pct(mine) +
              " avec le tien, soit −" +
              pp(d.cost) +
              ". Sur 100 parties jouées dans cette situation, ça fait environ " +
              fmt(Math.max(1, Math.round(d.cost))) +
              " défaite" +
              (Math.round(d.cost) > 1 ? "s" : "") +
              " de plus.</p>"
            );
          })(top[0]);
    }
    h += "</section>";
  }

  // Tours
  if (T.length) {
    var bk = [
      [0, 300],
      [300, 500],
      [500, 750],
      [750, 1000],
      [1000, 1500],
      [1500, 1e9]
    ];
    var it = bk.map(function (b) {
      var L = T.filter(function (t) {
        return !t.bust && t.pts >= b[0] && t.pts < b[1];
      });
      return {
        lab: b[1] < 1e9 ? kfmt(b[0]) : kfmt(b[0]) + "+",
        n: L.length,
        r: L.length / T.length,
        sub: "" + L.length
      };
    });
    it.unshift({
      lab: "Farkle",
      n: T.filter(function (t) {
        return t.bust;
      }).length,
      r:
        T.filter(function (t) {
          return t.bust;
        }).length / T.length,
      sub:
        "" +
        T.filter(function (t) {
          return t.bust;
        }).length
    });
    h +=
      '<section class="card"><h2>Tes tours</h2><p class="sub">Points encaissés par tour : chaque tranche part du seuil indiqué (300 = 300 à 450).</p>' +
      bars(
        it,
        function (r) {
          return pct(r);
        },
        "tours"
      ) +
      "</section>";
  }

  // Situation
  var cap = G.filter(function (x) {
    return x.starter;
  });
  if (cap.length) {
    var NT = cap.length;
    var srow = function (lab, L) {
      var v = L.filter(function (x) {
        return x.result === "win";
      }).length;
      return (
        "<tr><th>" +
        lab +
        '</th><td class="n">' +
        L.length +
        " / " +
        NT +
        '</td><td class="n">' +
        v +
        " / " +
        NT +
        '</td><td class="n">' +
        (L.length ? pct(v / L.length) : "–") +
        "</td></tr>"
      );
    };
    var withP = G.filter(function (x) {
        return x.winProb != null;
      }),
      expW = withP.reduce(function (s, x) {
        return s + x.winProb;
      }, 0),
      realW = withP.filter(function (x) {
        return x.result === "win";
      }).length;
    var E = [];
    G.forEach(function (x) {
      if (Array.isArray(x.emotes)) E = E.concat(x.emotes);
    });
    var dW = realW - expW,
      emS = E.filter(function (e) {
        return e.by === "me";
      }).length,
      emR = E.filter(function (e) {
        return e.by === "opp";
      }).length,
      emF = E.filter(function (e) {
        return e.by === "opp" && e.after && e.after.by === "me" && e.after.kind === "farkle";
      }).length;
    h +=
      '<section class="card"><h2>Situation de jeu</h2><p class="sub">Ton taux de victoire selon la situation, sur tes ' +
      NT +
      ' parties. Le trait marque 50 %.</p><div class="mrows">' +
      situRow(
        "Tu commences",
        cap.filter(function (x) {
          return x.starter === "me";
        }),
        NT
      ) +
      situRow(
        "L'adversaire commence",
        cap.filter(function (x) {
          return x.starter === "opp";
        }),
        NT
      ) +
      situRow(
        "Mené de 1 000 ou plus",
        cap.filter(function (x) {
          return (x.maxDeficit || 0) >= 1000;
        }),
        NT
      ) +
      situRow(
        "En tête de 1 000 ou plus",
        cap.filter(function (x) {
          return (x.maxLead || 0) >= 1000;
        }),
        NT
      ) +
      "</div>" +
      '<div class="tiles" style="margin-top:10px">' +
      tile(
        "Victoires Ranked",
        withP.length ? realW + ' <span class="sub">/ ' + withP.length + "</span>" : "–",
        withP.length
          ? "attendues : " +
              fmt(expW, 1) +
              ' · <span class="' +
              (dW >= 0 ? "w" : "l") +
              '">' +
              sgn(dW, 1) +
              "</span>"
          : ""
      ) +
      tile(
        "Emotes envoyées",
        emS,
        emR + " reçues" + (emF ? " · " + emF + " moqueuse" + (emF > 1 ? "s" : "") : "")
      ) +
      "</div>" +
      "<p class=\"note\">La partie s'arrête dès qu'un joueur atteint 4 000, sans dernier tour pour l'autre. « Attendues » : probabilité affichée par ChatDeck avant chaque partie Ranked.</p></section>";
  }

  // Ranked vs Amis
  if (S.anaMode === "all") {
    var by = function (m) {
        return S.games.filter(function (g) {
          return g.mode === m;
        });
      },
      rk2 = by("ranked"),
      op2 = by("open");
    if (rk2.length && op2.length) {
      var stat = function (L) {
        var D2 = [];
        L.filter(full).forEach(function (g) {
          D2 = D2.concat(g.decisions || []);
        });
        var bkd = D2.filter(function (d) {
            return d.act === "bank";
          }),
          T2 = [];
        L.filter(full).forEach(function (g) {
          T2 = T2.concat(g.turnLog || []);
        });
        var wr =
            L.filter(function (g) {
              return g.result === "win";
            }).length / L.length,
          fk =
            L.reduce(function (s, g) {
              return s + (g.farkles || 0);
            }, 0) / L.length;
        var dj = D2.length
            ? D2.filter(function (d) {
                return decCost(d) === 0;
              }).length / D2.length
            : null,
          mb = bkd.length
            ? bkd.reduce(function (s, d) {
                return s + d.pts;
              }, 0) / bkd.length
            : null,
          pt = avgT(T2);
        return [
          { raw: L.length, txt: L.length },
          { raw: wr, txt: pct(wr) },
          { raw: fk, txt: fmt(fk, 1) },
          { raw: dj, txt: dj == null ? "–" : pct(dj) },
          { raw: mb, txt: fmt(mb) },
          { raw: pt, txt: fmt(pt) }
        ];
      };
      var a1 = stat(rk2),
        a2 = stat(op2),
        up = function (a, b) {
          return a == null || b == null ? 0 : a > b ? 1 : a < b ? -1 : 0;
        },
        down = function (a, b) {
          return -up(a, b);
        };
      var rows = [
        ["Parties", null],
        ["Victoires", up],
        ["Farkles par partie", down],
        ["Décisions justes", up],
        ["Moy. encaissée", null],
        ["Points par tour", up]
      ];
      h +=
        '<section class="card"><h2>Ranked ou entre amis</h2><div class="srows"><div class="srow hd"><span class="sl"></span><span class="sv r"><span class="chip r">Ranked</span></span><span class="sv o"><span class="chip o">Amis</span></span></div>' +
        rows
          .map(function (r, i) {
            return splitRow(r[0], a1[i], a2[i], r[1]);
          })
          .join("") +
        '</div><p class="note">En surbrillance : le meilleur des deux.</p></section>';
    }
  }
  return h;
}
