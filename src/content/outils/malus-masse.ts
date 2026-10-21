import { defineGuide, type Helpers } from '../../lib/guide-types';

type MY = '2022' | '2024' | '2026';
const tr = (h: Helpers, y: MY) => h.P.malus_masse.annees[y].tranches;
const seuil = (h: Helpers, y: MY) => tr(h, y)[0].min;
const dernier = (h: Helpers, y: MY) => tr(h, y)[tr(h, y).length - 1];
const d0 = (h: Helpers) => h.P.regional.date_releve;
/** Voiture neuve immatriculée au jour du relevé (ou à la date donnée). */
const neuf = (h: Helpers, kg: number, energie: Parameters<Helpers['M']['malus']>[0]['energie'], extra: { gkm?: number; enfants?: number; autonomieKm?: number; date?: string } = {}) =>
  h.M.malus({ gkm: extra.gkm ?? 0, masseKg: kg, energie, date1re: extra.date ?? d0(h), dateOp: extra.date ?? d0(h), origine: 'france_neuf', enfants: extra.enfants, autonomieKm: extra.autonomieKm });
const MASSES = [1600, 1750, 1950, 2100, 2300, 2500];
const EX = 1950;

const lignesTranches = (h: Helpers, y: MY, fr: boolean) => tr(h, y).map((t) => [
  t.max === null ? (fr ? `${h.num(t.min)} kg et plus` : `${h.num(t.min)} kg and over`) : (fr ? `${h.num(t.min)} kg - ${h.num(t.max)} kg` : `${h.num(t.min)} to ${h.num(t.max)} kg`),
  h.eur(t.euro_kg),
]);
const lignesTranchesFr = (h: Helpers) => lignesTranches(h, '2026', true).map(([a, b]) => [b, a]);
const hybRows = (h: Helpers, fr: boolean) => h.P.malus_masse.hybrides.map((r) => [
  fr ? `dès le ${h.date(r.from)}` : `from ${h.date(r.from)}`,
  `${h.num(r.micro)} kg`,
  `${h.num(r.hybride)} kg`,
  r.phev === 'exo' ? (fr ? 'exonéré' : 'exempt') : `${h.num(Number(r.phev))} kg`,
]);

