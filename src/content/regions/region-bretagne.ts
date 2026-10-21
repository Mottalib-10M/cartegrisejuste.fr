import { defineGuide, type Helpers } from '../../lib/guide-types';
import type { Demarche } from '../../lib/engine/carte-grise';

const ID = 'bretagne';
const releveBzh = (h: Helpers) => h.P.regional.date_releve;
const appelation = (h: Helpers, id: string) => h.P.regions.find((r) => r.id === id)!.nom[h.lang];
const surCv = (h: Helpers, id: string) =>
  h.M.tarifRegion(id, releveBzh(h)).cv + (h.P.regions.find((r) => r.id === id)!.idfm ? h.M.majorationIdfm(releveBzh(h)) : 0);
const podium = (h: Helpers) => {
  const v = surCv(h, ID);
  const l = h.P.regions.map((r) => surCv(h, r.id));
  return {
    place: 1 + l.filter((x) => x > v).length,
    sur: l.length,
    egales: h.P.regions.filter((r) => r.id !== ID && surCv(h, r.id) === v).map((r) => r.nom[h.lang]).sort((a, b) => a.localeCompare(b)),
  };
};
const titreBzh = (h: Helpers, cv: number, date1re: string, demarche: Demarche = 'titulaire', region = ID) =>
  h.M.coutCarteGrise({ cv, region, date1re, dateOp: releveBzh(h), energie: 'essence', demarche, genre: 'vp', origine: 'france_occasion', gkm: 0, masseKg: 0, ptacKg: 0 });
const MOINS10 = '2018-08-21';
const PLUS10 = '2016-08-21';
/** Première immatriculation la veille puis le jour des dix ans, au jour du relevé. */
const VEILLE = '2016-10-21';
const SEUIL = '2016-10-20';

