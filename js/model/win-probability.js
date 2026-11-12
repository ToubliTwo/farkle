// Farkle Stats ChatDeck · Modèle de fin de partie : probabilité de victoire exacte et seuils selon le score.
"use strict";

// ---------- Modèle de fin de partie : probabilité de victoire exacte ----------
// Résolu hors ligne (itération de valeur, règles ChatDeck, victoire immédiate à 4 000, adversaire supposé optimal).
// WP_BASE : P(ton score, son score) au début de ton tour, unités de 50, 80×80 entiers sur 16 bits.
// Le reste (points en jeu, dés restants) se recalcule ici à la demande, une paire de scores à la fois.
var WP = (function () {
  var G = 80,
    B = null,
    ROLLS = null,
    cache = {};
  function best(c) {
    var tot = c[1] + c[2] + c[3] + c[4] + c[5] + c[6];
    if (!tot) return 0;
    var b = -1,
      r,
      f,
      m;
    function tryRun(lo, hi, v) {
      var ok = true;
      for (f = lo; f <= hi; f++) if (!c[f]) ok = false;
      if (!ok) return;
      for (f = lo; f <= hi; f++) c[f]--;
      r = best(c);
      if (r >= 0 && r + v > b) b = r + v;
      for (f = lo; f <= hi; f++) c[f]++;
    }
    tryRun(1, 6, 30);
    tryRun(1, 5, 10);
    tryRun(2, 6, 15);
    for (f = 1; f <= 6; f++)
      for (m = 3; m <= c[f]; m++) {
        var v = (f === 1 ? 20 : f * 2) * (m === 3 ? 1 : m === 4 ? 2 : m === 5 ? 4 : 8);
        c[f] -= m;
        r = best(c);
        if (r >= 0 && r + v > b) b = r + v;
        c[f] += m;
      }
    if (c[1]) {
      c[1]--;
      r = best(c);
      if (r >= 0 && r + 2 > b) b = r + 2;
      c[1]++;
    }
    if (c[5]) {
      c[5]--;
      r = best(c);
      if (r >= 0 && r + 1 > b) b = r + 1;
      c[5]++;
    }
    return b;
  }
  function fact(n) {
    var r = 1;
    for (var i = 2; i <= n; i++) r *= i;
    return r;
  }
  function build() {
    ROLLS = [null];
    for (var n = 1; n <= 6; n++) {
      var L = [],
        c = [0, 0, 0, 0, 0, 0, 0];
      (function gen(f, left) {
        if (f === 6) {
          c[6] = left;
          var p = fact(n);
          for (var g = 1; g <= 6; g++) p /= fact(c[g]);
          p /= Math.pow(6, n);
          var bu = [-1, -1, -1, -1, -1, -1, -1],
            s = [0, 0, 0, 0, 0, 0, 0];
          (function sub(g) {
            if (g === 7) {
              var u = s[1] + s[2] + s[3] + s[4] + s[5] + s[6];
              if (!u) return;
              var b = best(s.slice());
              if (b > bu[u]) bu[u] = b;
              return;
            }
            for (s[g] = 0; s[g] <= c[g]; s[g]++) sub(g + 1);
            s[g] = 0;
          })(1);
          var o = [];
          for (var u = 1; u <= n; u++) if (bu[u] > 0) o.push([bu[u], u]);
          L.push({ p: p, o: o });
          return;
        }
        for (var k = 0; k <= left; k++) {
          c[f] = k;
          gen(f + 1, left - k);
        }
      })(1, n);
      ROLLS.push(L);
    }
  }
  function init() {
    if (B) return true;
    try {
      var s = atob(WP_BASE);
      B = new Float64Array(G * G);
      for (var i = 0; i < G * G; i++) B[i] = (s.charCodeAt(2 * i) | (s.charCodeAt(2 * i + 1) << 8)) / 65535;
      build();
      return true;
    } catch (e) {
      B = null;
      return false;
    }
  }
  // Table d'une paire (i = joueur au trait, j = adversaire) : V = meilleur choix, Rl = valeur de la relance.
  function table(i, j) {
    var key = i * G + j;
    if (cache[key]) return cache[key];
    var fo = B[j * G + i],
      V = new Float64Array((G + 1) * 7),
      Rl = new Float64Array((G + 1) * 7);
    for (var k = G - i; k >= 0; k--)
      for (var n = 1; n <= 6; n++) {
        if (k === 0 && n !== 6) continue;
        var roll = 0,
          L = ROLLS[n];
        for (var r = 0; r < L.length; r++) {
          var x = L[r];
          if (!x.o.length) {
            roll += x.p * (1 - fo);
            continue;
          }
          var bv = 0;
          for (var q = 0; q < x.o.length; q++) {
            var k2 = k + x.o[q][0],
              v;
            if (i + k2 >= G) v = 1;
            else {
              var n2 = n - x.o[q][1];
              if (!n2) n2 = 6;
              v = V[k2 * 7 + n2];
            }
            if (v > bv) bv = v;
          }
          roll += x.p * bv;
        }
        var bank = k > 0 ? 1 - B[j * G + i + k] : 0;
        Rl[k * 7 + n] = roll;
        V[k * 7 + n] = Math.max(bank, roll);
      }
    return (cache[key] = { V: V, Rl: Rl });
  }
  function u(p) {
    return Math.max(0, Math.min(G - 1, Math.round(p / 50)));
  }
  return {
    ready: init,
    // Proba de gagner au début de ton tour.
    start: function (my, opp) {
      if (!init()) return null;
      return B[u(my) * G + u(opp)];
    },
    // Décision : relancer ou encaisser, avec k points en jeu et n dés à lancer.
    dec: function (my, opp, pts, n) {
      if (!init()) return null;
      if (my + pts >= 4000) return { bank: 1, roll: 1 };
      var i = u(my),
        j = u(opp),
        k = Math.round(pts / 50);
      n = Math.max(1, Math.min(6, n || 6));
      if (i + k >= G) return { bank: 1, roll: 1 };
      var T = table(i, j);
      return { bank: k > 0 ? 1 - B[j * G + i + k] : 0, roll: T.Rl[k * 7 + n] };
    },
    // Seuil : plus petit montant en jeu à partir duquel encaisser vaut mieux que relancer.
    seuil: function (my, opp, n) {
      if (!init()) return null;
      var i = u(my),
        j = u(opp),
        T = table(i, j);
      for (var k = 1; i + k < G; k++) if (1 - B[j * G + i + k] >= T.Rl[k * 7 + n] - 1e-9) return k * 50;
      return Infinity;
    }
  };
})();
