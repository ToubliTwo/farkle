// Farkle Stats ChatDeck · Composants visuels réutilisés : listes repliées, lignes, jauges, légendes.
"use strict";

// ---------- Listes repliées : on montre l'essentiel, le reste sur demande ----------
function isMobile() {
  return window.matchMedia && window.matchMedia("(max-width: 760px)").matches;
}
function lim(mobile, desktop) {
  return isMobile() ? mobile : desktop;
}
function moreBtn(key, hidden, label) {
  return hidden > 0
    ? '<button class="more" data-more="' +
        key +
        '">' +
        (label || "Afficher plus") +
        ' <span class="sub">(' +
        hidden +
        ")</span></button>"
    : "";
}
function lessBtn(key) {
  return '<button class="more" data-less="' + key + '">Réduire</button>';
}

// ---------- Lignes visuelles (remplacent les tableaux) ----------
function diceIcons(n, face) {
  var h = '<span class="dicons" aria-hidden="true">';
  for (var i = 0; i < n; i++) h += die(face || 1, "tiny");
  return h + "</span>";
}
function verdictChip(diff, n, minN, goodLow) {
  if (n < (minN || 20)) return '<span class="chip">peu de lancers</span>';
  var good = goodLow ? diff < 0 : diff > 0,
    big = Math.abs(diff) > 0.25;
  if (!big) return '<span class="chip">normal</span>';
  return good ? '<span class="chip good">en ta faveur</span>' : '<span class="chip bad">contre toi</span>';
}
function farkleRow(k, mine, nMine, opp, nOpp) {
  var th = THEO[k],
    vals = [th, mine || 0, opp || 0],
    mx = Math.min(1, Math.max.apply(null, vals) * 1.25 || 0.1);
  var w = function (v) {
    return Math.max(0, Math.min(100, (v / mx) * 100));
  };
  var col = mine == null ? "var(--card3)" : mine <= th ? "var(--win)" : "var(--loss)";
  return (
    '<div class="mrow"><div class="top">' +
    diceIcons(k) +
    '<span class="ttl">' +
    k +
    (k > 1 ? " dés lancés" : " dé lancé") +
    "<small>" +
    (nMine || 0) +
    " lancers" +
    (nOpp != null ? " · adv. " + nOpp : "") +
    "</small></span>" +
    (mine != null ? verdictChip((mine - th) / Math.max(th, 0.02), nMine, 15, true) : "") +
    "</div>" +
    '<div class="gauge"><i class="b" style="width:' +
    w(mine || 0) +
    "%;background:" +
    col +
    '"></i><i class="mk" style="left:' +
    w(th) +
    '%" title="Théorie"></i></div>' +
    (opp != null
      ? '<div class="gauge thin"><i class="b" style="width:' +
        w(opp) +
        '%;background:#7fb0ff"></i><i class="mk" style="left:' +
        w(th) +
        '%"></i></div>'
      : "") +
    '<div class="leg one"><span><i class="dot" style="background:' +
    col +
    '"></i>Toi<b>' +
    (mine != null ? pct(mine, 1) : "–") +
    "</b></span>" +
    (opp != null
      ? '<span><i class="dot" style="background:#7fb0ff"></i>Adv.<b>' + pct(opp, 1) + "</b></span>"
      : "") +
    '<span><i class="tick"></i>Théorie<b>' +
    pct(th, 1) +
    "</b></span></div></div>"
  );
}
function comboRow(label, faces, got, exp) {
  var mx = Math.max(got, exp, 0.5) * 1.25,
    w = function (v) {
      return Math.min(100, (v / mx) * 100);
    },
    d = got - exp;
  return (
    '<div class="mrow"><div class="top">' +
    '<span class="dicons" aria-hidden="true">' +
    faces
      .map(function (f) {
        return die(f, "tiny");
      })
      .join("") +
    '</span><span class="ttl">' +
    label +
    "<small>" +
    got +
    " obtenu" +
    (got > 1 ? "s" : "") +
    " · " +
    fmt(exp, 1) +
    " attendu" +
    (exp >= 2 ? "s" : "") +
    "</small></span>" +
    '<span class="chip ' +
    (Math.abs(d) < 0.5 ? "" : d > 0 ? "good" : "bad") +
    '">' +
    sgn(d, 1) +
    "</span></div>" +
    '<div class="gauge"><i class="b" style="width:' +
    w(got) +
    "%;background:" +
    (Math.abs(d) < 0.5 ? "var(--gold)" : d > 0 ? "var(--win)" : "var(--loss)") +
    '"></i><i class="mk" style="left:' +
    w(exp) +
    '%"></i></div></div>'
  );
}
function situRow(label, L, NT) {
  var v = L.filter(function (x) {
      return x.result === "win";
    }).length,
    r = L.length ? v / L.length : null;
  return (
    '<div class="mrow"><div class="top"><span class="ttl">' +
    label +
    "<small>" +
    L.length +
    " partie" +
    (L.length > 1 ? "s" : "") +
    " sur " +
    NT +
    " · " +
    v +
    " victoire" +
    (v > 1 ? "s" : "") +
    '</small></span><span class="big ' +
    (r == null ? "" : r >= 0.5 ? "w" : "l") +
    '">' +
    (r == null ? "–" : pct(r)) +
    "</span></div>" +
    '<div class="gauge"><i class="b" style="width:' +
    (r || 0) * 100 +
    "%;background:" +
    (r != null && r >= 0.5 ? "var(--win)" : "var(--loss)") +
    '"></i><i class="mk" style="left:50%"></i></div></div>'
  );
}
function splitRow(label, a, b, better) {
  var hi = better ? better(a.raw, b.raw) : 0;
  return (
    '<div class="srow"><span class="sl">' +
    label +
    '</span><span class="sv r' +
    (hi > 0 ? " best" : "") +
    '">' +
    a.txt +
    '</span><span class="sv o' +
    (hi < 0 ? " best" : "") +
    '">' +
    b.txt +
    "</span></div>"
  );
}
