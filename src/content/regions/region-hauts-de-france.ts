import { defineGuide, type Helpers } from '../../lib/guide-types';

const ID = 'hauts-de-france';
const jour = (h: Helpers) => h.P.regional.date_releve;
const reg = (h: Helpers) => h.P.regions.find((r) => r.id === ID)!;

/** Coût d'un changement de titulaire d'une voiture d'occasion française dans la région. */
const titre = (h: Helpers, cv: number, o: { vieux?: boolean; energie?: 'essence' | 'electrique'; date?: string } = {}) =>
  h.M.coutCarteGrise({
    cv, region: ID, date1re: o.vieux ? '2013-04-01' : '2023-04-01', dateOp: o.date ?? jour(h),
    energie: o.energie ?? 'essence', demarche: 'titulaire', genre: 'vp', origine: 'france_occasion', gkm: 0, masseKg: 0, ptacKg: 0,
  });

/** Place de la région dans le classement national, du tarif le plus cher au moins cher. */
const place = (h: Helpers) => {
  const d = jour(h);
  const tot = (r: (typeof h.P.regions)[number]) => h.M.tarifRegion(r.id, d).cv + (r.idfm ? h.M.majorationIdfm(d) : 0);
  const moi = tot(reg(h));
  const plus = h.P.regions.filter((r) => tot(r) > moi).length;
  const egaux = h.P.regions.filter((r) => r.id !== ID && tot(r) === moi);
  return { rang: plus + 1, n: h.P.regions.length, egaux, moins: h.P.regions.length - plus - egaux.length - 1 };
};
/** Écart relatif avec le tarif francilien, majoration comprise. */
const ecart = (h: Helpers) => { const d = jour(h); return 1 - h.M.tarifRegion(ID, d).cv / (h.M.tarifRegion('ile-de-france', d).cv + h.M.majorationIdfm(d)); };
const ordEn = (n: number) => `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'}`;

