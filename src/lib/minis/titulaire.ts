import { P } from '../engine/params';
import { coutCarteGrise } from '../engine/carte-grise';
import { T, eur2, regionOpts, regionAt, regionIndex, JOUR, ANNEE, iso, type L } from './_kit';
/** Achat d'occasion : changement de titulaire, moitié de la taxe régionale après dix ans. */
export function coutTitulaire(region: string, cv: number, annee1re: number, dateOp = JOUR) {
  return coutCarteGrise({ demarche: 'titulaire', region, origine: 'france_occasion', energie: 'essence', genre: 'vp', cv, date1re: iso(annee1re, 1, 1), dateOp, gkm: 0, masseKg: 0, ptacKg: 0 });
}
export default (l: L) => ({
  title: T(l, 'Carte grise d’une voiture d’occasion', 'Registration of a used car'),
  cta: T(l, 'Calcul complet, case par case', 'Full calculation, box by box'),
  inputs: [
    { id: 'r', label: T(l, 'Région du domicile', 'Region of residence'), def: regionIndex('grand-est'), options: regionOpts(l) },
    { id: 'cv', label: T(l, 'Puissance fiscale', 'Fiscal horsepower'), def: 6, unit: 'CV', max: 200 },
    { id: 'a', label: T(l, 'Année de 1re immatriculation', 'Year first registered'), def: ANNEE - 12, max: 2100 },
  ],
  run: ({ r, cv, a }: Record<string, number>) => {
    const reg = regionAt(r);
    const x = coutTitulaire(reg.id, cv, a);
    return {
      head: [T(l, `Changement de titulaire · ${reg.nom.fr}`, `Change of keeper · ${reg.nom.en}`), eur2(x.total, l)] as [string, string],
      rows: [
        [x.y1.motif === 'age' ? T(l, 'Y1, moitié du tarif (plus de 10 ans)', 'Y1, half rate (over 10 years)') : T(l, 'Y1, tarif plein (moins de 10 ans)', 'Y1, full rate (under 10 years)'), eur2(x.y1.y1, l)],
        [T(l, 'Y4 + Y5', 'Y4 + Y5'), eur2(x.y4 + x.y5, l)],
        [T(l, 'Amende si le délai d’un mois est dépassé', 'Fine if the one-month deadline is missed'), eur2(P.national.amende_titulaire, l)],
      ] as [string, string][],
      note: T(l, 'Âge compté du 1er janvier de l’année saisie : au mois près, le calcul complet est plus précis.', 'Age counted from 1 January of the year entered: the full calculation is precise to the month.'),
    };
  },
});
