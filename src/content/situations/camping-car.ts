import { defineGuide, type Helpers } from '../../lib/guide-types';

const REG = 'bretagne';
/** Camping-car d'occasion (VASP) acheté dans la région d'exemple, au jour du relevé. */
const cout = (h: Helpers, cv: number, date1re: string, region = REG) =>
  h.M.coutCarteGrise({ demarche: 'titulaire', region, origine: 'france_occasion', energie: 'diesel', genre: 'camping_car', cv, date1re, dateOp: h.P.regional.date_releve, gkm: 0, masseKg: 0, ptacKg: 3500 });
/** Camping-car neuf importé : aucun malus, car un VASP n'est pas un véhicule de tourisme. */
const neufImporte = (h: Helpers, cv: number) =>
  h.M.coutCarteGrise({ demarche: 'immat', region: REG, origine: 'import_neuf', energie: 'diesel', genre: 'camping_car', cv, date1re: h.P.regional.date_releve, dateOp: h.P.regional.date_releve, gkm: 230, masseKg: 3100, ptacKg: 3500 });
const tonnes = (h: Helpers) => h.num(h.P.y2.bareme[0].ptac_max! / 1000, 1);

export default defineGuide({
  id: 'camping-car',
  group: 'situations',
  order: 80,
  mini: 'campingCar',
  miniHref: 'home',
  related: ['utilitaire', 'import-europe', 'dix-ans', 'comparer-regions', 'region-bretagne'],
  sources: ['cibs', 'f19211', 'prixcv', 'cgi298', 'ants'],
  fr: {
    slug: 'camping-car',
    nav: 'Camping-car',
    card: 'Un camping-car ne paie ni malus ni taxe Y2 : seule la taxe régionale compte, avec la moitié à dix ans.',
    title: 'Carte grise camping-car 2026 : sans malus ni taxe Y2',
    description: 'Carte grise d’un camping-car en 2026 : genre VASP, ni malus CO₂ ni malus au poids, pas de taxe Y2, taxe régionale réduite de moitié à dix ans. Exemple chiffré.',
    h1: 'Carte grise d’un camping-car en 2026',
    intro: 'Le mini-simulateur calcule la taxe régionale de votre camping-car selon sa puissance, sa région et son année de mise en circulation.',
    resume: (h) => {
      const r = h.P.regions.find((x) => x.id === REG)!;
      const recent = cout(h, 9, '2020-06-01');
      const ancien = cout(h, 9, '2012-06-01');
      return `Un camping-car porte la mention VASP, véhicule automoteur spécialisé, en case J.1 de la carte grise. Ce classement change tout pour les taxes. Le code des impositions sur les biens et services exclut des véhicules de tourisme les véhicules de la catégorie M1 à usage spécial qui ne sont pas accessibles en fauteuil roulant : un camping-car neuf ou importé ne paie donc ni malus CO₂ ni malus au poids, même avec un gros moteur diesel et plus de trois tonnes. Il n’est pas non plus soumis à la taxe sur les véhicules de transport Y2, réservée aux camionnettes et aux camions. Reste la taxe régionale, calculée comme pour une voiture : chevaux fiscaux multipliés par le tarif de la région du titulaire, avec la moitié dès que la première immatriculation date de dix ans. En ${r.nom.fr}, un camping-car de 9 CV mis en circulation en 2020 coûte ${h.eur2(recent.total)} ; le même modèle de 2012 coûte ${h.eur2(ancien.total)}.`;
    },
    faqs: (h) => {
      const n = neufImporte(h, 9);
      return [
        { q: 'Un camping-car neuf paie-t-il le malus écologique ?', a: `Non. Le malus CO₂ et le malus au poids ne visent que les véhicules de tourisme, et un camping-car homologué VASP n’en fait pas partie. Un modèle neuf de 9 CV immatriculé en ${h.P.regions.find((x) => x.id === REG)!.nom.fr} revient ainsi à ${h.eur2(n.total)}, sans aucune ligne de malus, quels que soient ses émissions et son poids en ordre de marche.` },
        { q: `Faut-il payer la taxe Y2 pour un camping-car de plus de ${tonnes(h)} tonnes ?`, a: `Non. Le simulateur officiel de l’État fixe à zéro la taxe sur les véhicules de transport pour le genre VASP, quel que soit le PTAC. Cette taxe ne concerne que les camionnettes, camions, tracteurs et autocars. Le poids de votre camping-car n’intervient donc pas dans le prix de la carte grise, seulement dans le permis requis pour le conduire.` },
        { q: 'Quand la carte grise d’un camping-car coûte-t-elle moitié moins ?', a: `Dès que sa première immatriculation, en France ou à l’étranger, remonte à dix ans ou plus à la date de la demande. Le tarif régional est alors divisé par deux, majoration francilienne comprise. Acheter un camping-car de neuf ans et demi plutôt qu’un de dix ans fait donc payer le double de taxe régionale pour une différence d’âge minime.` },
        { q: 'Un fourgon aménagé en camping-car change-t-il de carte grise ?', a: 'Oui, si l’aménagement est réceptionné et que le genre passe de camionnette à VASP. Cette modification technique donne lieu à un nouveau titre sans taxe régionale, puisqu’il n’y a pas de changement de propriétaire. Le fourgon perd alors la taxe Y2 lors des ventes suivantes, mais la transformation doit être validée avant toute démarche.' },
      ];
    },
    body: (h) => {
      const d = h.P.regional.date_releve;
      const r = h.P.regions.find((x) => x.id === REG)!;
      const tarif = h.M.tarifRegion(REG, d).cv;
      const recent = cout(h, 9, '2020-06-01');
      const ancien = cout(h, 9, '2012-06-01');
      const n = neufImporte(h, 9);
      const idf = cout(h, 9, '2020-06-01', 'ile-de-france');
      const tva = h.P.tva_import;
      const rows = [
        ['9 CV, 2020', h.eur2(recent.y1.y1), h.eur2(recent.y4 + recent.y5), h.eur2(recent.total)],
        ['9 CV, 2012', h.eur2(ancien.y1.y1), h.eur2(ancien.y4 + ancien.y5), h.eur2(ancien.total)],
        ['9 CV neuf importé', h.eur2(n.y1.y1), h.eur2(n.y4 + n.y5), h.eur2(n.total)],
      ];
      return `
<h2>Pourquoi le genre VASP compte</h2>
<p>La case J.1 indique le genre national du véhicule. Un camping-car y porte VASP, pour véhicule automoteur spécialisé, avec en général la carrosserie « autocaravane ». Pour le fisc, ce genre sort le véhicule de la catégorie des véhicules de tourisme : c’est la raison pour laquelle aucun malus n’est dû à la première immatriculation, alors qu’une voiture de même poids paierait plusieurs milliers d’euros de malus au poids.</p>

<h2>Le calcul, ligne par ligne</h2>
<p>Le titre d’un camping-car ne comporte que trois postes : la taxe régionale, un forfait de gestion à ${h.eur2(h.P.national.taxe_fixe)} et l’envoi postal du document à ${h.eur2(h.P.national.redevance)}. En ${r.nom.fr}, où le cheval fiscal vaut ${h.eur2(tarif)} au ${h.date(d)}, cela donne les montants suivants pour un modèle de 9 CV.</p>
${h.table(['Camping-car', 'Taxe régionale', 'Taxe fixe et redevance', 'Total'], rows, `Tarifs de la région ${r.nom.fr} au ${h.date(d)}.`, ['l', 'r', 'r', 'r'])}
<p>Le même camping-car de 2020 acheté par un habitant d’Île-de-France coûterait ${h.eur2(idf.total)}, car la majoration d’Île-de-France Mobilités s’ajoute au tarif régional.</p>

<h2>Acheter un camping-car à l’étranger</h2>
<p>L’absence de malus vaut aussi pour un véhicule importé, ce qui rend l’achat en Allemagne ou en Belgique courant. La TVA, en revanche, reste à surveiller : un camping-car livré dans les ${h.num(tva.mois_max)} mois suivant sa première mise en service ou ayant parcouru au plus ${h.num(tva.km_max)} km est un moyen de transport neuf, et la TVA française de ${h.pct(tva.taux, 0)} est due en France, selon l’${h.src('cgi298', 'article 298 sexies du code général des impôts')}. Au-delà, il faut tout de même un quitus fiscal pour immatriculer un véhicule venu d’un autre pays de l’Union. Les étapes figurent sur la page consacrée à l’${h.a('import-europe', 'import depuis l’Europe')}.</p>

<h2>Ce que le mini-simulateur ne change pas</h2>
<p>Il demande le PTAC de la case F.2 pour vérifier qu’aucune taxe Y2 ne s’applique ; ce chiffre ne modifie donc jamais le résultat. La règle du plein tarif, puis de la moitié à dix ans, est celle que retient le simulateur de l’État pour les VASP jusqu’à ${tonnes(h)} tonnes. La demande se fait gratuitement sur le ${h.src('ants', 'site de l’ANTS')}, où l’on ne paie que les taxes ; un professionnel habilité peut aussi la déposer contre des frais de service. Pour un fourgon resté en genre camionnette, la ${h.a('utilitaire', 'page des utilitaires')} donne la taxe Y2 applicable.</p>
`;
    },
  },
  en: {
    slug: 'motorhome',
    nav: 'Motorhome',
    card: 'A motorhome pays no malus and no Y2 tax: only the regional tax counts, halved at ten years.',
    title: 'Motorhome registration in France 2026: no malus, no Y2',
    description: 'Registering a motorhome in France in 2026: VASP category, no CO₂ or weight malus, no Y2 transport tax, and a regional tax halved after ten years. An example.',
    h1: 'Registering a motorhome in France in 2026',
    intro: 'The mini calculator works out your motorhome’s regional tax from its horsepower, your region and the year it was first registered.',
    resume: (h) => {
      const r = h.P.regions.find((x) => x.id === REG)!;
      const recent = cout(h, 9, '2020-06-01');
      const ancien = cout(h, 9, '2012-06-01');
      return `In France a motorhome, or camping-car, is registered under the national category VASP, meaning specialised motor vehicle, shown in box J.1 of the registration certificate (the carte grise). That label matters for tax. The French tax code leaves special-purpose M1 vehicles that are not wheelchair accessible out of its definition of passenger cars, so a new or imported motorhome pays neither the CO₂ malus nor the weight malus, however large its diesel engine or its mass. Nor does it pay the Y2 transport vehicle tax, which is reserved for vans and trucks. What remains is the regional tax, worked out as for a car: fiscal horsepower times the rate of the region where you live, halved once the first registration is ten years old. In ${r.nom.en}, a 9 CV motorhome first registered in 2020 costs ${h.eur2(recent.total)} to register; the same model from 2012 costs ${h.eur2(ancien.total)}.`;
    },
    faqs: (h) => {
      const n = neufImporte(h, 9);
      return [
        { q: 'Will a brand-new motorhome be hit by the French CO₂ malus?', a: `No. Both the CO₂ malus and the weight malus apply only to passenger cars, and a motorhome homologated as a VASP is not one. A new 9 CV model registered in ${h.P.regions.find((x) => x.id === REG)!.nom.en} therefore costs ${h.eur2(n.total)}, with no malus line at all, whatever its emissions or kerb weight. Only the regional tax and fixed charges apply.` },
        { q: 'Does a heavy motorhome pay the transport vehicle tax?', a: 'No. The State’s official simulator sets the transport vehicle tax to zero for the VASP category, whatever the gross weight in box F.2. That tax is aimed at vans, trucks, tractors and coaches. The weight of your motorhome has no effect on the registration price; it only matters for the driving licence category you need.' },
        { q: 'At what age does a motorhome’s registration tax halve?', a: 'Once its first registration, in France or abroad, is ten years old or more on the day you apply. The regional rate is then halved, Paris-region surcharge included. Buying a motorhome aged nine and a half years rather than ten means paying twice the regional tax for a tiny difference in age, so the date in box B is worth checking.' },
        { q: 'What happens to the carte grise when a van is converted into a camper?', a: 'If the conversion is approved and the category changes from van to VASP, a new certificate is issued. As there is no change of owner, no regional tax is charged for it. Later sales then escape the Y2 transport vehicle tax, but the conversion must be approved before any application is made.' },
      ];
    },
    body: (h) => {
      const d = h.P.regional.date_releve;
      const r = h.P.regions.find((x) => x.id === REG)!;
      const tarif = h.M.tarifRegion(REG, d).cv;
      const recent = cout(h, 9, '2020-06-01');
      const ancien = cout(h, 9, '2012-06-01');
      const n = neufImporte(h, 9);
      const idf = cout(h, 9, '2020-06-01', 'ile-de-france');
      const tva = h.P.tva_import;
      const rows = [
        ['9 CV, 2020', h.eur2(recent.y1.y1), h.eur2(recent.y4 + recent.y5), h.eur2(recent.total)],
        ['9 CV, 2012', h.eur2(ancien.y1.y1), h.eur2(ancien.y4 + ancien.y5), h.eur2(ancien.total)],
        ['9 CV, new, imported', h.eur2(n.y1.y1), h.eur2(n.y4 + n.y5), h.eur2(n.total)],
      ];
      return `
<h2>Why the VASP label matters</h2>
<p>Box J.1 shows the vehicle’s national category. A motorhome carries VASP there, usually with the body type “autocaravane”. For tax purposes this category takes the vehicle out of the passenger car class, which is why no malus is due on first registration in France, while a car of the same weight would owe thousands of euros in weight malus.</p>

<h2>The cost, line by line</h2>
<p>A motorhome’s certificate has only three charges: the regional tax, a flat ${h.eur2(h.P.national.taxe_fixe)} management tax and ${h.eur2(h.P.national.redevance)} to post the card. In ${r.nom.en}, where a fiscal horsepower costs ${h.eur2(tarif)} on ${h.date(d)}, a 9 CV model comes out as follows.</p>
${h.table(['Motorhome', 'Regional tax', 'Fixed tax and fee', 'Total'], rows, `${r.nom.en} rates on ${h.date(d)}.`, ['l', 'r', 'r', 'r'])}
<p>A resident of the Paris region would pay ${h.eur2(idf.total)} for the same 2020 motorhome, because the Île-de-France Mobilités surcharge is added to the regional rate.</p>

<h2>Buying a motorhome abroad</h2>
<p>The absence of malus also covers imports, which is why many buyers look in Germany or Belgium. VAT is the point to watch: a motorhome delivered within ${h.num(tva.mois_max)} months of first use, or with no more than ${h.num(tva.km_max)} km, counts as a new means of transport and French VAT of ${h.pct(tva.taux, 0)} is due in France under ${h.src('cgi298', 'article 298 sexies of the General Tax Code')}. Older vehicles still need a quitus fiscal, the French tax clearance certificate, before they can be registered. The steps are on the ${h.a('import-europe', 'EU import page')}.</p>

<h2>What the mini calculator leaves unchanged</h2>
<p>It asks for the gross weight in box F.2 only to confirm that no Y2 tax applies, so that figure never moves the result. The full rate, then half at ten years, is the rule the State simulator applies to VASP vehicles up to ${tonnes(h)} tonnes. You apply free of charge on the ${h.src('ants', 'ANTS website')}, the agency that issues French registration certificates, and pay only the taxes; an approved professional can file it for a service fee. For a van still registered as a van, the ${h.a('utilitaire', 'van page')} gives the Y2 amount.</p>
`;
    },
  },
});
