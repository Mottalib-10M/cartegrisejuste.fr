import { P } from '../engine/params';
import { malus } from '../engine/carte-grise';
import { T, eur, num, JOUR, type L } from './_kit';
/** Véhicule importé d'un pays de l'UE : malus avec décote selon l'âge, et TVA due en France s'il est « neuf » au sens fiscal. */
export function importUe(mois: number, km: number, g: number, kg: number) {
  const neufFiscal = mois <= P.tva_import.mois_max || km <= P.tva_import.km_max;
  const [y, m] = JOUR.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - Math.max(1, Math.round(mois)), 1)).toISOString().slice(0, 10);
  const r = malus({ gkm: g, masseKg: kg, energie: 'essence', dateOp: JOUR, date1re: mois <= 0 ? JOUR : d, origine: mois <= 0 ? 'import_neuf' : 'import_occasion' });
  return { neufFiscal, r };
}
export default (l: L) => ({
  title: T(l, 'Voiture importée d’Europe : malus et TVA', 'Car imported from the EU: malus and VAT'),
  cta: T(l, 'Ajouter la taxe régionale de votre région', 'Add your region’s regional tax'),
  inputs: [
    { id: 'mois', label: T(l, 'Âge depuis la 1re immatriculation', 'Age since first registration'), def: 30, unit: T(l, 'mois', 'months'), max: 600 },
    { id: 'km', label: T(l, 'Kilométrage', 'Mileage'), def: 40000, unit: 'km', max: 2000000 },
    { id: 'g', label: T(l, 'CO₂ WLTP', 'CO₂ WLTP'), def: 160, unit: 'g/km', max: 1000 },
    { id: 'kg', label: T(l, 'Masse en ordre de marche', 'Mass in running order'), def: 1700, unit: 'kg', max: 10000 },
  ],
  run: ({ mois, km, g, kg }: Record<string, number>) => {
    const { neufFiscal, r } = importUe(mois, km, g, kg);
    return {
      head: [T(l, 'Malus à payer après décote', 'Malus due after reduction'), eur(r.total, l)] as [string, string],
      rows: [
        [T(l, 'Décote liée à l’âge', 'Age reduction'), `${num(Math.round(r.decote * 100), l)} %`],
        [T(l, 'Malus CO₂', 'CO₂ malus'), eur(r.co2, l)],
        [T(l, 'Malus au poids', 'Weight malus'), eur(r.masse, l)],
        [T(l, 'TVA à payer en France', 'VAT payable in France'), neufFiscal ? T(l, 'oui, véhicule neuf au sens fiscal', 'yes, new for tax purposes') : T(l, 'non, quitus fiscal sans TVA', 'no, clearance without VAT')],
      ] as [string, string][],
      note: r.notes.includes('nedc') ? T(l, 'Mise en circulation avant 2020 : le malus suit le barème NEDC, que ce mini-calcul n’intègre pas ; 0 € n’est donc pas un résultat.', 'First registered before 2020: the malus follows the NEDC scale, which this tool leaves out, so €0 is not a result.') : T(l, `Neuf au sens fiscal : ${P.tva_import.mois_max} mois au plus ou ${num(P.tva_import.km_max, l)} km au plus.`, `New for tax purposes: ${P.tva_import.mois_max} months old or less, or ${num(P.tva_import.km_max, l)} km or less.`),
    };
  },
});
