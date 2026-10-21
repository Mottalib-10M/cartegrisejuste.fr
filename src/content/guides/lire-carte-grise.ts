import { defineGuide, type Helpers } from '../../lib/guide-types';

/** Jour de référence des exemples : date du relevé des tarifs. */
const jour = (h: Helpers) => h.P.regional.date_releve;
/** Changement de titulaire d'une voiture déjà immatriculée en France. */
const occasion = (h: Helpers, region: string, cv: number, date1re: string) =>
  h.M.coutCarteGrise({ demarche: 'titulaire', region, origine: 'france_occasion', energie: 'essence', genre: 'vp', cv, date1re, dateOp: jour(h), gkm: 0, masseKg: 0, ptacKg: 0 });
/** Voiture neuve essence, 7 CV, 125 g/km, 1 550 kg, en Île-de-France. */
const neuve = (h: Helpers) =>
  h.M.coutCarteGrise({ demarche: 'immat', region: 'ile-de-france', origine: 'france_neuf', energie: 'essence', genre: 'vp', cv: 7, date1re: jour(h), dateOp: jour(h), gkm: 125, masseKg: 1550, ptacKg: 0 });
/** Camionnette d'occasion de 3,5 t de PTAC en Bretagne. */
const camionnette = (h: Helpers) =>
  h.M.coutCarteGrise({ demarche: 'titulaire', region: 'bretagne', origine: 'france_occasion', energie: 'diesel', genre: 'utilitaire', cv: 6, date1re: '2022-05-01', dateOp: jour(h), gkm: 0, masseKg: 0, ptacKg: 3500 });
/** Régions dont le tarif a changé au cours de 2026. */
const changees2026 = (h: Helpers) => h.P.regions.filter((r) => r.tarifs.some((t) => t.from !== null && t.from.startsWith('2026'))).sort((a, b) => a.nom.fr.localeCompare(b.nom.fr));
const hdfExo = (h: Helpers) => h.P.regions.find((r) => r.id === 'hauts-de-france')!.propres[0];
const paca = (h: Helpers) => h.M.tarifRegion('provence-alpes-cote-dazur', jour(h)).cv;
const idf = (h: Helpers) => h.M.tarifRegion('ile-de-france', jour(h)).cv + h.M.majorationIdfm(jour(h));

