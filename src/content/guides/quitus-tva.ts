import { defineGuide, type Helpers } from '../../lib/guide-types';

/** Statut TVA d'un véhicule acheté dans l'UE (CGI art. 298 sexies) : un seul des deux seuils suffit. */
const tva = (h: Helpers, mois: number, km: number, prixHt: number) => {
  const neuf = mois <= h.P.tva_import.mois_max || km <= h.P.tva_import.km_max;
  return { neuf, montant: neuf ? prixHt * h.P.tva_import.taux : 0 };
};
/** Trois cas d'achat dans l'UE, au prix hors taxes de 32 000 €. */
const CAS = [
  { mois: 5, km: 8000 },
  { mois: 10, km: 4500 },
  { mois: 10, km: 15000 },
];
const PRIX = 32000;
/** Malus d'une même essence importée, neuve ou d'occasion, immatriculée en France au jour du relevé. */
const malusImport = (h: Helpers) => {
  const d = h.P.regional.date_releve;
  const commun = { gkm: 150, masseKg: 1600, energie: 'essence' as const, dateOp: d };
  return {
    neuf: h.M.malus({ ...commun, date1re: '2026-07-01', origine: 'import_neuf' }),
    occ: h.M.malus({ ...commun, date1re: '2023-04-15', origine: 'import_occasion' }),
  };
};
/** Import hors UE : droits sur la valeur, puis TVA sur la valeur augmentée des droits. */
const horsUe = (h: Helpers, valeur: number) => {
  const droits = valeur * h.P.douane.droit_voiture;
  return { droits, tva: (valeur + droits) * h.P.douane.tva };
};

