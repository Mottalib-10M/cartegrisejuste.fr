import { defineGuide, type Helpers } from '../../lib/guide-types';

type Energie = 'essence' | 'micro_hybride' | 'hybride' | 'electrique';
interface Voiture { fr: string; en: string; cv: number; g: number; kg: number; energie: Energie }
/** Voitures neuves d'exemple, choisies pour couvrir les cas qui bougent au passage à 2027. */
const VOITURES: Voiture[] = [
  { fr: 'Citadine essence, 4 CV, 106 g, 1 120 kg', en: 'Petrol city car, 4 CV, 106 g, 1,120 kg', cv: 4, g: 106, kg: 1120, energie: 'essence' },
  { fr: 'Compacte essence, 6 CV, 118 g, 1 340 kg', en: 'Petrol hatchback, 6 CV, 118 g, 1,340 kg', cv: 6, g: 118, kg: 1340, energie: 'essence' },
  { fr: 'SUV micro-hybride, 7 CV, 128 g, 1 560 kg', en: 'Mild-hybrid SUV, 7 CV, 128 g, 1,560 kg', cv: 7, g: 128, kg: 1560, energie: 'micro_hybride' },
  { fr: 'Break hybride, 8 CV, 112 g, 1 690 kg', en: 'Full-hybrid estate, 8 CV, 112 g, 1,690 kg', cv: 8, g: 112, kg: 1690, energie: 'hybride' },
  { fr: 'Électrique, 6 CV, 0 g, 1 950 kg', en: 'Electric car, 6 CV, 0 g, 1,950 kg', cv: 6, g: 0, kg: 1950, energie: 'electrique' },
  { fr: 'SUV essence, 11 CV, 176 g, 1 840 kg', en: 'Petrol SUV, 11 CV, 176 g, 1,840 kg', cv: 11, g: 176, kg: 1840, energie: 'essence' },
];
const DEC = '2026-12-15';
const JAN = '2027-01-15';
const neuve = (h: Helpers, v: Voiture, region: string, date: string) =>
  h.M.coutCarteGrise({ demarche: 'immat', region, origine: 'france_neuf', energie: v.energie, genre: 'vp', cv: v.cv, gkm: v.g, masseKg: v.kg, ptacKg: 0, date1re: date, dateOp: date });
const occasion = (h: Helpers, region: string, cv: number, date: string) =>
  h.M.coutCarteGrise({ demarche: 'titulaire', region, origine: 'france_occasion', energie: 'essence', genre: 'vp', cv, gkm: 0, masseKg: 0, ptacKg: 0, date1re: '2021-06-01', dateOp: date });
const co2 = (h: Helpers) => ({ a: h.P.malus_co2.annees['2026'], b: h.P.malus_co2.annees['2027'] });
const idfm = (h: Helpers) => ({ a: h.M.majorationIdfm(DEC), b: h.M.majorationIdfm(JAN), plafond: h.P.idfm.plafond_legal, debut: h.P.idfm.periodes[1].from });
const micro = (h: Helpers) => ({ a: h.M.abattementHybride('micro_hybride', DEC, 1500) as number, b: h.M.abattementHybride('micro_hybride', JAN, 1500) as number });
const lignes = (h: Helpers, l: 'fr' | 'en') =>
  VOITURES.map((v) => {
    const a = neuve(h, v, 'ile-de-france', DEC).total;
    const b = neuve(h, v, 'ile-de-france', JAN).total;
    const e = b - a;
    return [v[l], h.eur2(a), h.eur2(b), (e > 0 ? '+' : '') + h.eur(e)];
  });
const GRAMMES = [104, 108, 115, 125, 140, 160, 180, 189];
const lignesCo2 = (h: Helpers) => GRAMMES.map((g) => [`${h.num(g)} g/km`, h.eur(h.M.malusCO2Brut(g, '2026')), h.eur(h.M.malusCO2Brut(g, '2027')), h.eur(h.M.malusCO2Brut(g, '2027') - h.M.malusCO2Brut(g, '2026'))]);

