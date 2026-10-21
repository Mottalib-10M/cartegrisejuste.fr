import { defineGuide, type Helpers } from '../../lib/guide-types';
import type { Energie, Origine } from '../../lib/engine/carte-grise';

const ID = 'grand-est';
const op = (h: Helpers) => h.P.regional.date_releve;

/** Coût d'une première immatriculation en France d'une voiture venue d'un pays voisin. */
const importe = (h: Helpers, o: { cv: number; date1re: string; gkm: number; masseKg: number; energie?: Energie; origine?: Origine }) =>
  h.M.coutCarteGrise({ cv: o.cv, region: ID, date1re: o.date1re, dateOp: op(h), energie: o.energie ?? 'essence', demarche: 'immat', genre: 'vp', origine: o.origine ?? 'import_occasion', gkm: o.gkm, masseKg: o.masseKg, ptacKg: 0 });
/** Simple revente en France (pas de malus). */
const revente = (h: Helpers, cv: number, vieux = false) =>
  h.M.coutCarteGrise({ cv, region: ID, date1re: vieux ? '2013-10-01' : '2023-10-01', dateOp: op(h), energie: 'diesel', demarche: 'titulaire', genre: 'vp', origine: 'france_occasion', gkm: 0, masseKg: 0, ptacKg: 0 });
const rangGE = (h: Helpers) => {
  const v = (r: (typeof h.P.regions)[number]) => h.M.tarifRegion(r.id, op(h)).cv + (r.idfm ? h.M.majorationIdfm(op(h)) : 0);
  const moi = v(h.P.regions.find((r) => r.id === ID)!);
  return { rang: h.P.regions.filter((r) => v(r) > moi).length + 1, avec: h.P.regions.filter((r) => v(r) === moi).length - 1, total: h.P.regions.length };
};
/** Trois véhicules types achetés de l'autre côté de la frontière. */
const CAS = { recent: { cv: 7, date1re: '2022-03-10', gkm: 140, masseKg: 1650 }, ancien: { cv: 7, date1re: '2014-06-02', gkm: 150, masseKg: 1500 }, ve: { cv: 6, date1re: '2023-09-05', gkm: 0, masseKg: 1900, energie: 'electrique' as Energie } };