export default defineGuide({
  id: 'region-hauts-de-france',
  group: 'regions',
  order: 70,
  tool: 'cout',
  region: ID,
  related: ['electrique-hybride', 'comparer-regions', 'tarif-cheval-fiscal', 'region-normandie', 'region-ile-de-france', 'dix-ans'],
  sources: ['delib_hdf', 'prixcv', 'a18021', 'a18244', 'cibs'],
  fr: {
    slug: 'region/hauts-de-france',
    nav: 'Hauts-de-France',
    card: 'Le tarif du cheval fiscal, l’exception des voitures électriques à moitié prix et le calcul pour Lille, Amiens ou Calais.',
    title: 'Carte grise Hauts-de-France 2026 : 43 € par cheval',
    description: 'Carte grise dans les Hauts-de-France en 2026 : 43 € par cheval fiscal depuis le 1er avril, voitures électriques à moitié prix, exemples chiffrés selon vos CV.',
    h1: 'Immatriculer sa voiture dans les Hauts-de-France en 2026',
    intro: 'Le simulateur ci-dessus part du tarif des Hauts-de-France : indiquez la puissance, l’énergie et l’âge du véhicule pour obtenir le montant exact du titre.',
    resume: (h) => {
      const r = reg(h), d = jour(h);
      const t = h.M.tarifRegion(ID, d);
      const avant = r.tarifs[0];
      const [p0, p1] = r.propres;
      const pl = place(h);
      return `Dans les Hauts-de-France, le cheval fiscal coûte ${h.eur2(t.cv)} depuis le ${h.date(t.from!)}, après ${h.eur2(avant.cv)} appliqués à partir du ${h.date(avant.from!)} ; ces deux dates d’effet sont confirmées par le simulateur de coût de l’État. La région se classe ${h.num(pl.rang)}e sur ${h.num(pl.n)} en partant du tarif le plus élevé, ex aequo avec ${pl.egaux.map((x) => x.nom.fr).join(' et ')}, et reste nettement sous le plafond légal de ${h.eur2(h.P.regional.plafond_cv)}. Pour une voiture essence de 6 CV de moins de dix ans, la taxe régionale atteint ${h.eur(titre(h, 6).y1.y1)} et le certificat complet ${h.eur2(titre(h, 6).total)}, taxe fixe et redevance comprises. Elle est la seule région à réduire la taxe des véhicules électriques et à hydrogène : ils ne paient que ${h.pct(1 - p1.exo, 0)} du tarif depuis le ${h.date(p1.from)}, après une exonération totale du ${h.date(p0.from)} au ${h.date(p0.to!)}. Une voiture d’au moins dix ans, comme une moto, paie la moitié du tarif.`;
    },
    faqs: (h) => {
      const r = reg(h);
      const [p0, p1] = r.propres;
      const ve7 = titre(h, 7, { energie: 'electrique' });
      return [
        { q: 'Une voiture électrique immatriculée dans les Hauts-de-France est-elle encore exonérée ?', a: `Plus entièrement. L’exonération totale a couru du ${h.date(p0.from)} au ${h.date(p0.to!)}. Depuis le ${h.date(p1.from)}, la région retire ${h.pct(p1.exo, 0)} de sa taxe pour les véhicules électriques et à hydrogène. Une électrique de 7 CV de moins de dix ans paie ainsi ${h.eur2(ve7.y1.y1)} de taxe régionale, soit ${h.eur2(ve7.total)} pour le titre entier. Les hybrides, même rechargeables, paient le plein tarif.` },
        { q: 'Pourquoi le prix du cheval a-t-il augmenté dans les Hauts-de-France en 2026 ?', a: `Le rapport du budget primitif 2026 de la région propose de revaloriser le tarif de ${h.eur(r.tarifs[1].cv - r.tarifs[0].cv)} par cheval et, dans le même mouvement, de ramener l’exonération des véhicules propres à ${h.pct(p1.exo, 0)}. Le tarif est ainsi passé de ${h.eur2(r.tarifs[0].cv)} à ${h.eur2(r.tarifs[1].cv)} le ${h.date(r.tarifs[1].from!)}. Une hausse modeste comparée à d’autres régions, qui ont rejoint le plafond.` },
        { q: 'J’achète ma voiture en Belgique et j’habite à Lille : quel tarif pour la carte grise dans les Hauts-de-France ?', a: `Celui des Hauts-de-France, puisque c’est le domicile du titulaire qui fixe la taxe régionale. Avant la demande, demandez aussi au centre des finances publiques le quitus fiscal, qui ne coûte rien. Si la voiture n’a jamais été immatriculée en France, le malus CO₂ et le malus au poids s’appliquent avec la décote mensuelle prévue pour les occasions importées.` },
        { q: 'Une voiture de dix ans paie-t-elle moins cher dans les Hauts-de-France ?', a: `Oui, comme partout : quand la première immatriculation, même à l’étranger, remonte à dix ans ou plus, le tarif est divisé par deux. Une voiture de 6 CV passe de ${h.eur(titre(h, 6).y1.y1)} à ${h.eur2(titre(h, 6, { vieux: true }).y1.y1)} de taxe régionale. La date à regarder est en case B de la carte grise, pas l’année du modèle.` },
      ];
    },
    body: (h) => {
      const r = reg(h), d = jour(h);
      const [p0, p1] = r.propres;
      const pl = place(h);
      const cvs = [4, 6, 8, 11];
      const rows = cvs.map((cv) => [`${cv} CV`, h.eur2(titre(h, cv).y1.y1), h.eur2(titre(h, cv, { vieux: true }).y1.y1), h.eur2(titre(h, cv, { energie: 'electrique' }).y1.y1), h.eur2(titre(h, cv).total)]);
      const avantAvril = p0.to!;
      const ve5Mars = titre(h, 5, { energie: 'electrique', date: avantAvril });
      const ve5 = titre(h, 5, { energie: 'electrique' });
      return `
<h2>Deux hausses depuis 2025</h2>
<p>La région a changé son tarif à deux reprises. Le ${h.date(r.tarifs[0].from!)}, il est passé à ${h.eur2(r.tarifs[0].cv)} par cheval ; le ${h.date(r.tarifs[1].from!)}, à ${h.eur2(r.tarifs[1].cv)}. Ces deux dates figurent dans le simulateur de coût de l’État, qui sert de référence ici. Le document régional lu est le ${h.src('delib_hdf', 'rapport du budget primitif 2026')}, qui annonce la hausse de ${h.eur(r.tarifs[1].cv - r.tarifs[0].cv)} et la baisse de l’exonération ; le texte de la délibération elle-même n’a pas été retrouvé en ligne. Aucune nouvelle hausse n’est votée pour 2027 à la date du relevé.</p>
<p>Avec ${h.eur2(r.tarifs[1].cv)}, la région occupe la ${h.num(pl.rang)}e place sur ${h.num(pl.n)} : ${h.num(pl.rang - 1)} régions font payer davantage et ${h.num(pl.moins)} moins. Un automobiliste qui déménage de Paris vers Lille ou Arras paie ${h.pct(ecart(h), 0)} de moins par cheval qu’en ${h.a('region-ile-de-france', 'Île-de-France')}, où s’ajoute la majoration des transports franciliens.</p>

<h2>Exemples pour une voiture d’occasion</h2>
<p>Le tableau donne la taxe régionale d’une voiture qui change de propriétaire au ${h.date(d)}, puis le coût total du titre pour une thermique de moins de dix ans. La colonne électrique tient compte de la réduction de ${h.pct(p1.exo, 0)}.</p>
${h.table(['Puissance', 'Thermique, moins de 10 ans', 'Thermique, 10 ans ou plus', 'Électrique, moins de 10 ans', 'Titre complet, thermique récente'], rows, `Hauts-de-France, tarifs au ${h.date(d)}.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Pour passer de la taxe régionale au total, comptez ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} de plus (lignes Y4 et Y5, identiques partout). Pour une voiture neuve ou importée, le malus CO₂ et le malus au poids viennent en plus ; le simulateur en haut de page les calcule.</p>

<h2>Le cas des électriques, propre à la région</h2>
<p>Depuis la réforme entrée en vigueur au ${h.date(p0.from)}, une région peut réduire de moitié ou supprimer sa taxe pour les véhicules électriques et à hydrogène, et plus pour le GPL ou le superéthanol (${h.src('a18244', 'actualité de service-public.gouv.fr')}). Toutes les autres régions ont choisi le plein tarif. Les Hauts-de-France ont d’abord tout exonéré, puis réduit l’avantage de moitié :</p>
<ul>
<li>du ${h.date(p0.from)} au ${h.date(avantAvril)} : électrique de 5 CV à ${h.eur2(ve5Mars.y1.y1)} de taxe régionale, titre à ${h.eur2(ve5Mars.total)} ;</li>
<li>depuis le ${h.date(p1.from)} : même voiture à ${h.eur2(ve5.y1.y1)} de taxe régionale, titre à ${h.eur2(ve5.total)}.</li>
</ul>
<p>Une précision sur les sources : l’annexe d’une délibération de 2025 proposait de ne plus exonérer du tout dès le ${h.date(r.tarifs[0].from!)}, alors que l’État affiche une exonération totale jusqu’au ${h.date(avantAvril)}. Le simulateur suit la version de l’État, confirmée par l’${h.src('a18021', 'actualité du 26 février 2026')}.</p>

<h2>Ce qui ne dépend pas de la région</h2>
<p>La réduction de moitié à dix ans, le demi-tarif des motos et la gratuité de la taxe régionale pour les cyclomoteurs viennent du ${h.src('cibs', 'code des impositions sur les biens et services')} et s’appliquent ici comme ailleurs. Un changement d’adresse, un duplicata ou l’ajout d’un conjoint ne déclenchent pas la taxe régionale. Pour placer la région face aux autres sur le coût total, ouvrez le ${h.a('comparer-regions', 'comparateur des régions')} ; pour un modèle électrique ou hybride, la page ${h.a('electrique-hybride', 'voiture électrique ou hybride')} détaille les malus.</p>
`;
    },
  },
  en: {
    slug: 'region/hauts-de-france',
    nav: 'Hauts-de-France',
    card: 'The fiscal horsepower rate, the half-price rule for electric cars and the figures for Lille, Amiens or Calais.',
    title: 'Hauts-de-France car registration 2026: €43 per CV rate',
    description: 'Hauts-de-France car registration in 2026: €43 per fiscal horsepower since 1 April, half rate for electric cars, and worked examples for your vehicle’s power.',
    h1: 'Registering a car in Hauts-de-France in 2026',
    intro: 'The calculator above starts from the Hauts-de-France rate: enter the power, fuel and age of the vehicle to get the exact cost of the certificate.',
    resume: (h) => {
      const r = reg(h), d = jour(h);
      const t = h.M.tarifRegion(ID, d);
      const [p0, p1] = r.propres;
      const pl = place(h);
      return `Hauts-de-France, the northern region around Lille, Amiens and the Channel ports, charges ${h.eur2(t.cv)} per fiscal horsepower (the “cheval fiscal”, the CV figure in box P.6 of the French registration certificate, or “carte grise”) since ${h.date(t.from!)}. It charged ${h.eur2(r.tarifs[0].cv)} from ${h.date(r.tarifs[0].from!)}; both start dates appear in the State’s own cost simulator. That puts the region ${ordEn(pl.rang)} out of ${h.num(pl.n)} from the most expensive, level with ${pl.egaux.map((x) => x.nom.en).join(' and ')}, and well below the legal cap of ${h.eur2(h.P.regional.plafond_cv)}. A petrol car rated 6 CV and under ten years old pays ${h.eur(titre(h, 6).y1.y1)} in regional tax and ${h.eur2(titre(h, 6).total)} for the whole certificate. No other region gives electric and hydrogen vehicles a discount: here they pay ${h.pct(1 - p1.exo, 0)} of the rate since ${h.date(p1.from)}, after paying nothing between ${h.date(p0.from)} and ${h.date(p0.to!)}. Cars aged ten years or more, and motorbikes, pay half.`;
    },
    faqs: (h) => {
      const r = reg(h);
      const [p0, p1] = r.propres;
      const ve8 = titre(h, 8, { energie: 'electrique' });
      return [
        { q: 'How much does an electric car pay to register in Hauts-de-France?', a: `Half the regional rate since ${h.date(p1.from)}. An electric car rated 8 CV and under ten years old pays ${h.eur2(ve8.y1.y1)} in regional tax and ${h.eur2(ve8.total)} for the certificate. Between ${h.date(p0.from)} and ${h.date(p0.to!)} the regional tax was zero. Plug-in and self-charging hybrids do not qualify and pay the full rate, as do LPG and E85 cars.` },
        { q: 'I live near Dunkirk and bought a car in Belgium: which rate applies in Hauts-de-France?', a: 'The Hauts-de-France rate, because the regional tax follows the new keeper’s home address, not the place of purchase. Before applying through ANTS, the French registration agency, you need a quitus fiscal, a free tax clearance from the local tax office. A car never registered in France also owes the CO₂ and weight malus, reduced month by month for used imports.' },
        { q: 'Did Hauts-de-France raise its rate for 2026?', a: `Yes, by ${h.eur(r.tarifs[1].cv - r.tarifs[0].cv)} per horsepower: from ${h.eur2(r.tarifs[0].cv)} to ${h.eur2(r.tarifs[1].cv)} on ${h.date(r.tarifs[1].from!)}. The region’s 2026 budget report paired that rise with cutting the electric vehicle exemption to ${h.pct(p1.exo, 0)}. No change has been voted for 2027 so far, so the current rate should still apply in January unless the regional council decides otherwise.` },
        { q: 'Does a ten-year-old car cost less to register in Hauts-de-France?', a: `Yes. Once the first registration, anywhere in the world, is ten years old or more, the regional tax is halved. For a 6 CV car that means ${h.eur2(titre(h, 6, { vieux: true }).y1.y1)} instead of ${h.eur(titre(h, 6).y1.y1)}. The relevant date is in box B of the certificate; the model year printed in an advert is not what counts.` },
      ];
    },
    body: (h) => {
      const r = reg(h), d = jour(h);
      const [p0, p1] = r.propres;
      const pl = place(h);
      const cvs = [4, 6, 8, 11];
      const rows = cvs.map((cv) => [`${cv} CV`, h.eur2(titre(h, cv).y1.y1), h.eur2(titre(h, cv, { vieux: true }).y1.y1), h.eur2(titre(h, cv, { energie: 'electrique' }).y1.y1), h.eur2(titre(h, cv).total)]);
      const ve5Before = titre(h, 5, { energie: 'electrique', date: p0.to! });
      const ve5 = titre(h, 5, { energie: 'electrique' });
      return `
<h2>How the rate has moved</h2>
<p>The region changed its rate twice since 2025: ${h.eur2(r.tarifs[0].cv)} per CV from ${h.date(r.tarifs[0].from!)}, then ${h.eur2(r.tarifs[1].cv)} from ${h.date(r.tarifs[1].from!)}. Both dates are confirmed by the State’s cost simulator. The regional document read for this page is the ${h.src('delib_hdf', '2026 budget report')}, which sets out the ${h.eur(r.tarifs[1].cv - r.tarifs[0].cv)} rise and the smaller electric discount; the resolution itself could not be found online. Nothing has been voted for 2027 as of the survey date.</p>
<p>At ${h.eur2(r.tarifs[1].cv)}, the region ranks ${ordEn(pl.rang)} of ${h.num(pl.n)}: ${h.num(pl.rang - 1)} regions charge more, ${h.num(pl.moins)} charge less. Someone moving from Paris to Lille pays ${h.pct(ecart(h), 0)} less per horsepower than in ${h.a('region-ile-de-france', 'Île-de-France')}, where the transport surcharge comes on top.</p>

<h2>Worked examples</h2>
<p>Regional tax for a used car changing hands on ${h.date(d)}, and the full certificate cost for a recent petrol car. The electric column applies the ${h.pct(p1.exo, 0)} reduction.</p>
${h.table(['Power', 'Petrol, under 10 years', 'Petrol, 10 years or more', 'Electric, under 10 years', 'Full certificate, recent petrol'], rows, `Hauts-de-France, rates on ${h.date(d)}.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Lines Y4 and Y5, the same in every region, add ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} to the regional tax to give the total. A new or imported car may also owe the CO₂ and weight malus, which the calculator at the top adds automatically.</p>

<h2>Electric cars: the regional exception</h2>
<p>Since ${h.date(p0.from)}, French law lets each region halve or scrap its tax for electric and hydrogen vehicles, while the old option for LPG and E85 is gone (${h.src('a18244', 'service-public.gouv.fr news item')}). Every other region chose the full rate. Hauts-de-France first exempted these vehicles entirely, then halved the benefit:</p>
<ul>
<li>until ${h.date(p0.to!)}: a 5 CV electric car paid ${h.eur2(ve5Before.y1.y1)} in regional tax, ${h.eur2(ve5Before.total)} in all;</li>
<li>since ${h.date(p1.from)}: the same car pays ${h.eur2(ve5.y1.y1)} in regional tax, ${h.eur2(ve5.total)} in all.</li>
</ul>
<p>One inconsistency in the record: an annex to a 2025 regional resolution proposed ending the exemption from ${h.date(r.tarifs[0].from!)}, whereas the State shows a full exemption until ${h.date(p0.to!)}. The calculator follows the State’s figures, also stated in its ${h.src('a18021', 'news item of 26 February 2026')}.</p>

<h2>Rules set nationally</h2>
<p>Halving at ten years, the half rate for motorbikes and the zero rate for mopeds come from the ${h.src('cibs', 'French tax code')} and apply here unchanged. An address change, a duplicate or adding a spouse does not trigger the regional tax. To see how the total compares with other regions, use the ${h.a('comparer-regions', 'region comparison')}; for malus rules on electric and hybrid models, see ${h.a('electrique-hybride', 'electric and hybrid cars')}.</p>
`;
    },
  },
});
