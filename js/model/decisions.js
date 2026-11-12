// Farkle Stats ChatDeck · Jugement d'une décision (relancer ou encaisser) en chances de gagner.
"use strict";

// Coût d'une décision en points de % de victoire (0 = bon choix, écarts sous 0,3 point ignorés).
function decWP(d) {
  return WP.dec(d.my, d.opp, d.pts, d.left);
}
function decCostEV(d) {
  if (d.my + d.pts >= TARGET) return d.act === "bank" ? 0 : Math.round(d.pts * THEO[d.left]);
  var er = erAt(d.pts, d.left),
    best = d.pts >= er ? "bank" : "roll";
  return d.act === best ? 0 : Math.round(Math.abs(d.pts - er));
}
function decCost(d) {
  var e = decWP(d);
  if (!e) return decCostEV(d) ? 1 : 0;
  var loss = (Math.max(e.bank, e.roll) - (d.act === "bank" ? e.bank : e.roll)) * 100;
  return loss < 0.3 ? 0 : Math.round(loss * 10) / 10;
}
function pp(v) {
  return fmt(v, 1) + "\u00a0%";
}
