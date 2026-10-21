import { defineGuide, type Helpers } from '../../lib/guide-types';

type Y = '2025' | '2026' | '2027';
const ANS: Y[] = ['2025', '2026', '2027'];
const LIGNES = [110, 115, 120, 125, 130, 140, 150, 160, 170, 180, 190];

const an = (h: Helpers, y: Y) => h.P.malus_co2.annees[y];
const premier = (h: Helpers, y: Y) => an(h, y).grille[0][1];
/** Dernier taux taxé selon la grille, avant le montant maximal. */
const dernierG = (h: Helpers, y: Y) => an(h, y).plafond_des - 1;
const ligne = (h: Helpers, g: number) => [`${h.num(g)} g/km`, ...ANS.map((y) => h.eur(h.M.malusCO2Brut(g, y)))];

/** Import d'occasion : 150 g/km, première immatriculation à l'étranger en juin 2023. */
const IMPORT_1RE = '2023-06-01';
const imp = (h: Helpers) => h.M.malus({ gkm: 150, masseKg: 0, energie: 'essence', date1re: IMPORT_1RE, dateOp: h.P.regional.date_releve, origine: 'import_occasion' });
const famille = (h: Helpers, enfants: number) => h.M.malus({ gkm: 170, masseKg: 0, energie: 'essence', date1re: h.P.regional.date_releve, dateOp: h.P.regional.date_releve, origine: 'france_neuf', enfants });

