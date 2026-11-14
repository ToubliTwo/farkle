// Farkle Stats ChatDeck · Rendu, événements et chargement des données. Chargé en dernier.
"use strict";

// ---------- Rendu ----------
var TABS = [
  ["saison", "Saison"],
  ["jeu", "Mon jeu"],
  ["parties", "Parties"],
  ["adv", "Adversaires"],
  ["trophees", "Trophées"]
];
var ALIAS = {
  score: "saison",
  mom: "saison",
  hist: "parties",
  ardoises: "parties",
  records: "trophees",
  succes: "trophees",
  ana: ["jeu", "decisions"],
  chance: ["jeu", "chance"],
  cartes: ["jeu", "cartes"],
  profil: "reglages"
};
function render() {
  $("lock").hidden = !(on("verrouPendantPartie") && S.live);
  $("rankAlert").innerHTML = rankAlertHTML();
  renderHero();
  var vis = TABS.filter(function (t) {
    return !t[2] || on(t[2]);
  });
  if (ALIAS[S.tab]) {
    var al = ALIAS[S.tab];
    if (Array.isArray(al)) {
      S.tab = al[0];
      S.jeuView = al[1];
    } else S.tab = al;
  }
  if (
    S.tab !== "reglages" &&
    !vis.some(function (t) {
      return t[0] === S.tab;
    })
  )
    S.tab = "saison";
  $("tabs").innerHTML = vis
    .map(function (t) {
      return (
        '<button role="tab" aria-selected="' +
        (S.tab === t[0]) +
        '" data-tab="' +
        t[0] +
        '">' +
        t[1] +
        "</button>"
      );
    })
    .join("");
  var map = {
    saison: renderSaison,
    parties: renderPartiesAll,
    adv: renderAdv,
    jeu: renderJeu,
    trophees: renderTrophees,
    reglages: renderProfil
  };
  $("view").innerHTML = (map[S.tab] || renderSaison)();
  var q = $("histQ");
  if (q)
    q.addEventListener("input", function (e) {
      S.histQ = e.target.value;
      S.histN = 60;
      var pos = e.target.selectionStart;
      render();
      var n = $("histQ");
      n.focus();
      n.setSelectionRange(pos, pos);
    });
  var m = $("histMore");
  if (m)
    m.addEventListener("click", function () {
      S.histN += 100;
      render();
    });
}
document.addEventListener("click", function (e) {
  var t = e.target.closest("#tabs button");
  if (t) {
    stopPlay();
    S.tab = t.dataset.tab;
    S.view = null;
    history.replaceState(null, "", "#" + S.tab);
    render();
    return;
  }
  var rp = e.target.closest("[data-rp]");
  if (rp) {
    var a = rp.dataset.rp;
    if (a === "play") togglePlay();
    else {
      stopPlay();
      goStep(a === "first" ? 0 : a === "last" ? 1e9 : a === "prev" ? S.step - 1 : S.step + 1);
    }
    return;
  }
  var sc = e.target.closest("[data-scroll]");
  if (sc) {
    var tg = document.getElementById(sc.dataset.scroll);
    if (tg) tg.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  var gs = e.target.closest("[data-go]");
  if (gs) {
    stopPlay();
    goStep(+gs.dataset.go);
    return;
  }
  var op = e.target.closest("[data-opp]");
  if (op) {
    S.histQ = op.dataset.opp;
    S.partMode = "all";
    S.histFilter = "all";
    location.hash = "parties";
    return;
  }
  var mo = e.target.closest("[data-more]");
  if (mo) {
    S.more[mo.dataset.more] = true;
    render();
    return;
  }
  var le = e.target.closest("[data-less]");
  if (le) {
    S.more[le.dataset.less] = false;
    render();
    var anchor = document.querySelector('[data-more="' + le.dataset.less + '"]');
    if (anchor) anchor.scrollIntoView({ block: "center" });
    return;
  }
  var md = e.target.closest("[data-moredays]");
  if (md) {
    S.more.days = (S.more.days || lim(5, 7)) + 7;
    render();
    return;
  }
  var pg = e.target.closest("[data-page]");
  if (pg) {
    S.partPage += +pg.dataset.page;
    render();
    return;
  }
  var s = e.target.closest(".seg button");
  if (s) {
    var k = s.parentNode.dataset.k;
    S[k] = s.dataset.v;
    if (k === "vis") {
      try {
        localStorage.setItem("fk-vis", S.vis);
      } catch (x) {}
    }
    if (k === "emoMute") {
      try {
        localStorage.setItem("fk-emomute", S.emoMute);
      } catch (x) {}
    }
    render();
    return;
  }
  var si = e.target.closest("[data-share-img]");
  if (si) {
    var g = S.games.find(function (x) {
      return x.id === si.dataset.shareImg;
    });
    if (g) shareImage(g);
    return;
  }
  var st = e.target.closest("[data-share-txt]");
  if (st) {
    var g2 = S.games.find(function (x) {
      return x.id === st.dataset.shareTxt;
    });
    if (g2 && navigator.clipboard)
      navigator.clipboard.writeText(shareText(g2)).then(
        function () {
          st.textContent = "✓ Copié";
        },
        function () {
          st.textContent = "Copie refusée";
        }
      );
    return;
  }
  if (e.target.id === "optReset") {
    Object.keys(OPT).forEach(function (k) {
      OPT[k].on = DEFAULT_OPTIONS[k].on;
    });
    saveOpt();
    render();
  }
});
document.addEventListener("change", function (e) {
  if (e.target.dataset && e.target.dataset.opt) {
    OPT[e.target.dataset.opt].on = e.target.checked;
    saveOpt();
    render();
  }
  if (e.target.id === "masked") {
    S.masked = e.target.checked;
    try {
      localStorage.setItem("fk-masked", S.masked ? "1" : "0");
    } catch (x) {}
    render();
  }
});
window.addEventListener("hashchange", function () {
  route();
  render();
  window.scrollTo({ top: document.getElementById("tabs").offsetTop - 10 });
});
document.addEventListener("keydown", function (e) {
  if (
    !S.view ||
    !S.steps ||
    (/INPUT|TEXTAREA/.test((e.target || {}).tagName || "") && e.target.type !== "range")
  )
    return;
  if (e.key === "ArrowRight") {
    e.preventDefault();
    stopPlay();
    goStep(S.step + 1);
  }
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    stopPlay();
    goStep(S.step - 1);
  }
  if (e.key === " ") {
    e.preventDefault();
    togglePlay();
  }
});
document.addEventListener("input", function (e) {
  if (e.target.id === "rpRange") {
    stopPlay();
    goStep(+e.target.value);
  }
  if (e.target.id === "wpMy" || e.target.id === "wpOpp") {
    S[e.target.id === "wpMy" ? "wpMy" : "wpOpp"] = +e.target.value;
    $("wpMyV").textContent = fmt(S.wpMy);
    $("wpOpV").textContent = fmt(S.wpOpp);
    $("wpRes").innerHTML = seuilRes();
  }
});