export default defineGuide({
  id: 'calendrier-2027',
  group: 'guides',
  order: 20,
  mini: 'calendrier2027',
  miniHref: 'home',
  related: ['malus-co2', 'malus-masse', 'voiture-neuve', 'region-ile-de-france', 'import-europe', 'electrique-hybride'],
  sources: ['l421_62', 'lfi2026', 'idfm', 'l421_7_2', 'cgi298', 'f35947'],
  fr: {
    slug: 'calendrier-2027',
    nav: 'Ce qui change en 2027',
    card: 'Malus abaissé, majoration francilienne réduite, micro-hybrides sans abattement : la carte grise au 1er janvier 2027.',
    title: 'Carte grise 2027 : tout ce qui change au 1er janvier',
    description: 'Carte grise 2027 : malus CO₂ dès 103 g/km et plafond à 90 000 €, majoration IDFM ramenée à 12 €/CV, micro-hybrides sans abattement, décote des imports revue.',
    h1: 'Carte grise : ce qui change le 1er janvier 2027',
    intro: 'Le calcul compare la même voiture neuve immatriculée en décembre 2026 puis en janvier 2027, dans la région de votre choix.',
    resume: (h) => {
      const c = co2(h), m = idfm(h), mh = micro(h);
      return `Au ${h.date(c.b.from)}, trois règles bougent pour la carte grise d’une voiture neuve ou importée, et une pour les Franciliens. Le malus CO₂ commence à ${h.num(c.b.seuil)} g/km au lieu de ${h.num(c.a.seuil)}, et son maximum passe de ${h.eur(c.a.plafond)} à ${h.eur(c.b.plafond)}, atteint au-delà de ${h.num(c.b.plafond_des - 1)} g/km ; chaque ligne du barème coûte plus cher. Le malus au poids garde son barème, mais les micro-hybrides perdent leur abattement de ${h.num(mh.a)} kg. En Île-de-France, la majoration d’Île-de-France Mobilités descend de ${h.eur2(m.a)} à ${h.eur2(m.b)} par cheval fiscal, sauf délibération qui peut la porter jusqu’à ${h.eur2(m.plafond)}. Le coefficient de décote des imports d’occasion ajoute une composante liée à l’usage, dont le détail n’a pas encore pu être lu. Au ${h.date(h.P.regional.date_releve)}, aucune région n’a annoncé de nouveau tarif pour 2027. Conséquence pratique : une voiture à malus a intérêt à être immatriculée avant le ${h.date(c.b.from)}, une voiture sans malus en Île-de-France après.`;
    },
    faqs: (h) => {
      const c = co2(h), m = idfm(h), mh = micro(h);
      return [
        { q: 'En 2027, à partir de combien de grammes de CO₂ une voiture neuve paie-t-elle un malus ?', a: `À partir de ${h.num(c.b.seuil)} g/km en cycle WLTP, contre ${h.num(c.a.seuil)} g/km en 2026. La première ligne coûte ${h.eur(h.M.malusCO2Brut(c.b.seuil, '2027'))}, puis le barème monte chaque gramme jusqu’au plafond de ${h.eur(c.b.plafond)}. Ce barème vise les voitures dont la première immatriculation a lieu à partir du ${h.date(c.b.from)}, en France comme à l’étranger.` },
        { q: 'La majoration francilienne de la carte grise baisse-t-elle vraiment en 2027 ?', a: `La loi de finances pour 2026 la fixe à ${h.eur2(m.b)} par cheval à partir du ${h.date(m.debut)}, contre ${h.eur2(m.a)} depuis mars 2026. Île-de-France Mobilités peut délibérer pour un autre montant, dans la limite de ${h.eur2(m.plafond)}. Aucune délibération de ce type n’était connue au ${h.date(h.P.regional.date_releve)} ; le simulateur applique donc le montant par défaut.` },
        { q: 'Une voiture commandée en 2026 et livrée en 2027 paie-t-elle le barème 2027 ?', a: `Oui, si elle est immatriculée en 2027. Le barème retenu est celui de la date de première immatriculation, jamais celui de la commande ou du bon de livraison. Si votre voiture émet au moins ${h.num(c.b.seuil)} g/km, demandez au vendeur d’immatriculer avant la fin de décembre, quitte à la stocker quelques jours, ou chiffrez l’écart avec le calcul de cette page.` },
        { q: 'Les régions augmenteront-elles le cheval fiscal en 2027 ?', a: `Aucune hausse n’était votée au ${h.date(h.P.regional.date_releve)}. Une région peut délibérer à tout moment, et le nouveau tarif s’applique en général le premier jour du deuxième mois après le vote. Celles qui sont déjà au plafond de ${h.eur2(h.P.regional.plafond_cv)} par cheval ne peuvent plus monter. Les tarifs du site sont revus à chaque délibération publiée.` },
        { q: 'Qu’est-ce qui change en 2027 pour une voiture micro-hybride ?', a: `Elle perd l’abattement de ${h.num(mh.a)} kg sur le malus au poids : toute la masse au-delà du seuil devient taxable. Pour une micro-hybride de 1 560 kg, le malus au poids passe de ${h.eur(h.M.malusMasseBrut(1560 - mh.a, '2026'))} en 2026 à ${h.eur(h.M.malusMasseBrut(1560 - mh.b, '2026'))} en 2027. Les hybrides classiques gardent leur abattement, et les hybrides rechargeables à grande autonomie aussi.` },
        { q: 'Comment la décote d’un import d’occasion évolue-t-elle en 2027 ?', a: 'Le coefficient devient la somme de deux parts, plafonnée à cent pour cent : l’ancienneté, calculée comme aujourd’hui sur l’âge en mois, et une part liée à l’usage, définie par un article dont le texte n’a pas pu être lu. Le simulateur n’applique que la part d’ancienneté : pour un import de 2027, il donne un malus au plus égal à celui qui sera dû.' },
        { q: 'La règle de TVA des voitures importées presque neuves change-t-elle en 2027 ?', a: `Le texte change de code : au ${h.date(c.b.from)}, la TVA quitte le code général des impôts pour le code des impositions sur les biens et services. Le critère actuel, ${h.num(h.P.tva_import.mois_max)} mois ou ${h.num(h.P.tva_import.km_max)} km au plus, vient de l’article 298 sexies. Aucune modification de fond de ce critère n’a été relevée.` },
      ];
    },
    body: (h) => {
      const c = co2(h), m = idfm(h), mh = micro(h);
      const sansMalus = VOITURES[0];
      const bzh = [neuve(h, VOITURES[4], 'bretagne', DEC).total, neuve(h, VOITURES[4], 'bretagne', JAN).total];
      const oA = occasion(h, 'ile-de-france', 6, DEC), oB = occasion(h, 'ile-de-france', 6, JAN);
      return `
<h2>Le calendrier en un coup d’œil</h2>
<ul>
<li><strong>Malus CO₂</strong> : seuil abaissé de ${h.num(c.a.seuil)} à ${h.num(c.b.seuil)} g/km, plafond relevé de ${h.eur(c.a.plafond)} à ${h.eur(c.b.plafond)}.</li>
<li><strong>Malus au poids</strong> : barème inchangé, premier kilo taxé à ${h.num(h.P.malus_masse.annees['2026'].tranches[0].min)} kg ; les micro-hybrides perdent leur abattement.</li>
<li><strong>Véhicules d’au moins huit places détenus par une société</strong> : l’abattement en grammes et en chevaux applicable au malus CO₂ est relevé, comme chaque année depuis 2025.</li>
<li><strong>Majoration francilienne</strong> : de ${h.eur2(m.a)} à ${h.eur2(m.b)} par cheval, sauf délibération dans la limite de ${h.eur2(m.plafond)}.</li>
<li><strong>Imports d’occasion</strong> : décote composée d’une part d’ancienneté et d’une part d’usage.</li>
<li><strong>TVA des imports</strong> : ses règles changent de code au 1er janvier, sans changement de seuil connu.</li>
<li><strong>Tarifs régionaux</strong> : aucun changement voté au ${h.date(h.P.regional.date_releve)}.</li>
</ul>

<h2>Le malus CO₂ décale tout son barème</h2>
<p>Le ${h.src('l421_62', 'barème de l’article L421-62')} prévoit une colonne par année de première immatriculation. Celle de 2027 commence ${h.num(c.a.seuil - c.b.seuil)} grammes plus bas que celle de 2026 : à un taux donné, le malus de 2027 correspond à celui qu’aurait payé en 2026 une voiture émettant ${h.num(c.a.seuil - c.b.seuil)} grammes de plus. Le plafond de ${h.eur(c.b.plafond)} s’applique au-delà de ${h.num(c.b.plafond_des - 1)} g/km. La version de cet article applicable en 2027 est déjà publiée ; aucun barème au-delà n’y figure.</p>
${h.table(['Émissions WLTP', 'Malus 2026', 'Malus 2027', 'Hausse'], lignesCo2(h), 'Malus CO₂ d’une voiture neuve selon son année de première immatriculation, avant tout abattement.', ['l', 'r', 'r', 'r'])}
<p>Le barème retenu reste celui de la date de première immatriculation, comme le rappelle la ${h.src('f35947', 'fiche officielle du malus CO₂')}. Une voiture commandée en octobre 2026 et immatriculée le 4 janvier 2027 suit la colonne 2027. Le plafond commun aux deux malus suit le même mouvement : le malus au poids s’arrête là où la somme atteint ${h.eur(c.b.plafond)}, au lieu de ${h.eur(c.a.plafond)}.</p>

<h2>Le malus au poids garde son barème</h2>
<p>Aucune nouvelle grille n’est prévue pour 2027 : les tranches de 2026 continuent de s’appliquer, de ${h.eur(h.P.malus_masse.annees['2026'].tranches[0].euro_kg)} à ${h.eur(h.P.malus_masse.annees['2026'].tranches[h.P.malus_masse.annees['2026'].tranches.length - 1].euro_kg)} par kilo. La seule nouveauté vise les micro-hybrides, dont l’abattement passe de ${h.num(mh.a)} kg à ${h.num(mh.b)}. Les hybrides non rechargeables gardent ${h.num(h.M.abattementHybride('hybride', JAN, 1500) as number)} kg ; les hybrides rechargeables d’autonomie suffisante gardent le leur, plafonné à ${h.pct(h.P.malus_masse.phev.plafond_part_masse, 0)} de la masse. Les voitures électriques et à hydrogène restent exonérées des deux malus, sans date de fin dans le texte en vigueur. Le détail par tranche est sur la page du ${h.a('malus-masse', 'malus au poids')}.</p>

<h2>Six voitures neuves, décembre 2026 contre janvier 2027</h2>
<p>Le tableau ci-dessous calcule le coût total de la carte grise d’une même voiture neuve en Île-de-France, immatriculée le ${h.date(DEC)} puis le ${h.date(JAN)}. Il cumule donc la baisse de la majoration francilienne et la hausse des malus.</p>
${h.table(['Voiture neuve', h.date(DEC), h.date(JAN), 'Écart'], lignes(h, 'fr'), 'Coût total en Île-de-France, tarifs régionaux actuels, sans abattement familial.', ['l', 'r', 'r', 'r'])}
<p>La citadine, sous le seuil en 2026, devient taxée en 2027. La micro-hybride cumule la hausse du malus CO₂ et la perte de son abattement de poids. L’électrique, exonérée des malus, ne voit que la baisse de la majoration : elle gagne à attendre janvier. Hors Île-de-France, cette baisse n’existe pas : la même électrique coûte en Bretagne ${h.eur2(bzh[0])} en décembre et ${h.eur2(bzh[1])} en janvier.</p>

<h2>Île-de-France : la majoration redescend</h2>
<p>La majoration au profit d’Île-de-France Mobilités, créée par l’${h.src('lfi2026', 'article 60 de la loi de finances pour 2026')}, vaut ${h.eur2(m.a)} par cheval du ${h.date(h.P.idfm.periodes[0].from)} au ${h.date(h.P.idfm.periodes[0].to!)}, par dérogation au plafond de ${h.eur2(m.plafond)} inscrit à l’${h.src('idfm', 'article L421-54-1')}. À partir du ${h.date(m.debut)}, le montant par défaut est de ${h.eur2(m.b)}. Pour une occasion de 6 CV âgée de moins de ${h.num(h.P.regional.age_reduction_ans)} ans, la carte grise passe de ${h.eur2(oA.total)} à ${h.eur2(oB.total)}. La majoration suit les mêmes réductions que la taxe régionale : moitié à ${h.num(h.P.regional.age_reduction_ans)} ans, moitié pour les motos. Si Île-de-France Mobilités délibère pour un montant supérieur, la baisse sera moindre ; la page ${h.a('region-ile-de-france', 'Île-de-France')} sera alors mise à jour.</p>

<h2>Imports : une décote en deux parts</h2>
<p>Pour une voiture d’occasion importée, le malus est réduit par un coefficient lié à l’âge en mois, fixé par l’${h.src('l421_7_2', 'article L421-7-2')} : de ${h.pct(h.P.decote_import.grille[0].reduction, 0)} dès le premier mois jusqu’à ${h.pct(1, 0)} au-delà de ${h.num(h.P.decote_import.grille[h.P.decote_import.grille.length - 2].mois_max! / 12)} ans. À partir de 2027, ce coefficient devient la somme de cette part d’ancienneté et d’une part d’usage, définie à l’article L421-7-3, dans la limite de ${h.pct(1, 0)}. Le contenu de cet article n’a pas pu être lu à la source : le simulateur ne retient que la part d’ancienneté, et son résultat pour un import de 2027 est donc un maximum. Le malus reste nul pour une voiture mise en circulation avant le ${h.date(h.P.decote_import.zero_avant)}. La marche à suivre est sur la page ${h.a('import-europe', 'véhicule importé d’Europe')}.</p>
<p>Côté TVA, le texte change de place sans changer, à ce jour, de critère : au ${h.date(c.b.from)}, les règles quittent le code général des impôts, dont l’${h.src('cgi298', 'article 298 sexies')} définit le moyen de transport neuf (au plus ${h.num(h.P.tva_import.mois_max)} mois ou ${h.num(h.P.tva_import.km_max)} km), pour le code des impositions sur les biens et services.</p>

<h2>Immatriculer avant ou après le 1er janvier</h2>
<ul>
<li><strong>Voiture neuve à malus</strong> : avant. Toute voiture thermique à partir de ${h.num(c.b.seuil)} g/km paie plus en 2027, et une micro-hybride au-dessus du seuil de masse aussi.</li>
<li><strong>Voiture électrique en Île-de-France</strong> : après. Le gain est de ${h.eur2(m.a - m.b)} par cheval, sans malus à craindre.</li>
<li><strong>Voiture sans malus dans les deux barèmes</strong>, comme une essence de 4 CV à ${h.num(sansMalus.g - 4)} g/km : indifférent hors Île-de-France, après en Île-de-France.</li>
<li><strong>Occasion déjà immatriculée en France</strong> : aucun malus. En Île-de-France, attendre janvier économise ${h.eur2(m.a - m.b)} par cheval, dans le délai d’un mois laissé après l’achat.</li>
</ul>
<p>La carte grise d’une occasion se demande au plus tard ${h.num(h.P.national.delai_titulaire_mois)} mois après l’achat ; au-delà, l’amende forfaitaire est de ${h.eur(h.P.national.amende_titulaire)}. Pour une voiture neuve, c’est souvent le vendeur qui immatricule : demandez-lui la date prévue. Le calcul en haut de page compare décembre et janvier pour votre voiture, région, puissance, CO₂ et masse compris ; le lien du calcul complet permet de tester une autre date.</p>
`;
    },
  },
  en: {
    slug: '2027-changes',
    nav: '2027 changes',
    card: 'Lower malus threshold, smaller Paris-region surcharge, no allowance for mild hybrids: registration costs from 1 January 2027.',
    title: '2027 car registration changes in France: malus, IDFM, VAT',
    description: 'French registration in 2027: CO₂ malus from 103 g/km capped at €90,000, Paris-region surcharge cut to €12 per CV, mild hybrids lose their weight allowance.',
    h1: 'What changes for French car registration on 1 January 2027',
    intro: 'The calculation compares the same new car registered in December 2026 and in January 2027, in the region you choose.',
    resume: (h) => {
      const c = co2(h), m = idfm(h), mh = micro(h);
      return `On ${h.date(c.b.from)}, three rules change for registering a new or imported car in France, plus one for Paris-region residents. The CO₂ malus, France’s one-off pollution tax on cars, starts at ${h.num(c.b.seuil)} g/km instead of ${h.num(c.a.seuil)}, and its maximum rises from ${h.eur(c.a.plafond)} to ${h.eur(c.b.plafond)}, reached above ${h.num(c.b.plafond_des - 1)} g/km; every step of the scale costs more. The weight malus keeps its scale, but mild hybrids lose their ${h.num(mh.a)} kg allowance. In Île-de-France, the Île-de-France Mobilités surcharge falls from ${h.eur2(m.a)} to ${h.eur2(m.b)} per fiscal horsepower, unless the transport authority votes a figure of up to ${h.eur2(m.plafond)}. The depreciation applied to used imports gains a usage-based component whose wording could not yet be read. On ${h.date(h.P.regional.date_releve)}, no region had announced a new rate for 2027. In practice, a car facing a malus should be registered before ${h.date(c.b.from)}, and a malus-free car in the Paris region after it.`;
    },
    faqs: (h) => {
      const c = co2(h), m = idfm(h), mh = micro(h);
      return [
        { q: 'What CO₂ level triggers the French malus on a car first registered in 2027?', a: `${h.num(c.b.seuil)} g/km under the WLTP cycle, down from ${h.num(c.a.seuil)} g/km in 2026. The first step costs ${h.eur(h.M.malusCO2Brut(c.b.seuil, '2027'))}, and the scale then climbs gram by gram to the ${h.eur(c.b.plafond)} cap. It applies to cars whose first registration, in France or abroad, takes place on or after ${h.date(c.b.from)}.` },
        { q: 'Is the Paris-region registration surcharge really going down in 2027?', a: `The 2026 Finance Act sets it at ${h.eur2(m.b)} per horsepower from ${h.date(m.debut)}, against ${h.eur2(m.a)} since March 2026. Île-de-France Mobilités, the regional transport authority, may vote a different figure up to ${h.eur2(m.plafond)}. No such vote was known on ${h.date(h.P.regional.date_releve)}, so the calculator uses the default amount.` },
        { q: 'I ordered my car in 2026 but it arrives in 2027: which malus scale applies?', a: `The 2027 scale, if the car is registered in 2027. What counts is the date of first registration, never the order date or the delivery note. If your car emits ${h.num(c.b.seuil)} g/km or more, ask the dealer to register it before the end of December, even if you collect it later, or price the gap with the calculator on this page.` },
        { q: 'Are French regions raising their horsepower rates for 2027?', a: `None had voted an increase by ${h.date(h.P.regional.date_releve)}. A region can vote at any time, and a new rate usually applies from the first day of the second month after the vote. Regions already at the legal cap of ${h.eur2(h.P.regional.plafond_cv)} per horsepower cannot go higher. This site revises its rates whenever a resolution is published.` },
        { q: 'How does 2027 affect the registration cost of a mild-hybrid car?', a: `It loses the ${h.num(mh.a)} kg allowance on the weight malus, so all the mass above the threshold becomes taxable. For a 1,560 kg mild hybrid, the weight malus goes from ${h.eur(h.M.malusMasseBrut(1560 - mh.a, '2026'))} in 2026 to ${h.eur(h.M.malusMasseBrut(1560 - mh.b, '2026'))} in 2027. Full hybrids keep their allowance, and so do plug-in hybrids with enough electric range.` },
        { q: 'What happens to the malus discount on used imports from 2027?', a: 'The depreciation rate becomes the sum of two parts, capped at one hundred per cent: an age part, worked out on the age in months as today, and a usage part set by an article whose text could not be read. The calculator only applies the age part, so for a 2027 import it shows a malus no higher than the one actually due.' },
        { q: 'Does the VAT rule for nearly new imported cars change in 2027?', a: `The rule moves to a different code: on ${h.date(c.b.from)}, VAT leaves the General Tax Code for the code of taxes on goods and services. The current test, at most ${h.num(h.P.tva_import.mois_max)} months or ${h.num(h.P.tva_import.km_max)} km, comes from article 298 sexies. No change to the substance of that test has been found.` },
      ];
    },
    body: (h) => {
      const c = co2(h), m = idfm(h), mh = micro(h);
      const sansMalus = VOITURES[0];
      const bzh = [neuve(h, VOITURES[4], 'bretagne', DEC).total, neuve(h, VOITURES[4], 'bretagne', JAN).total];
      const oA = occasion(h, 'ile-de-france', 6, DEC), oB = occasion(h, 'ile-de-france', 6, JAN);
      return `
<h2>The timetable at a glance</h2>
<ul>
<li><strong>CO₂ malus</strong>: threshold lowered from ${h.num(c.a.seuil)} to ${h.num(c.b.seuil)} g/km, cap raised from ${h.eur(c.a.plafond)} to ${h.eur(c.b.plafond)}.</li>
<li><strong>Weight malus</strong>: same scale, first taxed kilo at ${h.num(h.P.malus_masse.annees['2026'].tranches[0].min)} kg; mild hybrids lose their allowance.</li>
<li><strong>Vehicles with eight seats or more owned by a company</strong>: the gram and horsepower allowance on the CO₂ malus goes up again, as it has every year since 2025.</li>
<li><strong>Paris-region surcharge</strong>: from ${h.eur2(m.a)} to ${h.eur2(m.b)} per horsepower, unless a vote sets up to ${h.eur2(m.plafond)}.</li>
<li><strong>Used imports</strong>: depreciation made of an age part and a usage part.</li>
<li><strong>VAT on imports</strong>: moved into the code of taxes on goods and services.</li>
<li><strong>Regional rates</strong>: no change voted as of ${h.date(h.P.regional.date_releve)}.</li>
</ul>

<h2>The CO₂ malus shifts its whole scale</h2>
<p>The ${h.src('l421_62', 'article L421-62 scale')} has one column per year of first registration. The 2027 column starts ${h.num(c.a.seuil - c.b.seuil)} grams lower than the 2026 one, so a given emission level in 2027 costs what a car emitting ${h.num(c.a.seuil - c.b.seuil)} grams more paid in 2026. The ${h.eur(c.b.plafond)} cap applies above ${h.num(c.b.plafond_des - 1)} g/km. The 2027 version of the article is already published and contains no scale for later years.</p>
${h.table(['WLTP emissions', '2026 malus', '2027 malus', 'Increase'], lignesCo2(h), 'CO₂ malus on a new car by year of first registration, before any allowance.', ['l', 'r', 'r', 'r'])}
<p>The scale is always the one for the date of first registration, as the ${h.src('f35947', 'official CO₂ malus page')} points out. A car ordered in October 2026 and registered on 4 January 2027 falls in the 2027 column. The joint cap on the two maluses follows suit: the weight malus stops where the total reaches ${h.eur(c.b.plafond)} instead of ${h.eur(c.a.plafond)}.</p>

<h2>The weight malus keeps its scale</h2>
<p>No new weight scale is planned for 2027: the 2026 bands carry on, from ${h.eur(h.P.malus_masse.annees['2026'].tranches[0].euro_kg)} to ${h.eur(h.P.malus_masse.annees['2026'].tranches[h.P.malus_masse.annees['2026'].tranches.length - 1].euro_kg)} per kilo. The only change concerns mild hybrids, whose allowance drops from ${h.num(mh.a)} kg to ${h.num(mh.b)}. Full hybrids keep ${h.num(h.M.abattementHybride('hybride', JAN, 1500) as number)} kg; plug-in hybrids with enough range keep theirs, capped at ${h.pct(h.P.malus_masse.phev.plafond_part_masse, 0)} of the mass. Electric and hydrogen cars stay exempt from both maluses, with no end date in the current text. Band-by-band figures are on the ${h.a('malus-masse', 'weight malus')} page.</p>

<h2>Six new cars, December 2026 against January 2027</h2>
<p>The table works out the full registration cost of the same new car in Île-de-France, registered on ${h.date(DEC)} and then on ${h.date(JAN)}. It therefore combines the smaller Paris-region surcharge with the higher maluses.</p>
${h.table(['New car', h.date(DEC), h.date(JAN), 'Difference'], lignes(h, 'en'), 'Total cost in Île-de-France, current regional rates, no large-family allowance.', ['l', 'r', 'r', 'r'])}
<p>The city car, below the threshold in 2026, becomes taxable in 2027. The mild hybrid takes both the higher CO₂ malus and the loss of its weight allowance. The electric car, exempt from both maluses, only sees the lower surcharge and gains by waiting for January. Outside the Paris region there is no such cut: the same electric car costs ${h.eur2(bzh[0])} in Brittany in December and ${h.eur2(bzh[1])} in January.</p>

<h2>Île-de-France: the surcharge comes down</h2>
<p>The Île-de-France Mobilités surcharge, created by ${h.src('lfi2026', 'article 60 of the 2026 Finance Act')}, is ${h.eur2(m.a)} per horsepower from ${h.date(h.P.idfm.periodes[0].from)} to ${h.date(h.P.idfm.periodes[0].to!)}, overriding the ${h.eur2(m.plafond)} ceiling written into ${h.src('idfm', 'article L421-54-1')}. From ${h.date(m.debut)} the default amount is ${h.eur2(m.b)}. For a used 6 CV car under ${h.num(h.P.regional.age_reduction_ans)} years old, the certificate drops from ${h.eur2(oA.total)} to ${h.eur2(oB.total)}. The surcharge follows the same reductions as the regional tax: half at ${h.num(h.P.regional.age_reduction_ans)} years, half for motorbikes. If the authority votes a higher figure, the saving will be smaller and the ${h.a('region-ile-de-france', 'Île-de-France')} page will be updated.</p>

<h2>Imports: depreciation in two parts</h2>
<p>For a used car brought into France, the malus is reduced by a rate based on its age in months, set by ${h.src('l421_7_2', 'article L421-7-2')}: from ${h.pct(h.P.decote_import.grille[0].reduction, 0)} in the first month up to ${h.pct(1, 0)} beyond ${h.num(h.P.decote_import.grille[h.P.decote_import.grille.length - 2].mois_max! / 12)} years. From 2027 that rate becomes the sum of this age part and a usage part defined in article L421-7-3, capped at ${h.pct(1, 0)}. The text of that article could not be read at the source, so the calculator only uses the age part and its result for a 2027 import is a ceiling. The malus stays at zero for a car first registered before ${h.date(h.P.decote_import.zero_avant)}. The steps are on the ${h.a('import-europe', 'import from the EU')} page.</p>
<p>On VAT, the rule changes address without, so far, changing substance: on ${h.date(c.b.from)} it leaves the General Tax Code, whose ${h.src('cgi298', 'article 298 sexies')} defines a new means of transport (at most ${h.num(h.P.tva_import.mois_max)} months or ${h.num(h.P.tva_import.km_max)} km), for the code of taxes on goods and services.</p>

<h2>Register before or after 1 January?</h2>
<ul>
<li><strong>New car with a malus</strong>: before. Any combustion car from ${h.num(c.b.seuil)} g/km pays more in 2027, and so does a mild hybrid above the weight threshold.</li>
<li><strong>Electric car in Île-de-France</strong>: after. You save ${h.eur2(m.a - m.b)} per horsepower and face no malus.</li>
<li><strong>Car with no malus under either scale</strong>, such as a 4 CV petrol car at ${h.num(sansMalus.g - 4)} g/km: no difference outside the Paris region, after inside it.</li>
<li><strong>Used car already registered in France</strong>: no malus at all. In Île-de-France, waiting for January saves ${h.eur2(m.a - m.b)} per horsepower, within the one-month window after purchase.</li>
</ul>
<p>A used car must be re-registered within ${h.num(h.P.national.delai_titulaire_mois)} month of purchase; beyond that, the fixed fine is ${h.eur(h.P.national.amende_titulaire)}. With a new car the dealer often registers it, so ask for the planned date. The calculator at the top compares December and January for your own car, with region, horsepower, CO₂ and mass; the full calculation link lets you try any other date.</p>
`;
    },
  },
});
