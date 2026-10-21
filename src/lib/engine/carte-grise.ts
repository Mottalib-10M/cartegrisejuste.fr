/**
 * Moteur du coût du certificat d'immatriculation (fonctions pures). Toutes les valeurs viennent de
 * `data/params-2026.json` ; aucune n'est écrite ici. Les règles appliquées, article par article, sont
 * décrites dans la page « Méthode et sources ».
 *
 * Lignes du titre : Y1 taxe régionale (et majoration IDFM) · Y2 taxe sur les véhicules de transport ·
 * Y3 malus CO₂ et malus au poids · Y4 taxe fixe · Y5 redevance d'acheminement.
 * Arrondi : Y1 + Y2 + Y3 + Y4 à l'euro, puis Y5 ajoutée (règle du simulateur de l'État).
 */
import { P } from './params';

export type Demarche = 'immat' | 'titulaire' | 'adresse' | 'duplicata' | 'succession' | 'conjoint';
export type Energie = 'essence' | 'diesel' | 'micro_hybride' | 'hybride' | 'hybride_rechargeable' | 'electrique' | 'hydrogene' | 'e85' | 'gpl';
export type Genre = 'vp' | 'utilitaire' | 'camping_car' | 'moto' | 'cyclo';
export type Origine = 'france_neuf' | 'france_occasion' | 'import_neuf' | 'import_occasion';
export type RegionId = (typeof P.regions)[number]['id'];

export const REGIONS = P.regions;
export const REGION_IDS = P.regions.map((r) => r.id) as RegionId[];
export const ENERGIES: Energie[] = ['essence', 'diesel', 'micro_hybride', 'hybride', 'hybride_rechargeable', 'electrique', 'hydrogene', 'e85', 'gpl'];
export const DEMARCHES: Demarche[] = ['immat', 'titulaire', 'adresse', 'duplicata', 'succession', 'conjoint'];
export const GENRES: Genre[] = ['vp', 'utilitaire', 'camping_car', 'moto', 'cyclo'];

const round2 = (x: number) => Math.round(x * 100) / 100;
const zeroEmission = (e: Energie) => e === 'electrique' || e === 'hydrogene';

export function regionById(id: string) {
  const r = P.regions.find((x) => x.id === id);
  if (!r) throw new Error(`Région inconnue : ${id}`);
  return r;
}

/** Âge en années révolues entre deux dates ISO. */
export function ageAnnees(date1re: string, dateOp: string): number {
  const [y1, m1, d1] = date1re.split('-').map(Number);
  const [y2, m2, d2] = dateOp.split('-').map(Number);
  let a = y2 - y1;
  if (m2 < m1 || (m2 === m1 && d2 < d1)) a -= 1;
  return Math.max(0, a);
}

/** Tarif du cheval fiscal voté par la région à une date (hors majoration IDFM). `from` nul : date d'effet non vérifiée. */
export function tarifRegion(region: string, dateOp: string): { cv: number; from: string | null; dateVerifiee: boolean } {
  const r = regionById(region);
  let cur = r.tarifs[0];
  for (const t of r.tarifs) if (t.from === null || t.from <= dateOp) cur = t;
  return { cv: cur.cv, from: cur.from, dateVerifiee: cur.date_verifiee };
}

/** Majoration Île-de-France Mobilités par cheval fiscal à une date (0 hors période). */
export function majorationIdfm(dateOp: string): number {
  let v = 0;
  for (const m of P.idfm.periodes) if (m.from <= dateOp && (!m.to || dateOp <= m.to)) v = m.cv;
  return v;
}

/** Part de la taxe régionale retirée par la région pour une énergie, à une date (0 à 1). */
export function exonerationRegionale(region: string, energie: Energie, dateOp: string): number {
  let exo = 0;
  for (const p of regionById(region).propres) if (p.from <= dateOp && (!p.to || dateOp <= p.to) && (p.energies as string[]).includes(energie)) exo = p.exo;
  return exo;
}

export interface Y1Input {
  cv: number;
  region: string;
  date1re: string;
  dateOp: string;
  energie: Energie;
  demarche: Demarche;
  genre?: Genre;
  /** PTAC : au-delà de 3,5 t, un utilitaire (N2, N3) paie la moitié du tarif quel que soit son âge (L421-47). */
  ptacKg?: number;
}
export type Y1Motif = 'plein' | 'age' | 'moto' | 'cyclo' | 'exonere' | 'reduit' | 'adresse' | 'duplicata' | 'conjoint';
export interface Y1Detail {
  tarif: number; tarifFrom: string | null; idfm: number; cv: number; coef: number; exo: number;
  regionale: number; majoration: number; y1: number; motif: Y1Motif;
}

