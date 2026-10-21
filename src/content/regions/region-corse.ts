import { defineGuide, type Helpers } from '../../lib/guide-types';

const ID = 'corse';
const releve = (h: Helpers) => h.P.regional.date_releve;
const corse = (h: Helpers) => h.P.regions.find((r) => r.id === ID)!;

/** Taxe régionale d'une voiture essence qui change de titulaire en Corse, à une date donnée. */
const y1 = (h: Helpers, cv: number, ancienne = false, date = releve(h)) =>
  h.M.taxeRegionale({ cv, region: ID, date1re: ancienne ? '2012-09-01' : '2022-09-01', dateOp: date, energie: 'essence', demarche: 'titulaire' }).y1;
const total = (h: Helpers, cv: number, ancienne = false) =>
  h.M.coutCarteGrise({ cv, region: ID, date1re: ancienne ? '2012-09-01' : '2022-09-01', dateOp: releve(h), energie: 'essence', demarche: 'titulaire', genre: 'vp', origine: 'france_occasion', gkm: 0, masseKg: 0, ptacKg: 0 }).total;
/** Dernier jour où l'ancien tarif s'appliquait. */
const veille = (iso: string) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); };

/** Rang de la Corse (1 = plus cher) et régions au même tarif, majoration IDFM comprise. */
const rang = (h: Helpers) => {
  const d = releve(h);
  const prix = h.P.regions.map((r) => ({ r, v: h.M.tarifRegion(r.id, d).cv + (r.idfm ? h.M.majorationIdfm(d) : 0) }));
  const moi = prix.find((x) => x.r.id === ID)!.v;
  return { pos: prix.filter((x) => x.v > moi).length + 1, n: prix.length, memes: prix.filter((x) => x.v === moi && x.r.id !== ID).map((x) => x.r), sous: prix.filter((x) => x.v < moi).length };
};
const avecArticle = (r: { id: string; nom: { fr: string } }) => (r.id === 'martinique' || r.id === 'guadeloupe' || r.id === 'guyane' ? `la ${r.nom.fr}` : r.nom.fr);
const ordEn = (n: number) => `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'}`;
/** Plus forte hausse de 2026 parmi les régions dont le tarif a changé cette année (hors majoration IDFM). */
const hausses2026 = (h: Helpers) =>
  h.P.regions
    .map((r) => { const i = r.tarifs.findIndex((t) => t.from?.startsWith('2026')); return i > 0 ? { r, delta: r.tarifs[i].cv - r.tarifs[i - 1].cv } : null; })
    .filter((x): x is { r: (typeof h.P.regions)[number]; delta: number } => x !== null)
    .sort((a, b) => b.delta - a.delta);

