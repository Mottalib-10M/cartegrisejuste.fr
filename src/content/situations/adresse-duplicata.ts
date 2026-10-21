import { defineGuide, type Helpers, type Lang } from '../../lib/guide-types';

const REG = 'ile-de-france';
const base = (h: Helpers) => ({ region: REG, origine: 'france_occasion' as const, energie: 'essence' as const, genre: 'vp' as const, cv: 6, date1re: '2021-03-01', dateOp: h.P.regional.date_releve, gkm: 0, masseKg: 0, ptacKg: 0 });
const adresse = (h: Helpers, rang: number) => h.M.coutCarteGrise({ ...base(h), demarche: 'adresse', rangAdresse: rang });
const duplicata = (h: Helpers) => h.M.coutCarteGrise({ ...base(h), demarche: 'duplicata' });
const vente = (h: Helpers) => h.M.coutCarteGrise({ ...base(h), demarche: 'titulaire' });
const N = (h: Helpers) => h.P.national.adresse_gratuits;
const rang = (n: number, l: Lang) => (l === 'fr' ? (n === 1 ? '1er' : `${n}e`) : `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`);

export default defineGuide({
  id: 'adresse-duplicata',
  group: 'situations',
  order: 100,
  mini: 'adresseDuplicata',
  miniHref: 'home',
  related: ['occasion-titulaire', 'heritage-donation', 'lire-carte-grise', 'taxes-ou-frais', 'region-ile-de-france'],
  sources: ['f1726', 'f19211', 'cibs', 'ants'],
  fr: {
    slug: 'changement-adresse-duplicata',
    nav: 'Adresse et duplicata',
    card: 'Changement d’adresse gratuit jusqu’au 3e, duplicata à 13,76 € sans taxe régionale, quelle que soit la région.',
    title: 'Changement d’adresse et duplicata de carte grise 2026',
    description: 'Changement d’adresse sur la carte grise : 0 € du 1er au 3e, 2,76 € ensuite. Duplicata : 13,76 € sans taxe régionale ni majoration IDFM. Délais et cas.',
    h1: 'Changement d’adresse et duplicata de carte grise : ce que vous payez',
    intro: 'Le mini-simulateur montre que ni la région ni la puissance ne modifient le prix d’un changement d’adresse ou d’un duplicata.',
    resume: (h) => {
      const dup = duplicata(h);
      return `Changer d’adresse sur sa carte grise ne coûte rien du ${rang(1, 'fr')} au ${rang(N(h), 'fr')} changement : on reçoit par la poste une étiquette à coller sur le titre, qui porte la nouvelle adresse. À partir du ${rang(N(h) + 1, 'fr')} déménagement, il n’y a plus de place pour une étiquette et un nouveau certificat est imprimé ; il coûte ${h.eur2(adresse(h, N(h) + 1).total)}, la seule redevance d’envoi, car la taxe de gestion n’est pas due pour une adresse. Un duplicata, demandé après une perte, un vol, une détérioration ou quand les cases du contrôle technique sont pleines, coûte ${h.eur2(dup.total)}, dont ${h.eur2(dup.y5)} pour l’envoi postal et ${h.eur2(dup.y4)} pour la gestion. Aucune de ces démarches ne déclenche la taxe régionale, puisque le véhicule ne change pas de propriétaire ; la majoration d’Île-de-France Mobilités n’est donc pas due non plus. Le prix est le même à Paris, à Brest ou à Mayotte, pour une citadine comme pour un gros SUV.`;
    },
    faqs: (h) => {
      const dup = duplicata(h);
      return [
        { q: 'Dans quel délai déclarer sa nouvelle adresse sur la carte grise ?', a: 'Dans le mois qui suit le déménagement. Le code de la route impose ce délai au titulaire et sanctionne son oubli d’une contravention. On la déclare sur le site de l’ANTS, muni du numéro d’immatriculation et une adresse électronique. Une même démarche peut être faite pour plusieurs véhicules à votre nom, chacun recevant son étiquette.' },
        { q: 'Comment savoir à quel changement d’adresse j’en suis ?', a: `Comptez les étiquettes collées sur votre certificat. Tant qu’il en porte moins de ${h.num(N(h))}, la prochaine adresse arrive sur une nouvelle étiquette gratuite. Quand la dernière place est prise, le changement suivant produit un nouveau titre à ${h.eur2(adresse(h, N(h) + 1).total)}. Le compteur repart à zéro avec ce nouveau certificat, qui accueillera à son tour de nouvelles étiquettes.` },
        { q: 'Le duplicata d’une carte grise volée coûte-t-il plus cher à Paris ?', a: `Non. Le duplicata coûte ${h.eur2(dup.total)} partout en France. La majoration d’Île-de-France Mobilités ne s’applique qu’avec la taxe régionale, qui n’est due qu’en cas de changement de propriétaire. En cas de vol, joignez le récépissé de déclaration de vol remis par la police ou la gendarmerie à votre demande en ligne.` },
        { q: 'Que paie-t-on pour refaire une carte grise détruite par une inondation ?', a: `${h.eur2(h.P.national.redevance)} seulement. Le code des impositions exonère de taxe de gestion la réédition d’un certificat détruit par des intempéries, et il n’y a pas de taxe régionale à payer. Seul l’envoi du titre reste facturé. La même somme s’applique quand l’administration corrige une erreur qu’elle a commise sur votre certificat.` },
      ];
    },
    body: (h) => {
      const dup = duplicata(h);
      const v = vente(h);
      const rows = [
        [`Changement d’adresse, du ${rang(1, 'fr')} au ${rang(N(h), 'fr')}`, 'étiquette', h.eur2(adresse(h, 1).total)],
        [`Changement d’adresse, ${rang(N(h) + 1, 'fr')} et suivants`, 'nouveau titre', h.eur2(adresse(h, N(h) + 1).total)],
        ['Duplicata (perte, vol, détérioration)', 'nouveau titre', h.eur2(dup.total)],
        ['Réédition après intempéries', 'nouveau titre', h.eur2(h.P.national.redevance)],
        ['Achat du même véhicule en Île-de-France', 'nouveau titre', h.eur2(v.total)],
      ];
      return `
<h2>Le coût de chaque démarche</h2>
<p>Le tableau compare les démarches sans changement de propriétaire avec l’achat d’une 6 CV par un Francilien, dont la région a le tarif le plus haut. L’écart vient entièrement de la taxe régionale et de la majoration francilienne, absentes des quatre premières lignes.</p>
${h.table(['Démarche', 'Ce que vous recevez', 'Coût'], rows, `Montants au ${h.date(h.P.regional.date_releve)}.`, ['l', 'l', 'r'])}

<h2>Déménager : l’étiquette, puis un nouveau titre</h2>
<p>La déclaration se fait sur le site de l’ANTS dans le mois qui suit l’emménagement. Jusqu’au ${h.num(N(h))}e changement, la poste vous apporte une étiquette autocollante avec la nouvelle adresse, à poser sur la carte grise à l’emplacement prévu. Le certificat garde alors son numéro et sa date. Une fois les emplacements remplis, un titre neuf est imprimé ; seule la redevance d’envoi de ${h.eur2(h.P.national.redevance)} est facturée, car le code des impositions exonère de taxe de gestion la délivrance motivée par une simple adresse. Déménager dans une région plus chère ne fait rien payer de plus : le tarif régional ne sera dû qu’à la prochaine vente.</p>

<h2>Perte, vol, détérioration : le duplicata</h2>
<p>La ${h.src('f1726', 'fiche officielle sur le duplicata')} retient un coût de ${h.eur2(dup.total)}, qui additionne la taxe fixe (${h.eur2(dup.y4)}) et la redevance postale (${h.eur2(dup.y5)}). La même démarche sert quand toutes les cases réservées au contrôle technique sont remplies. En cas de vol, la déclaration aux forces de l’ordre précède la demande. Si la démarche en ligne vous remet un certificat provisoire, gardez-le à bord jusqu’à réception du nouveau titre.</p>

<h2>Les autres cas à prix réduit</h2>
<p>Certaines rééditions ne coûtent que l’envoi, soit ${h.eur2(h.P.national.redevance)} : certificat détruit par une catastrophe naturelle ou des intempéries, correction d’une erreur de l’administration, changement de plaque après une usurpation. Pour un ajout ou un retrait de conjoint, le montant rejoint celui du duplicata ; la page sur l’${h.a('heritage-donation', 'héritage et la donation')} détaille ce cas. Toutes ces demandes se font gratuitement sur le ${h.src('ants', 'site de l’ANTS')}, où l’on ne paie que les taxes ; un professionnel habilité peut aussi les déposer contre des frais de service.</p>
`;
    },
  },
  en: {
    slug: 'address-change-duplicate',
    nav: 'Address change and duplicate',
    card: 'Change of address free up to the 3rd time, duplicate at €13.76 with no regional tax, in every region.',
    title: 'Carte grise address change and duplicate in France 2026',
    description: 'Changing the address on a French carte grise: €0 the first 3 times, then €2.76. A duplicate costs €13.76 with no regional tax or Paris surcharge. Deadlines.',
    h1: 'Address change and duplicate carte grise: what you pay',
    intro: 'The mini calculator shows that neither your region nor your horsepower affects the price of an address change or a duplicate.',
    resume: (h) => {
      const dup = duplicata(h);
      return `Updating the address on your carte grise, the French registration certificate, costs nothing for the ${rang(1, 'en')} to the ${rang(N(h), 'en')} change: a sticker with your new address arrives by post and you put it on the card. From the ${rang(N(h) + 1, 'en')} move, there is no room left for a sticker, so a new certificate is printed; it costs ${h.eur2(adresse(h, N(h) + 1).total)}, only the postage fee, because the management tax is waived for an address change. A duplicate, needed after loss, theft or damage, or once the roadworthiness test boxes are full, costs ${h.eur2(dup.total)}: ${h.eur2(dup.y4)} of management tax and ${h.eur2(dup.y5)} for delivery. None of these steps triggers the regional tax, since the vehicle keeps the same owner, so the Île-de-France Mobilités surcharge does not apply either. The price is the same in Paris, Brittany or Réunion, for a small hatchback or a large SUV.`;
    },
    faqs: (h) => {
      const dup = duplicata(h);
      return [
        { q: 'How long do I have to report a new address after moving in France?', a: 'One month from the move. The French Highway Code sets this deadline for the registered keeper and treats a missed declaration as a minor offence. You declare it online on the ANTS website, the agency that handles registration certificates, with your registration number and an email address. Each vehicle in your name gets its own sticker.' },
        { q: 'How can I tell whether my next address change will be free?', a: `Count the stickers already on your certificate. While there are fewer than ${h.num(N(h))}, the next address comes on a free sticker. Once the last slot is used, the following change produces a new card at ${h.eur2(adresse(h, N(h) + 1).total)}. The count then starts again on the new certificate, which has its own sticker slots.` },
        { q: 'Is a replacement for a stolen carte grise dearer in the Paris region?', a: `No. A duplicate costs ${h.eur2(dup.total)} anywhere in France. The Île-de-France Mobilités surcharge only rides on the regional tax, which is charged only when the owner changes. For a theft, attach the police or gendarmerie theft report to your online application before the new card is issued.` },
        { q: 'What does it cost to replace a certificate destroyed in a flood?', a: `Just ${h.eur2(h.P.national.redevance)}. The French tax code waives the management tax when a certificate destroyed by severe weather is reissued, and there is no regional tax. Only delivery is charged. The same amount applies when the administration corrects a mistake it made on your certificate.` },
      ];
    },
    body: (h) => {
      const dup = duplicata(h);
      const v = vente(h);
      const rows = [
        [`Address change, ${rang(1, 'en')} to ${rang(N(h), 'en')}`, 'sticker', h.eur2(adresse(h, 1).total)],
        [`Address change, ${rang(N(h) + 1, 'en')} onwards`, 'new card', h.eur2(adresse(h, N(h) + 1).total)],
        ['Duplicate (loss, theft, damage)', 'new card', h.eur2(dup.total)],
        ['Reissue after severe weather', 'new card', h.eur2(h.P.national.redevance)],
        ['Buying the same car in Île-de-France', 'new card', h.eur2(v.total)],
      ];
      return `
<h2>What each step costs</h2>
<p>The table sets the steps that involve no change of owner against buying a 6 CV car in Île-de-France, the dearest region. The whole gap comes from the regional tax and the Paris-region surcharge, which the first four rows never carry.</p>
${h.table(['Step', 'What you receive', 'Cost'], rows, `Amounts on ${h.date(h.P.regional.date_releve)}.`, ['l', 'l', 'r'])}

<h2>Moving house: sticker first, new card later</h2>
<p>You report the move on the ANTS website within a month of settling in. For the first ${h.num(N(h))} changes, a self-adhesive sticker with the new address arrives to be placed in the dedicated space on the card, which keeps its number and date. Once the spaces are full, a fresh certificate is printed and only the ${h.eur2(h.P.national.redevance)} postage is charged, because the tax code waives the management tax when the only reason is an address. Moving to a dearer region costs nothing extra now: the regional rate will only be due at the next sale.</p>

<h2>Loss, theft or damage: the duplicate</h2>
<p>The ${h.src('f1726', 'official page on duplicates')} puts the cost at ${h.eur2(dup.total)}: ${h.eur2(dup.y4)} of management tax and ${h.eur2(dup.y5)} for delivery. The same procedure applies when every roadworthiness test box on the card is filled. After a theft, report it to the police first. If the online process issues a temporary certificate, keep it in the car until the new card arrives.</p>

<h2>Other reduced-price cases</h2>
<p>Some reissues cost only the postage, ${h.eur2(h.P.national.redevance)}: a certificate destroyed by a natural disaster or severe weather, a correction of an error made by the administration, or a new plate after number-plate cloning. Adding or removing a spouse costs the same as a duplicate; the ${h.a('heritage-donation', 'inheritance and gift page')} covers that case. All of these are free to file on the ${h.src('ants', 'ANTS website')}, where you pay only the taxes; an approved professional can file them for a service fee.</p>
`;
    },
  },
});
