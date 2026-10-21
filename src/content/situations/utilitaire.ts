import { defineGuide, type Helpers } from '../../lib/guide-types';

const REG = 'occitanie';
/** Carte grise d'un utilitaire d'occasion dans la région d'exemple, au jour du relevé. */
const cout = (h: Helpers, cv: number, ptac: number, vieux = false) =>
  h.M.coutCarteGrise({ demarche: 'titulaire', region: REG, origine: 'france_occasion', energie: 'diesel', genre: 'utilitaire', cv, date1re: vieux ? '2014-01-01' : '2022-06-01', dateOp: h.P.regional.date_releve, gkm: 0, masseKg: 0, ptacKg: ptac });
/** Camion de plus de 3,5 t (N2, N3) : tarif régional réduit de moitié quel que soit l'âge (L421-47). */
const camion = (h: Helpers, cv: number, ptac: number) => {
  const r = cout(h, cv, ptac);
  return { y1: r.y1.y1, y2: r.y2, total: r.total };
};
const tranches = (h: Helpers, en: boolean) => {
  const b = h.P.y2.bareme;
  return b.map((t, i) => {
    const bas = i === 0 ? null : b[i - 1].ptac_max;
    const label = t.ptac_max === null
      ? (en ? `over ${h.num(bas!)} kg` : `plus de ${h.num(bas!)} kg`)
      : bas === null
        ? (en ? `up to ${h.num(t.ptac_max)} kg` : `jusqu’à ${h.num(t.ptac_max)} kg`)
        : (en ? `${h.num(bas)} to ${h.num(t.ptac_max)} kg` : `de ${h.num(bas)} à ${h.num(t.ptac_max)} kg`);
    return [label, h.eur2(t.montant)];
  });
};

