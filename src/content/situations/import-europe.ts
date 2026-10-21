import { defineGuide, type Helpers } from '../../lib/guide-types';

/** Voiture d'occasion achetée dans un autre pays de l'UE, immatriculée en France au jour du relevé. */
const imp = (h: Helpers, date1re: string, region = 'grand-est', cv = 7, gkm = 160, masseKg = 1700) =>
  h.M.coutCarteGrise({ demarche: 'immat', origine: 'import_occasion', genre: 'vp', energie: 'essence', ptacKg: 0, region, cv, gkm, masseKg, date1re, dateOp: h.P.regional.date_releve });
const CAS = [
  { d: '2026-07-01', fr: 'Juillet 2026, presque neuve', en: 'July 2026, nearly new' },
  { d: '2024-04-15', fr: 'Avril 2024', en: 'April 2024' },
  { d: '2021-09-10', fr: 'Septembre 2021', en: 'September 2021' },
  { d: '2018-05-10', fr: 'Mai 2018', en: 'May 2018' },
  { d: '2014-05-10', fr: 'Mai 2014', en: 'May 2014' },
];
const tranches = (h: Helpers, l: 'fr' | 'en') => {
  let prev = 0;
  return h.P.decote_import.grille.map((g) => {
    const lab = g.mois_max === null ? (l === 'fr' ? `${h.num(prev + 1)} mois et plus` : `${h.num(prev + 1)} months or more`) : l === 'fr' ? `${h.num(prev + 1)} à ${h.num(g.mois_max)} mois` : `${h.num(prev + 1)} to ${h.num(g.mois_max)} months`;
    if (g.mois_max !== null) prev = g.mois_max;
    return [lab, h.pct(g.reduction, 0)];
  });
};
const mois = (h: Helpers, d: string) => h.M.moisEntames(d, h.P.regional.date_releve);
const tva = (h: Helpers) => h.P.tva_import;

