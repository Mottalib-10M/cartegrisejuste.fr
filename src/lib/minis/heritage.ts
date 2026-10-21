import { coutCarteGrise, type Demarche } from '../engine/carte-grise';
import { T, eur2, regionOpts, regionAt, regionIndex, JOUR, ANNEE, iso, type L } from './_kit';
const DEM: Demarche[] = ['succession', 'conjoint', 'titulaire'];
/** Véhicule hérité, repris par le conjoint, donné ou acheté : ce que coûte le nouveau titre. */
export default (l: L) => ({
  title: T(l, 'Véhicule hérité ou donné : la carte grise', 'Inherited or gifted car: the registration cost'),
  cta: T(l, 'Calcul complet', 'Full calculation'),
  inputs: [
    { id: 'd', label: T(l, 'Situation', 'Situation'), def: 0, options: [{ value: '0', label: T(l, 'Héritage', 'Inheritance') }, { value: '1', label: T(l, 'Reprise par le conjoint ou partenaire', 'Taken over by spouse or partner') }, { value: '2', label: T(l, 'Donation ou vente en famille', 'Gift or sale within the family') }] },
    { id: 'r', label: T(l, 'Région', 'Region'), def: regionIndex('centre-val-de-loire'), options: regionOpts(l) },
    { id: 'cv', label: T(l, 'Puissance fiscale', 'Fiscal horsepower'), def: 6, unit: 'CV', max: 200 },
    { id: 'a', label: T(l, 'Année de 1re immatriculation', 'Year first registered'), def: ANNEE - 8, max: 2100 },
  ],
  run: ({ d, r, cv, a }: Record<string, number>) => {
    const reg = regionAt(r);
    const x = coutCarteGrise({ demarche: DEM[d] ?? 'succession', region: reg.id, origine: 'france_occasion', energie: 'essence', genre: 'vp', cv, date1re: iso(a, 1, 1), dateOp: JOUR, gkm: 0, masseKg: 0, ptacKg: 0 });
    return {
      head: [T(l, 'Nouveau titre', 'New certificate'), eur2(x.total, l)] as [string, string],
      rows: [
        [T(l, 'Y1 taxe régionale', 'Y1 regional tax'), eur2(x.y1.y1, l)],
        ['Y4 + Y5', eur2(x.y4 + x.y5, l)],
      ] as [string, string][],
      note: T(l, 'Une donation se traite comme une vente : taxe régionale due.', 'A gift is treated like a sale: regional tax is due.'),
    };
  },
});
