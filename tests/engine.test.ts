import { describe, expect, it } from 'vitest';
import { P } from '../src/lib/engine/params';
import {
  coutCarteGrise, taxeRegionale, malus, malusCO2Brut, malusMasseBrut, coefficientDecote, moisEntames,
  chevauxFiscaux, chevauxMoto, comparerRegions, anneeBareme, tarifRegion, majorationIdfm, taxeY2, type CoutInput,
} from '../src/lib/engine/carte-grise';

const JOUR = '2026-10-20';
const base: CoutInput = { demarche: 'titulaire', region: 'grand-est', origine: 'france_occasion', energie: 'essence', genre: 'vp', cv: 6, date1re: '2020-05-01', dateOp: JOUR, gkm: 0, masseKg: 0, ptacKg: 0 };
const cout = (x: Partial<CoutInput>) => coutCarteGrise({ ...base, ...x });

describe('données', () => {
  it('aucun tarif régional au-dessus du plafond de 60 € par CV', () => {
    for (const r of P.regions) for (const t of r.tarifs) expect(t.cv).toBeLessThanOrEqual(P.regional.plafond_cv);
  });
  it('18 régions, chaque barème CO₂ sans trou', () => {
    expect(P.regions.length).toBe(18);
    for (const b of Object.values(P.malus_co2.annees)) b.grille.forEach((r, i) => expect(r[0]).toBe(b.seuil + i));
  });
  it('tarifs en vigueur au 20/10/2026', () => {
    const attendu: Record<string, number> = { 'ile-de-france': 54.95, 'provence-alpes-cote-dazur': 60, bretagne: 60, normandie: 60, 'grand-est': 60, 'bourgogne-franche-comte': 60, 'centre-val-de-loire': 60, occitanie: 59.5, 'nouvelle-aquitaine': 58, corse: 53, 'pays-de-la-loire': 51, 'auvergne-rhone-alpes': 43, 'hauts-de-france': 43, guadeloupe: 41, martinique: 53, guyane: 42.5, 'la-reunion': 60, mayotte: 30 };
    for (const [id, cv] of Object.entries(attendu)) expect(tarifRegion(id, JOUR).cv).toBe(cv);
  });
  it('dates d’effet 2026 : Nouvelle-Aquitaine au 1er mars, Hauts-de-France au 1er avril, Réunion au 1er février', () => {
    expect(tarifRegion('nouvelle-aquitaine', '2026-02-28').cv).toBe(53);
    expect(tarifRegion('nouvelle-aquitaine', '2026-03-01').cv).toBe(58);
    expect(tarifRegion('hauts-de-france', '2026-03-31').cv).toBe(42);
    expect(tarifRegion('hauts-de-france', '2026-04-01').cv).toBe(43);
    expect(tarifRegion('la-reunion', '2026-01-31').cv).toBe(57);
    expect(tarifRegion('la-reunion', '2026-02-01').cv).toBe(60);
  });
});

describe('taxe régionale et total, cas types par région', () => {
  it('Grand Est, 6 CV, plus de 10 ans : 193,76 €', () => {
    expect(cout({ date1re: '2015-01-01' }).total).toBe(193.76);
  });
  it('Grand Est, 6 CV, moins de 10 ans : 373,76 €', () => {
    expect(cout({}).total).toBe(373.76);
  });
  it('Île-de-France, 5 CV, octobre 2026 : majoration IDFM de 14 € par CV, 358,76 €', () => {
    const r = cout({ region: 'ile-de-france', cv: 5 });
    expect(r.y1.regionale).toBe(274.75);
    expect(r.y1.majoration).toBe(70);
    expect(r.total).toBe(358.76);
  });
  it('Île-de-France avant le 1er mars 2026 : pas de majoration', () => {
    expect(cout({ region: 'ile-de-france', cv: 5, dateOp: '2026-02-15' }).total).toBe(288.76);
  });
  it('Île-de-France en 2027 : majoration de 12 € par CV', () => {
    expect(majorationIdfm('2027-02-01')).toBe(12);
    expect(cout({ region: 'ile-de-france', cv: 5, dateOp: '2027-02-01' }).total).toBe(348.76);
  });
  it('Île-de-France, plus de 10 ans : la majoration est aussi réduite de moitié', () => {
    const r = cout({ region: 'ile-de-france', cv: 4, date1re: '2010-01-01' });
    expect(r.y1.regionale).toBe(109.9);
    expect(r.y1.majoration).toBe(28);
  });
  it('Mayotte, 5 CV : 163,76 €, la moins chère', () => {
    const c = comparerRegions({ ...base, cv: 5 });
    expect(c[0].region).toBe('mayotte');
    expect(c[0].total).toBe(163.76);
    expect(c[c.length - 1].region).toBe('ile-de-france');
  });
  it('Hauts-de-France, électrique : moitié depuis le 1er avril 2026, exonéré avant', () => {
    expect(cout({ region: 'hauts-de-france', energie: 'electrique', cv: 7 }).total).toBe(164.76);
    expect(cout({ region: 'hauts-de-france', energie: 'electrique', cv: 7, dateOp: '2026-03-15' }).total).toBe(13.76);
  });
  it('électrique ailleurs : plein tarif', () => {
    expect(cout({ energie: 'electrique' }).total).toBe(cout({}).total);
  });
});

