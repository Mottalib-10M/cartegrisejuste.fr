import { defineGuide, type Helpers } from '../../lib/guide-types';
import type { Genre } from '../../lib/engine/carte-grise';

const ID = 'provence-alpes-cote-dazur';
const sud = (h: Helpers) => h.P.regions.find((r) => r.id === ID)!;
const jour = (h: Helpers) => h.P.regional.date_releve;
const cvTotal = (h: Helpers, id: string, d: string) =>
  h.M.tarifRegion(id, d).cv + (h.P.regions.find((r) => r.id === id)!.idfm ? h.M.majorationIdfm(d) : 0);
/** Place de la région (1 = la plus chère) et nombre de régions au même tarif. */
const place = (h: Helpers) => {
  const d = jour(h);
  const v = cvTotal(h, ID, d);
  const all = h.P.regions.map((r) => cvTotal(h, r.id, d));
  return { pos: 1 + all.filter((x) => x > v).length, n: all.length, memes: all.filter((x) => x === v).length };
};
const regionale = (h: Helpers, cv: number, date1re: string, genre: Genre = 'vp', dateOp = jour(h)) =>
  h.M.taxeRegionale({ cv, region: ID, date1re, dateOp, energie: 'essence', demarche: 'titulaire', genre }).y1;
const certificat = (h: Helpers, cv: number, date1re: string, dateOp = jour(h)) =>
  h.M.coutCarteGrise({ cv, region: ID, date1re, dateOp, energie: 'essence', demarche: 'titulaire', genre: 'vp', origine: 'france_occasion', gkm: 0, masseKg: 0, ptacKg: 0 }).total;
const JEUNE = '2021-04-12';
const VIEILLE = '2014-02-20';

