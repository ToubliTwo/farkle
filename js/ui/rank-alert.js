// Farkle Stats ChatDeck · Bandeau d'alerte : points de classement en jeu pour le top 10 (quota de parties du jour).
"use strict";

// Règle du site : dans le top 10, moins de 5 parties classées dans la journée coûtent 30 points.
// Le quota vient de la page « Mes stats » quand elle a été capturée (champ quota), sinon de RANK_GUARD.
function rankGuard() {
  if (!on("alerteClassement") || !S.site || !S.site.stats) return null;
  var place = S.site.stats.place || {},
    rank = place.rank;
  if (!rank || rank > RANK_GUARD.top) return null;
  var quota = S.site.quota || RANK_GUARD.quota,
    now = new Date(),
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(),
    end = start + 864e5,
    ids = {};
  // Parties classées du jour : historique du site + parties capturées depuis (sans doublon).
  (S.site.stats.duels || []).forEach(function (d) {
    if (d.at >= start && d.at < end) ids["s" + d.id] = 1;
  });
  S.games.forEach(function (g) {
    var t = Date.parse(g.date);
    if (g.mode === "ranked" && (!g.status || g.status === "done") && t >= start && t < end)
      ids["s" + String(g.id).replace(/^cdp-/, "")] = 1;
  });
  var played = Object.keys(ids).length;
  if (played >= quota) return null;
  return {
    rank: rank,
    played: played,
    quota: quota,
    left: quota - played,
    end: end,
    penalty: RANK_GUARD.penalty
  };
}

function rankAlertHTML() {
  var r = rankGuard();
  if (!r) return "";
  var ms = r.end - Date.now(),
    h = Math.floor(ms / 36e5),
    m = Math.floor((ms % 36e5) / 6e4),
    reste = h ? h + " h " + String(m).padStart(2, "0") : m + " min";
  return (
    '<div class="rankalert" role="status"><span class="ic">⚠️</span><div><b>' +
    r.penalty +
    " points de classement en jeu</b><span>Tu es " +
    r.rank +
    (r.rank === 1 ? "<sup>er</sup>" : "<sup>e</sup>") +
    " : joue encore " +
    r.left +
    " partie" +
    (r.left > 1 ? "s" : "") +
    " classée" +
    (r.left > 1 ? "s" : "") +
    " avant minuit (" +
    reste +
    ") pour ne pas les perdre. Aujourd'hui : " +
    r.played +
    " sur " +
    r.quota +
    ".</span></div></div>"
  );
}
