// Farkle Stats ChatDeck · Calculateur de seuils selon le score (option seuilsChiffres).
"use strict";

function seuilRes() {
  var my = S.wpMy,
    op = S.wpOpp,
    st = WP.start(my, op);
  if (st == null) return '<p class="empty">Modèle indisponible.</p>';
  var h =
    '<div class="seuilhead">Début de ton tour : <b>' +
    pct(st) +
    '</b> de victoire</div><div class="seuilgrid">';
  for (var n = 6; n >= 1; n--) {
    var t = WP.seuil(my, op, n);
    h +=
      '<div class="sg">' +
      diceIcons(n) +
      "<span>" +
      (isFinite(t) ? "encaisse dès <b>" + fmt(t) + "</b>" : "<b>relance jusqu'à 4 000</b>") +
      "</span></div>";
  }
  return h + "</div>";
}
function seuilCalc() {
  return (
    '<h3>Seuils selon le score</h3><p class="sub">Déplace les curseurs : le bon moment pour encaisser change avec l\'écart et la proximité de 4 000.</p>' +
    '<div class="wpin"><label>Ton score <b id="wpMyV">' +
    fmt(S.wpMy) +
    '</b><input type="range" id="wpMy" min="0" max="3950" step="50" value="' +
    S.wpMy +
    '"></label>' +
    '<label>Son score <b id="wpOpV">' +
    fmt(S.wpOpp) +
    '</b><input type="range" id="wpOpp" min="0" max="3950" step="50" value="' +
    S.wpOpp +
    '"></label></div>' +
    '<div id="wpRes">' +
    seuilRes() +
    "</div>"
  );
}