export default defineGuide({
  id: 'region-bretagne',
  group: 'regions',
  order: 30,
  tool: 'cout',
  region: ID,
  related: ['dix-ans', 'heritage-donation', 'region-pays-de-la-loire', 'region-normandie', 'comparer-regions', 'tarif-cheval-fiscal'],
  sources: ['prixcv', 'a18021', 'cibs', 'f19211'],
  fr: {
    slug: 'region/bretagne',
    nav: 'Bretagne',
    card: 'La Bretagne au plafond de 60 € par cheval : exemples, règle des dix ans et cas de l’héritage.',
    title: 'Cheval fiscal Bretagne 2026 : 60 €, le plafond légal',
    description: 'Cheval fiscal en Bretagne en 2026 : 60 € par CV, le maximum autorisé. Prix de la carte grise par puissance, moitié à 10 ans, héritage et voitures électriques.',
    h1: 'Le cheval fiscal breton à 60 € : carte grise 2026',
    intro: 'Le simulateur est réglé sur la Bretagne : la puissance et la date de première immatriculation suffisent pour une occasion.',
    resume: (h) => {
      const d = releveBzh(h);
      const t = h.M.tarifRegion(ID, d);
      const p = podium(h);
      return `La Bretagne fait payer ${h.eur2(t.cv)} par cheval fiscal au ${h.date(d)}, ce qui correspond au plafond fixé par le code des impositions sur les biens et services : la région ne peut pas aller au-delà. Ce montant est confirmé par le simulateur officiel de l’État. Il s’applique, selon nos données, depuis le ${h.date(t.from!)}, une date que nous n’avons pas pu vérifier à la source régionale, le dossier budgétaire de la région n’étant pas accessible. La Bretagne partage la ${h.num(p.place)}e place du classement national avec ${h.num(p.egales.length)} autres régions, derrière la seule Île-de-France. Une voiture d’occasion de 5 CV de moins de dix ans coûte ${h.eur2(titreBzh(h, 5, MOINS10).total)} à immatriculer, dont ${h.eur2(titreBzh(h, 5, MOINS10).y1.y1)} de taxe régionale. Dès que sa première immatriculation atteint dix ans, la taxe régionale passe à ${h.eur2(titreBzh(h, 5, PLUS10).y1.y1)}. Les électriques paient le plein tarif, et un héritier autre que le conjoint paie la taxe comme un acheteur.`;
    },
    faqs: (h) => {
      const d = releveBzh(h);
      const t = h.M.tarifRegion(ID, d);
      return [
        { q: 'Faut-il attendre les dix ans d’une voiture avant d’acheter en Bretagne ?', a: `Si la voiture est à quelques jours du seuil, la différence est nette : pour 8 CV, la carte grise passe de ${h.eur2(titreBzh(h, 8, VEILLE).total)} la veille des dix ans à ${h.eur2(titreBzh(h, 8, SEUIL).total)} le jour même. Le seuil se compte depuis la première immatriculation, même à l’étranger. Le délai d’un mois après l’achat reste à respecter : c’est la date de la demande qui compte.` },
        { q: 'Hériter de la voiture d’un parent en Bretagne oblige-t-il à payer la taxe régionale ?', a: `Oui, si l’héritier n’est pas le conjoint ou le partenaire de Pacs : un enfant qui reprend la voiture paie la taxe régionale comme pour un achat, soit ${h.eur2(titreBzh(h, 6, PLUS10, 'succession').total)} au total pour une voiture de 6 CV de dix ans ou plus. Le conjoint survivant, lui, en est exonéré et ne règle que ${h.eur2(titreBzh(h, 6, PLUS10, 'conjoint').total)}.` },
        { q: 'La Bretagne fait-elle un geste pour les voitures électriques ?', a: `Non. Au ${h.date(d)}, la région applique ${h.eur2(t.cv)} par cheval aux électriques comme aux thermiques. La loi lui permettrait de réduire ce tarif de moitié ou de le supprimer pour l’électrique et l’hydrogène, mais seule la région Hauts-de-France utilise cette faculté. Une électrique neuve reste exonérée des malus nationaux, ce qui allège fortement le prix de sa première carte grise.` },
        { q: 'Le tarif de la Bretagne peut-il augmenter en 2027 ?', a: `Non, tant que la loi ne relève pas le plafond de ${h.eur2(h.P.regional.plafond_cv)} : la région l’a déjà atteint. Seule une baisse votée par le conseil régional pourrait modifier le tarif. Au ${h.date(d)}, aucune délibération nouvelle n’a été repérée, et aucune modification du plafond n’est inscrite dans le code des impositions pour 2027.` },
      ];
    },
    body: (h) => {
      const d = releveBzh(h);
      const t = h.M.tarifRegion(ID, d);
      const p = podium(h);
      const rows = [4, 6, 9, 15].map((cv) => [`${cv} CV`, h.eur2(titreBzh(h, cv, MOINS10).y1.y1), h.eur2(titreBzh(h, cv, MOINS10).total), h.eur2(titreBzh(h, cv, PLUS10).y1.y1), h.eur2(titreBzh(h, cv, PLUS10).total)]);
      const ouest = ['normandie', 'pays-de-la-loire']
        .sort((a, b) => appelation(h, a).localeCompare(appelation(h, b)))
        .map((id) => `${appelation(h, id)} (${h.eur2(surCv(h, id))})`)
        .join(' et ');
      return `
<h2>Un tarif au maximum, une date non confirmée</h2>
<p>Le ${h.src('prixcv', 'simulateur officiel du prix du cheval fiscal')} renvoie ${h.eur2(t.cv)} pour toute adresse des Côtes-d’Armor, du Finistère, d’Ille-et-Vilaine ou du Morbihan. Nos données placent son entrée en vigueur au ${h.date(t.from!)}. Cette date vient de sources secondaires : le dossier de presse du budget régional qui devait la confirmer n’a pas pu être consulté, le serveur de la région refusant l’accès, et la délibération elle-même n’a pas été trouvée. Les tarifs bretons antérieurs ne sont pas repris ici, faute de source primaire. L’${h.src('a18021', 'actualité de service-public.gouv.fr sur les tarifs 2026')} ne mentionne pas de changement en Bretagne pour 2026.</p>

<h2>Le prix d’une carte grise bretonne</h2>
${h.table(['Puissance', 'Taxe régionale, moins de 10 ans', 'Total, moins de 10 ans', 'Taxe régionale, 10 ans ou plus', 'Total, 10 ans ou plus'], rows, `Bretagne, voiture essence d’occasion, changement de titulaire au ${h.date(d)}.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Le total contient, en plus de la taxe régionale, la taxe fixe et l’envoi du titre, soit ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} pour toute la France. Une voiture neuve ou importée peut devoir en outre le malus CO₂ et le malus au poids, calculés par le ${h.a('home', 'simulateur complet')}.</p>

<h2>Le seuil des dix ans pèse plus lourd au plafond</h2>
<p>La réduction de moitié fait gagner ${h.eur2(t.cv / 2)} par cheval en Bretagne, l’un des gains les plus élevés du pays puisque le tarif est au maximum. Pour une voiture de 8 CV, une demande déposée la veille du dixième anniversaire de la première immatriculation coûte ${h.eur2(titreBzh(h, 8, VEILLE).total)} ; le lendemain, ${h.eur2(titreBzh(h, 8, SEUIL).total)}. Le calcul se fait en années révolues à la date de la demande, et l’immatriculation d’origine compte même si elle a eu lieu hors de France. La page sur la ${h.a('dix-ans', 'règle des dix ans')} montre comment intégrer ce seuil à un achat.</p>

<h2>Succession, donation, conjoint</h2>
<p>Quand une voiture passe d’un défunt à ses enfants, ou qu’elle est donnée, la taxe régionale est due au tarif breton comme pour une vente. Seuls le conjoint, le partenaire de Pacs ou la personne qui se retire du certificat après un divorce en sont exonérés, en vertu de l’article L421-52 du code des impositions ; ils ne paient alors que la taxe fixe et l’envoi, ${h.eur2(titreBzh(h, 6, MOINS10, 'conjoint').total)}. La page ${h.a('heritage-donation', 'héritage et donation')} détaille les pièces à fournir. Le coût exact de chaque démarche est rappelé sur la ${h.src('f19211', 'fiche officielle du coût du certificat')}.</p>

<h2>Électrique : le tarif plein</h2>
<p>La Bretagne n’a pas voté de réduction pour les voitures électriques ou à hydrogène. Une électrique de 5 CV paie donc ${h.eur2(h.M.taxeRegionale({ cv: 5, region: ID, date1re: MOINS10, dateOp: d, energie: 'electrique', demarche: 'titulaire' }).y1)} de taxe régionale, autant qu’une essence. Le GPL et le superéthanol ne peuvent plus bénéficier d’aucune exonération régionale.</p>

<h2>La Bretagne parmi les régions</h2>
<p>Au plafond, la Bretagne est ex aequo avec ${p.egales.join(', ')}. Ses voisines sont ${ouest}. Pour une voiture de 7 CV de moins de dix ans, un domicile en ${h.a('region-pays-de-la-loire', 'Pays de la Loire')} coûte ${h.eur2(titreBzh(h, 7, MOINS10).total - titreBzh(h, 7, MOINS10, 'titulaire', 'pays-de-la-loire').total)} de moins. Le ${h.a('comparer-regions', 'comparateur des régions')} fait le calcul pour votre véhicule.</p>
`;
    },
  },
  en: {
    slug: 'region/bretagne',
    nav: 'Brittany',
    card: 'Brittany at the €60 per CV ceiling: examples, the ten-year rule and inherited cars.',
    title: 'Brittany car registration 2026: €60 per CV, the legal cap',
    description: 'Registering a car in Brittany in 2026: €60 per fiscal horsepower, the maximum allowed. Costs by horsepower, the half rate at 10 years, inheritance, electric.',
    h1: 'Car registration in Brittany: €60 per fiscal horsepower in 2026',
    intro: 'The calculator is set to Brittany: for a used car, the horsepower and the first registration date are all you need.',
    resume: (h) => {
      const d = releveBzh(h);
      const t = h.M.tarifRegion(ID, d);
      const p = podium(h);
      return `Brittany (Bretagne), the peninsula covering Rennes, Brest, Quimper and Vannes, charges ${h.eur2(t.cv)} per fiscal horsepower on ${h.date(d)}. The fiscal horsepower, cheval fiscal in French, is the administrative power shown in box P.6 of the registration certificate, and the regional tax is that figure multiplied by the rate. Brittany’s rate equals the ceiling set by the French tax code, so it cannot go higher. The State’s official simulator confirms the amount. Our data have it in force since ${h.date(t.from!)}, a date we could not verify at the regional source because the region’s budget documents were not accessible. Brittany ties for place ${h.num(p.place)} nationally with ${h.num(p.egales.length)} other regions, behind Île-de-France only. Registering a used 5 CV car under ten years old costs ${h.eur2(titreBzh(h, 5, MOINS10).total)}, of which ${h.eur2(titreBzh(h, 5, MOINS10).y1.y1)} is regional tax; once the first registration is ten years old, the regional tax drops to ${h.eur2(titreBzh(h, 5, PLUS10).y1.y1)}. Electric cars pay in full.`;
    },
    faqs: (h) => {
      const d = releveBzh(h);
      const t = h.M.tarifRegion(ID, d);
      return [
        { q: 'I inherited my father’s car in Brittany: do I pay the regional tax?', a: `Yes, unless you were his spouse or civil partner. A child or other heir pays the regional tax as on a purchase, so a 6 CV car ten or more years old costs ${h.eur2(titreBzh(h, 6, PLUS10, 'succession').total)} to transfer. A surviving spouse is exempt from the regional tax and pays only ${h.eur2(titreBzh(h, 6, PLUS10, 'conjoint').total)}. The application is made online on the ANTS website.` },
        { q: 'Is it worth waiting until a car turns ten before registering it in Brittany?', a: `Only if the anniversary is close, because you must still apply within one month of buying. For an 8 CV car the certificate costs ${h.eur2(titreBzh(h, 8, VEILLE).total)} the day before the tenth anniversary of its first registration and ${h.eur2(titreBzh(h, 8, SEUIL).total)} on the day itself. The first registration counts even if it was abroad.` },
        { q: 'Will Brittany raise its fiscal horsepower rate in 2027?', a: `It cannot while the legal ceiling stays at ${h.eur2(h.P.regional.plafond_cv)}, since Brittany already charges ${h.eur2(t.cv)}. Only a cut voted by the regional council could change it. On ${h.date(d)} no new regional decision had been found and the tax code holds no change to the ceiling for 2027, so the rate should stay as it is.` },
      ];
    },
    body: (h) => {
      const d = releveBzh(h);
      const t = h.M.tarifRegion(ID, d);
      const p = podium(h);
      const rows = [5, 7, 10, 13].map((cv) => [`${cv} CV`, h.eur2(titreBzh(h, cv, MOINS10).total), h.eur2(titreBzh(h, cv, PLUS10).total), h.eur2(titreBzh(h, cv, MOINS10, 'conjoint').total)]);
      return `
<h2>Source and start date</h2>
<p>The ${h.src('prixcv', 'official fiscal horsepower simulator')} returns ${h.eur2(t.cv)} for any address in the four Breton départements: Côtes-d’Armor, Finistère, Ille-et-Vilaine and Morbihan. Our start date of ${h.date(t.from!)} comes from secondary reporting. The regional budget press pack that should confirm it refused access, and we did not find the resolution itself. Earlier Breton rates lack a primary source and are not given here. The ${h.src('a18021', 'service-public.gouv.fr news item on 2026 rates')} reports no change in Brittany for 2026.</p>

<h2>What a Breton certificate costs</h2>
${h.table(['Horsepower', 'Used, under 10 years', 'Used, 10 years or more', 'Passed to a spouse or partner'], rows, `Brittany, petrol car, on ${h.date(d)}.`, ['l', 'r', 'r', 'r'])}
<p>The first two columns include ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} of national charges, identical across France; the last one is made of nothing else, because a spouse or civil partner taking over the car pays no regional tax. A car registered in France for the first time, new or imported, may also owe the CO₂ and weight malus; the ${h.a('home', 'full calculator')} adds them.</p>

<h2>The ten-year rule at the ceiling</h2>
<p>Because Brittany charges the maximum, the half rate saves ${h.eur2(t.cv / 2)} per CV here, as much as anywhere outside the Paris region. Age is counted in full years from the very first registration to the date you apply. The ${h.a('dix-ans', 'ten-year rule page')} explains how to check that date on a foreign document.</p>

<h2>Inheritance and gifts</h2>
<p>An heir other than the spouse, or someone receiving a car as a gift, pays the regional tax at the Breton rate, exactly as a buyer would. Spouses and civil partners are exempt under article L421-52 of the tax code. The ${h.a('heritage-donation', 'inherited and gifted car page')} lists the documents, and the ${h.src('f19211', 'official cost page')} gives the national rules.</p>

<h2>Electric cars</h2>
<p>Brittany has not voted any reduction for electric or hydrogen cars, so they pay ${h.eur2(t.cv)} per CV like petrol cars. LPG and E85 can no longer be exempted by any region.</p>

<h2>Brittany among the regions</h2>
<p>At the cap, Brittany ties with ${p.egales.join(', ')}. Next door, ${h.a('region-pays-de-la-loire', 'Pays de la Loire')} charges ${h.eur2(surCv(h, 'pays-de-la-loire'))} and ${h.a('region-normandie', 'Normandy')} ${h.eur2(surCv(h, 'normandie'))}. The ${h.a('comparer-regions', 'region comparison')} shows the gap for your own vehicle.</p>
`;
    },
  },
});