export default defineGuide({
  id: 'region-corse',
  group: 'regions',
  order: 50,
  tool: 'cout',
  region: ID,
  related: ['tarif-cheval-fiscal', 'comparer-regions', 'occasion-titulaire', 'region-provence-alpes-cote-dazur', 'region-outre-mer'],
  sources: ['delib_corse', 'prixcv', 'a18021', 'cibs', 'f19211'],
  fr: {
    slug: 'region/corse',
    nav: 'Corse',
    card: 'La plus forte hausse du cheval fiscal votée pour 2026 : ce que paie désormais une carte grise à Ajaccio ou Bastia.',
    title: 'Carte grise Corse 2026 : le cheval fiscal passe à 53 €',
    description: 'Carte grise en Corse en 2026 : 53 € par cheval fiscal depuis le 1er janvier, contre 43 € en 2025. Exemples par CV, règle des 10 ans et voitures électriques.',
    h1: 'Le tarif 2026 de la carte grise corse',
    intro: 'Le simulateur est réglé sur la Corse : entrez la puissance fiscale et la date de première immatriculation pour voir la taxe due à l’Assemblée de Corse.',
    resume: (h) => {
      const c = corse(h);
      const [avant, apres] = c.tarifs;
      const rg = rang(h);
      return `En Corse, le cheval fiscal vaut ${h.eur2(apres.cv)} depuis le ${h.date(apres.from!)}, contre ${h.eur2(avant.cv)} l’année précédente. La date d’effet de ce nouveau tarif est confirmée par le simulateur de coût de l’État, et le montant figure dans le rapport présenté à l’Assemblée de Corse. Cette hausse de ${h.eur(apres.cv - avant.cv)} par cheval est la plus forte votée par une collectivité pour 2026. La Corse se situe au ${h.num(rg.pos)}e rang sur ${h.num(rg.n)} en partant du plus cher, au même niveau que ${rg.memes.map(avecArticle).join(', ')}, et à ${h.eur(h.P.regional.plafond_cv - apres.cv)} du plafond légal. Une citadine de 4 CV de moins de dix ans paie ${h.eur(y1(h, 4))} de taxe régionale, soit ${h.eur2(total(h, 4))} pour la carte grise complète. Une voiture de dix ans ou plus paie moitié prix, tout comme une moto. Les voitures électriques ne bénéficient d’aucune réduction sur l’île : elles paient le même tarif qu’un modèle essence ou diesel.`;
    },
    faqs: (h) => {
      const [avant, apres] = corse(h).tarifs;
      const fin = veille(apres.from!);
      return [
        { q: 'Combien coûtait la carte grise en Corse avant la hausse de 2026 ?', a: `Jusqu’au ${h.date(fin)}, le tarif était de ${h.eur2(avant.cv)} par cheval. Une voiture de 6 CV de moins de dix ans payait alors ${h.eur(y1(h, 6, false, fin))} de taxe régionale, contre ${h.eur(y1(h, 6))} aujourd’hui. Le simulateur de l’État indique ce passage au ${h.date(apres.from!)} ; la date à laquelle l’ancien tarif avait pris effet n’a pas été vérifiée à la source.` },
        { q: 'Une voiture électrique est-elle exonérée de carte grise en Corse ?', a: `Non. La loi permet à chaque région de réduire de moitié ou de supprimer sa taxe pour les voitures électriques et à hydrogène, mais la Corse n’applique aucune réduction. Une électrique de 5 CV de moins de dix ans paie ${h.eur(y1(h, 5))} de taxe régionale, la même somme qu’une thermique de même puissance. Elle reste en revanche exonérée des deux malus à l’achat neuf.` },
        { q: 'J’achète une voiture sur le continent et j’habite en Corse : quel tarif ?', a: `Le tarif corse, à ${h.eur2(apres.cv)} par cheval. La taxe régionale suit l’adresse du nouveau titulaire, pas celle du vendeur ni le lieu de la transaction. Acheter à Marseille ou à Nice ne fait donc pas payer le tarif de Provence-Alpes-Côte d’Azur. Le certificat est demandé en ligne sur le site de l’ANTS, sans passer par une préfecture.` },
        { q: 'La Corse peut-elle encore augmenter le prix du cheval fiscal ?', a: `Oui, la loi plafonne le tarif à ${h.eur2(h.P.regional.plafond_cv)} par cheval, ce qui laisse une marge de ${h.eur(h.P.regional.plafond_cv - apres.cv)}. Aucune délibération pour 2027 n’a été repérée au moment du relevé. Une nouvelle valeur s’applique en général le premier jour du deuxième mois après que le vote est devenu exécutoire, ce qui laisse quelques semaines pour anticiper un achat.` },
      ];
    },
    body: (h) => {
      const c = corse(h);
      const [avant, apres] = c.tarifs;
      const rg = rang(h);
      const fin = veille(apres.from!);
      const top = hausses2026(h);
      const cvs = [3, 4, 6, 9];
      const rows = cvs.map((cv) => [`${cv} CV`, h.eur(y1(h, cv, false, fin)), h.eur(y1(h, cv)), h.eur2(y1(h, cv, true)), h.eur2(total(h, cv))]);
      return `
<h2>Ce que dit le rapport à l’Assemblée de Corse</h2>
<p>La valeur de 2026 provient d’un ${h.src('delib_corse', 'rapport soumis à l’Assemblée de Corse')} qui rappelle le tarif de ${h.eur2(avant.cv)} pratiqué en 2025 et propose ${h.eur2(apres.cv)} pour 2026. Le simulateur de l’État applique ce montant depuis le ${h.date(apres.from!)}, date vérifiée. Le rapport porte sur la proposition ; le relevé du ${h.src('prixcv', 'simulateur officiel du prix du cheval')} confirme qu’elle est en vigueur. La date exacte à laquelle le tarif précédent avait commencé à s’appliquer n’a pas été contrôlée, et les valeurs plus anciennes ne sont pas reprises ici faute de vérification.</p>

<h2>Une hausse qui se voit sur chaque titre</h2>
<p>Le tableau compare une même voiture avant et après le changement, pour un changement de titulaire. La dernière colonne donne le prix total du certificat au ${h.date(releve(h))} : la taxe régionale, plus ${h.eur2(h.P.national.taxe_fixe)} de taxe fixe et ${h.eur2(h.P.national.redevance)} pour l’envoi du titre.</p>
${h.table(['Puissance', `Taxe régionale jusqu’au ${h.date(fin)}`, 'Taxe régionale en 2026', '2026, 10 ans ou plus', 'Titre complet 2026'], rows, 'Corse, voiture essence ou diesel d’occasion.', ['l', 'r', 'r', 'r', 'r'])}
<p>Parmi les collectivités qui ont modifié leur tarif en 2026, l’écart corse de ${h.eur(top[0].delta)} par cheval arrive en tête, devant ${top[1].r.nom.fr} (${h.eur(top[1].delta)}). La plus petite hausse de l’année est de ${h.eur(top[top.length - 1].delta)} par cheval. La majoration des transports franciliens, qui relève d’un autre mécanisme, n’entre pas dans cette comparaison.</p>

<h2>La place de l’île dans le classement</h2>
<p>Malgré cette hausse, la Corse reste au ${h.num(rg.pos)}e rang sur ${h.num(rg.n)}, à égalité avec ${rg.memes.map(avecArticle).join(', ')}. ${h.num(rg.sous)} territoires font payer moins, et ${h.num(rg.pos - 1)} davantage, dont la région voisine de ${h.a('region-provence-alpes-cote-dazur', 'Provence-Alpes-Côte d’Azur')}, déjà au plafond. Pour un Corse, l’écart avec le continent ne joue qu’en cas de déménagement, car c’est l’adresse du domicile qui fixe le tarif.</p>

<h2>Situations fréquentes sur l’île</h2>
<ul>
<li>Voiture achetée sur le continent puis embarquée sur le ferry : tarif corse, et ${h.num(h.P.national.delai_titulaire_mois)} mois pour faire la carte grise à compter de la vente, quel que soit le temps de traversée.</li>
<li>Véhicule ancien : la moitié du tarif dès dix ans après la première immatriculation, case B du titre.</li>
<li>Scooter ou moto : demi-tarif quel que soit l’âge, et rien pour un cyclomoteur, comme le prévoit le ${h.src('cibs', 'code des impositions sur les biens et services')}.</li>
<li>Voiture électrique : plein tarif, sans réduction régionale.</li>
</ul>
<p>Le détail des autres lignes du titre se trouve sur la ${h.src('f19211', 'fiche officielle du coût du certificat')}. Pour une revente entre particuliers, la page ${h.a('occasion-titulaire', 'changement de titulaire')} reprend les étapes.</p>
`;
    },
  },
  en: {
    slug: 'region/corse',
    nav: 'Corsica',
    card: 'The steepest fiscal horsepower rise of 2026: what a registration certificate now costs in Ajaccio or Bastia.',
    title: 'Corsica car registration 2026: €53 per fiscal horsepower',
    description: 'Corsica car registration in 2026: €53 per fiscal horsepower since 1 January, up from €43 in 2025. Examples by CV, the ten-year rule and electric car treatment.',
    h1: 'Registering a car in Corsica in 2026',
    intro: 'The calculator is set to Corsica: enter the fiscal horsepower and the first registration date to see the tax owed to the island’s authority.',
    resume: (h) => {
      const [avant, apres] = corse(h).tarifs;
      const rg = rang(h);
      return `Corsica charges ${h.eur2(apres.cv)} per fiscal horsepower (the “cheval fiscal”, the CV figure in box P.6 of the French registration certificate) since ${h.date(apres.from!)}, up from ${h.eur2(avant.cv)} the year before. The start date is confirmed by the State’s cost simulator, and the amount appears in the report put to the Corsican Assembly, the island’s elected body, which sets the rate as a region would. The rise of ${h.eur(apres.cv - avant.cv)} per CV is the largest of any 2026 change. Corsica now ranks ${ordEn(rg.pos)} of ${h.num(rg.n)} from the most expensive, level with ${rg.memes.map((r) => r.nom.en).join(', ')}, and ${h.eur(h.P.regional.plafond_cv - apres.cv)} below the legal cap. A small 4 CV car under ten years old pays ${h.eur(y1(h, 4))} in regional tax, or ${h.eur2(total(h, 4))} for the whole certificate. Cars aged ten or more pay half, as do motorbikes. Electric cars get no discount on the island and pay the same rate as petrol or diesel models.`;
    },
    faqs: (h) => {
      const [avant, apres] = corse(h).tarifs;
      const fin = veille(apres.from!);
      return [
        { q: 'How much more does registration cost in Corsica since the 2026 increase?', a: `For a 6 CV car under ten years old, the regional tax went from ${h.eur(y1(h, 6, false, fin))} to ${h.eur(y1(h, 6))} on ${h.date(apres.from!)}, as the rate rose from ${h.eur2(avant.cv)} to ${h.eur2(apres.cv)} per CV. For a 9 CV car the gap is wider still. The date when the previous rate first applied has not been checked at source.` },
        { q: 'Do electric cars pay the regional tax in Corsica?', a: `Yes, in full. French law allows each region to halve or remove the tax for electric and hydrogen vehicles, but Corsica has not done so. A 5 CV electric car under ten years old pays ${h.eur(y1(h, 5))}, exactly what a petrol car of the same rating pays. New electric cars still escape the CO₂ and weight malus, which are national.` },
        { q: 'I bought a car in mainland France and live in Corsica: which rate applies?', a: `The Corsican rate of ${h.eur2(apres.cv)} per CV. The regional tax follows the new keeper’s home address, so buying in Marseille or Nice does not mean paying the Provence rate. You apply online through ANTS, the national registration agency, within ${h.num(h.P.national.delai_titulaire_mois)} month of the sale, however long the ferry crossing and delivery take.` },
        { q: 'Is a further rise expected in Corsica for 2027?', a: `None had been found when the rates were surveyed. The legal cap of ${h.eur2(h.P.regional.plafond_cv)} per CV leaves room for ${h.eur(h.P.regional.plafond_cv - apres.cv)} more. When a new rate is voted, it usually applies from the first day of the second month after the decision becomes enforceable, so buyers normally get a few weeks’ notice before it bites.` },
      ];
    },
    body: (h) => {
      const [avant, apres] = corse(h).tarifs;
      const rg = rang(h);
      const fin = veille(apres.from!);
      const top = hausses2026(h);
      const cvs = [3, 4, 6, 9];
      const rows = cvs.map((cv) => [`${cv} CV`, h.eur(y1(h, cv, false, fin)), h.eur(y1(h, cv)), h.eur2(y1(h, cv, true)), h.eur2(total(h, cv))]);
      return `
<h2>The source of the 2026 rate</h2>
<p>The figure comes from a ${h.src('delib_corse', 'report to the Corsican Assembly')} that recalls the ${h.eur2(avant.cv)} rate of 2025 and proposes ${h.eur2(apres.cv)} for 2026. The State’s simulator has applied that amount since ${h.date(apres.from!)}, a verified date, and the ${h.src('prixcv', 'official fiscal horsepower price simulator')} still shows it. The report is a proposal; the State’s figures confirm it was adopted. Older Corsican rates are not listed here because they have not been checked against a primary source.</p>

<h2>Before and after, car by car</h2>
<p>Regional tax for the same used petrol or diesel car changing hands before and after the rise, then the full certificate cost on ${h.date(releve(h))}: regional tax plus ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} of national charges.</p>
${h.table(['Power', `Until ${h.date(fin)}`, '2026 rate', '2026, 10 years or more', 'Full certificate 2026'], rows, 'Corsica, used petrol or diesel car.', ['l', 'r', 'r', 'r', 'r'])}
<p>Among the authorities that changed their rate in 2026, Corsica’s ${h.eur(top[0].delta)} rise per CV is the largest, ahead of ${top[1].r.nom.en} at ${h.eur(top[1].delta)}. The Paris-region transport surcharge is a separate mechanism and is left out of this comparison.</p>

<h2>Where Corsica sits nationally</h2>
<p>Even after the increase, the island is ${ordEn(rg.pos)} of ${h.num(rg.n)}: ${h.num(rg.pos - 1)} regions charge more, including neighbouring ${h.a('region-provence-alpes-cote-dazur', 'Provence-Alpes-Côte d’Azur')} at the cap, and ${h.num(rg.sous)} charge less. The comparison only matters if you move house, since your address decides the rate.</p>

<h2>Practical cases for island residents</h2>
<ul>
<li>Car shipped from the mainland: Corsican rate, and the ${h.num(h.P.national.delai_titulaire_mois)}-month deadline runs from the date of sale.</li>
<li>Older car: half rate once the first registration, shown in box B, is ten years old.</li>
<li>Scooter or motorbike: half rate at any age; mopeds pay no regional tax, under the ${h.src('cibs', 'French tax code')}.</li>
<li>Electric car: full rate, no regional discount.</li>
</ul>
<p>The other lines of the certificate are explained on the ${h.src('f19211', 'official cost page')}. For a private sale, the ${h.a('occasion-titulaire', 'used car transfer')} page walks through each step.</p>
`;
    },
  },
});
