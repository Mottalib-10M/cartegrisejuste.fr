import { defineGuide, type Helpers } from '../../lib/guide-types';
import type { Energie } from '../../lib/engine/carte-grise';

const HDF = 'hauts-de-france';
const hdf = (h: Helpers) => h.P.regions.find((r) => r.id === HDF)!;
/** Changement de titulaire d'une voiture de moins de 10 ans, au jour du relevé. */
const occasion = (h: Helpers, region: string, cv: number, energie: Energie, dateOp = h.P.regional.date_releve) =>
  h.M.coutCarteGrise({ demarche: 'titulaire', region, origine: 'france_occasion', energie, genre: 'vp', cv, date1re: '2024-01-01', dateOp, gkm: 0, masseKg: 0, ptacKg: 0 });
/** Première immatriculation d'une voiture neuve dans les Hauts-de-France. */
const neuve = (h: Helpers, o: { cv: number; energie: Energie; gkm: number; masseKg: number; autonomieKm?: number }, date = h.P.regional.date_releve) =>
  h.M.coutCarteGrise({ demarche: 'immat', origine: 'france_neuf', genre: 'vp', ptacKg: 0, region: HDF, date1re: date, dateOp: date, ...o });
const NEUVES = [
  { fr: 'Électrique, 2 100 kg', en: 'Electric, 2,100 kg', o: { cv: 6, energie: 'electrique' as Energie, gkm: 0, masseKg: 2100 } },
  { fr: 'Hybride rechargeable, 1 950 kg, 30 g/km, 70 km', en: 'Plug-in hybrid, 1,950 kg, 30 g/km, 70 km', o: { cv: 6, energie: 'hybride_rechargeable' as Energie, gkm: 30, masseKg: 1950, autonomieKm: 70 } },
  { fr: 'Hybride non rechargeable, 1 450 kg, 105 g/km', en: 'Full hybrid, 1,450 kg, 105 g/km', o: { cv: 6, energie: 'hybride' as Energie, gkm: 105, masseKg: 1450 } },
  { fr: 'Micro-hybride, 1 580 kg, 128 g/km', en: 'Mild hybrid, 1,580 kg, 128 g/km', o: { cv: 6, energie: 'micro_hybride' as Energie, gkm: 128, masseKg: 1580 } },
  { fr: 'Essence, 1 580 kg, 128 g/km', en: 'Petrol, 1,580 kg, 128 g/km', o: { cv: 6, energie: 'essence' as Energie, gkm: 128, masseKg: 1580 } },
];
const REG = ['hauts-de-france', 'ile-de-france', 'bretagne', 'auvergne-rhone-alpes', 'mayotte'];

