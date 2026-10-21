import { coutCarteGrise } from '../engine/carte-grise';
import { T, eur, eur2, regionOpts, regionAt, regionIndex, JOUR, type L } from './_kit';
/** Voiture neuve : taxe régionale, malus CO₂ et malus au poids. */
export default (l: L) => ({
  title: T(l, 'Carte grise d’une voiture neuve', 'Registration of a new car'),
  cta: T(l, 'Tous les réglages : famille, énergie, date', 'All settings: family, fuel, date'),
  inputs: [
    { id: 'r', label: T(l, 'Région', 'Region'), def: regionIndex('auvergne-rhone-alpes'), options: regionOpts(l) },
    { id: 'cv', label: T(l, 'Puissance fiscale', 'Fiscal horsepower'), def: 7, unit: 'CV', max: 200 },
    { id: 'g', label: T(l, 'CO₂ WLTP', 'CO₂ WLTP'), def: 140, unit: 'g/km', max: 1000 },
    { id: 'kg', label: T(l, 'Masse en ordre de marche', 'Mass in running order'), def: 1600, unit: 'kg', max: 10000 },
  ],
  run: ({ r, cv, g, kg }: Record<string, number>) => {
    const reg = regionAt(r);
    const x = coutCarteGrise({ demarche: 'immat', region: reg.id, origine: 'france_neuf', energie: 'essence', genre: 'vp', cv, date1re: JOUR, dateOp: JOUR, gkm: g, masseKg: kg, ptacKg: 0 });
    return {
      head: [T(l, 'Carte grise d’une voiture neuve essence', 'Registration of a new petrol car'), eur2(x.total, l)] as [string, string],
      rows: [
        ['Y1', eur2(x.y1.y1, l)],
        [T(l, `Malus CO₂ ${x.malus.annee}`, `${x.malus.annee} CO₂ malus`), eur(x.malus.co2, l)],
        [T(l, 'Malus au poids', 'Weight malus'), eur(x.malus.masse, l)],
        ['Y4 + Y5', eur2(x.y4 + x.y5, l)],
      ] as [string, string][],
      note: T(l, 'Valeurs du certificat de conformité : CO₂ en case V.7, masse en case G.', 'Values from the certificate of conformity: CO₂ in box V.7, mass in box G.'),
    };
  },
});
