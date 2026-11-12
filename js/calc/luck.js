// Farkle Stats ChatDeck · Indice de chance : farkles observés contre farkles attendus.
"use strict";

// ---------- Chance ----------
function expF(R) {
  return R.reduce(function (s, r) {
    return s + THEO[r.n];
  }, 0);
}
function actF(R) {
  return R.filter(function (r) {
    return r.f;
  }).length;
}
function luckOf(g) {
  if (!Array.isArray(g.rolls) || !g.rolls.length) {
    g.luck = null;
    return;
  }
  g.luck = expF(g.rolls) - actF(g.rolls); // > 0 : moins de farkles que prévu = chanceux
  g.oppLuck = expF(g.oppRolls || []) - actF(g.oppRolls || []);
}
function luckLabel(x, n) {
  if (n < 50) return "échantillon trop court";
  return x > 1 ? "🍀 chanceux" : x < -1 ? "🌧️ malchanceux" : "⚖️ dans la moyenne";
}
