import { coutCarteGrise, type Energie } from '../engine/carte-grise';
import { T, eur2, regionOpts, regionAt, regionIndex, JOUR, type L } from './_kit';
/** Électrique, hybride ou thermique : la même voiture d'occasion dans une région. */
export const coutEnergie = (region: string, cv: number, energie: Energie) => coutCarteGrise({ demarche: 'titulaire', region, origine: 'france_occasion', energie, genre: 'vp', cv, date1re: JOUR, dateOp: JOUR, gkm: 0, masseKg: 0, ptacKg: 0 });
export default (l: L) => ({
  title: T(l, 'Électrique, hybride ou thermique : la carte grise', 'Electric, hybrid or petrol: the registration cost'),
  cta: T(l, 'Comparer les 18 régions', 'Compare all 18 regions'),
  inputs: [
    { id: 'r', label: T(l, 'Région', 'Region'), def: regionIndex('hauts-de-france'), options: regionOpts(l) },
    { id: 'cv', label: T(l, 'Puissance fiscale', 'Fiscal horsepower'), def: 4, unit: 'CV', max: 200 },
  ],
  run: ({ r, cv }: Record<string, number>) => {
    const reg = regionAt(r);
    const ev = coutEnergie(reg.id, cv, 'electrique'), hy = coutEnergie(reg.id, cv, 'hybride_rechargeable'), th = coutEnergie(reg.id, cv, 'essence');
    return {
      head: [T(l, `100 % électrique · ${reg.nom.fr}`, `Fully electric · ${reg.nom.en}`), eur2(ev.total, l)] as [string, string],
      rows: [
        [T(l, 'Hybride rechargeable', 'Plug-in hybrid'), eur2(hy.total, l)],
        [T(l, 'Essence ou diesel', 'Petrol or diesel'), eur2(th.total, l)],
        [T(l, 'Économie de l’électrique', 'Saving for electric'), eur2(th.total - ev.total, l)],
      ] as [string, string][],
      note: T(l, 'Changement de titulaire d’une voiture de moins de 10 ans, sans malus.', 'Change of keeper for a car under 10 years old, no malus.'),
    };
  },
});
