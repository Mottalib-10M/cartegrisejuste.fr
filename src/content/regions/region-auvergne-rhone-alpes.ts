import { defineGuide, type Helpers } from '../../lib/guide-types';

const ID = 'auvergne-rhone-alpes';
const VOISINES = ['bourgogne-franche-comte', 'centre-val-de-loire', 'nouvelle-aquitaine', 'occitanie', 'provence-alpes-cote-dazur'];
const dRel = (h: Helpers) => h.P.regional.date_releve;
const nomR = (h: Helpers, id: string) => h.P.regions.find((r) => r.id === id)!.nom[h.lang];
const prixCv = (h: Helpers, id: string) => {
  const d = dRel(h);
  return h.M.tarifRegion(id, d).cv + (h.P.regions.find((r) => r.id === id)!.idfm ? h.M.majorationIdfm(d) : 0);
};
const position = (h: Helpers) => {
  const v = prixCv(h, ID);
  const tous = h.P.regions.map((r) => prixCv(h, r.id));
  const metro = h.P.regions.filter((r) => !r.om).map((r) => prixCv(h, r.id));
  return {
    pos: 1 + tous.filter((x) => x > v).length,
    n: tous.length,
    ex: h.P.regions.filter((r) => r.id !== ID && prixCv(h, r.id) === v).map((r) => r.nom[h.lang]),
    moinsCherMetro: metro.every((x) => x >= v),
    plusBas: Math.min(...tous),
  };
};
const occasion = (h: Helpers, cv: number, date1re: string, region = ID, energie: 'essence' | 'electrique' = 'essence') =>
  h.M.coutCarteGrise({ cv, region, date1re, dateOp: dRel(h), energie, demarche: 'titulaire', genre: 'vp', origine: 'france_occasion', gkm: 0, masseKg: 0, ptacKg: 0 });
const NEUVE = '2023-11-03';
const AGEE = '2012-07-18';

