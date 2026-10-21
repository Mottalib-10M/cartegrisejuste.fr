/** Libellés des simulateurs, dans les deux langues. Les noms de régions viennent du fichier de paramètres. */
import { P } from '../../lib/engine/params';
import type { Demarche, Energie, Genre, Origine } from '../../lib/engine/carte-grise';
import { formatMoney } from '../../lib/format';
export type L = 'fr' | 'en';
export const T = <A,>(l: L, fr: A, en: A) => (l === 'en' ? en : fr);
export const eur = (x: number, l: L, d = 0) => formatMoney(x, d, l);
/** Montant officiel cité avec ses décimales (« 2,76 € »), entier sinon. */
export const eurx = (x: number, l: L) => formatMoney(x, Number.isInteger(x) ? 0 : 2, l);
export const sep = (l: L) => (l === 'fr' ? ' : ' : ': ');

export const regionNom = (id: string, l: L) => P.regions.find((r) => r.id === id)?.nom[l] ?? id;
export const regionOptions = (l: L) => P.regions.map((r) => ({ value: r.id, label: r.nom[l] }));

export const DEMARCHE: Record<L, Record<Demarche, string>> = {
  fr: { immat: 'Première immatriculation en France', titulaire: 'Changement de titulaire (achat d’occasion)', adresse: 'Changement d’adresse', duplicata: 'Duplicata (perte, vol, détérioration)', succession: 'Héritage ou donation (hors conjoint)', conjoint: 'Véhicule repris par le conjoint ou le partenaire' },
  en: { immat: 'First registration in France', titulaire: 'Change of keeper (used purchase)', adresse: 'Change of address', duplicata: 'Duplicate (lost, stolen, damaged)', succession: 'Inherited or gifted vehicle (not a spouse)', conjoint: 'Vehicle taken over by spouse or civil partner' },
};
export const ENERGIE: Record<L, Record<Energie, string>> = {
  fr: { essence: 'Essence', diesel: 'Diesel', micro_hybride: 'Micro-hybride (moins de 30 kW)', hybride: 'Hybride non rechargeable', hybride_rechargeable: 'Hybride rechargeable', electrique: '100 % électrique', hydrogene: 'Hydrogène', e85: 'Superéthanol E85', gpl: 'GPL' },
  en: { essence: 'Petrol', diesel: 'Diesel', micro_hybride: 'Mild hybrid (under 30 kW)', hybride: 'Self-charging hybrid', hybride_rechargeable: 'Plug-in hybrid', electrique: 'Fully electric', hydrogene: 'Hydrogen', e85: 'E85 bioethanol', gpl: 'LPG' },
};
export const GENRE: Record<L, Record<Genre, string>> = {
  fr: { vp: 'Voiture particulière', utilitaire: 'Camionnette, utilitaire', camping_car: 'Camping-car', moto: 'Moto, scooter', cyclo: 'Cyclomoteur (50 cm³)' },
  en: { vp: 'Passenger car', utilitaire: 'Van, commercial vehicle', camping_car: 'Motorhome', moto: 'Motorbike, scooter', cyclo: 'Moped (50 cc)' },
};
export const ORIGINE: Record<L, Record<Origine, string>> = {
  fr: { france_occasion: 'Occasion déjà immatriculée en France', france_neuf: 'Neuf, acheté en France', import_occasion: 'Occasion importée', import_neuf: 'Neuf importé' },
  en: { france_occasion: 'Used, already registered in France', france_neuf: 'New, bought in France', import_occasion: 'Used, imported', import_neuf: 'New, imported' },
};
export const MOIS: Record<L, string[]> = {
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
export const moisOptions = (l: L) => MOIS[l].map((m, i) => ({ value: String(i + 1), label: m }));
export const iso = (y: number, m: number, d = 1) => `${Math.round(y)}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
/** La phrase fixe du site : la démarche ne coûte rien en elle-même. */
export const ANTS = (l: L) => T(l, 'La démarche est gratuite sur le site de l’ANTS : vous ne payez que les taxes.', 'The application itself is free on the official ANTS website: you only pay the taxes.');