function done(label) {
  $("src").textContent =
    label +
    " · " +
    S.games.length +
    " parties détaillées" +
    (S.site ? " · historique Ranked : " + (S.site.stats.duels || []).length + " parties" : "") +
    " · mis à jour à " +
    hhmm(Date.now());
  render();
}
$("files").addEventListener("change", function (e) {
  var fs = Array.prototype.slice.call(e.target.files || []);
  if (!fs.length) return;
  Promise.all(
    fs.map(function (f) {
      return f.text();
    })
  ).then(function (t) {
    ingest(t.join("\n"));
    done(fs.length + " fichier(s)");
  });
});
// Sources de données, dans l'ordre :
// 1. le collecteur local (http://127.0.0.1:47321/api/raw), mis à jour toutes les 20 s ;
// 2. le fichier de démonstration data/demo.jsonl, quand la page est hébergée ailleurs ;
// 3. des fichiers chargés à la main, si rien d'autre n'a répondu.
var DEMO_URL = "data/demo.jsonl";
var served = /^(127\.0\.0\.1|localhost)$/.test(location.hostname) && location.port === "47321";
var lastLen = -1;
function load() {
  return fetch("/api/raw", { cache: "no-store" })
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    })
    .then(function (t) {
      if (t.length === lastLen) return; // rien de nouveau : on ne touche pas à la page
      if (S.view && lastLen > 0) {
        lastLen = t.length;
        var keep = { view: S.view, step: S.step };
        ingest(t);
        S.steps = null;
        S.view = keep.view;
        render();
        goStep(keep.step);
        return;
      }
      lastLen = t.length;
      var was = S.live;
      ingest(t);
      if (was && !S.live && !S.view) {
        S.tab = "jeu";
        S.jeuView = "decisions";
      } // partie terminée : direction l'analyse
      done("Collecteur local");
    });
}
function showLoader(msg) {
  $("src").textContent = msg;
  $("loader").hidden = false;
  render();
}
function scrollToTabs() {
  if (S.view) {
    var t = $("tabs");
    if (t) window.scrollTo({ top: t.offsetTop - 10 });
  }
}

// Garde-fou : un bloqueur de publicité ou un envoi incomplet peut empêcher un fichier de se charger.
var REQUIRED = [
  "renderSaison",
  "renderJeu",
  "renderAna",
  "renderChance",
  "renderCartes",
  "renderPartiesAll",
  "renderReplay",
  "renderAdv",
  "renderTrophees",
  "renderProfil",
  "WP",
  "decodeRaw"
];
var missing = REQUIRED.filter(function (n) {
  return typeof window[n] === "undefined";
});
if (missing.length) {
  var warn = document.createElement("p");
  warn.className = "note";
  warn.style.cssText = "border:1px solid var(--loss);border-radius:12px;padding:10px 14px";
  warn.textContent =
    "Fichier JS manquant (" +
    missing.join(", ") +
    ") : vérifier l'envoi sur le serveur, ou désactiver le bloqueur de publicité pour ce site.";
  document.getElementById("tabs").before(warn);
}

route();
setInterval(function () {
  if (!document.hidden) $("rankAlert").innerHTML = rankAlertHTML(); // compte à rebours jusqu'à minuit
}, 60000);
if (served) {
  load()
    .then(scrollToTabs)
    .catch(function () {
      showLoader("Collecteur injoignable : charge les fichiers à la main.");
    });
  setInterval(function () {
    if (!document.hidden) load().catch(function () {});
  }, 20000); // fin de partie détectée sous 20 s
} else {
  fetch(DEMO_URL, { cache: "no-store" })
    .then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    })
    .then(function (t) {
      ingest(t);
      done("Démo · captures du 12 nov. 2026");
      scrollToTabs();
    })
    .catch(function () {
      showLoader("Charge tes fichiers de capture.");
    });
}
