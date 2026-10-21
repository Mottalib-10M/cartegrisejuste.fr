import { defineGuide, type Helpers } from '../../lib/guide-types';
import type { Energie } from '../../lib/engine/carte-grise';

/** Première immatriculation en France d'une voiture neuve, achetée en France. */
const neuve = (h: Helpers, o: { region?: string; cv: number; energie: Energie; gkm: number; masseKg: number; autonomieKm?: number; date?: string }) => {
  const d = o.date ?? h.P.regional.date_releve;
  return h.M.coutCarteGrise({ demarche: 'immat', origine: 'france_neuf', genre: 'vp', ptacKg: 0, region: o.region ?? 'auvergne-rhone-alpes', cv: o.cv, energie: o.energie, gkm: o.gkm, masseKg: o.masseKg, autonomieKm: o.autonomieKm, date1re: d, dateOp: d });
};
const EX = [
  { fr: 'Citadine essence, 5 CV, 125 g/km, 1 250 kg', en: 'Petrol city car, 5 CV, 125 g/km, 1,250 kg', o: { cv: 5, energie: 'essence' as Energie, gkm: 125, masseKg: 1250 } },
  { fr: 'Compacte hybride, 7 CV, 115 g/km, 1 550 kg', en: 'Full hybrid hatchback, 7 CV, 115 g/km, 1,550 kg', o: { cv: 7, energie: 'hybride' as Energie, gkm: 115, masseKg: 1550 } },
  { fr: 'SUV hybride rechargeable, 8 CV, 30 g/km, 1 950 kg, 70 km d’autonomie', en: 'Plug-in hybrid SUV, 8 CV, 30 g/km, 1,950 kg, 70 km range', o: { cv: 8, energie: 'hybride_rechargeable' as Energie, gkm: 30, masseKg: 1950, autonomieKm: 70 } },
  { fr: 'SUV électrique, 4 CV, 2 100 kg', en: 'Electric SUV, 4 CV, 2,100 kg', o: { cv: 4, energie: 'electrique' as Energie, gkm: 0, masseKg: 2100 } },
  { fr: 'Grande routière essence, 12 CV, 200 g/km, 2 000 kg', en: 'Large petrol saloon, 12 CV, 200 g/km, 2,000 kg', o: { cv: 12, energie: 'essence' as Energie, gkm: 200, masseKg: 2000 } },
];
const B = (h: Helpers, y: '2026' | '2027') => h.P.malus_co2.annees[y];
const seuilMasse = (h: Helpers) => h.P.malus_masse.annees['2026'].tranches[0].min;
const tableau = (h: Helpers, l: 'fr' | 'en') =>
  h.table(
    l === 'fr' ? ['Voiture', 'Y1', 'Malus CO₂', 'Malus au poids', 'Total'] : ['Car', 'Y1', 'CO₂ malus', 'Weight malus', 'Total'],
    EX.map((e) => { const x = neuve(h, e.o); return [e[l], h.eur2(x.y1.y1), h.eur(x.malus.co2), h.eur(x.malus.masse), h.eur2(x.total)]; }),
    l === 'fr' ? `Auvergne-Rhône-Alpes, immatriculation le ${h.date(h.P.regional.date_releve)}.` : `Auvergne-Rhône-Alpes, registered on ${h.date(h.P.regional.date_releve)}.`,
    ['l', 'r', 'r', 'r', 'r'],
  );
const DEC = '2026-12-15', JAN = '2027-01-05';
const bascule = (h: Helpers, region = 'auvergne-rhone-alpes') => ({
  dec: neuve(h, { region, cv: 7, energie: 'essence', gkm: 140, masseKg: 1600, date: DEC }),
  jan: neuve(h, { region, cv: 7, energie: 'essence', gkm: 140, masseKg: 1600, date: JAN }),
});

