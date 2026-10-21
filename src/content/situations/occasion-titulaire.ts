import { defineGuide, type Helpers } from '../../lib/guide-types';

/** Changement de titulaire d'une voiture d'occasion déjà immatriculée en France, au jour du relevé. */
const cout = (h: Helpers, region: string, cv: number, date1re: string) =>
  h.M.coutCarteGrise({ demarche: 'titulaire', region, origine: 'france_occasion', energie: 'essence', genre: 'vp', cv, date1re, dateOp: h.P.regional.date_releve, gkm: 0, masseKg: 0, ptacKg: 0 });
const ans = (h: Helpers) => h.num(h.P.regional.age_reduction_ans);
const delai = (h: Helpers, l: 'fr' | 'en') => {
  const n = h.P.national.delai_titulaire_mois;
  return l === 'fr' ? (n === 1 ? 'un mois' : `${h.num(n)} mois`) : n === 1 ? 'one month' : `${h.num(n)} months`;
};
/** Date à laquelle une voiture atteint le seuil d'âge, à partir de sa date de 1re immatriculation. */
const seuil = (h: Helpers, date1re: string) => {
  const [y, m, d] = date1re.split('-');
  return `${Number(y) + h.P.regional.age_reduction_ans}-${m}-${d}`;
};
const REG = ['grand-est', 'ile-de-france', 'pays-de-la-loire', 'auvergne-rhone-alpes'];

