import { defineGuide, type Helpers } from '../../lib/guide-types';
import type { Genre } from '../../lib/engine/carte-grise';

const ID = 'pays-de-la-loire';
const OUEST = ['bretagne', 'centre-val-de-loire', 'normandie', 'nouvelle-aquitaine'];
const ref = (h: Helpers) => h.P.regional.date_releve;
const libelle = (h: Helpers, id: string) => h.P.regions.find((r) => r.id === id)!.nom[h.lang];
const cvPrix = (h: Helpers, id: string) =>
  h.M.tarifRegion(id, ref(h)).cv + (h.P.regions.find((r) => r.id === id)!.idfm ? h.M.majorationIdfm(ref(h)) : 0);
const ordre = (h: Helpers) => {
  const v = cvPrix(h, ID);
  const l = h.P.regions.map((r) => cvPrix(h, r.id));
  const metro = h.P.regions.filter((r) => !r.om);
  return {
    rang: 1 + l.filter((x) => x > v).length,
    sur: l.length,
    metroMoins: metro.filter((r) => cvPrix(h, r.id) < v).map((r) => r.nom[h.lang]).sort((a, b) => a.localeCompare(b)),
  };
};
const cout = (h: Helpers, cv: number, date1re: string, o: { region?: string; genre?: Genre; ptac?: number } = {}) =>
  h.M.coutCarteGrise({ cv, region: o.region ?? ID, date1re, dateOp: ref(h), energie: 'diesel', demarche: 'titulaire', genre: o.genre ?? 'vp', origine: 'france_occasion', gkm: 0, masseKg: 0, ptacKg: o.ptac ?? 0 });
const JEUNE = '2019-12-02';
const VIEUX = '2015-01-09';

