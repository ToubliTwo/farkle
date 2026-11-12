// Farkle Stats ChatDeck · Saison : victoires par heure, par jour, selon la série et selon la fatigue.
"use strict";

// ---------- Moments ----------
function renderMom() {
  if (!S.site) return needSite();
  var c = siteCalc(),
    H = c.cfg.hours || [0, 9, 14, 18, 21, 24],
    minSlot = c.cfg.minSlot || 5;
  var slots = [];
  for (var i = 0; i < H.length - 1; i++)
    slots.push({ lab: H[i] + "–" + H[i + 1] + " h", a: H[i], b: H[i + 1], n: 0, w: 0, d: 0 });
  c.D.forEach(function (d) {
    var hr = new Date(d.at).getHours();
    slots.forEach(function (s) {
      if (hr >= s.a && hr < s.b) {
        s.n++;
        s.d += d.d;
        if (d.won) s.w++;
      }
    });
  });
  slots.forEach(function (s) {
    s.r = s.n ? s.w / s.n : 0;
  });
  var ser = [
    { lab: "2 D et +", n: 0, w: 0 },
    { lab: "1 D", n: 0, w: 0 },
    { lab: "1 V", n: 0, w: 0 },
    { lab: "2 V et +", n: 0, w: 0 }
  ];
  var run = 0;
  c.D.forEach(function (d) {
    if (run !== 0) {
      var k = run <= -2 ? 0 : run === -1 ? 1 : run === 1 ? 2 : 3;
      ser[k].n++;
      if (d.won) ser[k].w++;
    }
    run = d.won ? (run > 0 ? run + 1 : 1) : run < 0 ? run - 1 : -1;
  });
  ser.forEach(function (s) {
    s.r = s.n ? s.w / s.n : 0;
  });
  var wd = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."].map(function (l) {
    return { lab: l, n: 0, w: 0 };
  });
  c.D.forEach(function (d) {
    var k = (new Date(d.at).getDay() + 6) % 7;
    wd[k].n++;
    if (d.won) wd[k].w++;
  });
  wd.forEach(function (s) {
    s.r = s.n ? s.w / s.n : 0;
  });
  var ses = [
      { lab: "1re à 5e", a: 1, b: 5, n: 0, w: 0 },
      { lab: "6e à 15e", a: 6, b: 15, n: 0, w: 0 },
      { lab: "16e à 30e", a: 16, b: 30, n: 0, w: 0 },
      { lab: "31e et +", a: 31, b: 1e9, n: 0, w: 0 }
    ],
    cnt = {};
  c.D.forEach(function (d) {
    var k = dayKey(d.at);
    cnt[k] = (cnt[k] || 0) + 1;
    ses.forEach(function (s) {
      if (cnt[k] >= s.a && cnt[k] <= s.b) {
        s.n++;
        if (d.won) s.w++;
      }
    });
  });
  ses.forEach(function (s) {
    s.r = s.n ? s.w / s.n : 0;
  });
  var bs = slots
    .filter(function (s) {
      return s.n >= minSlot;
    })
    .sort(function (a, b) {
      return b.r - a.r;
    })[0];
  return (
    '<section class="card"><h2>Victoires par heure</h2>' +
    (bs
      ? '<p class="sub">Ton meilleur créneau : <b style="color:var(--ink)">' +
        bs.lab +
        "</b>, " +
        pct(bs.r) +
        " de victoires (" +
        sgn(bs.d) +
        " points).</p>"
      : "") +
    bars(slots) +
    "</section>" +
    '<section class="card"><h2>Selon ta série</h2><p class="sub">Après deux défaites, tu gagnes ' +
    pct(ser[0].r) +
    " de tes parties" +
    (ser[0].r < 0.5 ? ". Une pause peut payer." : ".") +
    "</p>" +
    bars(ser) +
    "</section>" +
    '<section class="card"><h2>Selon le jour</h2>' +
    bars(wd) +
    "</section>" +
    '<section class="card"><h2>Fatigue dans la journée</h2><p class="sub">Ton % de victoires selon le nombre de parties déjà jouées ce jour-là.</p>' +
    bars(ses) +
    "</section>"
  );
}
