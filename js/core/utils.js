// Farkle Stats ChatDeck · Utilitaires : DOM, formats français, dates.
"use strict";

// ---------- Utilitaires ----------
function $(id) {
  return document.getElementById(id);
}
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function fmt(n, d) {
  if (n == null || !isFinite(n)) return "–";
  return n.toLocaleString("fr-FR", { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 });
}
function sgn(n, d) {
  if (n == null || !isFinite(n)) return "–";
  var f = Math.pow(10, d || 0),
    r = Math.round(n * f) / f;
  return (r > 0 ? "+" : r < 0 ? "−" : "") + fmt(Math.abs(r), d);
}
function pct(x, d) {
  return x == null || !isFinite(x) ? "–" : fmt(x * 100, d || 0) + "\u00a0%";
}
function dayKey(t) {
  var d = new Date(t);
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}
function dayLabel(k) {
  var p = k.split("-");
  return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
}
function dayShort(k) {
  var p = k.split("-");
  return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
}
function kfmt(v) {
  return v >= 1000 ? (v % 1000 ? fmt(v / 1000, 1) : v / 1000) + "k" : "" + v;
}
function hhmm(t) {
  return new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
function dshort(t) {
  return new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
function tile(k, v, h) {
  return (
    '<div class="tile"><span class="k">' +
    k +
    '</span><span class="v">' +
    v +
    '</span><span class="h">' +
    (h || "&nbsp;") +
    "</span></div>"
  );
}
function seg(key, opts) {
  return (
    '<div class="seg" data-k="' +
    key +
    '">' +
    opts
      .map(function (o) {
        return '<button data-v="' + o[0] + '" aria-pressed="' + (S[key] === o[0]) + '">' + o[1] + "</button>";
      })
      .join("") +
    "</div>"
  );
}
function payload(f) {
  var j = f.json;
  if (typeof j === "string") {
    if (/…\[tronqué\]$/.test(j)) return null;
    try {
      j = JSON.parse(j);
    } catch (e) {
      return null;
    }
  }
  if (!j && typeof f.text === "string" && !/…\[tronqué\]$/.test(f.text)) {
    try {
      j = JSON.parse(f.text.split("\n")[0]);
    } catch (e) {
      return null;
    }
  }
  return j || null;
}
function unflatten(values) {
  var cache = new Map();
  function h(i) {
    if (i === -1 || i === -2) return undefined;
    if (i === -3) return NaN;
    if (i === -4) return Infinity;
    if (i === -5) return -Infinity;
    if (i === -6) return -0;
    if (cache.has(i)) return cache.get(i);
    var v = values[i],
      r;
    if (Array.isArray(v)) {
      if (typeof v[0] === "string") {
        var t = v[0];
        if (t === "Date") {
          r = Date.parse(v[1]);
          cache.set(i, r);
          return r;
        }
        if (t === "Set") {
          r = [];
          cache.set(i, r);
          for (var a = 1; a < v.length; a++) r.push(h(v[a]));
          return r;
        }
        if (t === "Map" || t === "null") {
          r = {};
          cache.set(i, r);
          for (var b = 1; b < v.length; b += 2) r[t === "Map" ? String(h(v[b])) : v[b]] = h(v[b + 1]);
          return r;
        }
        if (t === "BigInt") {
          r = Number(v[1]);
          cache.set(i, r);
          return r;
        }
        if (t === "RegExp" || t === "URL" || t === "Object") {
          r = v[1];
          cache.set(i, r);
          return r;
        }
      }
      r = [];
      cache.set(i, r);
      v.forEach(function (x) {
        r.push(h(x));
      });
      return r;
    }
    if (v && typeof v === "object") {
      r = {};
      cache.set(i, r);
      Object.keys(v).forEach(function (k) {
        r[k] = h(v[k]);
      });
      return r;
    }
    cache.set(i, v);
    return v;
  }
  return h(0);
}
function cardImg(p) {
  return p ? (/^https?:/.test(p) ? p : "https://chatdeck.fr" + p) : "";
}