/**
 * Taxe régionale (Y1) : (tarif de la région + majoration IDFM) × CV × coefficient du genre (moitié à
 * 10 ans, moitié pour les motos, zéro pour les cyclomoteurs). La réduction votée par une région pour les
 * électriques ne porte que sur sa propre part. Pas de Y1 sans changement de propriétaire.
 */
export function taxeRegionale(i: Y1Input): Y1Detail {
  const R = P.regional;
  const genre = i.genre ?? 'vp';
  const t = tarifRegion(i.region, i.dateOp);
  const reg = regionById(i.region);
  const dem = R.demarches[i.demarche];
  const idfm = reg.idfm ? majorationIdfm(i.dateOp) : 0;
  const cv = Math.max(1, Math.round(i.cv));
  const vieux = ageAnnees(i.date1re, i.dateOp) >= R.age_reduction_ans;
  const lourd = genre === 'utilitaire' && (i.ptacKg ?? 0) > R.poids_lourd.ptac_min_exclu;
  const coef = lourd ? R.poids_lourd.coef : R.coef_genre[genre][vieux ? 1 : 0];
  if (!dem.y1) {
    const motif: Y1Motif = i.demarche === 'adresse' ? 'adresse' : i.demarche === 'duplicata' ? 'duplicata' : 'conjoint';
    return { tarif: t.cv, tarifFrom: t.from, idfm: 0, cv, coef, exo: 0, regionale: 0, majoration: 0, y1: 0, motif };
  }
  const exo = exonerationRegionale(i.region, i.energie, i.dateOp);
  const regionale = round2(t.cv * cv * coef * (1 - exo));
  const majoration = round2(idfm * cv * coef);
  const y1 = round2(regionale + majoration);
  const motif: Y1Motif = genre === 'cyclo' ? 'cyclo' : exo >= 1 ? 'exonere' : exo > 0 ? 'reduit' : genre === 'moto' ? 'moto' : vieux ? 'age' : 'plein';
  return { tarif: t.cv, tarifFrom: t.from, idfm, cv, coef, exo, regionale, majoration, y1, motif };
}

/** Y2 : taxe sur les véhicules de transport, selon le PTAC (camionnettes, camions ; pas les camping-cars). */
export function taxeY2(genre: Genre, ptacKg: number): number {
  if (genre !== 'utilitaire' && !(genre === 'camping_car' && P.y2.camping_car_soumis)) return 0;
  for (const b of P.y2.bareme) if (b.ptac_max === null || ptacKg <= b.ptac_max) return b.montant;
  return 0;
}

export type MalusYear = keyof typeof P.malus_co2.annees;
/** Colonne du barème CO₂ applicable à une date de première immatriculation. */
export function anneeBareme(date1re: string): MalusYear {
  const ys = Object.keys(P.malus_co2.annees).sort() as MalusYear[];
  let cur = ys[0];
  for (const y of ys) if (P.malus_co2.annees[y].from <= date1re) cur = y;
  return cur;
}

/** Malus CO₂ brut d'un barème pour un taux WLTP en g/km (avant décote). */
export function malusCO2Brut(gkm: number, annee: MalusYear): number {
  const b = P.malus_co2.annees[annee];
  const g = Math.floor(gkm);
  if (g < b.seuil) return 0;
  if (g >= b.plafond_des) return b.plafond;
  const row = b.grille.find((r) => r[0] === g);
  if (!row) throw new Error(`Barème ${annee} sans ligne pour ${g} g/km`);
  return row[1];
}

/** Mois entamés entre la première immatriculation et l'opération (un mois commencé compte). */
export function moisEntames(date1re: string, dateOp: string): number {
  const [y1, m1, d1] = date1re.split('-').map(Number);
  const [y2, m2, d2] = dateOp.split('-').map(Number);
  let m = (y2 - y1) * 12 + (m2 - m1);
  if (d2 >= d1) m += 1;
  return Math.max(0, m);
}

/** Coefficient de décote (part retirée, 0 à 1) d'un véhicule d'occasion importé, selon son âge en mois. */
export function coefficientDecote(mois: number): number {
  if (mois <= 0) return 0;
  for (const d of P.decote_import.grille) if (d.mois_max === null || mois <= d.mois_max) return d.reduction;
  return 1;
}

