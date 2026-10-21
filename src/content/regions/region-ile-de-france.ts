import { defineGuide, type Helpers } from '../../lib/guide-types';

const ID = 'ile-de-france';
const reg = (h: Helpers) => h.P.regions.find((r) => r.id === ID)!;
const releve = (h: Helpers) => h.P.regional.date_releve;
/** Tarif payé par cheval à une date : part régionale + majoration IDFM le cas échéant. */
const parCv = (h: Helpers, id: string, d: string) => {
  const r = h.P.regions.find((x) => x.id === id)!;
  return h.M.tarifRegion(id, d).cv + (r.idfm ? h.M.majorationIdfm(d) : 0);
};
/** Rang national au jour du relevé (1 = le plus cher) et écart avec la région suivante. */
const rang = (h: Helpers) => {
  const d = releve(h);
  const moi = parCv(h, ID, d);
  const tous = h.P.regions.map((r) => parCv(h, r.id, d));
  const dessous = tous.filter((x) => x < moi);
  return { pos: 1 + tous.filter((x) => x > moi).length, n: tous.length, suivant: Math.max(...dessous), ecart: moi - Math.max(...dessous) };
};
const y1 = (h: Helpers, cv: number, date1re: string, dateOp = releve(h), energie: 'essence' | 'electrique' = 'essence') =>
  h.M.taxeRegionale({ cv, region: ID, date1re, dateOp, energie, demarche: 'titulaire' });
const titre = (h: Helpers, cv: number, date1re: string, dateOp = releve(h)) =>
  h.M.coutCarteGrise({ cv, region: ID, date1re, dateOp, energie: 'essence', demarche: 'titulaire', genre: 'vp', origine: 'france_occasion', gkm: 0, masseKg: 0, ptacKg: 0 }).total;
const RECENTE = '2022-05-10';
const ANCIENNE = '2013-09-02';