export default defineGuide({
  id: 'lire-carte-grise',
  group: 'guides',
  order: 10,
  mini: 'lireCarte',
  miniHref: 'home',
  related: ['tarif-cheval-fiscal', 'calcul-chevaux-fiscaux', 'malus-masse', 'malus-co2', 'adresse-duplicata', 'occasion-titulaire'],
  sources: ['f19211', 'cibs', 'prixcv', 'l421_16', 'f35950', 'a421_26'],
  fr: {
    slug: 'lire-sa-carte-grise',
    nav: 'Lire sa carte grise',
    card: 'Les cases utiles du certificat, de A à Y6, et la méthode pour retrouver le montant payé.',
    title: 'Carte grise : lire chaque case et retrouver le montant payé',
    description: 'Lire sa carte grise case par case : A, B, C.1, D, F, G, J, P.1 à P.6, V.7 et les lignes Y1 à Y6, puis recalculer le total payé et repérer les erreurs.',
    h1: 'Lire sa carte grise case par case',
    intro: 'Saisissez la région, la puissance en P.6, l’année en B et le montant imprimé en Y1 : le contrôle compare ce montant au tarif en vigueur.',
    resume: (h) => {
      const a = occasion(h, 'provence-alpes-cote-dazur', 5, '2023-06-01');
      return `Le certificat d’immatriculation, la carte grise, réunit toutes les données qui ont servi à fixer son prix. La case P.6 donne la puissance fiscale en chevaux, la case B la date de première immatriculation, la case C.3 l’adresse du titulaire, qui désigne la région compétente, et les lignes Y1 à Y6 détaillent ce qui a été payé : Y1 la taxe régionale, Y2 la taxe sur les véhicules de transport, Y3 les malus, puis ${h.eur2(h.P.national.taxe_fixe)} de taxe fixe en Y4, ${h.eur2(h.P.national.redevance)} pour l’envoi postal en Y5, et le total en Y6. Pour vérifier Y1, multipliez le tarif de la région à la date du titre par la valeur de P.6, puis divisez par deux si la case B remonte à ${h.num(h.P.regional.age_reduction_ans)} ans ou plus. Une voiture de 5 CV de 2023 immatriculée en Provence-Alpes-Côte d’Azur donne ainsi ${h.eur2(a.y1.y1)} en Y1 et ${h.eur2(a.total)} en Y6. Le total arrondit Y1 à Y4 à l’euro avant d’ajouter Y5. Les kilowatts de la case P.2 ne servent pas à recalculer la taxe d’un titre déjà émis.`;
    },
    faqs: (h) => [
      { q: 'Sur la carte grise, quelle case donne les chevaux à retenir pour la taxe ?', a: `La case P.6, intitulée puissance administrative nationale. C’est elle que la taxe régionale multiplie par le tarif du cheval. Le code des impositions présume exacte la valeur imprimée : vous n’avez pas à la recalculer. La case P.2, exprimée en kilowatts, ne sert qu’à estimer cette puissance quand le titre n’existe pas encore, pour une voiture neuve ou importée.` },
      { q: 'Pourquoi la case Y1 de ma carte grise est-elle à zéro ?', a: `Parce que le titre a été émis sans changement de propriétaire, ou pour un véhicule exonéré. Un duplicata, un ajout ou un retrait de conjoint ne portent pas de taxe régionale. Un cyclomoteur a un tarif nul. Dans les Hauts-de-France, une voiture électrique immatriculée entre le ${h.date(hdfExo(h).from)} et le ${h.date(hdfExo(h).to!)} était entièrement exonérée.` },
      { q: 'Le malus inscrit en case Y3 d’une voiture d’occasion sera-t-il payé de nouveau ?', a: 'Non. Les deux malus, CO₂ et poids, ne frappent la voiture qu’une fois : quand elle reçoit sa première immatriculation française. Le montant visible en Y3 renseigne sur ce qu’a payé le premier propriétaire, ce qui peut servir à négocier, mais l’acheteur suivant ne règle que la taxe régionale, la taxe fixe et la redevance, plus la taxe de transport pour un utilitaire.' },
      { q: 'Que contient la case B d’un véhicule venu de l’étranger ?', a: `La date de sa toute première immatriculation, même hors de France, et non celle de son arrivée. C’est cette date qui déclenche la réduction de moitié à ${h.num(h.P.regional.age_reduction_ans)} ans et qui fixe la décote du malus d’un import d’occasion. Vérifiez-la sur le titre étranger avant la demande : une erreur de saisie se répercute sur tout le calcul.` },
      { q: 'Quelle différence entre les cases F.1, F.2 et G de la carte grise ?', a: `F.1 donne la masse en charge maximale techniquement admissible, F.2 la masse maximale admise en service en France, et G la masse du véhicule en service. La taxe sur les véhicules de transport d’un utilitaire suit la masse en charge maximale, avec un premier palier jusqu’à ${h.num(h.P.y2.bareme[0].ptac_max!)} kg. Le malus au poids d’une voiture neuve part de la masse en ordre de marche.` },
      { q: 'Le total en case Y6 ne correspond pas au centime près à ma somme : est-ce normal ?', a: `Oui. La somme de Y1, Y2, Y3 et Y4 est arrondie à l’euro, puis la redevance de ${h.eur2(h.P.national.redevance)} est ajoutée telle quelle. Une taxe régionale à demi-tarif tombe souvent sur des centimes, qui disparaissent dans l’arrondi. Un écart de plus d’un euro vient en général d’un tarif d’une autre date ou d’une autre région.` },
      { q: 'Combien coûte la correction d’une erreur sur une carte grise ?', a: `Quand l’erreur vient de l’administration, la taxe fixe n’est pas due et vous ne réglez que les ${h.eur2(h.P.national.redevance)} d’envoi postal. Il n’y a pas de taxe régionale, faute de changement de propriétaire. La demande se fait sur le site de l’ANTS, avec le titre et le justificatif de la bonne donnée, comme la facture ou le certificat de conformité.` },
    ],
    body: (h) => {
      const d = jour(h);
      const a = occasion(h, 'provence-alpes-cote-dazur', 5, '2023-06-01');
      const b = occasion(h, 'ile-de-france', 7, '2014-04-01');
      const n = neuve(h);
      const c = camionnette(h);
      const ch = changees2026(h);
      const seuilMasse = h.P.malus_masse.annees['2026'].tranches[0].min;
      const rows = [
        ['A', 'Numéro d’immatriculation', 'Aucun : il suit le véhicule'],
        ['B', 'Date de première immatriculation, même à l’étranger', `Moitié de Y1 à ${h.num(h.P.regional.age_reduction_ans)} ans ; barème et décote du malus`],
        ['C.1 et C.3', 'Titulaire et adresse', 'L’adresse désigne la région qui fixe le tarif'],
        ['D.1, D.2, D.3', 'Marque, type et version, nom commercial', 'Identifie le modèle pour vérifier P.6'],
        ['F.1 et F.2', 'Masse en charge maximale technique, puis admise en service', 'Palier de Y2 pour un utilitaire'],
        ['G', 'Masse du véhicule en service', 'Repère pour le malus au poids'],
        ['J et J.1', 'Catégorie européenne (M1, N1, L3e…) et genre national (VP, CTTE, VASP, MTT…)', 'Demi-tarif des motos, Y2, champ du malus'],
        ['P.1', 'Cylindrée en cm³', 'Puissance fiscale des deux-roues'],
        ['P.2', 'Puissance nette maximale en kW', 'Estimation de P.6 avant le titre'],
        ['P.3', 'Énergie (ES essence, GO gazole, EL électrique…)', 'Électriques : réduction dans une seule région'],
        ['P.6', 'Puissance administrative en CV', 'Base de Y1'],
        ['V.7', 'Émissions de CO₂ en g/km', 'Base du malus CO₂'],
      ];
      return `
<h2>Les cases qui disent ce qu’est le véhicule</h2>
<p>Le certificat est organisé en rubriques repérées par une lettre et parfois un chiffre. Toutes ne comptent pas pour le prix : le tableau ci-dessous retient celles qui jouent sur une taxe, avec ce qu’elles contiennent et l’usage qu’en fait le calcul.</p>
${h.table(['Case', 'Ce qu’elle contient', 'Rôle dans le prix'], rows, 'Les rubriques du certificat qui interviennent dans le calcul des taxes.', ['l', 'l', 'l'])}
<p>Deux dates figurent sur le titre et sont souvent confondues. La case B donne la toute première immatriculation, en France ou ailleurs ; la case I donne la date de l’immatriculation à laquelle se rapporte ce titre-là, en général celle du dernier changement de propriétaire. C’est la case B qui sert pour les ${h.num(h.P.regional.age_reduction_ans)} ans, et la case I qui indique à quelle date le tarif a été appliqué.</p>

<h3>La puissance : P.6 avant tout</h3>
<p>La case P.6 donne la puissance administrative, le nombre de chevaux fiscaux. Le code des impositions la présume conforme : la taxe se calcule sur cette valeur, sans refaire de formule. Les kilowatts de P.2 et la cylindrée de P.1 servent seulement à estimer la puissance d’un véhicule qui n’a pas encore de titre français. Pour une voiture immatriculée depuis le ${h.date(h.P.puissance_fiscale.depuis)}, le ${h.a('calcul-chevaux-fiscaux', 'calcul des chevaux fiscaux')} applique la ${h.src('l421_16', 'formule légale fondée sur les kilowatts')} ; pour un deux-roues, la puissance découle de la cylindrée.</p>

<h3>Les masses : F.1, F.2 et G</h3>
<p>F.1 est la masse en charge maximale que le constructeur garantit techniquement ; F.2 celle qui est admise en circulation. La taxe Y2 d’un utilitaire dépend de cette masse en charge maximale, par paliers fixés à l’${h.src('a421_26', 'article A421-26')}. La case G donne la masse du véhicule en service. Pour une voiture neuve ou importée, le malus au poids se calcule sur la masse en ordre de marche, à partir de ${h.num(seuilMasse)} kg pour une première immatriculation en 2026 ; la ${h.src('f35950', 'fiche officielle du malus au poids')} précise les abattements.</p>

<h3>Catégorie, genre et énergie</h3>
<p>La case J donne la catégorie européenne : M1 pour une voiture, N1 pour un utilitaire léger, L1e à L7e pour les deux et trois-roues et les quadricycles. J.1 précise le genre français : VP, CTTE, VASP pour un camping-car, MTT pour une moto. Ces mentions décident du demi-tarif des motos, du tarif nul des cyclomoteurs et de la taxe de transport. La case P.3 donne l’énergie ; elle ne change la taxe régionale que dans la seule région qui réduit encore celle des électriques.</p>

<h2>Les lignes Y1 à Y6 : la facture imprimée</h2>
<p>Le bas du certificat reproduit le détail des sommes payées lors de sa délivrance.</p>
<ul>
<li><strong>Y1, taxe régionale</strong> : tarif de la région × P.6 × coefficient, majoration d’Île-de-France Mobilités comprise pour un titulaire francilien. Le coefficient vaut un demi à ${h.num(h.P.regional.age_reduction_ans)} ans et pour les motos, zéro pour les cyclomoteurs.</li>
<li><strong>Y2, taxe sur les véhicules de transport</strong> : due par les utilitaires et les camions, de ${h.eur(h.P.y2.bareme[0].montant)} à ${h.eur(h.P.y2.bareme[h.P.y2.bareme.length - 1].montant)} selon la masse en charge.</li>
<li><strong>Y3, malus</strong> : le malus CO₂ et le malus au poids, payés une seule fois, à la première immatriculation en France d’une voiture particulière.</li>
<li><strong>Y4, taxe fixe</strong> : ${h.eur2(h.P.national.taxe_fixe)} sur presque toute délivrance de titre.</li>
<li><strong>Y5, redevance d’acheminement</strong> : ${h.eur2(h.P.national.redevance)} pour l’envoi du titre sécurisé.</li>
<li><strong>Y6, total</strong> : la somme Y1 + Y2 + Y3 + Y4 arrondie à l’euro, à laquelle s’ajoute Y5.</li>
</ul>
<p>Ces montants sont ceux que détaille la ${h.src('f19211', 'fiche service-public sur le coût du certificat')}. Ils ne comprennent jamais les frais d’un professionnel : la démarche est gratuite sur le site de l’ANTS, et un garage ou un professionnel habilité qui s’en charge facture son service à part.</p>

<h2>Recalculer le montant payé, étape par étape</h2>
<p>Pour vérifier un titre, il suffit de quatre cases et d’un tarif.</p>
<ul>
<li>Relevez P.6, la date en B et la date en I.</li>
<li>Retrouvez le tarif du cheval de la région de l’adresse en C.3 à la date I. Le ${h.a('tarif-cheval-fiscal', 'tableau des tarifs régionaux')} donne les dates d’effet connues.</li>
<li>Multipliez le tarif par P.6, puis par un demi si l’écart entre B et I atteint ${h.num(h.P.regional.age_reduction_ans)} ans ou s’il s’agit d’une moto.</li>
<li>Ajoutez Y2 et Y3 s’ils figurent sur le titre, puis la taxe fixe ; arrondissez à l’euro et ajoutez la redevance.</li>
</ul>
<h3>Trois exemples recalculés</h3>
<p>Une voiture essence de 5 CV, mise en circulation en 2023, achetée d’occasion en Provence-Alpes-Côte d’Azur : ${h.eur2(paca(h))} × 5 = ${h.eur2(a.y1.y1)} en Y1, rien en Y2 ni en Y3, ${h.eur2(a.y4)} en Y4 et ${h.eur2(a.y5)} en Y5, soit ${h.eur2(a.total)} en Y6.</p>
<p>Une berline de 7 CV de 2014 reprise par un Francilien au ${h.date(d)} : ${h.eur2(idf(h))} par cheval, majoration comprise, × 7 × un demi = ${h.eur2(b.y1.y1)} en Y1. Avec la taxe fixe, l’arrondi donne ${h.eur(Math.round(b.y1.y1 + b.y4))}, puis ${h.eur2(b.total)} avec la redevance.</p>
<p>Une voiture neuve de 7 CV, 125 g/km et 1 550 kg, immatriculée en Île-de-France : ${h.eur2(n.y1.y1)} en Y1, ${h.eur(n.malus.co2)} de malus CO₂ et ${h.eur(n.malus.masse)} de malus au poids en Y3, soit ${h.eur2(n.total)} au total. Le ${h.a('malus-co2', 'barème du malus CO₂')} et celui du ${h.a('malus-masse', 'malus au poids')} détaillent ces deux lignes. Pour une camionnette de 3,5 t reprise en Bretagne, Y2 ajoute ${h.eur(c.y2)} et le total atteint ${h.eur2(c.total)}.</p>

<h2>Les erreurs de lecture les plus courantes</h2>
<ul>
<li><strong>Prendre P.2 pour P.6.</strong> Une voiture de 96 kW n’a pas 96 chevaux fiscaux : P.2 est en kilowatts, P.6 en chevaux administratifs.</li>
<li><strong>Confondre B et I.</strong> La date en I est souvent récente ; c’est la date en B qui dit si le véhicule a ${h.num(h.P.regional.age_reduction_ans)} ans.</li>
<li><strong>Appliquer le tarif du jour à un titre ancien.</strong> ${h.num(ch.length)} régions ont changé de tarif en 2026 (${ch.map((r) => r.nom.fr).join(', ')}), et l’Île-de-France a reçu la majoration le ${h.date(h.P.idfm.periodes[0].from)}. Un titre antérieur porte l’ancien montant.</li>
<li><strong>Chercher une erreur dans un Y1 nul.</strong> Un duplicata, un changement d’adresse ou l’ajout d’un conjoint ne portent pas de taxe régionale ; voir la page ${h.a('adresse-duplicata', 'changement d’adresse et duplicata')}.</li>
<li><strong>Croire que Y3 sera repayé.</strong> Le malus ne se paie qu’une fois ; à la revente, le nouveau titulaire suit la règle du ${h.a('occasion-titulaire', 'changement de titulaire')}.</li>
<li><strong>Additionner au centime.</strong> L’arrondi de Y1 à Y4 avant Y5 crée des écarts de quelques centimes, sans erreur.</li>
</ul>

<h2>Ce que fait le contrôle en haut de page</h2>
<p>Le contrôle reprend la région, la valeur de P.6, l’année de la case B et le montant lu en Y1. Il recalcule la taxe régionale qu’un changement de titulaire coûterait aujourd’hui, avec le tarif relevé dans le ${h.src('prixcv', 'simulateur officiel du prix du cheval')}, et affiche l’écart. Un écart nul confirme le titre ; un écart non nul vient presque toujours d’un tarif d’une autre date, d’une réduction propre au véhicule ou d’une autre région. Le lien vers le calcul complet ouvre toutes les lignes, Y2 et Y3 compris.</p>
`;
    },
  },
  en: {
    slug: 'read-french-registration-certificate',
    nav: 'Reading a carte grise',
    card: 'The boxes that matter on a French registration certificate, from A to Y6, and how to rebuild the amount paid.',
    title: 'Registration certificate boxes in France: P.6, B, Y1 to Y6',
    description: 'How to read a French carte grise box by box: A, B, C.1, D, F, G, J, P.1 to P.6, V.7 and lines Y1 to Y6, then rebuild the total paid and spot the usual errors.',
    h1: 'Reading a French registration certificate, box by box',
    intro: 'Enter the region, the horsepower in box P.6, the year in box B and the amount printed in Y1: the check compares that amount with the current rate.',
    resume: (h) => {
      const a = occasion(h, 'provence-alpes-cote-dazur', 5, '2023-06-01');
      return `The French registration certificate, known as the carte grise, carries every figure that was used to price it. Box P.6 is the fiscal horsepower (chevaux fiscaux), box B the date of first registration, box C.3 the keeper’s address, which decides the region, and lines Y1 to Y6 itemise what was paid: Y1 the regional tax, Y2 the transport vehicle tax, Y3 the malus, then ${h.eur2(h.P.national.taxe_fixe)} of fixed tax in Y4, ${h.eur2(h.P.national.redevance)} for posting the card in Y5, and the grand total in Y6. To check Y1, multiply the region’s rate on the certificate date by P.6, then halve it if box B is ${h.num(h.P.regional.age_reduction_ans)} years old or more. A 2023 car rated 5 CV and registered in Provence-Alpes-Côte d’Azur therefore shows ${h.eur2(a.y1.y1)} in Y1 and ${h.eur2(a.total)} in Y6. The total rounds Y1 to Y4 to the euro before Y5 is added. The kilowatt figure in box P.2 plays no part in checking an existing certificate.`;
    },
    faqs: (h) => [
      { q: 'Which box on a French carte grise shows the taxable horsepower?', a: 'Box P.6, the national administrative power. The regional tax multiplies this figure by the rate per horsepower, and French tax law presumes the printed value is correct, so you never need to work it out again. Box P.2, in kilowatts, is only useful for estimating the horsepower of a car that has no French certificate yet.' },
      { q: 'My French registration certificate shows nothing in box Y1: why?', a: `The certificate was issued without a change of owner, or the vehicle is exempt. A duplicate, or adding or removing a spouse, carries no regional tax, and mopeds have a zero rate. In Hauts-de-France, electric cars registered between ${h.date(hdfExo(h).from)} and ${h.date(hdfExo(h).to!)} were fully exempt from the regional part.` },
      { q: 'Will I pay the malus printed in box Y3 again when I buy the car second-hand?', a: 'No. The CO₂ malus and the weight malus are charged once, when a passenger car is first registered in France. The amount in Y3 tells you what the first owner paid, which can help in a price discussion, but the next buyer only pays the regional tax, the fixed tax and the delivery fee, plus the transport tax for a van.' },
      { q: 'For a car imported into France, what date goes in box B?', a: `The date of its very first registration anywhere, not the date it arrived in France. That date triggers the half rate at ${h.num(h.P.regional.age_reduction_ans)} years and sets the depreciation applied to the malus of a used import. Check it against the foreign registration document before applying, because a typing error flows through the whole calculation.` },
      { q: 'Which weight figure on the certificate matters for tax: F.1, F.2 or G?', a: `F.1 is the technically permissible maximum laden mass, F.2 the maximum mass allowed in service in France, and G the mass of the vehicle in service. A van’s transport vehicle tax follows the maximum laden mass, with a first band up to ${h.num(h.P.y2.bareme[0].ptac_max!)} kg. The weight malus on a new car is based on its mass in running order.` },
      { q: 'Why does box Y6 differ by a few cents from my own sum?', a: `Because Y1, Y2, Y3 and Y4 are added and rounded to the nearest euro, and only then is the ${h.eur2(h.P.national.redevance)} delivery fee added unchanged. A half-rate regional tax often ends in cents that vanish in the rounding. A gap of more than one euro usually means a rate from another date or another region was used.` },
      { q: 'How much does it cost to fix a mistake on a French registration certificate?', a: `When the mistake was made by the administration, the fixed tax is waived and you only pay the delivery fee of ${h.eur2(h.P.national.redevance)}. No regional tax is due, since nobody changes ownership. You apply on the ANTS website, the official registration portal, with the certificate and proof of the correct data, such as the invoice or certificate of conformity.` },
    ],
    body: (h) => {
      const d = jour(h);
      const a = occasion(h, 'provence-alpes-cote-dazur', 5, '2023-06-01');
      const b = occasion(h, 'ile-de-france', 7, '2014-04-01');
      const n = neuve(h);
      const c = camionnette(h);
      const ch = changees2026(h);
      const seuilMasse = h.P.malus_masse.annees['2026'].tranches[0].min;
      const rows = [
        ['A', 'Registration number', 'None: it stays with the vehicle'],
        ['B', 'Date of first registration, abroad included', `Half Y1 at ${h.num(h.P.regional.age_reduction_ans)} years; malus scale and depreciation`],
        ['C.1 and C.3', 'Keeper and address', 'The address picks the region and its rate'],
        ['D.1, D.2, D.3', 'Make, type and version, trade name', 'Identifies the model to cross-check P.6'],
        ['F.1 and F.2', 'Technical maximum laden mass, then mass allowed in service', 'Y2 band for a van'],
        ['G', 'Mass of the vehicle in service', 'Reference for the weight malus'],
        ['J and J.1', 'EU category (M1, N1, L3e…) and French body type (VP, CTTE, VASP, MTT…)', 'Half rate for motorbikes, Y2, malus scope'],
        ['P.1', 'Engine size in cm³', 'Horsepower of two-wheelers'],
        ['P.2', 'Maximum net power in kW', 'Estimate of P.6 before a certificate exists'],
        ['P.3', 'Fuel (ES petrol, GO diesel, EL electric…)', 'Electric cars: a cut in one region only'],
        ['P.6', 'Administrative horsepower in CV', 'Basis of Y1'],
        ['V.7', 'CO₂ emissions in g/km', 'Basis of the CO₂ malus'],
      ];
      return `
<h2>The boxes that describe the vehicle</h2>
<p>The certificate is laid out in fields labelled with a letter, sometimes followed by a number. Only some of them affect the price. The table lists those that feed a tax, what they hold and how the calculation uses them.</p>
${h.table(['Box', 'What it holds', 'Role in the price'], rows, 'Fields of the French certificate that feed the tax calculation.', ['l', 'l', 'l'])}
<p>Two dates appear and are easily mixed up. Box B is the very first registration, in France or elsewhere. Box I is the date of the registration this particular certificate relates to, usually the latest change of owner. Box B decides the ${h.num(h.P.regional.age_reduction_ans)}-year rule; box I tells you which date’s rate was charged.</p>

<h3>Horsepower: P.6 comes first</h3>
<p>Box P.6 holds the administrative horsepower, the French “cheval fiscal” count, which has nothing to do with engine output in bhp. French tax law presumes it correct, so the tax is computed on this figure without any formula. The kilowatts in P.2 and the engine size in P.1 only matter for a vehicle that has no French certificate yet. For a car registered since ${h.date(h.P.puissance_fiscale.depuis)}, the ${h.a('calcul-chevaux-fiscaux', 'fiscal horsepower calculator')} applies the ${h.src('l421_16', 'statutory kilowatt formula')}; for a motorbike, horsepower follows engine size.</p>

<h3>Weights: F.1, F.2 and G</h3>
<p>F.1 is the maximum laden mass the manufacturer guarantees technically, F.2 the mass allowed on the road. A van’s Y2 tax depends on that maximum laden mass, in bands set by ${h.src('a421_26', 'article A421-26')}. Box G is the mass of the vehicle in service. For a new or imported car, the weight malus is charged on the mass in running order, from ${h.num(seuilMasse)} kg for a first registration in 2026; the ${h.src('f35950', 'official weight malus page')} sets out the allowances.</p>

<h3>Category, body type and fuel</h3>
<p>Box J gives the EU category: M1 for a car, N1 for a light van, L1e to L7e for two- and three-wheelers and quadricycles. J.1 adds the French body type: VP for a passenger car, CTTE for a van, VASP for a motorhome, MTT for a motorbike. These codes decide the motorbike half rate, the zero rate for mopeds and the transport tax. Box P.3 gives the fuel; it only changes the regional tax in the one region that still cuts it for electric cars.</p>

<h2>Lines Y1 to Y6: the printed bill</h2>
<p>The foot of the certificate repeats what was paid when it was issued.</p>
<ul>
<li><strong>Y1, regional tax</strong>: regional rate × P.6 × coefficient, including the Île-de-France Mobilités surcharge for a keeper living in the Paris region. The coefficient is one half at ${h.num(h.P.regional.age_reduction_ans)} years and for motorbikes, zero for mopeds.</li>
<li><strong>Y2, transport vehicle tax</strong>: paid on vans and lorries, from ${h.eur(h.P.y2.bareme[0].montant)} to ${h.eur(h.P.y2.bareme[h.P.y2.bareme.length - 1].montant)} depending on laden mass.</li>
<li><strong>Y3, malus</strong>: the CO₂ malus and the weight malus, paid once, at the first French registration of a passenger car.</li>
<li><strong>Y4, fixed tax</strong>: ${h.eur2(h.P.national.taxe_fixe)} on almost every certificate issued.</li>
<li><strong>Y5, delivery fee</strong>: ${h.eur2(h.P.national.redevance)} for posting the secure document.</li>
<li><strong>Y6, total</strong>: Y1 + Y2 + Y3 + Y4 rounded to the euro, plus Y5.</li>
</ul>
<p>These are the amounts listed on the ${h.src('f19211', 'service-public page on certificate cost')}. They never include a professional’s fee: applying is free on the ANTS website, the State’s registration portal, and a garage or approved agent who handles it for you charges for that service separately.</p>

<h2>Rebuilding the amount paid</h2>
<p>Four boxes and one rate are enough to audit a certificate.</p>
<ul>
<li>Note P.6, the date in B and the date in I.</li>
<li>Find the rate per horsepower of the region of the address in C.3 on the date in I. The ${h.a('tarif-cheval-fiscal', 'regional rate table')} shows the known start dates.</li>
<li>Multiply the rate by P.6, then by one half if B and I are ${h.num(h.P.regional.age_reduction_ans)} years apart or more, or for a motorbike.</li>
<li>Add Y2 and Y3 if they appear, then the fixed tax; round to the euro and add the delivery fee.</li>
</ul>
<h3>Three worked cases</h3>
<p>A petrol car rated 5 CV, first registered in 2023 and bought second-hand in Provence-Alpes-Côte d’Azur: ${h.eur2(paca(h))} × 5 = ${h.eur2(a.y1.y1)} in Y1, nothing in Y2 or Y3, ${h.eur2(a.y4)} in Y4 and ${h.eur2(a.y5)} in Y5, giving ${h.eur2(a.total)} in Y6.</p>
<p>A 7 CV saloon from 2014 taken over by a Paris-region resident on ${h.date(d)}: ${h.eur2(idf(h))} per horsepower with the surcharge, × 7 × one half = ${h.eur2(b.y1.y1)} in Y1. With the fixed tax, rounding gives ${h.eur(Math.round(b.y1.y1 + b.y4))}, then ${h.eur2(b.total)} once the delivery fee is added.</p>
<p>A new car rated 7 CV, 125 g/km and 1,550 kg, registered in Île-de-France: ${h.eur2(n.y1.y1)} in Y1, a CO₂ malus of ${h.eur(n.malus.co2)} and a weight malus of ${h.eur(n.malus.masse)} in Y3, ${h.eur2(n.total)} in all. The ${h.a('malus-co2', 'CO₂ malus scale')} and the ${h.a('malus-masse', 'weight malus')} pages break those lines down. For a 3.5-tonne van taken over in Brittany, Y2 adds ${h.eur(c.y2)} and the total reaches ${h.eur2(c.total)}.</p>

<h2>Common misreadings</h2>
<ul>
<li><strong>Reading P.2 as P.6.</strong> A 96 kW car does not have 96 fiscal horsepower: P.2 is in kilowatts, P.6 in administrative units.</li>
<li><strong>Mixing up B and I.</strong> The date in I is often recent; only the date in B says whether the car is ${h.num(h.P.regional.age_reduction_ans)} years old.</li>
<li><strong>Using today’s rate on an older certificate.</strong> ${h.num(ch.length)} regions changed their rate in 2026 (${ch.map((r) => r.nom.en).join(', ')}), and Île-de-France gained its surcharge on ${h.date(h.P.idfm.periodes[0].from)}. An earlier certificate shows the old amount.</li>
<li><strong>Suspecting an error in a zero Y1.</strong> A duplicate, an address change or adding a spouse carries no regional tax; see ${h.a('adresse-duplicata', 'address change and duplicate')}.</li>
<li><strong>Expecting to pay Y3 again.</strong> The malus is paid once; on resale the new keeper follows the ${h.a('occasion-titulaire', 'used-car transfer')} rules.</li>
<li><strong>Adding to the cent.</strong> Rounding Y1 to Y4 before Y5 creates gaps of a few cents that are not mistakes.</li>
</ul>

<h2>What the check at the top does</h2>
<p>The check takes the region, the P.6 value, the year in box B and the amount you read in Y1. It recomputes the regional tax a change of keeper would cost today, using the rate read from the ${h.src('prixcv', 'official horsepower price simulator')}, and shows the difference. A zero gap confirms the certificate; any other gap nearly always comes from a rate of another date, a reduction specific to the vehicle or a different region. The full calculation link opens every line, Y2 and Y3 included.</p>
`;
    },
  },
});
