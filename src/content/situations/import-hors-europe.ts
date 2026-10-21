import { defineGuide, type Helpers } from '../../lib/guide-types';

/** Exemple suivi sur toute la page : SUV essence acheté hors UE, immatriculé en Provence-Alpes-Côte d'Azur. */
const EX = { prix: 30000, transport: 2500, cv: 11, gkm: 200, masseKg: 1900, date1re: '2023-09-01', region: 'provence-alpes-cote-dazur' };
const douane = (h: Helpers, prix = EX.prix, transport = EX.transport) => {
  const valeur = prix + transport;
  const droits = valeur * h.P.douane.droit_voiture;
  const tva = (valeur + droits) * h.P.douane.tva;
  return { valeur, droits, tva, total: droits + tva };
};
const carte = (h: Helpers, o: Partial<typeof EX> & { origine?: 'import_occasion' | 'import_neuf' } = {}) => {
  const e = { ...EX, ...o };
  const d = h.P.regional.date_releve;
  return h.M.coutCarteGrise({ demarche: 'immat', origine: o.origine ?? 'import_occasion', genre: 'vp', energie: 'essence', ptacKg: 0, region: e.region, cv: e.cv, gkm: e.gkm, masseKg: e.masseKg, date1re: o.origine === 'import_neuf' ? d : e.date1re, dateOp: d });
};
const taux = (h: Helpers) => ({ droit: h.pct(h.P.douane.droit_voiture, 0), tva: h.pct(h.P.douane.tva, 0) });

