// Farkle Stats ChatDeck · Onglet Adversaires.
"use strict";

// ---------- Adversaires ----------
function renderAdv() {
  if (!S.site) return needSite();
  var c = siteCalc(),
    M = {};
  c.D.forEach(function (d) {
    var o = M[d.o] || (M[d.o] = { id: d.o, v: 0, l: 0, delta: 0 });
    if (d.won) o.v++;
    else o.l++;
    o.delta += d.d;
  });
  var L = Object.keys(M).map(function (k) {
      return M[k];
    }),
    min = c.cfg.minOpp || 3;
  if (S.advMode === "most")
    L.sort(function (a, b) {
      return b.v + b.l - (a.v + a.l) || b.delta - a.delta;
    });
  if (S.advMode === "prey")
    L = L.filter(function (o) {
      return o.v + o.l >= min && o.delta > 0;
    }).sort(function (a, b) {
      return b.delta - a.delta;
    });
  if (S.advMode === "nemesis")
    L = L.filter(function (o) {
      return o.v + o.l >= min && o.delta < 0;
    }).sort(function (a, b) {
      return a.delta - b.delta;
    });
  var luckBy = {};
  S.games.forEach(function (g) {
    if (g.luck == null) return;
    var k = (g.opponent || "").toLowerCase();
    var x = luckBy[k] || (luckBy[k] = { me: 0, opp: 0, n: 0 });
    x.me += g.luck;
    x.opp += g.oppLuck;
    x.n++;
  });
  var h =
    '<section class="card"><div class="head"><h2>Adversaires</h2>' +
    seg("advMode", [
      ["most", "Plus affrontés"],
      ["prey", "Proies"],
      ["nemesis", "Bêtes noires"]
    ]) +
    '</div><div class="inner">';
  if (!L.length) h += '<p class="empty">Personne avec au moins ' + min + " parties dans cette catégorie.</p>";
  var nAdv = S.more.adv ? 1e9 : lim(10, 20),
    restAdv = Math.max(0, L.length - nAdv);
  h +=
    L.slice(0, nAdv)
      .map(function (o) {
        var av = oppAv(c, o.id),
          nm = oppName(c, o.id),
          lk = luckBy[nm.toLowerCase()],
          n = o.v + o.l,
          ld = lk ? lk.me - lk.opp : 0;
        return (
          '<button class="row arow" data-opp="' +
          esc(nm) +
          '" aria-label="Voir les parties contre ' +
          esc(nm) +
          '">' +
          avatar(av, nm) +
          '<span class="grow"><span class="name">' +
          esc(nm) +
          '</span><span class="mono vd"><span class="w">' +
          o.v +
          ' V</span> · <span class="l">' +
          o.l +
          " D</span></span>" +
          (lk && on("chance")
            ? '<span class="lk ' +
              (ld >= 0 ? "good" : "bad") +
              '" title="Écart de chance avec cet adversaire, en farkles évités, sur les parties détaillées">' +
              (ld >= 0 ? "🍀" : "🌧️") +
              " Chance " +
              sgn(ld, 1) +
              ' <span class="lkn">(' +
              lk.n +
              " partie" +
              (lk.n > 1 ? "s" : "") +
              ")</span></span>"
            : "") +
          "</span>" +
          '<span class="right"><span class="dl ' +
          (o.delta >= 0 ? "w" : "l") +
          '">' +
          sgn(o.delta) +
          '</span><span class="sub">' +
          n +
          " partie" +
          (n > 1 ? "s" : "") +
          " ›</span></span></button>"
        );
      })
      .join("") +
    "</div>" +
    (S.more.adv ? lessBtn("adv") : moreBtn("adv", restAdv, "Afficher les autres adversaires")) +
    "</section>";
  return h;
}
