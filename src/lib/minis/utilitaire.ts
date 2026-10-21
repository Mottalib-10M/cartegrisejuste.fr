import { coutCarteGrise } from '../engine/carte-grise';
import { T, eur2, regionOpts, regionAt, regionIndex, JOUR, type L } from './_kit';
/** Camionnette, utilitaire : taxe régionale + Y2 selon le PTAC. */
export default (l: L) => ({
  title: T(l, 'Carte grise d’un utilitaire', 'Registration of a van'),
  cta: T(l, 'Calcul complet', 'Full calculation'),
  inputs: [
    { id: 'r', label: T(l, 'Région', 'Region'), def: regionIndex('pays-de-la-loire'), options: regionOpts(l) },
    { id: 'cv', label: T(l, 'Puissance fiscale', 'Fiscal horsepower'), def: 8, unit: 'CV', max: 200 },
    { id: 'ptac', label: T(l, 'PTAC (case F.2)', 'Gross weight (box F.2)'), def: 3500, unit: 'kg', max: 60000 },
  ],
  run: ({ r, cv, ptac }: Record<string, number>) => {
    const reg = regionAt(r);
    const x = coutCarteGrise({ demarche: 'titulaire', region: reg.id, origine: 'france_occasion', energie: 'diesel', genre: 'utilitaire', cv, date1re: JOUR, dateOp: JOUR, gkm: 0, masseKg: 0, ptacKg: ptac });
    return {
      head: [T(l, 'Carte grise de l’utilitaire', 'Van registration'), eur2(x.total, l)] as [string, string],
      rows: [
        ['Y1', eur2(x.y1.y1, l)],
        [T(l, 'Y2 taxe sur les véhicules de transport', 'Y2 transport vehicle tax'), eur2(x.y2, l)],
        ['Y4 + Y5', eur2(x.y4 + x.y5, l)],
      ] as [string, string][],
      note: T(l, 'Utilitaire d’occasion de moins de 10 ans.', 'Used van under 10 years old.'),
    };
  },
});