export default defineGuide({
  id: 'import-hors-europe',
  group: 'situations',
  order: 40,
  mini: 'importHorsUe',
  miniHref: 'home',
  related: ['import-europe', 'quitus-tva', 'malus-co2', 'malus-masse', 'budget-achat'],
  sources: ['douane', 'l421_7_2', 'l421_62', 'f35950', 'ants'],
  fr: {
    slug: 'vehicule-importe-hors-europe',
    nav: 'Import hors Europe',
    card: 'Droits de douane, TVA à l’importation, certificat 846 A, puis malus avec décote : le coût complet d’une voiture achetée hors de l’UE.',
    title: 'Voiture importée hors Europe 2026 : douane, TVA et malus',
    description: 'Voiture achetée hors de l’UE : 10 % de droits de douane, 20 % de TVA, certificat 846 A, puis carte grise avec malus CO₂ et au poids réduits selon l’âge.',
    h1: 'Importer une voiture de l’extérieur de l’Union européenne',
    intro: 'Le mini-simulateur additionne les droits de douane, la TVA à l’importation et le malus après décote pour une voiture achetée hors de l’UE.',
    resume: (h) => {
      const t = taux(h);
      const dz = douane(h);
      const c = carte(h);
      return `Une voiture achetée aux États-Unis, au Japon, en Suisse ou au Royaume-Uni passe d’abord par la douane, avant toute carte grise. Pour une voiture particulière, les droits de douane sont de ${t.droit} de la valeur, transport et assurance jusqu’à la frontière de l’Union compris, et la TVA à l’importation de ${t.tva} s’applique ensuite sur cette valeur augmentée des droits, que la voiture soit neuve ou d’occasion. Une fois ces sommes réglées, la douane délivre le certificat de dédouanement 846 A, exigé pour l’immatriculation. Vient alors la carte grise, calculée comme pour tout véhicule importé : taxe régionale, malus CO₂ et malus au poids selon le barème de l’année de première immatriculation, réduits par la décote liée à l’âge. Exemple : un SUV essence payé ${h.eur(EX.prix)}, avec ${h.eur(EX.transport)} de transport, supporte ${h.eur(dz.droits)} de droits et ${h.eur(dz.tva)} de TVA ; immatriculé en Provence-Alpes-Côte d’Azur au ${h.date(h.P.regional.date_releve)}, il paie encore ${h.eur2(c.total)} de carte grise.`;
    },
    faqs: (h) => {
      const t = taux(h);
      return [
        { q: 'Sur quelle valeur la douane calcule-t-elle les droits d’une voiture achetée aux États-Unis ?', a: `Sur la valeur en douane : le prix payé au vendeur, converti en euros, auquel s’ajoutent le transport maritime et l’assurance jusqu’au point d’entrée dans l’Union. Les droits de ${t.droit} s’appliquent à ce total. La TVA de ${t.tva} se calcule ensuite sur la valeur en douane augmentée des droits. Gardez la facture et les justificatifs de fret : ils fondent ce calcul.` },
        { q: 'Une voiture d’occasion importée du Japon paie-t-elle quand même la TVA française ?', a: `Oui. Hors de l’Union, la règle des ${h.num(h.P.tva_import.mois_max)} mois ou des ${h.num(h.P.tva_import.km_max)} km ne joue pas : la TVA à l’importation de ${t.tva} est due sur toute voiture, neuve ou d’occasion, et elle est encaissée par la douane. Elle se paie au moment du dédouanement, en même temps que les droits, et la douane ne remet le certificat 846 A qu’une fois tout réglé.` },
        { q: 'À quoi sert le certificat 846 A pour une voiture venue de l’extérieur de l’UE ?', a: 'C’est la preuve que la voiture a été dédouanée et que les droits et la TVA ont été payés. La douane le remet après le dédouanement, et il fait partie des pièces à présenter pour la demande d’immatriculation. Sans lui, la voiture ne peut pas recevoir de plaques françaises : conservez l’original avec la facture d’achat.' },
        { q: 'Le malus d’une voiture importée du Royaume-Uni est-il différent de celui d’une voiture allemande ?', a: `Non. Une fois dédouanée, la voiture britannique suit exactement les règles d’une voiture importée de l’Union : barème de l’année de sa première immatriculation, décote mensuelle selon son âge, rien avant ${h.P.decote_import.zero_avant.slice(0, 4)}, et malus au poids seulement à partir des immatriculations de ${h.P.malus_masse.premiere_annee.slice(0, 4)}. Seule la douane fait la différence.` },
      ];
    },
    body: (h) => {
      const t = taux(h);
      const dz = douane(h);
      const c = carte(h);
      const neuf = carte(h, { origine: 'import_neuf' });
      const dn = douane(h, 45000, 2500);
      const reg = h.M.tarifRegion(EX.region, h.P.regional.date_releve).cv;
      return `
<h2>Étape 1 : la douane</h2>
<p>Pour une voiture particulière, la ${h.src('douane', 'fiche de la douane')} retient ${t.droit} de droits et ${t.tva} de TVA à l’importation. Les deux se calculent l’un après l’autre :</p>
${h.table(['Ligne', 'Calcul', 'Montant'], [
  ['Prix d’achat', '', h.eur(EX.prix)],
  ['Transport et assurance', '', h.eur(EX.transport)],
  ['Valeur en douane', 'prix + transport', h.eur(dz.valeur)],
  ['Droits de douane', `${t.droit} de la valeur`, h.eur(dz.droits)],
  ['TVA à l’importation', `${t.tva} de (valeur + droits)`, h.eur(dz.tva)],
  ['Total payé à la douane', '', h.eur(dz.total)],
], 'SUV essence acheté hors de l’Union européenne.', ['l', 'l', 'r'])}
<p>Le taux de droit dépend de la nature et de l’origine du véhicule : une moto, un utilitaire ou une voiture qui bénéficie d’un accord commercial ne suivent pas forcément ce taux. C’est la douane qui le fixe lors du dédouanement. Elle délivre ensuite le certificat 846 A.</p>

<h2>Étape 2 : la carte grise et ses malus</h2>
<p>Le SUV de l’exemple a été immatriculé pour la première fois en septembre 2023, fait 11 CV, émet 200 g/km et pèse 1 900 kg. Il relève donc du barème ${c.malus.annee} : ${h.eur(c.malus.co2Brut)} de malus CO₂ et ${h.eur(c.malus.masseBrut)} de malus au poids avant réduction. À ${h.num(h.M.moisEntames(EX.date1re, h.P.regional.date_releve))} mois, la ${h.src('l421_7_2', 'décote')} est de ${h.pct(c.malus.decote, 0)}, ce qui ramène les malus à ${h.eur(c.malus.co2)} et ${h.eur(c.malus.masse)}.</p>
<p>La taxe régionale de Provence-Alpes-Côte d’Azur, à ${h.eur2(reg)} par cheval, ajoute ${h.eur2(c.y1.y1)}. Avec les frais fixes de gestion et d’envoi, la carte grise s’élève à ${h.eur2(c.total)}. Le coût d’entrée total, douane comprise, atteint ainsi ${h.eur(dz.total + c.total)}, soit ${h.pct((dz.total + c.total) / dz.valeur, 0)} de la valeur de la voiture.</p>

<h2>Neuf ou occasion : l’écart du malus</h2>
<p>Si le même SUV arrivait neuf, sans immatriculation antérieure, il suivrait le barème 2026 sans aucune décote. Sa carte grise monterait à ${h.eur2(neuf.total)}, malus plafonné à ${h.eur(h.P.malus_co2.annees['2026'].plafond)}. Payé ${h.eur(45000)} avec le même transport, il verserait en plus ${h.eur(dn.total)} à la douane. Pour une voiture très émettrice, l’ancienneté acquise à l’étranger change donc beaucoup le prix final ; vérifiez la date de première immatriculation avant d’acheter.</p>

<h2>Ce que le mini-simulateur ne fait pas</h2>
<ul>
<li>Il ne compte pas le malus au poids : ajoutez-le avec le ${h.a('home', 'calcul complet')}, qui le décote de la même façon.</li>
<li>Il ne calcule pas le malus des voitures immatriculées avant ${h.P.malus_co2.premiere_annee_wltp.slice(0, 4)}, qui relève de l’ancien barème NEDC.</li>
<li>Il applique le taux de droit des voitures particulières, sans tenir compte d’un éventuel accord d’origine.</li>
</ul>
<p>Pour la suite, les règles sont celles d’une ${h.a('import-europe', 'voiture importée d’Europe')}. La demande se dépose sur le ${h.src('ants', 'site de l’ANTS')} : elle est gratuite, seules les taxes sont dues.</p>
`;
    },
  },
  en: {
    slug: 'import-car-outside-eu',
    nav: 'Import from outside the EU',
    card: 'Customs duty, import VAT, the 846 A certificate, then the malus with its age reduction: the full cost of a car bought outside the EU.',
    title: 'Import a car to France from outside the EU: customs, VAT',
    description: 'Car bought outside the EU: 10% customs duty, 20% import VAT, the 846 A certificate, then French registration with CO₂ and weight malus reduced by age.',
    h1: 'Bringing a car into France from outside the European Union',
    intro: 'The mini calculator adds customs duty, import VAT and the malus after its age reduction for a car bought outside the EU.',
    resume: (h) => {
      const t = taux(h);
      const dz = douane(h);
      const c = carte(h);
      return `A car bought in the United States, Japan, Switzerland or the United Kingdom must clear French customs before it can be registered. For a passenger car, customs duty is ${t.droit} of its value, including shipping and insurance to the EU border, and import VAT at ${t.tva} is then charged on that value plus the duty, whether the car is new or used. Once both are paid, customs issue clearance certificate 846 A, which you need to register the car. Registration then works as for any import: regional tax, plus the CO₂ malus and weight malus taken from the scale of the year the car was first registered, reduced according to its age. Example: a petrol SUV bought for ${h.eur(EX.prix)}, with ${h.eur(EX.transport)} of shipping, pays ${h.eur(dz.droits)} of duty and ${h.eur(dz.tva)} of VAT; registered in Provence-Alpes-Côte d’Azur on ${h.date(h.P.regional.date_releve)}, its French registration certificate, the “carte grise”, still costs ${h.eur2(c.total)}.`;
    },
    faqs: (h) => {
      const t = taux(h);
      return [
        { q: 'What value do French customs use for a car shipped from the United States?', a: `The customs value: the price paid to the seller, converted into euros, plus sea freight and insurance up to the point of entry into the EU. Duty of ${t.droit} applies to that figure, and ${t.tva} VAT is then charged on the customs value plus the duty. Keep the invoice and the freight documents, since customs base the whole calculation on them.` },
        { q: 'Is import VAT due on a ten-year-old car shipped from Japan?', a: `Yes. For cars from outside the EU, the ${h.num(h.P.tva_import.mois_max)}-month or ${h.num(h.P.tva_import.km_max)} km test does not apply: import VAT at ${t.tva} is due on every car, new or used, and customs collect it. It is paid at clearance together with the duty. The car’s age only matters later, for the malus reduction at registration.` },
        { q: 'Why does ANTS ask for form 846 A when registering a non-EU car?', a: 'Form 846 A is the customs clearance certificate. It proves the car has been cleared and that duty and VAT have been paid. Customs issue it once clearance is complete, and it is one of the documents the registration application needs. Without it the car cannot get French plates, so keep the original with the purchase invoice.' },
        { q: 'Does a car brought over from the UK after Brexit pay a different malus?', a: `No. Once cleared through customs, a British car follows exactly the same rules as one imported from the EU: the scale of its first registration year, a monthly age reduction, no malus for cars first registered before ${h.P.decote_import.zero_avant.slice(0, 4)}, and a weight malus only for cars registered from ${h.P.malus_masse.premiere_annee.slice(0, 4)} onwards. Only the customs stage differs.` },
      ];
    },
    body: (h) => {
      const t = taux(h);
      const dz = douane(h);
      const c = carte(h);
      const neuf = carte(h, { origine: 'import_neuf' });
      const dn = douane(h, 45000, 2500);
      const reg = h.M.tarifRegion(EX.region, h.P.regional.date_releve).cv;
      return `
<h2>Step 1: customs</h2>
<p>For a passenger car, the ${h.src('douane', 'French customs guidance')} sets duty at ${t.droit} and import VAT at ${t.tva}. They are worked out one after the other:</p>
${h.table(['Line', 'How', 'Amount'], [
  ['Purchase price', '', h.eur(EX.prix)],
  ['Shipping and insurance', '', h.eur(EX.transport)],
  ['Customs value', 'price + shipping', h.eur(dz.valeur)],
  ['Customs duty', `${t.droit} of the value`, h.eur(dz.droits)],
  ['Import VAT', `${t.tva} of (value + duty)`, h.eur(dz.tva)],
  ['Total paid to customs', '', h.eur(dz.total)],
], 'Petrol SUV bought outside the European Union.', ['l', 'l', 'r'])}
<p>The duty rate depends on the type and origin of the vehicle: a motorbike, a van or a car covered by a trade agreement may be charged differently. Customs set the rate when the car is cleared, then issue certificate 846 A.</p>

<h2>Step 2: registration and malus</h2>
<p>The SUV in the example was first registered in September 2023, is rated 11 CV, emits 200 g/km and weighs 1,900 kg. It therefore falls under the ${c.malus.annee} scale: ${h.eur(c.malus.co2Brut)} of CO₂ malus and ${h.eur(c.malus.masseBrut)} of weight malus before any reduction. At ${h.num(h.M.moisEntames(EX.date1re, h.P.regional.date_releve))} months old, the ${h.src('l421_7_2', 'age reduction')} is ${h.pct(c.malus.decote, 0)}, which brings the two down to ${h.eur(c.malus.co2)} and ${h.eur(c.malus.masse)}.</p>
<p>The regional tax in Provence-Alpes-Côte d’Azur, at ${h.eur2(reg)} per CV, adds ${h.eur2(c.y1.y1)}. With the fixed handling and postage charges, the certificate comes to ${h.eur2(c.total)}. The full cost of bringing the car in, customs included, is ${h.eur(dz.total + c.total)}, or ${h.pct((dz.total + c.total) / dz.valeur, 0)} of its value.</p>

<h2>New or used: how much the malus moves</h2>
<p>If the same SUV arrived brand new, never registered anywhere, it would use the 2026 scale with no reduction. Its registration would rise to ${h.eur2(neuf.total)}, with the malus capped at ${h.eur(h.P.malus_co2.annees['2026'].plafond)}. Bought for ${h.eur(45000)} with the same shipping, it would also pay ${h.eur(dn.total)} to customs. For a high-emission car, the time already spent on foreign plates makes a large difference, so check the first registration date before you buy.</p>

<h2>What the mini calculator leaves out</h2>
<ul>
<li>It does not include the weight malus: add it with the ${h.a('home', 'full calculation')}, which applies the same reduction.</li>
<li>It cannot work out the malus for cars first registered before ${h.P.malus_co2.premiere_annee_wltp.slice(0, 4)}, which fall under the older NEDC scale.</li>
<li>It uses the standard passenger-car duty rate and ignores any preferential origin.</li>
</ul>
<p>From there, the rules match those for a ${h.a('import-europe', 'car imported from the EU')}. The application goes through the ${h.src('ants', 'ANTS website')}, the State registration agency: it is free, and only the taxes are charged.</p>
`;
    },
  },
});
