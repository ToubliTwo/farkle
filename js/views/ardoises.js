// Farkle Stats ChatDeck · Ardoises de fin de partie et analyse coup par coup.
"use strict";

// ---------- Ardoises ----------
function slateHTML(g) {
  var me = g.turnLog || [],
    op = g.oppTurnLog || [],
    rows = Math.max(me.length, op.length),
    cm = 0,
    co = 0;
  var lastMe = -1,
    lastOp = -1;
  me.forEach(function (t, i) {
    if (!t.bust) lastMe = i;
  });
  op.forEach(function (t, i) {
    if (!t.bust) lastOp = i;
  });
  var cell = function (t, cum, isLast, cls) {
    if (!t) return "<td>–</td>";
    if (t.bust) return '<td class="F">F <span class="dl">−' + fmt(t.pts) + "</span></td>";
    return (
      '<td><span class="' +
      (isLast ? "final " + cls : "old") +
      '">' +
      fmt(cum) +
      '</span> <span class="dl">+' +
      fmt(t.pts) +
      (t.hot ? " ✦" : "") +
      "</span></td>"
    );
  };
  var h =
    '<div class="slate"><div class="st"><b>L\'Ardoise du tavernier</b><span>' +
    (me.length + op.length) +
    " tours · " +
    rows +
    " manches</span></div><table><thead><tr><th>N°</th><th>Toi" +
    (g.starter === "me" ? " 🎲" : "") +
    '</th><th class="opp">' +
    esc(g.opponent) +
    (g.starter === "opp" ? " 🎲" : "") +
    "</th></tr></thead><tbody>";
  for (var i = 0; i < rows; i++) {
    var a = me[i],
      b = op[i];
    if (a && !a.bust) cm += a.pts;
    if (b && !b.bust) co += b.pts;
    h +=
      "<tr><td>" +
      (i + 1) +
      "</td>" +
      cell(a, cm, i === lastMe, "") +
      cell(b, co, i === lastOp, "opp") +
      "</tr>";
  }
  h +=
    '</tbody><tfoot><tr><td>Total</td><td style="color:var(--gold)">' +
    fmt(g.myScore) +
    '</td><td style="color:#9cbcff">' +
    fmt(g.oppScore) +
    "</td></tr></tfoot></table>";
  h +=
    '<div class="foot"><span>Écart <b>' +
    fmt(Math.abs(g.myScore - g.oppScore)) +
    "</b></span><span>Farkles <b>" +
    (g.farkles != null ? g.farkles : "–") +
    " / " +
    (g.oppFarkles != null ? g.oppFarkles : "–") +
    "</b></span><span>Points perdus <b>" +
    fmt(g.lostPoints) +
    " / " +
    fmt(g.oppLost) +
    "</b></span><span>✦ Hot dice <b>" +
    (g.hotDice != null ? g.hotDice : "–") +
    " / " +
    (g.oppHot != null ? g.oppHot : "–") +
    "</b></span>" +
    (on("chance") && g.luck != null
      ? '<span>Chance <b class="' +
        (g.luck >= 0 ? "w" : "l") +
        '">' +
        sgn(g.luck, 1) +
        '</b> / <b class="' +
        (g.oppLuck >= 0 ? "w" : "l") +
        '">' +
        sgn(g.oppLuck, 1) +
        "</b> farkle</span>"
      : "") +
    "</div></div>";
  return h;
}
function cardsHTML(g) {
  if (!g.cards || !g.cards.length) return "";
  var c = function (L) {
    return (
      '<div class="cards">' +
      L.map(function (x) {
        return (
          '<img class="cardimg ' +
          esc(x.r) +
          '" src="' +
          esc(cardImg(x.img)) +
          '" alt="' +
          esc(x.t) +
          '" title="' +
          esc(x.t) +
          " · " +
          esc(x.r) +
          '" loading="lazy" referrerpolicy="no-referrer">'
        );
      }).join("") +
      "</div>"
    );
  };
  return (
    '<div class="grid2" style="margin-top:6px"><div><div class="sub" style="margin-bottom:6px">Tes dés</div>' +
    c(g.cards) +
    '</div><div><div class="sub" style="margin-bottom:6px">Dés de ' +
    esc(g.opponent) +
    "</div>" +
    c(g.oppCards || []) +
    "</div></div>"
  );
}
function emotesHTML(g) {
  if (!Array.isArray(g.emotes) || !g.emotes.length) return "";
  return (
    '<p class="sub">Emotes : ' +
    g.emotes
      .map(function (e) {
        return (
          (e.by === "me" ? "toi" : esc(g.opponent)) +
          " #" +
          (e.i == null ? "?" : e.i) +
          (e.after
            ? " après " +
              (e.after.by === "me" ? "ton " : "son ") +
              ({ roll: "lancer", bank: "encaissement", farkle: "farkle" }[e.after.kind] || e.after.kind)
            : "")
        );
      })
      .join(" · ") +
    "</p>"
  );
}
function gameRow(g) {
  var w = g.result === "win";
  return (
    '<span class="res"><b class="' +
    (w ? "w" : "l") +
    '">' +
    (w ? "V" : "D") +
    "</b><small>" +
    (g.mode === "ranked"
      ? g.eloWin != null
        ? w
          ? "+" + g.eloWin
          : "−" + g.eloLoss
        : "ranked"
      : g.mode === "open"
        ? "amis"
        : "ardoise") +
    '</small></span><span class="grow"><span class="name">' +
    esc(g.opponent) +
    '</span><span class="mono sub meta">' +
    dshort(Date.parse(g.date)) +
    " · " +
    hhmm(Date.parse(g.date)) +
    " · " +
    fmt(g.myScore) +
    " – " +
    fmt(g.oppScore) +
    "</span></span>" +
    (g.abandon ? '<span class="chip x">abandon</span>' : "") +
    (g.partial ? '<span class="chip">partielle</span>' : "")
  );
}
function renderParties() {
  if (!on("ardoises")) return off("ardoises");
  if (S.view) return renderReplay();
  var G = S.games
    .slice()
    .reverse()
    .filter(function (g) {
      return S.partMode === "all" || g.mode === S.partMode;
    });
  var per = 10,
    pages = Math.max(1, Math.ceil(G.length / per));
  S.partPage = Math.min(S.partPage, pages);
  var h =
    '<section class="card"><div class="head"><h2>Dernières parties</h2>' +
    seg("partMode", [
      ["all", "Toutes"],
      ["ranked", "Ranked"],
      ["open", "Amis"]
    ]) +
    "</div>";
  if (!G.length) return h + '<p class="empty">Aucune partie capturée pour ce filtre.</p></section>';
  h +=
    '<div class="inner">' +
    G.slice((S.partPage - 1) * per, S.partPage * per)
      .map(function (g) {
        var id = g.id.replace(/^cdp-/, ""),
          lk = on("chance") && g.luck != null ? g.luck - g.oppLuck : null;
        return (
          '<a class="row prow" href="#partie-' +
          esc(id) +
          '">' +
          gameRow(g) +
          (lk != null
            ? '<span class="chip" title="Écart de chance avec l\'adversaire, en farkles">' +
              (lk >= 0 ? "🍀 " : "🌧️ ") +
              sgn(lk, 1) +
              "</span>"
            : "") +
          '<span class="btn sm">' +
          (g.events ? "▶ Revoir" : "Détails") +
          " ›</span></a>"
        );
      })
      .join("") +
    "</div>";
  if (pages > 1)
    h +=
      '<div class="pager"><button class="btn" data-page="-1"' +
      (S.partPage <= 1 ? " disabled" : "") +
      ' aria-label="Page précédente">‹</button><span class="mono">' +
      S.partPage +
      " / " +
      pages +
      '</span><button class="btn" data-page="1"' +
      (S.partPage >= pages ? " disabled" : "") +
      ' aria-label="Page suivante">›</button></div>';
  return h + "</section>";
}
