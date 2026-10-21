/** Registre des pages de contenu : chaque fichier de `src/content/<groupe>/` est chargé ici. */
import type { PageDef, Group } from './guide-types';
const mods = import.meta.glob<{ default: PageDef }>(['../content/outils/*.ts', '../content/situations/*.ts', '../content/regions/*.ts', '../content/guides/*.ts'], { eager: true });
export const PAGES: PageDef[] = Object.entries(mods)
  .map(([file, m]) => {
    const g = m.default;
    const base = file.split('/').pop()!.replace(/\.ts$/, '');
    if (g.id !== base) throw new Error(`${file} : id « ${g.id} » différent du nom du fichier`);
    return g;
  })
  .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
export const GROUPS: Group[] = ['outils', 'situations', 'regions', 'guides'];
export const pageById = (id: string) => PAGES.find((p) => p.id === id);