export default defineGuide({
  id: 'region-ile-de-france',
  group: 'regions',
  order: 80,
  tool: 'cout',
  region: ID,
  related: ['tarif-cheval-fiscal', 'comparer-regions', 'calendrier-2027', 'occasion-titulaire', 'dix-ans', 'region-hauts-de-france'],
  sources: ['delib_idf', 'idfm', 'lfi2026', 'prixcv', 'a18021', 'cibs'],
  fr: {
    slug: 'region/ile-de-france',
    nav: 'Île-de-France',
    card: 'Le tarif régional francilien, la majoration Île-de-France Mobilités et sa baisse prévue en 2027.',
    title: 'Carte grise Île-de-France 2026 : 68,95 € par cheval fiscal',
    description: 'Carte grise en Île-de-France en 2026 : 54,95 € de tarif régional plus 14 € de majoration IDFM par cheval, 12 € prévus en 2027, moitié après 10 ans, exemples.',
    h1: 'Le prix du cheval fiscal francilien pour une carte grise en 2026',
    intro: 'Le simulateur ci-dessus est réglé sur l’Île-de-France : entrez la puissance et l’âge du véhicule pour voir la part régionale et la majoration séparément.',
    resume: (h) => {
      const d = releve(h);
      const t = h.M.tarifRegion(ID, d);
      const m = h.M.majorationIdfm(d);
      const p = h.P.idfm.periodes;
      const rg = rang(h);
      return `Au ${h.date(d)}, un cheval fiscal coûte ${h.eur2(t.cv + m)} en Île-de-France, ce qui en fait la région la plus chère des ${h.num(rg.n)} régions françaises. Ce montant additionne deux taxes perçues ensemble : le tarif voté par le conseil régional, ${h.eur2(t.cv)} depuis le ${h.date(t.from!)} (date vérifiée dans la délibération régionale), et la majoration au profit d’Île-de-France Mobilités, ${h.eur2(p[0].cv)} par cheval depuis le ${h.date(p[0].from)}. Cette majoration a été créée par la loi de finances pour 2026 ; elle descend à ${h.eur2(p[1].cv)} au ${h.date(p[1].from)}, sauf si Île-de-France Mobilités vote un autre montant, dans la limite de ${h.eur2(h.P.idfm.plafond_legal)}. Pour une voiture d’occasion de 6 CV de moins de dix ans, la taxe régionale atteint ${h.eur2(y1(h, 6, RECENTE).y1)} et la carte grise ${h.eur2(titre(h, 6, RECENTE))}. Passé dix ans depuis la première immatriculation, les deux parts sont divisées par deux. Une voiture électrique paie ici le plein tarif.`;
    },
    faqs: (h) => {
      const d = releve(h);
      const p = h.P.idfm.periodes;
      const a = y1(h, 5, RECENTE);
      return [
        { q: 'Pourquoi deux montants apparaissent-ils pour la taxe régionale en Île-de-France ?', a: `Parce que la ligne Y1 réunit le tarif voté par la région, ${h.eur2(a.tarif)} par cheval, et la majoration d’Île-de-France Mobilités, ${h.eur2(a.idfm)} par cheval au ${h.date(d)}. Sur une voiture de 5 CV récente, cela donne ${h.eur2(a.regionale)} pour la région et ${h.eur2(a.majoration)} pour les transports franciliens. Le simulateur détaille les deux, mais vous ne payez qu’une seule somme à l’ANTS.` },
        { q: 'Attendre janvier 2027 fait-il baisser la carte grise en Île-de-France ?', a: `Oui, si Île-de-France Mobilités ne délibère pas d’ici là : la majoration passera de ${h.eur2(p[0].cv)} à ${h.eur2(p[1].cv)} par cheval. Sur une voiture de 7 CV de moins de dix ans, le titre passerait de ${h.eur2(titre(h, 7, RECENTE))} à ${h.eur2(titre(h, 7, RECENTE, '2027-02-01'))}. Mais le délai légal d’un mois après l’achat reste dû : différer la démarche au-delà expose à l’amende.` },
        { q: 'La majoration francilienne s’applique-t-elle à un duplicata ou à un changement d’adresse ?', a: 'Non. Elle suit exactement la taxe régionale, qui n’est due que lorsqu’un nouveau titulaire est inscrit sur le certificat. Un duplicata après perte ou vol, un changement d’adresse ou l’ajout d’un conjoint ne déclenchent ni la part régionale ni la part Île-de-France Mobilités. Le prix se limite alors aux frais nationaux du titre, et parfois à rien du tout pour les trois premiers déménagements.' },
        { q: 'Une société installée en Île-de-France paie-t-elle la majoration ?', a: 'Elle la paie si le véhicule est affecté à un établissement situé dans la région, car c’est ce lieu d’affectation qui fixe le tarif pour une personne morale, et non le siège social. Une flotte rattachée à une agence de Lyon ou de Lille suit donc le tarif de cette région, sans majoration francilienne, même si la société a son siège à Paris.' },
      ];
    },
    body: (h) => {
      const d = releve(h);
      const t = h.M.tarifRegion(ID, d);
      const p = h.P.idfm.periodes;
      const rg = rang(h);
      const avant = parCv(h, ID, '2026-02-28');
      const apres27 = parCv(h, ID, '2027-02-01');
      const cvs = [4, 6, 8, 11];
      const rows = cvs.map((cv) => {
        const a = y1(h, cv, RECENTE);
        return [`${cv} CV`, h.eur2(a.regionale), h.eur2(a.majoration), h.eur2(titre(h, cv, RECENTE)), h.eur2(titre(h, cv, ANCIENNE))];
      });
      const e6 = y1(h, 6, RECENTE, d, 'electrique');
      const hdf = h.P.regions.find((r) => r.id === 'hauts-de-france')!;
      return `
<h2>Deux taxes réunies sur une seule ligne</h2>
<p>Le conseil régional a fixé son tarif à ${h.eur2(t.cv)} par cheval à compter du ${h.date(t.from!)}, par la ${h.src('delib_idf', 'délibération CR 2023-052')}, que nous avons lue. Ce tarif n’a pas bougé depuis. La nouveauté de 2026 vient d’ailleurs : l’article L421-54-1 du code des impositions sur les biens et services, créé par la ${h.src('lfi2026', 'loi de finances pour 2026')}, autorise une majoration au profit d’Île-de-France Mobilités, l’autorité qui organise les transports en commun de la région. Elle vaut ${h.eur2(p[0].cv)} par cheval du ${h.date(p[0].from)} au ${h.date(p[0].to!)}, par dérogation au plafond pérenne de ${h.eur2(h.P.idfm.plafond_legal)} inscrit dans le ${h.src('idfm', 'texte de l’article')}.</p>
<p>Le prix du cheval est ainsi passé de ${h.eur2(avant)} à ${h.eur2(t.cv + h.M.majorationIdfm(d))} en une nuit, sans vote régional. Le ${h.src('prixcv', 'simulateur officiel du prix du cheval')} affiche bien ce total pour une adresse parisienne.</p>

<h2>Ce que coûte une occasion achetée en Île-de-France</h2>
<p>Le tableau suit une voiture essence achetée d’occasion au ${h.date(d)}. Les deux premières colonnes découpent la taxe régionale d’une voiture de moins de dix ans ; les deux dernières donnent le prix complet du titre avant puis après dix ans ; il intègre les ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} que coûtent partout la ligne Y4 et l’envoi du certificat.</p>
${h.table(['Puissance', 'Part régionale', 'Part IDFM', 'Titre, moins de 10 ans', 'Titre, 10 ans ou plus'], rows, `Île-de-France, changement de titulaire au ${h.date(d)}.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Chaque cheval supplémentaire ajoute ${h.eur2(t.cv + h.M.majorationIdfm(d))} au titre d’une voiture récente, et ${h.eur2(y1(h, 1, ANCIENNE).y1)} à celui d’une voiture de dix ans ou plus : entre une citadine de 4 CV et une berline de 11 CV, l’écart atteint ${h.eur(titre(h, 11, RECENTE) - titre(h, 4, RECENTE))}.</p>

<h2>Le calendrier : 2026 puis 2027</h2>
<ul>
<li>Jusqu’au ${h.date('2026-02-28')} : ${h.eur2(avant)} par cheval, tarif régional seul.</li>
<li>Du ${h.date(p[0].from)} au ${h.date(p[0].to!)} : ${h.eur2(t.cv + p[0].cv)} par cheval.</li>
<li>À partir du ${h.date(p[1].from)} : ${h.eur2(apres27)} par cheval si aucune délibération n’intervient, puisque la majoration retombe à ${h.eur2(p[1].cv)}.</li>
</ul>
<p>Au ${h.date(d)}, nous n’avons trouvé aucune délibération d’Île-de-France Mobilités pour 2027, ni aucune hausse votée par la région. Île-de-France Mobilités peut encore relever sa part jusqu’au plafond de ${h.eur2(h.P.idfm.plafond_legal)}. Le ${h.a('calendrier-2027', 'calendrier 2027')} recense les autres changements attendus au 1er janvier.</p>

<h2>Plafond et réductions : ce que la majoration partage avec la taxe régionale</h2>
<p>La loi plafonne le tarif voté par une région à ${h.eur2(h.P.regional.plafond_cv)} par cheval, mais la majoration n’entre pas dans ce calcul : c’est la seule raison pour laquelle l’Île-de-France dépasse ce seuil. En revanche, elle subit toutes les réductions de la taxe régionale. Une voiture dont la première immatriculation, même à l’étranger, remonte à dix ans paie la moitié des deux parts, soit ${h.eur2(y1(h, 1, ANCIENNE).y1)} par cheval. Une moto L3e ou L4e paie aussi la moitié, quel que soit son âge, et un cyclomoteur ne paie rien. La page sur la ${h.a('dix-ans', 'règle des dix ans')} montre comment ce seuil peut guider le choix d’une occasion.</p>

<h2>Électrique : aucune remise francilienne</h2>
<p>Depuis 2025, la loi permet à chaque région de réduire de moitié ou de supprimer sa taxe pour les véhicules électriques et à hydrogène. L’Île-de-France n’en fait pas usage : une électrique de 6 CV paie ${h.eur2(e6.y1)}, comme une essence de même puissance, et la majoration s’applique aussi. Seule la région ${h.a('region-hauts-de-france', hdf.nom.fr)} accorde une réduction au ${h.date(d)}. L’électrique reste en revanche exonérée du malus CO₂ et du malus au poids lors d’une première immatriculation.</p>

<h2>Le rang de l’Île-de-France</h2>
<p>Avec ${h.eur2(t.cv + h.M.majorationIdfm(d))}, la région occupe la ${h.num(rg.pos)}re place sur ${h.num(rg.n)}, devant un groupe de régions au plafond de ${h.eur2(rg.suivant)}. L’écart est de ${h.eur2(rg.ecart)} par cheval, soit ${h.eur2(rg.ecart * 6)} sur une voiture de 6 CV. Hors majoration, le tarif régional francilien serait sous ce plafond. Le ${h.a('comparer-regions', 'comparateur des régions')} applique ces écarts à votre propre véhicule.</p>
`;
    },
  },
  en: {
    slug: 'region/ile-de-france',
    nav: 'Île-de-France',
    card: 'The Paris-region rate, the Île-de-France Mobilités surcharge and its planned cut in 2027.',
    title: 'Île-de-France car registration 2026: €68.95 per CV',
    description: 'Registering a car in Île-de-France in 2026: €54.95 regional rate plus a €14 IDFM surcharge per CV, €12 planned for 2027, half rate after 10 years, examples.',
    h1: 'Car registration in Île-de-France: the 2026 rate per horsepower',
    intro: 'The calculator above is set to Île-de-France: enter the horsepower and age of the vehicle to see the regional share and the surcharge side by side.',
    resume: (h) => {
      const d = releve(h);
      const t = h.M.tarifRegion(ID, d);
      const m = h.M.majorationIdfm(d);
      const p = h.P.idfm.periodes;
      const rg = rang(h);
      return `If you live in Paris or anywhere else in Île-de-France, each fiscal horsepower (cheval fiscal, the CV figure in box P.6 of the French registration certificate) costs ${h.eur2(t.cv + m)} on ${h.date(d)}. That is the highest rate of all ${h.num(rg.n)} French regions. It combines two levies collected together: the rate set by the regional council, ${h.eur2(t.cv)} since ${h.date(t.from!)}, a date we checked in the regional resolution, and a surcharge for Île-de-France Mobilités, the regional transport authority, of ${h.eur2(p[0].cv)} per CV since ${h.date(p[0].from)}. The surcharge comes from the 2026 Finance Act and drops to ${h.eur2(p[1].cv)} on ${h.date(p[1].from)} unless the authority votes otherwise, up to ${h.eur2(h.P.idfm.plafond_legal)}. A used 6 CV car under ten years old carries a regional tax of ${h.eur2(y1(h, 6, RECENTE).y1)} and a total certificate cost of ${h.eur2(titre(h, 6, RECENTE))}. Once the first registration is ten years old, both parts are halved. Electric cars pay the full rate here.`;
    },
    faqs: (h) => {
      const p = h.P.idfm.periodes;
      return [
        { q: 'Is the Île-de-France surcharge charged on top of the regional tax or included in it?', a: `On top. The French tax code adds it to the regional rate per CV, so a Paris-region buyer pays ${h.eur2(p[0].cv)} more per horsepower than the regional council alone would charge. Both amounts are paid in one go when you apply on the ANTS website, the state agency that issues registration certificates; there is no separate bill from the transport authority.` },
        { q: 'How much would a 9 CV car cost to register in Île-de-France after 1 January 2027?', a: `For a used petrol car under ten years old, the certificate costs ${h.eur2(titre(h, 9, RECENTE))} in 2026 and ${h.eur2(titre(h, 9, RECENTE, '2027-02-01'))} in 2027, assuming the surcharge falls to ${h.eur2(p[1].cv)} as the law provides by default. Île-de-France Mobilités may still vote a figure up to ${h.eur2(h.P.idfm.plafond_legal)}, and no such vote was known when these figures were compiled.` },
        { q: 'I am moving to Paris with a car registered abroad: which Île-de-France rate applies?', a: 'The rate in force on the day you apply, based on your new French address. The age reduction looks at the very first registration, wherever it took place, so a car first registered abroad ten or more years ago pays half of both the regional rate and the surcharge. You also need the customs or tax clearance described in the import pages before you can apply.' },
        { q: 'Does an electric car get any discount on registration in Île-de-France?', a: 'Not on the regional tax. The Paris region has not used the option to halve or waive its rate for electric and hydrogen vehicles, and the transport surcharge applies in full as well. The only saving comes from the national rules: a new or imported electric car is exempt from both the CO₂ malus and the weight malus, which can matter far more than the regional line.' },
      ];
    },
    body: (h) => {
      const d = releve(h);
      const t = h.M.tarifRegion(ID, d);
      const p = h.P.idfm.periodes;
      const rg = rang(h);
      const avant = parCv(h, ID, '2026-02-28');
      const apres27 = parCv(h, ID, '2027-02-01');
      const cvs = [5, 7, 9, 12];
      const rows = cvs.map((cv) => [`${cv} CV`, h.eur2(y1(h, cv, RECENTE).y1), h.eur2(titre(h, cv, RECENTE)), h.eur2(y1(h, cv, ANCIENNE).y1), h.eur2(titre(h, cv, ANCIENNE))]);
      const hdf = h.P.regions.find((r) => r.id === 'hauts-de-france')!;
      return `
<h2>Where the figure comes from</h2>
<p>The regional council of Île-de-France set its own rate at ${h.eur2(t.cv)} per CV from ${h.date(t.from!)} in ${h.src('delib_idf', 'resolution CR 2023-052')}, which we read at the source. That part has not changed since. What did change in 2026 is a second layer: article L421-54-1 of the tax code, introduced by the ${h.src('lfi2026', '2026 Finance Act')}, lets Île-de-France Mobilités, which runs the region’s buses, metro and trains, add its own amount per CV. It is ${h.eur2(p[0].cv)} from ${h.date(p[0].from)} to ${h.date(p[0].to!)}, an exception to the permanent ceiling of ${h.eur2(h.P.idfm.plafond_legal)} written into the ${h.src('idfm', 'article itself')}.</p>
<p>Before the surcharge, a CV cost ${h.eur2(avant)} in the region. The ${h.src('prixcv', 'official fiscal horsepower simulator')} now shows the combined figure for a Paris address.</p>

<h2>Worked examples for a used car</h2>
${h.table(['Horsepower', 'Regional tax, under 10 years', 'Certificate, under 10 years', 'Regional tax, 10 years or more', 'Certificate, 10 years or more'], rows, `Île-de-France, change of keeper, petrol car, on ${h.date(d)}.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Each certificate figure carries ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} of national charges on top of the regional tax: ${h.eur2(h.P.national.taxe_fixe)} of flat-rate tax and ${h.eur2(h.P.national.redevance)} for posting the document. A new or imported car would also carry the CO₂ and weight malus, which the calculator above adds when you choose that case.</p>

<h2>What changes in 2027</h2>
<p>The law sets the surcharge at ${h.eur2(p[1].cv)} from ${h.date(p[1].from)}, which would bring the rate to ${h.eur2(apres27)} per CV. Île-de-France Mobilités can still vote a higher amount within its ${h.eur2(h.P.idfm.plafond_legal)} limit. On ${h.date(d)} we found no such vote, and no new regional rate either. The ${h.a('calendrier-2027', '2027 changes page')} lists the national adjustments due at the same time, including a stricter CO₂ malus.</p>

<h2>The cap, and the reductions the surcharge shares</h2>
<p>Regional rates are capped at ${h.eur2(h.P.regional.plafond_cv)} per CV, but the surcharge sits outside that cap, which is why Île-de-France is the only region above it. It does follow every reduction of the regional tax:</p>
<ul>
<li>a car first registered ten or more years ago, in France or abroad, pays half of both parts;</li>
<li>motorbikes in categories L3e and L4e pay half at any age, and mopeds pay nothing;</li>
<li>no regional tax, and so no surcharge, on a duplicate, an address change or adding a spouse or civil partner.</li>
</ul>
<p>The ${h.a('dix-ans', 'ten-year rule page')} shows how much that half rate can save on an older car bought here.</p>

<h2>Electric cars</h2>
<p>Regions may halve or waive their rate for electric and hydrogen vehicles. Île-de-France does not, so an electric car pays exactly what a petrol car of the same CV pays, surcharge included. On ${h.date(d)} only ${h.a('region-hauts-de-france', hdf.nom.en)} grants such a reduction.</p>

<h2>How Île-de-France ranks</h2>
<p>It is number ${h.num(rg.pos)} of ${h.num(rg.n)}, ${h.eur2(rg.ecart)} per CV above the regions charging ${h.eur2(rg.suivant)}. On a 7 CV car that gap is worth ${h.eur2(rg.ecart * 7)}. The ${h.a('comparer-regions', 'region comparison')} runs the same car through every region if you are choosing where to register a company vehicle.</p>
`;
    },
  },
});
