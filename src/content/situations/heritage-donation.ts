import { defineGuide, type Helpers } from '../../lib/guide-types';
import type { Demarche } from '../../lib/engine/carte-grise';

const REG = 'centre-val-de-loire';
/** Nouveau titre pour une voiture de 6 CV reprise dans la région d'exemple, au jour du relevé. */
const titre = (h: Helpers, demarche: Demarche, date1re = '2018-04-01', region = REG) =>
  h.M.coutCarteGrise({ demarche, region, origine: 'france_occasion', energie: 'essence', genre: 'vp', cv: 6, date1re, dateOp: h.P.regional.date_releve, gkm: 0, masseKg: 0, ptacKg: 0 });

export default defineGuide({
  id: 'heritage-donation',
  group: 'situations',
  order: 110,
  mini: 'heritage',
  miniHref: 'home',
  related: ['occasion-titulaire', 'adresse-duplicata', 'dix-ans', 'budget-achat', 'region-centre-val-de-loire'],
  sources: ['cibs', 'f19211', 'ants', 'prixcv'],
  fr: {
    slug: 'heritage-donation-vehicule',
    nav: 'Héritage et donation',
    card: 'Un héritier ou un bénéficiaire de donation paie la taxe régionale ; le conjoint survivant en est exonéré.',
    title: 'Carte grise d’un véhicule hérité ou donné : coût 2026',
    description: 'Carte grise d’un véhicule hérité ou donné en 2026 : taxe régionale due comme pour un achat, sauf pour le conjoint ou partenaire de Pacs, qui paie 13,76 €.',
    h1: 'Carte grise d’un véhicule hérité ou reçu en donation',
    intro: 'Le mini-simulateur compare le coût du nouveau titre selon que le véhicule est hérité, repris par le conjoint ou donné.',
    resume: (h) => {
      const r = h.P.regions.find((x) => x.id === REG)!;
      const her = titre(h, 'succession');
      const conj = titre(h, 'conjoint');
      return `Hériter d’une voiture ne dispense pas de la taxe régionale. Le code des impositions sur les biens et services ne prévoit aucune exonération liée à une succession : l’enfant, le frère ou le neveu qui fait établir la carte grise à son nom paie la même taxe régionale qu’un acheteur d’occasion, avec la moitié du tarif si la première immatriculation date de dix ans ou plus. Il en va de même pour une donation, qui reste un changement de propriétaire. L’exception concerne le conjoint et le partenaire de Pacs : l’article L421-52 exonère de taxe régionale le titre établi après un décès, un mariage, un divorce ou la fin d’un Pacs, quand le seul objet est d’ajouter ou de retirer l’un des deux. Ce titre coûte ${h.eur2(conj.total)}. Exemple en ${r.nom.fr} : une voiture de 6 CV mise en circulation en 2018 coûte ${h.eur2(her.total)} à l’enfant héritier, contre ${h.eur2(conj.total)} au conjoint survivant.`;
    },
    faqs: (h) => {
      const ancien = titre(h, 'succession', '2012-04-01');
      return [
        { q: 'Le conjoint survivant paie-t-il la taxe régionale sur la voiture du défunt ?', a: `Non. Quand la voiture était au nom du défunt ou des deux époux, ou des deux partenaires de Pacs, le titre établi au nom du survivant est exonéré de taxe régionale par l’article L421-52. Seuls restent dus les frais fixes : ${h.eur2(h.P.national.taxe_fixe)} pour la gestion, ${h.eur2(h.P.national.redevance)} pour l’envoi. Un concubin non pacsé, lui, paie la taxe régionale comme un héritier.` },
        { q: 'Un véhicule hérité ancien coûte-t-il moins cher à immatriculer ?', a: `Oui, comme tout véhicule d’occasion. Si la première immatriculation date de dix ans ou plus, le tarif régional est réduit de moitié. Une voiture de 6 CV de 2012 héritée en ${h.P.regions.find((x) => x.id === REG)!.nom.fr} coûte ainsi ${h.eur2(ancien.total)}. Aucune autre remise ne tient compte du lien de parenté ou de la valeur du véhicule.` },
        { q: 'Une voiture donnée par un parent est-elle exonérée de carte grise ?', a: 'Non. Une donation, même entre parents et enfants, est un changement de propriétaire : on applique le tarif régional du domicile de celui qui reçoit la voiture, comme pour une vente. Le donateur remplit le certificat de cession en indiquant que la cession est faite à titre gratuit, puis le bénéficiaire fait sa demande de carte grise à son nom.' },
        { q: 'Peut-on vendre la voiture d’un défunt sans la mettre à son nom ?', a: 'Oui, sous conditions. Les héritiers peuvent céder le véhicule directement à un acheteur sans passer par une carte grise à leur nom, ce qui évite de payer la taxe régionale. Les pièces exigées et les signatures nécessaires dépendent de la situation de la succession : consultez la rubrique dédiée sur le site de l’ANTS avant de signer la cession.' },
      ];
    },
    body: (h) => {
      const d = h.P.regional.date_releve;
      const r = h.P.regions.find((x) => x.id === REG)!;
      const tarif = h.M.tarifRegion(REG, d).cv;
      const her = titre(h, 'succession');
      const conj = titre(h, 'conjoint');
      const don = titre(h, 'titulaire');
      const idf = titre(h, 'succession', '2018-04-01', 'ile-de-france');
      const rows = [
        ['Héritage par un enfant ou un autre parent', h.eur2(her.y1.y1), h.eur2(her.total)],
        ['Reprise par le conjoint ou partenaire de Pacs', h.eur2(conj.y1.y1), h.eur2(conj.total)],
        ['Donation ou vente en famille', h.eur2(don.y1.y1), h.eur2(don.total)],
      ];
      return `
<h2>Trois situations, deux montants</h2>
<p>En ${r.nom.fr}, le cheval fiscal vaut ${h.eur2(tarif)} au ${h.date(d)}. Pour une voiture essence de 6 CV de 2018, voici ce que coûte le nouveau titre selon la personne qui le reçoit.</p>
${h.table(['Situation', 'Taxe régionale', 'Coût du titre'], rows, `Tarifs de la région ${r.nom.fr} au ${h.date(d)}.`, ['l', 'r', 'r'])}
<p>C’est la région du domicile de l’héritier qui fixe le tarif, pas celle du défunt. Un héritier qui vit en Île-de-France paierait ${h.eur2(idf.total)} pour la même voiture, majoration d’Île-de-France Mobilités comprise.</p>

<h2>Les pièces à réunir pour un héritage</h2>
<p>Le dossier se dépose sur le ${h.src('ants', 'site de l’ANTS')}, dans la rubrique consacrée au véhicule d’une personne décédée. Elle s’appuie sur la carte grise du défunt et sur une preuve de la qualité d’héritier : certificat d’hérédité, ou acte établi par le notaire chargé de la succession. Quand plusieurs héritiers existent et qu’un seul reprend la voiture, l’accord écrit des autres est en général demandé. Nous n’avons pas trouvé de délai légal vérifié propre aux successions : le délai d’un mois imposé après une vente ne vise pas expressément ce cas, et l’ANTS reste la référence pour votre dossier.</p>

<h2>La donation, traitée comme une vente</h2>
<p>Le donateur déclare la cession sur le site de l’ANTS et remet au bénéficiaire le certificat de cession signé, la carte grise barrée et le code de cession. Le bénéficiaire dispose alors du délai ordinaire pour faire la carte grise à son nom, et la taxe régionale est calculée au tarif de sa propre région. Le fait que la voiture soit donnée et non vendue ne change rien au montant, qui ne dépend que de la puissance, de l’âge et de la région.</p>

<h2>Vendre sans immatriculer</h2>
<p>Si personne ne souhaite garder la voiture, la céder directement depuis la succession évite de payer une taxe régionale pour un titre qui ne servirait que quelques semaines. Cette vente est possible sous conditions, que précise l’ANTS. Pour estimer ce que paiera l’acheteur, utilisez le ${h.a('occasion-titulaire', 'calcul du changement de titulaire')}. Toutes ces démarches sont gratuites sur le site de l’ANTS, où l’on ne paie que les taxes ; un professionnel habilité peut s’en charger contre des frais de service.</p>
`;
    },
  },
  en: {
    slug: 'inherited-gifted-car',
    nav: 'Inherited or gifted car',
    card: 'An heir or the recipient of a gift pays the regional tax; a surviving spouse or civil partner does not.',
    title: 'Inherited or gifted car in France: carte grise cost 2026',
    description: 'Registering an inherited or gifted car in France in 2026: regional tax due as on a purchase, except for a spouse or PACS partner, who pays €13.76. Papers.',
    h1: 'Registering an inherited or gifted car in France',
    intro: 'The mini calculator compares the cost of the new certificate when a car is inherited, taken over by a spouse or given as a gift.',
    resume: (h) => {
      const r = h.P.regions.find((x) => x.id === REG)!;
      const her = titre(h, 'succession');
      const conj = titre(h, 'conjoint');
      return `Inheriting a car in France does not exempt you from the regional tax on the carte grise, the registration certificate. The French tax code contains no exemption for inheritance: a child, sibling or nephew who puts the car in their own name pays the same regional tax as a used-car buyer, halved if the first registration is ten years old or more. A gift is treated the same way, because ownership still changes hands. The exception is the spouse or the PACS partner (France’s registered civil partnership): article L421-52 exempts from regional tax a certificate issued after a death, marriage, divorce or end of a PACS whose only purpose is to add or remove one of the couple. That certificate costs ${h.eur2(conj.total)}. Example in ${r.nom.en}: a 6 CV car first registered in 2018 costs ${h.eur2(her.total)} for a child who inherits it, against ${h.eur2(conj.total)} for the surviving spouse.`;
    },
    faqs: (h) => {
      const ancien = titre(h, 'succession', '2012-04-01');
      return [
        { q: 'Does a widow or widower pay regional tax to keep the late spouse’s car?', a: `No. When the car was in the name of the deceased, or of both spouses or PACS partners, the certificate issued to the survivor is exempt from regional tax under article L421-52. Only ${h.eur2(h.P.national.taxe_fixe)} of management tax and ${h.eur2(h.P.national.redevance)} postage remain. An unmarried partner without a PACS pays the regional tax like any heir.` },
        { q: 'Is an old inherited car cheaper to register?', a: `Yes, like any used vehicle. If the first registration is ten years old or more, the regional rate is halved. A 6 CV car from 2012 inherited in ${h.P.regions.find((x) => x.id === REG)!.nom.en} therefore costs ${h.eur2(ancien.total)}. No other discount takes account of the family link or the value of the car.` },
        { q: 'Is a car given by a parent free to register in France?', a: 'No. A gift, even from parent to child, is a change of ownership, so the regional tax is due at the rate of the new keeper’s region, exactly as for a sale. The giver fills in the transfer certificate stating that the car is handed over free of charge, then the recipient applies for a certificate in their own name.' },
        { q: 'Can heirs sell a deceased person’s car without registering it first?', a: 'Yes, under conditions. Heirs can transfer the car straight to a buyer without first taking out a certificate in their own name, which avoids paying the regional tax. The papers and signatures required depend on how the estate is being settled, so read the relevant section of the ANTS website before signing the transfer.' },
      ];
    },
    body: (h) => {
      const d = h.P.regional.date_releve;
      const r = h.P.regions.find((x) => x.id === REG)!;
      const tarif = h.M.tarifRegion(REG, d).cv;
      const her = titre(h, 'succession');
      const conj = titre(h, 'conjoint');
      const don = titre(h, 'titulaire');
      const idf = titre(h, 'succession', '2018-04-01', 'ile-de-france');
      const rows = [
        ['Inherited by a child or other relative', h.eur2(her.y1.y1), h.eur2(her.total)],
        ['Taken over by spouse or PACS partner', h.eur2(conj.y1.y1), h.eur2(conj.total)],
        ['Gift or family sale', h.eur2(don.y1.y1), h.eur2(don.total)],
      ];
      return `
<h2>Three situations, two prices</h2>
<p>In ${r.nom.en} a fiscal horsepower costs ${h.eur2(tarif)} on ${h.date(d)}. For a 6 CV petrol car from 2018, this is what the new certificate costs depending on who receives it.</p>
${h.table(['Situation', 'Regional tax', 'Certificate cost'], rows, `${r.nom.en} rates on ${h.date(d)}.`, ['l', 'r', 'r'])}
<p>The rate is set by the region where the heir lives, not where the deceased lived. An heir based in the Paris region would pay ${h.eur2(idf.total)} for the same car, Île-de-France Mobilités surcharge included.</p>

<h2>Papers for an inheritance</h2>
<p>The application is made online on the ${h.src('ants', 'ANTS website')}, the French agency that issues registration certificates, in its section on vehicles of deceased persons. It relies on the deceased’s carte grise and on proof that you are an heir: a certificate of inheritance, or a deed drawn up by the notary handling the estate. Where there are several heirs and only one keeps the car, the others’ written consent is usually required. We have not found a verified legal deadline specific to inheritance: the one-month rule that follows a sale does not expressly cover this case, so ANTS remains the reference for your file.</p>

<h2>A gift is handled like a sale</h2>
<p>The giver declares the transfer on the ANTS website and hands over the signed transfer certificate, the crossed-out carte grise and the transfer code. The recipient then has the usual deadline to register the car, and the regional tax is charged at the rate of their own region. Whether the car is given or sold makes no difference to the amount, which depends only on horsepower, age and region.</p>

<h2>Selling without registering</h2>
<p>If nobody wants to keep the car, selling it straight from the estate avoids paying regional tax on a certificate that would only be used for a few weeks. This is possible under conditions set out by ANTS. To estimate what the buyer will pay, use the ${h.a('occasion-titulaire', 'used-car transfer calculation')}. All these applications are free on the ANTS website, where you pay only the taxes; an approved professional can handle them for a service fee.</p>
`;
    },
  },
});
