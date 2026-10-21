import { defineGuide, type Helpers } from '../../lib/guide-types';

const KW = [55, 74, 96, 110, 150, 230];
const MOTOS = [125, 300, 650, 900, 1300];
const REG = 'pays-de-la-loire';
const d0 = (h: Helpers) => h.P.regional.date_releve;
const y1 = (h: Helpers, cv: number, genre: 'vp' | 'moto' = 'vp') =>
  h.M.taxeRegionale({ cv, region: REG, date1re: d0(h), dateOp: d0(h), energie: 'essence', demarche: 'titulaire', genre }).y1;
/** Plage de kW (entiers) qui donne chaque nombre de CV, de 4 à 11 CV. */
const plages = () => {
  const out: Array<{ cv: number; lo: number; hi: number }> = [];
  return (h: Helpers) => {
    if (out.length) return out;
    for (let kw = 1; kw <= 400; kw++) {
      const cv = h.M.chevauxFiscaux(kw).arrondi;
      const last = out[out.length - 1];
      if (last && last.cv === cv) last.hi = kw; else out.push({ cv, lo: kw, hi: kw });
    }
    return out;
  };
};
const plagesCv = plages();
const ch = (h: Helpers, kw: number) => h.num(kw * h.P.puissance_fiscale.ch_par_kw);