export default defineGuide({
  id: 'region-auvergne-rhone-alpes',
  group: 'regions',
  order: 10,
  tool: 'cout',
  region: ID,
  related: ['comparer-regions', 'region-hauts-de-france', 'region-occitanie', 'tarif-cheval-fiscal', 'electrique-hybride'],
  sources: ['prixcv', 'a18021', 'cibs', 'a18244'],
  fr: {
    slug: 'region/auvergne-rhone-alpes',
    nav: 'Auvergne-Rhône-Alpes',
    card: 'Un des tarifs les plus bas de métropole : 43 € par cheval, comparé aux régions voisines.',
    title: 'Carte grise Auvergne-Rhône-Alpes 2026 : 43 € le cheval',
    description: 'Carte grise en Auvergne-Rhône-Alpes en 2026 : 43 € par cheval fiscal, ex aequo avec les Hauts-de-France pour le tarif le plus bas de métropole, exemples.',
    h1: '43 € le cheval fiscal : la carte grise auvergnate et rhônalpine en 2026',
    intro: 'Le simulateur est déjà placé sur Auvergne-Rhône-Alpes : indiquez la puissance en case P.6 et la date de première immatriculation pour obtenir le coût exact.',
    resume: (h) => {
      const d = dRel(h);
      const t = h.M.tarifRegion(ID, d);
      const p = position(h);
      const ex6 = occasion(h, 6, NEUVE);
      return `Au ${h.date(d)}, Auvergne-Rhône-Alpes fait payer ${h.eur2(t.cv)} par cheval fiscal, l’un des tarifs les plus faibles de France : seules les régions d’outre-mer descendent plus bas, et la région ${p.ex.join(', ')} applique le même montant en métropole. La région occupe ainsi la ${h.num(p.pos)}e place sur ${h.num(p.n)} en partant du tarif le plus cher. Ce montant est celui que publie le simulateur officiel de l’État ; la délibération régionale qui l’a fixé n’a pas été retrouvée, et sa date d’effet n’est pas vérifiée. Pour une voiture d’occasion de 6 CV de moins de dix ans, la taxe régionale s’élève à ${h.eur2(ex6.y1.y1)} et le certificat complet à ${h.eur2(ex6.total)}. Dans une région voisine au plafond de ${h.eur2(h.P.regional.plafond_cv)}, la même voiture coûterait ${h.eur2(occasion(h, 6, NEUVE, 'provence-alpes-cote-dazur').total)}. La réduction de moitié à dix ans s’applique ici comme ailleurs, et les voitures électriques paient le tarif normal.`;
    },
    faqs: (h) => {
      const d = dRel(h);
      const t = h.M.tarifRegion(ID, d);
      const hdf = 'hauts-de-france';
      return [
        { q: 'Pourquoi une voiture électrique coûte-t-elle moins cher à immatriculer dans les Hauts-de-France qu’en Auvergne-Rhône-Alpes, à tarif égal ?', a: `Les deux régions appliquent ${h.eur2(t.cv)} par cheval, mais seule la région ${nomR(h, hdf)} a voté une réduction de moitié pour les véhicules électriques et à hydrogène. Une électrique de 5 CV récente y paie ${h.eur2(occasion(h, 5, NEUVE, hdf, 'electrique').total)} de carte grise, contre ${h.eur2(occasion(h, 5, NEUVE, ID, 'electrique').total)} en Auvergne-Rhône-Alpes, qui n’accorde aucune remise.` },
        { q: 'Un habitant de Lyon peut-il faire sa carte grise dans une autre région pour payer moins ?', a: 'Non. Le tarif dépend du domicile habituel déclaré par le titulaire, quel que soit l’endroit où la démarche est faite ou le véhicule acheté. Déclarer une adresse où l’on ne vit pas constitue une fausse déclaration. Comme Auvergne-Rhône-Alpes figure parmi les régions les moins chères, un Lyonnais n’aurait de toute façon rien à gagner en métropole.' },
        { q: 'Le tarif d’Auvergne-Rhône-Alpes va-t-il changer en 2027 ?', a: `Aucune délibération modifiant le tarif de ${h.eur2(t.cv)} n’a été repérée au ${h.date(d)}. La région garde une marge importante sous le plafond de ${h.eur2(h.P.regional.plafond_cv)}, et un nouveau tarif voté s’appliquerait en général le premier jour du deuxième mois suivant le vote devenu exécutoire. Le simulateur sera mis à jour dès qu’une décision sera publiée.` },
        { q: 'Combien coûte la carte grise d’une voiture de 10 ans ou plus en Auvergne-Rhône-Alpes ?', a: `Elle bénéficie de la moitié du tarif régional : ${h.eur2(t.cv / 2)} par cheval. Une voiture de 7 CV dont la première immatriculation remonte à dix ans ou plus revient à ${h.eur2(occasion(h, 7, AGEE).total)} au total, contre ${h.eur2(occasion(h, 7, NEUVE).total)} pour la même voiture plus récente. Le seuil se compte en années révolues depuis la première immatriculation, même à l’étranger.` },
      ];
    },
    body: (h) => {
      const d = dRel(h);
      const t = h.M.tarifRegion(ID, d);
      const p = position(h);
      const rowsCv = [3, 5, 8, 11].map((cv) => [`${cv} CV`, h.eur2(occasion(h, cv, NEUVE).y1.y1), h.eur2(occasion(h, cv, NEUVE).total), h.eur2(occasion(h, cv, AGEE).total)]);
      const rowsVois = [...VOISINES]
        .sort((a, b) => prixCv(h, b) - prixCv(h, a) || nomR(h, a).localeCompare(nomR(h, b)))
        .map((id) => [nomR(h, id), h.eur2(prixCv(h, id)), h.eur2(occasion(h, 6, NEUVE, id).total), `+${h.eur2(occasion(h, 6, NEUVE, id).total - occasion(h, 6, NEUVE).total)}`]);
      return `
<h2>Un tarif bas, mais une source régionale introuvable</h2>
<p>Le montant de ${h.eur2(t.cv)} est celui que renvoie le ${h.src('prixcv', 'simulateur officiel du prix du cheval fiscal')} pour une adresse en Auvergne-Rhône-Alpes au ${h.date(d)}. Nous n’avons pas trouvé la délibération du conseil régional qui l’a fixé, ni de document permettant de dater son entrée en vigueur : la date d’effet reste donc inconnue. Des sites tiers indiquent que le tarif était déjà le même en 2025 ; nous n’avons pas pu le vérifier à une source primaire. L’${h.src('a18021', 'actualité de service-public.gouv.fr sur les tarifs 2026')} ne signale pas de hausse dans la région.</p>

<h2>Exemples pour une voiture d’occasion</h2>
${h.table(['Puissance', 'Taxe régionale, moins de 10 ans', 'Total, moins de 10 ans', 'Total, 10 ans ou plus'], rowsCv, `Auvergne-Rhône-Alpes, voiture essence ou diesel, changement de titulaire au ${h.date(d)}.`, ['l', 'r', 'r', 'r'])}
<p>Le total ajoute ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} de frais nationaux, identiques dans toute la France. Pour une voiture neuve ou importée, le malus CO₂ et le malus au poids peuvent dépasser de loin la part régionale : le ${h.a('home', 'calcul complet')} les ajoute.</p>

<h2>Face aux régions voisines</h2>
<p>Auvergne-Rhône-Alpes touche cinq régions de métropole. Toutes font payer davantage le cheval fiscal. Le tableau reprend une voiture de 6 CV de moins de dix ans achetée d’occasion, classée de la voisine la plus chère à la moins chère.</p>
${h.table(['Région voisine', '€ par CV', 'Titre 6 CV', 'Surcoût par rapport à Auvergne-Rhône-Alpes'], rowsVois, `Même voiture, même date, domicile dans la région indiquée.`, ['l', 'r', 'r', 'r'])}
<p>Ces écarts comptent pour qui déménage : c’est l’adresse au jour de la demande qui fixe le tarif. Une personne qui achète une voiture en Savoie mais habite Dijon paie le tarif de Bourgogne-Franche-Comté ; à l’inverse, un Dijonnais qui s’installe à Grenoble avant sa démarche paie celui d’Auvergne-Rhône-Alpes.</p>

<h2>Entreprises, flottes et location</h2>
<p>Une société paie le tarif de la région de l’établissement auquel le véhicule est affecté, pas celui de son siège. Pour un loueur de courte durée, la loi retient la région où le véhicule est mis à disposition pour la première fois. Une agence implantée à Clermont-Ferrand ou Saint-Étienne bénéficie donc du tarif de ${h.eur2(t.cv)}, et un véhicule affecté plus tard à une agence parisienne ne repaie pas la taxe tant qu’il ne change pas de titulaire.</p>

<h2>Électrique, GPL, superéthanol : aucune exception régionale</h2>
<p>Depuis 2025, seuls l’électrique et l’hydrogène peuvent recevoir une remise régionale, comme l’a rappelé l’${h.src('a18244', 'actualité de service-public.gouv.fr du printemps 2025')}. Auvergne-Rhône-Alpes n’en a pas voté : l’électrique paie ${h.eur2(t.cv)} par cheval, comme l’essence. Le GPL et le superéthanol ne peuvent plus être exonérés par une région. Au classement, la région est ${h.num(p.pos)}e sur ${h.num(p.n)}, et ${p.moinsCherMetro ? 'aucune région de métropole n’est moins chère' : 'quelques régions de métropole sont moins chères'} ; le tarif le plus bas de France, ${h.eur2(p.plusBas)}, se trouve outre-mer.</p>
`;
    },
  },
  en: {
    slug: 'region/auvergne-rhone-alpes',
    nav: 'Auvergne-Rhône-Alpes',
    card: 'One of the lowest rates in mainland France: €43 per CV, compared with the neighbouring regions.',
    title: 'Auvergne-Rhône-Alpes car registration 2026: €43 per CV',
    description: 'Registering a car in Auvergne-Rhône-Alpes in 2026: €43 per fiscal horsepower, joint lowest in mainland France with Hauts-de-France. Examples and regional gaps.',
    h1: 'Car registration in Auvergne-Rhône-Alpes: €43 per CV in 2026',
    intro: 'The calculator is already set to Auvergne-Rhône-Alpes: enter the horsepower from box P.6 and the first registration date to get the exact cost.',
    resume: (h) => {
      const d = dRel(h);
      const t = h.M.tarifRegion(ID, d);
      const p = position(h);
      const ex6 = occasion(h, 6, NEUVE);
      return `Auvergne-Rhône-Alpes, the region around Lyon, Grenoble, Clermont-Ferrand and the French Alps, charges ${h.eur2(t.cv)} per fiscal horsepower on ${h.date(d)}. The fiscal horsepower, cheval fiscal in French, is the CV figure in box P.6 of the registration certificate (carte grise), and the regional tax equals that figure times the rate. Only the overseas regions charge less, and ${p.ex.join(', ')} matches the figure in mainland France, which puts Auvergne-Rhône-Alpes at number ${h.num(p.pos)} of ${h.num(p.n)} counting from the dearest. The amount comes from the State’s official simulator; we could not find the regional resolution that set it, so its start date is unverified. A used 6 CV car under ten years old pays ${h.eur2(ex6.y1.y1)} of regional tax and ${h.eur2(ex6.total)} for the whole certificate, against ${h.eur2(occasion(h, 6, NEUVE, 'provence-alpes-cote-dazur').total)} in a neighbouring region at the ${h.eur2(h.P.regional.plafond_cv)} cap. The half rate at ten years applies, and electric cars pay the standard rate.`;
    },
    faqs: (h) => {
      const d = dRel(h);
      const t = h.M.tarifRegion(ID, d);
      return [
        { q: 'I am relocating to Lyon for work: what will registering my car in Auvergne-Rhône-Alpes cost?', a: `If you buy a used 7 CV car under ten years old, expect ${h.eur2(occasion(h, 7, NEUVE).total)}; an older one with a first registration ten or more years back costs ${h.eur2(occasion(h, 7, AGEE).total)}. Bringing a car from abroad also needs customs or tax clearance first, and possibly the national malus if it has never been registered in France.` },
        { q: 'Does Auvergne-Rhône-Alpes give electric cars a lower registration rate?', a: `No. The region has not used the legal option to halve or waive its rate for electric and hydrogen vehicles, so an electric car pays ${h.eur2(t.cv)} per CV like any other. Hauts-de-France has the same base rate but halves it for electric cars, the only region to do so on ${h.date(d)}. The national malus exemptions for electric cars still apply.` },
        { q: 'Is the Auvergne-Rhône-Alpes rate likely to rise in 2027?', a: `No vote changing it had been found on ${h.date(d)}. The region has room below the ${h.eur2(h.P.regional.plafond_cv)} ceiling, so a rise is legally possible. When a region votes a new rate, it usually applies from the first day of the second month after the decision becomes enforceable, which leaves time to see it coming.` },
      ];
    },
    body: (h) => {
      const d = dRel(h);
      const t = h.M.tarifRegion(ID, d);
      const rowsCv = [4, 6, 9, 12].map((cv) => [`${cv} CV`, h.eur2(occasion(h, cv, NEUVE).total), h.eur2(occasion(h, cv, AGEE).total)]);
      const rowsVois = [...VOISINES]
        .sort((a, b) => nomR(h, a).localeCompare(nomR(h, b)))
        .map((id) => [nomR(h, id), h.eur2(prixCv(h, id)), h.eur2(occasion(h, 9, NEUVE, id).total - occasion(h, 9, NEUVE).total)]);
      return `
<h2>Source and start date</h2>
<p>The rate of ${h.eur2(t.cv)} is what the ${h.src('prixcv', 'official fiscal horsepower simulator')} returns for an address in the region on ${h.date(d)}. We did not find the regional council resolution behind it, nor any document dating its entry into force. Third-party sites report the same figure for 2025, which we could not confirm at a primary source. The ${h.src('a18021', 'service-public.gouv.fr news item on 2026 rates')} mentions no increase here.</p>

<h2>Costs by horsepower</h2>
${h.table(['Horsepower', 'Certificate, under 10 years', 'Certificate, 10 years or more'], rowsCv, `Auvergne-Rhône-Alpes, used petrol or diesel car, change of keeper, on ${h.date(d)}.`, ['l', 'r', 'r'])}
<p>Totals include ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} of national charges paid everywhere in France. New and imported cars may also owe the CO₂ and weight malus, which the ${h.a('home', 'full calculation')} adds.</p>

<h2>Next door costs more</h2>
<p>All five mainland regions bordering Auvergne-Rhône-Alpes charge more per CV. For a 9 CV car under ten years old, the extra cost of living across the border is:</p>
${h.table(['Neighbouring region', 'Rate per CV', 'Extra for a 9 CV car'], rowsVois, 'Same car, same date, home address in the region shown.', ['l', 'r', 'r'])}
<p>What counts is your address on the day you apply, not where you buy. A car bought in Geneva or Turin by someone living in Annecy pays the Auvergne-Rhône-Alpes rate, after the import formalities.</p>

<h2>Companies and rental fleets</h2>
<p>A company pays the rate of the region where the vehicle’s site of assignment is, not its head office. Short-term rental firms pay the rate of the region where the vehicle is first made available to customers. That makes branches in this region cheaper to register vehicles through, legally, than branches in regions at the cap.</p>

<h2>Electric cars and alternative fuels</h2>
<p>Since 2025 only electric and hydrogen vehicles can receive a regional discount, as the ${h.src('a18244', 'service-public.gouv.fr news item from spring 2025')} explained; LPG and E85 no longer qualify anywhere. Auvergne-Rhône-Alpes grants none, so ${h.a('region-hauts-de-france', 'Hauts-de-France')} is cheaper for an electric car despite the identical base rate. The ${h.a('comparer-regions', 'region comparison')} shows this for your own vehicle.</p>
`;
    },
  },
});
