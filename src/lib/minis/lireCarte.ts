import { coutCarteGrise } from '../engine/carte-grise';
import { T, eur2, regionOpts, regionAt, regionIndex, JOUR, ANNEE, iso, type L } from './_kit';
/** Contrôle d'un titre : le Y1 attendu d'après les cases P.6 et B, face au montant imprimé. */
export default (l: L) => ({
  title: T(l, 'Vérifier le montant imprimé en case Y1', 'Check the amount printed in box Y1'),
  cta: T(l, 'Recalculer toutes les cases', 'Recalculate every box'),
  inputs: [
    { id: 'r', label: T(l, 'Région de l’adresse du titre', 'Region of the address on the certificate'), def: regionIndex('provence-alpes-cote-dazur'), options: regionOpts(l) },
    { id: 'cv', label: T(l, 'Case P.6', 'Box P.6'), def: 5, unit: 'CV', max: 200 },
    { id: 'a', label: T(l, 'Année de la case B', 'Year in box B'), def: ANNEE - 3, max: 2100 },
    { id: 'y1', label: T(l, 'Montant lu en case Y1', 'Amount read in box Y1'), def: 300, unit: '€', max: 100000, decimals: 2 },
  ],
  run: ({ r, cv, a, y1 }: Record<string, number>) => {
    const reg = regionAt(r);
    const x = coutCarteGrise({ demarche: 'titulaire', region: reg.id, origine: 'france_occasion', energie: 'essence', genre: 'vp', cv, date1re: iso(a, 1, 1), dateOp: JOUR, gkm: 0, masseKg: 0, ptacKg: 0 });
    const ecart = y1 - x.y1.y1;
    return {
      head: [T(l, 'Y1 attendu aujourd’hui', 'Y1 expected today'), eur2(x.y1.y1, l)] as [string, string],
      rows: [
        [T(l, 'Montant saisi', 'Amount entered'), eur2(y1, l)],
        [T(l, 'Écart', 'Difference'), eur2(ecart, l)],
        [T(l, 'Tarif appliqué', 'Rate applied'), `${eur2(x.y1.tarif + x.y1.idfm, l)} / CV`],
      ] as [string, string][],
      note: Math.abs(ecart) < 0.5 ? T(l, 'Le montant correspond au tarif en vigueur.', 'The amount matches the rate in force.') : T(l, 'Un écart vient souvent d’un tarif d’une autre date, d’une exonération ou de l’âge du véhicule.', 'A gap usually comes from a rate of another date, an exemption or the vehicle’s age.'),
    };
  },
});