export default defineGuide({
  id: 'region-provence-alpes-cote-dazur',
  group: 'regions',
  order: 130,
  tool: 'cout',
  region: ID,
  related: ['tarif-cheval-fiscal', 'moto-scooter', 'comparer-regions', 'electrique-hybride', 'region-occitanie'],
  sources: ['delib_paca', 'prixcv', 'a18021', 'cibs'],
  fr: {
    slug: 'region/provence-alpes-cote-dazur',
    nav: 'Provence-Alpes-Côte d’Azur',
    card: 'Le cheval fiscal de la région Sud, passé au plafond légal au 1er janvier 2026, avec des exemples par puissance.',
    title: 'Cheval fiscal Provence-Alpes-Côte d’Azur 2026 : 60 €',
    description: 'Cheval fiscal en Provence-Alpes-Côte d’Azur en 2026 : 60 € depuis le 1er janvier, au plafond légal après 59 € en 2025, électriques plein tarif, motos à moitié.',
    h1: 'Le cheval fiscal à 60 € : la carte grise en région Sud en 2026',
    intro: 'Le calcul complet est préréglé sur la région Sud : la puissance, l’âge et l’énergie du véhicule suffisent pour obtenir le prix du titre.',
    resume: (h) => {
      const d = jour(h);
      const t = h.M.tarifRegion(ID, d);
      const prec = sud(h).tarifs[0];
      const pl = place(h);
      return `En Provence-Alpes-Côte d’Azur, la région qui se présente sous le nom de région Sud, le cheval fiscal vaut ${h.eur2(t.cv)} au ${h.date(d)}. Ce tarif s’applique depuis le ${h.date(t.from!)}, une date confirmée par le simulateur de coût de l’État. Il remplace celui de ${h.eur2(prec.cv)} appliqué en 2025, soit une hausse de ${h.eur2(t.cv - prec.cv)} par cheval, que l’avis du conseil économique, social et environnemental régional décrit comme un passage au plafond prévu par la loi. La région ne peut donc plus monter : le code des impositions limite le tarif à ${h.eur2(h.P.regional.plafond_cv)}. Pour une voiture d’occasion de 5 CV de moins de dix ans, la taxe régionale est de ${h.eur2(regionale(h, 5, JEUNE))} et la carte grise revient à ${h.eur2(certificat(h, 5, JEUNE))}. À partir de dix ans, la taxe tombe à ${h.eur2(regionale(h, 5, VIEILLE))}. Les voitures électriques n’ont aucune remise régionale, et les motos paient la moitié du tarif à tout âge.`;
    },
    faqs: (h) => {
      const d = jour(h);
      const t = h.M.tarifRegion(ID, d);
      const prec = sud(h).tarifs[0];
      return [
        { q: 'Combien la hausse de 2026 coûte-t-elle de plus pour une voiture immatriculée en Provence-Alpes-Côte d’Azur ?', a: `Exactement ${h.eur2(t.cv - prec.cv)} par cheval fiscal, puisque le tarif est passé de ${h.eur2(prec.cv)} à ${h.eur2(t.cv)}. Une voiture de 6 CV de moins de dix ans paie donc ${h.eur2((t.cv - prec.cv) * 6)} de plus qu’en 2025, et une voiture de 12 CV ${h.eur2((t.cv - prec.cv) * 12)} de plus. Pour une voiture de dix ans ou plus, l’écart est divisé par deux.` },
        { q: 'Le tarif de Provence-Alpes-Côte d’Azur peut-il encore augmenter en 2027 ?', a: `Pas au-delà de ${h.eur2(h.P.regional.plafond_cv)} par cheval tant que la loi ne change pas, car c’est le plafond du code des impositions et la région l’a atteint. Au ${h.date(d)}, aucune modification de ce plafond n’est inscrite dans la loi, et aucune nouvelle délibération régionale n’a été repérée. Seules des règles nationales, comme le malus, évoluent au 1er janvier 2027.` },
        { q: 'Un scooter acheté à Marseille ou à Nice paie-t-il le même tarif qu’une voiture en Provence-Alpes-Côte d’Azur ?', a: `Non. Les motos et scooters des catégories L3e et L4e paient la moitié du tarif régional, quel que soit leur âge. Un scooter de 125 cm³ compte ${h.num(h.M.chevauxMoto(125))} cheval et paie ${h.eur2(regionale(h, h.M.chevauxMoto(125), JEUNE, 'moto'))} de taxe régionale. Un cyclomoteur de 50 cm³ n’en paie aucune : seuls les frais nationaux du titre restent dus.` },
      ];
    },
    body: (h) => {
      const d = jour(h);
      const t = h.M.tarifRegion(ID, d);
      const prec = sud(h).tarifs[0];
      const pl = place(h);
      const cvs = [3, 5, 7, 10];
      const rows = cvs.map((cv) => [`${cv} CV`, h.eur2(regionale(h, cv, JEUNE)), h.eur2(certificat(h, cv, JEUNE)), h.eur2(regionale(h, cv, VIEILLE)), h.eur2(certificat(h, cv, VIEILLE))]);
      const m650 = h.M.chevauxMoto(650);
      const hdf = h.P.regions.find((r) => r.id === 'hauts-de-france')!;
      return `
<h2>Un euro de plus, et le plafond atteint</h2>
<p>Le document régional que nous avons pu lire est l’${h.src('delib_paca', 'avis du CESER Provence-Alpes-Côte d’Azur sur le tarif 2026')}. Le CESER est l’assemblée consultative de la région ; il examine le projet avant le vote des élus. Le projet qu’il commente propose de porter le tarif au plafond réglementaire, soit une hausse d’un euro. La délibération elle-même n’a pas été retrouvée, mais le simulateur de l’État applique bien ${h.eur2(t.cv)} depuis le ${h.date(t.from!)}, ce qui confirme que le projet a été adopté sans changement.</p>
<p>Pour 2025, le tarif de ${h.eur2(prec.cv)} figure dans nos données à compter du ${h.date(prec.from!)}, mais cette date d’effet n’a pas été vérifiée à une source primaire. Les montants plus anciens ne sont connus que par des sites tiers : nous ne les reprenons pas.</p>

<h2>Prix du titre pour une voiture d’occasion</h2>
${h.table(['Puissance', 'Taxe régionale, moins de 10 ans', 'Titre, moins de 10 ans', 'Taxe régionale, 10 ans ou plus', 'Titre, 10 ans ou plus'], rows, `Provence-Alpes-Côte d’Azur, voiture essence, changement de titulaire au ${h.date(d)}.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Au-delà de la taxe régionale, chaque titre porte ${h.eur2(h.P.national.taxe_fixe)} de taxe fixe, arrondis avec elle à l’euro, puis ${h.eur2(h.P.national.redevance)} pour l’envoi postal du certificat. Le seuil de dix ans se compte depuis la toute première immatriculation, en France ou à l’étranger, et non depuis l’achat par le vendeur.</p>

<h2>Deux-roues : la moitié du tarif, toute leur vie</h2>
<p>Sur le littoral, une bonne part des titres concerne des scooters et des motos. Pour eux, la taxe régionale est toujours calculée à moitié, sans second rabais à dix ans. La puissance fiscale d’un deux-roues se lit en case P.6 ou se déduit de la cylindrée : une moto de 650 cm³ compte ${h.num(m650)} CV et paie ${h.eur2(regionale(h, m650, JEUNE, 'moto'))} de taxe régionale, neuve comme ancienne. La page ${h.a('moto-scooter', 'moto et scooter')} donne le barème complet des cylindrées.</p>

<h2>Voiture électrique : pas d’allègement dans la région Sud</h2>
<p>La loi autorise chaque région à réduire de moitié ou à supprimer sa taxe pour les véhicules électriques et à hydrogène. L’avis du CESER rappelle que la région a choisi de ne pas le faire : une électrique de 7 CV paie ${h.eur2(h.M.taxeRegionale({ cv: 7, region: ID, date1re: JEUNE, dateOp: d, energie: 'electrique', demarche: 'titulaire' }).y1)}, comme une essence. Au ${h.date(d)}, seule la région ${hdf.nom.fr} pratique une réduction. L’avantage de l’électrique se trouve ailleurs : il échappe aux malus lors d’une première immatriculation, comme l’explique la page ${h.a('electrique-hybride', 'voiture électrique et hybride')}.</p>

<h2>Où se situe la région</h2>
<p>Avec ${h.eur2(t.cv)}, Provence-Alpes-Côte d’Azur partage la ${h.num(pl.pos)}e place avec ${h.num(pl.memes - 1)} autres régions au plafond, derrière la seule Île-de-France, dont la majoration de transport s’ajoute au tarif. Sa voisine ${h.a('region-occitanie', 'Occitanie')} applique ${h.eur2(h.M.tarifRegion('occitanie', d).cv)}, soit ${h.eur2(t.cv - h.M.tarifRegion('occitanie', d).cv)} de moins par cheval. Ce qui compte n’est pas le lieu d’achat : un véhicule acheté à Montpellier par un habitant de Toulon paie le tarif de la région Sud, celle du domicile.</p>
`;
    },
  },
  en: {
    slug: 'region/provence-alpes-cote-dazur',
    nav: 'Provence-Alpes-Côte d’Azur',
    card: 'The fiscal horsepower rate in the Sud region, raised to the legal maximum on 1 January 2026, with examples.',
    title: 'Provence-Alpes-Côte d’Azur car registration 2026: €60',
    description: 'Car registration in Provence-Alpes-Côte d’Azur in 2026: €60 per CV since 1 January, the legal cap, up from €59, no electric discount, half rate for motorbikes.',
    h1: 'Car registration in Provence-Alpes-Côte d’Azur: €60 per CV in 2026',
    intro: 'The full calculator is preset to the Sud region: horsepower, age and fuel are enough to price the certificate.',
    resume: (h) => {
      const d = jour(h);
      const t = h.M.tarifRegion(ID, d);
      const prec = sud(h).tarifs[0];
      return `Provence-Alpes-Côte d’Azur, which brands itself as the Sud region and covers Marseille, Nice, Toulon and Avignon, charges ${h.eur2(t.cv)} per fiscal horsepower on ${h.date(d)}. The fiscal horsepower, or cheval fiscal, is the CV figure in box P.6 of a French registration certificate, and the regional tax is that figure times the rate. The current rate has applied since ${h.date(t.from!)}, a date confirmed by the State’s own cost simulator, and replaced the ${h.eur2(prec.cv)} charged in 2025. That increase of ${h.eur2(t.cv - prec.cv)} took the region to the legal ceiling of ${h.eur2(h.P.regional.plafond_cv)}, so it cannot rise further unless the law changes. A used 5 CV petrol car under ten years old pays ${h.eur2(regionale(h, 5, JEUNE))} in regional tax and ${h.eur2(certificat(h, 5, JEUNE))} for the whole certificate; at ten years or more the tax halves to ${h.eur2(regionale(h, 5, VIEILLE))}. Electric cars get no regional discount here, and motorbikes pay half the rate whatever their age.`;
    },
    faqs: (h) => {
      const d = jour(h);
      const t = h.M.tarifRegion(ID, d);
      return [
        { q: 'What does it cost to register a used 8 CV car in Provence-Alpes-Côte d’Azur?', a: `On ${h.date(d)}, a used petrol car of 8 CV under ten years old costs ${h.eur2(certificat(h, 8, JEUNE))}: ${h.eur2(regionale(h, 8, JEUNE))} of regional tax plus the two national charges that every certificate carries. If its first registration, in France or elsewhere, is ten or more years old, the total drops to ${h.eur2(certificat(h, 8, VIEILLE))}. A new car would add the national CO₂ and weight malus.` },
        { q: 'I bought a car in Italy and live near Nice: which rate applies in Provence-Alpes-Côte d’Azur?', a: `The ${h.eur2(t.cv)} Sud region rate, because the region of your home address sets the tax, not the country or region of purchase. The ten-year half rate counts from the first registration in Italy. Before applying on the ANTS website you need a tax clearance certificate, the quitus fiscal, which the EU import page explains step by step.` },
        { q: 'Could Provence-Alpes-Côte d’Azur offer a cheaper rate for electric cars later?', a: 'The law still allows it: any region may halve or waive its rate for electric and hydrogen vehicles by a vote of its council. The Sud region has chosen not to, according to the advisory opinion on the 2026 rate, and we found no new decision on this point. For now an electric car pays the same per CV as a petrol one.' },
      ];
    },
    body: (h) => {
      const d = jour(h);
      const t = h.M.tarifRegion(ID, d);
      const prec = sud(h).tarifs[0];
      const pl = place(h);
      const cvs = [4, 6, 9, 13];
      const rows = cvs.map((cv) => [`${cv} CV`, h.eur2(certificat(h, cv, JEUNE)), h.eur2(certificat(h, cv, VIEILLE)), h.eur2(certificat(h, cv, JEUNE) - certificat(h, cv, VIEILLE))]);
      const m400 = h.M.chevauxMoto(400);
      const hdf = h.P.regions.find((r) => r.id === 'hauts-de-france')!;
      return `
<h2>The 2026 rise and what we could read</h2>
<p>We could not find the council resolution itself, but we read the ${h.src('delib_paca', 'opinion of the regional economic, social and environmental council (CESER)')}, the advisory assembly that reviews the draft before the vote. The draft it discusses raises the rate to the regulatory ceiling, an increase of one euro. The State’s simulator has applied ${h.eur2(t.cv)} since ${h.date(t.from!)}, which shows the draft went through as proposed.</p>
<p>Our data also hold the 2025 rate of ${h.eur2(prec.cv)} from ${h.date(prec.from!)}. That start date was not checked against a primary source. Earlier figures are only reported by third-party sites, so we leave them out.</p>

<h2>Certificate prices by horsepower</h2>
${h.table(['Horsepower', 'Under 10 years', '10 years or more', 'Saving from the age rule'], rows, `Provence-Alpes-Côte d’Azur, used petrol car, change of keeper, on ${h.date(d)}.`, ['l', 'r', 'r', 'r'])}
<p>Besides the regional tax, every total carries ${h.eur2(h.P.national.taxe_fixe)} of flat national tax and ${h.eur2(h.P.national.redevance)} for posting the certificate to you. The State rounds the taxes to the nearest euro before adding the delivery charge, which is why every total ends in the same cents.</p>

<h2>Scooters and motorbikes</h2>
<p>Two-wheelers in categories L3e and L4e always pay half the regional rate, and there is no further cut at ten years. A 400 cm³ motorbike counts as ${h.num(m400)} CV and pays ${h.eur2(regionale(h, m400, JEUNE, 'moto'))} of regional tax. Mopeds up to 50 cm³ pay none. Details by engine size are on the ${h.a('moto-scooter', 'motorbike and scooter page')}.</p>

<h2>No electric discount</h2>
<p>French law lets each region halve or waive its rate for electric and hydrogen vehicles. Provence-Alpes-Côte d’Azur keeps the full rate, so an electric car of a given CV pays what a petrol car does. On ${h.date(d)} only ${hdf.nom.en} grants a reduction. The national malus exemptions still apply to new electric cars, as the ${h.a('electrique-hybride', 'electric and hybrid page')} explains.</p>

<h2>Ranking</h2>
<p>At ${h.eur2(t.cv)}, the region ties for place ${h.num(pl.pos)} out of ${h.num(pl.n)} with ${h.num(pl.memes - 1)} other regions at the cap; only Île-de-France costs more, because of its transport surcharge. Neighbouring ${h.a('region-occitanie', 'Occitanie')} charges ${h.eur2(h.M.tarifRegion('occitanie', d).cv)}. The ${h.a('comparer-regions', 'region comparison')} shows the gap on your own car.</p>
`;
    },
  },
});
