/** Date et heure de Paris au moment du build. Les pages statiques citent la saison à cette date ;
 *  les composants la reçoivent en propriété et la corrigent après hydratation (RECETTE §17.5). */
const now = new Date();
const part = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', ...o }).format(now);
export const BUILD_TODAY = part({ year: 'numeric', month: '2-digit', day: '2-digit' });
export const BUILD_HOUR = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', hour12: false }).format(now)) % 24;
/** Lecture de l'heure de Paris dans le navigateur (après le premier rendu seulement). */
export function parisNow() {
  const d = new Date();
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  const [h, m] = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false }).format(d).split(':').map(Number);
  return { date, hour: h % 24, minute: m };
}