export default defineGuide({
  id: 'malus-co2',
  group: 'outils',
  order: 20,
  tool: 'co2',
  related: ['malus-masse', 'voiture-neuve', 'import-europe', 'calendrier-2027', 'electrique-hybride'],
  sources: ['l421_62', 'f35947', 'l421_7_2', 'cibs'],
  fr: {
    slug: 'malus-co2-2026',
    nav: 'Malus CO₂',
    card: 'Le malus écologique selon les émissions WLTP, barèmes 2025, 2026 et 2027, avec la décote des voitures importées.',
    title: 'Malus CO₂ 2026 : barème, seuil de 108 g et plafond 80 000 €',
    description: 'Malus CO₂ 2026 de 50 € à 108 g/km jusqu’à 80 000 €, barèmes 2025 et 2027, décote des voitures importées d’occasion, familles nombreuses et exonérations.',
    h1: 'Malus CO₂ en 2026 : barème, décote et exonérations',
    intro: 'Saisissez le taux de CO₂ de la voiture et sa date de première immatriculation : l’outil applique le bon barème, puis la décote s’il s’agit d’un import.',
    resume: (h) => {
      const a26 = an(h, '2026'), a27 = an(h, '2027'), a25 = an(h, '2025');
      return `Le malus CO₂ ne se paie qu’à un moment : quand une voiture particulière reçoit son tout premier titre français, qu’elle soit neuve ou importée. Son montant dépend du taux d’émission WLTP porté en case V.7 et du barème de l’année de première immatriculation, et non de l’année de commande. Pour une voiture immatriculée en 2026, il commence à ${h.eur(premier(h, '2026'))} à ${h.num(a26.seuil)} g/km et atteint ${h.eur(a26.plafond)} au-delà de ${h.num(dernierG(h, '2026'))} g/km. En 2027, le seuil descend à ${h.num(a27.seuil)} g/km et le montant maximal passe à ${h.eur(a27.plafond)}. De mars à décembre 2025, le barème partait de ${h.num(a25.seuil)} g/km, avec un maximum de ${h.eur(a25.plafond)}. Une voiture d’occasion importée garde le barème de l’année de sa première mise en circulation, même hors de France, puis profite d’une décote selon son âge en mois ; rien n’est dû si cette date précède le ${h.date(h.P.decote_import.zero_avant)}. Les voitures électriques et à hydrogène sont exonérées, et le malus au poids s’ajoute sous un plafond commun.`;
    },
    faqs: (h) => {
      const g = 140;
      const v26 = h.M.malusCO2Brut(g, '2026'), v27 = h.M.malusCO2Brut(g, '2027');
      const F = h.P.malus_co2.famille;
      return [
        { q: 'Le malus CO₂ revient-il chaque année ou à chaque revente ?', a: 'Ni l’un ni l’autre. Il est perçu une seule fois, sur le premier certificat d’immatriculation établi en France pour la voiture. Le deuxième, le troisième ou le dixième propriétaire ne le paie plus : à chaque revente, le nouveau titulaire ne règle que la taxe régionale et les frais fixes du titre.' },
        { q: 'Quel barème de malus CO₂ pour une voiture commandée en 2026 et livrée en 2027 ?', a: `Celui de 2027, car seule compte la date de la première immatriculation. Pour un modèle à ${h.num(g)} g/km, le malus passe ainsi de ${h.eur(v26)} à ${h.eur(v27)}. Si la livraison risque de glisser après le 31 décembre, demandez au vendeur à quelle date la voiture sera immatriculée, et non la date du bon de commande.` },
        { q: 'Une voiture importée d’Allemagne et mise en circulation en 2018 paie-t-elle le malus CO₂ ?', a: `Oui, si la date est postérieure au ${h.date(h.P.decote_import.zero_avant)}. Mais avant le ${h.date(h.P.malus_co2.premiere_annee_wltp)}, le montant suit l’ancien barème NEDC, que cet outil ne calcule pas. La décote liée à l’âge s’applique ensuite, ce qui réduit fortement la somme pour une voiture de plusieurs années.` },
        { q: 'Comment une famille nombreuse récupère-t-elle une partie du malus CO₂ ?', a: `À partir de ${h.num(F.enfants_min)} enfants à charge, chaque enfant retire ${h.num(F.g_par_enfant)} g/km au taux d’émission, et l’avantage vaut pour un véhicule du foyer. Le malus est d’abord payé en entier avec la carte grise, puis l’écart est remboursé sur demande, justificatifs à l’appui. L’outil montre directement le montant final.` },
      ];
    },
    body: (h) => {
      const d = h.P.regional.date_releve;
      const resum = ANS.map((y) => [y === '2025' ? '2025 (mars à décembre)' : y, `${h.num(an(h, y).seuil)} g/km`, h.eur(premier(h, y)), `${h.num(dernierG(h, y))} g/km`, h.eur(an(h, y).plafond)]);
      const i = imp(h);
      const a24 = h.M.anneeBareme('2025-02-15');
      const f0 = famille(h, 0), f3 = famille(h, h.P.malus_co2.famille.enfants_min);
      const dec = h.P.decote_import.grille.filter((x) => [12, 36, 60, 120, 180].includes(x.mois_max ?? 0));
      const E = h.P.malus_co2.e85;
      return `
<h2>Seuils et plafonds des trois barèmes</h2>
<p>Le ${h.src('l421_62', 'barème de l’article L421-62')} associe à chaque gramme de CO₂ un montant fixe : ce n’est pas un tarif par gramme, c’est une grille. Chaque année, elle se décale de ${h.num(an(h, '2026').seuil - an(h, '2027').seuil)} grammes vers le bas et le montant maximal augmente.</p>
${h.table(['Barème', 'Taxé dès', 'Premier montant', 'Dernier palier', 'Au-delà'], resum, 'Malus CO₂ des voitures neuves, selon l’année de première immatriculation.', ['l', 'r', 'r', 'r', 'r'])}
<p>Quelques lignes de la grille montrent l’effet du décalage : une même voiture paie davantage si elle est immatriculée un an plus tard.</p>
${h.table(['Émissions WLTP', '2025 (mars à déc.)', '2026', '2027'], LIGNES.map((g) => ligne(h, g)), 'Extraits du barème, montants en euros pour une voiture neuve.', ['l', 'r', 'r', 'r'])}

<h2>La date qui fixe le barème</h2>
<p>La loi retient la date de la première immatriculation, que rappelle la ${h.src('f35947', 'fiche officielle du malus CO₂')}. Une commande signée en 2026 pour une livraison en 2027 relève donc du barème 2027. Pour les voitures mises en circulation en janvier et février 2025, c’est encore le barème ${a24} qui s’applique, avec un seuil de ${h.num(h.P.malus_co2.annees[a24].seuil)} g/km ; le barème 2025 ne court qu’à partir du ${h.date(an(h, '2025').from)}.</p>

<h2>Voiture d’occasion importée : barème d’origine et décote</h2>
<p>Pour un import, on prend le barème de l’année où la voiture a été immatriculée pour la première fois, dans n’importe quel pays, puis on retire un ${h.src('l421_7_2', 'coefficient de décote')} qui dépend du nombre de mois écoulés, chaque mois entamé comptant. Le montant maximal est réduit dans la même proportion.</p>
<ul>
${dec.map((x) => `<li>jusqu’à ${h.num(x.mois_max ?? 0)} mois : ${h.pct(x.reduction, 0)} de réduction ;</li>`).join('\n')}
<li>au-delà du dernier palier, la réduction atteint ${h.pct(h.P.decote_import.grille[h.P.decote_import.grille.length - 1].reduction, 0)}.</li>
</ul>
<p>Exemple : une voiture à 150 g/km immatriculée en Belgique le ${h.date(IMPORT_1RE)} et réimmatriculée en France le ${h.date(d)} relève du barème ${i.annee}, soit ${h.eur(i.co2Brut)} avant décote. Avec une réduction de ${h.pct(i.decote, 0)}, il reste ${h.eur(i.co2)} à payer. Une première immatriculation antérieure au ${h.date(h.P.decote_import.zero_avant)} annule la taxe ; entre cette date et le ${h.date(h.P.malus_co2.premiere_annee_wltp)}, c’est le barème NEDC qui s’applique, et l’outil ne le calcule pas. À partir de 2027, la loi ajoute à la décote une composante liée à l’usage, que ce simulateur n’intègre pas encore.</p>

<h2>Abattements et exonérations</h2>
<ul>
<li><strong>Familles</strong> : dès ${h.num(h.P.malus_co2.famille.enfants_min)} enfants à charge, ${h.num(h.P.malus_co2.famille.g_par_enfant)} g/km de moins par enfant. Une voiture neuve à 170 g/km paie ${h.eur(f0.co2)} ; pour une famille de ${h.num(h.P.malus_co2.famille.enfants_min)} enfants, le taux retenu tombe à ${h.num(f3.gRetenu)} g/km et le malus à ${h.eur(f3.co2)}, la différence étant remboursée après coup.</li>
<li><strong>Superéthanol E85</strong> : les émissions sont réduites de ${h.pct(E.abattement, 0)}, sauf si elles dépassent ${h.num(E.taux_max_gkm)} g/km.</li>
<li><strong>Électrique et hydrogène</strong> : exonérés, quelle que soit la puissance.</li>
<li><strong>Handicap</strong> : exonération pour le titulaire de la carte mobilité inclusion mention invalidité, et pour tout véhicule accessible en fauteuil roulant.</li>
<li><strong>Hors champ</strong> : camionnettes depuis le ${h.date(h.P.camionnette_exemptee_des)}, camping-cars, utilitaires et deux-roues ne paient pas ce malus.</li>
</ul>

<h2>Ce que calcule l’outil</h2>
<p>Il lit le taux WLTP, le nombre d’enfants à charge et l’origine de la voiture : neuve immatriculée ce jour, ou importée d’occasion avec l’année et le mois de première immatriculation. Il affiche le malus du barème retenu, le montant avant décote et le pourcentage retiré pour un import, puis compare ce qu’une voiture neuve de même taux paierait en 2025, 2026 et 2027. Il ne gère pas l’E85 ; pour cela et pour le total de la carte grise, passez au ${h.a('home', 'calcul complet')}. Le ${h.a('malus-masse', 'malus au poids')} s’ajoute à ce montant.</p>
`;
    },
  },
  en: {
    slug: 'co2-malus-france',
    nav: 'CO₂ malus',
    card: 'France’s emissions tax on cars by WLTP figure, 2025, 2026 and 2027 scales, with the reduction for used imports.',
    title: 'CO₂ malus 2026 in France: scale from 108 g, cap of €80,000',
    description: 'CO₂ malus 2026 in France, from €50 at 108 g/km to €80,000: 2025 and 2027 scales, age reduction for used imports, large-family relief and exempt vehicles.',
    h1: 'CO₂ malus in 2026: scale, import reduction and exemptions',
    intro: 'Enter the car’s CO₂ figure and its first registration date: the tool picks the right scale, then applies the age reduction if the car is an import.',
    resume: (h) => {
      const a26 = an(h, '2026'), a27 = an(h, '2027'), a25 = an(h, '2025');
      return `The CO₂ malus is France’s one-off emissions tax on passenger cars, charged when a car is registered in France for the first time, whether it is brand new or a used import. The amount depends on the WLTP emissions figure in box V.7 of the registration certificate, and on the scale for the year of first registration rather than the year you ordered. For a car registered in 2026 it starts at ${h.eur(premier(h, '2026'))} at ${h.num(a26.seuil)} g/km and reaches ${h.eur(a26.plafond)} above ${h.num(dernierG(h, '2026'))} g/km. In 2027 the threshold drops to ${h.num(a27.seuil)} g/km and the maximum rises to ${h.eur(a27.plafond)}. From March to December 2025 the scale began at ${h.num(a25.seuil)} g/km, with a maximum of ${h.eur(a25.plafond)}. A used import keeps the scale of the year it was first registered anywhere, then gets a reduction based on its age in months; nothing is due if that date is before ${h.date(h.P.decote_import.zero_avant)}. Electric and hydrogen cars are exempt, and the weight malus is added under a shared cap.`;
    },
    faqs: (h) => {
      const g = 145;
      const v26 = h.M.malusCO2Brut(g, '2026'), v27 = h.M.malusCO2Brut(g, '2027');
      const F = h.P.malus_co2.famille;
      return [
        { q: 'Will I pay the CO₂ malus again when I sell the car in France?', a: 'No. The malus is charged once, on the first French registration certificate issued for that car. On a change of keeper the buyer pays only the regional tax and the small fixed charges for the new certificate, so a car that already carries French plates has its emissions tax behind it, whatever its CO₂ figure.' },
        { q: 'If I order in December 2026 and take delivery in January 2027, which CO₂ scale applies?', a: `The 2027 scale, because the registration date is what counts, not the order date. For a car at ${h.num(g)} g/km that moves the malus from ${h.eur(v26)} to ${h.eur(v27)}. When a delivery could slip into the new year, ask the dealer when the car will actually be registered.` },
        { q: 'I am moving to France with a car first registered in the UK in 2017: is there a CO₂ malus?', a: `Possibly, since the date is after ${h.date(h.P.decote_import.zero_avant)}. A car first registered before ${h.date(h.P.malus_co2.premiere_annee_wltp)} falls under the older NEDC scale, which this tool does not compute. The age reduction then applies and is large for a car of that age. Check the official simulator or ask the ANTS before importing.` },
        { q: 'How do large families claim back part of the CO₂ malus?', a: `With at least ${h.num(F.enfants_min)} dependent children, the emissions figure is cut by ${h.num(F.g_par_enfant)} g/km per child, for one car per household. You pay the full malus when registering, then apply for a refund of the difference with proof of the children in your care. The tool shows the final amount after the refund.` },
      ];
    },
    body: (h) => {
      const d = h.P.regional.date_releve;
      const resum = ANS.map((y) => [y === '2025' ? '2025 (March to December)' : y, `${h.num(an(h, y).seuil)} g/km`, h.eur(premier(h, y)), `${h.num(dernierG(h, y))} g/km`, h.eur(an(h, y).plafond)]);
      const i = imp(h);
      const a24 = h.M.anneeBareme('2025-02-15');
      const f0 = famille(h, 0), f3 = famille(h, h.P.malus_co2.famille.enfants_min);
      const dec = h.P.decote_import.grille.filter((x) => [12, 36, 60, 120, 180].includes(x.mois_max ?? 0));
      const E = h.P.malus_co2.e85;
      return `
<h2>Thresholds and caps of the three scales</h2>
<p>The ${h.src('l421_62', 'scale in article L421-62 of the French tax code')} gives a fixed amount for each gram of CO₂: it is a lookup grid, not a price per gram. Each year the grid shifts ${h.num(an(h, '2026').seuil - an(h, '2027').seuil)} grams lower and the top amount goes up.</p>
${h.table(['Scale', 'Taxed from', 'First amount', 'Last step', 'Above that'], resum, 'CO₂ malus for new cars, by year of first registration.', ['l', 'r', 'r', 'r', 'r'])}
<p>A few rows of the grid show what the shift means: the same car costs more if it is registered a year later.</p>
${h.table(['WLTP emissions', '2025 (Mar to Dec)', '2026', '2027'], LIGNES.map((g) => ligne(h, g)), 'Extracts from the scale, amounts in euros for a new car.', ['l', 'r', 'r', 'r'])}

<h2>The date that picks the scale</h2>
<p>French law uses the date of first registration, as the ${h.src('f35947', 'official CO₂ malus page on service-public.gouv.fr')} explains. An order signed in 2026 for delivery in 2027 therefore falls under the 2027 scale. Cars first registered in January or February 2025 still use the ${a24} scale, which started at ${h.num(h.P.malus_co2.annees[a24].seuil)} g/km; the 2025 scale only runs from ${h.date(an(h, '2025').from)}.</p>

<h2>Used imports: original scale, then an age reduction</h2>
<p>For a car you bring into France second-hand, the scale is the one for the year it was first registered in any country. A ${h.src('l421_7_2', 'depreciation coefficient')} based on the number of months since then is deducted, every started month counting, and the maximum is reduced in the same proportion.</p>
<ul>
${dec.map((x) => `<li>up to ${h.num(x.mois_max ?? 0)} months: ${h.pct(x.reduction, 0)} off;</li>`).join('\n')}
<li>beyond the last step, the reduction reaches ${h.pct(h.P.decote_import.grille[h.P.decote_import.grille.length - 1].reduction, 0)}.</li>
</ul>
<p>Example: a car rated at 150 g/km, first registered in Belgium on ${h.date(IMPORT_1RE)} and re-registered in France on ${h.date(d)}, falls under the ${i.annee} scale, which gives ${h.eur(i.co2Brut)} before the reduction. With ${h.pct(i.decote, 0)} off, ${h.eur(i.co2)} remains to pay. A first registration before ${h.date(h.P.decote_import.zero_avant)} cancels the tax; between that date and ${h.date(h.P.malus_co2.premiere_annee_wltp)} the older NEDC scale applies and this tool does not compute it. From 2027 the law adds a usage-based component to the reduction, which this tool does not yet include.</p>

<h2>Reliefs and exemptions</h2>
<ul>
<li><strong>Large families</strong>: from ${h.num(h.P.malus_co2.famille.enfants_min)} dependent children, ${h.num(h.P.malus_co2.famille.g_par_enfant)} g/km less per child. A new car at 170 g/km pays ${h.eur(f0.co2)}; for a family with ${h.num(h.P.malus_co2.famille.enfants_min)} children the figure counted falls to ${h.num(f3.gRetenu)} g/km and the malus to ${h.eur(f3.co2)}, the difference being refunded afterwards.</li>
<li><strong>E85 flex-fuel</strong>: emissions are cut by ${h.pct(E.abattement, 0)}, unless they exceed ${h.num(E.taux_max_gkm)} g/km.</li>
<li><strong>Electric and hydrogen</strong>: exempt, whatever the power.</li>
<li><strong>Disability</strong>: exempt for holders of the French disability mobility card (CMI invalidité) and for any wheelchair-accessible vehicle.</li>
<li><strong>Out of scope</strong>: car-derived vans since ${h.date(h.P.camionnette_exemptee_des)}, motorhomes, commercial vehicles and two-wheelers do not pay this malus.</li>
</ul>

<h2>What the tool works out</h2>
<p>It takes the WLTP figure, the number of dependent children and where the car comes from: new and registered today, or a used import with the year and month of first registration. It shows the malus for the scale that applies, the amount before reduction and the percentage removed for an import, then what a new car with the same figure would pay in 2025, 2026 and 2027. It does not handle E85; for that and for the full registration cost, use the ${h.a('home', 'full calculation')}. The ${h.a('malus-masse', 'weight malus')} comes on top.</p>
`;
    },
  },
});