export default defineGuide({
  id: 'quitus-tva',
  group: 'guides',
  order: 50,
  mini: 'quitusTva',
  miniHref: 'import-europe',
  related: ['import-europe', 'import-hors-europe', 'malus-co2', 'malus-masse', 'voiture-neuve', 'calendrier-2027'],
  sources: ['cgi298', 'quitus', 'douane', 'ants', 'l421_7_2', 'f35950'],
  fr: {
    slug: 'quitus-fiscal-tva-import',
    nav: 'Quitus fiscal et TVA',
    card: 'Neuf ou occasion au sens fiscal, TVA à payer en France et quitus à obtenir avant la carte grise.',
    title: 'Quitus fiscal 2026 : TVA d’un véhicule acheté dans l’UE',
    description: 'Quitus fiscal 2026 : un véhicule de l’UE de 6 mois ou 6 000 km au plus paie la TVA en France, sinon quitus sans TVA. Formulaire, démarche et cas hors UE.',
    h1: 'Quitus fiscal et TVA d’un véhicule importé',
    intro: 'Le mini-simulateur dit si votre véhicule est neuf au sens fiscal et calcule la TVA française due à partir de son âge, de son kilométrage et de son prix hors taxes.',
    resume: (h) => {
      const t = h.P.tva_import;
      const ex = tva(h, CAS[0].mois, CAS[0].km, PRIX);
      return `Le quitus fiscal, aussi appelé certificat fiscal, est le document que délivre l’administration des impôts pour prouver que la TVA d’un véhicule venu d’un État membre de l’Union européenne a été acquittée ou n’est pas exigible. Sans lui, l’ANTS refuse la première carte grise française. Tout repose sur une question : le véhicule est-il neuf au sens fiscal ? Il l’est s’il a au plus ${h.num(t.mois_max)} mois depuis sa première mise en service ou au plus ${h.num(t.km_max)} km, un seul des deux critères suffisant (article 298 sexies du code général des impôts). On règle alors en France une TVA de ${h.pct(t.taux, 0)} calculée sur le prix hors taxes, même si le vendeur est un particulier : ${h.eur(ex.montant)} pour une voiture de ${h.eur(PRIX)}. Sinon, le quitus est délivré sans paiement. Le malus CO₂ et le malus au poids s’ajoutent à part, lors de la carte grise. Hors de l’Union, il n’y a pas de quitus : droits et TVA se paient en douane, qui remet le certificat 846 A.`;
    },
    faqs: (h) => {
      const t = h.P.tva_import;
      return [
        { q: 'Une voiture achetée en Allemagne avec plus de six mois mais peu de kilomètres est-elle neuve pour la TVA ?', a: `Oui, si elle a parcouru au plus ${h.num(t.km_max)} km. Les deux critères de l’article 298 sexies sont alternatifs : il suffit de remplir l’un d’eux pour être un moyen de transport neuf. Une voiture de dix mois affichant ${h.num(4500)} km doit donc la TVA française, alors qu’une voiture de dix mois et ${h.num(15000)} km obtient un quitus sans paiement.` },
        { q: 'Où payer la TVA d’un véhicule neuf acheté dans un autre pays de l’UE ?', a: 'Au service des impôts dont relève votre domicile, au moment de la demande de quitus. Le vendeur établit une facture hors taxes, puisque la vente vers un autre État membre est exonérée chez lui. Si une TVA étrangère figure sur la facture, c’est au vendeur qu’il faut en demander le remboursement : elle ne dispense pas de la TVA française.' },
        { q: 'Quels documents réunir pour demander un quitus fiscal ?', a: 'En règle générale, la facture ou le certificat de vente, le certificat d’immatriculation étranger s’il existe, un document d’identité, une preuve d’adresse et le formulaire 1993-PART-D-SD rempli. Le service peut demander une pièce supplémentaire, par exemple une preuve de la date de première mise en service. La liste exacte figure sur la page impots.gouv.fr consacrée au quitus.' },
        { q: 'Le quitus fiscal est-il payant pour une voiture d’occasion importée ?', a: `Non. Pour un véhicule qui dépasse à la fois ${h.num(t.mois_max)} mois et ${h.num(t.km_max)} km, la TVA a été réglée dans le pays d’achat et le quitus est délivré sans rien payer. Les dépenses arrivent ensuite, avec la carte grise : taxe régionale, taxe fixe, redevance et, pour une voiture particulière, un malus réduit selon son âge.` },
        { q: 'Peut-on demander le quitus fiscal en ligne ?', a: `Dans quelques départements seulement. D’après impots.gouv.fr, les habitants du Nord, du Pas-de-Calais, de la Moselle et du Bas-Rhin peuvent faire la demande en ligne avec la démarche d’immatriculation de l’ANTS depuis le ${h.date('2023-09-14')}. Ailleurs, la demande se fait auprès du service des impôts. Vérifiez la liste à jour avant de vous déplacer.` },
        { q: 'Faut-il un quitus fiscal pour une voiture achetée en Suisse ou au Royaume-Uni ?', a: `Non, car ces pays sont hors de l’Union européenne. Le véhicule passe en douane : droits de ${h.pct(h.P.douane.droit_voiture, 0)} pour une voiture et TVA de ${h.pct(h.P.douane.tva, 0)}, quel que soit son âge. La douane remet alors le certificat de dédouanement 846 A, que l’ANTS exige à la place du quitus pour la carte grise.` },
        { q: 'Le quitus fiscal change-t-il avec la réforme de la TVA en 2027 ?', a: `Le ${h.date('2027-01-01')}, les règles de la TVA quittent le code général des impôts pour le code des impositions sur les biens et services. L’article 298 sexies sera donc remplacé par un nouvel article. Rien ne permet d’affirmer à ce jour que les seuils de ${h.num(t.mois_max)} mois et ${h.num(t.km_max)} km changeront ; la page sera mise à jour avec la nouvelle numérotation.` },
      ];
    },
    body: (h) => {
      const t = h.P.tva_import;
      const rows = CAS.map((c) => {
        const r = tva(h, c.mois, c.km, PRIX);
        return [`${h.num(c.mois)} mois`, `${h.num(c.km)} km`, r.neuf ? 'neuf' : 'occasion', h.eur(r.montant)];
      });
      const m = malusImport(h);
      const hu = horsUe(h, 20000);
      return `
<h2>Neuf ou occasion : la seule question qui compte</h2>
<p>Pour la TVA, un véhicule terrestre à moteur acheté dans un autre État de l’Union est un « moyen de transport neuf » s’il est livré au plus ${h.num(t.mois_max)} mois après sa première mise en service, ou s’il a parcouru au plus ${h.num(t.km_max)} km. La règle figure à l’${h.src('cgi298', 'article 298 sexies du code général des impôts')}. Il ne s’agit pas de la notion commerciale de « neuf » : une voiture de démonstration, une « zéro kilomètre » immatriculée à l’étranger ou une occasion très récente peuvent être neuves pour le fisc.</p>
<p>Le tableau applique la règle à une voiture achetée ${h.eur(PRIX)} hors taxes. Le premier cas est neuf par l’âge, le deuxième par le kilométrage, le troisième ne remplit aucun des deux critères.</p>
${h.table(['Âge', 'Kilométrage', 'Statut fiscal', 'TVA due en France'], rows, `TVA au taux de ${h.pct(t.taux, 0)} sur ${h.eur(PRIX)} hors taxes.`, ['l', 'r', 'l', 'r'])}

<h2>Si le véhicule est neuf : la TVA se paie en France</h2>
<p>La vente d’un moyen de transport neuf vers un autre pays de l’Union est exonérée de TVA dans le pays du vendeur, et l’acheteur la doit dans son propre pays, qu’il soit un particulier ou une entreprise, et même quand le vendeur est lui-même un particulier. Le prix à retenir est le prix hors taxes figurant sur la facture. La TVA est versée au service des impôts de votre domicile, qui remet ensuite le quitus. Si le vendeur a facturé sa TVA nationale par erreur, le remboursement se règle avec lui : la TVA française reste due.</p>

<h2>Si le véhicule est d’occasion : quitus sans paiement</h2>
<p>Au-delà des deux seuils, la TVA est réglée une fois pour toutes dans le pays d’achat. Le service des impôts vérifie les pièces et délivre le quitus sans rien encaisser. C’est le cas de la plupart des imports de particuliers, qui achètent des véhicules de plus d’un an.</p>

<h2>La demande du quitus, pas à pas</h2>
<ul>
<li>Remplissez le formulaire 1993-PART-D-SD, celui des particuliers, disponible sur ${h.src('quitus', 'impots.gouv.fr')}.</li>
<li>Joignez la facture ou l’acte de vente, le certificat d’immatriculation étranger, votre carte d’identité ou votre passeport et une facture récente à votre adresse ; le service peut en demander d’autres.</li>
<li>Déposez la demande au service des impôts de votre domicile. Dans le Nord, le Pas-de-Calais, la Moselle et le Bas-Rhin, impots.gouv.fr indique qu’elle peut se faire en ligne avec la démarche ANTS depuis le ${h.date('2023-09-14')} ; cette liste peut évoluer, vérifiez-la avant de vous déplacer.</li>
<li>Payez la TVA si le véhicule est neuf au sens fiscal, puis récupérez le quitus.</li>
<li>Déposez ensuite le dossier d’immatriculation sur le ${h.src('ants', 'site de l’ANTS')} : la démarche est gratuite et seules les taxes sont dues.</li>
</ul>

<h2>Après le quitus : le malus de l’import</h2>
<p>Le quitus règle la TVA, pas la carte grise. Une voiture particulière immatriculée pour la première fois en France paie le malus CO₂ et le malus au poids, selon le barème de l’année de sa première immatriculation, même à l’étranger. Pour une occasion, le montant est réduit par un ${h.src('l421_7_2', 'coefficient de décote')} qui dépend de l’âge en mois, et il est nul si la première immatriculation date d’avant le ${h.date(h.P.decote_import.zero_avant)}.</p>
<p>Exemple pour une essence émettant 150 g/km et pesant 1 600 kg, immatriculée en France au ${h.date(h.P.regional.date_releve)}. Neuve, première mise en service en juillet 2026, elle paie ${h.eur(m.neuf.co2)} de malus CO₂ et ${h.eur(m.neuf.masse)} de malus au poids, soit ${h.eur(m.neuf.total)}. Mise en service en avril 2023, elle relève du barème de son année, qui ne taxe pas cette masse, et bénéficie d’une décote de ${h.pct(m.occ.decote, 0)} : il reste ${h.eur(m.occ.total)}. Les pages ${h.a('import-europe', 'véhicule importé d’Europe')} et ${h.a('malus-masse', 'malus au poids')} détaillent ce calcul.</p>

<h2>Hors de l’Union : douane et certificat 846 A</h2>
<p>Pour un véhicule venant de Suisse, du Royaume-Uni, du Japon ou des États-Unis, il n’y a pas de quitus. La ${h.src('douane', 'douane')} perçoit un droit de ${h.pct(h.P.douane.droit_voiture, 0)} pour une voiture et une TVA de ${h.pct(h.P.douane.tva, 0)}, quel que soit l’âge ou le kilométrage. Pour une voiture déclarée ${h.eur(20000)}, cela donne ${h.eur(hu.droits)} de droits et, la TVA se calculant en règle générale sur la valeur augmentée des droits, ${h.eur(hu.tva)} de TVA. La douane remet ensuite le certificat 846 A, à joindre à la demande de carte grise. Le malus s’applique comme pour un import européen ; la page ${h.a('import-hors-europe', 'véhicule importé hors d’Europe')} reprend chaque étape.</p>

<h2>Le changement de code au 1er janvier 2027</h2>
<p>À partir du ${h.date('2027-01-01')}, les règles de la TVA sont reprises dans le code des impositions sur les biens et services, qui contient déjà les taxes de la carte grise. La définition du moyen de transport neuf y aura un nouveau numéro d’article. Aucun texte consulté n’annonce de changement des seuils ; le ${h.a('calendrier-2027', 'calendrier 2027')} recense les autres évolutions connues, notamment celles du malus.</p>
`;
    },
  },
  en: {
    slug: 'vat-clearance-import',
    nav: 'VAT clearance (quitus)',
    card: 'New or used for tax purposes, VAT payable in France and the clearance certificate needed before registration.',
    title: 'Quitus fiscal 2026: VAT clearance for a car bought in the EU',
    description: 'Quitus fiscal 2026: an EU car of 6 months or 6,000 km at most pays VAT in France, otherwise a clearance with no VAT. Form, procedure and non-EU imports.',
    h1: 'VAT clearance (quitus fiscal) for an imported vehicle',
    intro: 'The mini-calculator tells you whether your vehicle counts as new for tax purposes and works out the French VAT due from its age, mileage and pre-VAT price.',
    resume: (h) => {
      const t = h.P.tva_import;
      const ex = tva(h, CAS[0].mois, CAS[0].km, PRIX);
      return `The quitus fiscal, or tax clearance certificate, is the document the French tax office issues to show that VAT on a vehicle bought in another European Union country has been paid or is not due. Without it, the ANTS, the agency that issues registration certificates, will not grant a first French carte grise. Everything turns on one question: is the vehicle new for VAT purposes? It is if it has been in service for no more than ${h.num(t.mois_max)} months or has covered no more than ${h.num(t.km_max)} km, and meeting either test is enough (article 298 sexies of the General Tax Code). In that case French VAT at ${h.pct(t.taux, 0)} is paid in France on the pre-VAT price, even when the seller is a private person: ${h.eur(ex.montant)} on a ${h.eur(PRIX)} car. Otherwise the clearance is issued free of charge. The CO₂ and weight malus are separate and come with registration. Outside the EU there is no quitus: duty and VAT are paid at customs, which issues form 846 A.`;
    },
    faqs: (h) => {
      const t = h.P.tva_import;
      return [
        { q: 'Is a low-mileage car over six months old still “new” for French VAT?', a: `Yes, as long as it has covered no more than ${h.num(t.km_max)} km. The two tests in article 298 sexies are alternatives, so meeting one is enough to count as a new means of transport. A ten-month-old car showing ${h.num(4500)} km owes French VAT, while a ten-month-old car with ${h.num(15000)} km gets its clearance at no cost.` },
        { q: 'I paid German or Belgian VAT on a nearly new car: do I pay again in France?', a: 'French VAT is still due, because a sale of a new means of transport to another member state should be invoiced without VAT in the seller’s country. Ask the seller for a corrected pre-VAT invoice and a refund of the foreign VAT. The French tax office will not offset VAT you paid abroad against the amount due here.' },
        { q: 'Which documents does the tax office want for a quitus fiscal?', a: 'Usually the invoice or bill of sale, the foreign registration certificate where there is one, an identity document and proof of address, together with form 1993-PART-D-SD completed. The office may ask for more, such as proof of the first date in service. The impots.gouv.fr page on the quitus gives the current list, and it is worth checking before you go.' },
        { q: 'Does an expat moving to France with their own car need a quitus fiscal?', a: `If the car comes from another EU country, yes: a first French registration of a vehicle from elsewhere in the EU needs the certificate. For a car well past ${h.num(t.mois_max)} months and ${h.num(t.km_max)} km it is free. Arriving from outside the EU is a customs matter instead; special relief for personal belongings may exist, so ask customs before shipping.` },
        { q: 'Can the VAT clearance be requested online?', a: `Only in a few départements. According to impots.gouv.fr, residents of Nord, Pas-de-Calais, Moselle and Bas-Rhin can apply online as part of the ANTS registration process since ${h.date('2023-09-14')}. Elsewhere you apply to the tax office for your home address. Check the current list before you travel to an office.` },
        { q: 'How are cars bought in Switzerland or the UK taxed on import to France?', a: `They come from outside the EU, so there is no quitus. Customs charges ${h.pct(h.P.douane.droit_voiture, 0)} duty on a car and ${h.pct(h.P.douane.tva, 0)} VAT, whatever its age or mileage, and then issues customs clearance certificate 846 A. The ANTS asks for that certificate instead of the quitus when you apply for the carte grise.` },
        { q: 'Will the 2027 VAT recodification change the new-vehicle test?', a: `From ${h.date('2027-01-01')}, French VAT rules move from the General Tax Code into the tax code on goods and services, so article 298 sexies will get a new number. Nothing published so far says the ${h.num(t.mois_max)}-month and ${h.num(t.km_max)} km thresholds will change. This page will be updated with the new article reference.` },
      ];
    },
    body: (h) => {
      const t = h.P.tva_import;
      const rows = CAS.map((c) => {
        const r = tva(h, c.mois, c.km, PRIX);
        return [`${h.num(c.mois)} months`, `${h.num(c.km)} km`, r.neuf ? 'new' : 'used', h.eur(r.montant)];
      });
      const m = malusImport(h);
      const hu = horsUe(h, 20000);
      return `
<h2>New or used: the question that decides the VAT</h2>
<p>For VAT, a motor vehicle bought in another EU state is a “new means of transport” if it is supplied no more than ${h.num(t.mois_max)} months after it first went into service, or if it has covered no more than ${h.num(t.km_max)} km. The rule sits in ${h.src('cgi298', 'article 298 sexies of the General Tax Code')}. This is not the showroom meaning of new: a demonstrator, a “zero-kilometre” car registered abroad by a dealer or a very recent used car can all be new in the eyes of the tax office.</p>
<p>The table applies the test to a car bought for ${h.eur(PRIX)} before VAT. The first case is new by age, the second by mileage, and the third meets neither test.</p>
${h.table(['Age', 'Mileage', 'Tax status', 'VAT due in France'], rows, `VAT at ${h.pct(t.taux, 0)} on ${h.eur(PRIX)} before VAT.`, ['l', 'r', 'l', 'r'])}

<h2>New vehicle: VAT is paid in France</h2>
<p>A sale of a new means of transport to another EU country is VAT-exempt where the seller is, and the buyer owes VAT at home. That applies to private buyers and businesses alike, and even when the seller is a private individual. The base is the pre-VAT price on the invoice. You pay the tax office for your home address, which then hands over the quitus. If the seller wrongly charged their own country’s VAT, settle that with the seller: French VAT remains due.</p>

<h2>Used vehicle: clearance at no cost</h2>
<p>Beyond both thresholds, VAT was settled for good in the country of purchase. The tax office checks your documents and issues the quitus without collecting anything. Most private imports fall here, since buyers usually bring in cars more than a year old.</p>

<h2>Getting the quitus, step by step</h2>
<ul>
<li>Fill in form 1993-PART-D-SD, the version for private individuals, available on ${h.src('quitus', 'impots.gouv.fr')}.</li>
<li>Attach the invoice or bill of sale, the foreign registration certificate, an identity document and proof of address; the office may ask for more.</li>
<li>File the request with the tax office for your home address. In Nord, Pas-de-Calais, Moselle and Bas-Rhin, impots.gouv.fr says it can be done online through the ANTS process since ${h.date('2023-09-14')}; the list may change, so check before going in person.</li>
<li>Pay the VAT if the vehicle is new for tax purposes, then collect the quitus.</li>
<li>Apply for the carte grise on the ${h.src('ants', 'ANTS website')}, where the application is free and only the taxes are charged.</li>
</ul>

<h2>After the quitus: the import malus</h2>
<p>The quitus settles VAT, not registration. A passenger car registered in France for the first time pays the CO₂ malus and the weight malus, on the scale of the year it was first registered, even abroad. For a used car the amount is cut by a ${h.src('l421_7_2', 'depreciation coefficient')} based on its age in months, and it is zero if the first registration predates ${h.date(h.P.decote_import.zero_avant)}.</p>
<p>Take a petrol car emitting 150 g/km and weighing 1,600 kg, registered in France on ${h.date(h.P.regional.date_releve)}. New, first in service in July 2026, it pays ${h.eur(m.neuf.co2)} of CO₂ malus and ${h.eur(m.neuf.masse)} of weight malus, ${h.eur(m.neuf.total)} in all. First in service in April 2023, it falls under that year’s scale, which does not tax this weight, and gets a ${h.pct(m.occ.decote, 0)} reduction, leaving ${h.eur(m.occ.total)}. The ${h.a('import-europe', 'EU import')} and ${h.a('malus-masse', 'weight malus')} pages go through the calculation.</p>

<h2>Outside the EU: customs and form 846 A</h2>
<p>For a vehicle from Switzerland, the UK, Japan or the United States there is no quitus. ${h.src('douane', 'French customs')} charges ${h.pct(h.P.douane.droit_voiture, 0)} duty on a car and ${h.pct(h.P.douane.tva, 0)} VAT, whatever the age or mileage. On a car declared at ${h.eur(20000)}, that means ${h.eur(hu.droits)} of duty and, since VAT is normally worked out on the value plus duty, ${h.eur(hu.tva)} of VAT. Customs then issues certificate 846 A, which goes with the registration application. The malus applies just as for an EU import; the ${h.a('import-hors-europe', 'non-EU import')} page covers each step.</p>

<h2>The change of code on 1 January 2027</h2>
<p>From ${h.date('2027-01-01')}, VAT rules are moved into the tax code on goods and services, which already holds the registration taxes. The definition of a new means of transport will carry a new article number there. No text consulted announces a change to the thresholds; the ${h.a('calendrier-2027', '2027 changes')} page lists the other known changes, including those to the malus.</p>
`;
    },
  },
});