export default defineGuide({
  id: 'import-europe',
  group: 'situations',
  order: 30,
  mini: 'importUe',
  miniHref: 'home',
  related: ['quitus-tva', 'import-hors-europe', 'malus-co2', 'malus-masse', 'lire-carte-grise', 'voiture-neuve'],
  sources: ['l421_7_2', 'cgi298', 'quitus', 'l421_62', 'f35950', 'ants'],
  fr: {
    slug: 'vehicule-importe-europe',
    nav: 'Import d’Europe',
    card: 'Malus avec décote mensuelle, barème de l’année de première immatriculation, TVA et quitus fiscal pour une voiture achetée dans l’UE.',
    title: 'Voiture importée d’Europe 2026 : malus, décote et quitus',
    description: 'Carte grise d’une voiture achetée dans l’UE : malus réduit de 3 % à 100 % selon l’âge, nul avant 2015, TVA si moins de 6 mois ou 6 000 km, quitus fiscal.',
    h1: 'Immatriculer en France une voiture achetée dans l’Union européenne',
    intro: 'Le mini-simulateur estime le malus d’une voiture importée d’un pays de l’UE après décote, et indique si la TVA reste à payer en France.',
    resume: (h) => {
      const g = h.P.decote_import.grille;
      const ex = imp(h, CAS[1].d);
      return `Une voiture achetée en Allemagne, en Belgique ou en Espagne est, pour le fisc français, immatriculée pour la première fois en France : elle paie donc le malus CO₂ et le malus au poids, en plus de la taxe régionale. Mais ces deux malus sont réduits par une décote qui dépend de l’âge du véhicule, compté en mois depuis sa première immatriculation à l’étranger : ${h.pct(g[0].reduction, 0)} les premiers mois, puis davantage à chaque tranche, jusqu’à ${h.pct(g[g.length - 1].reduction, 0)} au-delà de ${h.num(g[g.length - 2].mois_max as number)} mois. Le barème utilisé est celui de l’année de cette première immatriculation, et aucun malus n’est dû si elle date d’avant le ${h.date(h.P.decote_import.zero_avant)}. Exemple : une essence de 7 CV, 160 g/km et 1 700 kg, immatriculée en Allemagne en avril 2024, coûte ${h.eur2(ex.total)} de carte grise dans le Grand Est au ${h.date(h.P.regional.date_releve)}, dont ${h.eur(ex.malus.total)} de malus après une décote de ${h.pct(ex.malus.decote, 0)}. La TVA française est due si la voiture a au plus ${h.num(tva(h).mois_max)} mois ou au plus ${h.num(tva(h).km_max)} km. Il faut aussi un quitus fiscal.`;
    },
    faqs: (h) => [
      { q: 'Une voiture allemande de 2019 importée en France paie-t-elle un malus ?', a: `Elle en doit un en droit, mais ce site ne le chiffre pas. Pour une voiture immatriculée avant ${h.P.malus_co2.premiere_annee_wltp.slice(0, 4)}, le malus CO₂ se lit dans l’ancien barème NEDC de son année, que le simulateur ne reprend pas. La décote liée à l’âge s’applique ensuite comme pour une voiture plus récente. Le simulateur officiel de service-public.gouv.fr permet de vérifier ce montant.` },
      { q: 'Comment l’âge d’une voiture importée d’Europe est-il compté pour la décote ?', a: 'En mois, de la date de première immatriculation dans le pays d’origine jusqu’au jour de l’immatriculation en France, et tout mois commencé compte. Une voiture immatriculée le 10 d’un mois et présentée le 12 du même mois deux ans plus tard entre ainsi dans la tranche suivante. La date figure en case B du certificat étranger harmonisé.' },
      { q: 'Faut-il payer la TVA en France sur une voiture d’occasion achetée en Belgique ?', a: `Seulement si elle est neuve au sens fiscal : livrée au plus ${h.num(tva(h).mois_max)} mois après sa première mise en service, ou avec au plus ${h.num(tva(h).km_max)} km au compteur. Dans ce cas la TVA de ${h.pct(tva(h).taux, 0)} est payée en France, au service des impôts, avant la délivrance du quitus. Sinon, la TVA payée chez le vendeur belge suffit, et le quitus atteste simplement qu’aucune TVA n’est due en France.` },
      { q: 'Quels documents l’ANTS demande-t-elle pour une voiture venue d’un autre pays de l’UE ?', a: 'Le certificat d’immatriculation étranger, la facture ou l’acte de vente, le quitus fiscal remis par l’administration fiscale, et un justificatif de conformité du véhicule à son type, en général le certificat de conformité européen. La liste à jour figure sur le site de l’ANTS au moment de la demande.' },
    ],
    body: (h) => {
      const d = h.P.regional.date_releve;
      const rows = CAS.map((c) => {
        const x = imp(h, c.d);
        const m = x.malus;
        const statut = m.notes.includes('avant_2015') ? 'aucun malus' : m.notes.includes('nedc') ? 'NEDC, non calculé' : h.eur(m.total);
        return [c.fr, h.num(mois(h, c.d)), m.notes.includes('nedc') || m.notes.includes('avant_2015') ? '' : m.annee, m.notes.includes('nedc') || m.notes.includes('avant_2015') ? '' : h.pct(m.decote, 0), statut, h.eur2(x.total)];
      });
      const recent = imp(h, CAS[1].d).malus;
      return `
<h2>La décote, tranche par tranche</h2>
<p>La table vient de l’${h.src('l421_7_2', 'article L421-7-2 du CIBS')}. Le pourcentage est retiré du malus CO₂, du malus au poids et du plafond commun des deux.</p>
${h.table(['Âge depuis la 1re immatriculation', 'Décote'], tranches(h, 'fr'), 'Coefficient de décote des véhicules d’occasion importés.', ['l', 'r'])}
<p>À partir de 2027, la loi prévoit d’ajouter à cette part liée à l’âge une part liée à l’usage du véhicule. Son contenu n’a pas été vérifié ici : le calcul ci-dessus vaut pour une immatriculation en 2026.</p>

<h2>Le barème de l’année d’origine</h2>
<p>Une voiture importée ne paie pas le barème de l’année où elle arrive en France, mais celui de l’année de sa première immatriculation à l’étranger. Une voiture d’avril 2024 suit donc le barème 2024 : seuil CO₂ à ${h.num(h.P.malus_co2.annees['2024'].seuil)} g/km et malus au poids au-delà de ${h.num(h.P.malus_masse.annees['2024'].tranches[0].min - 1)} kg. Pour l’essence de 7 CV, 160 g/km et 1 700 kg de l’exemple, cela donne ${h.eur(recent.co2Brut)} de malus CO₂ et ${h.eur(recent.masseBrut)} de malus au poids avant décote, puis ${h.eur(recent.co2)} et ${h.eur(recent.masse)} après les ${h.pct(recent.decote, 0)} de décote.</p>
<p>Trois limites :</p>
<ul>
<li>avant le ${h.date(h.P.decote_import.zero_avant)}, plus aucun malus n’est dû, quelle que soit la voiture ;</li>
<li>entre cette date et le ${h.date(h.P.malus_co2.premiere_annee_wltp)}, le malus se calcule avec l’ancien cycle d’homologation NEDC. Ce site ne le chiffre pas, et le tableau l’indique ;</li>
<li>le malus au poids n’existe que pour les voitures immatriculées depuis le ${h.date(h.P.malus_masse.premiere_annee)}.</li>
</ul>

<h2>La même voiture à cinq âges</h2>
${h.table(['1re immatriculation', 'Mois', 'Barème', 'Décote', 'Malus', 'Carte grise'], rows, `Essence de 7 CV, 160 g/km, 1 700 kg, immatriculée dans le Grand Est au ${h.date(d)}.`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>La ligne de mai 2014 coûte moins cher que celle de mai 2018 pour une raison de plus : à dix ans passés, la taxe régionale baisse de moitié, et l’âge se compte là aussi depuis la première immatriculation étrangère.</p>

<h2>TVA et quitus fiscal</h2>
<p>Le ${h.src('cgi298', 'code général des impôts')} tient pour neuf un véhicule livré au plus ${h.num(tva(h).mois_max)} mois après sa première mise en service ou ayant parcouru au plus ${h.num(tva(h).km_max)} km. Les deux conditions sont alternatives : une voiture de deux mois à ${h.num(tva(h).km_max * 2)} km reste neuve au sens fiscal. Dans ce cas, la TVA de ${h.pct(tva(h).taux, 0)} est payée en France et non dans le pays du vendeur.</p>
<p>Dans tous les cas, l’immatriculation exige un ${h.src('quitus', 'quitus fiscal')}, document fiscal établissant que la TVA est soit payée, soit non exigible. Le dossier comprend aussi un certificat de conformité. Le dépôt se fait ensuite sur le ${h.src('ants', 'site de l’ANTS')}, sans frais de démarche.</p>
<p>Pour une voiture achetée hors de l’Union, la douane intervient avant tout cela : voir ${h.a('import-hors-europe', 'véhicule importé hors d’Europe')}. Le détail de la TVA est sur la page ${h.a('quitus-tva', 'quitus fiscal et TVA')}.</p>
`;
    },
  },
  en: {
    slug: 'import-car-from-eu',
    nav: 'Import from the EU',
    card: 'Malus with monthly age reduction, the scale of the first registration year, VAT and tax clearance for a car bought in the EU.',
    title: 'Import a car from the EU to France 2026: malus and VAT',
    description: 'Registering a car bought in the EU in France: malus cut by 3% to 100% with age, nil before 2015, French VAT if under 6 months or 6,000 km, tax clearance.',
    h1: 'Registering a car bought elsewhere in the EU in France',
    intro: 'The mini calculator estimates the malus on a car imported from another EU country after its age reduction, and tells you whether VAT is still due in France.',
    resume: (h) => {
      const g = h.P.decote_import.grille;
      const ex = imp(h, CAS[1].d);
      return `A car bought in Germany, Belgium or Spain counts, for the French tax office, as registered in France for the first time when you bring it over. It therefore pays the CO₂ malus and the weight malus as well as the regional tax. Both malus taxes are, however, reduced according to the car’s age in months since its first registration abroad: ${h.pct(g[0].reduction, 0)} in the first months, more at each band, up to ${h.pct(g[g.length - 1].reduction, 0)} beyond ${h.num(g[g.length - 2].mois_max as number)} months. The scale used is the one for the year of that first registration, and nothing is due if it predates ${h.date(h.P.decote_import.zero_avant)}. Example: a 7 CV petrol car at 160 g/km and 1,700 kg, first registered in Germany in April 2024, costs ${h.eur2(ex.total)} to register in Grand Est on ${h.date(h.P.regional.date_releve)}, of which ${h.eur(ex.malus.total)} is malus after a ${h.pct(ex.malus.decote, 0)} reduction. French VAT is due if the car is at most ${h.num(tva(h).mois_max)} months old or has done at most ${h.num(tva(h).km_max)} km. You also need a tax clearance certificate, the “quitus fiscal”.`;
    },
    faqs: (h) => [
      { q: 'Will a 2018 car bought in the Netherlands pay a malus when registered in France?', a: `In law, yes, but this site does not work it out. For cars first registered before ${h.P.malus_co2.premiere_annee_wltp.slice(0, 4)} the CO₂ malus comes from the older NEDC scale of that year, which our calculator does not include. The age reduction then applies as for newer cars. The official service-public.gouv.fr simulator can confirm the figure.` },
      { q: 'How is the age of an EU import measured for the malus reduction?', a: 'In months, from the first registration date in the country of origin to the day of French registration, and any month started counts in full. A car registered on the 10th and presented on the 12th of the same month two years later therefore falls into the next band. The date is in box B of the harmonised foreign certificate.' },
      { q: 'Do I pay French VAT on a used car I bought from a dealer in Spain?', a: `Only if it is new for tax purposes: delivered no more than ${h.num(tva(h).mois_max)} months after it was first put on the road, or with no more than ${h.num(tva(h).km_max)} km. In that case ${h.pct(tva(h).taux, 0)} VAT is paid at the French tax office before the clearance is issued. Otherwise the VAT paid in Spain stands, and the clearance simply confirms that nothing is owed in France.` },
      { q: 'What paperwork does ANTS expect for a car brought in from another EU country?', a: 'The foreign registration certificate, the invoice or bill of sale, the tax clearance from the French tax office, and proof that the car matches its approved type, usually the European certificate of conformity. Check the current list on the ANTS website when you apply, as requirements can change.' },
    ],
    body: (h) => {
      const d = h.P.regional.date_releve;
      const rows = CAS.map((c) => {
        const x = imp(h, c.d);
        const m = x.malus;
        const skip = m.notes.includes('nedc') || m.notes.includes('avant_2015');
        const statut = m.notes.includes('avant_2015') ? 'no malus' : m.notes.includes('nedc') ? 'NEDC, not calculated' : h.eur(m.total);
        return [c.en, h.num(mois(h, c.d)), skip ? '' : m.annee, skip ? '' : h.pct(m.decote, 0), statut, h.eur2(x.total)];
      });
      const recent = imp(h, CAS[1].d).malus;
      return `
<h2>The reduction band by band</h2>
<p>The table comes from ${h.src('l421_7_2', 'article L421-7-2 of the French tax code (CIBS)')}. The percentage comes off the CO₂ malus, the weight malus and the shared cap on both.</p>
${h.table(['Age since first registration', 'Reduction'], tranches(h, 'en'), 'Depreciation coefficient for imported used vehicles.', ['l', 'r'])}
<p>From 2027 the law adds a usage component to this age-based part. Its content has not been checked here, so the figures above hold for a registration made in 2026.</p>

<h2>The scale of the original year</h2>
<p>An imported car does not pay the scale of the year it reaches France but that of the year it was first registered abroad. A car from April 2024 therefore uses the 2024 scale: CO₂ malus from ${h.num(h.P.malus_co2.annees['2024'].seuil)} g/km and weight malus above ${h.num(h.P.malus_masse.annees['2024'].tranches[0].min - 1)} kg. For the 7 CV petrol car at 160 g/km and 1,700 kg, that is ${h.eur(recent.co2Brut)} of CO₂ malus and ${h.eur(recent.masseBrut)} of weight malus before the reduction, then ${h.eur(recent.co2)} and ${h.eur(recent.masse)} after the ${h.pct(recent.decote, 0)} cut.</p>
<p>Three limits apply:</p>
<ul>
<li>for a first registration before ${h.date(h.P.decote_import.zero_avant)}, no malus is due at all;</li>
<li>between that date and ${h.date(h.P.malus_co2.premiere_annee_wltp)}, the CO₂ malus uses the older NEDC test cycle. This site does not calculate it and the table says so;</li>
<li>the weight malus only exists for cars first registered since ${h.date(h.P.malus_masse.premiere_annee)}.</li>
</ul>

<h2>One car, five ages</h2>
${h.table(['First registered', 'Months', 'Scale', 'Reduction', 'Malus', 'Registration'], rows, `7 CV petrol car, 160 g/km, 1,700 kg, registered in Grand Est on ${h.date(d)}.`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>The May 2014 car is cheaper than the May 2018 one for an extra reason: past ten years the regional tax is halved, and that age also runs from the first foreign registration.</p>

<h2>VAT and the tax clearance</h2>
<p>The ${h.src('cgi298', 'General Tax Code')} treats a vehicle as new when it is delivered no more than ${h.num(tva(h).mois_max)} months after it was first put into service or has covered no more than ${h.num(tva(h).km_max)} km. Either condition is enough: a two-month-old car with ${h.num(tva(h).km_max * 2)} km is still new for tax purposes. VAT at ${h.pct(tva(h).taux, 0)} is then paid in France rather than in the seller’s country.</p>
<p>In every case registration requires a ${h.src('quitus', 'tax clearance certificate')}, issued by the French tax office to confirm that VAT has been paid or is not due. The file also needs a certificate of conformity. You then apply on the ${h.src('ants', 'ANTS website')}, the State registration agency, at no charge for the application itself.</p>
<p>For a car bought outside the EU, customs come first: see ${h.a('import-hors-europe', 'importing from outside the EU')}. VAT is covered in depth on the ${h.a('quitus-tva', 'VAT clearance')} page.</p>
`;
    },
  },
});
