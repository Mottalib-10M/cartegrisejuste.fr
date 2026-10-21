import { P } from '../engine/params';
import { coutCarteGrise, type Demarche } from '../engine/carte-grise';
import { T, eur2, regionOpts, regionAt, regionIndex, JOUR, type L } from './_kit';
const DEM: Demarche[] = ['adresse', 'duplicata'];
/** Changement d'adresse ou duplicata : ce qui reste dû, majoration IDFM non appliquée. */
export default (l: L) => ({
  title: T(l, 'Changement d’adresse ou duplicata : le coût', 'Change of address or duplicate: the cost'),
  cta: T(l, 'Autre démarche', 'Another procedure'),
  inputs: [
    { id: 'd', label: T(l, 'Démarche', 'Procedure'), def: 1, options: [{ value: '0', label: T(l, 'Changement d’adresse', 'Change of address') }, { value: '1', label: T(l, 'Duplicata', 'Duplicate') }] },
    { id: 'r', label: T(l, 'Région', 'Region'), def: regionIndex('ile-de-france'), options: regionOpts(l) },
    { id: 'cv', label: T(l, 'Puissance fiscale', 'Fiscal horsepower'), def: 6, unit: 'CV', max: 200 },
  ],
  run: ({ d, r, cv }: Record<string, number>) => {
    const reg = regionAt(r);
    const x = coutCarteGrise({ demarche: DEM[d] ?? 'duplicata', region: reg.id, origine: 'france_occasion', energie: 'essence', genre: 'vp', cv, date1re: JOUR, dateOp: JOUR, gkm: 0, masseKg: 0, ptacKg: 0 });
    return {
      head: [d === 0 ? T(l, 'Changement d’adresse', 'Change of address') : T(l, 'Duplicata', 'Duplicate'), eur2(x.total, l)] as [string, string],
      rows: [
        [T(l, 'Y1 taxe régionale', 'Y1 regional tax'), eur2(x.y1.y1, l)],
        [T(l, 'Y4 taxe fixe', 'Y4 fixed tax'), eur2(x.y4, l)],
        [T(l, 'Y5 redevance', 'Y5 delivery fee'), eur2(x.y5, l)],
      ] as [string, string][],
      note: d === 0 ? T(l, `Du 1er au ${P.national.adresse_gratuits}e changement : une étiquette, rien à payer. Ensuite : nouveau titre à ${eur2(P.national.redevance, l)}.`, `1st to ${P.national.adresse_gratuits}rd change: a sticker, nothing to pay. After that: new certificate at ${eur2(P.national.redevance, l)}.`) : T(l, 'Ni la puissance ni la région ne changent ce montant.', 'Neither horsepower nor region changes this amount.'),
    };
  },
});