type MasseYear = keyof typeof P.malus_masse.annees;
/** Colonne du barème du malus au poids pour une date de première immatriculation (null avant 2022). */
export function anneeMasse(date1re: string): MasseYear | null {
  if (date1re < P.malus_masse.premiere_annee) return null;
  const ys = Object.keys(P.malus_masse.annees).sort() as MasseYear[];
  let cur = ys[0];
  for (const y of ys) if (P.malus_masse.annees[y].from <= date1re) cur = y;
  return cur;
}

/** Malus au poids d'une masse taxable, tranche par tranche (chaque kilo de la tranche compte). */
export function malusMasseBrut(masseKg: number, annee: MasseYear): number {
  let tot = 0;
  for (const t of P.malus_masse.annees[annee].tranches) {
    const hi = t.max === null ? Infinity : t.max;
    if (masseKg >= t.min) tot += (Math.min(Math.floor(masseKg), hi) - t.min + 1) * t.euro_kg;
  }
  return tot;
}

/** Abattement de masse d'un hybride selon sa date de première immatriculation ('exo' = exonéré). */
export function abattementHybride(energie: Energie, date1re: string, masseKg: number, autonomieKm = 0): number | 'exo' {
  const M = P.malus_masse;
  let row: (typeof M.hybrides)[number] | null = null;
  for (const h of M.hybrides) if (h.from <= date1re) row = h;
  if (!row) return 0;
  if (energie === 'micro_hybride') return row.micro;
  if (energie === 'hybride') return row.hybride;
  if (energie === 'hybride_rechargeable') {
    if (autonomieKm <= M.phev.autonomie_min_km) return 0;
    if (row.phev === 'exo') return 'exo';
    return Math.min(Number(row.phev), Math.floor(masseKg * M.phev.plafond_part_masse));
  }
  return 0;
}

export interface MalusInput {
  gkm: number;
  masseKg: number;
  energie: Energie;
  /** Date de la première immatriculation (à l'étranger pour un import d'occasion ; aujourd'hui pour un neuf). */
  date1re: string;
  /** Date de l'immatriculation en France. */
  dateOp: string;
  origine: Origine;
  genre?: Genre;
  enfants?: number;
  handicap?: boolean;
  autonomieKm?: number;
}
export type MalusNote = 'genre' | 'deja_france' | 'handicap' | 'avant_2015' | 'nedc' | 'masse_exo_energie' | 'masse_avant_2022' | 'masse_exo_phev' | 'plafond_cumul';
export interface MalusDetail {
  soumis: boolean; calcule: boolean; annee: MalusYear; co2Brut: number; gRetenu: number; co2: number;
  masseBrut: number; masseAbattementKg: number; masseTaxable: number; masse: number;
  decote: number; plafond: number; total: number; notes: MalusNote[];
}

/**
 * Malus CO₂ et malus au poids d'une voiture particulière lors de sa première immatriculation en France
 * (neuve ou importée). Barème : celui de l'année de première immatriculation. Import d'occasion : décote
 * selon l'âge en mois, rien avant 2015. Camping-cars, utilitaires et deux-roues : hors champ.
 */
export function malus(i: MalusInput): MalusDetail {
  const annee = anneeBareme(i.date1re);
  const b = P.malus_co2.annees[annee];
  const notes: MalusNote[] = [];
  const vide = (soumis = false, calcule = true): MalusDetail => ({ soumis, calcule, annee, co2Brut: 0, gRetenu: 0, co2: 0, masseBrut: 0, masseAbattementKg: 0, masseTaxable: 0, masse: 0, decote: 0, plafond: b.plafond, total: 0, notes });
  if ((i.genre ?? 'vp') !== 'vp') { notes.push('genre'); return vide(); }
  if (i.origine === 'france_occasion') { notes.push('deja_france'); return vide(); }
  if (i.handicap) { notes.push('handicap'); return vide(); }
  const occasion = i.origine === 'import_occasion';
  if (occasion && i.date1re < P.decote_import.zero_avant) { notes.push('avant_2015'); return vide(true); }
  if (!zeroEmission(i.energie) && i.date1re < P.malus_co2.premiere_annee_wltp) { notes.push('nedc'); return vide(true, false); }
  const enfants = i.enfants ?? 0;
  const famille = enfants >= P.malus_co2.famille.enfants_min;
  let g = zeroEmission(i.energie) ? 0 : i.gkm;
  if (i.energie === 'e85' && g <= P.malus_co2.e85.taux_max_gkm) g = g * (1 - P.malus_co2.e85.abattement);
  if (famille) g -= P.malus_co2.famille.g_par_enfant * enfants;
  const gRetenu = Math.max(0, Math.floor(g));
  const co2Brut = zeroEmission(i.energie) ? 0 : malusCO2Brut(gRetenu, annee);
  let masseBrut = 0, masseAb = 0, masseTaxable = 0;
  const am = anneeMasse(i.date1re);
  const hyb = abattementHybride(i.energie, i.date1re, i.masseKg, i.autonomieKm);
  if (zeroEmission(i.energie) && P.malus_masse.electrique_exonere) notes.push('masse_exo_energie');
  else if (am === null) notes.push('masse_avant_2022');
  else if (hyb === 'exo') notes.push('masse_exo_phev');
  else {
    masseAb = hyb + (famille ? P.malus_masse.famille.kg_par_enfant * enfants : 0);
    masseTaxable = Math.max(0, Math.floor(i.masseKg) - masseAb);
    masseBrut = malusMasseBrut(masseTaxable, am);
  }
  const decote = occasion ? coefficientDecote(moisEntames(i.date1re, i.dateOp)) : 0;
  const plafond = b.plafond * (1 - decote);
  let co2 = co2Brut * (1 - decote);
  let masse = masseBrut * (1 - decote);
  if (co2 + masse > plafond) { masse = Math.max(0, plafond - co2); notes.push('plafond_cumul'); }
  co2 = Math.round(co2); masse = Math.round(masse);
  return { soumis: true, calcule: true, annee, co2Brut, gRetenu, co2, masseBrut, masseAbattementKg: masseAb, masseTaxable, masse, decote, plafond: Math.round(plafond), total: co2 + masse, notes };
}

