import { P } from '../engine/params';
import { malus } from '../engine/carte-grise';
import { T, eur, JOUR, type L } from './_kit';
/** Véhicule importé hors UE : droits de douane, TVA à l'importation et malus avec décote. */
export function importHorsUe(prix: number, transport: number, g: number, mois: number) {
  const valeur = prix + transport;
  const droits = valeur * P.douane.droit_voiture;
  const tva = (valeur + droits) * P.douane.tva;
  const [y, m] = JOUR.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - Math.max(1, Math.round(mois)), 1)).toISOString().slice(0, 10);
  const r = malus({ gkm: g, masseKg: 0, energie: 'essence', dateOp: JOUR, date1re: mois <= 0 ? JOUR : d, origine: mois <= 0 ? 'import_neuf' : 'import_occasion' });
  return { valeur, droits, tva, malus: r, total: droits + tva + r.total };
}
export default (l: L) => ({
  title: T(l, 'Import hors Union européenne : douane et malus', 'Import from outside the EU: customs and malus'),
  cta: T(l, 'Ajouter la carte grise de votre région', 'Add your region’s registration cost'),
  inputs: [
    { id: 'prix', label: T(l, 'Prix d’achat', 'Purchase price'), def: 25000, unit: '€', max: 5000000 },
    { id: 'tr', label: T(l, 'Transport et assurance jusqu’à l’UE', 'Shipping and insurance to the EU'), def: 2000, unit: '€', max: 500000 },
    { id: 'g', label: T(l, 'CO₂ WLTP', 'CO₂ WLTP'), def: 180, unit: 'g/km', max: 1000 },
    { id: 'mois', label: T(l, 'Âge du véhicule', 'Vehicle age'), def: 36, unit: T(l, 'mois', 'months'), max: 600 },
  ],
  run: ({ prix, tr, g, mois }: Record<string, number>) => {
    const x = importHorsUe(prix, tr, g, mois);
    return {
      head: [T(l, 'Douane, TVA et malus', 'Customs, VAT and malus'), eur(x.total, l)] as [string, string],
      rows: [
        [T(l, `Droits de douane (${Math.round(P.douane.droit_voiture * 100)} %)`, `Customs duty (${Math.round(P.douane.droit_voiture * 100)}%)`), eur(x.droits, l)],
        [T(l, `TVA à l’importation (${Math.round(P.douane.tva * 100)} %)`, `Import VAT (${Math.round(P.douane.tva * 100)}%)`), eur(x.tva, l)],
        [T(l, 'Malus après décote (sans malus au poids)', 'Malus after reduction (weight malus excluded)'), eur(x.malus.total, l)],
      ] as [string, string][],
      note: x.malus.notes.includes('nedc') ? T(l, 'Mise en circulation avant 2020 : le malus suit le barème NEDC, que ce mini-calcul n’intègre pas ; 0 € n’est donc pas un résultat.', 'First registered before 2020: the malus follows the NEDC scale, which this tool leaves out, so €0 is not a result.') : T(l, 'Estimation : la douane fixe la valeur imposable et l’origine du véhicule peut changer le droit appliqué.', 'Estimate: customs set the taxable value, and the car’s origin can change the duty rate.'),
    };
  },
});