export default defineGuide({
  id: 'utilitaire',
  group: 'situations',
  order: 70,
  mini: 'utilitaire',
  miniHref: 'home',
  related: ['occasion-titulaire', 'camping-car', 'comparer-regions', 'tarif-cheval-fiscal', 'malus-co2'],
  sources: ['a421_26', 'cibs', 'f19211', 'prixcv', 'ants'],
  fr: {
    slug: 'utilitaire-camionnette',
    nav: 'Utilitaire et camionnette',
    card: 'Taxe régionale, taxe sur les véhicules de transport selon le PTAC et absence de malus pour une camionnette.',
    title: 'Carte grise utilitaire 2026 : taxe Y2 et camionnette',
    description: 'Carte grise d’un utilitaire en 2026 : taxe régionale, taxe Y2 de 34 € à 285 € selon le PTAC, camionnette sans malus et moitié du tarif au-delà de 3,5 tonnes.',
    h1: 'Carte grise d’un utilitaire ou d’une camionnette en 2026',
    intro: 'Le mini-simulateur additionne la taxe régionale, la taxe sur les véhicules de transport et les frais fixes pour votre fourgon.',
    resume: (h) => {
      const b = h.P.y2.bareme;
      const v = cout(h, 8, b[0].ptac_max!);
      const r = h.P.regions.find((x) => x.id === REG)!;
      return `Un utilitaire paie la même taxe régionale qu’une voiture, calculée sur ses chevaux fiscaux au tarif de la région du titulaire, avec la moitié du tarif une fois la première immatriculation vieille de dix ans. Il s’y ajoute une ligne propre aux véhicules de transport, la taxe Y2, qui dépend du poids total autorisé en charge inscrit en case F.2 : ${h.eur2(b[0].montant)} jusqu’à ${h.num(b[0].ptac_max!)} kg, puis ${h.eur2(b[1].montant)}, ${h.eur2(b[2].montant)} et ${h.eur2(b[3].montant)} pour les plus lourds. Depuis le ${h.date(h.P.camionnette_exemptee_des)}, une carrosserie « Camionnette » (CTTE) échappe au malus CO₂ et au malus au poids, même à cinq places. Au-delà de ${h.num(b[0].ptac_max!)} kg, les camions des catégories N2 et N3 ne paient que la moitié du tarif régional, quel que soit leur âge. Exemple : un fourgon de 8 CV d’occasion acheté en ${r.nom.fr} coûte ${h.eur2(v.total)}, dont ${h.eur2(v.y1.y1)} de taxe régionale et ${h.eur2(v.y2)} de taxe Y2.`;
    },
    faqs: (h) => {
      const b = h.P.y2.bareme;
      return [
        { q: 'Une camionnette à cinq places paie-t-elle le malus en 2026 ?', a: `Non. Depuis le ${h.date(h.P.camionnette_exemptee_des)}, l’article L421-30-1 du code des impositions sur les biens et services exempte des deux malus tout véhicule dont la carrosserie est « Camionnette », même s’il compte deux rangées de sièges. Vérifiez la mention « Camionnette » ou CTTE sur la carte grise ; une version « Véhicule de tourisme » d’un même fourgon reste, elle, soumise au malus.` },
        { q: 'Où lire le PTAC qui fixe la taxe Y2 d’un fourgon ?', a: `En case F.2 du certificat, en kilogrammes. C’est cette masse en charge maximale admissible qui classe le véhicule : jusqu’à ${h.num(b[0].ptac_max!)} kg la taxe vaut ${h.eur2(b[0].montant)}, au-dessus elle passe à ${h.eur2(b[1].montant)} puis grimpe par paliers. Le poids à vide de la case G.1 ne sert à rien ici, pas plus que la charge utile réelle.` },
        { q: 'La taxe Y2 d’un utilitaire baisse-t-elle après dix ans ?', a: `Non. La réduction de moitié à dix ans ne touche que la taxe régionale Y1. La taxe sur les véhicules de transport reste fixée par le seul PTAC, au même montant pour un fourgon neuf et pour un fourgon de vingt ans. Seuls les véhicules de collection en sont exonérés, ce qui vise surtout d’anciens utilitaires restaurés.` },
        { q: `Un camion de plus de ${h.num(b[0].ptac_max! / 1000, 1)} tonnes paie-t-il la taxe régionale entière ?`, a: `Non. L’article L421-47 réduit de moitié le tarif régional pour les camions des catégories N2 et N3, les tracteurs routiers et les autocars, et cette moitié vaut dès la première année. Elle ne se cumule pas avec la réduction à dix ans. La taxe Y2, en revanche, est due en entier selon le palier de poids.` },
      ];
    },
    body: (h) => {
      const d = h.P.regional.date_releve;
      const r = h.P.regions.find((x) => x.id === REG)!;
      const b = h.P.y2.bareme;
      const neuf = cout(h, 8, b[0].ptac_max!);
      const vieux = cout(h, 8, b[0].ptac_max!, true);
      const lourd = camion(h, 10, 5000);
      const tarif = h.M.tarifRegion(REG, d).cv;
      return `
<h2>Les lignes d’une carte grise d’utilitaire</h2>
<p>Le titre d’un véhicule utilitaire se lit comme celui d’une voiture, avec une ligne en plus. La taxe régionale Y1 multiplie les chevaux fiscaux de la case P.6 par le tarif de la région, majoration d’Île-de-France Mobilités comprise pour un titulaire francilien. La taxe Y2 dépend du poids. S’y ajoutent ${h.eur2(h.P.national.taxe_fixe)} de taxe de gestion, puis ${h.eur2(h.P.national.redevance)} pour l’envoi du titre à domicile. Le malus, lui, ne concerne pas un utilitaire : il vise les véhicules de tourisme à leur première immatriculation en France.</p>

<h2>Le barème de la taxe sur les véhicules de transport</h2>
<p>Le montant est fixé par l’${h.src('a421_26', 'article A421-26 du code des impositions')} selon le PTAC de la case F.2. Il concerne les véhicules de la catégorie N (camionnettes, camions, tracteurs) et les bus.</p>
${h.table(['PTAC (case F.2)', 'Taxe Y2'], tranches(h, false), 'Montants en vigueur en 2026.', ['l', 'r'])}

<h2>Exemple chiffré en ${r.nom.fr}</h2>
<p>Au ${h.date(d)}, le cheval fiscal y coûte ${h.eur2(tarif)}. Un fourgon diesel de 8 CV et ${h.num(b[0].ptac_max!)} kg de PTAC, acheté d’occasion à moins de dix ans, revient à ${h.eur2(neuf.total)} : ${h.eur2(neuf.y1.y1)} de taxe régionale, ${h.eur2(neuf.y2)} de taxe Y2 et ${h.eur2(neuf.y4 + neuf.y5)} de frais fixes. Le même fourgon immatriculé pour la première fois en 2014 ne paie plus que ${h.eur2(vieux.y1.y1)} de taxe régionale, soit ${h.eur2(vieux.total)} au total. Un porteur de 5 tonnes et 10 CV, classé N2, paie ${h.eur2(lourd.y1)} de taxe régionale grâce à la moitié du tarif, plus ${h.eur2(lourd.y2)} de taxe Y2, pour ${h.eur2(lourd.total)} au total.</p>

<h2>Camionnette ou véhicule de tourisme : la mention qui change tout</h2>
<p>Certains fourgons aménagés avec une deuxième rangée de sièges existent en deux versions. Celle dont la carrosserie est « Camionnette » (CTTE) n’est plus soumise au malus depuis le ${h.date(h.P.camionnette_exemptee_des)}. Celle homologuée en véhicule de tourisme suit les règles d’une voiture neuve : vérifiez la mention avant d’acheter un modèle neuf ou importé, car l’écart peut atteindre plusieurs milliers d’euros.</p>

<h2>Ce que le mini-simulateur prend en compte</h2>
<p>Il calcule un utilitaire d’occasion de moins de dix ans à partir de la région, des chevaux fiscaux et du PTAC. Au-delà de ${h.num(h.P.regional.poids_lourd.ptac_min_exclu)} kg de PTAC, il applique de lui-même la moitié du tarif prévue pour les camions N2 et N3. La demande se fait gratuitement sur le ${h.src('ants', 'site de l’ANTS')}, où l’on ne paie que les taxes ; un professionnel habilité peut aussi s’en charger contre des frais de service. Pour un camping-car, voyez la ${h.a('camping-car', 'page dédiée')}, qui n’a pas de taxe Y2.</p>
`;
    },
  },
  en: {
    slug: 'van-commercial-vehicle',
    nav: 'Vans and light trucks',
    card: 'Regional tax, transport vehicle tax by gross weight, and no malus for a van registered as a CTTE.',
    title: 'Van registration in France 2026: Y2 tax and CTTE rules',
    description: 'Registering a van in France in 2026: regional tax, Y2 transport tax from €34 to €285 by gross weight, no malus for a CTTE van, half rate above 3.5 tonnes.',
    h1: 'Registering a van or light truck in France in 2026',
    intro: 'The mini calculator adds up the regional tax, the transport vehicle tax and the fixed charges for your van.',
    resume: (h) => {
      const b = h.P.y2.bareme;
      const v = cout(h, 8, b[0].ptac_max!);
      const r = h.P.regions.find((x) => x.id === REG)!;
      return `A van in France pays the same regional tax as a car: its fiscal horsepower (the CV figure in box P.6 of the carte grise) times the rate of the region where the keeper lives, halved once the first registration is ten years old. On top comes a line that only goods vehicles carry, the Y2 transport vehicle tax, set by the gross vehicle weight in box F.2: ${h.eur2(b[0].montant)} up to ${h.num(b[0].ptac_max!)} kg, then ${h.eur2(b[1].montant)}, ${h.eur2(b[2].montant)} and ${h.eur2(b[3].montant)} for the heaviest. Since ${h.date(h.P.camionnette_exemptee_des)}, a vehicle whose body type reads “Camionnette” (CTTE) is outside both the CO₂ malus and the weight malus, even with five seats. Above ${h.num(b[0].ptac_max!)} kg, trucks in categories N2 and N3 pay only half the regional rate at any age. Worked example: a used 8 CV van bought in ${r.nom.en} costs ${h.eur2(v.total)}, of which ${h.eur2(v.y1.y1)} is regional tax and ${h.eur2(v.y2)} is Y2.`;
    },
    faqs: (h) => {
      const b = h.P.y2.bareme;
      return [
        { q: 'Does a five-seat crew van pay the French malus in 2026?', a: `No, provided it is registered as a “Camionnette”. Since ${h.date(h.P.camionnette_exemptee_des)}, article L421-30-1 of the French tax code exempts that body type from both the CO₂ and weight malus, whatever the seat count. Look for “Camionnette” or CTTE on the certificate. If the same model is homologated as a passenger car, it is taxed like any new car.` },
        { q: 'Which weight decides the Y2 tax on a van?', a: `The gross vehicle weight in box F.2, the maximum laden mass the vehicle is allowed. Up to ${h.num(b[0].ptac_max!)} kg you pay ${h.eur2(b[0].montant)}; above that the amount steps up to ${h.eur2(b[1].montant)} and then higher. The kerb weight in box G.1 and the load you actually carry make no difference to this tax.` },
        { q: 'Is the Y2 tax lower on an old van?', a: `No. The ten-year half rate applies only to the regional tax on line Y1. The transport vehicle tax depends on gross weight alone, so a brand-new van and a twenty-year-old one in the same weight band pay the same amount. Only vehicles registered as classics are exempt from it.` },
        { q: `Do lorries over ${h.num(b[0].ptac_max! / 1000, 1)} tonnes pay the full regional rate?`, a: `No. Article L421-47 halves the regional rate for trucks in categories N2 and N3, road tractors and coaches, from the very first year. This half rate does not stack with the ten-year reduction, so an old lorry still pays half. The Y2 tax, however, is charged in full according to the weight band.` },
      ];
    },
    body: (h) => {
      const d = h.P.regional.date_releve;
      const r = h.P.regions.find((x) => x.id === REG)!;
      const b = h.P.y2.bareme;
      const neuf = cout(h, 8, b[0].ptac_max!);
      const vieux = cout(h, 8, b[0].ptac_max!, true);
      const lourd = camion(h, 10, 5000);
      const tarif = h.M.tarifRegion(REG, d).cv;
      return `
<h2>What a van’s certificate charges</h2>
<p>The French registration certificate, the carte grise, lists its taxes on numbered lines. For a van, line Y1 is the regional tax: fiscal horsepower times the regional rate, including the Île-de-France Mobilités surcharge if you live in the Paris region. Line Y2 is the transport vehicle tax. Every certificate then adds ${h.eur2(h.P.national.taxe_fixe)} of management tax and ${h.eur2(h.P.national.redevance)} for posting the card to you. There is no malus: that tax targets passenger cars registered in France for the first time.</p>

<h2>Transport vehicle tax by weight band</h2>
<p>The amounts are set by ${h.src('a421_26', 'article A421-26 of the French tax code')} and apply to category N vehicles (vans, trucks, tractors) and buses.</p>
${h.table(['Gross weight (box F.2)', 'Y2 tax'], tranches(h, true), 'Amounts in force in 2026.', ['l', 'r'])}

<h2>A worked example in ${r.nom.en}</h2>
<p>On ${h.date(d)} a fiscal horsepower there costs ${h.eur2(tarif)}. A used 8 CV diesel van with a ${h.num(b[0].ptac_max!)} kg gross weight, under ten years old, comes to ${h.eur2(neuf.total)}: ${h.eur2(neuf.y1.y1)} regional tax, ${h.eur2(neuf.y2)} Y2 and ${h.eur2(neuf.y4 + neuf.y5)} in fixed charges. The same van first registered in 2014 pays only ${h.eur2(vieux.y1.y1)} in regional tax, ${h.eur2(vieux.total)} in all. A 5-tonne, 10 CV rigid truck in category N2 pays ${h.eur2(lourd.y1)} in regional tax thanks to the half rate, plus ${h.eur2(lourd.y2)} Y2, for ${h.eur2(lourd.total)} overall.</p>

<h2>Van or passenger car: the label that decides</h2>
<p>Some crew vans are sold in two versions. The one with a “Camionnette” (CTTE) body has been free of malus since ${h.date(h.P.camionnette_exemptee_des)}; the one homologated as a passenger car is taxed like a new car. If you are buying new or importing, read the certificate of conformity or ask the dealer which version you are getting, because the gap can run into thousands of euros.</p>

<h2>What the mini calculator covers</h2>
<p>It prices a used van under ten years old from the region, the horsepower and the gross weight. Above ${h.num(h.P.regional.poids_lourd.ptac_min_exclu)} kg of gross weight, it applies the half rate for N2 and N3 trucks by itself. You apply free of charge on the ${h.src('ants', 'ANTS website')}, the French agency that issues registration certificates, and pay only the taxes; an approved garage can also do it for a service fee. Motorhomes have no Y2 line: see the ${h.a('camping-car', 'motorhome page')}.</p>
`;
    },
  },
});
