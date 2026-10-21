import { defineGuide, type Helpers } from '../../lib/guide-types';

const ID = 'nouvelle-aquitaine';
const na = (h: Helpers) => h.P.regions.find((r) => r.id === ID)!;
const quand = (h: Helpers) => h.P.regional.date_releve;
const ancien = (h: Helpers) => na(h).tarifs[0];
const nouveau = (h: Helpers) => na(h).tarifs[na(h).tarifs.length - 1];
const avantHausse = (h: Helpers) => {
  const d = new Date(`${nouveau(h).from}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};
const tauxCv = (h: Helpers, id: string) => {
  const d = quand(h);
  return h.M.tarifRegion(id, d).cv + (h.P.regions.find((r) => r.id === id)!.idfm ? h.M.majorationIdfm(d) : 0);
};
const rangNa = (h: Helpers) => {
  const v = tauxCv(h, ID);
  const t = h.P.regions.map((r) => tauxCv(h, r.id));
  return { r: 1 + t.filter((x) => x > v).length, n: t.length, moins: t.filter((x) => x < v).length };
};
const prix = (h: Helpers, cv: number, date1re: string, dateOp = quand(h), energie: 'essence' | 'electrique' = 'essence') =>
  h.M.coutCarteGrise({ cv, region: ID, date1re, dateOp, energie, demarche: 'titulaire', genre: 'vp', origine: 'france_occasion', gkm: 0, masseKg: 0, ptacKg: 0 });
const R1 = '2022-01-14';
const R2 = '2014-06-05';

export default defineGuide({
  id: 'region-nouvelle-aquitaine',
  group: 'regions',
  order: 100,
  tool: 'cout',
  region: ID,
  related: ['electrique-hybride', 'tarif-cheval-fiscal', 'comparer-regions', 'region-occitanie', 'region-pays-de-la-loire'],
  sources: ['delib_na', 'prixcv', 'a18021', 'a18244', 'cibs'],
  fr: {
    slug: 'region/nouvelle-aquitaine',
    nav: 'Nouvelle-Aquitaine',
    card: 'La hausse à 58 € du 1er mars 2026 et la fin de l’exonération des voitures électriques.',
    title: 'Carte grise Nouvelle-Aquitaine 2026 : 58 € dès le 1er mars',
    description: 'Carte grise en Nouvelle-Aquitaine en 2026 : 58 € par cheval depuis le 1er mars, contre 53 € avant, et fin de l’exonération des électriques. Exemples chiffrés.',
    h1: '58 € le cheval depuis mars 2026 : la carte grise néo-aquitaine',
    intro: 'Le simulateur applique le tarif néo-aquitain en vigueur à la date choisie, pour une voiture thermique comme pour une électrique.',
    resume: (h) => {
      const d = quand(h);
      const a = ancien(h), n = nouveau(h);
      const rg = rangNa(h);
      const e = prix(h, 6, R1, d, 'electrique');
      return `En Nouvelle-Aquitaine, le cheval fiscal coûte ${h.eur2(n.cv)} depuis le ${h.date(n.from!)}, contre ${h.eur2(a.cv)} auparavant, soit ${h.eur2(n.cv - a.cv)} de plus par cheval. Cette date d’effet est vérifiée : le simulateur de l’État l’applique, et le procès-verbal de la séance plénière du conseil régional, que nous avons lu, annonce le passage au nouveau tarif à compter du premier mars. Le même texte met fin à l’exonération dont bénéficiaient les voitures électriques : depuis la hausse, elles paient le tarif plein, comme les thermiques. Pour une voiture d’occasion de 6 CV de moins de dix ans, la taxe régionale est passée de ${h.eur2(prix(h, 6, R1, avantHausse(h)).y1.y1)} à ${h.eur2(prix(h, 6, R1).y1.y1)}, et une électrique de même puissance acquitte désormais ${h.eur2(e.y1.y1)}. Le tarif reste réduit de moitié quand la première immatriculation date de dix ans ou plus. Au ${h.date(d)}, la région se classe ${h.num(rg.r)}e sur ${h.num(rg.n)}, et aucune nouvelle hausse n’est connue pour 2027.`;
    },
    faqs: (h) => {
      const a = ancien(h), n = nouveau(h);
      return [
        { q: 'J’ai acheté ma voiture en février 2026 : quel tarif de Nouvelle-Aquitaine s’applique ?', a: `Celui en vigueur le jour où la demande de certificat est faite, pas le jour de l’achat. Une demande déposée avant le ${h.date(n.from!)} a été taxée à ${h.eur2(a.cv)} par cheval ; une demande faite à partir de cette date l’est à ${h.eur2(n.cv)}. Le délai d’un mois pour faire la carte grise après l’achat reste obligatoire, quel que soit le tarif.` },
        { q: 'Combien paie aujourd’hui une voiture électrique en Nouvelle-Aquitaine ?', a: `Le même montant qu’une voiture essence : ${h.eur2(n.cv)} par cheval, divisé par deux après dix ans. Une électrique d’occasion de 4 CV récente revient à ${h.eur2(prix(h, 4, R1, quand(h), 'electrique').total)} de carte grise. Une électrique neuve reste en revanche exonérée du malus CO₂ et du malus au poids, qui sont des taxes nationales.` },
        { q: 'Où lire la décision de la Nouvelle-Aquitaine sur le tarif du cheval fiscal ?', a: `Dans le document intitulé « ${h.P.sources.delib_na.label.fr} », publié sur le site de la région. Ce procès-verbal adopté mentionne le passage au nouveau tarif au premier mars et la fin de l’exonération des électriques. Nous n’avons pas trouvé la délibération elle-même sous forme d’acte séparé, mais le simulateur de l’État confirme le montant et la date.` },
      ];
    },
    body: (h) => {
      const d = quand(h);
      const a = ancien(h), n = nouveau(h);
      const rg = rangNa(h);
      const veille = avantHausse(h);
      const rows = [4, 6, 8, 10].map((cv) => [
        `${cv} CV`,
        h.eur2(prix(h, cv, R1, veille).total),
        h.eur2(prix(h, cv, R1).total),
        `+${h.eur2(prix(h, cv, R1).total - prix(h, cv, R1, veille).total)}`,
        h.eur2(prix(h, cv, R2).total),
      ]);
      const oc = tauxCv(h, 'occitanie'), pdl = tauxCv(h, 'pays-de-la-loire');
      return `
<h2>Deux décisions prises en même temps</h2>
<p>Le ${h.src('delib_na', 'procès-verbal de la séance plénière du conseil régional')} rapporte l’adoption de deux mesures. La première porte le tarif à ${h.eur2(n.cv)} par cheval fiscal à compter du premier mars suivant. La seconde supprime l’exonération des véhicules électriques. Le ${h.src('prixcv', 'simulateur officiel de l’État')} applique bien ce tarif depuis le ${h.date(n.from!)}, et l’${h.src('a18021', 'actualité de service-public.gouv.fr sur les tarifs 2026')} relève la même hausse.</p>
<p>Le tarif précédent de ${h.eur2(a.cv)} est confirmé, mais sa date d’entrée en vigueur ne l’est pas : nous ne l’avons trouvée dans aucun acte régional. Les montants plus anciens circulent seulement sur des sites tiers et ne sont pas repris ici.</p>

<h2>Avant et après le 1er mars</h2>
<p>Le tableau compare le prix du titre d’une même voiture d’occasion de moins de dix ans la veille de la hausse et au ${h.date(d)}. La dernière colonne montre le tarif actuel pour une voiture de dix ans ou plus.</p>
${h.table(['Puissance', `Le ${h.date(veille)}`, `Le ${h.date(d)}`, 'Hausse', '10 ans ou plus, aujourd’hui'], rows, 'Nouvelle-Aquitaine, voiture essence, changement de titulaire, frais nationaux compris.', ['l', 'r', 'r', 'r', 'r'])}
<p>La hausse vaut ${h.eur2(n.cv - a.cv)} par cheval pour une voiture récente et la moitié pour une voiture ancienne. L’arrondi à l’euro, appliqué par l’État avant d’ajouter la redevance, ne la modifie pas ici puisque les deux tarifs sont ronds.</p>

<h2>La fin d’un avantage pour l’électrique</h2>
<p>Depuis 2025, la loi ne permet plus aux régions d’alléger la taxe que pour l’électrique et l’hydrogène, comme l’expliquait l’${h.src('a18244', 'actualité de service-public.gouv.fr de mai 2025')}. La Nouvelle-Aquitaine avait choisi l’exonération ; elle y a renoncé avec la hausse. Une électrique de 7 CV achetée d’occasion paie donc ${h.eur2(prix(h, 7, R1, d, 'electrique').y1.y1)} de taxe régionale, exactement comme une essence. Pour un acheteur de voiture électrique, le changement pèse plus lourd que la hausse du tarif elle-même. La page ${h.a('electrique-hybride', 'voiture électrique et hybride')} détaille les malus nationaux, dont l’électrique reste exonérée.</p>

<h2>Bordeaux, Limoges, Poitiers : un seul tarif</h2>
<p>Le tarif est le même dans les douze départements de la région, des Pyrénées-Atlantiques à la Creuse. Il dépend du domicile du titulaire au jour de la demande ; pour une société, de l’adresse de l’établissement qui utilise le véhicule. Une voiture achetée à Toulouse par un habitant de Pau suit le tarif néo-aquitain.</p>

<h2>Le rang de la Nouvelle-Aquitaine</h2>
<p>Avec ${h.eur2(n.cv)}, la région est ${h.num(rg.r)}e sur ${h.num(rg.n)} et reste sous le plafond de ${h.eur2(h.P.regional.plafond_cv)}. ${h.a('region-occitanie', 'L’Occitanie')} voisine applique ${h.eur2(oc)}, les ${h.a('region-pays-de-la-loire', 'Pays de la Loire')} ${h.eur2(pdl)}. ${h.num(rg.moins)} régions sont moins chères. Pour une comparaison sur votre propre véhicule, utilisez le ${h.a('comparer-regions', 'comparateur des régions')}.</p>
`;
    },
  },
  en: {
    slug: 'region/nouvelle-aquitaine',
    nav: 'Nouvelle-Aquitaine',
    card: 'The rise to €58 on 1 March 2026 and the end of the electric car exemption.',
    title: 'Nouvelle-Aquitaine car registration 2026: €58 from March',
    description: 'Car registration in Nouvelle-Aquitaine in 2026: €58 per CV since 1 March, up from €53, and electric cars no longer exempt. Examples by horsepower and age.',
    h1: 'Car registration in Nouvelle-Aquitaine: €58 per CV since March 2026',
    intro: 'The calculator applies the Nouvelle-Aquitaine rate in force on the chosen date, for combustion and electric cars alike.',
    resume: (h) => {
      const d = quand(h);
      const a = ancien(h), n = nouveau(h);
      const rg = rangNa(h);
      return `Nouvelle-Aquitaine, the south-western region around Bordeaux, Limoges, Poitiers and the Basque coast, raised its fiscal horsepower rate from ${h.eur2(a.cv)} to ${h.eur2(n.cv)} on ${h.date(n.from!)}. The fiscal horsepower, or cheval fiscal, is the CV figure in box P.6 of the French registration certificate; the regional tax equals that figure times the rate. The start date is verified: the State’s simulator applies it, and the adopted minutes of the regional council’s plenary session, which we read, announce the new rate from the first of March. The same minutes end the exemption electric cars used to enjoy, so they now pay the full rate. A used 6 CV car under ten years old pays ${h.eur2(prix(h, 6, R1).y1.y1)} of regional tax, against ${h.eur2(prix(h, 6, R1, avantHausse(h)).y1.y1)} before the rise, and ${h.eur2(prix(h, 6, R1).total)} for the whole certificate. Cars ten or more years old pay half. On ${h.date(d)} the region ranks ${h.num(rg.r)} of ${h.num(rg.n)}, and no rise is known for 2027.`;
    },
    faqs: (h) => {
      const a = ancien(h), n = nouveau(h);
      return [
        { q: 'I bought a car in Bordeaux just before March 2026 but applied later: which Nouvelle-Aquitaine rate do I pay?', a: `The rate on the date of your application, not of the sale. Applications made from ${h.date(n.from!)} pay ${h.eur2(n.cv)} per CV, earlier ones ${h.eur2(a.cv)}. You must still apply within one month of buying; waiting longer to dodge a rate change exposes you to a fixed fine for late registration.` },
        { q: 'Is my electric car still exempt from the regional tax in Nouvelle-Aquitaine?', a: `No. The regional council ended the exemption at the same session that raised the rate, and the State’s simulator now charges electric cars the full ${h.eur2(n.cv)} per CV. A used 8 CV electric car under ten years old costs ${h.eur2(prix(h, 8, R1, quand(h), 'electrique').total)} to register. New electric cars still avoid the national CO₂ and weight malus.` },
        { q: 'How does Nouvelle-Aquitaine compare with Brittany or Occitanie for registering a car?', a: `It is cheaper than both: Brittany charges ${h.eur2(tauxCv(h, 'bretagne'))} and Occitanie ${h.eur2(tauxCv(h, 'occitanie'))} per CV, against ${h.eur2(n.cv)} here. On a 6 CV car under ten years old the gap with Brittany is ${h.eur2((tauxCv(h, 'bretagne') - n.cv) * 6)}. The rate depends only on where you live when you apply, so this matters only if you are moving.` },
      ];
    },
    body: (h) => {
      const d = quand(h);
      const a = ancien(h), n = nouveau(h);
      const veille = avantHausse(h);
      const rows = [5, 7, 9, 12].map((cv) => [`${cv} CV`, h.eur2(prix(h, cv, R1, veille).y1.y1), h.eur2(prix(h, cv, R1).y1.y1), h.eur2(prix(h, cv, R2).y1.y1), h.eur2(prix(h, cv, R1).total)]);
      return `
<h2>The council’s decision</h2>
<p>We read the ${h.src('delib_na', 'adopted minutes of the regional council session')}, which record two measures: a rate of ${h.eur2(n.cv)} per CV from the following first of March, and the end of the electric vehicle exemption. The ${h.src('prixcv', 'official fiscal horsepower simulator')} has applied the rate since ${h.date(n.from!)}, and the ${h.src('a18021', 'service-public.gouv.fr news item on 2026 rates')} reports the same increase.</p>
<p>The previous rate of ${h.eur2(a.cv)} is confirmed, but not the date it took effect; no regional act we found gives it. Earlier rates appear only on third-party sites and are not repeated here.</p>

<h2>Regional tax before and after the rise</h2>
${h.table(['Horsepower', `Tax on ${h.date(veille)}`, `Tax on ${h.date(d)}`, 'Tax today, 10 years or more', 'Certificate today, under 10 years'], rows, 'Nouvelle-Aquitaine, used petrol car, change of keeper.', ['l', 'r', 'r', 'r', 'r'])}
<p>The certificate total adds ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} of national charges paid in every region. For a new or imported car, the CO₂ and weight malus come on top, and they can easily exceed the regional tax.</p>

<h2>What electric car owners lost</h2>
<p>Since 2025, French law only allows regions to cut the tax for electric and hydrogen vehicles, as the ${h.src('a18244', 'service-public.gouv.fr news item of May 2025')} explained. Nouvelle-Aquitaine had chosen a full exemption and has now dropped it. A 7 CV electric car changing hands pays ${h.eur2(prix(h, 7, R1, d, 'electrique').y1.y1)} of regional tax, like a petrol car. For electric buyers, that change outweighs the rate rise itself. The ${h.a('electrique-hybride', 'electric and hybrid page')} covers the national malus exemptions that remain.</p>

<h2>One rate across twelve départements</h2>
<p>From the Gironde to the Creuse, the rate is the same. It follows the keeper’s home address on the day of the application, or for a company the site the vehicle is assigned to. Someone living in Biarritz who buys a car in Spain pays this rate, after obtaining the tax clearance (quitus fiscal) needed for any EU import.</p>

<h2>Ranking</h2>
<p>At ${h.eur2(n.cv)}, Nouvelle-Aquitaine is ${h.num(rangNa(h).r)} of ${h.num(rangNa(h).n)} and remains below the ${h.eur2(h.P.regional.plafond_cv)} cap. Neighbouring ${h.a('region-pays-de-la-loire', 'Pays de la Loire')} charges ${h.eur2(tauxCv(h, 'pays-de-la-loire'))}. The ${h.a('comparer-regions', 'region comparison')} puts your own car through all regions.</p>
`;
    },
  },
});
