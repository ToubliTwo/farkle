// Farkle Stats ChatDeck · Mon jeu : statistiques par carte de dé.
"use strict";

// ---------- Cartes ----------
function renderCartes() {
  if (!on("cartes")) return off("cartes");
  var C = {},
    order = [];
  S.games
    .filter(function (g) {
      return full(g) && g.cards;
    })
    .forEach(function (g) {
      (g.rolls || []).forEach(function (r) {
        if (!r.p || !r.v) return;
        r.p.forEach(function (pos, i) {
          var card = g.cards[pos];
          if (!card) return;
          var k = card.id;
          var x = C[k] || (C[k] = { card: card, f: [0, 0, 0, 0, 0, 0, 0], n: 0 });
          if (order.indexOf(k) < 0) order.push(k);
          x.f[r.v[i]]++;
          x.n++;
        });
      });
    });
  var L = order.map(function (k) {
    return C[k];
  });
  if (!L.length)
    return '<section class="card"><p class="empty">Pas encore de lancers associés à tes cartes.</p></section>';
  var cur =
    (
      S.games
        .filter(function (g) {
          return g.cards;
        })
        .slice(-1)[0] || {}
    ).cards || [];
  var curIds = cur.map(function (c) {
    return c.id;
  });
  return (
    '<section class="card"><h2>Tes six dés</h2><p class="sub">Chaque carte est un dé : voici ce que chacune a sorti dans tes parties capturées. Attendu : un 1 ou un 5 une fois sur trois (33,3 %).</p><div class="mrows">' +
    L.sort(function (a, b) {
      return (curIds.indexOf(b.card.id) >= 0) - (curIds.indexOf(a.card.id) >= 0) || b.n - a.n;
    })
      .map(function (x) {
        var sc = (x.f[1] + x.f[5]) / x.n,
          mean =
            [1, 2, 3, 4, 5, 6].reduce(function (s, v) {
              return s + v * x.f[v];
            }, 0) / x.n;
        var spark =
          '<svg class="spark" viewBox="0 0 120 34" width="120" height="34" aria-label="Faces 1 à 6">' +
          [1, 2, 3, 4, 5, 6]
            .map(function (v) {
              var r = x.f[v] / x.n,
                hh = Math.max(2, r * 80);
              return (
                '<rect x="' +
                ((v - 1) * 20 + 3) +
                '" y="' +
                (26 - hh) +
                '" width="14" height="' +
                hh +
                '" rx="3" fill="' +
                (v === 1 || v === 5 ? "#e9b949" : "#4a4a58") +
                '"/><text x="' +
                ((v - 1) * 20 + 10) +
                '" y="34" text-anchor="middle">' +
                v +
                "</text>"
              );
            })
            .join("") +
          "</svg>";
        var inPlay = curIds.indexOf(x.card.id) >= 0;
        return (
          '<div class="mrow"><div class="top"><img class="cardimg sm ' +
          esc(x.card.r) +
          '" src="' +
          esc(cardImg(x.card.img)) +
          '" alt="" loading="lazy" referrerpolicy="no-referrer"><span class="ttl"><span class="ell">' +
          esc(x.card.t) +
          '</span><small><span class="chip rar-' +
          esc(x.card.r) +
          '">' +
          esc(x.card.r) +
          "</span>" +
          (inPlay ? ' <span class="chip o">en jeu</span>' : "") +
          "</small></span>" +
          spark +
          "</div>" +
          '<div class="leg one"><span>Lancers<b>' +
          x.n +
          "</b></span><span>Moyenne<b>" +
          fmt(mean, 2) +
          '</b></span><span>1 ou 5<b class="' +
          (sc >= 1 / 3 ? "w" : "l") +
          '">' +
          pct(sc, 1) +
          "</b></span></div></div>"
        );
      })
      .join("") +
    '</div><p class="note">Sur quelques dizaines de lancers par carte, les écarts sont normaux. Il faut plusieurs centaines de lancers pour qu\'une carte « chanceuse » le soit vraiment.</p></section>'
  );
}