/** Puissance administrative d'une voiture immatriculée depuis 2021, d'après sa puissance nette en kW (case P.2). */
export function chevauxFiscaux(kw: number): { formule: number; arrondi: number } {
  const f = P.puissance_fiscale;
  const x = kw / 100;
  const v = f.a * x * x + f.b * x + f.c;
  return { formule: v, arrondi: Math.max(1, Math.round(v)) };
}

/** Puissance administrative d'un deux-roues ou tricycle thermique, d'après la cylindrée en cm³. */
export function chevauxMoto(cm3: number): number {
  const m = P.puissance_fiscale.moto;
  const c = cm3 / 1000;
  for (const [max, cv] of m.paliers) if (c <= max) return cv;
  return Math.ceil(m.au_dela_base + m.au_dela_coef * (c - 0.5));
}

export interface CoutInput extends Y1Input {
  genre: Genre;
  origine: Origine;
  gkm: number;
  masseKg: number;
  ptacKg: number;
  enfants?: number;
  handicap?: boolean;
  autonomieKm?: number;
  /** Rang du changement d'adresse (les trois premiers ne donnent pas de nouveau titre). */
  rangAdresse?: number;
}
export interface CoutDetail {
  y1: Y1Detail; y2: number; malus: MalusDetail; y4: number; y5: number; total: number; etiquette: boolean;
}

/** Coût complet du titre, ligne par ligne. */
export function coutCarteGrise(i: CoutInput): CoutDetail {
  const dem = P.regional.demarches[i.demarche];
  const y1 = taxeRegionale(i);
  const y2 = dem.y2 ? taxeY2(i.genre, i.ptacKg) : 0;
  const premiere = i.demarche === 'immat' && i.origine !== 'france_occasion';
  const m = malus(premiere
    ? { gkm: i.gkm, masseKg: i.masseKg, energie: i.energie, dateOp: i.dateOp, date1re: i.date1re, origine: i.origine, genre: i.genre, enfants: i.enfants, handicap: i.handicap, autonomieKm: i.autonomieKm }
    : { gkm: 0, masseKg: 0, energie: i.energie, dateOp: i.dateOp, date1re: i.date1re, origine: 'france_occasion', genre: i.genre });
  const etiquette = i.demarche === 'adresse' && (i.rangAdresse ?? 1) <= P.national.adresse_gratuits;
  if (etiquette) return { y1, y2: 0, malus: m, y4: 0, y5: 0, total: 0, etiquette };
  const y4 = dem.y4 ? P.national.taxe_fixe : 0;
  const y5 = dem.y5 ? P.national.redevance : 0;
  const total = round2(Math.round(y1.y1 + y2 + m.total + y4) + y5);
  return { y1, y2, malus: m, y4, y5, total, etiquette };
}

/** Même véhicule dans chaque région, trié du moins cher au plus cher. */
export function comparerRegions(i: CoutInput) {
  return REGION_IDS.map((r) => ({ region: r, ...coutCarteGrise({ ...i, region: r }) })).sort((a, b) => a.total - b.total || a.region.localeCompare(b.region));
}
