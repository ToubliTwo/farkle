// Farkle Stats ChatDeck · Mon jeu : chance aux dés, équité, chanceux et maudits.
"use strict";

// ---------- Chance ----------
function renderChance() {
  if (!on("chance")) return off("chance");
  var F = S.games.filter(function (g) {
    return full(g) && (S.anaMode === "all" || g.mode === S.anaMode);
  });
  var h = '<section class="card"><h2>Ta chance aux dés</h2>';
  if (!F.length) return h + '<p class="empty">Aucun lancer capturé.</p></section>';
  var R = [],
    OR = [];
  F.forEach(function (g) {
    R = R.concat(g.rolls);
    OR = OR.concat(g.oppRolls || []);
  });
  var me = expF(R) - actF(R),
    op = expF(OR) - actF(OR);
  h +=
    '<div class="tiles">' +
    tile(
      "Ton indice",
      '<span class="' + (me >= 0 ? "w" : "l") + '">' + sgn(me, 1) + "</span>",
      actF(R) + " pour " + fmt(expF(R), 1) + " prévus"
    ) +
    tile(
      "Tes adversaires",
      '<span class="b">' + sgn(op, 1) + "</span>",
      actF(OR) + " pour " + fmt(expF(OR), 1) + " prévus"
    ) +
    tile(
      "Bilan face à eux",
      '<span class="' + (me - op >= 0 ? "w" : "l") + '">' + sgn(me - op, 1) + "</span>",
      "farkles d'écart"
    ) +
    tile("Lancers observés", R.length, "adversaires : " + OR.length) +
    "</div>";
  if (R.length < 50)
    h +=
      '<p class="note">Moins de 50 lancers : l\'indice reste surtout du bruit. Il se stabilise avec quelques dizaines de parties.</p>';
  h +=
    '<h3>Farkle selon le nombre de dés lancés</h3><p class="sub">Barre pleine : toi · barre fine : tes adversaires · trait blanc : la théorie. Vert = moins de farkles que prévu.</p><div class="mrows">';
  for (var k = 6; k >= 1; k--) {
    var a = R.filter(function (r) {
        return r.n === k;
      }),
      o = OR.filter(function (r) {
        return r.n === k;
      });
    if (!a.length && !o.length) continue;
    h += farkleRow(
      k,
      a.length ? actF(a) / a.length : null,
      a.length,
      o.length ? actF(o) / o.length : null,
      o.length
    );
  }
  h += "</div>";
  // Combinaisons vs attendu
  var keys = [
    ["three", "Brelans"],
    ["four", "4 identiques"],
    ["five", "5 identiques"],
    ["six", "6 identiques"],
    ["s15", "Suite 1-5"],
    ["s26", "Suite 2-6"],
    ["s16", "Suite 1-6"]
  ];
  var cnt = {},
    ex = {};
  keys.forEach(function (x) {
    cnt[x[0]] = 0;
    ex[x[0]] = 0;
  });
  R.forEach(function (r) {
    if (!r.v) return;
    var c = combos(r.v);
    keys.forEach(function (x) {
      if (c[x[0]]) cnt[x[0]]++;
      ex[x[0]] += (COMBO[r.n] && COMBO[r.n][x[0]]) || 0;
    });
  });
  var FACES = {
    three: [4, 4, 4],
    four: [6, 6, 6, 6],
    five: [2, 2, 2, 2, 2],
    six: [1, 1, 1, 1, 1, 1],
    s15: [1, 2, 3, 4, 5],
    s26: [2, 3, 4, 5, 6],
    s16: [1, 2, 3, 4, 5, 6]
  };
  h +=
    '<h3>Tes combinaisons, comparées à l\'attendu</h3><p class="sub">Trait blanc : ce que la théorie prévoit pour tes lancers.</p><div class="mrows">' +
    (function () {
      var ks = keys.slice().sort(function (a, b) {
          return Math.abs(cnt[b[0]] - ex[b[0]]) - Math.abs(cnt[a[0]] - ex[a[0]]);
        }),
        nC = S.more.combo ? 99 : lim(3, 99);
      return (
        ks
          .slice(0, nC)
          .map(function (x) {
            return comboRow(x[1], FACES[x[0]], cnt[x[0]], ex[x[0]]);
          })
          .join("") +
        "</div>" +
        (S.more.combo ? lessBtn("combo") : moreBtn("combo", ks.length - nC, "Voir toutes les combinaisons"))
      );
    })();
  // Par partie
  h +=
    '<h3>Partie par partie</h3><p class="sub">Écart de chance avec ton adversaire, en farkles évités. Positif : les dés étaient pour toi.</p><div class="mrows">' +
    F.slice()
      .reverse()
      .slice(0, S.more.ppp ? 1e9 : lim(5, 10))
      .map(function (g) {
        var d = g.luck - g.oppLuck,
          w = g.result === "win";
        return (
          '<a class="mrow" style="color:inherit" href="' +
          gameLink(g) +
          '"><div class="top"><span class="res"><b class="' +
          (w ? "w" : "l") +
          '">' +
          (w ? "V" : "D") +
          '</b></span><span class="ttl">' +
          esc(g.opponent) +
          "<small>" +
          dshort(Date.parse(g.date)) +
          " · " +
          hhmm(Date.parse(g.date)) +
          " · " +
          fmt(g.myScore) +
          " – " +
          fmt(g.oppScore) +
          '</small></span><span class="big ' +
          (d >= 0 ? "w" : "l") +
          '">' +
          sgn(d, 1) +
          "</span></div>" +
          '<div class="leg"><span>Ta chance <b>' +
          sgn(g.luck, 1) +
          "</b></span><span>La sienne <b>" +
          sgn(g.oppLuck, 1) +
          "</b></span></div></a>"
        );
      })
      .join("") +
    "</div>" +
    (S.more.ppp ? lessBtn("ppp") : moreBtn("ppp", F.length - lim(5, 10), "Voir les autres parties"));
  h += "</section>";

  if (on("classementChance")) {
    var P = {};
    S.games.filter(full).forEach(function (g) {
      var add = function (name, R2) {
        var x = P[name] || (P[name] = { name: name, R: [] });
        x.R = x.R.concat(R2);
      };
      add("Toi", g.rolls);
      add(g.opponent, g.oppRolls || []);
    });
    var L = Object.keys(P)
      .map(function (k) {
        var x = P[k];
        x.idx = expF(x.R) - actF(x.R);
        x.rate = x.R.length ? (x.idx / x.R.length) * 100 : 0;
        return x;
      })
      .filter(function (x) {
        return x.R.length;
      })
      .sort(function (a, b) {
        return b.rate - a.rate;
      });
    h +=
      '<section class="card"><h2>Chanceux et Maudits</h2><p class="sub">Joueurs croisés, classés par farkles évités pour 100 lancers. En natif : tout le serveur, sur la saison.</p><div class="inner">' +
      L.map(function (x, i) {
        return (
          '<div class="row"><span class="mono sub" style="width:28px">' +
          (i + 1) +
          '</span><span class="grow" style="min-width:0"><span class="name ell">' +
          (i === 0 ? "🍀 " : i === L.length - 1 ? "🌧️ " : "") +
          esc(x.name) +
          "</span>" +
          (x.R.length < 50 ? '<span class="sub" style="font-size:12px">échantillon court</span>' : "") +
          '</span><span class="right"><span class="' +
          (x.rate >= 0 ? "w" : "l") +
          '" style="font-weight:700">' +
          sgn(x.rate, 1) +
          '</span><br><span class="sub">' +
          x.R.length +
          " lancers</span></span></div>"
        );
      }).join("") +
      "</div></section>";
  }

  if (on("equite")) {
    var all = [];
    S.games.filter(full).forEach(function (g) {
      all = all.concat(g.rolls, g.oppRolls || []);
    });
    var faces = [0, 0, 0, 0, 0, 0, 0],
      tot = 0;
    all.forEach(function (r) {
      (r.v || []).forEach(function (v) {
        if (v >= 1 && v <= 6) {
          faces[v]++;
          tot++;
        }
      });
    });
    var chi = 0;
    for (var f = 1; f <= 6; f++) {
      var e = tot / 6;
      chi += e ? Math.pow(faces[f] - e, 2) / e : 0;
    }
    var items = [];
    for (var f2 = 1; f2 <= 6; f2++)
      items.push({ lab: "Face " + f2, n: faces[f2], r: tot ? faces[f2] / tot : 0, sub: "" + faces[f2] });
    h +=
      '<section class="card"><h2>Équité des dés</h2><p class="sub">Toutes les faces observées, tes lancers et ceux de tes adversaires : ' +
      tot +
      " dés. Attendu : 16,7 % chacune.</p>" +
      bars(
        items,
        function (r) {
          return pct(r, 1);
        },
        "dés"
      ) +
      '<p class="note">Test du khi² : ' +
      fmt(chi, 2) +
      " pour 5 degrés de liberté. " +
      (tot < 300
        ? "Trop peu de dés pour conclure."
        : chi < 11.07
          ? "Rien d'anormal : compatible avec des dés équilibrés (seuil 11,07 à 95 %)."
          : "Écart au-delà du seuil de 11,07 : à surveiller sur plus de lancers.") +
      "</p>" +
      '<h3>Farkle, tous joueurs confondus</h3><div class="mrows">' +
      [6, 5, 4, 3, 2, 1]
        .map(function (k) {
          var L = all.filter(function (r) {
            return r.n === k;
          });
          return L.length
            ? farkleRow(k, actF(L) / L.length, L.length, null, null).replace(">Toi<b>", ">Observé<b>")
            : "";
        })
        .join("") +
      "</div></section>";
  }
  return h;
}
