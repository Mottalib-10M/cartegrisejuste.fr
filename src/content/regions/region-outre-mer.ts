import { defineGuide, type Helpers } from '../../lib/guide-types';

const DOM = ['guadeloupe', 'martinique', 'guyane', 'la-reunion', 'mayotte'];
const jour = (h: Helpers) => h.P.regional.date_releve;
const terr = (h: Helpers, id: string) => h.P.regions.find((r) => r.id === id)!;

/** Taux national par cheval de chaque territoire (majoration IDFM comprise) au jour du relevé. */
const taux = (h: Helpers) => h.P.regions.map((r) => ({ r, v: h.M.tarifRegion(r.id, jour(h)).cv + (r.idfm ? h.M.majorationIdfm(jour(h)) : 0) }));
const position = (h: Helpers, id: string) => { const t = taux(h); const moi = t.find((x) => x.r.id === id)!.v; return t.filter((x) => x.v > moi).length + 1; };
const leMoinsCher = (h: Helpers) => taux(h).sort((a, b) => a.v - b.v)[0];
const nbEgaux = (h: Helpers, id: string) => { const t = taux(h); const moi = t.find((x) => x.r.id === id)!.v; return t.filter((x) => x.v === moi).length; };

/** Taxe régionale d'une voiture essence d'occasion, et coût du titre complet. */
const y1 = (h: Helpers, id: string, cv: number, vieille = false, date = jour(h)) =>
  h.M.taxeRegionale({ cv, region: id, date1re: vieille ? '2011-06-01' : '2021-06-01', dateOp: date, energie: 'essence', demarche: 'titulaire' }).y1;
const titre = (h: Helpers, id: string, cv: number) =>
  h.M.coutCarteGrise({ cv, region: id, date1re: '2021-06-01', dateOp: jour(h), energie: 'essence', demarche: 'titulaire', genre: 'vp', origine: 'france_occasion', gkm: 0, masseKg: 0, ptacKg: 0 }).total;
const ordEn = (n: number) => `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'}`;
const nomFr = (h: Helpers, id: string) => ({ guadeloupe: 'la Guadeloupe', martinique: 'la Martinique', guyane: 'la Guyane', 'la-reunion': 'La Réunion', mayotte: 'Mayotte' } as Record<string, string>)[id] ?? terr(h, id).nom.fr;

