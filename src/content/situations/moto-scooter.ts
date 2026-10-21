import { defineGuide, type Helpers } from '../../lib/guide-types';
import type { Genre } from '../../lib/engine/carte-grise';

const OCC = 'occitanie';
/** Deux-roues d'occasion qui change de propriétaire, au jour du relevé. */
const deuxRoues = (h: Helpers, cv: number, date1re: string, region = OCC, genre: Genre = 'moto') =>
  h.M.coutCarteGrise({ demarche: 'titulaire', region, origine: 'france_occasion', energie: 'essence', genre, cv, date1re, dateOp: h.P.regional.date_releve, gkm: 0, masseKg: 0, ptacKg: 0 });
const CYL = [
  { cc: 125, fr: 'Scooter ou moto 125', en: '125 cc scooter or motorbike' },
  { cc: 300, fr: 'Scooter 300', en: '300 cc scooter' },
  { cc: 500, fr: 'Moto 500', en: '500 cc motorbike' },
  { cc: 650, fr: 'Roadster 650', en: '650 cc roadster' },
  { cc: 900, fr: 'Trail 900', en: '900 cc adventure bike' },
  { cc: 1250, fr: 'Routière 1 250', en: '1,250 cc tourer' },
];
const coefMoto = (h: Helpers) => h.P.regional.coef_genre.moto[0];
const fixe = (h: Helpers) => h.P.national.taxe_fixe + h.P.national.redevance;
const paliers = (h: Helpers) => h.P.puissance_fiscale.moto.paliers;

