// Farkle Stats ChatDeck · Partage d'une ardoise (image, texte).
"use strict";

// ---------- Partage ----------
function shareText(g) {
  var t =
    "🎲 Farkle ChatDeck · " +
    (g.result === "win" ? "Victoire" : "Défaite") +
    " " +
    g.myScore +
    " – " +
    g.oppScore +
    " contre " +
    g.opponent +
    (g.mode === "ranked" ? " (Ranked)" : " (Amis)") +
    "\n";
  t +=
    "Tours : " +
    (g.turnLog || [])
      .map(function (x) {
        return x.bust ? "F" : "+" + x.pts + (x.hot ? "✦" : "");
      })
      .join(" ") +
    "\n";
  t +=
    "Meilleur tour +" +
    (g.bestTurn || 0) +
    " · " +
    (g.farkles || 0) +
    " farkle(s)" +
    (g.luck != null ? " · chance " + sgn(g.luck, 1) : "");
  return t;
}
function shareImage(g) {
  var me = g.turnLog || [],
    op = g.oppTurnLog || [],
    rows = Math.max(me.length, op.length),
    W = 720,
    H = 190 + rows * 38 + 70;
  var cv = document.createElement("canvas");
  cv.width = W * 2;
  cv.height = H * 2;
  var x = cv.getContext("2d");
  x.scale(2, 2);
  x.fillStyle = "#5b3a20";
  x.fillRect(0, 0, W, H);
  var gr = x.createRadialGradient(W * 0.3, 60, 40, W * 0.5, H * 0.5, W * 0.8);
  gr.addColorStop(0, "#2c3b34");
  gr.addColorStop(1, "#1d2a24");
  x.fillStyle = gr;
  x.fillRect(14, 14, W - 28, H - 28);
  x.fillStyle = "#ecebe3";
  x.font = "34px 'Patrick Hand', cursive";
  x.fillText("L'Ardoise du tavernier", 36, 64);
  x.font = "20px 'Patrick Hand', cursive";
  x.fillStyle = "#c9c8bd";
  x.fillText(
    (g.result === "win" ? "Victoire " : "Défaite ") +
      g.myScore +
      " – " +
      g.oppScore +
      (g.mode === "ranked" ? " · Ranked" : " · Amis") +
      " · " +
      dshort(Date.parse(g.date)),
    36,
    96
  );
  x.fillStyle = "#ecebe3";
  x.font = "24px 'Patrick Hand', cursive";
  x.fillText("N°", 36, 140);
  x.fillText("Toi", 110, 140);
  x.fillText(g.opponent, 410, 140);
  x.setLineDash([8, 6]);
  x.strokeStyle = "#e9b949aa";
  x.beginPath();
  x.moveTo(100, 152);
  x.lineTo(390, 152);
  x.stroke();
  x.strokeStyle = "#7fb0ffaa";
  x.beginPath();
  x.moveTo(400, 152);
  x.lineTo(W - 36, 152);
  x.stroke();
  x.setLineDash([]);
  var cm = 0,
    co = 0;
  for (var i = 0; i < rows; i++) {
    var y = 190 + i * 38,
      a = me[i],
      b = op[i];
    x.fillStyle = "#ecebe3";
    x.font = "22px 'Patrick Hand', cursive";
    x.fillText(String(i + 1), 40, y);
    [
      [a, 110, "me"],
      [b, 410, "op"]
    ].forEach(function (c) {
      var t = c[0];
      if (!t) {
        x.fillText("–", c[1], y);
        return;
      }
      if (t.bust) {
        x.fillStyle = "#ff8f8f";
        x.fillText("F  −" + t.pts, c[1], y);
        x.fillStyle = "#ecebe3";
        return;
      }
      if (c[2] === "me") cm += t.pts;
      else co += t.pts;
      x.fillText(fmt(c[2] === "me" ? cm : co), c[1], y);
      x.fillStyle = "#cfd0c4";
      x.font = "17px 'Patrick Hand', cursive";
      x.fillText("+" + fmt(t.pts) + (t.hot ? " ✦" : ""), c[1] + 90, y);
      x.fillStyle = "#ecebe3";
      x.font = "22px 'Patrick Hand', cursive";
    });
  }
  var fy = 190 + rows * 38 + 10;
  x.strokeStyle = "#ffffff33";
  x.beginPath();
  x.moveTo(36, fy - 20);
  x.lineTo(W - 36, fy - 20);
  x.stroke();
  x.fillStyle = "#e9b949";
  x.font = "28px 'Patrick Hand', cursive";
  x.fillText("Total " + fmt(g.myScore), 36, fy + 14);
  x.fillStyle = "#9cbcff";
  x.fillText(fmt(g.oppScore), 410, fy + 14);
  x.fillStyle = "#c9c8bd";
  x.font = "16px 'Patrick Hand', cursive";
  x.fillText("chatdeck.fr · Farkle", W - 190, H - 26);
  var a2 = document.createElement("a");
  a2.download = "ardoise-" + g.id + ".png";
  a2.href = cv.toDataURL("image/png");
  document.body.appendChild(a2);
  a2.click();
  a2.remove();
}
