import { coutCarteGrise } from '../engine/carte-grise';
import { T, eur2, regionOpts, regionAt, regionIndex, JOUR, ANNEE, iso, type L } from './_kit';
/** Véhicule de collection (plus de 30 ans) : pas de tarif propre, la moitié due à partir de 10 ans s'applique. */
export default (l: L) => ({
  title: T(l, 'Carte grise d’un véhicule de collection', 'Registration of a classic vehicle'),
  cta: T(l, 'Calcul complet', 'Full calculation'),
  inputs: [
    { id: 'r', label: T(l, 'Région', 'Region'), def: regionIndex('normandie'), options: regionOpts(l) },
    { id: 'cv', label: T(l, 'Puissance fiscale', 'Fiscal horsepower'), def: 11, unit: 'CV', max: 200 },
    { id: 'a', label: T(l, 'Année de 1re mise en circulation', 'Year first on the road'), def: ANNEE - 40, max: 2100 },
  ],
  run: ({ r, cv, a }: Record<string, number>) => {
    const reg = regionAt(r);
    const x = coutCarteGrise({ demarche: 'titulaire', region: reg.id, origine: 'france_occasion', energie: 'essence', genre: 'vp', cv, date1re: iso(a, 1, 1), dateOp: JOUR, gkm: 0, masseKg: 0, ptacKg: 0 });
    const plein = (x.y1.tarif + x.y1.idfm) * x.y1.cv;
    return {
      head: [T(l, 'Carte grise de collection', 'Classic registration'), eur2(x.total, l)] as [string, string],
      rows: [
        [T(l, 'Taxe régionale au tarif plein', 'Regional tax at full rate'), eur2(plein, l)],
        [T(l, 'Y1 après réduction de moitié', 'Y1 after the half reduction'), eur2(x.y1.y1, l)],
        ['Y4 + Y5', eur2(x.y4 + x.y5, l)],
      ] as [string, string][],
      note: T(l, 'Aucune réduction propre aux véhicules de collection : seule la moitié due dès 10 ans joue.', 'No discount specific to classic vehicles: only the half rate from 10 years applies.'),
    };
  },
});
