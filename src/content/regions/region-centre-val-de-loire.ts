import { defineGuide, type Helpers } from '../../lib/guide-types';
import type { Genre } from '../../lib/engine/carte-grise';

const ID = 'centre-val-de-loire';
const ce = (h: Helpers) => h.P.regional.date_releve;

/** Titre d'un véhicule d'occasion déjà immatriculé en France, au tarif de la région. */
const cg = (h: Helpers, cv: number, o: { genre?: Genre; ptac?: number; ancien?: boolean; region?: string } = {}) =>
  h.M.coutCarteGrise({ cv, region: o.region ?? ID, date1re: o.ancien ? '2015-02-01' : '2024-02-01', dateOp: ce(h), energie: 'diesel', demarche: 'titulaire', genre: o.genre ?? 'vp', origine: 'france_occasion', gkm: 0, masseKg: 0, ptacKg: o.ptac ?? 0 });
const PTAC_CTTE = 3500;
const pos = (h: Helpers) => {
  const v = (r: (typeof h.P.regions)[number]) => h.M.tarifRegion(r.id, ce(h)).cv + (r.idfm ? h.M.majorationIdfm(ce(h)) : 0);
  const moi = v(h.P.regions.find((r) => r.id === ID)!);
  return { rang: h.P.regions.filter((r) => v(r) > moi).length + 1, meme: h.P.regions.filter((r) => v(r) === moi).length, n: h.P.regions.length };
};

