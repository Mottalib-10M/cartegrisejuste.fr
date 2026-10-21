import { defineGuide, type Helpers } from '../../lib/guide-types';
import type { Genre } from '../../lib/engine/carte-grise';

const ID = 'occitanie';
const AUTOUR = ['auvergne-rhone-alpes', 'nouvelle-aquitaine', 'provence-alpes-cote-dazur'];
const date0 = (h: Helpers) => h.P.regional.date_releve;
const nom = (h: Helpers, id: string) => h.P.regions.find((r) => r.id === id)!.nom[h.lang];
const euroCv = (h: Helpers, id: string) =>
  h.M.tarifRegion(id, date0(h)).cv + (h.P.regions.find((r) => r.id === id)!.idfm ? h.M.majorationIdfm(date0(h)) : 0);
const classe = (h: Helpers) => {
  const v = euroCv(h, ID);
  const l = h.P.regions.map((r) => euroCv(h, r.id));
  return { rang: 1 + l.filter((x) => x > v).length, total: l.length, auDessus: l.filter((x) => x > v).length };
};
const calc = (h: Helpers, cv: number, date1re: string, opts: { region?: string; genre?: Genre; energie?: 'essence' | 'electrique' } = {}) =>
  h.M.coutCarteGrise({ cv, region: opts.region ?? ID, date1re, dateOp: date0(h), energie: opts.energie ?? 'essence', demarche: 'titulaire', genre: opts.genre ?? 'vp', origine: 'france_occasion', gkm: 0, masseKg: 0, ptacKg: 3500 });
const RECENT = '2020-10-01';
const ANCIEN = '2011-03-30';