export default defineGuide({
  id: 'region-outre-mer',
  group: 'regions',
  order: 140,
  tool: 'cout',
  region: 'la-reunion',
  related: ['tarif-cheval-fiscal', 'comparer-regions', 'adresse-duplicata', 'import-hors-europe', 'region-corse'],
  sources: ['prixcv', 'a18021', 'cibs', 'ants', 'douane'],
  fr: {
    slug: 'region/outre-mer',
    nav: 'Outre-mer',
    card: 'Guadeloupe, Martinique, Guyane, La Réunion et Mayotte : cinq tarifs du cheval fiscal, du plus bas de France au plafond.',
    title: 'Carte grise outre-mer 2026 : Réunion, Antilles, Mayotte',
    description: 'Carte grise outre-mer en 2026 : 60 € par cheval à La Réunion, 53 € en Martinique, 42,50 € en Guyane, 41 € en Guadeloupe et 30 € à Mayotte. Exemples par CV.',
    h1: 'Immatriculer un véhicule dans les départements d’outre-mer en 2026',
    intro: 'Le simulateur s’ouvre sur La Réunion ; choisissez la Guadeloupe, la Martinique, la Guyane ou Mayotte dans la liste des régions pour changer de tarif.',
    resume: (h) => {
      const run = terr(h, 'la-reunion');
      const [r0, r1] = run.tarifs;
      const may = h.M.tarifRegion('mayotte', jour(h));
      const bas = leMoinsCher(h);
      const v = (id: string) => h.eur2(h.M.tarifRegion(id, jour(h)).cv);
      return `Les cinq départements d’outre-mer votent chacun leur tarif du cheval fiscal, et ${h.eur(h.M.tarifRegion('la-reunion', jour(h)).cv - may.cv)} par cheval séparent le plus cher du moins cher. Au ${h.date(jour(h))}, le simulateur officiel de l’État donne ${v('la-reunion')} à La Réunion, ${v('martinique')} en Martinique, ${v('guyane')} en Guyane, ${v('guadeloupe')} en Guadeloupe et ${h.eur2(may.cv)} à Mayotte. ${bas.r.id === 'mayotte' ? 'Mayotte a ainsi le tarif le plus bas de France' : 'Mayotte reste parmi les tarifs les plus bas de France'}, tandis que La Réunion a rejoint le plafond légal de ${h.eur2(h.P.regional.plafond_cv)} le ${h.date(r1.from!)}, date confirmée par l’État, en partant de ${h.eur2(r0.cv)}. Pour une voiture de 5 CV de moins de dix ans, la taxe régionale va donc de ${h.eur(y1(h, 'mayotte', 5))} à Mayotte à ${h.eur(y1(h, 'la-reunion', 5))} à La Réunion. Aucun de ces territoires ne réduit la taxe des voitures électriques. Le tarif est divisé par deux à partir de dix ans et pour les motos. Aucune délibération de ces collectivités n’a pu être lue : les montants viennent du simulateur de l’État.`;
    },
    faqs: (h) => {
      const run = terr(h, 'la-reunion');
      const [r0, r1] = run.tarifs;
      const mart = terr(h, 'martinique').tarifs[0];
      return [
        { q: 'Combien coûte une carte grise à La Réunion pour une voiture de 6 CV ?', a: `Pour une voiture d’occasion de moins de dix ans, la taxe régionale est de ${h.eur(y1(h, 'la-reunion', 6))} et le titre complet de ${h.eur2(titre(h, 'la-reunion', 6))}. Avant le ${h.date(r1.from!)}, au tarif de ${h.eur2(r0.cv)}, la même taxe régionale valait ${h.eur(y1(h, 'la-reunion', 6, false, r0.from!))}. Une voiture de dix ans ou plus paie la moitié du montant actuel.` },
        { q: 'D’où vient le tarif très bas de la carte grise à Mayotte ?', a: `Le Département de Mayotte applique un tarif de ${h.eur2(h.M.tarifRegion('mayotte', jour(h)).cv)} par cheval, que le simulateur de l’État affiche sans date de changement connue. C’est un choix de la collectivité, dans la limite du plafond légal. Une voiture de 7 CV récente y paie ${h.eur(y1(h, 'mayotte', 7))} de taxe régionale, contre ${h.eur(y1(h, 'la-reunion', 7))} à La Réunion voisine.` },
        { q: 'Le tarif de la Martinique est-il plus élevé que celui de la Guadeloupe ?', a: `Oui. La Martinique applique ${h.eur2(mart.cv)} par cheval, depuis le ${h.date(mart.from!)} selon des sources secondaires, date non vérifiée dans un texte officiel. La Guadeloupe reste à ${h.eur2(h.M.tarifRegion('guadeloupe', jour(h)).cv)}. Pour une voiture de 5 CV récente, l’écart de taxe régionale atteint ${h.eur(y1(h, 'martinique', 5) - y1(h, 'guadeloupe', 5))}.` },
        { q: 'Je déménage en Guyane avec ma voiture : dois-je repayer la carte grise ?', a: `Non, si vous restez propriétaire du véhicule. Le fichier des immatriculations est national : vous déclarez une nouvelle adresse sur le site de l’ANTS, sans taxe régionale, et les ${h.num(h.P.national.adresse_gratuits)} premiers changements donnent seulement une étiquette à coller. Le transport par bateau peut en revanche entraîner des frais de douane et d’octroi de mer, qui ne figurent pas sur la carte grise.` },
      ];
    },
    body: (h) => {
      const run = terr(h, 'la-reunion');
      const [r0, r1] = run.tarifs;
      const n = h.P.regions.length;
      const rows = DOM.map((id) => {
        const t = h.M.tarifRegion(id, jour(h));
        const quand = t.from ? `${h.date(t.from)}${t.dateVerifiee ? '' : ' (non vérifiée)'}` : 'inconnue';
        return [terr(h, id).nom.fr, h.eur2(t.cv), quand, `${h.num(position(h, id))}e sur ${h.num(n)}`, h.eur2(y1(h, id, 5)), h.eur2(y1(h, id, 5, true))];
      });
      const cvs = [4, 7, 10];
      const ex = cvs.map((cv) => [`${cv} CV`, ...DOM.map((id) => h.eur2(titre(h, id, cv)))]);
      return `
<h2>Les cinq tarifs côte à côte</h2>
<p>Chaque ligne indique le tarif par cheval au ${h.date(jour(h))}, la date depuis laquelle il s’applique quand elle est connue, la place du territoire dans le classement national des ${h.num(n)} tarifs, et la taxe régionale d’une voiture de 5 CV, récente puis âgée de dix ans ou plus.</p>
${h.table(['Territoire', '€ par CV', 'Depuis le', 'Classement', '5 CV, moins de 10 ans', '5 CV, 10 ans ou plus'], rows, `Départements d’outre-mer, tarifs au ${h.date(jour(h))}.`, ['l', 'r', 'l', 'l', 'r', 'r'])}
<p>Le classement part du tarif le plus élevé, majoration des transports franciliens comprise. La Réunion partage sa place avec ${h.num(nbEgaux(h, 'la-reunion') - 1)} autres régions au plafond ; Mayotte ferme la liste.</p>

<h2>La Réunion, seul changement de 2026</h2>
<p>La Réunion est passée de ${h.eur2(r0.cv)} à ${h.eur2(r1.cv)} par cheval le ${h.date(r1.from!)}. Cette date est celle du simulateur de coût de l’État ; une partie de la presse locale a avancé une date plus précoce, mais c’est la date officielle qui est retenue. L’entrée en vigueur du tarif précédent n’a pas été vérifiée à la source. L’${h.src('a18021', 'actualité de service-public.gouv.fr du 26 février 2026')} confirme la hausse. Avec ce tarif, l’île ne peut plus augmenter sa taxe : le ${h.src('cibs', 'code des impositions sur les biens et services')} la plafonne à ${h.eur2(h.P.regional.plafond_cv)} par cheval.</p>

<h2>Le prix du titre complet</h2>
<p>Le total ci-dessous concerne un changement de titulaire d’une voiture d’occasion de moins de dix ans. Il ajoute à la taxe régionale ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} de frais nationaux, les mêmes dans l’Hexagone.</p>
${h.table(['Puissance', ...DOM.map((id) => terr(h, id).nom.fr)], ex, `Coût total du certificat au ${h.date(jour(h))}.`, ['l', 'r', 'r', 'r', 'r', 'r'])}

<h2>Les sources disponibles</h2>
<p>Aucune délibération de la Région Guadeloupe, de la Collectivité territoriale de Martinique, de la Collectivité territoriale de Guyane, de la Région Réunion ou du Département de Mayotte n’a pu être consultée. Les cinq montants sont ceux que publie le ${h.src('prixcv', 'simulateur officiel du prix du cheval fiscal')}. Les tarifs plus anciens qui circulent sur internet ne sont pas repris ici faute de vérification.</p>

<h2>Ce qui change pour un véhicule venu de l’Hexagone</h2>
<ul>
<li>Vous gardez votre voiture et déménagez : simple changement d’adresse, sans taxe régionale (${h.a('adresse-duplicata', 'changement d’adresse')}).</li>
<li>Vous achetez sur place une voiture déjà immatriculée en France : tarif du territoire où vous habitez, comme pour toute vente.</li>
<li>La voiture arrive par conteneur : l’octroi de mer, et la TVA là où elle existe, relèvent de la ${h.src('douane', 'douane')}, ils ne figurent pas sur la carte grise et le simulateur ne les calcule pas.</li>
<li>Voiture électrique : plein tarif dans les cinq territoires, aucune réduction n’ayant été votée.</li>
</ul>
<p>La démarche se fait sur le ${h.src('ants', 'site de l’ANTS')}, comme en métropole. Pour situer ces territoires parmi toutes les régions, voyez le ${h.a('tarif-cheval-fiscal', 'tableau des tarifs')}.</p>
`;
    },
  },
  en: {
    slug: 'region/outre-mer',
    nav: 'Overseas departments',
    card: 'Guadeloupe, Martinique, French Guiana, Réunion and Mayotte: five fiscal horsepower rates, from France’s lowest to the cap.',
    title: 'Overseas France car registration 2026: Réunion to Mayotte',
    description: 'Car registration in France’s overseas departments, 2026: €60 per CV in Réunion, €53 Martinique, €42.50 French Guiana, €41 Guadeloupe, €30 Mayotte. Examples.',
    h1: 'Car registration in France’s overseas departments, 2026',
    intro: 'The calculator opens on Réunion; pick Guadeloupe, Martinique, French Guiana or Mayotte from the region list to switch rates.',
    resume: (h) => {
      const run = terr(h, 'la-reunion');
      const [r0, r1] = run.tarifs;
      const bas = leMoinsCher(h);
      const v = (id: string) => h.eur2(h.M.tarifRegion(id, jour(h)).cv);
      return `France’s five overseas departments each set their own fiscal horsepower rate, the per-CV charge behind the regional tax on a registration certificate (“carte grise”). The most and least expensive of the five are ${h.eur(h.M.tarifRegion('la-reunion', jour(h)).cv - h.M.tarifRegion('mayotte', jour(h)).cv)} per CV apart. On ${h.date(jour(h))} the State’s official simulator shows ${v('la-reunion')} in Réunion, ${v('martinique')} in Martinique, ${v('guyane')} in French Guiana, ${v('guadeloupe')} in Guadeloupe and ${v('mayotte')} in Mayotte. ${bas.r.id === 'mayotte' ? 'Mayotte therefore has the lowest rate in France' : 'Mayotte is among the cheapest in France'}, while Réunion reached the legal cap of ${h.eur2(h.P.regional.plafond_cv)} on ${h.date(r1.from!)}, a date confirmed by the State, up from ${h.eur2(r0.cv)}. For a 5 CV car under ten years old, the regional tax runs from ${h.eur(y1(h, 'mayotte', 5))} in Mayotte to ${h.eur(y1(h, 'la-reunion', 5))} in Réunion. None of the five gives electric cars a discount. Cars aged ten or more and motorbikes pay half. No resolution from these authorities could be read, so the figures come from the State’s simulator.`;
    },
    faqs: (h) => {
      const run = terr(h, 'la-reunion');
      const [r0, r1] = run.tarifs;
      return [
        { q: 'What does it cost to register a used 8 CV car in Réunion?', a: `For a car under ten years old, ${h.eur(y1(h, 'la-reunion', 8))} in regional tax and ${h.eur2(titre(h, 'la-reunion', 8))} for the full certificate. At the former rate of ${h.eur2(r0.cv)}, which applied until ${h.date(r1.from!)}, the regional tax would have been ${h.eur(y1(h, 'la-reunion', 8, false, r0.from!))}. A car ten years old or more pays half the current amount.` },
        { q: 'Is Mayotte really the cheapest place in France to register a car?', a: `On the State’s figures, yes: ${h.eur2(h.M.tarifRegion('mayotte', jour(h)).cv)} per CV, the lowest of all ${h.num(h.P.regions.length)} rates. A recent 7 CV car pays ${h.eur(y1(h, 'mayotte', 7))} in regional tax there. The rate is the island’s choice within the legal cap, and no change date is on record. You can only use it if Mayotte is genuinely your home address.` },
        { q: 'I am moving to Guadeloupe with my car: do I pay the regional tax again?', a: `No, as long as you still own it. France keeps one national register, so you simply declare your new address through ANTS, the registration agency, with no regional tax; the first ${h.num(h.P.national.adresse_gratuits)} address changes only produce a sticker for the certificate. Shipping the car may trigger customs charges and the local “octroi de mer” duty, which are separate from registration.` },
        { q: 'Do electric cars get a registration discount in Martinique or French Guiana?', a: `No. French law lets each region halve or scrap the tax for electric and hydrogen vehicles, but neither Martinique nor French Guiana has done so, and nor have the other overseas departments. A 5 CV electric car pays ${h.eur(y1(h, 'martinique', 5))} in Martinique and ${h.eur2(y1(h, 'guyane', 5))} in French Guiana, the same as a petrol car.` },
      ];
    },
    body: (h) => {
      const run = terr(h, 'la-reunion');
      const [r0, r1] = run.tarifs;
      const n = h.P.regions.length;
      const rows = DOM.map((id) => {
        const t = h.M.tarifRegion(id, jour(h));
        const since = t.from ? `${h.date(t.from)}${t.dateVerifiee ? '' : ' (not verified)'}` : 'unknown';
        return [terr(h, id).nom.en, h.eur2(t.cv), since, `${ordEn(position(h, id))} of ${h.num(n)}`, h.eur2(y1(h, id, 5)), h.eur2(y1(h, id, 5, true))];
      });
      const cvs = [4, 7, 10];
      const ex = cvs.map((cv) => [`${cv} CV`, ...DOM.map((id) => h.eur2(titre(h, id, cv)))]);
      return `
<h2>The five rates at a glance</h2>
<p>Rate per CV on ${h.date(jour(h))}, the date it has applied since where known, the national ranking among all ${h.num(n)} rates (most expensive first, Paris surcharge included), and the regional tax for a 5 CV car, recent and then ten years or older.</p>
${h.table(['Department', '€ per CV', 'Since', 'National rank', '5 CV, under 10 years', '5 CV, 10 years or more'], rows, `Overseas departments, rates on ${h.date(jour(h))}.`, ['l', 'r', 'l', 'l', 'r', 'r'])}
<p>Réunion shares its rank with ${h.num(nbEgaux(h, 'la-reunion') - 1)} other regions at the cap; Mayotte comes last.</p>

<h2>Réunion’s 2026 rise</h2>
<p>Réunion went from ${h.eur2(r0.cv)} to ${h.eur2(r1.cv)} per CV on ${h.date(r1.from!)}, the date shown by the State’s cost simulator; some local press gave an earlier date, but the official date is the one used here. When the earlier rate took effect has not been verified at source. The ${h.src('a18021', 'service-public.gouv.fr news item of 26 February 2026')} confirms the increase. The island cannot go higher: the ${h.src('cibs', 'French tax code')} caps the regional rate at ${h.eur2(h.P.regional.plafond_cv)}.</p>

<h2>Full certificate cost</h2>
<p>Totals for a used car under ten years old changing hands. They add ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} of national charges to the regional tax, the same amount as in mainland France.</p>
${h.table(['Power', ...DOM.map((id) => terr(h, id).nom.en)], ex, `Full certificate cost on ${h.date(jour(h))}.`, ['l', 'r', 'r', 'r', 'r', 'r'])}

<h2>What the figures rest on</h2>
<p>No resolution could be consulted from the Guadeloupe Region, the territorial authorities of Martinique and French Guiana, the Réunion Region or the Department of Mayotte. All five amounts are those published by the ${h.src('prixcv', 'official fiscal horsepower price simulator')}. Older rates quoted online are left out because they could not be checked.</p>

<h2>Bringing a car from mainland France</h2>
<ul>
<li>Moving with a car you own: an address change only, with no regional tax (${h.a('adresse-duplicata', 'address change')}).</li>
<li>Buying a car already registered in France once you live there: your department’s rate applies, as for any sale.</li>
<li>Shipping by container: the octroi de mer, plus VAT where it applies, is handled by ${h.src('douane', 'French customs')}; they are not part of the certificate and the calculator leaves them out.</li>
<li>Electric car: full rate in all five departments.</li>
</ul>
<p>The application is made on the ${h.src('ants', 'ANTS website')}, as in mainland France. To compare with every region, open the ${h.a('tarif-cheval-fiscal', 'rate table')}.</p>
`;
    },
  },
});
