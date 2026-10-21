/**
 * Contrôle rapide des textes avant le build : longueurs (titre, description, FAQ, bloc citable),
 * nombre de questions, unicité des questions sur tout le site, mots interdits, liens internes.
 * Les contrôles de la factory (check-seo, check-trame…) restent la référence après le build.
 * Une seule page : PAGE=<id> npx vitest run tests/content.test.ts
 */
import { describe, expect, it } from 'vitest';
import { PAGES } from '../src/lib/guides';
import { helpers } from '../src/lib/helpers';
import { ROUTES } from '../src/i18n/routes';
import { HOME } from '../src/content/accueil';
import { MINIS } from '../src/lib/mini-specs';

const strip = (s: string) => s.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');
const words = (s: string) => strip(s).split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
const INTERDITS = [/démarrer ma démarche/i, /faire ma carte grise/i, /carte ?grise ?simple/i, /prestataire habilité siv/i, /en 30 secondes/i, /en moins de 2 minutes/i, /—/, /cartegrisesimple/i, /start my application/i];
const GENERIQUE = /^(simulateur|calculateur|calcul|calculez|calculer|calculator|calculate|à propos|about|méthodologie|methodology|faq|combien|comment|quel|quelle|how|what|when|france|french)\b/i;
const IDS = new Set(ROUTES.map((r) => r.id));

type Entry = { id: string; lang: 'fr' | 'en'; kind: 'pilier' | 'outil' | 'guide'; title: string; description: string; intro: string; resume: string; faqs: { q: string; a: string }[]; body: string };
const entries: Entry[] = [];
for (const lang of ['fr', 'en'] as const) {
  const h = helpers(lang);
  const x = HOME[lang];
  entries.push({ id: 'home', lang, kind: 'pilier', title: x.title, description: x.description, intro: x.intro, resume: x.resume(h), faqs: x.faqs(h), body: x.body(h) });
  for (const p of PAGES) {
    const t = p[lang];
    entries.push({ id: p.id, lang, kind: p.group === 'guides' ? 'guide' : 'outil', title: t.title, description: t.description, intro: t.intro, resume: t.resume(h), faqs: t.faqs(h), body: t.body(h) });
  }
}
const only = process.env.PAGE;
const MIN = { pilier: 2000, outil: 500, guide: 1200 };

describe('pages de contenu', () => {
  for (const e of entries.filter((x) => !only || x.id === only)) {
    describe(`${e.id} (${e.lang})`, () => {
      it('titre 50-60, description 150-160, terme-clé en tête', () => {
        expect(e.title.length, e.title).toBeGreaterThanOrEqual(50);
        expect(e.title.length, e.title).toBeLessThanOrEqual(60);
        expect(e.description.length, e.description).toBeGreaterThanOrEqual(150);
        expect(e.description.length, e.description).toBeLessThanOrEqual(160);
        expect(GENERIQUE.test(e.title), e.title).toBe(false);
      });
      it('bloc citable : un paragraphe d’au moins 120 mots', () => {
        expect(words(e.resume)).toBeGreaterThanOrEqual(120);
        expect(/<p|\n\n/.test(e.resume)).toBe(false);
      });
      it('longueur du texte', () => {
        const total = words(e.resume) + words(e.body) + e.faqs.reduce((s, f) => s + words(f.q) + words(f.a), 0);
        expect(total, `${total} mots`).toBeGreaterThanOrEqual(MIN[e.kind]);
      });
      it('FAQ : nombre de questions et réponses de 40 à 90 mots', () => {
        const [lo, hi] = e.kind === 'pilier' ? [6, 8] : e.kind === 'guide' ? [6, 8] : [3, 5];
        expect(e.faqs.length).toBeGreaterThanOrEqual(lo);
        expect(e.faqs.length).toBeLessThanOrEqual(hi);
        for (const f of e.faqs) {
          const n = words(f.a);
          expect(n, `${n} mots : ${f.q}`).toBeGreaterThanOrEqual(40);
          expect(n, `${n} mots : ${f.q}`).toBeLessThanOrEqual(90);
          expect(/</.test(f.a), `pas de HTML dans la réponse : ${f.q}`).toBe(false);
        }
      });
      it('aucune expression interdite', () => {
        const all = [e.title, e.description, e.intro, e.resume, e.body, ...e.faqs.flatMap((f) => [f.q, f.a])].join(' ');
        for (const r of INTERDITS) expect(r.test(all), String(r)).toBe(false);
      });
      it('liens internes et mini-simulateurs connus', () => {
        for (const m of e.body.matchAll(/<!--mini:([A-Za-z0-9_]+)-->/g)) expect(MINIS[m[1]], m[1]).toBeDefined();
        expect(/href="undefined|href=""/.test(e.body)).toBe(false);
      });
    });
  }
  it('chaque question n’apparaît qu’une fois sur le site', () => {
    const seen = new Map<string, string>();
    const dup: string[] = [];
    for (const e of entries) for (const f of e.faqs) {
      const k = f.q.toLowerCase().replace(/[\s?¿!.]+$/, '');
      if (seen.has(k)) dup.push(`${f.q} (${seen.get(k)} / ${e.id})`); else seen.set(k, e.id);
    }
    expect(dup).toEqual([]);
  });
  it('les pages associées existent', () => {
    for (const p of PAGES) for (const r of p.related) expect(IDS.has(r), `${p.id} → ${r}`).toBe(true);
  });
});
