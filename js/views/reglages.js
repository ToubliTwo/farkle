// Farkle Stats ChatDeck · Réglages : visibilité, modération des emotes, options du dev.
"use strict";

// ---------- Profil (visibilité) et options ----------
function emoteBoard() {
  var P = {},
    scope = S.emoScope;
  S.games.forEach(function (g) {
    if (!Array.isArray(g.emotes)) return;
    var ctx = g.mode === "open" ? "open" : "ranked",
      R = EMO_RULES[ctx];
    if (scope === "noopen" && ctx === "open") return;
    if (scope === "open" && ctx !== "open") return;
    var cnt = { me: 0, opp: 0 };
    g.emotes.forEach(function (e) {
      if (cnt[e.by] != null) cnt[e.by]++;
    });
    [
      ["me", "Toi", "opp"],
      ["opp", g.opponent, "me"]
    ].forEach(function (side) {
      var x =
        P[side[1]] ||
        (P[side[1]] = {
          name: side[1],
          games: 0,
          em: 0,
          max: 0,
          burst: 0,
          taunt: 0,
          oneSided: 0,
          recv: 0,
          bad: 0,
          deaf: 0,
          gR: 0,
          eR: 0,
          gO: 0
        });
      var mine = g.emotes.filter(function (e) {
          return e.by === side[0];
        }),
        n = mine.length,
        back = cnt[side[2]];
      var bu = 0,
        last = null;
      mine.forEach(function (e) {
        var t = Date.parse(e.at);
        if (last != null && t - last < 20000) bu++;
        if (!isNaN(t)) last = t;
      });
      var ta = mine.filter(function (e) {
        return e.after && e.after.by !== side[0] && e.after.kind === "farkle";
      }).length;
      // Si tu as coupé les emotes de l'adversaire, ton silence ne veut rien dire : pas de « sans réponse » pour lui.
      var deaf = side[0] === "opp" && (S.emoMute === "all" || (S.emoMute === "ranked" && ctx === "ranked"));
      if (deaf) x.deaf++;
      var one = !deaf && n >= 3 && back === 0;
      x.games++;
      x.em += n;
      x.recv += back;
      x.max = Math.max(x.max, n);
      x.burst += bu;
      x.taunt += ta;
      if (one) x.oneSided++;
      if (ctx === "open") x.gO++;
      else {
        x.gR++;
        x.eR += n;
      }
      var excessive =
        ctx === "open"
          ? (n >= R.perGame || bu >= R.bursts || (one && n >= R.oneSided)) && (deaf || back <= n * R.maxReply)
          : n >= R.perGame || bu >= R.bursts || ta >= R.taunts || (one && n >= R.oneSided);
      if (excessive) x.bad++;
    });
  });
  var L = Object.keys(P)
    .map(function (k) {
      var x = P[k];
      x.rate = x.em / x.games;
      var rk = EMO_RULES.ranked,
        rateR = x.gR >= rk.minGames ? x.eR / x.gR : 0;
      x.flag = x.bad >= EMO_RULES.flagGames || rateR >= rk.rate;
      x.watch = !x.flag && x.bad === 1;
      return x;
    })
    .filter(function (x) {
      return x.em;
    })
    .sort(function (a, b) {
      return b.flag - a.flag || b.watch - a.watch || b.rate - a.rate || b.em - a.em;
    });
  var n = S.more.emo ? 1e9 : lim(8, 15);
  var h =
    '<section class="card"><div class="head"><h2>Modération des emotes</h2><span class="chip x">Équipe uniquement</span></div>' +
    '<div style="margin:4px 0 10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
    seg("emoScope", [
      ["noopen", "Hors amis"],
      ["open", "Amis"],
      ["all", "Toutes"]
    ]) +
    "</div>" +
    '<div style="margin:0 0 10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center"><span class="sub">Tu coupes les emotes adverses :</span>' +
    seg("emoMute", [
      ["none", "Jamais"],
      ["ranked", "En Ranked"],
      ["all", "Toujours"]
    ]) +
    "</div>" +
    '<p class="sub">Lanceurs d\'emotes de la saison' +
    (scope === "noopen" ? ", parties amies exclues" : scope === "open" ? ", parties amies seulement" : "") +
    ". Ici : les joueurs de tes parties capturées ; en production : tous les joueurs.</p>";
  if (!L.length) return h + '<p class="empty">Aucune emote dans ces parties.</p></section>';
  h +=
    '<div class="mrows">' +
    L.slice(0, n)
      .map(function (x) {
        var chip = x.flag
          ? '<span class="chip bad">à surveiller</span>'
          : x.watch
            ? '<span class="chip o">1 partie limite</span>'
            : '<span class="chip">ok</span>';
        return (
          '<div class="mrow"><div class="top">' +
          avatar("", x.name) +
          '<span class="ttl">' +
          esc(x.name) +
          "<small>" +
          x.em +
          " en " +
          x.games +
          " partie" +
          (x.games > 1 ? "s" : "") +
          (scope === "all" && x.gO ? " (" + x.gO + " amie" + (x.gO > 1 ? "s" : "") + ")" : "") +
          " · max " +
          x.max +
          (x.deaf ? " · 🔇" + x.deaf : "") +
          "</small></span>" +
          chip +
          "</div>" +
          '<div class="leg one"><span>Moy.<b>' +
          fmt(x.rate, 1) +
          "</b></span><span>Rafales<b>" +
          x.burst +
          "</b></span><span>Post-farkle<b>" +
          x.taunt +
          "</b></span><span>Sans réponse<b>" +
          x.oneSided +
          "</b></span></div></div>"
        );
      })
      .join("") +
    "</div>" +
    (S.more.emo ? lessBtn("emo") : moreBtn("emo", L.length - n, "Voir tous les joueurs"));
  var rk = EMO_RULES.ranked,
    op = EMO_RULES.open;
  return (
    h +
    '<p class="note"><b>Une partie est jugée excessive</b> selon son type.<br>' +
    "Ranked : " +
    rk.perGame +
    " emotes ou plus, " +
    rk.bursts +
    " rafales, " +
    rk.taunts +
    " emotes après un farkle adverse, ou " +
    rk.oneSided +
    " emotes sans aucune réponse.<br>" +
    "Amis : seulement le spam à sens unique, soit " +
    op.perGame +
    " emotes ou " +
    op.bursts +
    " rafales (ou " +
    op.oneSided +
    " sans réponse) quand l'adversaire en renvoie moins d'une sur " +
    Math.round(1 / op.maxReply) +
    ". Entre amis qui se répondent, rien n'est signalé.<br>" +
    "<b>À surveiller</b> : " +
    EMO_RULES.flagGames +
    " parties excessives, ou " +
    rk.rate +
    " emotes par partie en moyenne en Ranked (sur " +
    rk.minGames +
    " parties minimum). Une seule partie excessive : « 1 partie limite ».<br>" +
    "<b>Mute</b> (🔇 = parties où tu l'avais coupé) : le mute masque l'affichage, mais les emotes de l'adversaire restent dans l'état de la partie, donc elles sont comptées. Seul « Sans réponse » est ignoré pour les parties où tu avais coupé : ton silence n'y prouve rien. En production, le serveur connaît le mute de chaque joueur et le compte de mutes reçus devient lui-même un signal.<br>" +
    "« Moy. » : emotes par partie. « Rafale » : deux emotes à moins de 20 s. « Sans réponse » : parties où le joueur envoie 3 emotes ou plus et l'adversaire aucune. Ce n'est qu'un signal : la décision reste à la modération, avec les signalements des joueurs.</p></section>"
  );
}
function renderProfil() {
  var h = '<a class="back" href="#saison">‹ Retour aux stats</a>';
  if (on("visibilite")) {
    var F = S.games.filter(full),
      R = [];
    F.forEach(function (g) {
      R = R.concat(g.rolls);
    });
    var idx = expF(R) - actF(R);
    var c = S.site ? siteCalc() : null;
    var preview;
    if (S.masked || S.vis === "prive")
      preview =
        '<p class="empty">🔒 Ce joueur garde ses stats privées.</p><p class="sub">Restent visibles : son score et son bilan V/D (comme aujourd\'hui), et la chance de chaque partie sur l\'ardoise que vous avez jouée ensemble.</p>';
    else if (S.vis === "discret")
      preview =
        '<div class="tiles t3">' +
        tile(
          "Chance",
          '<span style="font-size:15px;font-family:var(--font)">' +
            luckLabel(idx, R.length).replace("dans la moyenne", "moyen") +
            "</span>",
          "tendance seulement"
        ) +
        tile(
          "Meilleur tour",
          "+" +
            fmt(
              Math.max.apply(
                null,
                F.map(function (g) {
                  return g.bestTurn || 0;
                }).concat([0])
              )
            )
        ) +
        tile(
          "Succès",
          achievements().filter(function (a) {
            return a.state === "ranked";
          }).length
        ) +
        "</div>";
    else
      preview =
        '<div class="tiles t3">' +
        tile(
          "Chance",
          '<span class="' + (idx >= 0 ? "w" : "l") + '">' + sgn(idx, 1) + "</span>",
          actF(R) + " pour " + fmt(expF(R), 1) + " prévus"
        ) +
        tile(
          "Meilleur tour",
          "+" +
            fmt(
              Math.max.apply(
                null,
                F.map(function (g) {
                  return g.bestTurn || 0;
                }).concat([0])
              )
            )
        ) +
        tile(
          "Succès",
          achievements().filter(function (a) {
            return a.state === "ranked";
          }).length
        ) +
        "</div>";
    h +=
      '<section class="card"><h2>Ce que voient les autres joueurs</h2><div class="head"><span class="sub">Visibilité de tes stats</span>' +
      seg("vis", [
        ["public", "Public"],
        ["discret", "Discret"],
        ["prive", "Privé"]
      ]) +
      "</div>" +
      '<div class="opt"><div><b>Masquer mes stats</b><div class="sub">Cache ton profil de chance et tes records aux autres. Tu continues de tout voir. L\'admin aussi (modération, anti-triche).</div></div><input type="checkbox" class="sw" id="masked"' +
      (S.masked ? " checked" : "") +
      ' aria-label="Masquer mes stats"></div>' +
      '<h3>Aperçu de ton profil vu par un autre joueur</h3><div class="inner" style="padding:14px 16px"><div class="row" style="padding-top:0"><span class="av"></span><div class="grow"><div class="name">Toubli</div><div class="mono"><span class="w">' +
      (c ? c.w : "–") +
      ' V</span> · <span class="l">' +
      (c ? c.n - c.w : "–") +
      ' D</span></div></div><span class="right">' +
      (c ? fmt(c.place.elo) : "") +
      "</span></div>" +
      preview +
      "</div></section>";
  }
  if (on("moderation")) h += emoteBoard();
  h +=
    '<section class="card"><h2>Options du dev (simulation)</h2><p class="sub">Chaque bloc s\'active séparément. Ici tout est activé pour la démo.</p><div class="inner">' +
    Object.keys(OPT)
      .map(function (k) {
        return (
          '<div class="opt"><div><b>' +
          esc(OPT[k].label) +
          '</b><div class="sub">' +
          esc(OPT[k].desc) +
          '</div></div><input type="checkbox" class="sw" data-opt="' +
          k +
          '"' +
          (OPT[k].on ? " checked" : "") +
          ' aria-label="' +
          esc(OPT[k].label) +
          '"></div>'
        );
      })
      .join("") +
    '</div><div style="margin-top:12px"><button class="btn" id="optReset">Rétablir la démo</button></div></section>';
  return h;
}
