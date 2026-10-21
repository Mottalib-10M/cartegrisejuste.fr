import { coutCarteGrise } from '../engine/carte-grise';
import { T, eur2, regionOpts, regionAt, regionIndex, JOUR, ANNEE, iso, type L } from './_kit';
/** Camping-car (VASP) : taxe régionale selon la règle propre aux véhicules spécialisés. */
export default (l: L) => ({
  title: T(l, 'Carte grise d’un camping-car', 'Registration of a motorhome'),
  cta: T(l, 'Calcul complet', 'Full calculation'),
  inputs: [
    { id: 'r', label: T(l, 'Région', 'Region'), def: regionIndex('bretagne'), options: regionOpts(l) },
    { id: 'cv', label: T(l, 'Puissance fiscale', 'Fiscal horsepower'), def: 9, unit: 'CV', max: 200 },
    { id: 'ptac', label: T(l, 'PTAC (case F.2)', 'Gross weight (box F.2)'), def: 3500, unit: 'kg', max: 60000 },
    { id: 'a', label: T(l, 'Année de 1re immatriculation', 'Year first registered'), def: ANNEE - 6, max: 2100 },
  ],
  run: ({ r, cv, ptac, a }: Record<string, number>) => {
    const reg = regionAt(r);
    const x = coutCarteGrise({ demarche: 'titulaire', region: reg.id, origine: 'france_occasion', energie: 'diesel', genre: 'camping_car', cv, date1re: iso(a, 1, 1), dateOp: JOUR, gkm: 0, masseKg: 0, ptacKg: ptac });
    return {
      head: [T(l, 'Carte grise du camping-car', 'Motorhome registration'), eur2(x.total, l)] as [string, string],
      rows: [
        [x.y1.motif === 'age' ? T(l, 'Y1, moitié après 10 ans', 'Y1, half after 10 years') : 'Y1', eur2(x.y1.y1, l)],
        ...(x.y2 > 0 ? [[T(l, 'Y2', 'Y2'), eur2(x.y2, l)] as [string, string]] : []),
        ['Y4 + Y5', eur2(x.y4 + x.y5, l)],
      ] as [string, string][],
      note: T(l, 'Camping-car d’occasion, genre VASP sur le titre.', 'Used motorhome, VASP category on the certificate.'),
    };
  },
});