export default defineGuide({
  id: 'moto-scooter',
  group: 'situations',
  order: 60,
  mini: 'moto',
  miniHref: 'home',
  related: ['tarif-cheval-fiscal', 'calcul-chevaux-fiscaux', 'comparer-regions', 'occasion-titulaire', 'lire-carte-grise'],
  sources: ['l421_17', 'cibs', 'prixcv', 'f19211', 'ants'],
  fr: {
    slug: 'moto-scooter',
    nav: 'Moto et scooter',
    card: 'Moitié du tarif régional quel que soit l’âge, rien pour un cyclomoteur, puissance fiscale selon la cylindrée, aucun malus.',
    title: 'Carte grise moto et scooter 2026 : demi-tarif et cylindrée',
    description: 'Carte grise pour moto et scooter en 2026 : moitié du tarif régional à tout âge, taxe régionale nulle pour un 50 cm³, CV selon la cylindrée et aucun malus.',
    h1: 'Carte grise d’une moto, d’un scooter ou d’un cyclomoteur',
    intro: 'Le mini-simulateur calcule la carte grise d’un deux-roues à partir de la région, de la puissance fiscale, de l’année et du type de véhicule.',
    resume: (h) => {
      const r = h.M.tarifRegion(OCC, h.P.regional.date_releve).cv;
      const m = deuxRoues(h, h.M.chevauxMoto(650), '2023-04-01');
      return `Une moto ou un scooter de plus de 50 cm³ paie la taxe régionale à ${h.pct(coefMoto(h), 0)} du tarif, et cela quel que soit son âge : la réduction propre aux deux-roues remplace celle des dix ans, elle ne s’y ajoute pas. Un cyclomoteur, scooter ou mobylette de 50 cm³, ne paie aucune taxe régionale ; sa carte grise se limite aux ${h.eur2(fixe(h))} de frais fixes de gestion et d’envoi. La puissance fiscale d’un deux-roues ne vient pas des kilowatts, mais de la cylindrée : ${h.num(paliers(h)[0][1])} CV jusqu’à ${h.num(paliers(h)[0][0] * 1000)} cm³, ${h.num(paliers(h)[paliers(h).length - 1][1])} CV jusqu’à ${h.num(paliers(h)[paliers(h).length - 1][0] * 1000)} cm³, puis un calcul au-delà. Aucun deux-roues ne paie de malus CO₂ ni de malus au poids, neuf comme d’occasion. Exemple en Occitanie, où le cheval vaut ${h.eur2(r)} au ${h.date(h.P.regional.date_releve)} : un roadster de 650 cm³, soit ${h.num(h.M.chevauxMoto(650))} CV, coûte ${h.eur2(m.total)} à immatriculer, qu’il ait deux ans ou quinze.`;
    },
    faqs: (h) => [
      { q: 'Une moto de plus de dix ans paie-t-elle un quart du tarif régional ?', a: `Non. Le code des impositions fixe pour les motos et les scooters de catégories L3e et L4e un tarif réduit de moitié, et le simulateur de l’État n’y ajoute pas la réduction des dix ans. Une moto de 2010 et une moto de 2024 de même puissance paient donc la même taxe régionale : ${h.pct(coefMoto(h), 0)} du tarif plein.` },
      { q: 'Quel prix pour immatriculer un scooter de 50 cm³ ?', a: `${h.eur2(deuxRoues(h, 1, '2024-01-01', OCC, 'cyclo').total)} dans toutes les régions, Île-de-France comprise. Les cyclomoteurs des catégories L1e et L2e ont une taxe régionale nulle, et la majoration francilienne suit cette règle. Ne restent que la taxe fixe et la redevance d’envoi du titre. Une voiturette sans permis de catégorie L6e, en revanche, n’est pas un cyclomoteur au sens de cette règle.` },
      { q: 'Où lire la puissance fiscale d’une moto d’occasion avant l’achat ?', a: 'En case P.6 de sa carte grise : c’est cette valeur qui sert au calcul, et elle est présumée exacte. Si le vendeur ne peut pas montrer le document, la cylindrée de la case P.1 permet de la retrouver avec le barème de l’article L421-17 du code des impositions, reproduit sur cette page. Une différence entre les deux doit faire poser des questions.' },
      { q: 'Un quad ou un trois-roues paie-t-il aussi le demi-tarif des motos ?', a: 'Non. Les tricycles à moteur de catégorie L5e et les quadricycles L6e et L7e paient la taxe régionale au tarif plein, avec la réduction de moitié à partir de dix ans comme une voiture. Le demi-tarif permanent est réservé aux motos et aux scooters de plus de 50 cm³, catégories L3e et L4e.' },
    ],
    body: (h) => {
      const d = h.P.regional.date_releve;
      const r = h.M.tarifRegion(OCC, d).cv;
      const rows = CYL.map((c) => {
        const cv = h.M.chevauxMoto(c.cc);
        const x = deuxRoues(h, cv, '2022-06-01');
        return [c.fr, h.num(cv), h.eur2(x.y1.y1), h.eur2(x.total)];
      });
      const p = h.P.puissance_fiscale.moto;
      const idf = deuxRoues(h, h.M.chevauxMoto(125), '2024-01-01', 'ile-de-france');
      const may = deuxRoues(h, h.M.chevauxMoto(125), '2024-01-01', 'mayotte');
      return `
<h2>De la cylindrée aux chevaux</h2>
<p>L’${h.src('l421_17', 'article L421-17 du CIBS')} donne la puissance administrative des deux-roues thermiques par paliers de cylindrée :</p>
<ul>
${p.paliers.map(([max, cv], i) => `<li>${i === 0 ? 'jusqu’à' : `de ${h.num(p.paliers[i - 1][0] * 1000 + 1)} à`} ${h.num(max * 1000)} cm³ : ${h.num(cv)} CV ;</li>`).join('\n')}
<li>au-delà de ${h.num(p.paliers[p.paliers.length - 1][0] * 1000)} cm³ : ${h.num(p.au_dela_base)} CV plus ${h.num(p.au_dela_coef)} CV par litre supplémentaire, arrondi à l’unité supérieure.</li>
</ul>
<p>Un trail de 900 cm³ a ainsi ${h.num(p.au_dela_base)} + ${h.num(p.au_dela_coef)} × ${h.num(0.9 - p.paliers[p.paliers.length - 1][0], 1)}, arrondi à ${h.num(h.M.chevauxMoto(900))} CV. La case P.6 de la carte grise reste la référence si elle diffère.</p>

<h2>Six deux-roues chiffrés en Occitanie</h2>
${h.table(['Modèle', 'CV', 'Taxe régionale', 'Carte grise'], rows, `Changement de titulaire au ${h.date(d)}, tarif de ${h.eur2(r)} par cheval, moitié appliquée.`, ['l', 'r', 'r', 'r'])}
<p>L’année de mise en circulation ne change rien à ces montants. Une grosse routière reste pourtant bon marché à côté d’une voiture de même puissance, qui paierait le double tant qu’elle a moins de dix ans.</p>

<h2>Le poids de la région</h2>
<p>Pour une 125 cm³, l’écart entre régions reste modeste : ${h.eur2(idf.total)} en Île-de-France, où la majoration des transports est elle aussi divisée par deux, contre ${h.eur2(may.total)} à Mayotte. C’est la région du domicile qui compte, pas celle du vendeur. Les tarifs régionaux de référence sont ceux du ${h.src('prixcv', 'simulateur officiel du prix du cheval fiscal')} ; pour les comparer sur votre puissance, ouvrez le ${h.a('comparer-regions', 'comparateur des régions')}.</p>

<h2>Neuve ou d’occasion : pas de malus</h2>
<p>Le malus CO₂ et le malus au poids ne visent que les voitures particulières. Une moto neuve achetée en concession ou importée d’un autre pays paie donc la même chose qu’une moto d’occasion de même puissance : la taxe régionale réduite et les ${h.eur2(fixe(h))} de frais fixes. La démarche, pour un achat entre particuliers, est la même que pour une voiture, dans le même délai : voir ${h.a('occasion-titulaire', 'voiture d’occasion')}. Elle est gratuite sur le site de l’ANTS, où l’on ne paie que les taxes.</p>
`;
    },
  },
  en: {
    slug: 'motorbike-scooter',
    nav: 'Motorbike and scooter',
    card: 'Half the regional rate at any age, nothing for a moped, fiscal horsepower from engine size, no malus.',
    title: 'Motorbike registration in France 2026: half rate by engine',
    description: 'Registering a motorbike or scooter in France in 2026: half the regional rate at any age, no regional tax for a 50 cc moped, CV from engine size and no malus.',
    h1: 'Registering a motorbike, scooter or moped in France',
    intro: 'The mini calculator prices the registration of a two-wheeler from the region, fiscal horsepower, year and vehicle type.',
    resume: (h) => {
      const r = h.M.tarifRegion(OCC, h.P.regional.date_releve).cv;
      const m = deuxRoues(h, h.M.chevauxMoto(650), '2023-04-01');
      return `A motorbike or scooter above 50 cc pays the French regional registration tax at ${h.pct(coefMoto(h), 0)} of the normal rate, whatever its age: the two-wheeler reduction replaces the ten-year rule rather than adding to it. A moped of 50 cc pays no regional tax at all, so its registration certificate, the “carte grise”, costs only the ${h.eur2(fixe(h))} of fixed handling and postage charges. A bike’s fiscal horsepower (CV) comes from its engine size, not its kilowatts: ${h.num(paliers(h)[0][1])} CV up to ${h.num(paliers(h)[0][0] * 1000)} cc, ${h.num(paliers(h)[paliers(h).length - 1][1])} CV up to ${h.num(paliers(h)[paliers(h).length - 1][0] * 1000)} cc, then a formula above that. No two-wheeler pays the CO₂ malus or the weight malus, new or used. In Occitanie, where one CV costs ${h.eur2(r)} on ${h.date(h.P.regional.date_releve)}, a 650 cc roadster rated ${h.num(h.M.chevauxMoto(650))} CV costs ${h.eur2(m.total)} to register, whether it is two years old or fifteen.`;
    },
    faqs: (h) => [
      { q: 'Does an old motorbike over ten years get a further discount in France?', a: `No. French tax law sets a half rate for L3e and L4e motorbikes and scooters, and the State simulator does not stack the ten-year reduction on top. A 2010 bike and a 2024 bike with the same horsepower pay the same regional tax: ${h.pct(coefMoto(h), 0)} of the full rate.` },
      { q: 'How much is the registration certificate for a 50 cc moped in France?', a: `${h.eur2(deuxRoues(h, 1, '2024-01-01', OCC, 'cyclo').total)} in every region, Paris included. Mopeds in categories L1e and L2e have a nil regional tax, and the Paris-region surcharge follows the same rule. Only the fixed tax and the postage fee remain. A licence-free microcar in category L6e is not a moped under this rule, though.` },
      { q: 'Where do I find the fiscal horsepower of a used motorbike before buying?', a: 'In box P.6 of its registration certificate: that figure is used for the tax and is presumed correct. If the seller cannot show the document, the engine size in box P.1 lets you work it out with the scale in article L421-17 of the tax code, reproduced on this page. A mismatch between the two is worth asking about.' },
      { q: 'Do quad bikes and three-wheelers get the motorbike half rate too?', a: 'No. Motor tricycles in category L5e and quadricycles in L6e and L7e pay the full regional rate, halved only once they are ten years old, like a car. The permanent half rate is reserved for motorbikes and scooters above 50 cc, categories L3e and L4e.' },
    ],
    body: (h) => {
      const d = h.P.regional.date_releve;
      const r = h.M.tarifRegion(OCC, d).cv;
      const rows = CYL.map((c) => {
        const cv = h.M.chevauxMoto(c.cc);
        const x = deuxRoues(h, cv, '2022-06-01');
        return [c.en, h.num(cv), h.eur2(x.y1.y1), h.eur2(x.total)];
      });
      const p = h.P.puissance_fiscale.moto;
      const idf = deuxRoues(h, h.M.chevauxMoto(125), '2024-01-01', 'ile-de-france');
      const may = deuxRoues(h, h.M.chevauxMoto(125), '2024-01-01', 'mayotte');
      return `
<h2>From engine size to horsepower</h2>
<p>${h.src('l421_17', 'Article L421-17 of the French tax code (CIBS)')} sets the administrative horsepower of petrol two-wheelers in engine-size bands:</p>
<ul>
${p.paliers.map(([max, cv], i) => `<li>${i === 0 ? 'up to' : `${h.num(p.paliers[i - 1][0] * 1000 + 1)} to`} ${h.num(max * 1000)} cc: ${h.num(cv)} CV;</li>`).join('\n')}
<li>above ${h.num(p.paliers[p.paliers.length - 1][0] * 1000)} cc: ${h.num(p.au_dela_base)} CV plus ${h.num(p.au_dela_coef)} CV per extra litre, rounded up.</li>
</ul>
<p>A 900 cc adventure bike therefore gets ${h.num(p.au_dela_base)} + ${h.num(p.au_dela_coef)} × ${h.num(0.9 - p.paliers[p.paliers.length - 1][0], 1)}, rounded up to ${h.num(h.M.chevauxMoto(900))} CV. Box P.6 of the certificate prevails if it shows something else.</p>

<h2>Six bikes costed in Occitanie</h2>
${h.table(['Model', 'CV', 'Regional tax', 'Registration'], rows, `Change of keeper on ${h.date(d)}, rate of ${h.eur2(r)} per CV, half applied.`, ['l', 'r', 'r', 'r'])}
<p>The year the bike was first registered changes none of these amounts. Even a big tourer stays cheap next to a car of the same horsepower, which would pay twice as much while under ten years old.</p>

<h2>How much the region matters</h2>
<p>For a 125 cc bike the regional gap is small: ${h.eur2(idf.total)} in Île-de-France, where the transport surcharge is halved too, against ${h.eur2(may.total)} in Mayotte. What counts is the region where you live, not where the seller lives. Regional rates come from the ${h.src('prixcv', 'official fiscal horsepower price simulator')}; to compare them for your own horsepower, use the ${h.a('comparer-regions', 'region comparison')}.</p>

<h2>New or used: no malus</h2>
<p>The CO₂ malus and the weight malus only apply to passenger cars. A new bike bought from a dealer or brought in from another country therefore pays the same as a used bike of equal horsepower: the reduced regional tax plus the ${h.eur2(fixe(h))} of fixed charges. Buying privately follows the same steps and deadline as a car: see ${h.a('occasion-titulaire', 'used car transfer')}. Applying is free on the ANTS website, the State registration agency; you only pay the taxes.</p>
`;
    },
  },
});