export default defineGuide({
  id: 'occasion-titulaire',
  group: 'situations',
  order: 10,
  mini: 'titulaire',
  miniHref: 'home',
  related: ['dix-ans', 'tarif-cheval-fiscal', 'comparer-regions', 'taxes-ou-frais', 'lire-carte-grise', 'budget-achat'],
  sources: ['cibs', 'r322_5', 'r49', 'f19211', 'ants'],
  fr: {
    slug: 'voiture-occasion-changement-titulaire',
    nav: 'Voiture d’occasion',
    card: 'Le prix du changement de titulaire, plein tarif ou moitié selon l’âge, et le délai à tenir après l’achat.',
    title: 'Carte grise occasion 2026 : prix du changement de titulaire',
    description: 'Carte grise d’une voiture d’occasion en 2026 : taxe régionale pleine ou divisée par deux à 10 ans, aucun malus, délai d’un mois, amende de 135 € au-delà.',
    h1: 'Carte grise d’une voiture d’occasion : le changement de titulaire',
    intro: 'Le mini-simulateur chiffre la carte grise d’une voiture d’occasion à partir de trois données : votre région, la puissance fiscale et l’année de première immatriculation.',
    resume: (h) => {
      const a = cout(h, 'grand-est', 6, '2020-06-01');
      const b = cout(h, 'grand-est', 6, '2012-06-01');
      return `Acheter une voiture d’occasion déjà immatriculée en France oblige à faire établir une carte grise au nom du nouveau propriétaire, ce que l’administration appelle un changement de titulaire. Le prix tient en trois lignes : la taxe régionale (Y1), égale au tarif du cheval fiscal de votre région multiplié par la puissance de la case P.6, puis ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} de frais d’État identiques partout (Y4 pour la gestion, Y5 pour l’envoi postal du titre). La taxe régionale baisse de moitié lorsque la première immatriculation, inscrite en case B et même si elle a eu lieu à l’étranger, remonte à ${ans(h)} ans ou plus. Aucun malus CO₂ ni malus au poids n’est dû, car ils ont été payés lors de la première immatriculation en France. Exemple au ${h.date(h.P.regional.date_releve)} dans le Grand Est pour 6 CV : ${h.eur2(a.total)} pour une voiture de 2020, ${h.eur2(b.total)} pour une voiture de 2012. Le nouveau propriétaire dispose de ${delai(h, 'fr')} après la vente ; au-delà, il s’expose à une amende forfaitaire de ${h.eur(h.P.national.amende_titulaire)}.`;
    },
    faqs: (h) => [
      { q: 'Qui paie la carte grise lors de la vente d’une voiture d’occasion ?', a: `L’acheteur, sauf accord contraire écrit entre les parties. C’est lui qui demande le certificat à son nom et qui règle la taxe régionale de sa propre région, augmentée des ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} de gestion et d’envoi. Le vendeur, de son côté, déclare la cession et remet le certificat barré, daté et signé avec la mention « vendu le », ainsi que le code de cession.` },
      { q: 'Une voiture d’occasion achetée onze ans après sa première mise en circulation coûte-t-elle moins cher à immatriculer ?', a: `Oui : à partir de ${ans(h)} ans révolus depuis la date de la case B, la taxe régionale et, en Île-de-France, la majoration régionale des transports sont réduites de moitié. Les montants de gestion et d’envoi du titre, eux, ne bougent pas. L’âge se compte au jour de la demande, pas au jour de la vente : quelques jours d’attente peuvent faire franchir le seuil.` },
      { q: 'Que risque l’acheteur d’une occasion qui tarde à faire sa carte grise ?', a: `Le code de la route lui donne ${delai(h, 'fr')} à compter de la cession. Passé ce délai, rouler avec l’ancien certificat est une contravention de quatrième classe, sanctionnée par une amende forfaitaire de ${h.eur(h.P.national.amende_titulaire)}, et le véhicule peut être immobilisé. Le vendeur, lui, reste exposé aux avis de contravention tant que la cession n’a pas été déclarée.` },
      { q: 'Le malus est-il dû à nouveau quand une voiture d’occasion change de main en France ?', a: 'Non. Le malus CO₂ et le malus au poids ne frappent que la première immatriculation d’une voiture particulière en France. Une voiture qui a déjà circulé sous plaque française change de propriétaire sans malus, quel que soit son taux d’émission ou sa masse. Seule une voiture d’occasion importée, immatriculée pour la première fois en France, le paie, avec une décote liée à son âge.' },
    ],
    body: (h) => {
      const d = h.P.regional.date_releve;
      const rows = REG.map((id) => {
        const r = h.P.regions.find((x) => x.id === id)!;
        return [r.nom.fr, h.eur2(cout(h, id, 5, '2021-03-01').total), h.eur2(cout(h, id, 5, '2014-03-01').total), h.eur2(cout(h, id, 8, '2021-03-01').total), h.eur2(cout(h, id, 8, '2014-03-01').total)];
      });
      const ge = h.M.tarifRegion('grand-est', d).cv;
      const limite = cout(h, 'grand-est', 6, '2016-11-15');
      const apres = h.M.coutCarteGrise({ demarche: 'titulaire', region: 'grand-est', origine: 'france_occasion', energie: 'essence', genre: 'vp', cv: 6, date1re: '2016-11-15', dateOp: seuil(h, '2016-11-15'), gkm: 0, masseKg: 0, ptacKg: 0 });
      return `
<h2>Le calcul ligne par ligne</h2>
<p>Pour un changement de titulaire, le certificat porte trois montants. La ligne Y1 est la taxe régionale : tarif du cheval fiscal de la région où vous habitez × nombre de chevaux de la case P.6 × coefficient d’âge. Viennent ensuite ${h.eur2(h.P.national.taxe_fixe)} de gestion en Y4 et ${h.eur2(h.P.national.redevance)} pour l’envoi du titre par La Poste en Y5. Les lignes Y2 et Y3 restent à zéro pour une voiture particulière d’occasion : Y2 ne vise que les véhicules de transport, Y3 regroupe les malus de la première immatriculation. Le total Y1 + Y4 est arrondi à l’euro, puis la redevance est ajoutée, comme dans le simulateur de l’État.</p>
<p>Prenons une voiture de 6 CV vendue dans le Grand Est, où le cheval vaut ${h.eur2(ge)} au ${h.date(d)} : la taxe régionale vaut ${h.eur2(ge * 6)}, le certificat ${h.eur2(cout(h, 'grand-est', 6, '2020-06-01').total)}. Si la voiture a dépassé ${ans(h)} ans, la même ligne tombe à ${h.eur2(ge * 6 * h.P.regional.taux_reduction_age)}.</p>

<h2>Quatre régions, deux âges, deux puissances</h2>
${h.table(['Région', '5 CV, 2021', '5 CV, 2014', '8 CV, 2021', '8 CV, 2014'], rows, `Coût total du certificat au ${h.date(d)}, changement de titulaire d’une voiture essence.`, ['l', 'r', 'r', 'r', 'r'])}
<p>L’écart entre les colonnes vient de la seule taxe régionale : la partie fixe ne change pas. En Île-de-France, la majoration au profit d’Île-de-France Mobilités suit la même réduction de moitié. Pour toutes les régions à la fois, servez-vous du ${h.a('comparer-regions', 'comparateur des régions')}.</p>

<h2>La date qui compte : la case B</h2>
<p>L’âge se mesure entre la date de première immatriculation, imprimée en case B du certificat, et le jour où vous déposez la demande. La case I, date du certificat en cours, ne sert à rien ici : une voiture revendue trois fois garde la date de sa toute première mise en circulation. Pour un véhicule venu de l’étranger puis déjà immatriculé en France, la case B reprend la date étrangère, et c’est elle qui joue.</p>
<p>Exemple : une voiture de 6 CV immatriculée pour la première fois le ${h.date('2016-11-15')} coûte ${h.eur2(limite.total)} dans le Grand Est au ${h.date(d)}. Déposée le ${h.date(seuil(h, '2016-11-15'))}, la même demande ne coûte plus que ${h.eur2(apres.total)}. La page ${h.a('dix-ans', 'acheter avant ou après 10 ans')} détaille ce calcul.</p>

<h2>Les étapes, côté vendeur et côté acheteur</h2>
<ul>
<li>Le vendeur remplit avec l’acheteur le certificat de cession, déclare la vente en ligne et obtient un code de cession à transmettre à l’acheteur.</li>
<li>Il remet l’ancien titre rayé, portant la mention « vendu le », la date et sa signature, ainsi que le procès-verbal du dernier contrôle technique lorsque la voiture y est soumise.</li>
<li>L’acheteur fait sa demande sur le ${h.src('ants', 'site de l’ANTS')} dans le délai de ${delai(h, 'fr')} que fixe le ${h.src('r322_5', 'code de la route, à son article R322-5')}. La démarche est gratuite : on ne paie que les taxes. Un professionnel habilité peut aussi s’en charger, en ajoutant ses frais de service.</li>
<li>En attendant le titre définitif, le certificat provisoire permet de circuler.</li>
</ul>
<p>Le montant de l’amende, ${h.eur(h.P.national.amende_titulaire)}, est celui des contraventions de quatrième classe fixé par l’${h.src('r49', 'article R49 du code de procédure pénale')}.</p>

<h2>Cas qui sortent du changement de titulaire classique</h2>
<p>Un ajout ou un retrait de conjoint, une voiture reçue par héritage ou par donation et une voiture importée relèvent d’autres règles : ${h.a('heritage-donation', 'héritage et donation')}, ${h.a('import-europe', 'véhicule importé d’Europe')}. Les deux-roues ont leur propre coefficient, décrit sur la page ${h.a('moto-scooter', 'moto et scooter')}.</p>
`;
    },
  },
  en: {
    slug: 'used-car-transfer',
    nav: 'Used car',
    card: 'The cost of transferring a used car into your name, full or half rate by age, and the deadline after buying.',
    title: 'Used car registration in France 2026: the transfer cost',
    description: 'Registering a used car in France in 2026: regional tax at full rate or halved at 10 years, no malus, a one-month deadline and a €135 fine if you are late.',
    h1: 'Registering a used car in France: change of keeper',
    intro: 'The mini calculator prices the registration of a used car from three inputs: your region, the fiscal horsepower and the year of first registration.',
    resume: (h) => {
      const a = cout(h, 'grand-est', 6, '2020-06-01');
      const b = cout(h, 'grand-est', 6, '2012-06-01');
      return `When you buy a second-hand car that already has French plates, you must get a new registration certificate, the “carte grise”, in your own name; French officials call this a change of keeper. The price has three parts: the regional tax (line Y1), which is your region’s rate per fiscal horsepower times the figure in box P.6, a fixed tax of ${h.eur2(h.P.national.taxe_fixe)} (Y4) and a delivery fee of ${h.eur2(h.P.national.redevance)} (Y5). The regional tax is halved once the first registration shown in box B, even one made abroad, is ${ans(h)} years old or more. No CO₂ malus or weight malus is charged, because those were paid when the car was first registered in France. On ${h.date(h.P.regional.date_releve)} in Grand Est, a 6 CV car costs ${h.eur2(a.total)} if first registered in 2020 and ${h.eur2(b.total)} if first registered in 2012. The buyer has ${delai(h, 'en')} from the sale to apply; after that, a fixed fine of ${h.eur(h.P.national.amende_titulaire)} can be issued.`;
    },
    faqs: (h) => [
      { q: 'Does the buyer or the seller pay for the carte grise on a second-hand car?', a: `The buyer, unless both sides agree otherwise in writing. The new keeper applies in their own name and pays the regional tax of the region where they live, plus the ${h.eur2(h.P.national.taxe_fixe)} fixed tax and the ${h.eur2(h.P.national.redevance)} delivery fee. The seller declares the sale online, hands over the crossed-out certificate marked “vendu le” with date and signature, and passes on the transfer code.` },
      { q: 'I am buying a used car that will turn ten next month: should I wait before registering it?', a: `Often yes. The regional tax, and the Paris-region transport surcharge where it applies, are halved once ${ans(h)} full years have passed since the date in box B. Age is measured on the day you apply, not on the day you buy. Just keep within the ${delai(h, 'en')} legal deadline after the sale, or the saving may be cancelled out by a fine.` },
      { q: 'What happens if I miss the deadline to register a used car in my name?', a: `French road law gives the buyer ${delai(h, 'en')} from the date of sale. After that, driving on the previous keeper’s certificate is a fourth-class offence with a fixed fine of ${h.eur(h.P.national.amende_titulaire)}, and the police can immobilise the car. Speeding tickets may also keep going to the seller until the sale is declared, which causes disputes.` },
      { q: 'Is there a CO₂ or weight malus when buying a used car already on French plates?', a: 'No. Both malus taxes apply only once, when a passenger car is registered in France for the very first time. A car that has already been on French plates changes hands without any malus, however much it emits or weighs. Only a used car brought in from abroad pays them on its first French registration, reduced according to its age.' },
    ],
    body: (h) => {
      const d = h.P.regional.date_releve;
      const rows = REG.map((id) => {
        const r = h.P.regions.find((x) => x.id === id)!;
        return [r.nom.en, h.eur2(cout(h, id, 5, '2021-03-01').total), h.eur2(cout(h, id, 5, '2014-03-01').total), h.eur2(cout(h, id, 8, '2021-03-01').total), h.eur2(cout(h, id, 8, '2014-03-01').total)];
      });
      const ge = h.M.tarifRegion('grand-est', d).cv;
      const limite = cout(h, 'grand-est', 6, '2016-11-15');
      const apres = h.M.coutCarteGrise({ demarche: 'titulaire', region: 'grand-est', origine: 'france_occasion', energie: 'essence', genre: 'vp', cv: 6, date1re: '2016-11-15', dateOp: seuil(h, '2016-11-15'), gkm: 0, masseKg: 0, ptacKg: 0 });
      return `
<h2>How the price is built</h2>
<p>A change of keeper shows three amounts on the certificate. Line Y1 is the regional tax: the rate per fiscal horsepower (“cheval fiscal”) of the region you live in, times the CV figure in box P.6, times an age coefficient. Line Y4 is the fixed tax of ${h.eur2(h.P.national.taxe_fixe)} and line Y5 the delivery fee of ${h.eur2(h.P.national.redevance)}. Lines Y2 and Y3 stay at zero for a used passenger car: Y2 only concerns goods vehicles and Y3 holds the malus taxes of a first registration. Y1 plus Y4 is rounded to the nearest euro and the fee is then added, the same rule the State’s own simulator uses.</p>
<p>Take a 6 CV car in Grand Est, where one CV costs ${h.eur2(ge)} on ${h.date(d)}: the regional tax is ${h.eur2(ge * 6)} and the full certificate ${h.eur2(cout(h, 'grand-est', 6, '2020-06-01').total)}. Once the car is past ${ans(h)} years, that line drops to ${h.eur2(ge * 6 * h.P.regional.taux_reduction_age)}.</p>

<h2>Four regions side by side</h2>
${h.table(['Region', '5 CV, 2021', '5 CV, 2014', '8 CV, 2021', '8 CV, 2014'], rows, `Total certificate cost on ${h.date(d)}, change of keeper for a petrol car.`, ['l', 'r', 'r', 'r', 'r'])}
<p>The gap between columns comes only from the regional tax; the fixed part never moves. In Île-de-France the surcharge for Île-de-France Mobilités is halved in the same way. To see every region at once, open the ${h.a('comparer-regions', 'region comparison')}.</p>

<h2>Box B decides the age</h2>
<p>Age runs from the date of first registration printed in box B to the day you file the application. Box I, the date of the current certificate, plays no part: a car sold three times keeps the date it first took to the road. For a car that came from abroad and was later registered in France, box B carries the foreign date, and that is the one that counts.</p>
<p>Example: a 6 CV car first registered on ${h.date('2016-11-15')} costs ${h.eur2(limite.total)} in Grand Est on ${h.date(d)}. Filed on ${h.date(seuil(h, '2016-11-15'))}, the same application costs ${h.eur2(apres.total)}. The ${h.a('dix-ans', 'ten-year rule page')} walks through this timing in detail.</p>

<h2>What each side has to do</h2>
<ul>
<li>The seller fills in the transfer form (“certificat de cession”) with the buyer, declares the sale online and receives a transfer code to give the buyer.</li>
<li>The seller hands over the old certificate crossed out, marked “vendu le” with the date and signature, along with the latest roadworthiness test report (“contrôle technique”) when the car is old enough to need one.</li>
<li>The buyer applies on the ${h.src('ants', 'ANTS website')}, the State agency for registrations, within the ${delai(h, 'en')} set by ${h.src('r322_5', 'article R322-5 of the Highway Code')}. Applying is free: you only pay the taxes. A licensed garage or agent can also file for you and add a service fee.</li>
<li>A temporary certificate lets you drive until the final one arrives by post.</li>
</ul>
<p>The ${h.eur(h.P.national.amende_titulaire)} fine is the fixed amount for fourth-class offences under ${h.src('r49', 'article R49 of the Code of Criminal Procedure')}.</p>

<h2>When other rules apply</h2>
<p>Adding or removing a spouse, inheriting or receiving a car as a gift, and importing a car each follow their own rules: see ${h.a('heritage-donation', 'inherited or gifted car')} and ${h.a('import-europe', 'car imported from the EU')}. Motorbikes have their own coefficient, covered on the ${h.a('moto-scooter', 'motorbike and scooter')} page.</p>
`;
    },
  },
});
