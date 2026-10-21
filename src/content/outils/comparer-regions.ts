import { defineGuide, type Helpers } from '../../lib/guide-types';

type En = 'essence' | 'electrique';
const d0 = (h: Helpers) => h.P.regional.date_releve;
const VIEUX = '2012-05-01';
const base = (h: Helpers, cv: number, energie: En, vieux: boolean, dateOp = d0(h)) => ({
  demarche: 'titulaire' as const, region: 'ile-de-france', origine: 'france_occasion' as const, energie, genre: 'vp' as const,
  cv, date1re: vieux ? VIEUX : dateOp, dateOp, gkm: 0, masseKg: 0, ptacKg: 0,
});
const liste = (h: Helpers, cv: number, energie: En, vieux: boolean) => h.M.comparerRegions(base(h, cv, energie, vieux));
const metro = (h: Helpers, l: ReturnType<typeof liste>) => l.filter((x) => !h.M.regionById(x.region).om);
const nom = (h: Helpers, id: string) => h.M.regionById(id).nom[h.lang];
const total = (h: Helpers, region: string, cv: number, energie: En, vieux: boolean, dateOp = d0(h)) =>
  h.M.coutCarteGrise({ ...base(h, cv, energie, vieux, dateOp), region }).total;

const PROFILS: Array<{ cv: number; e: En; v: boolean; fr: string; en: string }> = [
  { cv: 4, e: 'essence', v: true, fr: 'Citadine de 4 CV, plus de 10 ans', en: '4 CV city car, over 10 years' },
  { cv: 5, e: 'essence', v: false, fr: 'Compacte de 5 CV, moins de 10 ans', en: '5 CV hatchback, under 10 years' },
  { cv: 7, e: 'electrique', v: false, fr: 'Électrique de 7 CV, récente', en: '7 CV electric car, recent' },
  { cv: 9, e: 'essence', v: false, fr: 'Familiale de 9 CV, moins de 10 ans', en: '9 CV family car, under 10 years' },
  { cv: 12, e: 'essence', v: false, fr: 'SUV de 12 CV, moins de 10 ans', en: '12 CV SUV, under 10 years' },
];

const tableau = (h: Helpers, fr: boolean) => PROFILS.map((p) => {
  const m = metro(h, liste(h, p.cv, p.e, p.v));
  const lo = m[0], hi = m[m.length - 1];
  return [fr ? p.fr : p.en, `${nom(h, lo.region)}, ${h.eur(lo.total, 2)}`, `${nom(h, hi.region)}, ${h.eur(hi.total, 2)}`, h.eur(hi.total - lo.total)];
});

