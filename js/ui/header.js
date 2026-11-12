// Farkle Stats ChatDeck · En-tête : score de saison et résumé.
"use strict";

// ---------- En-tête ----------
var BADGE =
  '<svg class="badge" viewBox="0 0 70 70" aria-hidden="true"><defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb0ff"/><stop offset="1" stop-color="#2f6be0"/></linearGradient></defs><path d="M6 24 L14 28 L14 46 L6 42Z M64 24 L56 28 L56 46 L64 42Z" fill="#4c8dff" opacity=".8"/><rect x="15" y="18" width="40" height="38" rx="10" fill="url(#bg)"/><path d="M35 4 L40 10 L35 16 L30 10Z" fill="#7fb0ff"/><g fill="#0d2a66"><circle cx="25" cy="28" r="3.3"/><circle cx="45" cy="28" r="3.3"/><circle cx="35" cy="37" r="3.3"/><circle cx="25" cy="46" r="3.3"/><circle cx="45" cy="46" r="3.3"/></g></svg>';
function renderHero() {
  var el = $("hero");
  if (!S.site) {
    var g = S.games,
      w = g.filter(function (x) {
        return x.result === "win";
      }).length;
    el.innerHTML =
      '<div class="tiles">' +
      tile("Parties capturées", g.length) +
      tile("Victoires", pct(g.length ? w / g.length : null)) +
      tile(
        "Ranked",
        g.filter(function (x) {
          return x.mode === "ranked";
        }).length
      ) +
      tile(
        "Amis",
        g.filter(function (x) {
          return x.mode === "open";
        }).length
      ) +
      '</div><p class="note">Ouvre une fois « Mes stats » du Farkle sur ChatDeck avec la capture active pour l\'historique Ranked complet.</p>';
    return;
  }
  var c = siteCalc(),
    last = c.days[0];
  el.innerHTML =
    '<div class="rank">' +
    BADGE +
    '<div><div class="elo">' +
    fmt(c.place.elo) +
    '<small>points</small></div><div class="sub">' +
    (c.place.rank ? c.place.rank + "<sup>e</sup> sur " + c.place.total + " · " : "") +
    "Saison " +
    esc(c.season || "") +
    " · relevé " +
    dshort(S.siteAt) +
    " " +
    hhmm(S.siteAt) +
    "</div></div></div>" +
    '<div class="tiles">' +
    tile("Parties", c.n) +
    tile("Victoires", pct(c.n ? c.w / c.n : null), c.w + " V · " + (c.n - c.w) + " D") +
    tile(
      "Série en cours",
      '<span class="' + (c.streakWin ? "w" : "l") + '">' + c.streak + (c.streakWin ? " V" : " D") + "</span>"
    ) +
    tile(
      last ? dshort(Date.parse(last.k)) : "Dernier jour",
      last
        ? '<span class="' +
            (last.delta >= 0 ? "w" : "l") +
            '">' +
            sgn(last.delta) +
            '</span> <span class="sub mono">· ' +
            (last.v + last.l) +
            "</span>"
        : "–"
    ) +
    "</div>" +
    '<div class="wl" aria-label="Part de victoires"><i style="width:' +
    (c.n ? (c.w / c.n) * 100 : 0) +
    '%"></i></div>';
}
function avatar(src, name) {
  var ini =
    '<span class="av ini" aria-hidden="true">' +
    esc(
      String(name || "?")
        .trim()
        .charAt(0)
        .toUpperCase()
    ) +
    "</span>";
  return src
    ? '<span class="avw">' +
        ini +
        '<img class="av" src="' +
        esc(src) +
        '" alt="" loading="lazy" referrerpolicy="no-referrer"></span>'
    : ini;
}
document.addEventListener(
  "error",
  function (e) {
    var t = e.target;
    if (!t || t.tagName !== "IMG") return;
    if (t.classList.contains("av")) t.remove();
    else if (t.classList.contains("cardimg")) {
      var d = document.createElement("span");
      d.className = t.className;
      d.textContent = "🎲";
      if (t.title) d.title = t.title;
      t.replaceWith(d);
    }
  },
  true
);
function needSite() {
  return '<section class="card"><p class="empty">Ces stats viennent de la page « Mes stats » de ChatDeck. Ouvre-la une fois avec la capture active.</p></section>';
}
function off(k) {
  return (
    '<section class="card"><p class="empty">Option « ' +
    esc(OPT[k].label) +
    " » désactivée par le dev. Active-la dans les Réglages (bas de page).</p></section>"
  );
}
