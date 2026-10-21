/**
 * Une page (outil, situation, région ou guide) = UN fichier de données dans `src/content/<groupe>/`.
 * Il porte les deux langues, le texte, la FAQ, les sources, le simulateur et les liens ; le cœur du
 * site (routes, menus, pied de page, sitemap, hreflang, schémas, maillage) le lit seul.
 */
import type { SourceKey, Params } from './engine/params';

export type Lang = 'fr' | 'en';
export type Group = 'outils' | 'situations' | 'regions' | 'guides';
/** Simulateur complet posé en tête de page (page outil, `data-outil`). */
export type Tool = 'cout' | 'tarifs' | 'co2' | 'masse' | 'cv' | 'comparer' | 'frais';
export interface FAQ { q: string; a: string }

/** Outils d'écriture passés au corps : liens internes, nombres au format de la langue, moteur. */
export interface Helpers {
  lang: Lang;
  a: (id: string, text: string) => string;
  eur: (n: number, decimals?: number) => string;
  num: (n: number, decimals?: number) => string;
  pct: (x: number, decimals?: number) => string;
  /** Tarif officiel cité avec ses décimales (« 59,50 € ») : un barème garde ses centimes (RECETTE §4.1). */
  eur2: (n: number) => string;
  date: (iso: string) => string;
  table: (headers: string[], rows: Array<Array<string | number>>, caption?: string, align?: Array<'l' | 'r'>) => string;
  src: (key: SourceKey, text?: string) => string;
  P: Params;
  M: typeof import('./engine/index');
  /** Jour de référence du build (heure de Paris). */
  today: string;
}

export interface PageText {
  slug: string;
  nav: string;
  card: string;
  /** 50 à 60 caractères, terme-clé en tête, année comprise (RECETTE §11). */
  title: string;
  /** 150 à 160 caractères. */
  description: string;
  h1: string;
  intro: string;
  /** Bloc citable : UN paragraphe d'au moins 120 mots (RECETTE §21). */
  resume: (h: Helpers) => string;
  faqs: (h: Helpers) => FAQ[];
  body: (h: Helpers) => string;
}

export interface PageDef {
  id: string;
  group: Group;
  order: number;
  /** Mini-simulateur propre au sujet (lib/minis/<mini>.ts). */
  mini?: string;
  /** Page cible du lien « calcul complet » du mini-simulateur. */
  miniHref?: string;
  /** Simulateur complet en tête de page. */
  tool?: Tool;
  /** Région présélectionnée dans le simulateur complet (pages régionales). */
  region?: string;
  related: string[];
  sources: SourceKey[];
  fr: PageText;
  en: PageText;
}
export const defineGuide = (g: PageDef): PageDef => g;