export default defineGuide({
  id: 'comparer-regions',
  group: 'outils',
  order: 50,
  tool: 'comparer',
  related: ['tarif-cheval-fiscal', 'region-hauts-de-france', 'region-ile-de-france', 'electrique-hybride', 'calcul-chevaux-fiscaux'],
  sources: ['prixcv', 'cibs', 'idfm', 'a18021', 'delib_hdf'],
  fr: {
    slug: 'comparer-les-regions',
    nav: 'Comparer les régions',
    card: 'Le même véhicule dans les 18 régions, classé du moins cher au plus cher, avec l’écart en euros.',
    title: 'Comparer les régions : coût de la carte grise dans les 18',
    description: 'Comparer le coût de la carte grise dans les 18 régions pour le même véhicule : écarts selon puissance et âge, voiture électrique, Île-de-France et domicile.',
    h1: 'Comparer le coût de la carte grise d’une région à l’autre',
    intro: 'Réglez la puissance, l’énergie et l’âge du véhicule : les 18 régions se classent aussitôt, avec la différence entre le tarif le plus bas et le plus haut.',
    resume: (h) => {
      const l = liste(h, 5, 'essence', false);
      const m = metro(h, l);
      const e = liste(h, 7, 'electrique', false);
      return `Le prix d’une carte grise varie d’une région à l’autre parce que chaque conseil régional vote son tarif du cheval fiscal, et que l’Île-de-France y ajoute une majoration pour les transports. Pour une voiture d’occasion de 5 CV de moins de dix ans, le titre coûte ${h.eur(m[0].total, 2)} en ${nom(h, m[0].region)} et ${h.eur(m[m.length - 1].total, 2)} en ${nom(h, m[m.length - 1].region)} au ${h.date(d0(h))}, soit ${h.eur(m[m.length - 1].total - m[0].total)} d’écart en métropole ; outre-mer, ${nom(h, l[0].region)} descend à ${h.eur(l[0].total, 2)}. L’écart grandit avec la puissance et se réduit de moitié après dix ans, car la taxe régionale suit les deux. Pour une voiture électrique de 7 CV, le classement place en tête ${nom(h, e[0].region)}, seule région à réduire de moitié la taxe de ces véhicules. La région qui compte n’est pas celle où l’on achète, mais celle du domicile du titulaire, et une adresse de complaisance est une fausse déclaration.`;
    },
    faqs: (h) => {
      const idf26 = total(h, 'ile-de-france', 5, 'essence', false);
      const idf27 = total(h, 'ile-de-france', 5, 'essence', false, '2027-01-15');
      const plaf = h.P.regions.filter((r) => h.M.tarifRegion(r.id, d0(h)).cv === h.P.regional.plafond_cv).length;
      return [
        { q: 'Puis-je immatriculer ma voiture chez un parent qui habite une région moins chère ?', a: 'Non, sauf si vous y vivez vraiment. La loi retient le domicile habituel du titulaire, et pour une société l’établissement auquel la voiture est affectée. Déclarer l’adresse d’un proche pour profiter d’un tarif plus bas est une fausse déclaration : l’adresse figure sur le titre, sert aux avis de contravention et peut être contrôlée.' },
        { q: 'Le classement des régions change-t-il en 2027 pour l’Île-de-France ?', a: `La majoration francilienne baisse au 1er janvier 2027, de ${h.eur2(h.P.idfm.periodes[0].cv)} à ${h.eur2(h.P.idfm.periodes[1].cv)} par cheval, sauf délibération contraire d’Île-de-France Mobilités. Pour une 5 CV de moins de dix ans, le titre passerait de ${h.eur(idf26, 2)} à ${h.eur(idf27, 2)}, ce qui laisse l’Île-de-France en tête du classement. Aucune hausse régionale n’est connue pour 2027 au ${h.date(d0(h))}.` },
        { q: 'Pourquoi tant de régions affichent-elles le même prix de carte grise ?', a: `Parce que ${h.num(plaf)} régions sont au plafond légal de ${h.eur2(h.P.regional.plafond_cv)} par cheval fiscal et ne peuvent pas aller plus haut. Pour une même voiture, elles donnent exactement le même total, et seules les régions restées sous le plafond créent des écarts. Le classement de l’outil les départage par ordre alphabétique.` },
        { q: 'Comparer les régions a-t-il un sens pour une voiture neuve ?', a: 'Oui pour la taxe régionale, qui suit le même tarif que pour une occasion. En revanche, le malus CO₂ et le malus au poids sont identiques partout en France : ils ne dépendent pas de la région. Le comparateur les laisse de côté, et c’est souvent eux qui pèsent le plus sur le prix d’une voiture neuve thermique.' },
      ];
    },
    body: (h) => {
      const hdf = h.P.regions.find((r) => r.id === 'hauts-de-france')!;
      const eHdf = total(h, 'hauts-de-france', 7, 'electrique', false);
      const eAra = total(h, 'auvergne-rhone-alpes', 7, 'electrique', false);
      const tIdf = h.M.tarifRegion('ile-de-france', d0(h)).cv;
      const maj = h.M.majorationIdfm(d0(h));
      const old = metro(h, liste(h, 4, 'essence', true));
      return `
<h2>Écarts pour cinq profils de voiture</h2>
<p>Le tableau compare le coût d’un changement de titulaire en métropole au ${h.date(d0(h))}, sans malus, pour des voitures courantes. Chaque ligne indique le tarif le plus bas, le plus haut et ce qui les sépare. Les départements d’outre-mer sont à part, car leurs tarifs, souvent plus bas, ne concernent que leurs habitants.</p>
${h.table(['Profil', 'Moins chère', 'Plus chère', 'Écart'], tableau(h, true), 'Coût total du titre, majoration francilienne comprise.', ['l', 'l', 'l', 'r'])}
<p>Deux mécanismes expliquent ces chiffres. La taxe régionale est proportionnelle aux chevaux : une 12 CV creuse un écart bien plus grand qu’une 5 CV. Et la moitié du tarif s’applique quand la première immatriculation remonte à dix ans ou plus, ce qui réduit l’écart de moitié : pour la citadine ancienne, il ne reste que ${h.eur(old[old.length - 1].total - old[0].total)} entre les deux extrêmes.</p>

<h2>Pourquoi l’Île-de-France arrive en tête</h2>
<p>La région vote ${h.eur2(tIdf)} par cheval, sous le plafond, mais une ${h.src('idfm', 'majoration au profit d’Île-de-France Mobilités')} de ${h.eur2(maj)} s’y ajoute depuis le ${h.date(h.P.idfm.periodes[0].from)}. Cette majoration échappe au plafond de ${h.eur2(h.P.regional.plafond_cv)}, ce qui porte le total à ${h.eur2(tIdf + maj)}. Elle suit les mêmes réductions que la taxe régionale, dont la moitié à dix ans. En 2027, elle redescend à ${h.eur2(h.P.idfm.periodes[1].cv)} sauf décision d’Île-de-France Mobilités, dans la limite de ${h.eur2(h.P.idfm.plafond_legal)}.</p>

<h2>Voitures électriques : une seule région fait exception</h2>
<p>Depuis 2025, les régions peuvent réduire ou supprimer la taxe des véhicules électriques et à hydrogène. Au ${h.date(d0(h))}, seule la région ${hdf.nom.fr} le fait, avec une ${h.src('delib_hdf', 'réduction de moitié')} depuis le ${h.date(hdf.propres[1].from)}. Partout ailleurs, l’électrique paie comme une thermique. Les Hauts-de-France et la région Auvergne-Rhône-Alpes ont pourtant le même tarif : pour une électrique de 7 CV, le titre coûte ${h.eur(eHdf, 2)} dans la première et ${h.eur(eAra, 2)} dans la seconde.</p>

<h2>La seule région qui compte : celle du domicile</h2>
<p>Le ${h.src('cibs', 'code des impositions')} rattache la taxe à la région du domicile habituel du titulaire. Pour une entreprise, c’est la région de l’établissement auquel le véhicule est affecté. Le lieu d’achat, l’adresse du vendeur ou celle du garage n’ont aucun effet. Si vous déménagez avant de faire la demande, la nouvelle adresse fixe le tarif. Utiliser une domiciliation fictive pour payer moins revient à faire une fausse déclaration à l’administration.</p>

<h2>Utiliser le comparateur</h2>
<p>Indiquez la puissance fiscale de la case P.6, l’énergie, l’âge et la démarche : changement de titulaire ou immatriculation d’une voiture neuve. Les 18 régions se classent avec le total et l’écart avec la moins chère. Les montants réunissent la taxe régionale et les frais fixes du titre, sans malus. Pour le tarif seul par cheval, voyez le ${h.a('tarif-cheval-fiscal', 'prix du cheval fiscal')} ; pour votre propre calcul complet, le ${h.a('home', 'simulateur principal')}.</p>
`;
    },
  },
  en: {
    slug: 'compare-regions',
    nav: 'Compare regions',
    card: 'The same vehicle in all 18 regions, ranked from cheapest to dearest, with the gap in euros.',
    title: 'Compare regions: French car registration cost in all 18',
    description: 'Compare French car registration costs across all 18 regions for one vehicle: gaps by power and age, electric cars, the Paris-region surcharge and residency.',
    h1: 'Compare the cost of a French registration region by region',
    intro: 'Set the power, fuel and age of the vehicle: the 18 regions rank instantly, with the gap between the cheapest and the dearest.',
    resume: (h) => {
      const l = liste(h, 5, 'essence', false);
      const m = metro(h, l);
      const e = liste(h, 7, 'electrique', false);
      return `What a French registration certificate, the carte grise, costs depends on the region because each regional council sets its own rate per fiscal horsepower (CV), and the Paris region adds a transport surcharge on top. For a used 5 CV car under ten years old, the certificate costs ${h.eur(m[0].total, 2)} in ${nom(h, m[0].region)} and ${h.eur(m[m.length - 1].total, 2)} in ${nom(h, m[m.length - 1].region)} on ${h.date(d0(h))}, a gap of ${h.eur(m[m.length - 1].total - m[0].total)} in mainland France; overseas, ${nom(h, l[0].region)} goes down to ${h.eur(l[0].total, 2)}. The gap grows with horsepower and halves once the car is ten years old, because the regional tax follows both. For a 7 CV electric car the cheapest region is ${nom(h, e[0].region)}, the only one that halves the tax on such vehicles. The region that matters is where the new keeper lives, not where the car is bought, and using an address where you do not live is a false declaration.`;
    },
    faqs: (h) => {
      const idf26 = total(h, 'ile-de-france', 5, 'essence', false);
      const idf27 = total(h, 'ile-de-france', 5, 'essence', false, '2027-01-15');
      const plaf = h.P.regions.filter((r) => h.M.tarifRegion(r.id, d0(h)).cv === h.P.regional.plafond_cv).length;
      return [
        { q: 'I live in Paris: can I register my car at a relative’s address in a cheaper region?', a: 'Not unless you actually live there. French law uses the keeper’s usual home, or for a company the site the car is assigned to. Giving a relative’s address to get a lower rate is a false declaration: the address is printed on the certificate, receives speeding and parking notices, and can be checked.' },
        { q: 'Will the Paris-region surcharge on a registration be lower in 2027?', a: `It is set to fall on 1 January 2027, from ${h.eur2(h.P.idfm.periodes[0].cv)} to ${h.eur2(h.P.idfm.periodes[1].cv)} per CV, unless Île-de-France Mobilités, the regional transport authority, decides otherwise. For a 5 CV car under ten years old, the certificate would go from ${h.eur(idf26, 2)} to ${h.eur(idf27, 2)}, still the dearest in France. No regional increase for 2027 is known on ${h.date(d0(h))}.` },
        { q: 'Why do so many French regions charge exactly the same?', a: `Because ${h.num(plaf)} regions sit at the legal maximum of ${h.eur2(h.P.regional.plafond_cv)} per CV and cannot go higher. For the same car they produce identical totals, and only the regions below the cap create differences. The comparison tool lists tied regions in alphabetical order, so their rank says nothing about price.` },
        { q: 'Is it worth comparing regions for a brand-new car?', a: 'For the regional tax, yes, since a new car pays the same rate per CV as a used one. The CO₂ malus and the weight malus, however, are the same everywhere in France and do not depend on the region. The comparison leaves them out; for a new petrol or diesel car they are often the largest part of the bill.' },
      ];
    },
    body: (h) => {
      const hdf = h.P.regions.find((r) => r.id === 'hauts-de-france')!;
      const eHdf = total(h, 'hauts-de-france', 7, 'electrique', false);
      const eAra = total(h, 'auvergne-rhone-alpes', 7, 'electrique', false);
      const tIdf = h.M.tarifRegion('ile-de-france', d0(h)).cv;
      const maj = h.M.majorationIdfm(d0(h));
      const old = metro(h, liste(h, 4, 'essence', true));
      return `
<h2>Gaps for five typical cars</h2>
<p>The table compares the cost of a change of keeper in mainland France on ${h.date(d0(h))}, without any malus, for everyday cars. Each row gives the cheapest region, the dearest and the difference. The overseas departments are left out of the ranking, since their rates, often lower, only apply to people who live there.</p>
${h.table(['Profile', 'Cheapest', 'Dearest', 'Gap'], tableau(h, false), 'Total cost of the certificate, Paris-region surcharge included.', ['l', 'l', 'l', 'r'])}
<p>Two rules drive these figures. The regional tax is proportional to the CV rating, so a 12 CV car opens a much wider gap than a 5 CV one. And the rate is halved once the first registration is ten or more years old, which halves the gap too: for the older city car, only ${h.eur(old[old.length - 1].total - old[0].total)} separates the two extremes.</p>

<h2>Why Île-de-France tops the list</h2>
<p>The region itself charges ${h.eur2(tIdf)} per CV, below the cap, but a ${h.src('idfm', 'surcharge for Île-de-France Mobilités')} of ${h.eur2(maj)} has been added since ${h.date(h.P.idfm.periodes[0].from)}. The surcharge sits outside the ${h.eur2(h.P.regional.plafond_cv)} cap, which brings the total to ${h.eur2(tIdf + maj)}. It follows the same reductions as the regional tax, including the half rate at ten years. In 2027 it drops back to ${h.eur2(h.P.idfm.periodes[1].cv)} unless the transport authority decides otherwise, within a ceiling of ${h.eur2(h.P.idfm.plafond_legal)}.</p>

<h2>Electric cars: one region stands apart</h2>
<p>Since 2025 French regions may cut or remove the tax on electric and hydrogen vehicles. On ${h.date(d0(h))} only ${hdf.nom.en} does so, with a ${h.src('delib_hdf', 'half-rate reduction')} since ${h.date(hdf.propres[1].from)}. Everywhere else an electric car pays like a petrol one. Hauts-de-France and Auvergne-Rhône-Alpes charge the same rate per CV, yet for a 7 CV electric car the certificate costs ${h.eur(eHdf, 2)} in the first and ${h.eur(eAra, 2)} in the second.</p>

<h2>The only region that counts: where you live</h2>
<p>The ${h.src('cibs', 'French tax code')} ties the tax to the region of the keeper’s usual home. For a business it is the region of the site the vehicle is assigned to. Where you buy the car, where the seller lives or where the dealer is has no effect. If you move before applying, your new address sets the rate. Registering at an address of convenience to pay less is a false declaration to the administration, which matters for newcomers who might be tempted to use a friend’s address while house-hunting.</p>

<h2>Using the comparison</h2>
<p>Enter the fiscal horsepower from box P.6, the fuel, the age and the procedure: change of keeper or registration of a new car. The 18 regions rank with their total and the gap to the cheapest. The amounts combine the regional tax and the fixed charges for the certificate, without malus. For the rate per CV alone, see the ${h.a('tarif-cheval-fiscal', 'fiscal horsepower rate')}; for your own full calculation, use the ${h.a('home', 'main calculator')}.</p>
`;
    },
  },
});