export default defineGuide({
  id: 'malus-masse',
  group: 'outils',
  order: 30,
  tool: 'masse',
  related: ['malus-co2', 'voiture-neuve', 'electrique-hybride', 'import-europe', 'calendrier-2027'],
  sources: ['f35950', 'l421_79', 'lfi2026', 'cibs', 'l421_7_2'],
  fr: {
    slug: 'malus-masse',
    nav: 'Malus au poids',
    card: 'La taxe sur la masse des voitures neuves, kilo par kilo au-delà du seuil, avec les abattements des hybrides et des familles.',
    title: 'Malus au poids 2026 : barème kilo par kilo dès 1 500 kg',
    description: 'Malus au poids 2026 dès 1 500 kg, de 10 à 30 € le kilo : exemple officiel à 1 950 kg, hybrides, électriques exonérés, familles et plafond commun avec le CO₂.',
    h1: 'Malus au poids en 2026 : tranches, abattements et plafond',
    intro: 'Indiquez la masse en ordre de marche et l’énergie de la voiture : l’outil découpe la masse en tranches, applique l’abattement éventuel et le plafond commun.',
    resume: (h) => {
      const t = tr(h, '2026');
      return `Le malus au poids, de son nom officiel taxe sur la masse en ordre de marche, vient en plus du malus CO₂ lors de la première immatriculation en France d’une voiture particulière neuve ou importée. Pour une voiture immatriculée en 2026, chaque kilo compte à partir de ${h.num(seuil(h, '2026'))} kg, à un tarif qui monte par tranches de ${h.eur(t[0].euro_kg)} à ${h.eur(dernier(h, '2026').euro_kg)} le kilo. L’exemple publié par l’administration, une voiture de ${h.num(EX)} kg, donne ${h.eur(h.M.malusMasseBrut(EX, '2026'))}. Le barème ne change pas en 2027. Les voitures électriques et à hydrogène sont exonérées depuis la loi de finances pour 2026, sans date de fin. Les hybrides non rechargeables retirent ${h.num(h.P.malus_masse.hybrides[2].hybride)} kg de leur masse ; les hybrides rechargeables de plus de ${h.num(h.P.malus_masse.phev.autonomie_min_km)} km d’autonomie en retirent ${h.num(Number(h.P.malus_masse.hybrides[2].phev))}, dans la limite de ${h.pct(h.P.malus_masse.phev.plafond_part_masse, 0)} de la masse. Les familles nombreuses ont droit à ${h.num(h.P.malus_masse.famille.kg_par_enfant)} kg par enfant. Le total des deux malus ne dépasse jamais le montant maximal du barème CO₂, soit ${h.eur(h.P.malus_co2.annees['2026'].plafond)} en 2026.`;
    },
    faqs: (h) => {
      const m27 = neuf(h, 1750, 'micro_hybride', { date: '2027-01-15' }), m26 = neuf(h, 1750, 'micro_hybride');
      return [
        { q: 'Quelle masse faut-il lire sur le certificat de conformité pour le malus au poids ?', a: `La masse en ordre de marche, reportée en case G de la carte grise. C’est la valeur du certificat de conformité remis avec la voiture neuve. Une différence de quelques kilos compte : au-dessus de ${h.num(seuil(h, '2026'))} kg, chaque kilo supplémentaire est taxé au tarif de la tranche où il tombe.` },
        { q: 'Un micro-hybride livré en janvier 2027 paiera-t-il plus de malus au poids ?', a: `Oui, car il perd son abattement de ${h.num(h.P.malus_masse.hybrides[2].micro)} kg. Pour une voiture de 1 750 kg, le malus au poids passe de ${h.eur(m26.masse)} en 2026 à ${h.eur(m27.masse)} en 2027, le barème des tranches restant le même. Les hybrides non rechargeables gardent leur abattement.` },
        { q: 'Une camionnette ou un camping-car paie-t-il le malus au poids ?', a: `Non. Le malus au poids ne vise que les voitures particulières. Les camionnettes en sont exemptées depuis le ${h.date(h.P.camionnette_exemptee_des)}, comme les camping-cars, les utilitaires et les deux-roues. Leur carte grise peut en revanche porter la taxe sur les véhicules de transport, qui dépend du poids total autorisé en charge et commence à ${h.eur(h.P.y2.bareme[0].montant)}.` },
        { q: 'Le malus au poids d’une voiture importée d’occasion est-il réduit ?', a: `Oui. Il suit le barème de l’année de première immatriculation, puis la même décote par mois d’âge que le malus CO₂. Une voiture mise en circulation avant le ${h.date(h.P.malus_masse.premiere_annee)} n’en paie pas, car la taxe n’existait pas encore. Pour une voiture mise en circulation le ${h.date('2022-06-01')}, la réduction atteint déjà ${h.pct(h.M.coefficientDecote(h.M.moisEntames('2022-06-01', d0(h))), 0)}.` },
      ];
    },
    body: (h) => {
      const P = h.P.malus_masse;
      const rows = MASSES.map((kg) => [`${h.num(kg)} kg`, h.eur(h.M.malusMasseBrut(kg, '2026')), h.eur(h.M.malusMasseBrut(kg, '2024')), h.eur(h.M.malusMasseBrut(kg, '2022'))]);
      const t = tr(h, '2026');
      const ex = t.filter((x) => x.min <= EX).map((x) => {
        const hi = Math.min(EX, x.max ?? EX);
        return `${h.num(hi - x.min + 1)} kg à ${h.eur(x.euro_kg)}`;
      });
      const phev = neuf(h, 2100, 'hybride_rechargeable', { autonomieKm: 60 });
      const full = neuf(h, 1750, 'hybride');
      const plaf = neuf(h, 2300, 'essence', { gkm: 188 });
      const fam = neuf(h, 2000, 'essence', { enfants: h.P.malus_co2.famille.enfants_min });
      const minPart = Math.floor(Number(P.hybrides[2].phev) / P.phev.plafond_part_masse);
      const imp = h.M.malus({ gkm: 0, masseKg: EX, energie: 'essence', date1re: '2024-03-01', dateOp: d0(h), origine: 'import_occasion' });
      return `
<h2>Les tranches du barème 2026</h2>
<p>Le calcul ressemble à celui de l’impôt sur le revenu : la masse est découpée en tranches, et chaque kilo est taxé au tarif de la tranche où il se trouve. Les kilos sous le seuil ne coûtent rien.</p>
${h.table(['Prix de chaque kilo', 'Kilos concernés'], lignesTranchesFr(h), 'Voitures dont la première immatriculation a lieu en 2026 ou après.', ['r', 'l'])}
<p>Pour la voiture de ${h.num(EX)} kg prise en exemple par la ${h.src('f35950', 'fiche officielle du malus au poids')}, on additionne ${ex.join(', ')}, soit ${h.eur(h.M.malusMasseBrut(EX, '2026'))}.</p>

<h2>Barèmes des années précédentes, utiles pour un import</h2>
<p>Une voiture importée d’occasion garde le barème de l’année de sa première immatriculation. De 2024 à 2025, le seuil était de ${h.num(seuil(h, '2024'))} kg et le dernier tarif, ${h.eur(dernier(h, '2024').euro_kg)} le kilo, commençait à ${h.num(dernier(h, '2024').min)} kg. En 2022 et 2023, un seul tarif de ${h.eur(tr(h, '2022')[0].euro_kg)} s’appliquait dès ${h.num(seuil(h, '2022'))} kg.</p>
${h.table(['Masse', 'Barème 2026', 'Barème 2024-2025', 'Barème 2022-2023'], rows, 'Malus au poids brut, avant abattement, décote ou plafond.', ['l', 'r', 'r', 'r'])}
<p>La ${h.src('l421_7_2', 'décote des véhicules importés')} s’applique ensuite. Une voiture de ${h.num(EX)} kg mise en circulation à l’étranger le ${h.date('2024-03-01')} et réimmatriculée en France le ${h.date(d0(h))} relève du barème 2024 : ${h.eur(imp.masseBrut)} avant décote, ${h.eur(imp.masse)} après une réduction de ${h.pct(imp.decote, 0)}.</p>

<h2>Électriques : exonération maintenue</h2>
<p>La loi de finances pour 2026 a réécrit l’${h.src('l421_79', 'article L421-79')} : les voitures électriques et à hydrogène sont exonérées, qu’elles aient ou non un score environnemental. L’assujettissement un temps envisagé pour le 1er juillet 2026 n’est pas entré en vigueur, et aucune version future du texte ne le prévoit au ${h.date(d0(h))}.</p>

<h2>Hybrides : un abattement qui dépend de la technologie</h2>
${h.table(['Première immatriculation', 'Micro-hybride', 'Hybride non rechargeable', 'Hybride rechargeable'], hybRows(h, true), 'Kilos retirés de la masse avant le calcul.', ['l', 'r', 'r', 'r'])}
<p>L’abattement de l’hybride rechargeable suppose une autonomie électrique de plus de ${h.num(P.phev.autonomie_min_km)} km et ne peut dépasser ${h.pct(P.phev.plafond_part_masse, 0)} de la masse. Ce plafond ne joue qu’en dessous de ${h.num(minPart)} kg, une masse déjà sous le seuil de taxation : en pratique, l’abattement est toujours entier. Un hybride rechargeable de 2 100 kg n’est taxé que sur ${h.num(phev.masseTaxable)} kg, soit ${h.eur(phev.masse)}. Un hybride non rechargeable de 1 750 kg est taxé sur ${h.num(full.masseTaxable)} kg, soit ${h.eur(full.masse)}.</p>

<h2>Familles nombreuses et plafond commun</h2>
<p>Dès ${h.num(h.P.malus_co2.famille.enfants_min)} enfants à charge, la masse est réduite de ${h.num(P.famille.kg_par_enfant)} kg par enfant, pour un seul véhicule, par remboursement après paiement. Une voiture de 2 000 kg, taxée ${h.eur(neuf(h, 2000, 'essence').masse)} en temps normal, revient à ${h.eur(fam.masse)} pour une famille de ${h.num(h.P.malus_co2.famille.enfants_min)} enfants.</p>
<p>Les deux malus réunis ne peuvent dépasser le montant maximal du barème CO₂ de l’année. Une voiture de 2 300 kg à 188 g/km aurait ${h.eur(plaf.co2)} de malus CO₂ et ${h.eur(plaf.masseBrut)} de malus au poids ; le second est ramené à ${h.eur(plaf.masse)} pour que le total reste à ${h.eur(plaf.total)}.</p>

<h2>Ce que montre l’outil</h2>
<p>Vous saisissez la masse de la case G, l’énergie, le nombre d’enfants à charge et, selon le cas, l’autonomie électrique de l’hybride rechargeable ou le taux de CO₂ qui sert au plafond. Le résultat détaille le montant de chaque tranche, l’abattement appliqué, le ${h.a('malus-co2', 'malus CO₂')} de la même voiture et le total des deux. Le calcul vaut pour une voiture neuve immatriculée aujourd’hui ; pour un import d’occasion, la décote se calcule dans le ${h.a('home', 'calcul complet')}.</p>
`;
    },
  },
  en: {
    slug: 'weight-malus-france',
    nav: 'Weight malus',
    card: 'France’s tax on heavy new cars, kilo by kilo above the threshold, with the hybrid and large-family allowances.',
    title: 'Weight malus 2026 in France: 1,500 kg threshold and bands',
    description: 'Weight malus 2026 in France from 1,500 kg, €10 to €30 per kilo: the official 1,950 kg example, hybrids, exempt EVs, large families and the cap shared with CO₂.',
    h1: 'Weight malus in 2026: bands, allowances and the shared cap',
    intro: 'Enter the car’s mass in running order and its fuel: the tool splits the mass into bands, applies any allowance and the cap shared with the CO₂ malus.',
    resume: (h) => {
      const t = tr(h, '2026');
      return `The weight malus, officially the tax on mass in running order, is charged on top of the CO₂ malus when a passenger car is registered in France for the first time, new or imported. For a car registered in 2026, every kilo counts from ${h.num(seuil(h, '2026'))} kg, at a rate that rises in bands from ${h.eur(t[0].euro_kg)} to ${h.eur(dernier(h, '2026').euro_kg)} per kilo. The example published by the French administration, a ${h.num(EX)} kg car, comes to ${h.eur(h.M.malusMasseBrut(EX, '2026'))}. The scale stays the same in 2027. Electric and hydrogen cars have been exempt since the 2026 budget law, with no end date. Self-charging hybrids deduct ${h.num(h.P.malus_masse.hybrides[2].hybride)} kg from their mass; plug-in hybrids with more than ${h.num(h.P.malus_masse.phev.autonomie_min_km)} km of electric range deduct ${h.num(Number(h.P.malus_masse.hybrides[2].phev))} kg, up to ${h.pct(h.P.malus_masse.phev.plafond_part_masse, 0)} of the mass. Large families get ${h.num(h.P.malus_masse.famille.kg_par_enfant)} kg per child. Both maluses together never exceed the top of the CO₂ scale, ${h.eur(h.P.malus_co2.annees['2026'].plafond)} in 2026.`;
    },
    faqs: (h) => {
      const m27 = neuf(h, 1750, 'micro_hybride', { date: '2027-01-15' }), m26 = neuf(h, 1750, 'micro_hybride');
      return [
        { q: 'Which weight on my car’s paperwork does the French weight malus use?', a: `The mass in running order, shown in box G of the French registration certificate and on the certificate of conformity. It is the figure given on the certificate of conformity supplied with a new car. Small differences matter: above ${h.num(seuil(h, '2026'))} kg, each extra kilo is taxed at the rate of the band it falls into.` },
        { q: 'Does a mild hybrid registered in 2027 pay more weight malus than in 2026?', a: `Yes, because it loses its ${h.num(h.P.malus_masse.hybrides[2].micro)} kg allowance. For a 1,750 kg car the weight malus goes from ${h.eur(m26.masse)} in 2026 to ${h.eur(m27.masse)} in 2027, with the bands themselves unchanged. Full self-charging hybrids keep their allowance, and plug-in hybrids keep theirs too.` },
        { q: 'Is a van or a motorhome hit by the weight malus in France?', a: `No. The weight malus only applies to passenger cars. Car-derived vans have been exempt since ${h.date(h.P.camionnette_exemptee_des)}, and motorhomes, commercial vehicles and two-wheelers are outside its scope. A van may instead carry the transport vehicle tax, which depends on its gross vehicle weight and starts at ${h.eur(h.P.y2.bareme[0].montant)}.` },
        { q: 'Is the weight malus lower for a used car I import into France?', a: `Yes. It follows the scale of the year of first registration, then the same monthly age reduction as the CO₂ malus. A car first registered before ${h.date(h.P.malus_masse.premiere_annee)} pays none, since the tax did not exist yet. For a car first registered on ${h.date('2022-06-01')}, the reduction already reaches ${h.pct(h.M.coefficientDecote(h.M.moisEntames('2022-06-01', d0(h))), 0)}.` },
      ];
    },
    body: (h) => {
      const P = h.P.malus_masse;
      const rows = MASSES.map((kg) => [`${h.num(kg)} kg`, h.eur(h.M.malusMasseBrut(kg, '2026')), h.eur(h.M.malusMasseBrut(kg, '2024')), h.eur(h.M.malusMasseBrut(kg, '2022'))]);
      const t = tr(h, '2026');
      const ex = t.filter((x) => x.min <= EX).map((x) => {
        const hi = Math.min(EX, x.max ?? EX);
        return `${h.num(hi - x.min + 1)} kg at ${h.eur(x.euro_kg)}`;
      });
      const phev = neuf(h, 2100, 'hybride_rechargeable', { autonomieKm: 60 });
      const full = neuf(h, 1750, 'hybride');
      const plaf = neuf(h, 2300, 'essence', { gkm: 188 });
      const fam = neuf(h, 2000, 'essence', { enfants: h.P.malus_co2.famille.enfants_min });
      const minPart = Math.floor(Number(P.hybrides[2].phev) / P.phev.plafond_part_masse);
      const imp = h.M.malus({ gkm: 0, masseKg: EX, energie: 'essence', date1re: '2024-03-01', dateOp: d0(h), origine: 'import_occasion' });
      return `
<h2>The 2026 bands</h2>
<p>It works like a progressive income tax: the mass is cut into bands and each kilo is charged at the rate of its band. Kilos below the threshold cost nothing.</p>
${h.table(['Mass in running order', 'Rate per kilo'], lignesTranches(h, '2026', false), 'Cars first registered in 2026 or later.', ['l', 'r'])}
<p>For the ${h.num(EX)} kg car used as the example on the ${h.src('f35950', 'official weight malus page')}, you add ${ex.join(', ')}, which gives ${h.eur(h.M.malusMasseBrut(EX, '2026'))}.</p>

<h2>Earlier scales, which matter for imports</h2>
<p>A used import keeps the scale of the year it was first registered. In 2024 and 2025 the threshold was ${h.num(seuil(h, '2024'))} kg and the top rate of ${h.eur(dernier(h, '2024').euro_kg)} per kilo started at ${h.num(dernier(h, '2024').min)} kg. In 2022 and 2023 a single rate of ${h.eur(tr(h, '2022')[0].euro_kg)} applied from ${h.num(seuil(h, '2022'))} kg.</p>
${h.table(['Mass', '2026 scale', '2024-2025 scale', '2022-2023 scale'], rows, 'Gross weight malus, before allowances, age reduction or cap.', ['l', 'r', 'r', 'r'])}
<p>The ${h.src('l421_7_2', 'age reduction for imported vehicles')} then applies. A ${h.num(EX)} kg car first registered abroad on ${h.date('2024-03-01')} and re-registered in France on ${h.date(d0(h))} uses the 2024 scale: ${h.eur(imp.masseBrut)} before the reduction, ${h.eur(imp.masse)} after ${h.pct(imp.decote, 0)} off.</p>

<h2>Electric cars stay exempt</h2>
<p>The 2026 budget law rewrote ${h.src('l421_79', 'article L421-79 of the French tax code')}: electric and hydrogen cars are exempt, whether or not they carry an environmental score. The charge once planned from 1 July 2026 never came into force, and no future version of the text provides for it as of ${h.date(d0(h))}.</p>

<h2>Hybrids: the allowance depends on the technology</h2>
${h.table(['First registered', 'Mild hybrid', 'Self-charging hybrid', 'Plug-in hybrid'], hybRows(h, false), 'Kilos removed from the mass before the calculation.', ['l', 'r', 'r', 'r'])}
<p>The plug-in allowance requires more than ${h.num(P.phev.autonomie_min_km)} km of electric range and cannot exceed ${h.pct(P.phev.plafond_part_masse, 0)} of the mass. That limit only bites below ${h.num(minPart)} kg, which is already under the threshold, so in practice the full allowance always applies. A 2,100 kg plug-in hybrid is taxed on just ${h.num(phev.masseTaxable)} kg, which is ${h.eur(phev.masse)}. A 1,750 kg self-charging hybrid is taxed on ${h.num(full.masseTaxable)} kg, which is ${h.eur(full.masse)}.</p>

<h2>Large families and the shared cap</h2>
<p>With at least ${h.num(h.P.malus_co2.famille.enfants_min)} dependent children, the mass is reduced by ${h.num(P.famille.kg_par_enfant)} kg per child, for one car, as a refund after you have paid. A 2,000 kg car normally charged ${h.eur(neuf(h, 2000, 'essence').masse)} comes down to ${h.eur(fam.masse)} for a family with ${h.num(h.P.malus_co2.famille.enfants_min)} children.</p>
<p>The two maluses together cannot exceed the top amount of that year’s CO₂ scale. A 2,300 kg car at 188 g/km would owe ${h.eur(plaf.co2)} of CO₂ malus and ${h.eur(plaf.masseBrut)} of weight malus; the latter is cut to ${h.eur(plaf.masse)} so the total stays at ${h.eur(plaf.total)}.</p>

<h2>What the tool shows</h2>
<p>You enter the mass from box G, the fuel, the number of dependent children and, depending on the fuel, the plug-in hybrid’s electric range or the CO₂ figure used for the cap. The result lists the amount for each band, the allowance applied, the ${h.a('malus-co2', 'CO₂ malus')} of the same car and the total of both. It covers a new car registered today; for a used import, the age reduction is handled in the ${h.a('home', 'full calculation')}.</p>
`;
    },
  },
});
