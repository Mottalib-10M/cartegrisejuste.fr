import { defineGuide, type Helpers } from '../../lib/guide-types';

const ID = 'normandie';
const dr = (h: Helpers) => h.P.regional.date_releve;

/** Taxe régionale d'une voiture d'occasion essence dans une région donnée. */
const taxe = (h: Helpers, region: string, cv: number, dix = false, date = dr(h)) =>
  h.M.taxeRegionale({ cv, region, date1re: dix ? '2014-11-01' : '2024-11-01', dateOp: date, energie: 'essence', demarche: 'titulaire' }).y1;
const facture = (h: Helpers, cv: number, dix = false) =>
  h.M.coutCarteGrise({ cv, region: ID, date1re: dix ? '2014-11-01' : '2024-11-01', dateOp: dr(h), energie: 'essence', demarche: 'titulaire', genre: 'vp', origine: 'france_occasion', gkm: 0, masseKg: 0, ptacKg: 0 }).total;
/** Taux par CV d'une région, majoration francilienne comprise. */
const taux = (h: Helpers, id: string, date = dr(h)) => {
  const r = h.P.regions.find((x) => x.id === id)!;
  return h.M.tarifRegion(id, date).cv + (r.idfm ? h.M.majorationIdfm(date) : 0);
};
const classement = (h: Helpers) => {
  const moi = taux(h, ID);
  const t = h.P.regions.map((r) => taux(h, r.id));
  return { rang: t.filter((v) => v > moi).length + 1, ex: t.filter((v) => v === moi).length - 1, n: t.length };
};
const VOISINES = ['ile-de-france', 'bretagne', 'centre-val-de-loire', 'pays-de-la-loire', 'hauts-de-france'];

