import { defineGuide, type Helpers } from '../../lib/guide-types';

/** Quatre profils d'achat, calculés par le moteur à la date du relevé des tarifs. */
const profils = (h: Helpers, region: string) => {
  const d = h.P.regional.date_releve;
  const base = { region, dateOp: d, ptacKg: 0, genre: 'vp' as const };
  return {
    neuf: h.M.coutCarteGrise({ ...base, demarche: 'immat', origine: 'france_neuf', energie: 'essence', cv: 6, date1re: d, gkm: 128, masseKg: 1350 }),
    recente: h.M.coutCarteGrise({ ...base, demarche: 'titulaire', origine: 'france_occasion', energie: 'diesel', cv: 6, date1re: '2023-05-01', gkm: 0, masseKg: 0 }),
    ancienne: h.M.coutCarteGrise({ ...base, demarche: 'titulaire', origine: 'france_occasion', energie: 'essence', cv: 5, date1re: '2014-06-01', gkm: 0, masseKg: 0 }),
    electrique: h.M.coutCarteGrise({ ...base, demarche: 'immat', origine: 'france_neuf', energie: 'electrique', cv: 4, date1re: d, gkm: 0, masseKg: 1800 }),
  };
};
const REGIONS = ['ile-de-france', 'bourgogne-franche-comte', 'auvergne-rhone-alpes', 'hauts-de-france'];
const nom = (h: Helpers, id: string) => h.P.regions.find((r) => r.id === id)!.nom[h.lang];
const seuilMasse = (h: Helpers) => h.P.malus_masse.annees['2026'].tranches[0].min;