export default defineGuide({
  id: 'region-pays-de-la-loire',
  group: 'regions',
  order: 120,
  tool: 'cout',
  region: ID,
  related: ['region-bretagne', 'utilitaire', 'tarif-cheval-fiscal', 'comparer-regions', 'region-nouvelle-aquitaine'],
  sources: ['prixcv', 'a18021', 'cibs', 'a421_26'],
  fr: {
    slug: 'region/pays-de-la-loire',
    nav: 'Pays de la Loire',
    card: 'Un tarif de 51 € par cheval, bien au-dessous de ceux de la Bretagne et de la Normandie voisines.',
    title: 'Carte grise Pays de la Loire 2026 : 51 € le cheval fiscal',
    description: 'Carte grise dans les Pays de la Loire en 2026 : 51 € par cheval, 9 € sous le plafond. Prix par puissance, utilitaires, électriques et écart avec la Bretagne.',
    h1: '51 € le cheval fiscal : la carte grise ligérienne en 2026',
    intro: 'Le calcul complet est préréglé sur les Pays de la Loire : choisissez le type de véhicule, sa puissance et sa date de première immatriculation.',
    resume: (h) => {
      const d = ref(h);
      const t = h.M.tarifRegion(ID, d);
      const o = ordre(h);
      return `Dans les Pays de la Loire, qui regroupent la Loire-Atlantique, le Maine-et-Loire, la Mayenne, la Sarthe et la Vendée, le cheval fiscal vaut ${h.eur2(t.cv)} au ${h.date(d)}. Ce montant est celui que donne le simulateur officiel de l’État. Il est inférieur de ${h.eur2(h.P.regional.plafond_cv - t.cv)} au plafond légal, que la Bretagne et la Normandie voisines appliquent. Nos données le font remonter au ${h.date(t.from!)}, mais cette date n’a pas été vérifiée dans un acte de la région, dont la délibération n’a pas été retrouvée. Pour une voiture diesel d’occasion de 6 CV de moins de dix ans, la carte grise coûte ${h.eur2(cout(h, 6, JEUNE).total)}, dont ${h.eur2(cout(h, 6, JEUNE).y1.y1)} de taxe régionale ; à partir de dix ans, ${h.eur2(cout(h, 6, VIEUX).total)}. Une camionnette paie en plus la taxe sur les véhicules de transport. La région n’accorde aucune réduction aux voitures électriques. Elle se place ${h.num(o.rang)}e sur ${h.num(o.sur)} régions, du tarif le plus cher au moins cher.`;
    },
    faqs: (h) => {
      const d = ref(h);
      const t = h.M.tarifRegion(ID, d);
      const bzh = cvPrix(h, 'bretagne');
      return [
        { q: 'Un habitant de Nantes paie-t-il moins qu’un Rennais pour sa carte grise dans les Pays de la Loire ?', a: `Oui. Nantes est dans les Pays de la Loire, à ${h.eur2(t.cv)} par cheval, et Rennes en Bretagne, à ${h.eur2(bzh)}. Pour une voiture de 7 CV de moins de dix ans, l’écart atteint ${h.eur2(cout(h, 7, JEUNE, { region: 'bretagne' }).total - cout(h, 7, JEUNE).total)}. C’est l’adresse du domicile au jour de la demande qui compte, pas la ville où la voiture est achetée.` },
        { q: 'Combien coûte la carte grise d’une camionnette d’occasion dans les Pays de la Loire ?', a: `Une camionnette de 3 tonnes de poids total autorisé, de 6 CV et de moins de dix ans, paie ${h.eur2(cout(h, 6, JEUNE, { genre: 'utilitaire', ptac: 3000 }).y1.y1)} de taxe régionale et ${h.eur2(cout(h, 6, JEUNE, { genre: 'utilitaire', ptac: 3000 }).y2)} de taxe sur les véhicules de transport, soit ${h.eur2(cout(h, 6, JEUNE, { genre: 'utilitaire', ptac: 3000 }).total)} au total. Depuis 2026, les camionnettes échappent aux malus lors d’une première immatriculation.` },
        { q: 'Le tarif des Pays de la Loire a-t-il augmenté en 2026 ?', a: `Non, d’après le simulateur de l’État et l’actualité officielle sur les tarifs 2026, qui ne signalent aucun changement dans la région. Le montant de ${h.eur2(t.cv)} reste en vigueur au ${h.date(d)}, et aucune hausse n’a été repérée pour 2027. La région garde une marge de ${h.eur2(h.P.regional.plafond_cv - t.cv)} sous le plafond, qu’elle pourrait utiliser par une délibération.` },
      ];
    },
    body: (h) => {
      const d = ref(h);
      const t = h.M.tarifRegion(ID, d);
      const o = ordre(h);
      const rows = [5, 7, 10, 14].map((cv) => [`${cv} CV`, h.eur2(cout(h, cv, JEUNE).y1.y1), h.eur2(cout(h, cv, JEUNE).total), h.eur2(cout(h, cv, VIEUX).total)]);
      const voisins = [...OUEST]
        .sort((a, b) => cvPrix(h, b) - cvPrix(h, a) || libelle(h, a).localeCompare(libelle(h, b)))
        .map((id) => [libelle(h, id), h.eur2(cvPrix(h, id)), `${h.eur2((cvPrix(h, id) - t.cv) * 7)}`]);
      const utl = [2500, 3500].map((p) => [`${h.num(p)} kg`, h.eur2(cout(h, 7, JEUNE, { genre: 'utilitaire', ptac: p }).y2), h.eur2(cout(h, 7, JEUNE, { genre: 'utilitaire', ptac: p }).total)]);
      return `
<h2>Un tarif stable, une source régionale manquante</h2>
<p>Le ${h.src('prixcv', 'simulateur officiel du prix du cheval fiscal')} affiche ${h.eur2(t.cv)} pour une adresse de la région au ${h.date(d)}. Nous avons cherché la délibération qui l’a fixé dans le recueil des actes régionaux : seul un acte plus ancien, portant sur un tarif antérieur, a été retrouvé. La date d’effet de nos données, le ${h.date(t.from!)}, provient donc de sources secondaires et n’est pas vérifiée. L’${h.src('a18021', 'actualité de service-public.gouv.fr sur les tarifs 2026')} ne mentionne pas de hausse dans la région cette année.</p>

<h2>Grille pour une voiture d’occasion</h2>
${h.table(['Puissance', 'Taxe régionale, moins de 10 ans', 'Carte grise, moins de 10 ans', 'Carte grise, 10 ans ou plus'], rows, `Pays de la Loire, voiture diesel, changement de titulaire au ${h.date(d)}.`, ['l', 'r', 'r', 'r'])}
<p>La carte grise ajoute à la taxe régionale ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} de lignes nationales (Y4 et Y5). Le carburant ne change rien à la taxe régionale : diesel, essence, hybride, GPL et électrique paient le même tarif par cheval dans la région. La réduction de moitié s’applique dès que la première immatriculation, même hors de France, atteint dix ans.</p>

<h2>Ce que coûte la frontière avec les régions voisines</h2>
<p>Les régions qui bordent les Pays de la Loire font toutes payer davantage. Pour une voiture de 7 CV de moins de dix ans, le surcoût par rapport à un domicile ligérien est le suivant.</p>
${h.table(['Région voisine', '€ par CV', 'Surcoût pour 7 CV'], voisins, `Différence de taxe régionale au ${h.date(d)}.`, ['l', 'r', 'r'])}
<p>En métropole, seules ${o.metroMoins.join(' et ')} sont moins chères. Ces écarts ne servent qu’en cas de déménagement : déclarer une adresse où l’on ne réside pas pour profiter d’un tarif est une fausse déclaration.</p>

<h2>Camionnettes et véhicules de travail</h2>
<p>Artisans, agriculteurs et entreprises de la région immatriculent beaucoup d’utilitaires. Une camionnette paie le tarif régional plein, réduit de moitié à dix ans, plus la taxe sur les véhicules de transport fixée par l’${h.src('a421_26', 'article A421-26 du code des impositions')} selon le poids total autorisé en charge (PTAC). Exemple pour une camionnette de 7 CV de moins de dix ans :</p>
${h.table(['PTAC', 'Taxe transport', 'Carte grise'], utl, 'Pays de la Loire, utilitaire d’occasion, changement de titulaire.', ['l', 'r', 'r'])}
<p>La page ${h.a('utilitaire', 'utilitaire et camionnette')} donne les autres tranches de poids. Un tracteur agricole ne paie pas de taxe régionale.</p>

<h2>Électrique et rang national</h2>
<p>La région n’a pas voté la réduction que la loi autorise pour les voitures électriques et à hydrogène : elles paient ${h.eur2(t.cv)} par cheval. Seuls les Hauts-de-France allègent leur tarif au ${h.date(d)}. Avec ce tarif, les Pays de la Loire occupent la ${h.num(o.rang)}e place sur ${h.num(o.sur)}. Le ${h.a('comparer-regions', 'comparateur')} vous donne l’écart exact pour votre véhicule.</p>
`;
    },
  },
  en: {
    slug: 'region/pays-de-la-loire',
    nav: 'Pays de la Loire',
    card: 'A rate of €51 per CV, well below neighbouring Brittany and Normandy.',
    title: 'Pays de la Loire car registration 2026: €51 per CV',
    description: 'Registering a car in Pays de la Loire in 2026: €51 per fiscal horsepower, €9 below the cap. Costs by horsepower, vans, electric cars and the gap with Brittany.',
    h1: 'Car registration in Pays de la Loire: €51 per CV in 2026',
    intro: 'The full calculator is preset to Pays de la Loire: choose the vehicle type, its horsepower and its first registration date.',
    resume: (h) => {
      const d = ref(h);
      const t = h.M.tarifRegion(ID, d);
      const o = ordre(h);
      return `Pays de la Loire, the western region that includes Nantes, Angers, Le Mans and the Vendée coast, charges ${h.eur2(t.cv)} per fiscal horsepower on ${h.date(d)}, according to the State’s official simulator. Fiscal horsepower, cheval fiscal in French, is the administrative power printed in box P.6 of the registration certificate, and the regional tax is that number times the rate. The region is ${h.eur2(h.P.regional.plafond_cv - t.cv)} below the legal ceiling that Brittany and Normandy both apply, which makes it noticeably cheaper than its northern neighbours. Our data date the rate from ${h.date(t.from!)}, a date we could not check in a regional act. A used 6 CV diesel car under ten years old costs ${h.eur2(cout(h, 6, JEUNE).total)} to register, including ${h.eur2(cout(h, 6, JEUNE).y1.y1)} of regional tax; at ten years or more, ${h.eur2(cout(h, 6, VIEUX).total)}. Vans also pay the transport vehicle tax. Electric cars get no regional discount. The region ranks ${h.num(o.rang)} of ${h.num(o.sur)}, from dearest to cheapest.`;
    },
    faqs: (h) => {
      const d = ref(h);
      const t = h.M.tarifRegion(ID, d);
      return [
        { q: 'We are moving from the UK to the Vendée: what will Pays de la Loire charge to register our car?', a: `For a car first registered ten or more years ago, half the rate: a 7 CV car costs ${h.eur2(cout(h, 7, VIEUX).total)}. A younger one costs ${h.eur2(cout(h, 7, JEUNE).total)}. As the UK is outside the EU, you first need a customs clearance certificate and may owe import duty and VAT; a car never registered in France can also owe the national malus.` },
        { q: 'Does a van cost more to register in Pays de la Loire than a car?', a: `Yes, slightly. A van pays the same regional rate per CV plus the transport vehicle tax, which depends on gross vehicle weight: ${h.eur2(cout(h, 6, JEUNE, { genre: 'utilitaire', ptac: 3000 }).y2)} for a 3-tonne van. A used 6 CV van of that weight under ten years old costs ${h.eur2(cout(h, 6, JEUNE, { genre: 'utilitaire', ptac: 3000 }).total)} in total. Vans are exempt from the malus since 2026.` },
        { q: 'Could Pays de la Loire raise its rate in 2027?', a: `It could, by a council vote, up to the ${h.eur2(h.P.regional.plafond_cv)} ceiling. On ${h.date(d)} no such decision had been found, and the official 2026 rates news item reports no change here. A new rate usually applies from the first day of the second month after the vote becomes enforceable, so a rise would be visible well in advance.` },
      ];
    },
    body: (h) => {
      const d = ref(h);
      const t = h.M.tarifRegion(ID, d);
      const o = ordre(h);
      const rows = [4, 6, 8, 11].map((cv) => [`${cv} CV`, h.eur2(cout(h, cv, JEUNE).total), h.eur2(cout(h, cv, VIEUX).total)]);
      const voisins = [...OUEST, ID]
        .sort((a, b) => libelle(h, a).localeCompare(libelle(h, b)))
        .map((id) => [libelle(h, id), h.eur2(cvPrix(h, id)), h.eur2(cout(h, 8, JEUNE, { region: id }).total)]);
      return `
<h2>Where the figure comes from</h2>
<p>The ${h.src('prixcv', 'official fiscal horsepower simulator')} gives ${h.eur2(t.cv)} for an address in the region on ${h.date(d)}. We looked for the regional resolution in the published record of acts and only found an older act setting a previous rate. The start date of ${h.date(t.from!)} therefore rests on secondary sources. The ${h.src('a18021', 'service-public.gouv.fr news item on 2026 rates')} reports no increase here this year.</p>

<h2>Costs for a used car</h2>
${h.table(['Horsepower', 'Under 10 years', '10 years or more'], rows, `Pays de la Loire, used diesel car, change of keeper, on ${h.date(d)}.`, ['l', 'r', 'r'])}
<p>Totals include ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} of national charges. Fuel type makes no difference to the regional line: diesel, petrol, hybrid, LPG and electric all pay the same per CV.</p>

<h2>The western neighbours compared</h2>
${h.table(['Region', 'Rate per CV', 'Used 8 CV car, under 10 years'], voisins, 'Same car and date; the rate follows the home address.', ['l', 'r', 'r'])}
<p>In mainland France only ${o.metroMoins.join(' and ')} charge less. The comparison matters if you are deciding where to settle; declaring an address where you do not live in order to pay less is a false declaration.</p>

<h2>Vans and work vehicles</h2>
<p>Vans pay the full regional rate, halved at ten years, plus the transport vehicle tax set by ${h.src('a421_26', 'article A421-26 of the tax code')} according to gross vehicle weight. The ${h.a('utilitaire', 'van page')} lists every weight band. Farm tractors pay no regional tax at all.</p>

<h2>Electric cars</h2>
<p>Pays de la Loire has not voted the reduction the law allows for electric and hydrogen vehicles, so they pay ${h.eur2(t.cv)} per CV. Only Hauts-de-France offers a cut on ${h.date(d)}. To see how the region compares for your own vehicle, use the ${h.a('comparer-regions', 'region comparison')}, or read the ${h.a('region-bretagne', 'Brittany page')} if you are weighing a move north.</p>
`;
    },
  },
});
