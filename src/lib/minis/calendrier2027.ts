import { coutCarteGrise } from '../engine/carte-grise';
import { T, eur, eur2, regionOpts, regionAt, regionIndex, ANNEE, iso, type L } from './_kit';
/** La même voiture neuve immatriculée en décembre de cette année ou en janvier de l'année suivante. */
export function avantApres(region: string, cv: number, g: number, kg: number) {
  const base = { demarche: 'immat' as const, region, origine: 'france_neuf' as const, energie: 'essence' as const, genre: 'vp' as const, cv, gkm: g, masseKg: kg, ptacKg: 0 };
  const a = coutCarteGrise({ ...base, date1re: iso(ANNEE, 12, 15), dateOp: iso(ANNEE, 12, 15) });
  const b = coutCarteGrise({ ...base, date1re: iso(ANNEE + 1, 1, 15), dateOp: iso(ANNEE + 1, 1, 15) });
  return { a, b };
}
export default (l: L) => ({
  title: T(l, `Décembre ${ANNEE} ou janvier ${ANNEE + 1} : la même voiture neuve`, `December ${ANNEE} or January ${ANNEE + 1}: the same new car`),
  cta: T(l, 'Calcul complet à une autre date', 'Full calculation at another date'),
  inputs: [
    { id: 'r', label: T(l, 'Région', 'Region'), def: regionIndex('ile-de-france'), options: regionOpts(l) },
    { id: 'cv', label: T(l, 'Puissance fiscale', 'Fiscal horsepower'), def: 7, unit: 'CV', max: 200 },
    { id: 'g', label: T(l, 'CO₂ WLTP', 'CO₂ WLTP'), def: 125, unit: 'g/km', max: 1000 },
    { id: 'kg', label: T(l, 'Masse', 'Mass'), def: 1550, unit: 'kg', max: 10000 },
  ],
  run: ({ r, cv, g, kg }: Record<string, number>) => {
    const { a, b } = avantApres(regionAt(r).id, cv, g, kg);
    return {
      head: [T(l, `Écart en attendant janvier ${ANNEE + 1}`, `Difference by waiting for January ${ANNEE + 1}`), eur(b.total - a.total, l)] as [string, string],
      rows: [
        [T(l, `Décembre ${ANNEE}`, `December ${ANNEE}`), eur2(a.total, l)],
        [T(l, `Janvier ${ANNEE + 1}`, `January ${ANNEE + 1}`), eur2(b.total, l)],
        [T(l, 'dont malus, avant puis après', 'of which malus, before then after'), `${eur(a.malus.total, l)} → ${eur(b.malus.total, l)}`],
      ] as [string, string][],
      note: T(l, 'Tarifs régionaux de l’année suivante : ceux déjà votés, sinon les tarifs actuels.', 'Next year’s regional rates: those already voted, otherwise current rates.'),
    };
  },
});
