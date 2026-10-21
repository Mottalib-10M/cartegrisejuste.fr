import { coutCarteGrise } from '../engine/carte-grise';
import { T, eur2, regionOpts, regionAt, regionIndex, JOUR, ANNEE, iso, type L } from './_kit';
/** Acheter une voiture juste avant ou juste après ses dix ans : la moitié de la taxe régionale. */
export default (l: L) => ({
  title: T(l, 'Ce que fait gagner le passage des 10 ans', 'What the ten-year mark saves'),
  cta: T(l, 'Calcul complet au mois près', 'Full calculation to the month'),
  inputs: [
    { id: 'r', label: T(l, 'Région', 'Region'), def: regionIndex('provence-alpes-cote-dazur'), options: regionOpts(l) },
    { id: 'cv', label: T(l, 'Puissance fiscale', 'Fiscal horsepower'), def: 7, unit: 'CV', max: 200 },
  ],
  run: ({ r, cv }: Record<string, number>) => {
    const reg = regionAt(r);
    const base = { demarche: 'titulaire' as const, region: reg.id, origine: 'france_occasion' as const, energie: 'essence' as const, genre: 'vp' as const, cv, dateOp: JOUR, gkm: 0, masseKg: 0, ptacKg: 0 };
    const [y, m] = JOUR.split('-').map(Number);
    const neuf = coutCarteGrise({ ...base, date1re: m === 12 ? iso(y - 9, 1, 1) : iso(y - 10, m + 1, 1) });
    const dix = coutCarteGrise({ ...base, date1re: iso(y - 10, m, 1) });
    return {
      head: [T(l, 'Économie en franchissant les 10 ans', 'Saving once past 10 years'), eur2(neuf.total - dix.total, l)] as [string, string],
      rows: [
        [T(l, 'Voiture de 9 ans et 11 mois', 'Car aged 9 years 11 months'), eur2(neuf.total, l)],
        [T(l, 'Voiture de 10 ans', 'Car aged 10 years'), eur2(dix.total, l)],
      ] as [string, string][],
      note: T(l, `Changement de titulaire au tarif en vigueur en ${ANNEE}.`, `Change of keeper at the ${ANNEE} rate.`),
    };
  },
});
