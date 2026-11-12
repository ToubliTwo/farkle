// Farkle Stats ChatDeck · Onglet Saison.
"use strict";

// ---------- Onglet Score ----------
function renderScore() {
  if (!S.site) return needSite();
  var c = siteCalc(),
    lim = S.period === "7" ? 7 : S.period === "14" ? 14 : null,
    now = Date.now();
  var D = lim
    ? c.D.filter(function (d) {
        return d.at >= now - lim * 864e5;
      })
    : c.D;
  var h =
    '<section class="card"><div class="head"><h2>Évolution du score</h2>' +
    seg("period", [
      ["season", "Saison"],
      ["14", "14 j"],
      ["7", "7 j"]
    ]) +
    "</div>" +
    lineChart(
      D.map(function (d) {
        return { y: d.e, lab: dshort(d.at) };
      }),
      { label: "Évolution du score" }
    ) +
    "</section>";
  h +=
    '<section class="card"><h2>Jour par jour</h2><div class="inner">' +
    c.days
      .map(function (d) {
        var n = d.v + d.l;
        return (
          '<div class="row"><div class="grow"><div class="name">' +
          esc(dayLabel(d.k)) +
          '</div><div class="mono"><span class="w">' +
          d.v +
          ' V</span> · <span class="l">' +
          d.l +
          ' D</span> <span class="minibar"><i style="width:' +
          (n ? (d.v / n) * 100 : 0) +
          '%"></i></span></div></div><div class="right"><div class="' +
          (d.delta >= 0 ? "w" : "l") +
          '" style="font-weight:700">' +
          sgn(d.delta) +
          '</div><div class="sub mono">' +
          fmt(d.end) +
          "</div></div></div>"
        );
      })
      .join("") +
    "</div></section>";
  return h;
}
function siteRecords() {
  if (!S.site) return "";
  var c = siteCalc(),
    h = "";
  h +=
    '<section class="card"><h2>Records de la saison</h2><div class="grid2">' +
    recBox(
      "Meilleur score",
      fmt(c.best && c.best.e),
      c.best ? dshort(c.best.at) + " · " + hhmm(c.best.at) : "",
      c.best && gameById(c.best.id)
    ) +
    recBox("Plus longue série", c.bestRun + " V", "victoires d'affilée") +
    recBox(
      "Plus gros gain",
      '<span class="w">' + sgn(c.bigGain && c.bigGain.d) + "</span>",
      c.bigGain ? "contre " + esc(oppName(c, c.bigGain.o)) : "",
      c.bigGain && gameById(c.bigGain.id)
    ) +
    recBox(
      "Meilleur jour",
      '<span class="w">' + sgn(c.bestDay && c.bestDay.delta) + "</span>",
      c.bestDay ? dayLabel(c.bestDay.k) + " · " + c.bestDay.v + " V " + c.bestDay.l + " D" : ""
    ) +
    recBox(
      "Plus grosse perte",
      '<span class="l">' + sgn(c.bigLoss && c.bigLoss.d) + "</span>",
      c.bigLoss ? "contre " + esc(oppName(c, c.bigLoss.o)) : "",
      c.bigLoss && gameById(c.bigLoss.id)
    ) +
    recBox(
      "Gain moyen / perte moyenne",
      '<span class="w">' + sgn(c.avgWin, 1) + '</span> / <span class="l">' + sgn(c.avgLoss, 1) + "</span>",
      "par victoire / par défaite"
    ) +
    "</div></section>";
  return h;
}
// Lien vers une partie : la relecture au coup précis si on le connaît, sinon le début ; l'ardoise seule pour les parties sans relecture.
function gameLink(g, n) {
  return "#partie-" + esc(g.id.replace(/^cdp-/, "")) + (n != null && g.events ? "-n" + n : "");
}
function linkLabel(g, n) {
  return !g.events ? "voir l'ardoise ›" : n != null ? "voir le coup ›" : "revoir la partie ›";
}
function recBox(k, v, sub, g, n) {
  var link = g && on("ardoises") ? ' href="' + gameLink(g, n) + '"' : "";
  return (
    "<" +
    (link ? "a" : "div") +
    ' class="rec"' +
    link +
    '><span class="sub">' +
    k +
    '</span><span class="v">' +
    v +
    '</span><span class="sub">' +
    sub +
    (link ? ' · <span class="g">' + linkLabel(g, n) + "</span>" : "") +
    "</span></" +
    (link ? "a" : "div") +
    ">"
  );
}
