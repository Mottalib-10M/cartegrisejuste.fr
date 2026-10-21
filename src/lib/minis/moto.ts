import { coutCarteGrise } from '../engine/carte-grise';
import { T, eur2, regionOpts, regionAt, regionIndex, JOUR, ANNEE, iso, type L } from './_kit';
/** Moto ou scooter : moitié de la taxe régionale ; cyclomoteur : taxe régionale nulle. */
export default (l: L) => ({
  title: T(l, 'Carte grise pour moto et scooter', 'Registration of a motorbike or scooter'),
  cta: T(l, 'Calcul complet avec type de véhicule', 'Full calculation with vehicle type'),
  inputs: [
    { id: 'r', label: T(l, 'Région', 'Region'), def: regionIndex('occitanie'), options: regionOpts(l) },
    { id: 'cv', label: T(l, 'Puissance fiscale (P.6)', 'Fiscal horsepower (P.6)'), def: 3, unit: 'CV', max: 50 },
    { id: 'a', label: T(l, 'Année de 1re immatriculation', 'Year first registered'), def: ANNEE - 4, max: 2100 },
    { id: 'c', label: T(l, 'Cylindrée', 'Engine size'), def: 1, options: [{ value: '0', label: T(l, 'Cyclomoteur 50 cm³', 'Moped 50 cc') }, { value: '1', label: T(l, 'Moto ou scooter au-delà', 'Motorbike or larger scooter') }] },
  ],
  run: ({ r, cv, a, c }: Record<string, number>) => {
    const reg = regionAt(r);
    const x = coutCarteGrise({ demarche: 'titulaire', region: reg.id, origine: 'france_occasion', energie: 'essence', genre: c === 0 ? 'cyclo' : 'moto', cv, date1re: iso(a, 1, 1), dateOp: JOUR, gkm: 0, masseKg: 0, ptacKg: 0 });
    return {
      head: [T(l, 'Carte grise du deux-roues', 'Two-wheeler registration'), eur2(x.total, l)] as [string, string],
      rows: [
        [x.y1.motif === 'cyclo' ? T(l, 'Y1, nulle pour un cyclomoteur', 'Y1, nil for a moped') : T(l, 'Y1, moitié du tarif quel que soit l’âge', 'Y1, half rate whatever the age'), eur2(x.y1.y1, l)],
        ['Y4 + Y5', eur2(x.y4 + x.y5, l)],
      ] as [string, string][],
      note: T(l, 'Les deux-roues ne paient ni malus CO₂ ni malus au poids.', 'Two-wheelers pay neither CO₂ nor weight malus.'),
    };
  },
});
