// Farkle Stats ChatDeck · Onglets regroupés : Mon jeu, Parties, Trophées.
"use strict";

// ---------- Onglets regroupés ----------
function renderSaison() {
  if (!S.site) return needSite();
  return renderScore() + renderMom();
}
function renderPartiesAll() {
  if (S.view) return on("ardoises") ? renderReplay() : off("ardoises");
  var items = [],
    used = {},
    c = S.site ? siteCalc() : null;
  if (c)
    c.D.forEach(function (d) {
      var g = gameById(d.id);
      if (g) used[g.id] = 1;
      items.push({
        t: d.at,
        won: d.won,
        mode: "ranked",
        name: oppName(c, d.o),
        av: oppAv(c, d.o),
        d: d.d,
        e: d.e,
        g: g
      });
    });
  S.games.forEach(function (g) {
    if (used[g.id]) return;
    var t = Date.parse(g.date);
    var twin = items.find(function (it) {
      return (
        !it.g &&
        it.name.toLowerCase() === (g.opponent || "").toLowerCase() &&
        Math.abs(it.t - t) < 15 * 60e3 &&
        it.won === (g.result === "win")
      );
    });
    if (twin) {
      twin.g = g;
      return;
    }
    items.push({ t: t, won: g.result === "win", mode: g.mode || "ranked", name: g.opponent, g: g });
  });
  items.sort(function (a, b) {
    return b.t - a.t;
  });
  var q = S.histQ.toLowerCase();
  var L = items.filter(function (it) {
    if (S.partMode !== "all" && it.mode !== S.partMode) return false;
    if (S.histFilter === "win" && !it.won) return false;
    if (S.histFilter === "loss" && it.won) return false;
    return !q || it.name.toLowerCase().indexOf(q) >= 0;
  });
  var nRe = L.filter(function (it) {
    return it.g && it.g.events;
  }).length;
  var h =
    '<section class="card"><div class="head"><h2>Parties</h2><span class="sub">' +
    L.length +
    " parties · " +
    nRe +
    " à revoir</span></div>" +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">' +
    seg("partMode", [
      ["all", "Toutes"],
      ["ranked", "Ranked"],
      ["open", "Amis"]
    ]) +
    seg("histFilter", [
      ["all", "V et D"],
      ["win", "Victoires"],
      ["loss", "Défaites"]
    ]) +
    "</div>" +
    '<input type="search" id="histQ" value="' +
    esc(S.histQ) +
    '" placeholder="🔍 Chercher un adversaire" aria-label="Chercher un adversaire">';
  var cur = null,
    dsum = {};
  L.forEach(function (it) {
    var k = dayKey(it.t);
    dsum[k] = (dsum[k] || 0) + (it.d || 0);
  });
  var perDay = q ? 1e9 : lim(5, 10),
    nDays = q ? 1e9 : S.more.days || lim(5, 7),
    byDay = {},
    days = [];
  L.forEach(function (it) {
    var k = dayKey(it.t);
    if (!byDay[k]) {
      byDay[k] = [];
      days.push(k);
    }
    byDay[k].push(it);
  });
  var shown = [];
  days.slice(0, nDays).forEach(function (k) {
    var all = byDay[k],
      open = S.more["day-" + k],
      vis = open ? all : all.slice(0, perDay);
    vis.forEach(function (it, i) {
      it._last = i === vis.length - 1;
      it._day = k;
      it._hidden = all.length - vis.length;
      it._open = open && all.length > perDay;
      shown.push(it);
    });
  });
  shown.forEach(function (it) {
    var k = dayKey(it.t),
      g = it.g,
      link = g && on("ardoises") ? "#partie-" + esc(g.id.replace(/^cdp-/, "")) : null;
    if (k !== cur) {
      cur = k;
      var dv = byDay[k].filter(function (x) {
        return x.won;
      }).length;
      h +=
        '<div class="day"><span><span class="dl">' +
        esc(dayLabel(k)) +
        '</span><span class="ds">' +
        esc(dayShort(k)) +
        '</span> <span class="cnt">' +
        byDay[k].length +
        " parties · " +
        dv +
        " V " +
        (byDay[k].length - dv) +
        ' D</span></span><span class="mono">' +
        (dsum[k] ? sgn(dsum[k]) : "") +
        "</span></div>";
    }
    var lk = g && on("chance") && g.luck != null ? g.luck - g.oppLuck : null;
    h +=
      "<" +
      (link ? 'a href="' + link + '"' : "div") +
      ' class="row' +
      (link ? " prow" : "") +
      '"><span class="mono sub tcol" style="width:44px">' +
      hhmm(it.t) +
      '</span><span class="res"><b class="' +
      (it.won ? "w" : "l") +
      '">' +
      (it.won ? "V" : "D") +
      "</b><small>" +
      (it.mode === "open"
        ? "amis"
        : it.d != null
          ? sgn(it.d)
          : g && g.eloWin != null
            ? it.won
              ? "+" + g.eloWin
              : "−" + g.eloLoss
            : "ranked") +
      "</small></span>" +
      '<div class="grow"><div class="name">' +
      esc(it.name) +
      '</div><div class="sub mono meta"><span class="tm">' +
      hhmm(it.t) +
      " · </span>" +
      (g ? fmt(g.myScore) + "–" + fmt(g.oppScore) : "") +
      (lk != null ? " · " + (lk >= 0 ? "🍀" : "🌧️") + sgn(lk, 1) : "") +
      (g && g.abandon ? " · abandon" : "") +
      (g && g.emotes && g.emotes.length ? " · 💬" + g.emotes.length : "") +
      "</div></div>" +
      (it.e != null ? '<span class="right sub mono">' + fmt(it.e) + "</span>" : "") +
      (link
        ? '<span class="btn sm">' + (g.events ? '▶<span class="lbl"> Revoir</span>' : "Ardoise") + "</span>"
        : "") +
      "</" +
      (link ? "a" : "div") +
      ">";
    if (it._last)
      h += it._open
        ? lessBtn("day-" + it._day)
        : moreBtn("day-" + it._day, it._hidden, "Les autres parties du jour");
  });
  if (days.length > nDays)
    h +=
      '<button class="more strong" data-moredays="1">Jours précédents <span class="sub">(' +
      (days.length - nDays) +
      " jours)</span></button>";
  if (!c)
    h +=
      '<p class="note">Ouvre une fois « Mes stats » sur ChatDeck pour ajouter tout ton historique Ranked.</p>';
  return h + "</section>";
}
function renderJeu() {
  var views = [["decisions", "Décisions"]];
  if (on("chance")) views.push(["chance", "Chance"]);
  if (on("cartes")) views.push(["cartes", "Mes dés"]);
  if (
    !views.some(function (v) {
      return v[0] === S.jeuView;
    })
  )
    S.jeuView = "decisions";
  var h =
    '<div class="subnav">' +
    seg("jeuView", views) +
    seg("anaMode", [
      ["all", "Toutes"],
      ["ranked", "Ranked"],
      ["open", "Amis"]
    ]) +
    "</div>";
  return (
    h + (S.jeuView === "chance" ? renderChance() : S.jeuView === "cartes" ? renderCartes() : renderAna())
  );
}
function renderTrophees() {
  var h = siteRecords();
  if (on("records")) h += renderRecords();
  if (on("succes")) h += renderSucces();
  return h || '<section class="card"><p class="empty">Records et succès désactivés.</p></section>';
}