export default defineGuide({
  id: 'region-grand-est',
  group: 'regions',
  order: 60,
  tool: 'cout',
  region: ID,
  related: ['import-europe', 'import-hors-europe', 'quitus-tva', 'comparer-regions', 'region-bourgogne-franche-comte'],
  sources: ['prixcv', 'quitus', 'douane', 'l421_7_2', 'cibs'],
  fr: {
    slug: 'region/grand-est',
    nav: 'Grand Est',
    card: 'Tarif régional au plafond, et ce que coûte une voiture rapportée d’Allemagne, du Luxembourg, de Belgique ou de Suisse.',
    title: 'Carte grise Grand Est 2026 : 60 € le CV, voitures importées',
    description: 'Carte grise dans le Grand Est en 2026 : 60 € par cheval fiscal, plafond légal. Exemples pour une voiture achetée en Allemagne, au Luxembourg ou en Suisse.',
    h1: 'Immatriculer un véhicule dans le Grand Est en 2026',
    intro: 'Le simulateur reprend le tarif du Grand Est ; pour une voiture achetée à l’étranger, choisissez l’origine « importé » afin d’ajouter le malus avec sa décote.',
    resume: (h) => {
      const t = h.M.tarifRegion(ID, op(h));
      const rg = rangGE(h);
      const a = importe(h, CAS.recent);
      return `Le Grand Est fait payer ${h.eur2(t.cv)} par cheval fiscal, le maximum que la loi permet à une région. Ce tarif est confirmé par le simulateur officiel de l’État au ${h.date(op(h))} ; la date du ${h.date(t.from!)} souvent citée pour son entrée en vigueur n’a pas pu être vérifiée, aucune délibération régionale n’ayant été trouvée. La région est ${h.num(rg.rang)}e sur ${h.num(rg.total)}, ex aequo avec ${h.num(rg.avec)} autres, juste derrière l’Île-de-France. Une voiture diesel de 7 CV de moins de dix ans qui change de propriétaire coûte ${h.eur2(revente(h, 7).total)}. Région frontalière de quatre pays, le Grand Est voit passer beaucoup de voitures achetées à l’étranger : une essence de 7 CV immatriculée pour la première fois en Allemagne en mars 2022 revient ici à ${h.eur2(a.total)}, dont ${h.eur(a.malus.total)} de malus après décote. Une voiture d’au moins dix ans paie moitié prix, et le malus est nul si sa première immatriculation précède le ${h.date(h.P.decote_import.zero_avant)}. Les électriques paient le tarif plein.`;
    },
    faqs: (h) => {
      const b = importe(h, CAS.ancien);
      const ve = importe(h, CAS.ve);
      return [
        { q: 'Une voiture allemande de 2014 rapportée dans le Grand Est paie-t-elle un malus ?', a: `Non. Le malus des véhicules d’occasion importés est nul quand la première immatriculation précède le ${h.date(h.P.decote_import.zero_avant)}. Une essence de 7 CV de juin 2014 ne paie donc que la taxe régionale, réduite de moitié car elle a plus de dix ans, soit ${h.eur2(b.y1.y1)}, et le titre complet revient à ${h.eur2(b.total)}. Le quitus fiscal reste obligatoire.` },
        { q: 'Combien coûte la carte grise d’une électrique achetée au Luxembourg et immatriculée dans le Grand Est ?', a: `Pour une électrique de 6 CV de 2023, ${h.eur2(ve.total)} au ${h.date(op(h))}. Elle échappe au malus CO₂ et au malus au poids, mais pas à la taxe régionale, que le Grand Est applique en entier. Si la voiture a au plus ${h.num(h.P.tva_import.mois_max)} mois ou ${h.num(h.P.tva_import.km_max)} km, elle est neuve au sens de la TVA : la taxe se paie en France.` },
        { q: 'Que change un achat en Suisse pour une carte grise dans le Grand Est ?', a: `La Suisse n’est pas dans l’Union européenne. À la frontière, la douane perçoit en principe ${h.pct(h.P.douane.droit_voiture, 0)} de droits sur une voiture et ${h.pct(h.P.douane.tva, 0)} de TVA, puis remet le certificat 846 A, qui remplace le quitus fiscal. La carte grise suit ensuite les mêmes règles : tarif du Grand Est, malus avec décote selon l’âge.` },
        { q: 'Le Grand Est réduit-il la taxe pour les voitures de collection ?', a: `Non, aucune région ne le peut : la loi ne prévoit pas de tarif propre aux véhicules de collection. Seule la réduction de moitié après dix ans joue, ce qui couvre de fait tous les véhicules anciens. Une carte grise de collection évite en revanche la taxe sur les véhicules de transport, qui ne concerne de toute façon que les utilitaires.` },
      ];
    },
    body: (h) => {
      const t = h.M.tarifRegion(ID, op(h));
      const a = importe(h, CAS.recent), b = importe(h, CAS.ancien), ve = importe(h, CAS.ve);
      const imp = [
        ['Essence 7 CV, 140 g/km, 1 650 kg, 1re immatriculation mars 2022', h.eur2(a.y1.y1), `${h.eur(a.malus.total)} (décote ${h.pct(a.malus.decote, 0)})`, h.eur2(a.total)],
        ['Essence 7 CV, 150 g/km, juin 2014', h.eur2(b.y1.y1), h.eur(b.malus.total), h.eur2(b.total)],
        ['Électrique 6 CV, 1 900 kg, septembre 2023', h.eur2(ve.y1.y1), h.eur(ve.malus.total), h.eur2(ve.total)],
      ];
      const cvs = [5, 7, 9, 11];
      const rows = cvs.map((cv) => [`${cv} CV`, h.eur2(revente(h, cv).y1.y1), h.eur2(revente(h, cv, true).y1.y1), h.eur2(revente(h, cv).total)]);
      return `
<h2>Le tarif et ses sources</h2>
<p>Le Grand Est est au plafond fixé par le ${h.src('cibs', 'code des impositions sur les biens et services')}, ${h.eur2(h.P.regional.plafond_cv)} par cheval, et ne peut donc plus le relever. Le montant provient du ${h.src('prixcv', 'simulateur officiel du prix du cheval fiscal')}. La date d’effet indiquée, le ${h.date(t.from!)}, n’a été vue que dans des sources secondaires ; aucune délibération du conseil régional n’a été retrouvée, et les tarifs antérieurs ne sont pas repris. Aucune hausse n’est annoncée pour 2027, ce qui serait de toute façon impossible au-delà du plafond.</p>

<h2>Revente entre particuliers</h2>
${h.table(['Puissance', 'Taxe régionale, moins de 10 ans', 'Taxe régionale, 10 ans ou plus', 'Titre complet, moins de 10 ans'], rows, `Grand Est, changement de titulaire au ${h.date(op(h))}.`, ['l', 'r', 'r', 'r'])}
<p>Taxe fixe et redevance ajoutent ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} à la taxe régionale. Ni malus ni taxe d’utilitaire pour une voiture déjà immatriculée en France.</p>

<h2>Voitures achetées de l’autre côté de la frontière</h2>
<p>Strasbourg, Metz, Thionville ou Mulhouse sont à quelques minutes de l’Allemagne, du Luxembourg, de la Belgique ou de la Suisse. Une voiture qui n’a jamais été immatriculée en France paie, en plus de la taxe régionale, le malus CO₂ et le malus au poids du barème de sa première immatriculation, diminués d’une ${h.src('l421_7_2', 'décote mensuelle selon l’âge')}.</p>
${h.table(['Véhicule importé d’un pays de l’Union', 'Taxe régionale', 'Malus', 'Titre complet'], imp, `Grand Est, immatriculation au ${h.date(op(h))}.`, ['l', 'r', 'r', 'r'])}
<p>Trois points à vérifier avant d’acheter :</p>
<ul>
<li>Dans l’Union européenne, un véhicule de ${h.num(h.P.tva_import.mois_max)} mois au plus ou de ${h.num(h.P.tva_import.km_max)} km au plus est neuf au sens de la TVA, qui se paie alors en France. Dans tous les cas, il faut le ${h.src('quitus', 'quitus fiscal')} avant la demande (${h.a('quitus-tva', 'quitus et TVA')}).</li>
<li>Pour la Suisse, hors Union, la ${h.src('douane', 'douane')} perçoit les droits et la TVA et délivre le certificat 846 A (${h.a('import-hors-europe', 'import hors Union')}).</li>
<li>La puissance fiscale française se lit en case P.6 une fois le titre établi ; sur un certificat étranger, elle peut être différente ou absente.</li>
</ul>
<p>Le détail pas à pas d’un achat dans un pays voisin se trouve sur la page ${h.a('import-europe', 'véhicule importé d’Europe')}.</p>
`;
    },
  },
  en: {
    slug: 'region/grand-est',
    nav: 'Grand Est',
    card: 'A regional rate at the cap, and what you pay for a car brought in from Germany, Luxembourg, Belgium or Switzerland.',
    title: 'Grand Est car registration 2026: €60 per CV and imports',
    description: 'Grand Est car registration in 2026: €60 per fiscal horsepower, the legal cap, with worked examples for cars bought in Germany, Luxembourg or Switzerland.',
    h1: 'Registering a car in Grand Est in 2026',
    intro: 'The calculator uses the Grand Est rate; for a car bought abroad, choose the “imported” origin so the malus is added with its age reduction.',
    resume: (h) => {
      const t = h.M.tarifRegion(ID, op(h));
      const rg = rangGE(h);
      const a = importe(h, CAS.recent);
      return `Grand Est, the north-eastern region around Strasbourg, Metz, Nancy and Reims, charges ${h.eur2(t.cv)} per fiscal horsepower, the “cheval fiscal” behind the regional tax on a French registration certificate. That is the legal maximum. The State’s official simulator confirms the amount on ${h.date(op(h))}; the start date of ${h.date(t.from!)} often quoted could not be verified, because no regional resolution was found. The region ranks ${rg.rang === 2 ? 'second' : h.num(rg.rang)} of ${h.num(rg.total)}, level with ${h.num(rg.avec)} others, just behind Île-de-France. A 7 CV diesel under ten years old changing hands costs ${h.eur2(revente(h, 7).total)} to register. With four foreign neighbours, Grand Est sees many cars bought abroad: a 7 CV petrol car first registered in Germany in March 2022 costs ${h.eur2(a.total)} here, including ${h.eur(a.malus.total)} of malus after the age reduction. Cars ten years or older pay half the rate, and the malus is zero for imports first registered before ${h.date(h.P.decote_import.zero_avant)}. Electric cars pay the full rate.`;
    },
    faqs: (h) => {
      const b = importe(h, CAS.ancien);
      const ve = importe(h, CAS.ve);
      return [
        { q: 'Does a 2014 car brought from Germany to Grand Est pay the malus?', a: `No. Used imports first registered before ${h.date(h.P.decote_import.zero_avant)} owe no CO₂ or weight malus. A 7 CV petrol car from June 2014 pays only the regional tax, halved because it is over ten years old: ${h.eur2(b.y1.y1)}, or ${h.eur2(b.total)} for the full certificate. You still need the quitus fiscal, a free tax clearance from the French tax office.` },
        { q: 'What does an electric car bought in Luxembourg cost to register in Grand Est?', a: `A 6 CV electric car from 2023 costs ${h.eur2(ve.total)} on ${h.date(op(h))}. It escapes both malus taxes but not the regional tax, which Grand Est charges in full. If the car is no more than ${h.num(h.P.tva_import.mois_max)} months old or has no more than ${h.num(h.P.tva_import.km_max)} km, it counts as new for VAT, which is then paid in France.` },
        { q: 'How does buying in Switzerland change registration in Grand Est?', a: `Switzerland is outside the EU, so customs normally collect ${h.pct(h.P.douane.droit_voiture, 0)} duty on a car and ${h.pct(h.P.douane.tva, 0)} VAT at the border, then issue form 846 A, which replaces the quitus fiscal. Registration then follows the usual rules: the Grand Est rate, plus the malus reduced according to the car’s age.` },
        { q: 'Is there a lower Grand Est rate for classic cars?', a: 'No. French law gives regions no separate rate for classic cars, so only the general halving at ten years applies, which in practice covers every older vehicle. A classic car registration does avoid the transport vehicle tax, though that tax only concerns vans and lorries in the first place, so a private classic car owner saves nothing extra.' },
      ];
    },
    body: (h) => {
      const t = h.M.tarifRegion(ID, op(h));
      const a = importe(h, CAS.recent), b = importe(h, CAS.ancien), ve = importe(h, CAS.ve);
      const imp = [
        ['Petrol 7 CV, 140 g/km, 1,650 kg, first registered March 2022', h.eur2(a.y1.y1), `${h.eur(a.malus.total)} (reduction ${h.pct(a.malus.decote, 0)})`, h.eur2(a.total)],
        ['Petrol 7 CV, 150 g/km, June 2014', h.eur2(b.y1.y1), h.eur(b.malus.total), h.eur2(b.total)],
        ['Electric 6 CV, 1,900 kg, September 2023', h.eur2(ve.y1.y1), h.eur(ve.malus.total), h.eur2(ve.total)],
      ];
      const cvs = [5, 7, 9, 11];
      const rows = cvs.map((cv) => [`${cv} CV`, h.eur2(revente(h, cv).y1.y1), h.eur2(revente(h, cv, true).y1.y1), h.eur2(revente(h, cv).total)]);
      return `
<h2>The rate and where it comes from</h2>
<p>Grand Est sits at the ${h.eur2(h.P.regional.plafond_cv)} cap set by the ${h.src('cibs', 'French tax code')}, so it cannot raise its rate. The amount comes from the ${h.src('prixcv', 'official fiscal horsepower price simulator')}. The start date of ${h.date(t.from!)} has only been seen in secondary sources; no regional council resolution was found, and earlier rates are not listed. No increase is planned for 2027, and none is possible above the cap.</p>

<h2>Private sales within France</h2>
${h.table(['Power', 'Regional tax, under 10 years', 'Regional tax, 10 years or more', 'Full certificate, under 10 years'], rows, `Grand Est, change of keeper on ${h.date(op(h))}.`, ['l', 'r', 'r', 'r'])}
<p>National charges add ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} to the regional tax. A car already registered in France owes no malus.</p>

<h2>Cars bought across the border</h2>
<p>Strasbourg, Metz or Mulhouse are minutes from Germany, Luxembourg, Belgium or Switzerland. A car never registered in France pays, on top of the regional tax, the CO₂ and weight malus from the scale of its first registration year, cut by a ${h.src('l421_7_2', 'monthly age reduction')}.</p>
${h.table(['Vehicle imported from an EU country', 'Regional tax', 'Malus', 'Full certificate'], imp, `Grand Est, registration on ${h.date(op(h))}.`, ['l', 'r', 'r', 'r'])}
<ul>
<li>Within the EU, a vehicle of no more than ${h.num(h.P.tva_import.mois_max)} months or ${h.num(h.P.tva_import.km_max)} km counts as new for VAT, payable in France. Either way, get the ${h.src('quitus', 'quitus fiscal')} before applying (${h.a('quitus-tva', 'VAT clearance')}).</li>
<li>From Switzerland, outside the EU, ${h.src('douane', 'French customs')} collect duty and VAT and issue form 846 A (${h.a('import-hors-europe', 'imports from outside the EU')}).</li>
<li>The French fiscal horsepower appears in box P.6 once the certificate is issued; a foreign document may show a different figure or none.</li>
</ul>
<p>For the full step-by-step, see ${h.a('import-europe', 'importing a car from the EU')}.</p>
`;
    },
  },
});