export default defineGuide({
  id: 'voiture-neuve',
  group: 'situations',
  order: 20,
  mini: 'neuve',
  miniHref: 'home',
  related: ['malus-co2', 'malus-masse', 'calendrier-2027', 'electrique-hybride', 'budget-achat', 'calcul-chevaux-fiscaux'],
  sources: ['l421_62', 'f35947', 'f35950', 'l421_79', 'lfi2026', 'cibs'],
  fr: {
    slug: 'voiture-neuve',
    nav: 'Voiture neuve',
    card: 'Taxe régionale, malus CO₂ et malus au poids d’une voiture neuve, avec le plafond commun et l’effet de la date.',
    title: 'Carte grise voiture neuve 2026 : taxe régionale et malus',
    description: 'Carte grise d’une voiture neuve en 2026 : taxe régionale, malus CO₂ dès 108 g/km, malus au poids dès 1 500 kg, plafond de 80 000 € et barème fixé par la date.',
    h1: 'Carte grise d’une voiture neuve en 2026',
    intro: 'Le mini-simulateur additionne la taxe régionale, le malus CO₂ et le malus au poids d’une voiture neuve essence à partir de quatre valeurs du certificat de conformité.',
    resume: (h) => {
      const b = B(h, '2026');
      const ex = neuve(h, EX[0].o);
      return `La carte grise d’une voiture neuve coûte davantage que celle d’une occasion, parce que la première immatriculation en France déclenche deux taxes supplémentaires, regroupées en ligne Y3. Le malus CO₂ s’applique en 2026 dès ${h.num(b.seuil)} g/km d’émissions WLTP et atteint ${h.eur(b.plafond)} au-delà de ${h.num(b.plafond_des - 1)} g/km. Le malus au poids taxe chaque kilo au-delà de ${h.num(seuilMasse(h) - 1)} kg de masse en ordre de marche. Les deux réunis ne peuvent pas dépasser ${h.eur(b.plafond)}. S’y ajoute la part ordinaire de toute carte grise : tarif du cheval de votre région × puissance fiscale, plus ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} de gestion et d’envoi. Une citadine essence de 5 CV à 125 g/km et 1 250 kg revient ainsi à ${h.eur2(ex.total)} en Auvergne-Rhône-Alpes. Les voitures électriques et à hydrogène sont exonérées des deux malus, les hybrides bénéficient d’un abattement sur la masse. Le barème appliqué est celui de la date d’immatriculation, et non celle de la commande : une livraison en janvier ${B(h, '2027').from.slice(0, 4)} bascule sur un barème plus sévère.`;
    },
    faqs: (h) => {
      const b26 = B(h, '2026');
      return [
        { q: 'Où trouver le taux de CO₂ et la masse d’une voiture neuve avant de l’acheter ?', a: 'Sur le certificat de conformité européen et sur le bon de commande : le taux WLTP figure en case V.7 de la future carte grise et la masse en ordre de marche en case G. Le vendeur doit aussi afficher le montant du malus. Pour une même version, des jantes plus grandes ou une option lourde peuvent changer ces deux valeurs, donc le malus.' },
        { q: 'Le malus d’une voiture neuve commandée en 2026 mais livrée en 2027 suit-il le barème de 2026 ?', a: `Non. La loi retient la date de première immatriculation, pas celle de la commande ni du paiement. Une voiture immatriculée à partir du ${h.date(B(h, '2027').from)} paie le barème ${B(h, '2027').from.slice(0, 4)}, qui commence à ${h.num(B(h, '2027').seuil)} g/km au lieu de ${h.num(b26.seuil)} g/km. Le concessionnaire peut immatriculer avant la livraison si le véhicule est prêt.` },
        { q: 'Une voiture neuve peut-elle payer à la fois le malus CO₂ et le malus au poids ?', a: `Oui, les deux se cumulent, puis la somme est limitée au montant maximal du malus CO₂, soit ${h.eur(b26.plafond)} pour une immatriculation en 2026. Au-delà, c’est le malus au poids qui est réduit. Une grosse voiture très émettrice atteint donc ce plafond, et son malus au poids devient nul en pratique.` },
        { q: 'Une famille nombreuse paie-t-elle moins de malus sur une voiture neuve ?', a: `Oui, à partir de ${h.num(h.P.malus_co2.famille.enfants_min)} enfants à charge : ${h.num(h.P.malus_co2.famille.g_par_enfant)} g/km et ${h.num(h.P.malus_masse.famille.kg_par_enfant)} kg sont retirés par enfant pour une voiture d’au moins cinq places, une seule par foyer. La réduction n’est pas faite au moment de la carte grise : le malus est payé en entier puis remboursé sur demande.` },
      ];
    },
    body: (h) => {
      const b26 = B(h, '2026'), b27 = B(h, '2027');
      const s = bascule(h);
      const sIdf = bascule(h, 'ile-de-france');
      const phev = neuve(h, EX[2].o);
      const phevSans = neuve(h, { ...EX[2].o, autonomieKm: 40 });
      return `
<h2>Cinq voitures neuves chiffrées</h2>
<p>Chaque ligne est calculée pour une immatriculation au ${h.date(h.P.regional.date_releve)} en Auvergne-Rhône-Alpes. Le tarif du cheval change d’une région à l’autre, les malus non.</p>
${tableau(h, 'fr')}
<p>La citadine paie un petit malus CO₂ et aucun malus au poids. La compacte hybride passe sous le seuil de masse grâce à son abattement de ${h.num(h.M.abattementHybride('hybride', h.P.regional.date_releve, 1550) as number)} kg. Le SUV électrique ne paie que la taxe régionale. La grande routière atteint le plafond commun de ${h.eur(b26.plafond)}.</p>

<h2>Le malus CO₂</h2>
<p>Il dépend du taux d’émissions WLTP, en grammes par kilomètre. En 2026, il démarre à ${h.eur(h.M.malusCO2Brut(b26.seuil, '2026'))} à ${h.num(b26.seuil)} g/km, vaut ${h.eur(h.M.malusCO2Brut(140, '2026'))} à 140 g/km et ${h.eur(h.M.malusCO2Brut(160, '2026'))} à 160 g/km. Il plafonne à ${h.eur(b26.plafond)}. La grille complète, gramme par gramme, est sur la page ${h.a('malus-co2', 'malus CO₂')}, qui suit l’${h.src('l421_62', 'article L421-62 du CIBS')}.</p>

<h2>Le malus au poids</h2>
<p>Chaque kilo de masse en ordre de marche qui dépasse ${h.num(seuilMasse(h) - 1)} kg est taxé, avec un tarif par kilo qui monte par tranches. Une voiture de 1 600 kg paie ${h.eur(h.M.malusMasseBrut(1600, '2026'))}, une de 1 950 kg ${h.eur(h.M.malusMasseBrut(1950, '2026'))}. Les abattements des hybrides se retirent de la masse avant le calcul :</p>
<ul>
<li>hybride non rechargeable : ${h.num(h.M.abattementHybride('hybride', h.P.regional.date_releve, 1600) as number)} kg ;</li>
<li>hybride rechargeable de plus de ${h.num(h.P.malus_masse.phev.autonomie_min_km)} km d’autonomie électrique : ${h.num(h.M.abattementHybride('hybride_rechargeable', h.P.regional.date_releve, 2000, 80) as number)} kg, dans la limite de ${h.pct(h.P.malus_masse.phev.plafond_part_masse, 0)} de la masse ;</li>
<li>micro-hybride : ${h.num(h.M.abattementHybride('micro_hybride', h.P.regional.date_releve, 1600) as number)} kg en 2026, plus rien en 2027.</li>
</ul>
<p>Le SUV rechargeable du tableau paie ${h.eur(phev.malus.masse)} de malus au poids. Avec une autonomie de 40 km seulement, il perdrait l’abattement et paierait ${h.eur(phevSans.malus.masse)}. Les électriques sont exonérées par l’${h.src('l421_79', 'article L421-79')}, réécrit par la ${h.src('lfi2026', 'loi de finances pour 2026')}. Détail sur la page ${h.a('malus-masse', 'malus au poids')}.</p>

<h2>Décembre ou janvier : la date change le barème</h2>
<p>Le barème appliqué est celui de l’année de la première immatriculation. Pour une essence de 7 CV, 140 g/km et 1 600 kg en Auvergne-Rhône-Alpes, la carte grise coûte ${h.eur2(s.dec.total)} si elle est faite le ${h.date(DEC)}, et ${h.eur2(s.jan.total)} le ${h.date(JAN)} : le seuil du malus CO₂ descend à ${h.num(b27.seuil)} g/km et le plafond monte à ${h.eur(b27.plafond)}. En Île-de-France, la même voiture passe de ${h.eur2(sIdf.dec.total)} à ${h.eur2(sIdf.jan.total)}, car la majoration régionale des transports baisse en même temps. Tout le calendrier est sur la page ${h.a('calendrier-2027', 'ce qui change en 2027')}.</p>

<h2>La démarche</h2>
<p>Le plus souvent, le vendeur immatricule lui-même la voiture neuve et répercute les taxes sur la facture : vérifiez que le malus y figure à part. Si vous faites la demande vous-même, elle est gratuite sur le site de l’ANTS, et seules les taxes sont dues.</p>
`;
    },
  },
  en: {
    slug: 'new-car',
    nav: 'New car',
    card: 'Regional tax, CO₂ malus and weight malus on a new car, with the shared cap and the effect of the registration date.',
    title: 'New car registration cost in France 2026: tax and malus',
    description: 'Registering a new car in France in 2026: regional tax, CO₂ malus from 108 g/km, weight malus from 1,500 kg, an €80,000 cap, and the scale set by the date.',
    h1: 'Registering a new car in France in 2026',
    intro: 'The mini calculator adds up the regional tax, the CO₂ malus and the weight malus of a new petrol car from four figures on its certificate of conformity.',
    resume: (h) => {
      const b = B(h, '2026');
      const ex = neuve(h, EX[0].o);
      return `A new car costs more to register in France than a used one, because its first French registration triggers two extra taxes, grouped on line Y3 of the certificate. The CO₂ malus applies in 2026 from ${h.num(b.seuil)} g/km of WLTP emissions and reaches ${h.eur(b.plafond)} above ${h.num(b.plafond_des - 1)} g/km. The weight malus charges every kilo of mass in running order above ${h.num(seuilMasse(h) - 1)} kg. Together the two can never exceed ${h.eur(b.plafond)}. On top comes the part every registration pays: your region’s rate per fiscal horsepower times the car’s CV rating, plus ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} for handling and posting the certificate. A 5 CV petrol city car at 125 g/km and 1,250 kg therefore costs ${h.eur2(ex.total)} in Auvergne-Rhône-Alpes. Electric and hydrogen cars are exempt from both malus taxes, and hybrids get a weight allowance. The scale used is the one in force on the registration date, not the order date, so a car registered in January ${B(h, '2027').from.slice(0, 4)} falls under a stricter scale.`;
    },
    faqs: (h) => {
      const b26 = B(h, '2026');
      return [
        { q: 'Which documents show the CO₂ figure and weight of a new car before I sign?', a: 'The European certificate of conformity and the order form. The WLTP CO₂ figure goes in box V.7 of the future registration certificate and the mass in running order in box G. Dealers must also display the malus amount. Bigger wheels or a heavy option can move both figures for the same model, and with them the malus you pay.' },
        { q: 'If I order a new car in 2026 and it is delivered in 2027, which malus scale applies?', a: `The 2027 one, if the car is first registered from ${h.date(B(h, '2027').from)}. The law looks at the registration date, not the order or payment date. The ${B(h, '2027').from.slice(0, 4)} CO₂ scale starts at ${h.num(B(h, '2027').seuil)} g/km instead of ${h.num(b26.seuil)} g/km. A dealer can register the car before handing it over if it is already in stock.` },
        { q: 'Can a new car be charged both the CO₂ malus and the weight malus?', a: `Yes. Both are added together and the total is then capped at the top CO₂ malus amount, ${h.eur(b26.plafond)} for a car registered in 2026. Anything above the cap comes off the weight malus. A large, high-emission car therefore hits the cap and in practice pays no weight malus at all.` },
        { q: 'Do large families get a lower malus on a new car in France?', a: `Yes, with at least ${h.num(h.P.malus_co2.famille.enfants_min)} dependent children: ${h.num(h.P.malus_co2.famille.g_par_enfant)} g/km and ${h.num(h.P.malus_masse.famille.kg_par_enfant)} kg are taken off per child, for one car with five seats or more per household. The reduction is not applied at registration: you pay the full malus and then claim a refund from the tax office.` },
      ];
    },
    body: (h) => {
      const b26 = B(h, '2026'), b27 = B(h, '2027');
      const s = bascule(h);
      const sIdf = bascule(h, 'ile-de-france');
      const phev = neuve(h, EX[2].o);
      const phevSans = neuve(h, { ...EX[2].o, autonomieKm: 40 });
      return `
<h2>Five new cars, fully costed</h2>
<p>Each row is a first registration on ${h.date(h.P.regional.date_releve)} in Auvergne-Rhône-Alpes. The rate per CV varies by region; the malus taxes do not.</p>
${tableau(h, 'en')}
<p>The city car pays a small CO₂ malus and no weight malus. The full hybrid slips under the weight threshold thanks to its ${h.num(h.M.abattementHybride('hybride', h.P.regional.date_releve, 1550) as number)} kg allowance. The electric SUV pays the regional tax only. The large saloon hits the shared cap of ${h.eur(b26.plafond)}.</p>

<h2>CO₂ malus</h2>
<p>This tax depends on the WLTP emissions figure in grams per kilometre. In 2026 it starts at ${h.eur(h.M.malusCO2Brut(b26.seuil, '2026'))} at ${h.num(b26.seuil)} g/km, reaches ${h.eur(h.M.malusCO2Brut(140, '2026'))} at 140 g/km and ${h.eur(h.M.malusCO2Brut(160, '2026'))} at 160 g/km, and stops at ${h.eur(b26.plafond)}. The gram-by-gram scale from ${h.src('l421_62', 'article L421-62 of the tax code')} is on the ${h.a('malus-co2', 'CO₂ malus')} page.</p>

<h2>Weight malus</h2>
<p>This one charges mass in running order above ${h.num(seuilMasse(h) - 1)} kg, at a per-kilo rate that rises in bands. A 1,600 kg car pays ${h.eur(h.M.malusMasseBrut(1600, '2026'))} and a 1,950 kg car ${h.eur(h.M.malusMasseBrut(1950, '2026'))}. Hybrids deduct an allowance from their mass first:</p>
<ul>
<li>full hybrid (not plug-in): ${h.num(h.M.abattementHybride('hybride', h.P.regional.date_releve, 1600) as number)} kg;</li>
<li>plug-in hybrid with an electric range above ${h.num(h.P.malus_masse.phev.autonomie_min_km)} km: ${h.num(h.M.abattementHybride('hybride_rechargeable', h.P.regional.date_releve, 2000, 80) as number)} kg, capped at ${h.pct(h.P.malus_masse.phev.plafond_part_masse, 0)} of the mass;</li>
<li>mild hybrid: ${h.num(h.M.abattementHybride('micro_hybride', h.P.regional.date_releve, 1600) as number)} kg in 2026, nothing from 2027.</li>
</ul>
<p>The plug-in SUV in the table pays ${h.eur(phev.malus.masse)} of weight malus. With only 40 km of range it would lose the allowance and pay ${h.eur(phevSans.malus.masse)}. Electric cars are exempt under ${h.src('l421_79', 'article L421-79')}, as rewritten by the ${h.src('lfi2026', '2026 Finance Act')}. More on the ${h.a('malus-masse', 'weight malus')} page.</p>

<h2>December or January: the date picks the scale</h2>
<p>The scale applied is the one for the year of first registration. A 7 CV petrol car at 140 g/km and 1,600 kg in Auvergne-Rhône-Alpes costs ${h.eur2(s.dec.total)} if registered on ${h.date(DEC)} and ${h.eur2(s.jan.total)} on ${h.date(JAN)}: the CO₂ threshold drops to ${h.num(b27.seuil)} g/km and the cap rises to ${h.eur(b27.plafond)}. In Île-de-France the same car goes from ${h.eur2(sIdf.dec.total)} to ${h.eur2(sIdf.jan.total)}, because the Paris-region transport surcharge falls at the same time. The full timeline is on the ${h.a('calendrier-2027', '2027 changes')} page.</p>

<h2>Who files the application</h2>
<p>In most cases the dealer registers the new car and passes the taxes on in the invoice: check that the malus is shown as a separate line. If you apply yourself, it is free on the ANTS website, the State agency for registrations, and you only pay the taxes.</p>
`;
    },
  },
});