export default defineGuide({
  id: 'electrique-hybride',
  group: 'situations',
  order: 50,
  mini: 'electrique',
  miniHref: 'comparer-regions',
  related: ['comparer-regions', 'region-hauts-de-france', 'malus-masse', 'voiture-neuve', 'calendrier-2027'],
  sources: ['a18244', 'a18021', 'delib_hdf', 'l421_79', 'lfi2026', 'f35950'],
  fr: {
    slug: 'voiture-electrique-hybride',
    nav: 'Électrique et hybride',
    card: 'Plein tarif partout sauf en Hauts-de-France, aucun malus pour l’électrique, abattements de masse des hybrides : la comparaison chiffrée.',
    title: 'Carte grise voiture électrique 2026 : tarif, malus, hybrides',
    description: 'Carte grise d’une électrique en 2026 : plein tarif dans 17 régions, moitié en Hauts-de-France depuis le 1er avril 2026, aucun malus ; hybrides et abattements.',
    h1: 'Carte grise d’une voiture électrique ou hybride en 2026',
    intro: 'Le mini-simulateur compare, dans la région choisie, la carte grise d’une même voiture d’occasion en version électrique, hybride rechargeable et essence.',
    resume: (h) => {
      const r = hdf(h);
      const ev = occasion(h, HDF, 6, 'electrique'), th = occasion(h, HDF, 6, 'essence');
      const nb = h.P.regions.filter((x) => x.propres.length === 0).length;
      return `Une voiture électrique ne bénéficie plus d’une carte grise gratuite. Depuis le ${h.date(r.propres[0].from)}, chaque région décide seule de réduire ou non la taxe régionale des véhicules électriques et à hydrogène. Au ${h.date(h.P.regional.date_releve)}, ${h.num(nb)} régions sur ${h.num(h.P.regions.length)} appliquent le plein tarif, comme pour une voiture essence. Seule la région Hauts-de-France fait exception : après une exonération totale jusqu’au ${h.date(r.propres[0].to as string)}, elle retire ${h.pct(r.propres[1].exo, 0)} de sa taxe depuis le ${h.date(r.propres[1].from)}. Une électrique de 6 CV y coûte ${h.eur2(ev.total)} à immatriculer d’occasion, contre ${h.eur2(th.total)} en essence. L’avantage décisif est ailleurs : une voiture neuve 100 % électrique ou à hydrogène ne paie ni malus CO₂ ni malus au poids, quelle que soit sa masse. Les hybrides, eux, paient le malus CO₂ selon leurs émissions mesurées et profitent seulement d’un abattement de masse, plus fort pour les rechargeables dotées d’une autonomie suffisante.`;
    },
    faqs: (h) => {
      const r = hdf(h);
      return [
        { q: 'Une électrique immatriculée en Île-de-France échappe-t-elle toujours à la taxe régionale ?', a: `Non. L’Île-de-France applique le plein tarif aux électriques, et la majoration au profit d’Île-de-France Mobilités s’y ajoute aussi en entier. Une électrique de 6 CV de moins de dix ans y coûte ${h.eur2(occasion(h, 'ile-de-france', 6, 'electrique').total)} lors d’un changement de titulaire. Seule la règle générale de la moitié à dix ans peut réduire ce montant.` },
        { q: 'Pourquoi une électrique paie-t-elle la moitié de la taxe dans les Hauts-de-France ?', a: `C’est un choix voté par le conseil régional. La loi permet aux régions de réduire de moitié ou de supprimer leur taxe pour les véhicules électriques et à hydrogène. Les Hauts-de-France l’ont supprimée jusqu’au ${h.date(r.propres[0].to as string)}, puis ramenée à ${h.pct(1 - r.propres[1].exo, 0)} du tarif depuis le ${h.date(r.propres[1].from)}, en même temps qu’ils montaient le cheval à ${h.eur2(h.M.tarifRegion(HDF, h.P.regional.date_releve).cv)}.` },
        { q: 'Un SUV électrique de plus de deux tonnes paie-t-il le malus au poids ?', a: 'Non. L’article L421-79 du code des impositions, réécrit par la loi de finances pour 2026, exonère les véhicules électriques et à hydrogène du malus au poids, sans date de fin à ce jour. Le projet qui prévoyait de les y soumettre en cours d’année n’a pas été retenu. Ils restent aussi exonérés du malus CO₂, dont leur taux d’émission est nul.' },
        { q: 'Une voiture au superéthanol ou au GPL a-t-elle encore une carte grise réduite ?', a: `Non pour la taxe régionale : la faculté donnée aux régions de réduire la taxe de ces carburants a été abrogée, seules l’électricité et l’hydrogène restent visés. Pour le malus CO₂, l’E85 garde un abattement de ${h.pct(h.P.malus_co2.e85.abattement, 0)} sur ses émissions, sauf au-delà de ${h.num(h.P.malus_co2.e85.taux_max_gkm)} g/km. Le GPL n’a aucun avantage particulier.` },
      ];
    },
    body: (h) => {
      const d = h.P.regional.date_releve;
      const r = hdf(h);
      const rowsReg = REG.map((id) => {
        const reg = h.P.regions.find((x) => x.id === id)!;
        const ev = occasion(h, id, 6, 'electrique'), th = occasion(h, id, 6, 'essence');
        return [reg.nom.fr, h.eur2(ev.total), h.eur2(th.total), h.eur2(th.total - ev.total)];
      });
      const rowsNeuf = NEUVES.map((e) => { const x = neuve(h, e.o); return [e.fr, h.eur(x.malus.co2), h.eur(x.malus.masse), h.eur2(x.total)]; });
      const mars = occasion(h, HDF, 6, 'electrique', '2026-03-15');
      const micro26 = neuve(h, NEUVES[3].o), micro27 = neuve(h, NEUVES[3].o, '2027-01-04');
      return `
<h2>La taxe régionale d’une électrique, région par région</h2>
<p>Pour une voiture de 6 CV de moins de dix ans qui change de propriétaire, l’écart avec l’essence n’existe que dans une région :</p>
${h.table(['Région', 'Électrique', 'Essence', 'Écart'], rowsReg, `Changement de titulaire au ${h.date(d)}.`, ['l', 'r', 'r', 'r'])}
<p>Les Hauts-de-France ont pratiqué la gratuité totale de la taxe : la même électrique, achetée le ${h.date('2026-03-15')}, ne coûtait que ${h.eur2(mars.total)}. Le ${h.src('delib_hdf', 'rapport du budget régional 2026')} a ramené l’exonération à ${h.pct(r.propres[1].exo, 0)}. Ailleurs, aucune région n’a voté de réduction, ce que confirme l’${h.src('a18021', 'actualité de service-public.gouv.fr sur les tarifs 2026')}. Pour classer les dix-huit régions sur votre propre puissance, ouvrez le ${h.a('comparer-regions', 'comparateur des régions')}.</p>

<h2>Neuves : là où l’électrique fait la différence</h2>
<p>Sur une voiture neuve, ce ne sont plus quelques dizaines d’euros qui séparent les motorisations, mais les deux malus. Cinq voitures de 6 CV immatriculées dans les Hauts-de-France au ${h.date(d)} :</p>
${h.table(['Motorisation', 'Malus CO₂', 'Malus au poids', 'Carte grise'], rowsNeuf, 'Première immatriculation d’une voiture neuve.', ['l', 'r', 'r', 'r'])}
<p>L’électrique, malgré ses 2 100 kg, ne paie que la taxe régionale réduite et les frais fixes. L’${h.src('l421_79', 'article L421-79')} la dispense du malus au poids dans sa rédaction issue de la ${h.src('lfi2026', 'loi de finances pour 2026')}, sans assujettissement prévu en cours d’année.</p>

<h2>Les hybrides : un abattement, pas une exonération</h2>
<ul>
<li>L’hybride rechargeable dont l’autonomie électrique dépasse ${h.num(h.P.malus_masse.phev.autonomie_min_km)} km retire ${h.num(h.M.abattementHybride('hybride_rechargeable', d, 2000, 80) as number)} kg de sa masse, dans la limite de ${h.pct(h.P.malus_masse.phev.plafond_part_masse, 0)} de celle-ci. Son faible taux de CO₂ homologué lui évite en général le malus CO₂, mais pas toujours le malus au poids.</li>
<li>L’hybride non rechargeable retire ${h.num(h.M.abattementHybride('hybride', d, 1600) as number)} kg et paie le malus CO₂ selon ses émissions.</li>
<li>Le micro-hybride retire ${h.num(h.M.abattementHybride('micro_hybride', d, 1600) as number)} kg en 2026, puis plus rien. Celui du tableau passe de ${h.eur2(micro26.total)} à ${h.eur2(micro27.total)} s’il est immatriculé le ${h.date('2027-01-04')}, sous l’effet conjugué de la perte d’abattement et du barème CO₂ ${h.P.malus_co2.annees['2027'].from.slice(0, 4)}.</li>
</ul>
<p>Les détails du calcul de masse sont sur la page ${h.a('malus-masse', 'malus au poids')}, et le calendrier complet sur la page ${h.a('calendrier-2027', 'ce qui change en 2027')}.</p>
`;
    },
  },
  en: {
    slug: 'electric-hybrid-car',
    nav: 'Electric and hybrid',
    card: 'Full rate everywhere except Hauts-de-France, no malus on electric cars, weight allowances for hybrids: the figures side by side.',
    title: 'Electric car registration in France 2026: cost and malus',
    description: 'Electric car registration in France in 2026: full rate in 17 regions, half in Hauts-de-France since 1 April 2026, no malus at all; hybrid weight allowances.',
    h1: 'Registering an electric or hybrid car in France in 2026',
    intro: 'The mini calculator compares, in the region you choose, the registration cost of the same used car as an electric, a plug-in hybrid and a petrol model.',
    resume: (h) => {
      const r = hdf(h);
      const ev = occasion(h, HDF, 6, 'electrique'), th = occasion(h, HDF, 6, 'essence');
      const nb = h.P.regions.filter((x) => x.propres.length === 0).length;
      return `Electric cars no longer get a free registration certificate, the “carte grise”, in France. Since ${h.date(r.propres[0].from)}, each region decides for itself whether to cut its regional tax for electric and hydrogen vehicles. On ${h.date(h.P.regional.date_releve)}, ${h.num(nb)} of the ${h.num(h.P.regions.length)} regions charge the full rate, exactly as for a petrol car. Hauts-de-France, in the far north, is the only exception: after a full exemption until ${h.date(r.propres[0].to as string)}, it has taken ${h.pct(r.propres[1].exo, 0)} off its tax since ${h.date(r.propres[1].from)}. A used 6 CV electric car costs ${h.eur2(ev.total)} to register there, against ${h.eur2(th.total)} for a petrol one. The real saving lies elsewhere: a new fully electric or hydrogen car pays neither the CO₂ malus nor the weight malus, however heavy it is. Hybrids pay the CO₂ malus on their measured emissions and only get a weight allowance, larger for plug-ins with enough electric range.`;
    },
    faqs: (h) => {
      const r = hdf(h);
      return [
        { q: 'Do electric cars registered in Paris still get a reduced carte grise?', a: `No. Île-de-France charges electric cars the full regional rate, and the Île-de-France Mobilités transport surcharge is added in full too. A 6 CV electric car under ten years old costs ${h.eur2(occasion(h, 'ile-de-france', 6, 'electrique').total)} there on a change of keeper. Only the general half rate at ten years can bring that down.` },
        { q: 'What does the Hauts-de-France electric car discount actually cover?', a: `It covers the region’s own tax only, now cut by ${h.pct(r.propres[1].exo, 0)} for electric and hydrogen vehicles since ${h.date(r.propres[1].from)}. Before that the region exempted them fully until ${h.date(r.propres[0].to as string)}. The fixed handling and postage charges are still due, and the discount depends on your home address, not on where you buy the car.` },
        { q: 'Is a heavy electric SUV over two tonnes hit by the French weight malus?', a: 'No. Article L421-79 of the French tax code, rewritten by the 2026 Finance Act, exempts electric and hydrogen vehicles from the weight malus, with no end date so far. A plan to bring them into the tax part-way through 2026 was not adopted. They are also outside the CO₂ malus, since their emissions figure is zero.' },
        { q: 'Do E85 flex-fuel or LPG cars still get any registration discount?', a: `Not on the regional tax: regions lost the power to reduce it for these fuels, and only electricity and hydrogen remain eligible. On the CO₂ malus, E85 cars keep a ${h.pct(h.P.malus_co2.e85.abattement, 0)} cut in their emissions figure unless they exceed ${h.num(h.P.malus_co2.e85.taux_max_gkm)} g/km. LPG gets no special treatment at all.` },
      ];
    },
    body: (h) => {
      const d = h.P.regional.date_releve;
      const r = hdf(h);
      const rowsReg = REG.map((id) => {
        const reg = h.P.regions.find((x) => x.id === id)!;
        const ev = occasion(h, id, 6, 'electrique'), th = occasion(h, id, 6, 'essence');
        return [reg.nom.en, h.eur2(ev.total), h.eur2(th.total), h.eur2(th.total - ev.total)];
      });
      const rowsNeuf = NEUVES.map((e) => { const x = neuve(h, e.o); return [e.en, h.eur(x.malus.co2), h.eur(x.malus.masse), h.eur2(x.total)]; });
      const mars = occasion(h, HDF, 6, 'electrique', '2026-03-15');
      const micro26 = neuve(h, NEUVES[3].o), micro27 = neuve(h, NEUVES[3].o, '2027-01-04');
      return `
<h2>Regional tax on an electric car, region by region</h2>
<p>For a 6 CV car under ten years old changing hands, electric and petrol cost different amounts in only one region:</p>
${h.table(['Region', 'Electric', 'Petrol', 'Difference'], rowsReg, `Change of keeper on ${h.date(d)}.`, ['l', 'r', 'r', 'r'])}
<p>Hauts-de-France used to waive the tax entirely: the same electric car bought on ${h.date('2026-03-15')} cost just ${h.eur2(mars.total)}. Its ${h.src('delib_hdf', '2026 regional budget report')} brought the exemption down to ${h.pct(r.propres[1].exo, 0)}. No other region has voted any reduction, as the ${h.src('a18021', 'service-public.gouv.fr news item on 2026 rates')} confirms. To rank all eighteen regions for your own horsepower, use the ${h.a('comparer-regions', 'region comparison')}.</p>

<h2>New cars: where electric really pays off</h2>
<p>On a new car, the gap between powertrains is no longer a few tens of euros but the two malus taxes. Five 6 CV cars first registered in Hauts-de-France on ${h.date(d)}:</p>
${h.table(['Powertrain', 'CO₂ malus', 'Weight malus', 'Registration'], rowsNeuf, 'First registration of a new car.', ['l', 'r', 'r', 'r'])}
<p>Despite its 2,100 kg, the electric car pays only the reduced regional tax and the fixed charges. ${h.src('l421_79', 'Article L421-79')} has exempted it from the weight malus since the ${h.src('lfi2026', '2026 Finance Act')}, with no mid-year change planned.</p>

<h2>Hybrids: an allowance, not an exemption</h2>
<ul>
<li>A plug-in hybrid with more than ${h.num(h.P.malus_masse.phev.autonomie_min_km)} km of electric range deducts ${h.num(h.M.abattementHybride('hybride_rechargeable', d, 2000, 80) as number)} kg from its mass, up to ${h.pct(h.P.malus_masse.phev.plafond_part_masse, 0)} of it. Its low official CO₂ figure usually avoids the CO₂ malus, but not always the weight malus.</li>
<li>A full hybrid deducts ${h.num(h.M.abattementHybride('hybride', d, 1600) as number)} kg and pays the CO₂ malus on its emissions.</li>
<li>A mild hybrid deducts ${h.num(h.M.abattementHybride('micro_hybride', d, 1600) as number)} kg in 2026, then nothing. The one in the table goes from ${h.eur2(micro26.total)} to ${h.eur2(micro27.total)} if registered on ${h.date('2027-01-04')}, through the loss of its allowance combined with the ${h.P.malus_co2.annees['2027'].from.slice(0, 4)} CO₂ scale.</li>
</ul>
<p>The mass calculation is explained on the ${h.a('malus-masse', 'weight malus')} page, and the full timeline on the ${h.a('calendrier-2027', '2027 changes')} page.</p>
`;
    },
  },
});
