import { defineGuide, type Helpers } from '../../lib/guide-types';

const d0 = (h: Helpers) => h.P.regional.date_releve;
const taxes = (h: Helpers, region: string, cv: number, vieux = false) =>
  h.M.coutCarteGrise({ demarche: 'titulaire', region, origine: 'france_occasion', energie: 'essence', genre: 'vp', cv, date1re: vieux ? '2013-04-01' : d0(h), dateOp: d0(h), gkm: 0, masseKg: 0, ptacKg: 0 }).total;
const part = (frais: number, t: number) => frais / (frais + t);
const CAS: Array<{ r: string; cv: number; v: boolean }> = [
  { r: 'auvergne-rhone-alpes', cv: 5, v: false },
  { r: 'bretagne', cv: 4, v: true },
  { r: 'occitanie', cv: 7, v: false },
  { r: 'ile-de-france', cv: 9, v: false },
];
const FRAIS = [30, 60];

export default defineGuide({
  id: 'taxes-ou-frais',
  group: 'outils',
  order: 60,
  tool: 'frais',
  related: ['occasion-titulaire', 'lire-carte-grise', 'budget-achat', 'comparer-regions', 'voiture-neuve'],
  sources: ['ants', 'f19211', 'cibs', 'r322_5', 'r49'],
  fr: {
    slug: 'taxes-ou-frais-de-service',
    nav: 'Taxes ou frais de service',
    card: 'Ce qui revient à l’État dans le prix d’une carte grise, et ce qui rémunère un professionnel si vous lui confiez la démarche.',
    title: 'Taxes ou frais de service : ce que coûte vraiment le titre',
    description: 'Taxes ou frais de service : la démarche est gratuite sur le site de l’ANTS, on n’y paie que les taxes. Repérez les frais d’un professionnel dans un prix donné.',
    h1: 'Taxes dues ou frais de service : faire la part des choses',
    intro: 'Saisissez votre région, la puissance et le prix annoncé par un professionnel : l’outil isole la part de l’État et la part qui paie le service.',
    resume: (h) => {
      const t = taxes(h, 'auvergne-rhone-alpes', 5);
      return `Une carte grise coûte d’abord des taxes fixées par la loi, et, si vous passez par un intermédiaire, de frais de service qui rémunèrent son travail. Les taxes sont les mêmes quelle que soit la personne qui dépose la demande : taxe régionale selon vos chevaux fiscaux et votre région, taxe fixe, redevance d’envoi, et pour une voiture neuve ou importée les malus. La démarche elle-même est gratuite sur le site de l’ANTS, l’Agence nationale des titres sécurisés : on n’y paie que les taxes, sans aucun frais de dossier. Pour une voiture d’occasion de 5 CV de moins de dix ans en Auvergne-Rhône-Alpes, cela fait ${h.eur(t, 2)} au ${h.date(d0(h))}. Un garage, un concessionnaire ou un professionnel habilité peut s’en charger à votre place contre des frais librement fixés, qui s’ajoutent aux taxes et ne les remplacent jamais. Comparer le prix annoncé au montant des taxes suffit pour savoir ce que coûte le service.`;
    },
    faqs: (h) => {
      const t = taxes(h, 'occitanie', 7);
      const N = h.P.national;
      return [
        { q: 'L’ANTS ajoute-t-elle des frais de dossier au prix de la carte grise ?', a: 'Non. Sur le site officiel de l’ANTS, la demande est gratuite : le paiement final ne porte que sur les taxes, réglées par carte bancaire. Aucun supplément n’est demandé pour le traitement, l’envoi standard du titre étant déjà compris dans la redevance. Si un site vous facture davantage, ce n’est pas l’administration qui encaisse la différence.' },
        { q: 'Un garage a-t-il le droit de demander plus que les taxes officielles pour une carte grise ?', a: 'Oui, s’il est habilité et qu’il fait la démarche pour vous : il peut facturer son service au prix qu’il choisit. Les taxes, elles, ne changent pas et sont reversées à l’État et à la région. Demandez un devis qui sépare les deux montants, et vérifiez le total des taxes avec le simulateur.' },
        { q: 'Comment savoir quelle part d’un forfait carte grise correspond aux taxes ?', a: `Calculez les taxes de votre véhicule, puis retranchez-les du forfait. Pour une 7 CV récente en Occitanie, les taxes s’élèvent à ${h.eur(t, 2)} ; un forfait de ${h.eur(t + 45, 2)} contient donc ${h.eur(45)} de frais de service, soit ${h.pct(part(45, t), 0)} du total. L’outil fait ce calcul pour n’importe quel montant.` },
        { q: 'Que risque-t-on à tarder pour la carte grise d’une voiture d’occasion ?', a: `Le changement de titulaire doit être demandé dans un délai de ${h.num(N.delai_titulaire_mois)} mois après l’achat. Au-delà, l’amende forfaitaire est de ${h.eur(N.amende_titulaire)}. Faire la démarche soi-même ne prend en général que quelques minutes en ligne, mais si vous manquez de temps ou de matériel, confier le dossier à un professionnel évite de laisser passer ce délai.` },
      ];
    },
    body: (h) => {
      const rows = CAS.map((c) => {
        const t = taxes(h, c.r, c.cv, c.v);
        return [`${h.M.regionById(c.r).nom.fr}, ${h.num(c.cv)} CV${c.v ? ', plus de 10 ans' : ''}`, h.eur(t, 2), ...FRAIS.map((f) => `${h.eur(t + f, 2)} (${h.pct(part(f, t), 0)})`)];
      });
      return `
<h2>Ce que l’on paie dans tous les cas</h2>
<p>Les taxes du certificat sont fixées par le ${h.src('cibs', 'code des impositions sur les biens et services')} et par les délibérations régionales. Personne ne peut les réduire ni les majorer : qu’un particulier dépose sa demande ou qu’un professionnel la dépose pour lui, le montant versé à l’État et à la région est identique, au centime près. La ${h.src('f19211', 'fiche officielle sur le coût du certificat')} en donne la composition.</p>
<ul>
<li>la taxe régionale, proportionnelle aux chevaux fiscaux et propre à chaque région ;</li>
<li>pour un utilitaire, une taxe sur les véhicules de transport ;</li>
<li>pour une voiture neuve ou importée, le malus CO₂ et le malus au poids ;</li>
<li>${h.eur(h.P.national.taxe_fixe)} de taxe fixe, et ${h.eur2(h.P.national.redevance)} pour l’acheminement du titre à domicile.</li>
</ul>

<h2>Ce que facture l’ANTS : rien de plus</h2>
<p>Sur le ${h.src('ants', 'site de l’ANTS')}, la demande se fait en ligne avec un compte personnel. En fin de parcours, le montant affiché correspond aux seules taxes, payées par carte bancaire. Il n’y a ni frais de dossier, ni abonnement, ni supplément pour un traitement plus rapide. Le site officiel se reconnaît à son adresse en .gouv.fr ; un site qui demande un paiement plus élevé pour la même démarche n’est pas celui de l’administration, même si sa présentation y ressemble.</p>

<h2>Les frais de service d’un professionnel</h2>
<p>Un garage, un concessionnaire ou un professionnel habilité par l’administration à accéder au système d’immatriculation peut faire la démarche à votre place. Il se charge des pièces, de la saisie et parfois des plaques, et facture ce travail au prix qu’il fixe. Ce choix peut se justifier si vous manquez de temps, si votre dossier est complexe ou si vous n’avez pas d’accès simple à Internet. Les frais s’ajoutent toujours aux taxes ; ils ne les remplacent pas et ne font pas baisser leur montant.</p>
${h.table(['Véhicule d’occasion', 'Taxes seules', `Avec ${h.eur(FRAIS[0])} de frais`, `Avec ${h.eur(FRAIS[1])} de frais`], rows, `Total payé et, entre parenthèses, part qui n’est pas une taxe, au ${h.date(d0(h))}.`, ['l', 'r', 'r', 'r'])}
<p>Pour une voiture ancienne et peu puissante, les taxes sont faibles : les mêmes frais représentent alors une part bien plus grande du total.</p>

<h2>Repérer des frais inclus dans un « prix de carte grise »</h2>
<ul>
<li>Calculez d’abord les taxes de votre véhicule : tout montant au-dessus correspond à des frais de service ou à des options.</li>
<li>Demandez le détail écrit : un devis clair distingue les taxes, les frais de service, l’envoi suivi et les plaques.</li>
<li>Méfiez-vous d’un tarif unique affiché sans connaître votre région ni votre puissance fiscale : les taxes en dépendent, un prix fixe ne peut donc pas être fait que de taxes.</li>
<li>Sur le certificat reçu, les lignes de taxes récapitulent ce qui a été versé à l’État ; la différence avec ce que vous avez payé est la rémunération du service.</li>
</ul>

<h2>Se faire aider gratuitement</h2>
<p>Les préfectures et de nombreuses sous-préfectures disposent de points d’accueil numérique, avec un ordinateur et un médiateur qui accompagne la démarche en ligne sans la facturer. Les espaces France services proposent la même aide de proximité. On y paie seulement les taxes, comme depuis chez soi.</p>

<h2>Ce que fait l’outil</h2>
<p>Choisissez la région de votre domicile, la puissance fiscale et l’âge du véhicule, puis saisissez les frais annoncés par le professionnel et les options payantes éventuelles. L’outil affiche le montant que vous paieriez sur le site de l’ANTS, le total chez le professionnel et la part de ce total qui n’est pas une taxe. Il traite un changement de titulaire d’une voiture d’occasion ; pour une voiture neuve, importée ou un utilitaire, passez au ${h.a('home', 'calcul complet')}. Pour comprendre chaque ligne du titre, voyez comment ${h.a('lire-carte-grise', 'lire sa carte grise')}.</p>
`;
    },
  },
  en: {
    slug: 'taxes-vs-service-fees',
    nav: 'Taxes vs service fees',
    card: 'What goes to the State in the price of a French registration, and what pays a business if you hand it the paperwork.',
    title: 'Taxes vs service fees on a French car registration (2026)',
    description: 'Taxes vs service fees on a French registration: applying on the ANTS website is free and you pay only the taxes. How to spot a business fee in a quoted price.',
    h1: 'Taxes due or service fees: telling them apart',
    intro: 'Enter your region, the horsepower and the price a business quotes: the tool separates what goes to the State from what pays for the service.',
    resume: (h) => {
      const t = taxes(h, 'auvergne-rhone-alpes', 5);
      return `The price of a French registration certificate, the carte grise, is made of taxes set by law and, if you use a go-between, a service fee that pays for their work. The taxes are the same whoever files the application: the regional tax based on fiscal horsepower and region, a fixed tax, a posting charge, and for a new or imported car the CO₂ and weight maluses. The application itself is free on the website of the ANTS, the French agency for secure documents: you pay only the taxes there, with no processing fee. For a used 5 CV car under ten years old in Auvergne-Rhône-Alpes that comes to ${h.eur(t, 2)} on ${h.date(d0(h))}. A garage, a dealer or an approved business can apply for you in exchange for a fee it sets freely, which comes on top of the taxes and never replaces them. Comparing the price you are quoted with the tax figure tells you exactly what the service costs, which is useful for newcomers who are often offered all-in packages.`;
    },
    faqs: (h) => {
      const t = taxes(h, 'ile-de-france', 9);
      const N = h.P.national;
      return [
        { q: 'Is there an admin fee when I apply for a carte grise on the ANTS website?', a: 'No. Applying on the official ANTS website is free: the final payment covers only the taxes, paid by bank card. There is no handling charge and no fast-track option to buy, and standard posting of the certificate is already included in the delivery fee. If a website asks for more, the extra does not go to the French administration.' },
        { q: 'Can a French garage charge more than the official taxes for the registration?', a: 'Yes, if it is approved and handles the application for you: it may charge whatever it likes for that service. The taxes themselves stay the same and are passed on to the State and the region. Ask for a quote that shows the two amounts separately, and check the tax total with the calculator.' },
        { q: 'A business quotes me an all-in price for a 9 CV car near Paris: how much of it is tax?', a: `Work out the taxes and subtract them from the quote. For a recent 9 CV car in Île-de-France the taxes come to ${h.eur(t, 2)}; a package of ${h.eur(t + 70, 2)} therefore holds ${h.eur(70)} of service fees, or ${h.pct(part(70, t), 0)} of the total. The tool runs this check for any amount you enter.` },
        { q: 'What if I miss the deadline for registering a used car in my name?', a: `The change of keeper must be requested within ${h.num(N.delai_titulaire_mois)} month of the purchase. After that, the fixed fine is ${h.eur(N.amende_titulaire)}. Applying yourself usually takes a few minutes online, but if you lack the time, are not at ease with French online forms or have no computer, a business can file it for you before the deadline.` },
      ];
    },
    body: (h) => {
      const rows = CAS.map((c) => {
        const t = taxes(h, c.r, c.cv, c.v);
        return [`${h.M.regionById(c.r).nom.en}, ${h.num(c.cv)} CV${c.v ? ', over 10 years' : ''}`, h.eur(t, 2), ...FRAIS.map((f) => `${h.eur(t + f, 2)} (${h.pct(part(f, t), 0)})`)];
      });
      return `
<h2>What you pay in every case</h2>
<p>The taxes on the certificate are set by the ${h.src('cibs', 'French tax code on goods and services')} and by regional council decisions. Nobody can lower or raise them: whether you file yourself or a business files for you, the amount passed to the State and the region is identical to the cent. The ${h.src('f19211', 'official page on the cost of the certificate')} lists what it is made of.</p>
<ul>
<li>the regional tax, in proportion to fiscal horsepower and specific to each region;</li>
<li>for a commercial vehicle, a transport vehicle tax;</li>
<li>for a new or imported car, the CO₂ malus and the weight malus;</li>
<li>a fixed tax of ${h.eur(h.P.national.taxe_fixe)}, and ${h.eur2(h.P.national.redevance)} for posting the certificate to your home.</li>
</ul>

<h2>What the ANTS charges: nothing extra</h2>
<p>On the ${h.src('ants', 'ANTS website')}, you apply online through a personal account. At the end, the amount shown is the taxes alone, paid by bank card. There is no processing fee, no subscription and no paid fast track. The official site has an address ending in .gouv.fr; a site that asks for a higher payment for the same procedure is not the administration’s, however official it may look.</p>

<h2>A business’s service fee</h2>
<p>A garage, a dealer or a business approved by the administration to access the vehicle registration system can apply on your behalf. It gathers the documents, enters the data and sometimes supplies the plates, and charges what it chooses for that work. That can make sense if you are short of time, if your case is unusual, or if you are not comfortable with French-language online forms. The fee always comes on top of the taxes; it does not replace them or reduce them.</p>
${h.table(['Used vehicle', 'Taxes only', `With a ${h.eur(FRAIS[0])} fee`, `With a ${h.eur(FRAIS[1])} fee`], rows, `Total paid and, in brackets, the share that is not tax, on ${h.date(d0(h))}.`, ['l', 'r', 'r', 'r'])}
<p>For an older, low-powered car the taxes are small, so the same fee makes up a far larger share of the bill.</p>

<h2>Spotting a fee inside a “registration price”</h2>
<ul>
<li>Work out the taxes for your vehicle first: anything above that figure is a service fee or an extra.</li>
<li>Ask for a written breakdown: a clear quote separates taxes, service fee, tracked post and plates.</li>
<li>Be wary of a single price given without asking your region or your fiscal horsepower: the taxes depend on both, so a flat price cannot be made of taxes alone.</li>
<li>On the certificate you receive, the tax lines sum up what was paid to the State; the gap with what you paid is the cost of the service.</li>
</ul>

<h2>Free help nearby</h2>
<p>Prefectures and many sub-prefectures have digital help points, with a computer and an adviser who guides you through the online application at no charge. France services centres, local public help desks, offer the same support. You pay only the taxes there, just as you would from home.</p>

<h2>What the tool does</h2>
<p>Choose the region where you live, the fiscal horsepower and the age of the vehicle, then enter the fee quoted by the business and any paid extras. The tool shows what you would pay on the ANTS website, the total with the business and the share of that total that is not tax. It covers a change of keeper for a used car; for a new car, an import or a commercial vehicle, use the ${h.a('home', 'full calculation')}. To understand each line of the certificate, see how to ${h.a('lire-carte-grise', 'read a French registration certificate')}.</p>
`;
    },
  },
});