export default defineGuide({
  id: 'region-centre-val-de-loire',
  group: 'regions',
  order: 40,
  tool: 'cout',
  region: ID,
  related: ['utilitaire', 'camping-car', 'region-ile-de-france', 'comparer-regions', 'taxes-ou-frais'],
  sources: ['prixcv', 'cibs', 'a421_26', 'a18021', 'ants'],
  fr: {
    slug: 'region/centre-val-de-loire',
    nav: 'Centre-Val de Loire',
    card: 'Tarif au plafond, règle de l’établissement pour les flottes, et coût d’une camionnette à Orléans, Tours ou Chartres.',
    title: 'Carte grise Centre-Val de Loire 2026 : 60 € par cheval',
    description: 'Carte grise en Centre-Val de Loire en 2026 : 60 € par cheval fiscal. Voitures, camionnettes et flottes d’entreprise, avec la taxe utilitaire selon le PTAC.',
    h1: 'Tarifs 2026 de la carte grise pour la région Centre-Val de Loire',
    intro: 'Le simulateur part du tarif du Centre-Val de Loire ; pour une camionnette, choisissez le genre utilitaire et indiquez le PTAC (case F.2).',
    resume: (h) => {
      const t = h.M.tarifRegion(ID, ce(h));
      const p = pos(h);
      const v = cg(h, 6), u = cg(h, 8, { genre: 'utilitaire', ptac: PTAC_CTTE });
      return `Le Centre-Val de Loire facture ${h.eur2(t.cv)} par cheval fiscal, soit le plafond que la loi fixe pour la taxe régionale. Le simulateur officiel de l’État confirme ce montant au ${h.date(ce(h))}. Des sources secondaires datent son entrée en vigueur du ${h.date(t.from!)} ; faute d’avoir pu lire la délibération régionale, cette date n’est pas vérifiée. La région est l’une des ${h.num(p.meme)} au même tarif, à la ${h.num(p.rang)}e place nationale, devancée uniquement par l’Île-de-France et sa majoration transports. Pour une voiture de 6 CV de moins de dix ans, la taxe régionale atteint ${h.eur(v.y1.y1)} et le titre complet ${h.eur2(v.total)}. Une camionnette de 8 CV et de ${h.num(PTAC_CTTE)} kg de PTAC ajoute ${h.eur(u.y2)} de taxe sur les véhicules de transport, pour un total de ${h.eur2(u.total)}. Le tarif est divisé par deux à partir de dix ans et pour les motos. Aucune réduction n’est accordée aux véhicules électriques, qui paient le plein tarif.`;
    },
    faqs: (h) => {
      const u = cg(h, 7, { genre: 'utilitaire', ptac: PTAC_CTTE, ancien: true });
      const cc = cg(h, 9, { genre: 'camping_car' });
      return [
        { q: 'Mon entreprise est à Paris mais ses camionnettes roulent depuis Orléans : quel tarif en Centre-Val de Loire ?', a: `Pour une personne morale, la région compétente est celle de l’établissement auquel le véhicule est affecté, pas celle du siège. Si les camionnettes sont rattachées au site d’Orléans, elles paient ${h.eur2(h.M.tarifRegion(ID, ce(h)).cv)} par cheval et échappent à la majoration francilienne. L’adresse d’affectation figure sur le certificat et doit correspondre à un établissement réel.` },
        { q: 'Combien coûte la carte grise d’une camionnette de dix ans en Centre-Val de Loire ?', a: `Pour un utilitaire de 7 CV dont la première immatriculation date de plus de dix ans, la taxe régionale tombe de moitié, à ${h.eur2(u.y1.y1)}. La taxe sur les véhicules de transport ne bénéficie pas de cette réduction : ${h.eur(u.y2)} pour un PTAC jusqu’à ${h.num(PTAC_CTTE)} kg. Le titre complet revient à ${h.eur2(u.total)}.` },
        { q: 'Un camping-car paie-t-il la taxe utilitaire en Centre-Val de Loire ?', a: `Non. Classé véhicule automoteur spécialisé, le camping-car échappe à la taxe due par les véhicules de transport. Il paie la taxe régionale au tarif plein jusqu’à dix ans, puis la moitié. Un camping-car de 9 CV récent revient à ${h.eur2(cc.total)} en changement de titulaire, sans malus, puisqu’il est hors du champ des deux malus.` },
        { q: 'Les véhicules électriques d’une flotte sont-ils exonérés en Centre-Val de Loire ?', a: `Non. La région n’a pas voté la réduction que la loi lui permet pour les véhicules électriques et à hydrogène. Une voiture ou une camionnette électrique paie donc la taxe régionale au plein tarif, comme une diesel de même puissance. Seuls les Hauts-de-France appliquent aujourd’hui une réduction, de moitié.` },
      ];
    },
    body: (h) => {
      const t = h.M.tarifRegion(ID, ce(h));
      const cvs = [5, 7, 9];
      const rows = cvs.map((cv) => { const n = cg(h, cv, { genre: 'utilitaire', ptac: PTAC_CTTE }), a = cg(h, cv, { genre: 'utilitaire', ptac: PTAC_CTTE, ancien: true }); return [`${cv} CV`, h.eur2(n.y1.y1), h.eur(n.y2), h.eur2(n.total), h.eur2(a.total)]; });
      const y2rows = h.P.y2.bareme.map((b, i, arr) => [b.ptac_max === null ? `plus de ${h.num(arr[i - 1].ptac_max!)} kg` : i === 0 ? `jusqu’à ${h.num(b.ptac_max)} kg` : `de ${h.num(arr[i - 1].ptac_max! + 1)} à ${h.num(b.ptac_max)} kg`, h.eur(b.montant)]);
      const vp = [4, 6, 8].map((cv) => [`${cv} CV`, h.eur2(cg(h, cv).total), h.eur2(cg(h, cv, { ancien: true }).total)]);
      const idf = cg(h, 6, { region: 'ile-de-france' });
      return `
<h2>Le tarif régional, sans marge de hausse</h2>
<p>Avec ${h.eur2(t.cv)} par cheval, le Centre-Val de Loire est au plafond du ${h.src('cibs', 'code des impositions sur les biens et services')}. Ce montant est relevé dans le ${h.src('prixcv', 'simulateur officiel du prix du cheval fiscal')}. La date du ${h.date(t.from!)} n’a été recoupée qu’avec des sources non officielles, la délibération du conseil régional n’ayant pas été retrouvée ; les tarifs antérieurs ne sont pas cités pour cette raison. Rien n’est voté pour 2027.</p>

<h2>Voitures particulières</h2>
${h.table(['Puissance', 'Titre, moins de 10 ans', 'Titre, 10 ans ou plus'], vp, `Centre-Val de Loire, changement de titulaire au ${h.date(ce(h))}.`, ['l', 'r', 'r'])}
<p>Les totaux comprennent ${h.eur2(h.P.national.taxe_fixe)} de taxe fixe et ${h.eur2(h.P.national.redevance)} de redevance. Un habitant de Chartres ou de Dreux qui travaille en région parisienne paie le tarif de son domicile : pour une voiture de 6 CV, ${h.eur2(cg(h, 6).total)} au lieu de ${h.eur2(idf.total)} en ${h.a('region-ile-de-france', 'Île-de-France')}.</p>

<h2>Camionnettes et utilitaires</h2>
<p>Un utilitaire paie, en plus de la taxe régionale, la taxe sur les véhicules de transport, dont le montant dépend du poids total autorisé en charge (${h.src('a421_26', 'article A421-26')}) :</p>
${h.table(['PTAC (case F.2)', 'Taxe sur les véhicules de transport'], y2rows, 'Barème national, identique dans toutes les régions.', ['l', 'r'])}
<p>Pour une camionnette de ${h.num(PTAC_CTTE)} kg qui change de titulaire :</p>
${h.table(['Puissance', 'Taxe régionale', 'Taxe transport', 'Titre, moins de 10 ans', 'Titre, 10 ans ou plus'], rows, `Centre-Val de Loire, au ${h.date(ce(h))}.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Les camionnettes sont exemptées du malus CO₂ et du malus au poids depuis 2026. Les camions de plus de ${h.num(PTAC_CTTE)} kg paient la moitié du tarif régional quel que soit leur âge ; le simulateur de cette page vise les véhicules légers. Plus de détails sur la page ${h.a('utilitaire', 'utilitaire et camionnette')}.</p>

<h2>Flottes, location et adresse</h2>
<ul>
<li>Une société paie le tarif de la région de l’établissement d’affectation du véhicule, et non celui de son siège.</li>
<li>Un loueur de courte durée paie celui de la région où le véhicule est mis à disposition pour la première fois.</li>
<li>Le déménagement d’un établissement ne déclenche aucune taxe régionale : seule l’adresse du certificat change, via le ${h.src('ants', 'site de l’ANTS')}.</li>
<li>Électriques : plein tarif, aucune réduction n’ayant été votée (${h.src('a18021', 'service-public.gouv.fr')}).</li>
</ul>
<p>Un professionnel habilité peut faire la démarche contre des frais de service ; la page ${h.a('taxes-ou-frais', 'taxes ou frais de service')} distingue les deux.</p>
`;
    },
  },
  en: {
    slug: 'region/centre-val-de-loire',
    nav: 'Centre-Val de Loire',
    card: 'A rate at the cap, the branch rule for company fleets, and what a van costs to register in Orléans, Tours or Chartres.',
    title: 'Centre-Val de Loire car registration 2026: €60 per CV',
    description: 'Centre-Val de Loire car registration in 2026: €60 per fiscal horsepower. Cars, vans and company fleets, with the transport vehicle tax by gross weight.',
    h1: 'Registering a vehicle in Centre-Val de Loire in 2026',
    intro: 'The calculator starts from the Centre-Val de Loire rate; for a van, choose the commercial vehicle type and enter the gross weight from box F.2.',
    resume: (h) => {
      const t = h.M.tarifRegion(ID, ce(h));
      const p = pos(h);
      const v = cg(h, 6), u = cg(h, 8, { genre: 'utilitaire', ptac: PTAC_CTTE });
      return `Centre-Val de Loire, the Loire Valley region around Orléans, Tours, Blois and Chartres, charges ${h.eur2(t.cv)} per fiscal horsepower, the “cheval fiscal” behind the regional tax on a French registration certificate. That is the legal cap. The State’s official simulator confirms the amount on ${h.date(ce(h))}. Secondary sources date it from ${h.date(t.from!)}; as the regional resolution could not be read, that date is unverified. The region is one of ${h.num(p.meme)} on this rate, joint ${p.rang === 2 ? 'second' : h.num(p.rang)} nationally, behind only Île-de-France and its transport surcharge. A 6 CV car under ten years old pays ${h.eur(v.y1.y1)} in regional tax and ${h.eur2(v.total)} for the full certificate. An 8 CV van with a gross weight of ${h.num(PTAC_CTTE)} kg adds ${h.eur(u.y2)} of transport vehicle tax, for ${h.eur2(u.total)} in all. Vehicles aged ten or more and motorbikes pay half the rate. Electric vehicles get no reduction and pay the full rate.`;
    },
    faqs: (h) => {
      const u = cg(h, 9, { genre: 'utilitaire', ptac: PTAC_CTTE });
      const cc = cg(h, 9, { genre: 'camping_car', ancien: true });
      return [
        { q: 'Our company is based in Paris but runs its vans from Tours: which rate applies in Centre-Val de Loire?', a: `For a company, the relevant region is that of the branch the vehicle is assigned to, not the head office. Vans assigned to the Tours site pay ${h.eur2(h.M.tarifRegion(ID, ce(h)).cv)} per CV and avoid the Paris-region transport surcharge. The assignment address appears on the certificate and must be a genuine establishment of the company.` },
        { q: 'What does a 9 CV van cost to register in Centre-Val de Loire?', a: `A used 9 CV van under ten years old with a gross weight up to ${h.num(PTAC_CTTE)} kg pays ${h.eur2(u.y1.y1)} in regional tax plus ${h.eur(u.y2)} of transport vehicle tax, ${h.eur2(u.total)} in all. Once it is ten years old the regional tax halves, while the transport vehicle tax stays the same, because the age reduction only applies to the regional part.` },
        { q: 'Do motorhomes pay the van tax in Centre-Val de Loire?', a: `No. A motorhome is classed as a specialised vehicle and is outside the transport vehicle tax and both malus taxes. It pays the regional tax only, halved after ten years: an older 9 CV motorhome changing hands costs ${h.eur2(cc.total)}. That makes it cheaper to register than a van of the same power and age, which still owes the transport tax.` },
        { q: 'Are electric fleet vehicles exempt in Centre-Val de Loire?', a: 'No. French law allows regions to halve or scrap the tax for electric and hydrogen vehicles, but Centre-Val de Loire has not done so. Electric cars and vans therefore pay the regional tax at the full rate, like a diesel of the same rating. Only Hauts-de-France currently applies a reduction, of half, for these vehicles.' },
      ];
    },
    body: (h) => {
      const t = h.M.tarifRegion(ID, ce(h));
      const cvs = [5, 7, 9];
      const rows = cvs.map((cv) => { const n = cg(h, cv, { genre: 'utilitaire', ptac: PTAC_CTTE }), a = cg(h, cv, { genre: 'utilitaire', ptac: PTAC_CTTE, ancien: true }); return [`${cv} CV`, h.eur2(n.y1.y1), h.eur(n.y2), h.eur2(n.total), h.eur2(a.total)]; });
      const y2rows = h.P.y2.bareme.map((b, i, arr) => [b.ptac_max === null ? `over ${h.num(arr[i - 1].ptac_max!)} kg` : i === 0 ? `up to ${h.num(b.ptac_max)} kg` : `${h.num(arr[i - 1].ptac_max! + 1)} to ${h.num(b.ptac_max)} kg`, h.eur(b.montant)]);
      const vp = [4, 6, 8].map((cv) => [`${cv} CV`, h.eur2(cg(h, cv).total), h.eur2(cg(h, cv, { ancien: true }).total)]);
      const idf = cg(h, 6, { region: 'ile-de-france' });
      return `
<h2>A rate with no room to rise</h2>
<p>At ${h.eur2(t.cv)} per CV, Centre-Val de Loire is at the cap set by the ${h.src('cibs', 'French tax code')}. The amount is taken from the ${h.src('prixcv', 'official fiscal horsepower price simulator')}. The ${h.date(t.from!)} start date has only been cross-checked with unofficial sources, as the regional council resolution was not found; earlier rates are not quoted for that reason. Nothing has been voted for 2027.</p>

<h2>Private cars</h2>
${h.table(['Power', 'Certificate, under 10 years', 'Certificate, 10 years or more'], vp, `Centre-Val de Loire, change of keeper on ${h.date(ce(h))}.`, ['l', 'r', 'r'])}
<p>Totals include ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} of national charges. Someone living in Chartres and commuting to Paris pays the rate of their home: ${h.eur2(cg(h, 6).total)} for a 6 CV car, against ${h.eur2(idf.total)} in ${h.a('region-ile-de-france', 'Île-de-France')}.</p>

<h2>Vans and commercial vehicles</h2>
<p>A commercial vehicle pays the transport vehicle tax on top of the regional tax, set by gross vehicle weight (${h.src('a421_26', 'article A421-26')}):</p>
${h.table(['Gross weight (box F.2)', 'Transport vehicle tax'], y2rows, 'National scale, the same in every region.', ['l', 'r'])}
<p>For a ${h.num(PTAC_CTTE)} kg van changing hands:</p>
${h.table(['Power', 'Regional tax', 'Transport tax', 'Certificate, under 10 years', 'Certificate, 10 years or more'], rows, `Centre-Val de Loire, on ${h.date(ce(h))}.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Vans have been exempt from the CO₂ and weight malus since 2026. Lorries above ${h.num(PTAC_CTTE)} kg pay half the regional rate at any age; the calculator on this page is designed for light vehicles. See ${h.a('utilitaire', 'vans and commercial vehicles')} for details.</p>

<h2>Fleets, rental and addresses</h2>
<ul>
<li>A company pays the rate of the region of the branch the vehicle is assigned to, not its head office.</li>
<li>A short-term rental firm pays the rate of the region where the vehicle is first made available.</li>
<li>Moving a branch triggers no regional tax: only the address on the certificate changes, through the ${h.src('ants', 'ANTS website')}.</li>
<li>Electric vehicles: full rate, as no reduction has been voted (${h.src('a18021', 'service-public.gouv.fr')}).</li>
</ul>
<p>An approved professional can handle the paperwork for a service fee; the ${h.a('taxes-ou-frais', 'taxes vs service fees')} page explains the difference.</p>
`;
    },
  },
});