export default defineGuide({
  id: 'budget-achat',
  group: 'guides',
  order: 40,
  mini: 'budget',
  miniHref: 'home',
  related: ['occasion-titulaire', 'voiture-neuve', 'taxes-ou-frais', 'dix-ans', 'comparer-regions', 'electrique-hybride'],
  sources: ['f19211', 'f35947', 'r322_5', 'r49', 'ants', 'prixcv'],
  fr: {
    slug: 'budget-achat-voiture',
    nav: 'Budget d’un achat',
    card: 'Carte grise calculée, plaques, contrôle technique, assurance : tout ce qui s’ajoute au prix affiché.',
    title: 'Budget achat voiture 2026 : carte grise, plaques, assurance',
    description: 'Budget d’un achat de voiture en 2026 : carte grise calculée selon la région, plaques, contrôle technique, assurance et frais de service, neuf ou occasion.',
    h1: 'Le budget complet d’un achat de voiture en 2026',
    intro: 'Le mini-simulateur calcule la carte grise et additionne les montants de vos devis pour donner ce que coûte l’achat en plus du prix.',
    resume: (h) => {
      const idf = profils(h, 'ile-de-france');
      const ara = profils(h, 'auvergne-rhone-alpes');
      return `Le prix affiché d’une voiture n’est jamais le coût final : il faut y ajouter la carte grise, les plaques, parfois un contrôle technique, l’assurance et, si l’on délègue la démarche, des frais de service. Seule la carte grise obéit à un barème public, et c’est elle qui varie le plus d’une région à l’autre. Au ${h.date(h.P.regional.date_releve)}, une occasion diesel de 6 CV de trois ans coûte ${h.eur2(ara.recente.total)} de carte grise en ${nom(h, 'auvergne-rhone-alpes')} et ${h.eur2(idf.recente.total)} en ${nom(h, 'ile-de-france')}. Une essence de 5 CV de plus de dix ans tombe à ${h.eur2(ara.ancienne.total)} et ${h.eur2(idf.ancienne.total)}, car la taxe régionale est réduite de moitié. Une voiture neuve à 128 g/km ajoute un malus de ${h.eur(idf.neuf.malus.co2)}, ce qui porte le titre à ${h.eur2(idf.neuf.total)} en ${nom(h, 'ile-de-france')}. Les autres postes dépendent du vendeur, de l’assureur et du garage : demandez-les par écrit et saisissez-les dans le simulateur pour obtenir un total fiable.`;
    },
    faqs: (h) => {
      const a = profils(h, 'auvergne-rhone-alpes');
      return [
        { q: 'Faut-il compter la carte grise dans le budget d’une voiture d’occasion achetée à un particulier ?', a: `Oui, car c’est l’acheteur qui la paie. Le vendeur remet le certificat barré et le code de cession, puis vous avez ${h.num(h.P.national.delai_titulaire_mois)} mois pour faire la demande au nouveau nom. Sur le site de l’ANTS, la démarche est gratuite et seules les taxes sont dues : par exemple ${h.eur2(a.recente.total)} pour une 6 CV de trois ans en ${nom(h, 'auvergne-rhone-alpes')}.` },
        { q: 'Que coûte un retard de carte grise dans le budget d’un achat ?', a: `Rouler au-delà du délai d’un mois sans avoir demandé le certificat à son nom expose à une contravention de quatrième classe, soit une amende forfaitaire de ${h.eur(h.P.national.amende_titulaire)}, et le véhicule peut être immobilisé. La taxe elle-même ne change pas avec le retard. Mieux vaut donc prévoir la somme de la carte grise dès la signature, et non quelques semaines plus tard.` },
        { q: 'Le prix des plaques est-il inclus dans la carte grise ?', a: 'Non. Les taxes du certificat ne couvrent ni les plaques ni leur pose. Elles s’achètent à part chez un garagiste, un centre auto ou un fabricant agréé, sur présentation du certificat, et le tarif varie selon la matière et le lieu. Demandez le prix avant de vous engager, puis saisissez-le dans le champ prévu du simulateur.' },
        { q: 'Le contrôle technique fait-il partie du budget d’une occasion de plus de quatre ans ?', a: 'Pour une voiture de plus de quatre ans, le vendeur doit en principe remettre un procès-verbal de contrôle technique daté de moins de six mois. Quand le rapport impose une contre-visite, ou si vous voulez un contrôle plus récent, la dépense revient souvent à l’acheteur : faites-vous indiquer le prix par un centre agréé et notez-le dans le champ correspondant.' },
        { q: 'Une voiture électrique allège-t-elle vraiment le budget de carte grise ?', a: `Elle échappe aux deux malus, ce qui pèse lourd sur un neuf. La taxe régionale, elle, est due au plein tarif partout, à une exception près : les ${nom(h, 'hauts-de-france')} n’en font payer que la moitié. Une électrique neuve de 4 CV coûte ainsi ${h.eur2(profils(h, 'hauts-de-france').electrique.total)} dans cette région et ${h.eur2(a.electrique.total)} en ${nom(h, 'auvergne-rhone-alpes')}.` },
        { q: 'Les frais de mise à la route d’un concessionnaire comprennent-ils la carte grise ?', a: 'Parfois en partie seulement. Un vendeur professionnel peut regrouper sous ce nom les taxes de la carte grise, sa propre prestation, la préparation du véhicule ou les plaques. Demandez une facture qui sépare les taxes, reversées à l’État et à la région, de ses frais : vous pourrez alors comparer les taxes au résultat du simulateur.' },
        { q: 'Faut-il s’assurer avant de récupérer la voiture achetée ?', a: 'Oui. Un véhicule qui circule doit être assuré au moins en responsabilité civile, y compris pour le trajet entre le vendeur et votre domicile. Le prix dépend du profil du conducteur, du modèle, de l’usage et du lieu de stationnement, aucun barème public ne le fixe. Comparez plusieurs devis et inscrivez la prime de la première année dans le simulateur.' },
      ];
    },
    body: (h) => {
      const d = h.P.regional.date_releve;
      const p = Object.fromEntries(REGIONS.map((r) => [r, profils(h, r)]));
      const ligne = (k: 'neuf' | 'recente' | 'ancienne' | 'electrique', label: string) => [label, ...REGIONS.map((r) => h.eur2(p[r][k].total))];
      const idf = p['ile-de-france'];
      const malus2027 = h.M.malusCO2Brut(128, '2027');
      return `
<h2>Les cinq postes à additionner au prix</h2>
<ul>
<li><strong>La carte grise</strong> : la part régionale, proportionnelle aux chevaux fiscaux, puis ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} de frais nationaux identiques partout (taxe de gestion et envoi du titre) et, pour une voiture neuve ou importée, les deux malus. C’est le seul poste que le simulateur calcule.</li>
<li><strong>Les plaques</strong> : une paire à faire fabriquer et poser après l’attribution du numéro, ou à changer si l’ancien numéro ne correspond plus. Prix à demander au poseur.</li>
<li><strong>Le contrôle technique</strong> : pour une occasion de plus de quatre ans, le vendeur fournit en règle générale un procès-verbal de moins de six mois. Une contre-visite ou un nouveau contrôle reste à chiffrer auprès d’un centre agréé.</li>
<li><strong>L’assurance</strong> : obligatoire avant le premier trajet. Elle dépend du conducteur et du modèle, donc d’un devis personnel.</li>
<li><strong>Les frais d’un professionnel</strong> : facultatifs. La demande est gratuite sur le ${h.src('ants', 'site de l’ANTS')} ; un professionnel habilité peut la faire à votre place moyennant une rémunération facturée en plus des taxes. La page ${h.a('taxes-ou-frais', 'taxes ou frais de service')} aide à séparer les deux sur une facture.</li>
</ul>

<h2>Quatre budgets types, carte grise calculée</h2>
<p>Les montants ci-dessous sortent du moteur du site au ${h.date(d)}, pour quatre profils fréquents et quatre régions aux tarifs contrastés. Le neuf thermique est une essence de 6 CV émettant 128 g/km pour 1 350 kg ; l’occasion récente une diesel de 6 CV mise en circulation en mai 2023 ; l’ancienne une essence de 5 CV de juin 2014 ; l’électrique une neuve de 4 CV et 1 800 kg.</p>
${h.table(['Profil', ...REGIONS.map((r) => nom(h, r))], [ligne('neuf', 'Neuve essence, 6 CV'), ligne('recente', 'Occasion de trois ans, 6 CV'), ligne('ancienne', 'Occasion de plus de dix ans, 5 CV'), ligne('electrique', 'Neuve électrique, 4 CV')], `Coût de la carte grise au ${h.date(d)}, taxes seules, sans plaques ni assurance.`, ['l', 'r', 'r', 'r', 'r'])}
<p>Pour chacun de ces profils, les plaques, le contrôle technique, l’assurance et d’éventuels frais de service restent des montants à demander et à saisir : ils ne suivent aucun barème national, et un chiffre moyen donnerait une fausse précision.</p>

<h3>La voiture neuve thermique</h3>
<p>Le malus CO₂ de ${h.eur(idf.neuf.malus.co2)} est le même dans toutes les régions, puisqu’il relève d’un barème national fondé sur l’année de première immatriculation. La masse de 1 350 kg reste sous le seuil de ${h.num(seuilMasse(h))} kg du malus au poids, qui vaut donc zéro. La différence entre régions ne tient qu’à la taxe régionale : ${h.eur2(idf.neuf.y1.y1)} en ${nom(h, 'ile-de-france')}, majoration d’Île-de-France Mobilités comprise, contre ${h.eur2(p['auvergne-rhone-alpes'].neuf.y1.y1)} en ${nom(h, 'auvergne-rhone-alpes')}. Chez un concessionnaire, vérifiez si ces taxes figurent déjà dans un forfait de mise à la route.</p>

<h3>L’occasion récente</h3>
<p>Aucun malus n’est dû, car il a été payé lors de la première immatriculation en France. Le titre se résume à la part régionale entière et aux frais nationaux fixes. C’est le profil où le choix de la région de domicile, qui fixe le tarif, pèse le plus en proportion.</p>

<h3>L’occasion de plus de dix ans</h3>
<p>Dès que la première immatriculation remonte à dix ans ou plus, la part régionale ne compte plus que pour moitié. Une voiture de 5 CV coûte alors ${h.eur2(p['bourgogne-franche-comte'].ancienne.total)} de carte grise en ${nom(h, 'bourgogne-franche-comte')}, région au plafond légal. Si l’achat se joue à quelques semaines de ce cap, le guide ${h.a('dix-ans', 'acheter avant ou après dix ans')} chiffre l’écart.</p>

<h3>L’électrique neuve</h3>
<p>Pas de malus CO₂ ni de malus au poids, même au-delà de ${h.num(seuilMasse(h))} kg. Reste la taxe régionale : plein tarif presque partout, moitié en ${nom(h, 'hauts-de-france')}, d’où ${h.eur2(p['hauts-de-france'].electrique.total)} dans cette région contre ${h.eur2(idf.electrique.total)} en ${nom(h, 'ile-de-france')}. La page ${h.a('electrique-hybride', 'voiture électrique ou hybride')} détaille le cas des hybrides, qui gardent un malus.</p>

<h2>Le moment de l’achat change la facture</h2>
<p>Le malus d’une voiture neuve suit le barème de l’année de sa première immatriculation, pas celle de la commande. La même essence à 128 g/km paie ${h.eur(h.M.malusCO2Brut(128, '2026'))} si elle est immatriculée en 2026 et ${h.eur(malus2027)} si elle l’est en 2027, car le seuil descend à ${h.num(h.P.malus_co2.annees['2027'].seuil)} g/km. En ${nom(h, 'ile-de-france')}, la majoration passe à l’inverse de ${h.eur2(h.P.idfm.periodes[0].cv)} à ${h.eur2(h.P.idfm.periodes[1].cv)} par cheval au ${h.date(h.P.idfm.periodes[1].from)}, sauf nouvelle décision. Pour une livraison prévue en fin d’année, faites préciser la date d’immatriculation sur le bon de commande.</p>
<p>Côté calendrier, la demande au nouveau nom doit être faite dans le mois qui suit l’achat d’une occasion (${h.src('r322_5', 'article R322-5 du code de la route')}). Au-delà, l’amende forfaitaire est de ${h.eur(h.P.national.amende_titulaire)} (${h.src('r49', 'article R49 du code de procédure pénale')}). Prévoir la somme dès la signature évite de différer la démarche.</p>

<h2>Remplir le mini-simulateur</h2>
<p>Choisissez la région de votre domicile et la puissance fiscale inscrite en case P.6 : la carte grise est calculée pour une occasion de six ans, sans malus. Remplacez ensuite les valeurs proposées pour les plaques, le contrôle technique et l’assurance par celles de vos devis ; elles ne servent qu’à remplir les cases et ne sont pas des moyennes. Le total affiché correspond à ce qui s’ajoute au prix d’achat. Pour une voiture neuve ou importée, ou un véhicule d’un autre âge, passez au ${h.a('home', 'calcul complet')}, qui intègre les malus, puis reportez le montant obtenu à la ligne de la carte grise. Pour un cas de cession entre particuliers, la page ${h.a('occasion-titulaire', 'changement de titulaire')} récapitule les pièces à réunir.</p>
`;
    },
  },
  en: {
    slug: 'car-purchase-budget',
    nav: 'Car purchase budget',
    card: 'Registration worked out, plus plates, roadworthiness test and insurance: what comes on top of the price.',
    title: 'Car purchase budget in France 2026: registration and extras',
    description: 'Budget for buying a car in France in 2026: registration cost worked out by region, plus number plates, roadworthiness test, insurance and optional service fees.',
    h1: 'The full budget of buying a car in France in 2026',
    intro: 'The mini-calculator works out the registration certificate and adds your quotes, giving what the purchase costs on top of the price.',
    resume: (h) => {
      const idf = profils(h, 'ile-de-france');
      const ara = profils(h, 'auvergne-rhone-alpes');
      return `The sticker price of a car in France is never the whole cost. On top of it come the registration certificate, known as the carte grise, the number plates, sometimes a roadworthiness test, insurance and, if someone handles the paperwork for you, a service fee. Only the carte grise follows a public scale, and it is the item that varies most between regions, because each region sets its own rate per fiscal horsepower. On ${h.date(h.P.regional.date_releve)}, a three-year-old 6 CV diesel costs ${h.eur2(ara.recente.total)} to register in ${nom(h, 'auvergne-rhone-alpes')} and ${h.eur2(idf.recente.total)} in ${nom(h, 'ile-de-france')}. A 5 CV petrol car over ten years old drops to ${h.eur2(ara.ancienne.total)} and ${h.eur2(idf.ancienne.total)}, since the regional tax is halved. A new car emitting 128 g/km carries a CO₂ malus of ${h.eur(idf.neuf.malus.co2)}, taking the certificate to ${h.eur2(idf.neuf.total)} in ${nom(h, 'ile-de-france')}. Everything else depends on the seller, insurer and garage: get written quotes and enter them in the calculator.`;
    },
    faqs: (h) => {
      const a = profils(h, 'auvergne-rhone-alpes');
      return [
        { q: 'Who pays for the carte grise when buying a used car privately in France?', a: `The buyer does. The seller hands over the crossed-out certificate and a transfer code, and you then have ${h.num(h.P.national.delai_titulaire_mois)} month to apply in your own name on the ANTS website, the national agency for secure documents. The application itself is free; you only pay the taxes, for instance ${h.eur2(a.recente.total)} for a three-year-old 6 CV car in ${nom(h, 'auvergne-rhone-alpes')}.` },
        { q: 'What happens to my budget if I register the car late?', a: `Driving beyond the one-month deadline without having applied for a certificate in your name is a fourth-class offence, with a fixed fine of ${h.eur(h.P.national.amende_titulaire)}, and the car can be taken off the road. The tax itself does not rise with the delay. Set the registration money aside on the day you sign rather than weeks later, and apply straight away.` },
        { q: 'Are number plates part of the registration fee in France?', a: 'No. The certificate taxes cover neither the plates nor their fitting. Plates are bought separately from a garage, a car centre or an approved maker, on showing the certificate, and prices vary with the material and the shop. Ask for the price before committing and type it into the plates field of the calculator.' },
        { q: 'Do I need to budget for a roadworthiness test on a used car?', a: 'For a car over four years old, the seller is normally expected to hand over a roadworthiness test report, the contrôle technique, less than six months old. If the report requires a follow-up inspection, or you want a fresher test, the cost often falls on the buyer. Ask an approved test centre for its price and enter it in the matching field.' },
        { q: 'Does an electric car make registration cheaper in France?', a: `It escapes both the CO₂ and the weight malus, which matters a great deal on a new car. The regional tax is still charged at the full rate everywhere except ${nom(h, 'hauts-de-france')}, which halves it. A new 4 CV electric car therefore costs ${h.eur2(profils(h, 'hauts-de-france').electrique.total)} to register there and ${h.eur2(a.electrique.total)} in ${nom(h, 'auvergne-rhone-alpes')}.` },
        { q: 'What are dealer “frais de mise à la route” and do they include the registration?', a: 'It is a dealer’s bundle of on-the-road charges, and it may include the registration taxes, the dealer’s own handling fee, vehicle preparation or plates. Ask for an invoice that separates the taxes, which go to the State and the region, from the dealer’s charges. You can then check the tax part against the result of the calculator.' },
        { q: 'When must the car be insured after purchase?', a: 'Before it moves. Any vehicle on the road in France must carry at least third-party cover, including the drive home from the seller. The premium depends on the driver, the model, its use and where it is parked, and no public scale sets it. Compare several quotes and enter the first-year premium in the calculator to complete the budget.' },
      ];
    },
    body: (h) => {
      const d = h.P.regional.date_releve;
      const p = Object.fromEntries(REGIONS.map((r) => [r, profils(h, r)]));
      const ligne = (k: 'neuf' | 'recente' | 'ancienne' | 'electrique', label: string) => [label, ...REGIONS.map((r) => h.eur2(p[r][k].total))];
      const idf = p['ile-de-france'];
      return `
<h2>Five items to add to the price</h2>
<ul>
<li><strong>Registration</strong>: the regional share, proportional to fiscal horsepower (the CV figure in box P.6 of the certificate), then ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} of flat national charges for handling and posting the certificate and, for a new or imported car, the CO₂ and weight malus. This is the only item the calculator works out.</li>
<li><strong>Number plates</strong>: a pair made and fitted once the number is issued, or replaced if the old number no longer applies. Ask the fitter for a price.</li>
<li><strong>Roadworthiness test</strong>: for a used car over four years old, the seller as a rule supplies a report less than six months old. A follow-up test or a fresh one has to be priced by an approved centre.</li>
<li><strong>Insurance</strong>: compulsory before the first journey, and priced on a personal quote.</li>
<li><strong>A professional’s fee</strong>: optional. Applying is free on the ${h.src('ants', 'ANTS website')}; an approved professional can apply for you for a service fee charged on top of the taxes. The ${h.a('taxes-ou-frais', 'taxes vs service fees')} page shows how to tell the two apart on an invoice.</li>
</ul>

<h2>Four sample budgets with the registration worked out</h2>
<p>The amounts below come from the site’s engine on ${h.date(d)}, for four common profiles in four regions with contrasting rates. The new petrol car is a 6 CV model emitting 128 g/km and weighing 1,350 kg; the recent used car a 6 CV diesel first registered in May 2023; the older one a 5 CV petrol car from June 2014; the electric car a new 4 CV model of 1,800 kg.</p>
${h.table(['Profile', ...REGIONS.map((r) => nom(h, r))], [ligne('neuf', 'New petrol, 6 CV'), ligne('recente', 'Three-year-old used, 6 CV'), ligne('ancienne', 'Used, over ten years, 5 CV'), ligne('electrique', 'New electric, 4 CV')], `Registration cost on ${h.date(d)}, taxes only, no plates or insurance.`, ['l', 'r', 'r', 'r', 'r'])}
<p>For every profile, plates, the test, insurance and any service fee are amounts to request and enter yourself. None of them follows a national scale, and an average would only give a false sense of precision.</p>

<h3>New petrol car</h3>
<p>The CO₂ malus of ${h.eur(idf.neuf.malus.co2)} is identical in every region, because it follows a national scale tied to the year of first registration. At 1,350 kg the car stays below the ${h.num(seuilMasse(h))} kg threshold of the weight malus, so that line is zero. Regional differences come from the regional tax alone: ${h.eur2(idf.neuf.y1.y1)} in ${nom(h, 'ile-de-france')}, transport surcharge included, against ${h.eur2(p['auvergne-rhone-alpes'].neuf.y1.y1)} in ${nom(h, 'auvergne-rhone-alpes')}. With a dealer, check whether these taxes already sit inside an on-the-road package.</p>

<h3>Recent used car</h3>
<p>No malus is due: it was paid when the car was first registered in France. The certificate comes down to the full regional share plus the flat national charges, which makes this the profile where your home region, the one that sets the rate, weighs most in relative terms.</p>

<h3>Used car over ten years old</h3>
<p>Once the first registration is ten years old or more, the regional tax is cut by half. A 5 CV car then costs ${h.eur2(p['bourgogne-franche-comte'].ancienne.total)} to register in ${nom(h, 'bourgogne-franche-comte')}, a region charging the legal maximum. If the purchase falls a few weeks short of that milestone, the ${h.a('dix-ans', 'ten-year rule guide')} prices the gap.</p>

<h3>New electric car</h3>
<p>No CO₂ malus and no weight malus, even above ${h.num(seuilMasse(h))} kg. The regional tax remains: full rate almost everywhere, half in ${nom(h, 'hauts-de-france')}, hence ${h.eur2(p['hauts-de-france'].electrique.total)} there against ${h.eur2(idf.electrique.total)} in ${nom(h, 'ile-de-france')}. The ${h.a('electrique-hybride', 'electric and hybrid car')} page covers hybrids, which still pay a malus.</p>

<h2>Timing changes the bill</h2>
<p>A new car’s malus follows the scale of the year it is first registered, not the year it was ordered. The same petrol car at 128 g/km pays ${h.eur(h.M.malusCO2Brut(128, '2026'))} if registered in 2026 and ${h.eur(h.M.malusCO2Brut(128, '2027'))} if registered in 2027, as the threshold drops to ${h.num(h.P.malus_co2.annees['2027'].seuil)} g/km. In ${nom(h, 'ile-de-france')}, the surcharge moves the other way, from ${h.eur2(h.P.idfm.periodes[0].cv)} to ${h.eur2(h.P.idfm.periodes[1].cv)} per CV on ${h.date(h.P.idfm.periodes[1].from)}, unless the transport authority decides otherwise. For a delivery late in the year, have the registration date written on the order form.</p>
<p>For a used car, the application in your name is due within one month of the sale (${h.src('r322_5', 'Highway Code, article R322-5')}); after that the fixed fine is ${h.eur(h.P.national.amende_titulaire)} (${h.src('r49', 'Code of Criminal Procedure, article R49')}). Keeping the sum ready on signing day means there is no reason to wait.</p>

<h2>Using the mini-calculator</h2>
<p>Pick the region where you live and the fiscal horsepower in box P.6: the registration is worked out for a six-year-old used car, with no malus. Then overwrite the suggested figures for plates, the test and insurance with your own quotes; they only fill the boxes and are not averages. The total is what comes on top of the purchase price. For a new or imported car, or a car of a different age, use the ${h.a('home', 'full calculation')}, which includes the malus, and carry its result over to the registration line. For a private sale, the ${h.a('occasion-titulaire', 'used car transfer')} page lists the documents to gather.</p>
`;
    },
  },
});
