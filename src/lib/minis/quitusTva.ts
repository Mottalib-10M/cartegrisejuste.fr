import { P } from '../engine/params';
import { T, eur, num, type L } from './_kit';
/** Véhicule acheté dans un autre pays de l'UE : neuf ou d'occasion au sens de la TVA, et TVA due en France. */
export function tvaImport(mois: number, km: number, prixHt: number) {
  const neuf = mois <= P.tva_import.mois_max || km <= P.tva_import.km_max;
  return { neuf, tva: neuf ? prixHt * P.douane.tva : 0 };
}
export default (l: L) => ({
  title: T(l, 'TVA à payer en France sur un véhicule acheté dans l’UE', 'VAT payable in France on a car bought in the EU'),
  cta: T(l, 'Malus et carte grise du véhicule importé', 'Malus and registration of the imported car'),
  inputs: [
    { id: 'mois', label: T(l, 'Mois depuis la 1re mise en service', 'Months since first in service'), def: 5, unit: T(l, 'mois', 'months'), max: 600 },
    { id: 'km', label: T(l, 'Kilométrage', 'Mileage'), def: 8000, unit: 'km', max: 2000000 },
    { id: 'p', label: T(l, 'Prix hors taxes', 'Price before VAT'), def: 32000, unit: '€', max: 5000000 },
  ],
  run: ({ mois, km, p }: Record<string, number>) => {
    const r = tvaImport(mois, km, p);
    return {
      head: [T(l, 'TVA due en France', 'VAT due in France'), eur(r.tva, l)] as [string, string],
      rows: [
        [T(l, 'Statut fiscal', 'Tax status'), r.neuf ? T(l, 'neuf : TVA française', 'new: French VAT') : T(l, 'occasion : pas de TVA en France', 'used: no VAT in France')],
        [T(l, 'Seuils', 'Thresholds'), `${P.tva_import.mois_max} ${T(l, 'mois', 'months')} · ${num(P.tva_import.km_max, l)} km`],
      ] as [string, string][],
      note: T(l, 'Un seul des deux seuils suffit pour être neuf au sens fiscal.', 'Meeting either threshold makes the car new for tax purposes.'),
    };
  },
});
