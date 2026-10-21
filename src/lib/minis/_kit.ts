/** Petits outils communs aux mini-simulateurs (fichier ignoré par le registre : préfixe « _ »). */
import { formatMoney, formatPercent, formatNumber } from '../format';
import { P } from '../engine/params';
export type L = 'fr' | 'en';
export const T = <A>(l: L, fr: A, en: A) => (l === 'en' ? en : fr);
export const eur = (x: number, l: L, d = 0) => formatMoney(x, d, l);
export const eur2 = (x: number, l: L) => formatMoney(x, 2, l);
export const pct = (x: number, l: L, d = 1) => formatPercent(x, d, l);
export const num = (x: number, l: L, d = 0) => formatNumber(x, d, l);
/** Les régions en liste déroulante : la valeur est l'index dans le fichier de paramètres. */
export const regionOpts = (l: L) => P.regions.map((r, i) => ({ value: String(i), label: r.nom[l] }));
export const regionAt = (i: number) => P.regions[Math.max(0, Math.min(P.regions.length - 1, Math.round(i)))];
export const regionIndex = (id: string) => Math.max(0, P.regions.findIndex((r) => r.id === id));
/** Jour de référence d'un mini-simulateur : le jour du build (premier rendu identique au HTML servi). */
export const JOUR = __BUILD_DAY__;
export const ANNEE = Number(JOUR.slice(0, 4));
export const iso = (y: number, m = 1, d = 1) => `${Math.round(y)}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
export const ANTS = (l: L) => T(l, 'La démarche est gratuite sur le site de l’ANTS : vous ne payez que les taxes.', 'The application is free on the ANTS website: you only pay the taxes.');