describe('démarches et genres', () => {
  it('duplicata : 13,76 €, sans taxe régionale', () => {
    expect(cout({ demarche: 'duplicata', region: 'ile-de-france' }).total).toBe(13.76);
  });
  it('changement d’adresse : 0 € jusqu’au 3e, 2,76 € ensuite', () => {
    expect(cout({ demarche: 'adresse', rangAdresse: 1 }).total).toBe(0);
    expect(cout({ demarche: 'adresse', rangAdresse: 3 }).total).toBe(0);
    expect(cout({ demarche: 'adresse', rangAdresse: 4 }).total).toBe(2.76);
  });
  it('conjoint ou partenaire : exonéré de taxe régionale, 13,76 €', () => {
    expect(cout({ demarche: 'conjoint' }).total).toBe(13.76);
  });
  it('héritage hors conjoint : taxe régionale due comme pour un achat', () => {
    expect(cout({ demarche: 'succession' }).total).toBe(cout({}).total);
  });
  it('moto : moitié du tarif, que le véhicule ait plus ou moins de 10 ans', () => {
    const a = taxeRegionale({ ...base, region: 'auvergne-rhone-alpes', cv: 3, genre: 'moto' });
    const b = taxeRegionale({ ...base, region: 'auvergne-rhone-alpes', cv: 3, genre: 'moto', date1re: '2005-01-01' });
    expect(a.y1).toBe(64.5);
    expect(b.y1).toBe(64.5);
  });
  it('cyclomoteur : taxe régionale nulle', () => {
    expect(cout({ genre: 'cyclo', cv: 1 }).total).toBe(13.76);
  });
  it('véhicule de collection : pas de réduction propre, seulement la moitié à 10 ans', () => {
    expect(cout({ cv: 11, date1re: '1985-01-01', region: 'normandie' }).y1.y1).toBe(330);
  });
  it('camion de plus de 3,5 t : moitié du tarif même neuf', () => {
    expect(taxeRegionale({ ...base, genre: 'utilitaire', ptacKg: 5000, cv: 10 }).y1).toBe(300);
    expect(taxeRegionale({ ...base, genre: 'utilitaire', ptacKg: 3500, cv: 10 }).y1).toBe(600);
  });
  it('utilitaire : Y2 selon le PTAC, sans malus', () => {
    expect(taxeY2('utilitaire', 3500)).toBe(34);
    expect(taxeY2('utilitaire', 5000)).toBe(127);
    expect(taxeY2('utilitaire', 9000)).toBe(189);
    expect(taxeY2('utilitaire', 19000)).toBe(285);
    expect(taxeY2('camping_car', 3500)).toBe(0);
    const r = cout({ genre: 'utilitaire', demarche: 'immat', origine: 'france_neuf', date1re: JOUR, gkm: 200, masseKg: 2300, ptacKg: 3500 });
    expect(r.malus.total).toBe(0);
    expect(r.y2).toBe(34);
  });
});

describe('malus CO₂', () => {
  it('barème 2026 : 0 € à 107 g, 50 € à 108 g, 79 911 € à 191 g, 80 000 € au-delà', () => {
    expect(malusCO2Brut(107, '2026')).toBe(0);
    expect(malusCO2Brut(108, '2026')).toBe(50);
    expect(malusCO2Brut(150, '2026')).toBe(4279);
    expect(malusCO2Brut(191, '2026')).toBe(79911);
    expect(malusCO2Brut(192, '2026')).toBe(80000);
  });
  it('barème 2027 : 50 € à 103 g, 90 000 € au-delà de 189 g', () => {
    expect(malusCO2Brut(103, '2027')).toBe(50);
    expect(malusCO2Brut(189, '2027')).toBe(89244);
    expect(malusCO2Brut(190, '2027')).toBe(90000);
  });
  it('colonne choisie par la date de première immatriculation', () => {
    expect(anneeBareme('2025-02-28')).toBe('2024');
    expect(anneeBareme('2025-03-01')).toBe('2025');
    expect(anneeBareme('2026-12-31')).toBe('2026');
    expect(anneeBareme('2027-01-01')).toBe('2027');
  });
  it('famille de 3 enfants : 20 g par enfant retirés', () => {
    const m = malus({ gkm: 150, masseKg: 0, energie: 'essence', date1re: JOUR, dateOp: JOUR, origine: 'france_neuf', enfants: 3 });
    expect(m.gRetenu).toBe(90);
    expect(m.co2).toBe(0);
  });
  it('E85 : 40 % des émissions retirés', () => {
    const m = malus({ gkm: 200, masseKg: 0, energie: 'e85', date1re: JOUR, dateOp: JOUR, origine: 'france_neuf' });
    expect(m.gRetenu).toBe(120);
    expect(m.co2).toBe(310);
  });
  it('électrique, handicap, occasion française : aucun malus', () => {
    expect(malus({ gkm: 0, masseKg: 2300, energie: 'electrique', date1re: JOUR, dateOp: JOUR, origine: 'france_neuf' }).total).toBe(0);
    expect(malus({ gkm: 180, masseKg: 2000, energie: 'essence', date1re: JOUR, dateOp: JOUR, origine: 'france_neuf', handicap: true }).total).toBe(0);
    expect(cout({ demarche: 'titulaire', gkm: 200, masseKg: 2200 }).malus.total).toBe(0);
  });
});