export default defineGuide({
  id: 'region-occitanie',
  group: 'regions',
  order: 110,
  tool: 'cout',
  region: ID,
  related: ['tarif-cheval-fiscal', 'camping-car', 'region-provence-alpes-cote-dazur', 'region-nouvelle-aquitaine', 'comparer-regions'],
  sources: ['prixcv', 'a18021', 'cibs', 'f19211'],
  fr: {
    slug: 'region/occitanie',
    nav: 'Occitanie',
    card: 'Un tarif à 59,50 €, juste sous le plafond : ce qu’il coûte selon la puissance et l’âge du véhicule.',
    title: 'Cheval fiscal Occitanie 2026 : 59,50 €, sous le plafond',
    description: 'Cheval fiscal en Occitanie en 2026 : 59,50 € par CV, à 50 centimes du plafond de 60 €. Prix du titre par puissance, avant et après 10 ans, et électriques.',
    h1: 'Le cheval fiscal occitan à 59,50 € : carte grise 2026',
    intro: 'Le simulateur est réglé sur l’Occitanie : il applique le tarif régional, la règle des dix ans et l’arrondi de l’État à votre véhicule.',
    resume: (h) => {
      const d = date0(h);
      const t = h.M.tarifRegion(ID, d);
      const c = classe(h);
      const ex = calc(h, 5, RECENT);
      return `L’Occitanie, de Toulouse à Montpellier et de Perpignan à Nîmes, applique ${h.eur2(t.cv)} par cheval fiscal au ${h.date(d)}, selon le simulateur officiel de l’État. C’est ${h.eur2(h.P.regional.plafond_cv - t.cv)} de moins que le plafond légal de ${h.eur2(h.P.regional.plafond_cv)}, ce qui place la région au ${h.num(c.rang)}e rang sur ${h.num(c.total)}, juste derrière les régions au plafond. Ce tarif figure dans nos données depuis le ${h.date(t.from!)}, mais cette date d’effet n’a pas été confirmée à une source primaire, et la délibération régionale n’a pas été retrouvée. Le montant, lui, est vérifié. Une voiture d’occasion de 5 CV de moins de dix ans paie ${h.eur2(ex.y1.y1)} de taxe régionale ; après arrondi à l’euro et ajout de la redevance, la carte grise coûte ${h.eur2(ex.total)}. Si la première immatriculation remonte à dix ans ou plus, la taxe est réduite de moitié. Les véhicules électriques ne bénéficient d’aucune réduction dans la région, et aucune hausse n’est annoncée pour 2027.`;
    },
    faqs: (h) => {
      const d = date0(h);
      const t = h.M.tarifRegion(ID, d);
      return [
        { q: 'Pourquoi le tarif de l’Occitanie comporte-t-il des centimes ?', a: `Parce que la région a voté ${h.eur2(t.cv)} et non un nombre rond. La taxe régionale garde ses centimes pour une puissance impaire, puis l’État arrondit la somme des taxes à l’euro le plus proche avant d’ajouter la redevance. Une voiture de 3 CV donne ainsi ${h.eur2(calc(h, 3, RECENT).y1.y1)} de taxe régionale et ${h.eur2(calc(h, 3, RECENT).total)} au total.` },
        { q: 'L’Occitanie peut-elle encore augmenter son cheval fiscal ?', a: `De ${h.eur2(h.P.regional.plafond_cv - t.cv)} au plus, car le plafond légal est de ${h.eur2(h.P.regional.plafond_cv)} par cheval. Pour une voiture de 6 CV, une telle hausse représenterait ${h.eur2((h.P.regional.plafond_cv - t.cv) * 6)}. Au ${h.date(d)}, aucune délibération en ce sens n’a été repérée, et aucune hausse régionale n’est connue pour 2027.` },
        { q: 'Une voiture électrique immatriculée en Occitanie paie-t-elle la taxe régionale ?', a: `Oui, en entier. L’Occitanie n’a pas voté la réduction que la loi permet pour l’électrique et l’hydrogène : une électrique de 6 CV paie ${h.eur2(calc(h, 6, RECENT, { energie: 'electrique' }).y1.y1)} de taxe régionale, comme une essence. Elle reste exonérée du malus CO₂ et du malus au poids lors de sa première immatriculation, ce qui compte surtout pour une voiture neuve.` },
        { q: 'Combien coûte la carte grise d’un camping-car d’occasion en Occitanie ?', a: `Un camping-car paie le tarif régional plein, réduit de moitié après dix ans, mais pas la taxe sur les véhicules de transport ni les malus. Pour un modèle de 8 CV, comptez ${h.eur2(calc(h, 8, RECENT, { genre: 'camping_car' }).total)} s’il a moins de dix ans et ${h.eur2(calc(h, 8, ANCIEN, { genre: 'camping_car' }).total)} au-delà, frais nationaux du titre compris.` },
      ];
    },
    body: (h) => {
      const d = date0(h);
      const t = h.M.tarifRegion(ID, d);
      const c = classe(h);
      const rows = [2, 5, 7, 9].map((cv) => {
        const a = calc(h, cv, RECENT), b = calc(h, cv, ANCIEN);
        return [`${cv} CV`, h.eur2(a.y1.y1), h.eur2(a.total), h.eur2(b.y1.y1), h.eur2(b.total)];
      });
      const voisins = [...AUTOUR]
        .sort((a, b) => euroCv(h, b) - euroCv(h, a) || nom(h, a).localeCompare(nom(h, b)))
        .map((id) => `<li>${nom(h, id)} : ${h.eur2(euroCv(h, id))} par cheval, soit ${h.eur2(calc(h, 7, RECENT, { region: id }).total)} pour une voiture de 7 CV récente, contre ${h.eur2(calc(h, 7, RECENT).total)} en Occitanie.</li>`)
        .join('');
      return `
<h2>Ce que l’on sait du tarif</h2>
<p>Le chiffre de ${h.eur2(t.cv)} est celui que donne le ${h.src('prixcv', 'simulateur officiel du prix du cheval fiscal')} pour une adresse en Occitanie au ${h.date(d)}. Nos données le datent du ${h.date(t.from!)}, une date relevée chez des tiers et non vérifiée dans un acte de la région : nous n’avons trouvé ni la délibération, ni le recueil des actes correspondant. Les tarifs antérieurs de la région ne sont connus que par des sources secondaires, et nous ne les citons pas. L’${h.src('a18021', 'actualité de service-public.gouv.fr sur les tarifs 2026')} ne mentionne aucun changement en Occitanie cette année.</p>

<h2>Le calcul, centime par centime</h2>
<p>La taxe régionale vaut le tarif multiplié par la puissance de la case P.6, sans arrondi. L’État additionne ensuite cette taxe et la taxe fixe de la ligne Y4, arrondit à l’euro, puis ajoute la redevance de la ligne Y5. Avec un tarif à centimes, la règle a un effet visible sur les puissances impaires.</p>
${h.table(['Puissance', 'Taxe régionale, moins de 10 ans', 'Titre, moins de 10 ans', 'Taxe régionale, 10 ans ou plus', 'Titre, 10 ans ou plus'], rows, `Occitanie, voiture essence d’occasion, changement de titulaire au ${h.date(d)}.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Après dix ans, le tarif effectif tombe à ${h.eur2(t.cv / 2)} par cheval, ce qui fait apparaître des quarts d’euro avant arrondi. Le seuil se compte depuis la première immatriculation, même hors de France, en années révolues : une voiture immatriculée pour la première fois un 30 mars passe la barre le même jour dix ans plus tard.</p>

<h2>Les régions autour de l’Occitanie</h2>
<ul>${voisins}</ul>
<p>Seule ${nom(h, 'auvergne-rhone-alpes')}, au nord-est, est nettement moins chère. ${c.auDessus === 1 ? 'Une seule région' : `${h.num(c.auDessus)} régions`} font payer le cheval plus cher que l’Occitanie. Le lieu d’achat ne change rien : c’est le domicile du nouveau titulaire au jour de la demande qui fixe le tarif. Le ${h.a('comparer-regions', 'comparateur')} refait ce calcul pour votre véhicule.</p>

<h2>Camping-cars, utilitaires et deux-roues</h2>
<p>Un camping-car, classé véhicule automoteur spécialisé, paie le tarif plein jusqu’à dix ans puis la moitié, sans taxe sur les véhicules de transport ni malus : la page ${h.a('camping-car', 'camping-car')} détaille ces règles. Une camionnette paie en plus cette taxe de transport, selon son poids total autorisé en charge. Une moto ou un scooter paie la moitié du tarif quel que soit son âge, soit ${h.eur2(t.cv / 2)} par cheval.</p>

<h2>Pas de geste pour l’électrique</h2>
<p>La faculté de réduire ou de supprimer la taxe pour les véhicules électriques et à hydrogène existe dans la loi, mais l’Occitanie ne l’utilise pas au ${h.date(d)}. Les anciennes exonérations possibles pour le GPL et le superéthanol ont, elles, disparu partout. Pour un achat neuf, l’écart entre électrique et thermique tient donc surtout aux malus nationaux, détaillés sur la ${h.src('f19211', 'fiche officielle du coût du certificat')}.</p>
`;
    },
  },
  en: {
    slug: 'region/occitanie',
    nav: 'Occitanie',
    card: 'A €59.50 rate, just below the legal cap: what it means for your car by horsepower and age.',
    title: 'Fiscal horsepower Occitanie 2026: €59.50, just under the cap',
    description: 'Fiscal horsepower in Occitanie in 2026: €59.50 per CV, 50 cents below the €60 cap. Registration cost by horsepower, before and after 10 years, electric cars.',
    h1: 'Car registration in Occitanie: €59.50 per fiscal horsepower in 2026',
    intro: 'The calculator is set to Occitanie and applies the regional rate, the ten-year rule and the State’s rounding to your vehicle.',
    resume: (h) => {
      const d = date0(h);
      const t = h.M.tarifRegion(ID, d);
      const c = classe(h);
      const ex = calc(h, 5, RECENT);
      return `Occitanie, the large southern region that includes Toulouse, Montpellier, Nîmes and Perpignan, charges ${h.eur2(t.cv)} per fiscal horsepower on ${h.date(d)}, according to the State’s official simulator. The fiscal horsepower, or cheval fiscal, is the administrative power shown in box P.6 of the French registration certificate, and the regional tax is that figure times the rate. Occitanie sits ${h.eur2(h.P.regional.plafond_cv - t.cv)} below the legal ceiling of ${h.eur2(h.P.regional.plafond_cv)}, ranking ${h.num(c.rang)} out of ${h.num(c.total)}. Our data date the rate from ${h.date(t.from!)}, but that start date has not been confirmed at a primary source and the regional resolution could not be found; the amount itself is verified. A used 5 CV car under ten years old pays ${h.eur2(ex.y1.y1)} in regional tax and ${h.eur2(ex.total)} for the full certificate after rounding. The tax is halved once the first registration is ten or more years old. Electric cars get no regional discount, and no rise is known for 2027.`;
    },
    faqs: (h) => {
      const d = date0(h);
      const t = h.M.tarifRegion(ID, d);
      return [
        { q: 'How is rounding applied to an Occitanie registration, given a rate with cents?', a: `The regional tax keeps its cents, so a 7 CV car shows ${h.eur2(calc(h, 7, RECENT).y1.y1)}. The State then adds the flat national tax, rounds that sum to the nearest euro and finally adds the posting charge, which gives ${h.eur2(calc(h, 7, RECENT).total)}. The online calculator follows the same order, so its total matches the amount asked on the ANTS website.` },
        { q: 'I am retiring to the south of France with a ten-year-old car: what will Occitanie charge?', a: `Half the rate, ${h.eur2(t.cv / 2)} per CV, because the first registration is ten or more years old, wherever it took place. A 6 CV car would cost ${h.eur2(calc(h, 6, ANCIEN).total)} in total. If the car comes from outside France, plan for the customs or tax clearance before applying, and check whether a national malus applies.` },
        { q: 'Is a motorhome cheaper to register in Occitanie than a car?', a: `Not on the regional tax, which is the same per CV, but a motorhome escapes the transport vehicle tax and the national malus. An 8 CV motorhome under ten years old costs ${h.eur2(calc(h, 8, RECENT, { genre: 'camping_car' }).total)}, the same as a used car of equal power, and ${h.eur2(calc(h, 8, ANCIEN, { genre: 'camping_car' }).total)} once ten years old.` },
      ];
    },
    body: (h) => {
      const d = date0(h);
      const t = h.M.tarifRegion(ID, d);
      const c = classe(h);
      const rows = [3, 6, 8, 11].map((cv) => [`${cv} CV`, h.eur2(calc(h, cv, RECENT).total), h.eur2(calc(h, cv, ANCIEN).total)]);
      const voisins = [...AUTOUR, ID].sort((a, b) => nom(h, a).localeCompare(nom(h, b))).map((id) => [nom(h, id), h.eur2(euroCv(h, id)), h.eur2(calc(h, 6, RECENT, { region: id }).total)]);
      return `
<h2>What is known about the rate</h2>
<p>The ${h.src('prixcv', 'official fiscal horsepower simulator')} returns ${h.eur2(t.cv)} for an Occitanie address on ${h.date(d)}. The start date of ${h.date(t.from!)} in our data comes from third-party reporting and has not been checked against a regional act; we found neither the resolution nor the relevant record of decisions. Older rates are only reported by secondary sources, so we do not quote them. The ${h.src('a18021', 'service-public.gouv.fr news item on 2026 rates')} records no change in Occitanie this year.</p>

<h2>Registration cost by horsepower</h2>
${h.table(['Horsepower', 'Under 10 years', '10 years or more'], rows, `Occitanie, used petrol car, change of keeper, on ${h.date(d)}.`, ['l', 'r', 'r'])}
<p>Each figure is the full certificate cost: regional tax, the flat national tax and the posting charge. A new or imported car may also owe the CO₂ and weight malus, which do not depend on the region.</p>

<h2>Occitanie and its neighbours</h2>
${h.table(['Region', 'Rate per CV', 'Used 6 CV car, under 10 years'], voisins, 'Same car, same date; the tax follows your home address.', ['l', 'r', 'r'])}
<p>${c.auDessus === 1 ? 'Only one region charges' : `${h.num(c.auDessus)} regions charge`} more per CV than Occitanie. Buying across the border changes nothing: the region of the new keeper’s home on the application date sets the rate, so the ${h.a('comparer-regions', 'region comparison')} is only useful if you are actually moving.</p>

<h2>Motorhomes, vans and motorbikes</h2>
<p>Motorhomes pay the full regional rate, halved at ten years, but no transport vehicle tax and no malus; the ${h.a('camping-car', 'motorhome page')} has the details. Vans add the transport vehicle tax, based on their gross weight. Motorbikes and scooters pay half the rate at any age, ${h.eur2(t.cv / 2)} per CV.</p>

<h2>Electric cars</h2>
<p>French law lets a region halve or waive its rate for electric and hydrogen vehicles, but Occitanie does not. An electric car of 6 CV pays ${h.eur2(calc(h, 6, RECENT, { energie: 'electrique' }).y1.y1)} of regional tax, like a petrol one. The national exemptions from both malus taxes still make a new electric car cheaper to register, as the ${h.src('f19211', 'official page on certificate costs')} explains.</p>
`;
    },
  },
});
