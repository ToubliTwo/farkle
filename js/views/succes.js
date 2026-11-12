// Farkle Stats ChatDeck · Trophées : catalogue de succès.
"use strict";

// ---------- Succès ----------
function achievements() {
  var G = S.games,
    c = S.site ? siteCalc() : null;
  var rolls = function (g) {
      return g.rolls || [];
    },
    anyRoll = function (g, f) {
      return rolls(g).some(function (r) {
        return r.v && f(r);
      });
    };
  var W = function (g) {
    return g.result === "win" && !g.abandon;
  };
  var rollAt = function (f) {
    return function (g) {
      var r = rolls(g).find(function (r) {
        return r.v && f(r);
      });
      return r ? r.en : null;
    };
  };
  var markAt = function (k) {
    return function (g) {
      return g.marks ? g.marks[k] : null;
    };
  };
  var A = [
    {
      tier: "site",
      nm: "Habitué",
      d: "Jouer 25 parties Ranked",
      prog: c ? [Math.min(c.n, 25), 25] : null,
      siteOnly: true
    },
    {
      tier: "site",
      nm: "Vétéran",
      d: "Gagner 50 parties Ranked",
      prog: c ? [Math.min(c.w, 50), 50] : null,
      siteOnly: true
    },
    {
      tier: "site",
      nm: "Centurion",
      d: "Gagner 100 parties Ranked",
      prog: c ? [Math.min(c.w, 100), 100] : null,
      siteOnly: true
    },
    {
      tier: "site",
      nm: "Éclair",
      d: "Atteindre 4 000 en 3 tours",
      test: function (g) {
        return W(g) && (g.turnLog || []).length <= 3;
      }
    },
    {
      tier: "site",
      nm: "Numéro 1",
      d: "Arriver à la première place du classement",
      prog: c ? [c.place.rank === 1 ? 1 : 0, 1] : null,
      siteOnly: true
    },
    {
      tier: "bronze",
      nm: "Premier Hot dice",
      d: "Faire marquer les six dés",
      test: function (g) {
        return (g.hotDice || 0) >= 1;
      },
      at: rollAt(function (r) {
        return r.n === 6 && !r.first;
      })
    },
    {
      tier: "bronze",
      nm: "Brelan d'as",
      d: "Trois 1 sur un même lancer",
      test: function (g) {
        return anyRoll(g, function (r) {
          return (
            r.v.filter(function (v) {
              return v === 1;
            }).length >= 3
          );
        });
      },
      at: rollAt(function (r) {
        return (
          r.v.filter(function (v) {
            return v === 1;
          }).length >= 3
        );
      })
    },
    {
      tier: "bronze",
      nm: "Pas de chance",
      d: "Farkle dès le premier lancer à 6 dés",
      test: function (g) {
        return anyRoll(g, function (r) {
          return r.first && r.n === 6 && r.f;
        });
      },
      at: rollAt(function (r) {
        return r.first && r.n === 6 && r.f;
      }),
      cosmetic: true
    },
    {
      tier: "bronze",
      nm: "Suite royale",
      d: "Suite 1 à 6 sur un lancer",
      test: function (g) {
        return anyRoll(g, function (r) {
          return combos(r.v).s16;
        });
      },
      at: rollAt(function (r) {
        return combos(r.v).s16;
      })
    },
    {
      tier: "argent",
      nm: "Sans faute",
      d: "Gagner sans aucun farkle",
      test: function (g) {
        return W(g) && g.farkles === 0;
      }
    },
    {
      tier: "argent",
      nm: "Imperturbable",
      d: "Gagner après avoir reçu 3 emotes",
      test: function (g) {
        return (
          W(g) &&
          (g.emotes || []).filter(function (e) {
            return e.by === "opp";
          }).length >= 3
        );
      }
    },
    {
      tier: "argent",
      nm: "Collectionneur",
      d: "Brelan, 4, 5 et 6 identiques, et les trois suites",
      collect: true
    },
    {
      tier: "argent",
      nm: "Globe-trotter",
      d: "Battre 25 adversaires différents en Ranked",
      prog: c
        ? [
            Math.min(
              25,
              Object.keys(
                c.D.filter(function (d) {
                  return d.won;
                }).reduce(function (m, d) {
                  m[d.o] = 1;
                  return m;
                }, {})
              ).length
            ),
            25
          ]
        : null,
      siteOnly: true
    },
    {
      tier: "or",
      nm: "Remontada",
      d: "Gagner après avoir été mené de 2 000",
      test: function (g) {
        return W(g) && (g.maxDeficit || 0) >= 2000;
      }
    },
    {
      tier: "or",
      nm: "Funambule",
      d: "Réussir 3 relances à 1 dé dans le même tour",
      test: function (g) {
        return (g.maxOneDie || 0) >= 3;
      },
      at: markAt("one")
    },
    {
      tier: "or",
      nm: "Double Hot dice",
      d: "Deux Hot dice dans le même tour",
      test: function (g) {
        return (g.maxHotChain || 0) >= 2;
      },
      at: markAt("hot")
    },
    {
      tier: "or",
      nm: "Miraculé",
      d: "Gagner malgré 5 farkles",
      test: function (g) {
        return W(g) && (g.farkles || 0) >= 5;
      }
    },
    {
      tier: "or",
      nm: "Tueur de géants",
      d: "Battre un joueur classé 100 points au-dessus",
      test: function (g) {
        return W(g) && g.elo != null && g.oppElo != null && g.oppElo - g.elo >= 100;
      }
    },
    {
      tier: "or",
      nm: "Inarrêtable",
      d: "10 victoires Ranked d'affilée",
      prog: c ? [Math.min(c.bestRun, 10), 10] : null,
      siteOnly: true
    },
    {
      tier: "epique",
      nm: "Tavernier",
      d: "4 000 points en un seul tour",
      test: function (g) {
        return (g.bestTurn || 0) >= 4000;
      },
      at: markAt("best")
    },
    {
      tier: "epique",
      nm: "Chirurgien",
      d: "Gagner en 2 tours",
      test: function (g) {
        return W(g) && (g.turnLog || []).length <= 2;
      }
    },
    {
      tier: "epique",
      nm: "Triple Hot dice",
      d: "Trois Hot dice dans le même tour",
      test: function (g) {
        return (g.maxHotChain || 0) >= 3;
      },
      at: markAt("hot")
    },
    {
      tier: "legendaire",
      nm: "Six identiques",
      d: "Six dés identiques sur un lancer (1 sur 7 776)",
      test: function (g) {
        return anyRoll(g, function (r) {
          return combos(r.v).six;
        });
      },
      at: rollAt(function (r) {
        return combos(r.v).six;
      })
    },
    {
      tier: "legendaire",
      nm: "Le Jackpot",
      d: "Six 1 sur un lancer : 8 000 points (1 sur 46 656)",
      test: function (g) {
        return anyRoll(g, function (r) {
          return combos(r.v).six1;
        });
      },
      at: rollAt(function (r) {
        return combos(r.v).six1;
      })
    },
    {
      tier: "legendaire",
      nm: "Zéro pointé",
      d: "Gagner alors que l'adversaire finit à 0",
      test: function (g) {
        return W(g) && g.oppScore === 0;
      }
    }
  ];
  var need = ["three", "four", "five", "six", "s15", "s26", "s16"];
  A.forEach(function (a) {
    if (a.siteOnly) {
      a.state = a.prog && a.prog[0] >= a.prog[1] ? "ranked" : "lock";
      return;
    }
    if (a.collect) {
      var got = {},
        gotR = {};
      G.forEach(function (g) {
        rolls(g).forEach(function (r) {
          if (!r.v) return;
          var cb = combos(r.v);
          need.forEach(function (k) {
            if (cb[k]) {
              got[k] = 1;
              if (g.mode === "ranked") gotR[k] = 1;
            }
          });
        });
      });
      a.prog = [Object.keys(gotR).length, need.length];
      a.progAll = Object.keys(got).length;
      a.state = a.prog[0] >= need.length ? "ranked" : a.progAll >= need.length ? "amis" : "lock";
      return;
    }
    var r = G.filter(function (g) {
        return g.mode === "ranked" && a.test(g);
      }),
      o = G.filter(function (g) {
        return g.mode !== "ranked" && a.test(g);
      });
    a.state = r.length ? "ranked" : o.length ? "amis" : "lock";
    a.game = r[0] || o[0];
    if (a.game && a.at) a.n = a.at(a.game);
  });
  return A;
}
function renderSucces() {
  if (!on("succes")) return off("succes");
  var A = achievements(),
    tiers = {
      site: "ChatDeck",
      bronze: "Bronze",
      argent: "Argent",
      or: "Or",
      epique: "Épique",
      legendaire: "Légendaire"
    };
  var got = A.filter(function (a) {
    return a.state === "ranked";
  }).length;
  var openA = A.filter(function (a) {
      return a.state !== "lock" || (a.prog && a.prog[0] > 0);
    }),
    lockA = A.filter(function (a) {
      return openA.indexOf(a) < 0;
    });
  var listA = S.more.ach ? openA.concat(lockA) : openA;
  return (
    '<section class="card"><div class="head"><h2>Succès</h2><span class="sub">' +
    got +
    " / " +
    A.length +
    ' obtenus en Ranked</span></div><div class="ach">' +
    listA
      .map(function (a) {
        var st =
          a.state === "ranked"
            ? '<span class="w">✓ Obtenu</span>'
            : a.state === "amis"
              ? '<span class="g">En Amis : ne compte pas</span>'
              : '<span class="sub">Verrouillé</span>';
        var pr = a.prog
          ? '<div class="prog"><i style="width:' +
            Math.min(100, (a.prog[0] / a.prog[1]) * 100) +
            '%"></i></div><span class="sub mono">' +
            a.prog[0] +
            " / " +
            a.prog[1] +
            (a.progAll != null && a.progAll > a.prog[0] ? " · " + a.progAll + " en comptant les Amis" : "") +
            "</span>"
          : "";
        return (
          '<div class="ac ' +
          (a.state === "lock" ? "lock" : "on") +
          '"><div class="t"><span class="nm">' +
          esc(a.nm) +
          '</span><span class="tier ' +
          a.tier +
          '">' +
          tiers[a.tier] +
          '</span></div><span class="sub">' +
          esc(a.d) +
          (a.cosmetic ? " · cosmétique" : "") +
          "</span>" +
          pr +
          '<span style="font-size:13px">' +
          st +
          (a.game && on("ardoises")
            ? ' · <a href="' + gameLink(a.game, a.n) + '">' + linkLabel(a.game, a.n) + "</a>"
            : "") +
          '</span><span class="sub" style="font-size:11.5px">Rareté : calculée par le serveur</span></div>'
        );
      })
      .join("") +
    "</div>" +
    (S.more.ach ? lessBtn("ach") : moreBtn("ach", lockA.length, "Voir les succès à débloquer")) +
    "<p class=\"note\">Garde-fous : comptés uniquement en Ranked ; les succès liés à des adversaires ne comptent qu'une fois par adversaire ; les succès de malchance ne donnent qu'une récompense cosmétique ; la rareté (« x % des joueurs ») est calculée côté serveur. Les 5 premiers existent déjà sur ChatDeck.</p></section>"
  );
}
