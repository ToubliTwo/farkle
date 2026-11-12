// Farkle Stats ChatDeck · Graphiques SVG (courbes, barres).
"use strict";

// ---------- Graphiques ----------
function lineChart(pts, opt) {
  opt = opt || {};
  if (pts.length < 2) return '<p class="empty">Pas assez de données sur la période.</p>';
  var W = 760,
    H = opt.h || 240,
    pl = 44,
    pr = 14,
    pt = 14,
    pb = 26;
  var ys = pts.map(function (p) {
      return p.y;
    }),
    mn = opt.min != null ? opt.min : Math.min.apply(null, ys),
    mx = opt.max != null ? opt.max : Math.max.apply(null, ys);
  var st = opt.step || (mx - mn > 200 ? 50 : 25);
  if (opt.min == null) {
    mn = Math.floor((mn - st / 2) / st) * st;
    mx = Math.ceil((mx + st / 2) / st) * st;
  }
  var x = function (i) {
      return pl + (i / (pts.length - 1)) * (W - pl - pr);
    },
    y = function (v) {
      return pt + ((mx - v) / (mx - mn || 1)) * (H - pt - pb);
    };
  var col = opt.color || "#e9b949",
    s =
      '<svg viewBox="0 0 ' +
      W +
      " " +
      H +
      '" width="100%" role="img" aria-label="' +
      esc(opt.label || "Courbe") +
      '"><defs><linearGradient id="ga' +
      (opt.id || "") +
      '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' +
      col +
      '" stop-opacity=".35"/><stop offset="1" stop-color="' +
      col +
      '" stop-opacity="0"/></linearGradient></defs>';
  for (var v = mn; v <= mx + 1e-9; v += st) {
    s +=
      '<line x1="' +
      pl +
      '" x2="' +
      (W - pr) +
      '" y1="' +
      y(v) +
      '" y2="' +
      y(v) +
      '" stroke="#2a2a34"/><text x="' +
      (pl - 6) +
      '" y="' +
      (y(v) + 4) +
      '" text-anchor="end">' +
      (opt.fmt ? opt.fmt(v) : v) +
      "</text>";
  }
  var P = pts.map(function (p, i) {
    return x(i).toFixed(1) + "," + y(p.y).toFixed(1);
  });
  s +=
    '<polygon fill="url(#ga' +
    (opt.id || "") +
    ')" points="' +
    pl +
    "," +
    y(mn) +
    " " +
    P.join(" ") +
    " " +
    x(pts.length - 1) +
    "," +
    y(mn) +
    '"/><polyline fill="none" stroke="' +
    col +
    '" stroke-width="2" stroke-linejoin="round" points="' +
    P.join(" ") +
    '"/>';
  s +=
    '<circle cx="' +
    x(pts.length - 1) +
    '" cy="' +
    y(pts[pts.length - 1].y) +
    '" r="4.5" fill="' +
    col +
    '" stroke="#18181f" stroke-width="2"/>';
  var seen = {};
  pts.forEach(function (p, i) {
    if (p.lab && !seen[p.lab]) {
      seen[p.lab] = 1;
      var xi = x(i),
        a = xi > W - pr - 40 ? "end" : xi < pl + 30 ? "start" : "middle";
      s += '<text x="' + xi + '" y="' + (H - 6) + '" text-anchor="' + a + '">' + esc(p.lab) + "</text>";
    }
  });
  return s + "</svg>";
}
function bars(items, fmtP, unit) {
  var best = items.reduce(function (b, x, i) {
      return x.n && (b < 0 || x.r > items[b].r) ? i : b;
    }, -1),
    mx = Math.max.apply(
      null,
      items
        .map(function (x) {
          return x.r || 0;
        })
        .concat([0.0001])
    );
  return (
    '<div class="bars">' +
    items
      .map(function (x, i) {
        return (
          '<div class="bi' +
          (i === best ? " best" : "") +
          '"><span class="p">' +
          (x.n ? (fmtP ? fmtP(x.r) : pct(x.r)) : "–") +
          '</span><i style="height:' +
          (x.n ? Math.max(6, (x.r / (fmtP ? mx : 1)) * 130) : 4) +
          'px"></i><span class="lab"><span>' +
          x.lab +
          "</span><b>" +
          (x.sub != null ? x.sub : x.n) +
          "</b></span></div>"
        );
      })
      .join("") +
    "</div>" +
    (unit === false ? "" : '<p class="bunit">Sous chaque barre : nombre de ' + (unit || "parties") + ".</p>")
  );
}
