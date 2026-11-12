// Farkle Stats ChatDeck · Historique des parties officielles.
"use strict";

// ---------- Historique ----------
function renderHist() {
  if (!S.site) return needSite();
  var c = siteCalc(),
    q = S.histQ.toLowerCase();
  var L = c.D.slice()
    .reverse()
    .filter(function (d) {
      if (S.histFilter === "win" && !d.won) return false;
      if (S.histFilter === "loss" && d.won) return false;
      return !q || oppName(c, d.o).toLowerCase().indexOf(q) >= 0;
    });
  var h =
    '<section class="card"><div class="head"><h2>Historique</h2>' +
    seg("histFilter", [
      ["all", "Tous"],
      ["win", "Victoires"],
      ["loss", "Défaites"]
    ]) +
    "</div>" +
    '<input type="search" id="histQ" value="' +
    esc(S.histQ) +
    '" placeholder="🔍 Chercher un adversaire" aria-label="Chercher un adversaire">';
  var cur = null,
    dsum = {};
  L.forEach(function (d) {
    var k = dayKey(d.at);
    dsum[k] = (dsum[k] || 0) + d.d;
  });
  L.slice(0, S.histN).forEach(function (d) {
    var k = dayKey(d.at),
      g = gameById(d.id);
    if (k !== cur) {
      cur = k;
      h +=
        '<div class="day"><span>' +
        esc(dayLabel(k)) +
        '</span><span class="mono">' +
        sgn(dsum[k]) +
        "</span></div>";
    }
    h +=
      '<div class="row"><span class="mono sub" style="width:46px">' +
      hhmm(d.at) +
      '</span><span class="res"><b class="' +
      (d.won ? "w" : "l") +
      '">' +
      (d.won ? "V" : "D") +
      '</b></span><div class="grow"><div class="name">' +
      esc(oppName(c, d.o)) +
      "</div>" +
      (g && on("ardoises")
        ? '<a class="sub" href="#partie-' +
          d.id +
          '">🧾 ardoise · ' +
          fmt(g.myScore) +
          " – " +
          fmt(g.oppScore) +
          "</a>"
        : "") +
      '</div><div class="right"><div class="' +
      (d.won ? "w" : "l") +
      '" style="font-weight:700">' +
      sgn(d.d) +
      '</div><div class="sub mono">' +
      fmt(d.e) +
      "</div></div></div>";
  });
  if (L.length > S.histN)
    h +=
      '<button class="btn" id="histMore" style="margin-top:12px">Afficher plus (' +
      (L.length - S.histN) +
      ")</button>";
  return h + "</section>";
}
