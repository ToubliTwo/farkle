#!/usr/bin/env python3
"""Convertit base.bin (sortie du solveur) en js/model/wp-data.js.

Usage, depuis la racine du projet :
    gcc -O2 -o wp tools/farkle-wp-solveur.c -lm && ./wp      # ~15 s, écrit base.bin
    python3 tools/encode-wp.py base.bin                      # réécrit js/model/wp-data.js
"""
import base64, struct, sys

G = 80  # objectif 4 000 / 50
src = sys.argv[1] if len(sys.argv) > 1 else "base.bin"
vals = struct.unpack("%df" % (G * G), open(src, "rb").read())
q = struct.pack("<%dH" % (G * G), *[max(0, min(65535, round(v * 65535))) for v in vals])
b64 = base64.b64encode(q).decode()
open("js/model/wp-data.js", "w", encoding="utf-8").write(
    "// Farkle Stats ChatDeck · Table précalculée du modèle de victoire (générée par tools/farkle-wp-solveur.c).\n"
    "// 6 400 valeurs sur 16 bits (base64) : P(ton score, son score) au début de ton tour, par pas de 50 points.\n"
    '"use strict";\n\nvar WP_BASE =\n  "' + b64 + '";\n'
)
print("js/model/wp-data.js écrit (%d caractères)" % len(b64))
