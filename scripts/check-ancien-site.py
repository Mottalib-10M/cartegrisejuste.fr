#!/usr/bin/env python3
"""Aucune suite de plus de 8 mots en commun avec l'ancien site du même sujet (cahier des charges, §5).

Usage : python3 scripts/check-ancien-site.py [<dossier-ancien-site>] [--n=9] [--verbose]

Lit le texte servi de chaque page du build (dist/, balises retirées ; les <script> sont écartés, car
ils ne portent que le code d'exécution d'Astro et le JSON-LD, dont le texte figure déjà dans la page
visible) et le compare à l'ancien site en lecture seule : son dist/ ET ses sources (src/, textes,
code, données), pour qu'aucune phrase, aucun titre ni aucun libellé de plus de 8 mots ne soit repris.
Seules exceptions : les dénominations officielles et adresses listées dans
`scripts/ancien-site-autorises.txt` (nom d'une loi, d'un code, adresse d'un hébergeur), chacune
précédée d'une ligne de commentaire qui dit pourquoi elle ne peut pas être reformulée. Les mots sont
mis en minuscules, accents gardés, apostrophes unifiées, ponctuation retirée ; les nombres restent
des mots. Une suite commune de 9 mots ou plus = défaut. Sortie 1 s'il y en a.

Vérifié sur un cas connu mauvais (une phrase de l'ancien site collée dans une page de test : signalée)
et un cas connu bon (le build de ce site : 0).
"""
import html, os, re, sys

ANCIEN = next((a for a in sys.argv[1:] if not a.startswith('--')), os.path.expanduser('~/Documents/GitHub/en-ligne/cartegrisesimple.fr'))
N = int(next((a.split('=')[1] for a in sys.argv if a.startswith('--n=')), '9'))
VERB = '--verbose' in sys.argv

ICI = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MOT = re.compile(r"[0-9a-zà-öø-ÿœæ]+", re.I)


def _brut(txt: str):
    txt = html.unescape(txt).replace('’', "'").replace('‘', "'").lower()
    return MOT.findall(txt)


# Dénominations officielles (nom d'une loi, d'un code, d'une autorité, adresse d'un hébergeur) :
# elles ne peuvent pas être reformulées. Chacune est ramenée à un seul mot des deux côtés avant
# la comparaison, si bien qu'elle ne compte plus que pour un mot dans une suite de 9.
DENOMS = []
_p = os.path.join(ICI, 'scripts', 'ancien-site-autorises.txt')
if os.path.isfile(_p):
    _justifie = False
    for ligne in open(_p, encoding='utf-8'):
        ligne = ligne.strip()
        if not ligne:
            continue
        if ligne.startswith('#'):
            _justifie = True
            continue
        if not _justifie:
            sys.exit(f'{_p} : « {ligne} » sans commentaire de justification.')
        DENOMS.append(_brut(ligne))
        _justifie = False
DENOMS.sort(key=len, reverse=True)


def mots(txt: str):
    ws = _brut(txt)
    if not DENOMS:
        return ws
    out, i = [], 0
    while i < len(ws):
        for k, d in enumerate(DENOMS):
            if ws[i:i + len(d)] == d:
                out.append(f'denomination{k}')
                i += len(d)
                break
        else:
            out.append(ws[i])
            i += 1
    return out


def texte_html(doc: str) -> str:
    doc = re.sub(r'<style[\s\S]*?</style>', ' ', doc)
    doc = re.sub(r'<script[\s\S]*?</script>', ' ', doc)
    doc = re.sub(r'<[^>]+>', ' ', doc)
    return doc


def fichiers(racine, exts):
    for d, sous, fs in os.walk(racine):
        sous[:] = [s for s in sous if s not in ('node_modules', '.git', '.astro', '_astro')]
        for f in fs:
            if f.endswith(exts):
                yield os.path.join(d, f)


def ngrams(ws, n):
    return {' '.join(ws[i:i + n]) for i in range(len(ws) - n + 1)}


# Ancien site : build + sources, en lecture seule.
ancien = set()
for f in fichiers(os.path.join(ANCIEN, 'dist'), ('.html',)):
    ancien |= ngrams(mots(texte_html(open(f, encoding='utf-8', errors='ignore').read())), N)
for f in fichiers(os.path.join(ANCIEN, 'src'), ('.astro', '.ts', '.tsx', '.js', '.mjs', '.md', '.mdx', '.json', '.html', '.css')):
    ancien |= ngrams(mots(open(f, encoding='utf-8', errors='ignore').read()), N)
for f in ('README.md',):
    p = os.path.join(ANCIEN, f)
    if os.path.isfile(p):
        ancien |= ngrams(mots(open(p, encoding='utf-8', errors='ignore').read()), N)
if not ancien:
    sys.exit(f"Ancien site illisible ({ANCIEN}) : le contrôle n'a rien comparé, il a échoué.")



pages = list(fichiers(os.path.join(ICI, 'dist'), ('.html',)))
if not pages:
    sys.exit('dist/ vide : lancer npm run build avant.')
defauts = 0
for f in sorted(pages):
    ws = mots(texte_html(open(f, encoding='utf-8').read()))
    communs = sorted(g for g in ngrams(ws, N) if g in ancien)
    if communs:
        defauts += 1
        rel = os.path.relpath(f, os.path.join(ICI, 'dist'))
        print(f'!! {rel} : {len(communs)} suite(s) de {N} mots communes')
        for g in communs[: (50 if VERB else 5)]:
            print(f'     « {g} »')
print(f'Contrôle ancien site : {len(pages)} pages comparées à {len(ancien)} suites de {N} mots de {os.path.basename(ANCIEN)} ; {defauts} page(s) en défaut.')
sys.exit(1 if defauts else 0)
