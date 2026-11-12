#!/usr/bin/env python3
"""Prépare data/demo.jsonl à partir de captures brutes : trames utiles seulement, adversaires pseudonymisés.

Usage : python3 tools/anonymise-demo.py captures.jsonl [Pseudo_du_joueur]
Les pseudos, logins et identifiants Twitch des adversaires sont remplacés dans toutes les chaînes
(états de partie, page « Mes stats », texte des ardoises), et leurs avatars retirés.
"""
import json, re, sys

src = sys.argv[1]
ME = sys.argv[2] if len(sys.argv) > 2 else "Toubli"
TWITCH_AV = re.compile(r"https://static-cdn\.jtvnw\.net/jtv_user_pictures/\S+")

def useful(o):
    s, u = o.get("src"), o.get("url") or ""
    if s == "marker": return o.get("text") != "diagnostic"
    if s == "dom": return isinstance(o.get("dom"), dict) and bool(o["dom"].get("ardoise"))
    if s == "http-in" and isinstance(o.get("json"), (dict, list)):
        return bool(re.search(r"/farkle/api/partie/\d+$", u) or re.search(r"/farkle/stats/__data\.json$", u))
    return False

frames = [o for o in (json.loads(l) for l in open(src, encoding="utf-8") if l.strip()) if useful(o)]
for o in frames:
    for k in ("sid", "handler", "injectInto"): o.pop(k, None)

# 1. Recenser les adversaires : joueurs des états de partie + table « opps » de la page Mes stats (format devalue).
names, ids, my_av = set(), set(), None
def scan(x):
    global my_av
    if isinstance(x, dict):
        if "name" in x and "avatar" in x:          # joueur d'un état de partie
            if x["name"] == ME: my_av = x.get("avatar")
            else: names.add(x["name"])
        for v in x.values(): scan(v)
    elif isinstance(x, list):
        for v in x: scan(v)
for o in frames:
    if "/partie/" in (o.get("url") or ""): scan(o["json"])
for o in frames:
    if (o.get("url") or "").endswith("__data.json"):
        for nd in o["json"].get("nodes", []):
            data = (nd or {}).get("data")
            if not isinstance(data, list): continue
            for d in data:   # objets {login, name, av} de la table des adversaires
                if isinstance(d, dict) and {"login", "name", "av"} <= set(d):
                    for k in ("login", "name"):
                        v = data[d[k]] if isinstance(d[k], int) and d[k] < len(data) else d[k]
                        if isinstance(v, str) and v.lower() != ME.lower(): names.add(v)
            for d in data:   # clés de la table opps = identifiants Twitch
                if isinstance(d, dict) and d and all(re.fullmatch(r"\d{5,}", k) for k in d): ids.update(d)
# Les adversaires des ardoises : la ligne qui suit « Toi » dans le texte de l'ardoise.
for o in frames:
    if o.get("src") == "dom":
        m = re.search(r"\nToi\n([^\n]+)\n", o["dom"]["ardoise"])
        if m: names.add(m.group(1).strip())
names.discard(ME)

# 2. Un pseudonyme par personne (login et nom affiché regroupés quand ils ne diffèrent que par la casse).
groups = {}
for n in sorted(names, key=str.lower): groups.setdefault(n.lower(), set()).add(n)
pseudo = {}
for i, key in enumerate(sorted(groups), 1):
    for n in groups[key]: pseudo[n] = "Joueur%02d" % i
idmap = {oid: str(91000000 + i) for i, oid in enumerate(sorted(ids), 1)}
pat = re.compile(r"(?<![A-Za-z0-9_])(" + "|".join(re.escape(n) for n in sorted(pseudo, key=len, reverse=True)) + r")(?![A-Za-z0-9_])")

def clean(x):
    if isinstance(x, str):
        if x in idmap: return idmap[x]
        x = pat.sub(lambda m: pseudo[m.group(1)], x)
        return TWITCH_AV.sub(lambda m: m.group(0) if m.group(0) == my_av else "", x)
    if isinstance(x, dict): return {(idmap.get(k, k)): clean(v) for k, v in x.items()}
    if isinstance(x, list): return [clean(v) for v in x]
    return x

out = [clean(o) for o in frames]
text = "\n".join(json.dumps(o, ensure_ascii=False, separators=(",", ":")) for o in out) + "\n"
left = sorted({n for n in pseudo if re.search(r"(?<![A-Za-z0-9_])" + re.escape(n) + r"(?![A-Za-z0-9_])", text)})
open("data/demo.jsonl", "w", encoding="utf-8").write(text)
print("%d trames, %d adversaires pseudonymisés, %d identifiants remplacés, noms restants : %s"
      % (len(out), len(groups), len(idmap), left or "aucun"))
