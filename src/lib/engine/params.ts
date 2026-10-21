/** Paramètres 2026 du site, lus une seule fois depuis `data/params-2026.json` (RECETTE §4). */
import raw from '../../data/params-2026.json';
export const P = raw;
export type Params = typeof raw;
export type SourceKey = keyof typeof raw.sources;
export const YEAR_PARAMS = raw.year;
