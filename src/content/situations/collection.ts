import { defineGuide, type Helpers } from '../../lib/guide-types';

const REG = 'normandie';
const JOUR = (h: Helpers) => h.P.regional.date_releve;
/** Achat d'un véhicule ancien (changement de titulaire) dans la région d'exemple. */
const achat = (h: Helpers, cv: number, date1re: string, genre: 'vp' | 'moto' | 'utilitaire' = 'vp', region = REG) =>
  h.M.coutCarteGrise({ demarche: 'titulaire', region, origine: 'france_occasion', energie: 'essence', genre, cv, date1re, dateOp: JOUR(h), gkm: 0, masseKg: 0, ptacKg: 3500 });
/** Passage en carte grise de collection, sans changement de propriétaire : taxe fixe et redevance seules. */
const passage = (h: Helpers) => h.P.national.taxe_fixe + h.P.national.redevance;

export default defineGuide({
  id: 'collection',
  group: 'situations',
  order: 90,
  mini: 'collection',
  miniHref: 'home',
  related: ['dix-ans', 'occasion-titulaire', 'moto-scooter', 'lire-carte-grise', 'region-normandie'],
  sources: ['cibs', 'f19211', 'prixcv', 'a421_26', 'ants'],
  fr: {
    slug: 'vehicule-de-collection',
    nav: 'Véhicule de collection',
    card: 'Pas de remise propre à la carte grise de collection : la moitié due dès dix ans, et 13,76 € pour changer de mention.',
    title: 'Carte grise de collection 2026 : prix réel et réductions',
    description: 'Carte grise de collection en 2026 : aucune réduction propre, seule la moitié du tarif à dix ans joue, pas de taxe Y2, et 13,76 € pour passer en collection.',
    h1: 'Carte grise d’un véhicule de collection en 2026',
    intro: 'Le mini-simulateur montre la taxe régionale au tarif plein puis après la réduction de moitié, pour une voiture ancienne achetée dans votre région.',
    resume: (h) => {
      const r = h.P.regions.find((x) => x.id === REG)!;
      const v = achat(h, 11, '1986-05-01');
      return `On lit souvent qu’une voiture de collection paie une carte grise réduite. C’est inexact : le code des impositions sur les biens et services ne prévoit aucune remise de taxe régionale liée à la mention « véhicule de collection ». La seule réduction qui joue est la règle générale des dix ans : dès que la première immatriculation a dix ans ou plus, le tarif régional est divisé par deux, comme pour n’importe quelle voiture d’occasion. Une voiture de quarante ans paie donc exactement comme une voiture de douze ans de même puissance. Le statut de collection apporte en revanche une exonération de la taxe Y2 sur les véhicules de transport, utile pour un ancien utilitaire. Changer la carte grise normale d’un véhicule que l’on possède déjà en carte grise de collection coûte ${h.eur2(passage(h))}, sans taxe régionale. Exemple : une berline de 11 CV de 1986 achetée en ${r.nom.fr} coûte ${h.eur2(v.total)}.`;
    },
    faqs: (h) => {
      const m = achat(h, 6, '1985-05-01', 'moto');
      return [
        { q: 'La mention collection réduit-elle la taxe régionale d’une voiture ancienne ?', a: 'Non. Aucun article du code des impositions ne prévoit de tarif réduit pour les véhicules de collection. Une voiture ancienne bénéficie seulement de la moitié du tarif, comme tout véhicule dont la première immatriculation remonte à dix ans ou plus. Qu’elle porte ou non la mention collection, le montant de la taxe régionale est identique lors d’un achat.' },
        { q: 'Combien coûte le passage en carte grise de collection ?', a: `${h.eur2(passage(h))} : la taxe fixe de ${h.eur2(h.P.national.taxe_fixe)} plus ${h.eur2(h.P.national.redevance)} pour l’envoi du titre. Il n’y a pas de taxe régionale à payer, car le véhicule ne change pas de propriétaire. Le montant est le même dans toutes les régions et ne dépend ni de la puissance ni de l’âge du véhicule.` },
        { q: 'Une moto de collection paie-t-elle un quart du tarif ?', a: `Non. Une moto paie déjà la moitié du tarif régional quel que soit son âge, et cette moitié ne se cumule pas avec la réduction à dix ans. Une moto de 6 CV de 1985 achetée en ${h.P.regions.find((x) => x.id === REG)!.nom.fr} coûte donc ${h.eur2(m.total)}, comme une moto récente de même puissance. La mention collection n’y change rien.` },
        { q: 'Quelles conditions pour obtenir une carte grise de collection ?', a: 'Le véhicule doit avoir plus de trente ans, ne plus être produit et avoir gardé ses caractéristiques d’origine sans modification de ses éléments essentiels. La demande s’appuie sur une attestation du constructeur ou de la Fédération française des véhicules d’époque. Elle se dépose ensuite en ligne sur le site de l’ANTS, comme une autre modification de carte grise.' },
      ];
    },
    body: (h) => {
      const d = JOUR(h);
      const r = h.P.regions.find((x) => x.id === REG)!;
      const tarif = h.M.tarifRegion(REG, d).cv;
      const vieille = achat(h, 11, '1986-05-01');
      const moyenne = achat(h, 11, '2013-05-01');
      const recente = achat(h, 11, '2019-05-01');
      const idf = achat(h, 11, '1986-05-01', 'vp', 'ile-de-france');
      const fourgon = achat(h, 8, '1979-05-01', 'utilitaire');
      const rows = [
        ['Berline de 1986', h.eur2(vieille.y1.y1), h.eur2(vieille.total)],
        ['Berline de 2013', h.eur2(moyenne.y1.y1), h.eur2(moyenne.total)],
        ['Berline de 2019', h.eur2(recente.y1.y1), h.eur2(recente.total)],
      ];
      return `
<h2>Trois âges, deux prix</h2>
<p>En ${r.nom.fr}, le cheval fiscal vaut ${h.eur2(tarif)} au ${h.date(d)}. Pour une voiture de 11 CV achetée d’occasion, seul le franchissement des dix ans fait varier la taxe régionale : au-delà, l’âge ne compte plus.</p>
${h.table(['Voiture de 11 CV', 'Taxe régionale', 'Carte grise complète'], rows, `Achat d’occasion en ${r.nom.fr}, tarifs au ${h.date(d)}.`, ['l', 'r', 'r'])}
<p>La berline de 1986 et celle de 2013 paient le même montant. Pour un acheteur francilien, la même voiture ancienne reviendrait à ${h.eur2(idf.total)}, la majoration d’Île-de-France Mobilités étant elle aussi réduite de moitié.</p>

<h2>Le seul avantage fiscal : la taxe Y2</h2>
<p>La taxe sur les véhicules de transport frappe les camionnettes et les camions selon leur PTAC. Le code des impositions en exonère tout véhicule de collection. Un fourgon de 1979 classé en collection n’a donc que la taxe régionale à payer à l’achat : ${h.eur2(fourgon.y1.y1)} pour 8 CV en ${r.nom.fr}, au lieu des ${h.eur2(fourgon.y2)} supplémentaires qu’il paierait avec une carte grise ordinaire. Le mini-simulateur, qui raisonne sur une voiture, n’affiche pas cette ligne.</p>

<h2>Passer en carte grise de collection</h2>
<p>Quand vous possédez déjà le véhicule, la conversion ne change pas son propriétaire : la taxe régionale n’est pas due. Le nouveau titre coûte ${h.eur2(passage(h))}, la somme de la taxe de gestion et de l’envoi postal. Le dossier réunit la carte grise actuelle, le formulaire de demande et une attestation, établie par le constructeur ou par la Fédération française des véhicules d’époque. La démarche est gratuite sur le ${h.src('ants', 'site de l’ANTS')}, où l’on ne paie que les taxes ; un professionnel habilité peut s’en charger contre des frais de service.</p>

<h2>Ce que la mention change, hors fiscalité</h2>
<p>La carte grise de collection s’accompagne d’un contrôle technique plus espacé que pour une voiture ordinaire, selon des règles propres aux véhicules d’époque. Avant de demander la conversion, vérifiez la périodicité applicable à votre cas sur service-public.gouv.fr, car elle dépend de la date de mise en circulation. Pour savoir si une voiture que vous visez a déjà passé le cap des dix ans, la page sur la ${h.a('dix-ans', 'règle des dix ans')} détaille le calcul de la date.</p>
`;
    },
  },
  en: {
    slug: 'classic-car',
    nav: 'Classic car',
    card: 'No special discount for a classic registration: half rate from ten years, and €13.76 to switch the label.',
    title: 'Classic car registration in France 2026: the real cost',
    description: 'Classic car registration in France in 2026: no special discount, only the ten-year half rate applies, no Y2 tax, and €13.76 to switch to a classic certificate.',
    h1: 'Registering a classic car in France in 2026',
    intro: 'The mini calculator shows the regional tax at full rate and after the half reduction, for an old car bought in your region.',
    resume: (h) => {
      const r = h.P.regions.find((x) => x.id === REG)!;
      const v = achat(h, 11, '1986-05-01');
      return `Many owners expect a cheaper carte grise, the French registration certificate, once their car is registered as a classic. It is not so: the French tax code grants no regional tax discount tied to the “véhicule de collection” label. The only reduction that applies is the general ten-year rule, which halves the regional rate once the first registration is ten years old or more, exactly as for any used car. A forty-year-old car therefore pays the same as a twelve-year-old one with the same fiscal horsepower. Classic status does bring one tax benefit: exemption from the Y2 transport vehicle tax, which matters for an old van. Converting a normal certificate into a collection certificate for a vehicle you already own costs ${h.eur2(passage(h))}, with no regional tax. Example: an 11 CV saloon from 1986 bought in ${r.nom.en} costs ${h.eur2(v.total)} to register.`;
    },
    faqs: (h) => {
      const m = achat(h, 6, '1985-05-01', 'moto');
      return [
        { q: 'Is the regional tax lower on a car registered as a classic in France?', a: 'No. Nothing in the French tax code sets a reduced rate for collection vehicles. An old car simply benefits from the half rate that every vehicle gets once its first registration is ten years old or more. With or without the collection label, the regional tax charged on a purchase is exactly the same amount.' },
        { q: 'How much does it cost to switch to a collection certificate?', a: `${h.eur2(passage(h))}: ${h.eur2(h.P.national.taxe_fixe)} of management tax plus ${h.eur2(h.P.national.redevance)} to post the new card. No regional tax is due, because the owner does not change. The amount is the same in every region and does not depend on the vehicle’s horsepower or age.` },
        { q: 'Does a vintage motorbike pay a quarter of the regional rate?', a: `No. A motorbike already pays half the regional rate at any age, and that half does not stack with the ten-year reduction. A 6 CV motorbike from 1985 bought in ${h.P.regions.find((x) => x.id === REG)!.nom.en} therefore costs ${h.eur2(m.total)}, the same as a recent bike of equal horsepower. The collection label changes nothing here.` },
        { q: 'Which vehicles qualify for a French collection certificate?', a: 'The vehicle must be over thirty years old, no longer in production, and keep its original specification without changes to its essential parts. The application relies on a certificate from the manufacturer or from the Fédération française des véhicules d’époque, the French historic vehicle federation. It is then filed online with ANTS like any other certificate change.' },
      ];
    },
    body: (h) => {
      const d = JOUR(h);
      const r = h.P.regions.find((x) => x.id === REG)!;
      const tarif = h.M.tarifRegion(REG, d).cv;
      const vieille = achat(h, 11, '1986-05-01');
      const moyenne = achat(h, 11, '2013-05-01');
      const recente = achat(h, 11, '2019-05-01');
      const idf = achat(h, 11, '1986-05-01', 'vp', 'ile-de-france');
      const fourgon = achat(h, 8, '1979-05-01', 'utilitaire');
      const rows = [
        ['1986 saloon', h.eur2(vieille.y1.y1), h.eur2(vieille.total)],
        ['2013 saloon', h.eur2(moyenne.y1.y1), h.eur2(moyenne.total)],
        ['2019 saloon', h.eur2(recente.y1.y1), h.eur2(recente.total)],
      ];
      return `
<h2>Three ages, two prices</h2>
<p>In ${r.nom.en} a fiscal horsepower costs ${h.eur2(tarif)} on ${h.date(d)}. For a used 11 CV car, only crossing the ten-year mark changes the regional tax; beyond that, age no longer counts.</p>
${h.table(['11 CV car', 'Regional tax', 'Full certificate cost'], rows, `Used purchase in ${r.nom.en}, rates on ${h.date(d)}.`, ['l', 'r', 'r'])}
<p>The 1986 saloon and the 2013 one pay the same. A buyer living in the Paris region would pay ${h.eur2(idf.total)} for the old car, as the Île-de-France Mobilités surcharge is halved too.</p>

<h2>The one tax advantage: no Y2</h2>
<p>The transport vehicle tax hits vans and trucks according to their gross weight, and the tax code exempts every collection vehicle from it. A 1979 van registered as a classic therefore pays only the regional tax on purchase: ${h.eur2(fourgon.y1.y1)} for 8 CV in ${r.nom.en}, instead of an extra ${h.eur2(fourgon.y2)} on an ordinary certificate. The mini calculator, built for cars, does not show this line.</p>

<h2>Switching to a collection certificate</h2>
<p>If you already own the vehicle, converting it involves no change of owner, so no regional tax is due. The new card costs ${h.eur2(passage(h))}, the management tax plus postage. The file includes the manufacturer’s or the federation’s certificate, the current carte grise and the application form. The application is free on the ${h.src('ants', 'ANTS website')}, the French agency for registration documents, and you pay only the taxes; an approved professional can handle it for a service fee.</p>

<h2>What the label changes beyond tax</h2>
<p>A collection certificate comes with roadworthiness tests (the French contrôle technique) at longer intervals than for an everyday car, under rules specific to historic vehicles. Before converting, check the interval that applies to your vehicle on service-public.gouv.fr, as it depends on the date it was first put on the road. To see whether a car you are eyeing has already passed the ten-year mark, the ${h.a('dix-ans', 'ten-year rule page')} explains how the date is counted.</p>
`;
    },
  },
});
