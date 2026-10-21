import { coutCarteGrise } from '../engine/carte-grise';
import { T, eur, eur2, regionOpts, regionAt, regionIndex, JOUR, ANNEE, iso, type L } from './_kit';
/** Budget de l'achat d'une voiture d'occasion : carte grise calculée + frais saisis. */
export default (l: L) => ({
  title: T(l, 'Le budget complet d’un achat d’occasion', 'The full budget of a used-car purchase'),
  cta: T(l, 'Détail de la carte grise', 'Registration breakdown'),
  inputs: [
    { id: 'r', label: T(l, 'Région', 'Region'), def: regionIndex('bourgogne-franche-comte'), options: regionOpts(l) },
    { id: 'cv', label: T(l, 'Puissance fiscale', 'Fiscal horsepower'), def: 5, unit: 'CV', max: 200 },
    { id: 'pl', label: T(l, 'Plaques et pose', 'Plates and fitting'), def: 40, unit: '€', max: 10000 },
    { id: 'ct', label: T(l, 'Contrôle technique à prévoir', 'Roadworthiness test to plan'), def: 0, unit: '€', max: 10000 },
    { id: 'as', label: T(l, 'Assurance, première année', 'Insurance, first year'), def: 600, unit: '€', max: 100000 },
  ],
  run: ({ r, cv, pl, ct, as }: Record<string, number>) => {
    const x = coutCarteGrise({ demarche: 'titulaire', region: regionAt(r).id, origine: 'france_occasion', energie: 'essence', genre: 'vp', cv, date1re: iso(ANNEE - 6, 1, 1), dateOp: JOUR, gkm: 0, masseKg: 0, ptacKg: 0 });
    return {
      head: [T(l, 'Budget en plus du prix', 'Budget on top of the price'), eur(x.total + pl + ct + as, l)] as [string, string],
      rows: [
        [T(l, 'Carte grise', 'Registration'), eur2(x.total, l)],
        [T(l, 'Plaques', 'Plates'), eur(pl, l)],
        [T(l, 'Contrôle technique', 'Roadworthiness test'), eur(ct, l)],
        [T(l, 'Assurance', 'Insurance'), eur(as, l)],
      ] as [string, string][],
      note: T(l, 'Montants des plaques, du contrôle et de l’assurance à remplacer par vos devis.', 'Replace the plates, test and insurance amounts with your own quotes.'),
    };
  },
});