describe('malus au poids', () => {
  it('exemple de service-public : 1 950 kg en 2026 → 6 775 €', () => {
    expect(malusMasseBrut(1950, '2026')).toBe(6775);
  });
  it('seuil 2026 : 1 499 kg → 0 €, 1 500 kg → 10 €', () => {
    expect(malusMasseBrut(1499, '2026')).toBe(0);
    expect(malusMasseBrut(1500, '2026')).toBe(10);
  });
  it('hybride rechargeable (plus de 50 km) : 200 kg retirés, dans la limite de 15 % de la masse', () => {
    const m = malus({ gkm: 30, masseKg: 1900, energie: 'hybride_rechargeable', date1re: JOUR, dateOp: JOUR, origine: 'france_neuf', autonomieKm: 60 });
    expect(m.masseAbattementKg).toBe(200);
    expect(m.masse).toBe(2015);
  });
  it('hybride non rechargeable : 100 kg retirés', () => {
    const m = malus({ gkm: 100, masseKg: 1800, energie: 'hybride', date1re: JOUR, dateOp: JOUR, origine: 'france_neuf' });
    expect(m.masseTaxable).toBe(1700);
  });
  it('micro-hybride : 100 kg en 2026, plus rien en 2027', () => {
    expect(malus({ gkm: 100, masseKg: 1800, energie: 'micro_hybride', date1re: JOUR, dateOp: JOUR, origine: 'france_neuf' }).masseAbattementKg).toBe(100);
    expect(malus({ gkm: 100, masseKg: 1800, energie: 'micro_hybride', date1re: '2027-01-10', dateOp: '2027-01-10', origine: 'france_neuf' }).masseAbattementKg).toBe(0);
  });
  it('électrique : exonéré', () => {
    expect(malus({ gkm: 0, masseKg: 2400, energie: 'electrique', date1re: JOUR, dateOp: JOUR, origine: 'france_neuf' }).masse).toBe(0);
  });
  it('cumul des deux malus plafonné à 80 000 € en 2026', () => {
    const m = malus({ gkm: 220, masseKg: 2500, energie: 'essence', date1re: JOUR, dateOp: JOUR, origine: 'france_neuf' });
    expect(m.total).toBe(80000);
    expect(m.notes).toContain('plafond_cumul');
  });
});

describe('véhicule importé d’occasion', () => {
  it('table de décote mensuelle', () => {
    expect(coefficientDecote(3)).toBe(0.03);
    expect(coefficientDecote(4)).toBe(0.06);
    expect(coefficientDecote(42)).toBe(0.33);
    expect(coefficientDecote(181)).toBe(1);
    expect(moisEntames('2023-05-10', '2026-10-20')).toBe(42);
  });
  it('import de mai 2023 : barème 2023 et décote de 33 %', () => {
    const m = malus({ gkm: 160, masseKg: 1850, energie: 'essence', date1re: '2023-05-10', dateOp: JOUR, origine: 'import_occasion' });
    expect(m.annee).toBe('2023');
    expect(m.co2).toBe(Math.round(3119 * 0.67));
    expect(m.masse).toBe(Math.round(510 * 0.67));
  });
  it('première immatriculation avant 2015 : aucun malus', () => {
    expect(malus({ gkm: 250, masseKg: 2200, energie: 'essence', date1re: '2014-12-01', dateOp: JOUR, origine: 'import_occasion' }).total).toBe(0);
  });
  it('avant 2020 (barème NEDC) : signalé comme non calculé', () => {
    const m = malus({ gkm: 180, masseKg: 1600, energie: 'diesel', date1re: '2018-06-01', dateOp: JOUR, origine: 'import_occasion' });
    expect(m.calcule).toBe(false);
    expect(m.notes).toContain('nedc');
  });
  it('voiture de plus de 10 ans importée : moitié de la taxe régionale aussi', () => {
    const r = cout({ demarche: 'immat', origine: 'import_occasion', date1re: '2015-03-01', gkm: 150, masseKg: 1400 });
    expect(r.y1.y1).toBe(180);
  });
});

describe('puissance fiscale', () => {
  it('voiture : formule de 2021', () => {
    expect(chevauxFiscaux(100).arrondi).toBe(7);
    expect(chevauxFiscaux(55).arrondi).toBe(4);
  });
  it('deux-roues : barème de la cylindrée', () => {
    expect(chevauxMoto(50)).toBe(1);
    expect(chevauxMoto(125)).toBe(1);
    expect(chevauxMoto(300)).toBe(4);
    expect(chevauxMoto(650)).toBe(7);
    expect(chevauxMoto(1000)).toBe(9);
  });
});