export default defineGuide({
  id: 'calcul-chevaux-fiscaux',
  group: 'outils',
  order: 40,
  tool: 'cv',
  related: ['tarif-cheval-fiscal', 'moto-scooter', 'lire-carte-grise', 'comparer-regions', 'import-europe'],
  sources: ['l421_16', 'l421_17', 'cibs', 'prixcv'],
  fr: {
    slug: 'calcul-chevaux-fiscaux',
    nav: 'Chevaux fiscaux',
    card: 'La puissance fiscale d’une voiture d’après ses kilowatts, ou d’une moto d’après sa cylindrée, et la taxe qui en découle.',
    title: 'Chevaux fiscaux : calcul à partir des kW ou de la cylindrée',
    description: 'Chevaux fiscaux d’une voiture immatriculée depuis 2021 d’après les kW de la case P.2, d’une moto d’après sa cylindrée, et taxe régionale correspondante.',
    h1: 'Calculer les chevaux fiscaux d’une voiture ou d’une moto',
    intro: 'Entrez la puissance en kilowatts, ou la cylindrée pour un deux-roues : l’outil donne la puissance fiscale et la taxe régionale de la région choisie.',
    resume: (h) => {
      const f = h.P.puissance_fiscale;
      const ex = h.M.chevauxFiscaux(96);
      return `Les chevaux fiscaux, ou puissance administrative, sont l’unité qui sert à calculer la taxe régionale de la carte grise ; ils figurent en case P.6. Pour une voiture immatriculée en France depuis le ${h.date(f.depuis)}, la loi les tire de la seule puissance nette maximale du moteur en kilowatts, la case P.2 : on divise les kW par cent, puis on calcule ${h.num(f.a, 2)} fois ce nombre au carré, plus ${h.num(f.b, 2)} fois ce nombre, plus ${h.num(f.c, 2)}, et l’on arrondit à l’unité. Une voiture de 96 kW, soit environ ${ch(h, 96)} ch, obtient ${h.num(ex.formule, 2)}, donc ${h.num(ex.arrondi)} CV. Pour les motos et scooters, la puissance dépend de la cylindrée, par paliers jusqu’à un demi-litre puis selon une formule au-delà. Les voitures plus anciennes ont une puissance fixée par d’autres règles. Dans tous les cas, la valeur inscrite en case P.6 fait foi : c’est elle que retient l’administration pour la taxe.`;
    },
    faqs: (h) => {
      const m = h.M.chevauxMoto(650);
      return [
        { q: 'Pourquoi la case P.6 de ma voiture ne correspond-elle pas au calcul des chevaux fiscaux ?', a: `La formule fondée sur les kilowatts ne vaut que pour les voitures immatriculées depuis le ${h.date(h.P.puissance_fiscale.depuis)}. Avant, d’autres règles fixaient la puissance administrative, et le résultat peut différer. Pour une voiture plus ancienne comme pour une récente, c’est la valeur déjà portée en case P.6 que l’administration applique.` },
        { q: 'Combien de chevaux fiscaux pour une moto de 650 cm³ ?', a: `${h.num(m)} CV d’après le barème de la cylindrée. Une moto paie ensuite la moitié du tarif régional, quel que soit son âge : dans la région Pays de la Loire, cela représente ${h.eur2(y1(h, m, 'moto'))} de taxe régionale, plus les frais fixes du titre.` },
        { q: 'Une voiture électrique a-t-elle aussi des chevaux fiscaux ?', a: `Oui. Une voiture électrique immatriculée depuis le ${h.date(h.P.puissance_fiscale.depuis)} suit la même formule fondée sur la puissance en kilowatts. Elle paie la taxe régionale à plein tarif dans toutes les régions, sauf dans les Hauts-de-France où elle bénéficie d’une réduction de moitié. Vérifiez la case P.6 du certificat.` },
        { q: 'Faut-il convertir les chevaux DIN en kilowatts pour la puissance fiscale ?', a: `Oui, la formule part des kilowatts. Un kilowatt vaut environ ${h.num(h.P.puissance_fiscale.ch_par_kw, 2)} ch : divisez les chevaux annoncés par ce nombre. Une voiture vendue pour 150 ch développe donc environ ${h.num(150 / h.P.puissance_fiscale.ch_par_kw)} kW. La case P.2 du certificat donne directement la valeur en kilowatts.` },
      ];
    },
    body: (h) => {
      const f = h.P.puissance_fiscale;
      const rows = KW.map((kw) => { const c = h.M.chevauxFiscaux(kw); return [`${h.num(kw)} kW`, `${ch(h, kw)} ch`, h.num(c.formule, 2), `${h.num(c.arrondi)} CV`, h.eur2(y1(h, c.arrondi))]; });
      const pl = plagesCv(h).filter((p) => p.cv >= 4 && p.cv <= 11).map((p) => [`${h.num(p.cv)} CV`, `${h.num(p.lo)} à ${h.num(p.hi)} kW`, `${ch(h, p.lo)} à ${ch(h, p.hi)} ch`]);
      const paliers = f.moto.paliers.map(([max, cv], i) => [i === 0 ? `jusqu’à ${h.num(max * 1000)} cm³` : `de ${h.num(f.moto.paliers[i - 1][0] * 1000 + 1)} à ${h.num(max * 1000)} cm³`, `${h.num(cv)} CV`]);
      const motos = MOTOS.map((cc) => `${h.num(cc)} cm³ : ${h.num(h.M.chevauxMoto(cc))} CV`).join(' ; ');
      const t = h.M.tarifRegion(REG, d0(h));
      return `
<h2>La formule des voitures depuis ${f.depuis.slice(0, 4)}</h2>
<p>L’${h.src('l421_16', 'article L421-16 du code des impositions')} fixe la puissance administrative d’une voiture particulière à partir de sa puissance nette maximale, notée PM et exprimée en kilowatts : PA = ${h.num(f.a, 2)} × (PM/100)² + ${h.num(f.b, 2)} × (PM/100) + ${h.num(f.c, 2)}. On retient ensuite l’entier le plus proche du résultat. Les émissions de CO₂ n’entrent plus dans ce calcul.</p>
${h.table(['Puissance (P.2)', 'Équivalent', 'Résultat de la formule', 'Puissance fiscale', `Taxe régionale en ${h.M.regionById(REG).nom.fr}`], rows, `Taxe régionale d’une voiture de moins de dix ans au tarif de ${h.eur2(t.cv)} par cheval.`, ['l', 'r', 'r', 'r', 'r'])}

<h2>À quelle puissance change-t-on de cheval fiscal ?</h2>
<p>Comme la formule est arrondie, un ou deux kilowatts suffisent parfois à faire passer une voiture au cheval supérieur, et chaque cheval ajoute le tarif de votre région à la carte grise. Le tableau donne les plages de puissance pour les valeurs les plus courantes.</p>
${h.table(['Puissance fiscale', 'Puissance nette', 'En chevaux DIN'], pl, 'Plages calculées kilowatt par kilowatt avec la formule de l’article L421-16.', ['l', 'r', 'r'])}

<h2>Motos, scooters et tricycles : la cylindrée</h2>
<p>Pour un deux-roues ou un tricycle à moteur thermique, l’${h.src('l421_17', 'article L421-17')} ignore la puissance et s’appuie sur la cylindrée de la case P.1.</p>
${h.table(['Cylindrée', 'Puissance fiscale'], paliers, 'Paliers jusqu’à un demi-litre.', ['l', 'r'])}
<p>Au-delà, la puissance vaut ${h.num(f.moto.au_dela_base)} CV plus ${h.num(f.moto.au_dela_coef)} fois la part de cylindrée qui dépasse le demi-litre, exprimée en litres, arrondie à l’unité supérieure. Quelques exemples : ${motos}. Les motos paient la moitié du tarif régional, sans réduction supplémentaire à dix ans ; les cyclomoteurs ne paient aucune taxe régionale.</p>

<h2>Les voitures plus anciennes et la case P.6</h2>
<p>Pour une voiture immatriculée avant le ${h.date(f.depuis)}, la puissance administrative a été fixée selon d’autres règles, et ce simulateur ne la recalcule pas. La valeur imprimée en case P.6 est présumée exacte : c’est elle que l’administration applique, y compris quand vous rachetez la voiture des années plus tard. Pour un véhicule importé, c’est à sa première immatriculation en France que l’administration fixe sa puissance fiscale ; l’estimation ci-dessus permet de prévoir le coût avant l’achat.</p>

<h2>Ce que fait l’outil</h2>
<p>Choisissez voiture ou deux-roues. Pour une voiture, saisissez les kilowatts de la case P.2 : l’outil affiche les trois termes de la formule, leur somme et l’arrondi. Pour une moto, saisissez la cylindrée. La région choisie donne ensuite le tarif du cheval fiscal et la taxe régionale correspondante. Pour comparer ce tarif partout en France, voyez le ${h.a('tarif-cheval-fiscal', 'prix du cheval fiscal par région')}.</p>
`;
    },
  },
  en: {
    slug: 'fiscal-horsepower-calculator',
    nav: 'Fiscal horsepower',
    card: 'A car’s fiscal horsepower from its kilowatts, or a motorbike’s from its engine size, and the regional tax that follows.',
    title: 'Fiscal horsepower calculator: from kW or engine size (CV)',
    description: 'Fiscal horsepower (CV) of a car registered in France since 2021 from the kW in box P.2, of a motorbike from its engine size, with the matching regional tax.',
    h1: 'Work out the fiscal horsepower of a car or a motorbike',
    intro: 'Enter the power in kilowatts, or the engine size for a two-wheeler: the tool returns the fiscal horsepower and the regional tax for the region you pick.',
    resume: (h) => {
      const f = h.P.puissance_fiscale;
      const ex = h.M.chevauxFiscaux(96);
      return `Fiscal horsepower, written CV for “chevaux fiscaux”, is the administrative power rating France uses to price the regional tax on a registration certificate, or carte grise; it appears in box P.6. It has nothing to do with the horsepower in the brochure. For a car registered in France since ${h.date(f.depuis)}, the law derives it only from the engine’s maximum net power in kilowatts, box P.2: divide the kW by one hundred, take ${h.num(f.a, 2)} times that number squared, add ${h.num(f.b, 2)} times the number, add ${h.num(f.c, 2)}, and round to the nearest whole number. A 96 kW car, about ${ch(h, 96)} hp, scores ${h.num(ex.formule, 2)}, so ${h.num(ex.arrondi)} CV. For motorbikes and scooters, the rating follows engine size, in steps up to half a litre and by a formula above that. Older cars had their rating set under other rules. In every case the figure in box P.6 is the one that counts for the tax.`;
    },
    faqs: (h) => {
      const m = h.M.chevauxMoto(900);
      return [
        { q: 'My car’s box P.6 shows a different CV figure from this calculator: which is right?', a: `Box P.6. The kilowatt formula only covers cars registered in France since ${h.date(h.P.puissance_fiscale.depuis)}; older cars had their rating fixed under earlier rules, which can give another result. The administration charges the regional tax on whatever P.6 says, so use that number when you budget for a used car.` },
        { q: 'How many fiscal horsepower does a 900 cc motorbike have in France?', a: `${h.num(m)} CV under the engine-size scale. Motorbikes then pay half the regional rate whatever their age, so in Pays de la Loire the regional part comes to ${h.eur2(y1(h, m, 'moto'))}. The small fixed charges for issuing and posting the certificate are added on top.` },
        { q: 'Do electric cars have a fiscal horsepower rating?', a: `Yes. An electric car registered since ${h.date(h.P.puissance_fiscale.depuis)} uses the same kilowatt formula as a petrol one. It pays the full regional rate everywhere except Hauts-de-France, where electric and hydrogen vehicles pay half. Box P.6 of its certificate shows the rating the tax is based on.` },
        { q: 'My car’s brochure gives horsepower, not kilowatts: how do I convert?', a: `One kilowatt is about ${h.num(h.P.puissance_fiscale.ch_par_kw, 2)} metric horsepower, so divide the brochure figure by that number. A car sold as 150 hp delivers roughly ${h.num(150 / h.P.puissance_fiscale.ch_par_kw)} kW. On a European certificate of conformity or a French registration certificate, box P.2 already gives the kilowatts.` },
      ];
    },
    body: (h) => {
      const f = h.P.puissance_fiscale;
      const rows = KW.map((kw) => { const c = h.M.chevauxFiscaux(kw); return [`${h.num(kw)} kW`, `${ch(h, kw)} hp`, h.num(c.formule, 2), `${h.num(c.arrondi)} CV`, h.eur2(y1(h, c.arrondi))]; });
      const pl = plagesCv(h).filter((p) => p.cv >= 4 && p.cv <= 11).map((p) => [`${h.num(p.cv)} CV`, `${h.num(p.lo)} to ${h.num(p.hi)} kW`, `${ch(h, p.lo)} to ${ch(h, p.hi)} hp`]);
      const paliers = f.moto.paliers.map(([max, cv], i) => [i === 0 ? `up to ${h.num(max * 1000)} cc` : `${h.num(f.moto.paliers[i - 1][0] * 1000 + 1)} to ${h.num(max * 1000)} cc`, `${h.num(cv)} CV`]);
      const motos = MOTOS.map((cc) => `${h.num(cc)} cc: ${h.num(h.M.chevauxMoto(cc))} CV`).join('; ');
      const t = h.M.tarifRegion(REG, d0(h));
      return `
<h2>The formula for cars since ${f.depuis.slice(0, 4)}</h2>
<p>${h.src('l421_16', 'Article L421-16 of the French tax code')} sets a passenger car’s administrative power from its maximum net power, PM, in kilowatts: PA = ${h.num(f.a, 2)} × (PM/100)² + ${h.num(f.b, 2)} × (PM/100) + ${h.num(f.c, 2)}. The result is rounded to the nearest whole number. CO₂ emissions no longer play any part.</p>
${h.table(['Power (P.2)', 'Equivalent', 'Formula result', 'Fiscal horsepower', `Regional tax in ${h.M.regionById(REG).nom.en}`], rows, `Regional tax for a car under ten years old at ${h.eur2(t.cv)} per CV.`, ['l', 'r', 'r', 'r', 'r'])}

<h2>Where each extra CV starts</h2>
<p>Because the result is rounded, one or two kilowatts can push a car into the next rating, and each extra CV adds your region’s rate to the bill. The table gives the power ranges for the most common ratings, which helps when two versions of the same model are on offer.</p>
${h.table(['Fiscal horsepower', 'Net power', 'Metric horsepower'], pl, 'Ranges worked out kilowatt by kilowatt with the article L421-16 formula.', ['l', 'r', 'r'])}

<h2>Motorbikes, scooters and trikes: engine size</h2>
<p>For a petrol two-wheeler or tricycle, ${h.src('l421_17', 'article L421-17')} ignores power and uses the engine capacity in box P.1.</p>
${h.table(['Engine size', 'Fiscal horsepower'], paliers, 'Steps up to half a litre.', ['l', 'r'])}
<p>Above that, the rating is ${h.num(f.moto.au_dela_base)} CV plus ${h.num(f.moto.au_dela_coef)} times the capacity above half a litre, in litres, rounded up. Some examples: ${motos}. Motorbikes pay half the regional rate, with no further cut at ten years; mopeds pay no regional tax at all.</p>

<h2>Older cars and box P.6</h2>
<p>For a car registered before ${h.date(f.depuis)}, the rating was set under other rules, and this tool does not recompute it. The figure printed in box P.6 is presumed correct and is what the administration charges on, including when you buy the car years later. For an imported vehicle, the rating is set at its first French registration; the estimate above lets you price the paperwork before you buy.</p>

<h2>What the tool does</h2>
<p>Pick car or two-wheeler. For a car, enter the kilowatts from box P.2: the tool shows the three terms of the formula, their sum and the rounding. For a motorbike, enter the engine size. The region you choose then gives the rate per CV and the matching regional tax. To compare that rate across France, see the ${h.a('tarif-cheval-fiscal', 'fiscal horsepower rate by region')}.</p>
`;
    },
  },
});