export default defineGuide({
  id: 'region-normandie',
  group: 'regions',
  order: 90,
  tool: 'cout',
  region: ID,
  related: ['region-ile-de-france', 'region-bretagne', 'comparer-regions', 'occasion-titulaire', 'tarif-cheval-fiscal'],
  sources: ['prixcv', 'a18021', 'cibs', 'idfm', 'ants'],
  fr: {
    slug: 'region/normandie',
    nav: 'Normandie',
    card: 'Un tarif déjà au plafond légal, l’écart avec Paris et les régions voisines, et le prix du titre à Caen, Rouen ou au Havre.',
    title: 'Cheval fiscal Normandie 2026 : 60 €, le plafond légal',
    description: 'Cheval fiscal en Normandie en 2026 : 60 € par CV, soit le plafond légal. Écart avec Paris et les régions voisines, exemples selon les CV et l’âge du véhicule.',
    h1: 'Le prix du cheval fiscal normand pour une carte grise en 2026',
    intro: 'Le calcul ci-dessus applique le tarif normand ; renseignez la case P.6 et la date de première immatriculation de votre véhicule.',
    resume: (h) => {
      const t = h.M.tarifRegion(ID, dr(h));
      const c = classement(h);
      return `La Normandie applique ${h.eur2(t.cv)} par cheval fiscal, soit exactement le plafond que le code des impositions autorise pour une région. Elle ne peut donc plus relever ce tarif, et aucune hausse n’a été annoncée pour 2027. Le montant est confirmé par le simulateur officiel de l’État au ${h.date(dr(h))} ; il serait en vigueur depuis le ${h.date(t.from!)}, mais cette date n’a pas été vérifiée dans un texte régional, faute d’avoir pu lire la délibération. Avec ce tarif, la région partage la ${h.num(c.rang)}e place nationale avec ${h.num(c.ex)} autres territoires, derrière la seule Île-de-France, où s’ajoute une majoration pour les transports. Une voiture de 5 CV de moins de dix ans y paie ${h.eur(taxe(h, ID, 5))} de taxe régionale et ${h.eur2(facture(h, 5))} pour l’ensemble du certificat. À partir de dix ans, ou pour une moto, le tarif tombe de moitié. Les voitures électriques n’ont aucune réduction en Normandie et paient comme une voiture à essence.`;
    },
    faqs: (h) => {
      const idf26 = taux(h, 'ile-de-france');
      const idf27 = taux(h, 'ile-de-france', '2027-01-15');
      const moi = taux(h, ID);
      return [
        { q: 'Je quitte Paris pour Rouen : ma carte grise coûtera-t-elle moins cher en Normandie ?', a: `Oui, si vous achetez une voiture après votre installation. Le cheval coûte ${h.eur2(moi)} en Normandie contre ${h.eur2(idf26)} à Paris en 2026, soit ${h.eur2(idf26 - moi)} de moins par CV. Si vous gardez votre véhicule, vous n’avez rien à payer : un changement d’adresse ne déclenche pas la taxe régionale.` },
        { q: 'L’écart entre la Normandie et l’Île-de-France va-t-il changer en 2027 ?', a: `Il doit se réduire. La majoration francilienne passe à ${h.eur2(h.M.majorationIdfm('2027-01-15'))} par cheval au ${h.date(h.P.idfm.periodes[1].from)}, sauf délibération contraire d’Île-de-France Mobilités. L’écart avec la Normandie tomberait alors à ${h.eur2(idf27 - moi)} par CV. Le tarif normand, déjà au plafond, ne peut pas monter.` },
        { q: 'Une voiture électrique paie-t-elle la carte grise en Normandie ?', a: `Oui, le plein tarif. La région n’a pas utilisé la possibilité, ouverte par la loi, de réduire de moitié ou de supprimer sa taxe pour les véhicules électriques et à hydrogène. Une électrique de 7 CV de moins de dix ans paie ${h.eur(taxe(h, ID, 7))} de taxe régionale, comme une thermique de même puissance. Les malus, eux, ne la concernent pas.` },
        { q: 'D’où vient le tarif retenu pour la Normandie ?', a: `Du simulateur officiel du prix du cheval fiscal, publié par service-public.gouv.fr et interrogé au ${h.date(dr(h))}. La délibération régionale n’a pas été trouvée en ligne, et l’avis du conseil économique, social et environnemental régional sur le budget 2026 n’a pas pu être lu. La date d’effet indiquée reste donc à confirmer.` },
      ];
    },
    body: (h) => {
      const t = h.M.tarifRegion(ID, dr(h));
      const cvs = [5, 7, 9, 12];
      const rows = cvs.map((cv) => [`${cv} CV`, h.eur(taxe(h, ID, cv)), h.eur(taxe(h, ID, cv, true)), h.eur2(facture(h, cv)), h.eur2(facture(h, cv, true))]);
      const vois = [ID, ...VOISINES].map((id) => h.P.regions.find((r) => r.id === id)!)
        .map((r) => ({ r, v: taux(h, r.id) }))
        .sort((a, b) => b.v - a.v || a.r.nom.fr.localeCompare(b.r.nom.fr));
      const vrows = vois.map((x) => [x.r.nom.fr, h.eur2(x.v), h.eur2(taxe(h, x.r.id, 6))]);
      return `
<h2>Un tarif qui ne peut plus monter</h2>
<p>Le ${h.src('cibs', 'code des impositions sur les biens et services')} limite à ${h.eur2(h.P.regional.plafond_cv)} le prix qu’une région peut fixer par cheval. La Normandie l’a atteint. Le ${h.src('prixcv', 'simulateur officiel du prix du cheval fiscal')} le confirme au ${h.date(dr(h))}. La date d’entrée en vigueur retenue, le ${h.date(t.from!)}, provient de sources secondaires et n’a pas été rapprochée d’une délibération : le recueil des actes de la région n’a pas permis de la retrouver. Les valeurs des années antérieures ne figurent pas ici pour la même raison.</p>

<h2>Combien pour votre voiture</h2>
${h.table(['Puissance', 'Taxe régionale, moins de 10 ans', 'Taxe régionale, 10 ans ou plus', 'Titre, moins de 10 ans', 'Titre, 10 ans ou plus'], rows, `Normandie, changement de titulaire au ${h.date(dr(h))}.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Le titre complet ajoute ${h.eur2(h.P.national.taxe_fixe)} de taxe fixe (ligne Y4) et ${h.eur2(h.P.national.redevance)} d’acheminement (ligne Y5). L’âge se lit en case B de la carte grise : c’est la toute première immatriculation qui compte, même hors de France.</p>

<h2>La Normandie face à ses voisines</h2>
<p>Pour une voiture de 6 CV de moins de dix ans, le tableau classe la Normandie et les cinq régions qui la bordent, du tarif le plus fort au plus faible.</p>
${h.table(['Région', '€ par CV', 'Taxe régionale, 6 CV'], vrows, `Tarifs au ${h.date(dr(h))}, majoration francilienne comprise.`, ['l', 'r', 'r'])}
<p>La comparaison n’a d’intérêt qu’en cas de déménagement : le tarif dépend du domicile du nouveau titulaire, pas du lieu d’achat. Un habitant de Caen qui achète chez un concessionnaire de la région parisienne paie le tarif normand ; un Francilien qui achète à Évreux paie le tarif de l’${h.a('region-ile-de-france', 'Île-de-France')}. Pour une société, c’est l’établissement auquel le véhicule est affecté qui fixe la région.</p>

<h2>Électrique, moto, cyclomoteur</h2>
<ul>
<li>Voiture électrique ou à hydrogène : plein tarif, la région n’ayant voté aucune réduction (${h.src('a18021', 'actualité de service-public.gouv.fr')}).</li>
<li>Moto : moitié du tarif quel que soit son âge, soit ${h.eur2(h.M.taxeRegionale({ cv: 4, region: ID, date1re: '2024-11-01', dateOp: dr(h), energie: 'essence', demarche: 'titulaire', genre: 'moto' }).y1)} pour 4 CV.</li>
<li>Cyclomoteur de 50 cm³ : pas de taxe régionale, seulement la taxe fixe et la redevance.</li>
</ul>
<p>La demande se dépose sur le ${h.src('ants', 'site de l’ANTS')}, sans frais de dossier. Pour une vente entre particuliers, la page ${h.a('occasion-titulaire', 'changement de titulaire')} reprend les pièces à réunir.</p>
`;
    },
  },
  en: {
    slug: 'region/normandie',
    nav: 'Normandy',
    card: 'A rate already at the legal cap, the gap with Paris and neighbouring regions, and what a certificate costs in Caen, Rouen or Le Havre.',
    title: 'Normandy car registration 2026: €60 per CV, the legal cap',
    description: 'Normandy car registration in 2026: €60 per fiscal horsepower, the legal maximum. How it compares with Paris and nearby regions, with examples by CV and car age.',
    h1: 'Registering a car in Normandy: the 2026 rate',
    intro: 'The calculation above uses the Normandy rate; enter box P.6 and the first registration date of your vehicle.',
    resume: (h) => {
      const t = h.M.tarifRegion(ID, dr(h));
      const c = classement(h);
      return `Normandy charges ${h.eur2(t.cv)} per fiscal horsepower, the “cheval fiscal” that drives the regional tax on a French registration certificate (“carte grise”). That is the most French law lets a region charge, so the rate cannot rise further, and no change has been announced for 2027. The State’s official simulator confirms the amount on ${h.date(dr(h))}. It is said to have applied since ${h.date(t.from!)}, but that date has not been checked against a regional resolution, which could not be found. Normandy shares ${c.rang === 2 ? 'second' : h.num(c.rang)} place nationally with ${h.num(c.ex)} other areas, behind only Île-de-France, where a transport surcharge comes on top. A 5 CV car under ten years old pays ${h.eur(taxe(h, ID, 5))} in regional tax and ${h.eur2(facture(h, 5))} for the full certificate. From ten years of age, and for any motorbike, the rate is halved. Electric cars get no discount in Normandy and pay the same as petrol cars.`;
    },
    faqs: (h) => {
      const idf26 = taux(h, 'ile-de-france');
      const idf27 = taux(h, 'ile-de-france', '2027-01-15');
      const moi = taux(h, ID);
      return [
        { q: 'I am relocating from Paris to Normandy: will registering a car cost less?', a: `Yes, for a car you buy once you have moved. Normandy charges ${h.eur2(moi)} per CV against ${h.eur2(idf26)} in Paris in 2026, a saving of ${h.eur2(idf26 - moi)} per CV. A car you already own needs only an address update on the ANTS website, the national registration service, and that triggers no regional tax.` },
        { q: 'Will the gap between Normandy and Paris shrink in 2027?', a: `It should. The Paris-region transport surcharge drops to ${h.eur2(h.M.majorationIdfm('2027-01-15'))} per CV from ${h.date(h.P.idfm.periodes[1].from)}, unless the transport authority votes otherwise. The difference with Normandy would then be ${h.eur2(idf27 - moi)} per CV. Normandy itself is already at the cap and cannot go up, so any change comes from the Paris side.` },
        { q: 'Do electric cars pay the regional tax in Normandy?', a: `Yes, at the full rate. French law lets regions halve or scrap the tax for electric and hydrogen vehicles, and Normandy has not done so. A 7 CV electric car under ten years old pays ${h.eur(taxe(h, ID, 7))}, the same as a petrol car of equal rating. It still avoids the national CO₂ and weight malus when new.` },
        { q: 'How reliable is the Normandy figure used here?', a: `The amount comes from the State’s official fiscal horsepower simulator, checked on ${h.date(dr(h))}. The regional resolution itself was not found online, and a regional advisory council opinion on the 2026 budget could not be opened. The amount is therefore solid, while the start date shown should be treated as unconfirmed until the region publishes it.` },
      ];
    },
    body: (h) => {
      const t = h.M.tarifRegion(ID, dr(h));
      const cvs = [5, 7, 9, 12];
      const rows = cvs.map((cv) => [`${cv} CV`, h.eur(taxe(h, ID, cv)), h.eur(taxe(h, ID, cv, true)), h.eur2(facture(h, cv)), h.eur2(facture(h, cv, true))]);
      const vois = [ID, ...VOISINES].map((id) => h.P.regions.find((r) => r.id === id)!)
        .map((r) => ({ r, v: taux(h, r.id) }))
        .sort((a, b) => b.v - a.v || a.r.nom.en.localeCompare(b.r.nom.en));
      const vrows = vois.map((x) => [x.r.nom.en, h.eur2(x.v), h.eur2(taxe(h, x.r.id, 6))]);
      return `
<h2>A rate at its ceiling</h2>
<p>The ${h.src('cibs', 'French tax code')} caps the regional rate at ${h.eur2(h.P.regional.plafond_cv)} per CV, and Normandy has reached it. The ${h.src('prixcv', 'official fiscal horsepower price simulator')} shows this amount on ${h.date(dr(h))}. The start date of ${h.date(t.from!)} comes from secondary sources and has not been matched to a regional resolution. Earlier Normandy rates are not given here for the same reason.</p>

<h2>What your car will cost</h2>
${h.table(['Power', 'Regional tax, under 10 years', 'Regional tax, 10 years or more', 'Certificate, under 10 years', 'Certificate, 10 years or more'], rows, `Normandy, change of keeper on ${h.date(dr(h))}.`, ['l', 'r', 'r', 'r', 'r'])}
<p>The full certificate adds ${h.eur2(h.P.national.taxe_fixe)} of fixed tax (line Y4) and ${h.eur2(h.P.national.redevance)} for posting the document (line Y5). Age is read from box B: the very first registration counts, even outside France.</p>

<h2>Normandy and its neighbours</h2>
<p>Regional tax on a 6 CV car under ten years old, for Normandy and the regions around it, from highest rate to lowest.</p>
${h.table(['Region', '€ per CV', 'Regional tax, 6 CV'], vrows, `Rates on ${h.date(dr(h))}, Paris surcharge included.`, ['l', 'r', 'r'])}
<p>This only matters if you move: the rate follows the new keeper’s home, not the place of sale. Someone living in Caen who buys from a Paris dealer pays the Normandy rate; a Parisian buying in Évreux pays the ${h.a('region-ile-de-france', 'Île-de-France')} rate. For a company, the branch the vehicle is assigned to decides.</p>

<h2>Electric cars, motorbikes, mopeds</h2>
<ul>
<li>Electric or hydrogen car: full rate, as no regional reduction has been voted (${h.src('a18021', 'service-public.gouv.fr news item')}).</li>
<li>Motorbike: half rate at any age, ${h.eur2(h.M.taxeRegionale({ cv: 4, region: ID, date1re: '2024-11-01', dateOp: dr(h), energie: 'essence', demarche: 'titulaire', genre: 'moto' }).y1)} for 4 CV.</li>
<li>50 cc moped: no regional tax, only the national charges.</li>
</ul>
<p>Applications go through the ${h.src('ants', 'ANTS website')} at no handling cost. For a private sale, the ${h.a('occasion-titulaire', 'used car transfer')} page lists the documents you need.</p>
`;
    },
  },
});
