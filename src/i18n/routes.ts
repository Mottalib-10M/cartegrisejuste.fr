import { makeRouter, type RouteDef } from './routes-core';
import { PAGES } from '../lib/guides';
export const LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'fr';
const R = (id: string, fr: string, en: string, noindex = false): RouteDef<Locale> => ({ id, paths: { fr: `/fr/${fr}/`, en: `/en/${en}/` }, ...(noindex ? { noindex } : {}) });
/** Pages du cœur. Outils, situations, régions et guides viennent de `src/content/` (lib/guides.ts). */
const CORE: RouteDef<Locale>[] = [
  { id: 'home', paths: { fr: '/fr/', en: '/en/' } },
  R('method', 'methodologie-sources', 'methodology'),
  R('about', 'a-propos', 'about'),
  R('widget', 'widget', 'widget', true),
  R('contact', 'contact', 'contact', true),
  R('editorial', 'charte-editoriale', 'editorial-policy', true),
  R('privacy', 'confidentialite', 'privacy', true),
  R('terms', 'mentions-legales', 'legal-notice', true),
  R('cookies', 'cookies', 'cookies', true),
];
export const ROUTES: RouteDef<Locale>[] = [
  CORE[0],
  ...PAGES.map((p) => R(p.id, p.fr.slug, p.en.slug)),
  ...CORE.slice(1),
];
export const { NOINDEX_PATHS, route, altPaths } = makeRouter(LOCALES, ROUTES);
