import { defineGuide, type Helpers } from '../../lib/guide-types';

const jour = (h: Helpers) => h.P.regional.date_releve;
const ans = (h: Helpers) => h.P.regional.age_reduction_ans;
const an = (h: Helpers) => Number(h.P.regional.date_releve.slice(0, 4));
/** Date ISO décalée d'un nombre d'années (même jour, même mois). */
const moinsAns = (iso: string, n: number) => `${Number(iso.slice(0, 4)) - n}${iso.slice(4)}`;
/** Taxe régionale d'un véhicule à la date du relevé, juste sous puis juste au-dessus du seuil d'âge. */
const y1 = (h: Helpers, region: string, cv: number, vieux: boolean, genre: 'vp' | 'moto' | 'utilitaire' = 'vp') =>
  h.M.taxeRegionale({ cv, region, genre, energie: 'essence', demarche: 'titulaire', dateOp: jour(h), date1re: moinsAns(jour(h), vieux ? ans(h) : ans(h) - 1) }).y1;
const parTarif = (h: Helpers) =>
  h.P.regions
    .map((r) => ({ r, total: h.M.tarifRegion(r.id, jour(h)).cv + (r.idfm ? h.M.majorationIdfm(jour(h)) : 0) }))
    .sort((a, b) => b.total - a.total || a.r.nom.fr.localeCompare(b.r.nom.fr));
const lignesRegions = (h: Helpers, l: 'fr' | 'en') =>
  parTarif(h).map(({ r, total }) => [r.nom[l], h.eur2(total), h.eur2(y1(h, r.id, 5, false)), h.eur2(y1(h, r.id, 5, true)), h.eur2(y1(h, r.id, 5, false) - y1(h, r.id, 5, true)), h.eur2(y1(h, r.id, 8, false) - y1(h, r.id, 8, true))]);
const CVS = [4, 5, 6, 7, 8, 10, 12];
const lignesCv = (h: Helpers) => CVS.map((cv) => [`${h.num(cv)} CV`, h.eur2(y1(h, 'ile-de-france', cv, false) - y1(h, 'ile-de-france', cv, true)), h.eur2(y1(h, 'provence-alpes-cote-dazur', cv, false) - y1(h, 'provence-alpes-cote-dazur', cv, true)), h.eur2(y1(h, 'auvergne-rhone-alpes', cv, false) - y1(h, 'auvergne-rhone-alpes', cv, true)), h.eur2(y1(h, 'mayotte', cv, false) - y1(h, 'mayotte', cv, true))]);
/** Exemple d'achat à cheval sur la date anniversaire : voiture de 7 CV mise en circulation le 10 novembre 2016, achetée le 25 octobre 2026 en Bretagne. */
const B = '2016-11-10';
const ACHAT = '2026-10-25';
const ANNIV = '2026-11-10';
const essai = (h: Helpers, dateOp: string) =>
  h.M.coutCarteGrise({ demarche: 'titulaire', region: 'bretagne', origine: 'france_occasion', energie: 'essence', genre: 'vp', cv: 7, date1re: B, dateOp, gkm: 0, masseKg: 0, ptacKg: 0 });
const moto = (h: Helpers, vieux: boolean) => y1(h, 'occitanie', 4, vieux, 'moto');

export default defineGuide({
  id: 'dix-ans',
  group: 'guides',
  order: 30,
  mini: 'dixAns',
  miniHref: 'home',
  related: ['tarif-cheval-fiscal', 'occasion-titulaire', 'collection', 'moto-scooter', 'import-europe', 'comparer-regions'],
  sources: ['cibs', 'prixcv', 'idfm', 'l421_7_2', 'r322_5', 'f19211'],
  fr: {
    slug: 'acheter-avant-ou-apres-10-ans',
    nav: 'La règle des 10 ans',
    card: 'Passé 10 ans, la part régionale baisse de moitié : économie par région et par puissance, et le bon jour pour acheter.',
    title: 'Carte grise à 10 ans : la taxe régionale divisée par deux',
    description: 'Carte grise d’un véhicule de 10 ans ou plus : taxe régionale à moitié, économie par région et par CV, motos, majoration IDFM, collection, imports d’avant 2015.',
    h1: 'Carte grise d’un véhicule de dix ans : la moitié du tarif',
    intro: 'Choisissez la région et la puissance : le calcul compare la même voiture à neuf ans et onze mois, puis à dix ans.',
    resume: (h) => {
      const idf = parTarif(h)[0];
      return `La taxe régionale de la carte grise, la ligne Y1, est réduite de moitié dès que la première immatriculation du véhicule remonte à ${h.num(ans(h))} ans ou plus. La date qui compte est celle de la case B du certificat, y compris quand cette première immatriculation a eu lieu à l’étranger. La réduction porte aussi sur la majoration d’Île-de-France Mobilités : une voiture francilienne de ${h.num(ans(h))} ans paie ${h.eur2(idf.total / 2)} par cheval au lieu de ${h.eur2(idf.total)}. Pour une voiture de 7 CV, l’économie va de ${h.eur2(y1(h, 'mayotte', 7, false) - y1(h, 'mayotte', 7, true))} à Mayotte à ${h.eur2(y1(h, 'ile-de-france', 7, false) - y1(h, 'ile-de-france', 7, true))} en Île-de-France. Les motos paient déjà la moitié à tout âge et ne gagnent rien de plus, et aucune réduction propre aux véhicules de collection ne vient s’ajouter. Les lignes Y4 et Y5 restent identiques. Si le dixième anniversaire tombe dans le mois qui suit l’achat, déposer la demande le jour anniversaire ou juste après fait profiter du demi-tarif sans dépasser le délai légal.`;
    },
    faqs: (h) => [
      { q: 'La moitié de taxe à dix ans se compte-t-elle depuis la case B ou depuis l’achat ?', a: `Depuis la case B, la date de première immatriculation du véhicule, et jamais depuis la date de la vente ni depuis celle du titre précédent. Une voiture mise en circulation le 10 novembre 2016 atteint ses ${h.num(ans(h))} ans le 10 novembre 2026, quel que soit le nombre de propriétaires qu’elle a connus entre-temps.` },
      { q: 'Une voiture importée de dix ans profite-t-elle aussi de la moitié de la taxe régionale ?', a: `Oui. La loi vise la première immatriculation du véhicule, où qu’elle ait eu lieu : une voiture immatriculée pour la première fois en Allemagne il y a ${h.num(ans(h))} ans paie la moitié dès son arrivée. Si cette immatriculation date d’avant le ${h.date(h.P.decote_import.zero_avant)}, le malus est en plus nul, et il ne reste à payer que la demi-taxe régionale et les ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} de Y4 et Y5.` },
      { q: 'Ma moto a dix ans : sa taxe régionale baisse-t-elle encore ?', a: `Non. Une moto des catégories L3e et L4e, avec ou sans side-car, paie déjà la moitié du tarif, quel que soit son âge, et les deux réductions ne se cumulent pas. Une moto de 4 CV en Occitanie paie ${h.eur2(moto(h, false))} avant comme après ses ${h.num(ans(h))} ans. Les cyclomoteurs, eux, ne paient aucune taxe régionale.` },
      { q: 'La majoration d’Île-de-France Mobilités est-elle aussi divisée par deux à dix ans ?', a: `Oui. La loi applique à la majoration francilienne toutes les réductions de la taxe régionale. Au ${h.date(jour(h))}, elle passe donc de ${h.eur2(h.M.majorationIdfm(jour(h)))} à ${h.eur2(h.M.majorationIdfm(jour(h)) / 2)} par cheval pour un véhicule de ${h.num(ans(h))} ans ou plus. À partir de 2027, le montant par défaut de ${h.eur2(h.P.idfm.periodes[1].cv)} sera réduit de la même façon.` },
      { q: 'Faut-il attendre le jour anniversaire exact pour avoir la taxe à moitié prix ?', a: 'Le texte demande que la première immatriculation soit antérieure de dix années ou plus. Le simulateur compte l’âge en années révolues : le jour anniversaire, le véhicule est compté à dix ans. Pour éviter tout débat sur la date retenue par le service, déposez la demande le lendemain ou les jours suivants, tant que le délai légal après l’achat n’est pas dépassé.' },
      { q: 'Une voiture de collection paie-t-elle moins que la moitié du tarif régional ?', a: `Non. Le code des impositions ne prévoit aucune réduction de taxe régionale propre aux véhicules de collection : seule joue la moitié à ${h.num(ans(h))} ans, que tout véhicule de collection atteint de fait. La collection exonère en revanche de la taxe sur les véhicules de transport. Le passage en carte grise de collection d’un véhicule que l’on possède déjà se limite aux lignes Y4 et Y5, sans taxe régionale.` },
      { q: 'La réduction des dix ans vaut-elle pour un utilitaire ou un camping-car ?', a: `Oui. Les camionnettes et les camping-cars de moins de 3,5 t paient le plein tarif avant ${h.num(ans(h))} ans et la moitié ensuite, comme une voiture. Pour un utilitaire, la taxe sur les véhicules de transport, de ${h.eur(h.P.y2.bareme[0].montant)} pour le premier palier, reste due en entier : elle ne dépend pas de l’âge. Les camions et autocars lourds paient déjà la moitié à tout âge.` },
    ],
    body: (h) => {
      const d = jour(h);
      const avant = essai(h, ACHAT), apres = essai(h, ANNIV);
      const delai = h.P.national.delai_titulaire_mois;
      return `
<h2>La règle et la date qui la déclenche</h2>
<p>L’article L421-45 du ${h.src('cibs', 'code des impositions sur les biens et services')} réduit de moitié le tarif régional lorsque la première immatriculation du véhicule est antérieure de ${h.num(ans(h))} années ou plus. Trois points en découlent :</p>
<ul>
<li>la date de référence est la case B du certificat, la première mise en circulation, et non la date d’achat ni la date du titre précédent (case I) ;</li>
<li>une immatriculation à l’étranger compte : un véhicule importé arrive avec son âge réel ;</li>
<li>la réduction ne touche que la ligne Y1, taxe régionale et majoration francilienne comprises. La taxe fixe de ${h.eur2(h.P.national.taxe_fixe)} et l’envoi du titre à ${h.eur2(h.P.national.redevance)} restent les mêmes.</li>
</ul>
<p>La règle joue à chaque changement de propriétaire : une voiture de quinze ans revendue trois fois paie trois fois la moitié du tarif en vigueur au jour de chaque demande.</p>

<h2>L’économie dans chaque région</h2>
<p>Le tableau classe les régions par tarif, majoration comprise, au ${h.date(d)}. Il donne la taxe régionale d’une voiture de 5 CV juste avant et juste après ses ${h.num(ans(h))} ans, puis l’économie pour 5 CV et pour 8 CV.</p>
${h.table(['Région', '€ par CV', '5 CV, moins de ' + h.num(ans(h)) + ' ans', '5 CV, ' + h.num(ans(h)) + ' ans ou plus', 'Économie 5 CV', 'Économie 8 CV'], lignesRegions(h, 'fr'), `Taxe régionale (Y1) au ${h.date(d)}, d’après les tarifs du simulateur officiel de l’État.`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>L’écart entre régions se réduit lui aussi de moitié : de la région la plus coûteuse à la moins coûteuse, une voiture de ${h.num(ans(h))} ans de 8 CV ne fait plus varier la facture que de ${h.eur2(y1(h, 'ile-de-france', 8, true) - y1(h, 'mayotte', 8, true))}. Le ${h.a('tarif-cheval-fiscal', 'tableau des tarifs régionaux')} donne les dates d’effet, et le ${h.a('comparer-regions', 'comparateur')} calcule le total complet région par région.</p>

<h2>L’économie selon la puissance</h2>
<p>L’économie est proportionnelle au nombre de chevaux. Le second tableau la donne pour quatre tarifs typiques : l’Île-de-France, la plus chère avec la majoration, Provence-Alpes-Côte d’Azur au plafond légal de ${h.eur2(h.P.regional.plafond_cv)}, Auvergne-Rhône-Alpes parmi les moins chères de métropole, et Mayotte, la moins chère de France.</p>
${h.table(['Puissance', 'Île-de-France', 'Provence-Alpes-Côte d’Azur', 'Auvergne-Rhône-Alpes', 'Mayotte'], lignesCv(h), `Montant économisé sur la ligne Y1 en passant le cap des ${h.num(ans(h))} ans.`, ['l', 'r', 'r', 'r', 'r'])}

<h2>Les véhicules qui ne gagnent rien de plus</h2>
<h3>Motos L3e et L4e</h3>
<p>Les motos paient la moitié du tarif dès la sortie d’usine. Le cap des ${h.num(ans(h))} ans ne change rien : une moto de 4 CV en Occitanie paie ${h.eur2(moto(h, false))} à cinq ans et ${h.eur2(moto(h, true))} à vingt ans. La page ${h.a('moto-scooter', 'moto et scooter')} détaille le calcul de la puissance à partir de la cylindrée. Les cyclomoteurs ont un tarif nul, et les quads et tricycles des catégories L5e à L7e suivent la règle des voitures : plein tarif, puis moitié à ${h.num(ans(h))} ans.</p>
<h3>Poids lourds et autocars</h3>
<p>Les camions de plus de 3,5 t, les tracteurs routiers et les autocars ont aussi une réduction de moitié permanente : l’âge ne la double pas.</p>
<h3>Véhicules de collection</h3>
<p>Aucune réduction propre à la collection n’existe pour la taxe régionale : un véhicule de collection paie la moitié du tarif comme toute voiture de plus de ${h.num(ans(h))} ans. Il est en revanche exonéré de la taxe sur les véhicules de transport, ce qui compte pour un ancien utilitaire. Faire passer en collection un véhicule qu’on possède déjà ne déclenche pas de taxe régionale : on paie ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)}, taxe fixe et redevance. Voir la page ${h.a('collection', 'véhicule de collection')}.</p>

<h2>Acheter juste avant ou juste après l’anniversaire</h2>
<p>Après l’achat d’une occasion, la carte grise doit être demandée dans un délai de ${h.num(delai)} mois (${h.src('r322_5', 'article R322-5 du code de la route')}), sous peine d’une amende forfaitaire de ${h.eur(h.P.national.amende_titulaire)}. Ce délai laisse souvent la place d’attendre la date anniversaire. Exemple : une voiture de 7 CV, case B au ${h.date(B)}, achetée le ${h.date(ACHAT)} en Bretagne.</p>
<ul>
<li>Demande déposée le jour de l’achat : ${h.eur2(avant.total)}, dont ${h.eur2(avant.y1.y1)} de taxe régionale.</li>
<li>Demande déposée le ${h.date(ANNIV)}, toujours dans le délai : ${h.eur2(apres.total)}, dont ${h.eur2(apres.y1.y1)}.</li>
</ul>
<p>L’attente rapporte ${h.eur2(avant.total - apres.total)}. Le simulateur compte l’âge en années révolues : le jour anniversaire, le véhicule a ${h.num(ans(h))} ans. Le texte parle d’une immatriculation « antérieure de dix années ou plus » ; pour ne laisser aucune place au doute, déposez la demande un ou deux jours après l’anniversaire. Si l’anniversaire tombe après la fin du délai, la demande se fait quand même dans le délai, au plein tarif : l’amende dépasse l’économie pour les petites puissances, et le retard expose aussi à une immobilisation du véhicule.</p>
<p>Le vendeur peut aussi en tenir compte : une voiture qui a ses ${h.num(ans(h))} ans coûte moins cher à immatriculer à l’acheteur, et c’est un argument de prix. Le changement de titulaire lui-même est expliqué sur la page ${h.a('occasion-titulaire', 'voiture d’occasion')} ; la démarche se fait sans frais sur le site de l’ANTS, et seules les taxes sont dues.</p>

<h2>Le cas des véhicules importés</h2>
<p>Pour une voiture achetée à l’étranger, l’âge compte deux fois. La taxe régionale est réduite de moitié si la première immatriculation, étrangère, remonte à ${h.num(ans(h))} ans ou plus. Le malus, dû à la première immatriculation en France, suit une autre logique : un coefficient de décote selon l’âge en mois, fixé par l’${h.src('l421_7_2', 'article L421-7-2')}, et un malus nul pour toute voiture immatriculée avant le ${h.date(h.P.decote_import.zero_avant)}. Une voiture importée en ${an(h)} qui vient d’avoir ${h.num(ans(h))} ans date de ${an(h) - ans(h)} : immatriculée entre le ${h.date(h.P.decote_import.zero_avant)} et le ${h.date(h.P.malus_co2.premiere_annee_wltp)}, elle relève pour le malus de l’ancien barème NEDC, que ce site ne calcule pas. Plus âgée, avec une première immatriculation antérieure au ${h.date(h.P.decote_import.zero_avant)}, elle ne paie que la moitié de la taxe régionale, la taxe fixe et la redevance. La page ${h.a('import-europe', 'véhicule importé d’Europe')} détaille le quitus fiscal et les pièces à fournir.</p>
`;
    },
  },
  en: {
    slug: 'ten-year-rule',
    nav: 'The ten-year rule',
    card: 'At 10 years the regional tax is halved: savings by region and by horsepower, and the best day to buy.',
    title: 'Ten-year rule: French registration tax halved at 10 years',
    description: 'Carte grise for a vehicle aged 10 or more: regional tax halved, savings by region and CV, motorbikes, Paris surcharge, classic cars and pre-2015 imports.',
    h1: 'The ten-year rule: half the regional tax on older vehicles',
    intro: 'Pick a region and a horsepower figure: the calculation compares the same car at nine years and eleven months, then at ten years.',
    resume: (h) => {
      const idf = parTarif(h)[0];
      return `In France, the regional tax on a registration certificate, line Y1 of the carte grise, is cut by half once the vehicle’s first registration is ${h.num(ans(h))} years old or more. The date that counts is the one in box B of the certificate, even when that first registration took place in another country. The cut also applies to the Île-de-France Mobilités surcharge, so a Paris-region car aged ${h.num(ans(h))} pays ${h.eur2(idf.total / 2)} per horsepower instead of ${h.eur2(idf.total)}. On a 7 CV car the saving ranges from ${h.eur2(y1(h, 'mayotte', 7, false) - y1(h, 'mayotte', 7, true))} in Mayotte to ${h.eur2(y1(h, 'ile-de-france', 7, false) - y1(h, 'ile-de-france', 7, true))} in Île-de-France. Motorbikes already pay half at any age and gain nothing more, and classic cars get no extra reduction of their own. Lines Y4 and Y5 do not move. If the tenth anniversary falls within the month after you buy, applying on or just after that date secures the half rate without missing the legal deadline.`;
    },
    faqs: (h) => [
      { q: 'Is the ten-year mark counted from box B or from the date I buy the car?', a: `From box B, the vehicle’s date of first registration, never from the sale date or the date of the previous certificate. A car first registered on 10 November 2016 turns ${h.num(ans(h))} on 10 November 2026, however many owners it has had in between, and the half rate applies to every later change of keeper.` },
      { q: 'Does a ten-year-old car imported into France also get the half rate?', a: `Yes. The law looks at the vehicle’s first registration wherever it happened, so a car first registered in Germany ${h.num(ans(h))} years ago pays half from the day it arrives. If that registration predates ${h.date(h.P.decote_import.zero_avant)}, there is no malus either, leaving only the halved regional tax plus the ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} of lines Y4 and Y5.` },
      { q: 'My motorbike is now ten years old: does its regional tax drop again?', a: `No. A motorbike in category L3e or L4e, with or without a sidecar, already pays half the rate at any age, and the two reductions do not stack. A 4 CV motorbike in Occitanie pays ${h.eur2(moto(h, false))} before and after it turns ${h.num(ans(h))}. Mopeds pay no regional tax at all.` },
      { q: 'Is the Paris-region transport surcharge halved too on a ten-year-old car?', a: `Yes. The law applies every regional tax reduction to the Île-de-France Mobilités surcharge as well. On ${h.date(jour(h))} it therefore drops from ${h.eur2(h.M.majorationIdfm(jour(h)))} to ${h.eur2(h.M.majorationIdfm(jour(h)) / 2)} per horsepower for a vehicle aged ${h.num(ans(h))} or more. From 2027, the default amount of ${h.eur2(h.P.idfm.periodes[1].cv)} will be halved in the same way.` },
      { q: 'Should I apply on the exact anniversary to get the half rate?', a: 'The law requires the first registration to be ten years old or more. The calculator counts age in completed years, so on the anniversary itself the car counts as ten. To leave no room for argument about the date the office uses, apply a day or two later, as long as you stay within the legal deadline after the purchase.' },
      { q: 'Do classic cars in France pay less than half the regional rate?', a: `No. French tax law has no regional tax reduction specific to classic cars, known as véhicules de collection: only the half rate at ${h.num(ans(h))} years applies, which every classic reaches anyway. Classic status does exempt the vehicle from the transport vehicle tax. Switching a car you already own to a classic certificate only costs lines Y4 and Y5, with no regional tax.` },
      { q: 'Does the ten-year rule cover vans and motorhomes?', a: `Yes. Vans and motorhomes under 3.5 tonnes pay the full rate before ${h.num(ans(h))} years and half afterwards, like a car. On a van, the transport vehicle tax, ${h.eur(h.P.y2.bareme[0].montant)} in the first band, stays due in full because it does not depend on age. Heavy lorries and coaches already pay half whatever their age.` },
    ],
    body: (h) => {
      const d = jour(h);
      const avant = essai(h, ACHAT), apres = essai(h, ANNIV);
      const delai = h.P.national.delai_titulaire_mois;
      return `
<h2>The rule and the date that triggers it</h2>
<p>Article L421-45 of the ${h.src('cibs', 'French code of taxes on goods and services')} halves the regional rate when the vehicle’s first registration is ${h.num(ans(h))} years old or more. Three consequences follow:</p>
<ul>
<li>the reference date is box B on the certificate, the first time the vehicle was registered, not the purchase date nor the date of the previous certificate (box I);</li>
<li>a registration abroad counts, so an imported vehicle arrives with its real age;</li>
<li>only line Y1 is reduced, regional tax and Paris-region surcharge alike. The fixed tax of ${h.eur2(h.P.national.taxe_fixe)} and the ${h.eur2(h.P.national.redevance)} postage fee do not change.</li>
</ul>
<p>The rule applies at every change of owner: a fifteen-year-old car sold three times pays half of the rate in force on each application date, three times over.</p>

<h2>The saving in each region</h2>
<p>The table ranks regions by rate, surcharge included, on ${h.date(d)}. It shows the regional tax on a 5 CV car just before and just after it turns ${h.num(ans(h))}, then the saving for 5 CV and for 8 CV.</p>
${h.table(['Region', '€ per CV', '5 CV, under ' + h.num(ans(h)) + ' years', '5 CV, ' + h.num(ans(h)) + ' years or more', 'Saving, 5 CV', 'Saving, 8 CV'], lignesRegions(h, 'en'), `Regional tax (Y1) on ${h.date(d)}, from the rates in the State’s official simulator.`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>The gap between regions is halved as well: between the dearest and the cheapest region, a ${h.num(ans(h))}-year-old 8 CV car only changes the bill by ${h.eur2(y1(h, 'ile-de-france', 8, true) - y1(h, 'mayotte', 8, true))}. The ${h.a('tarif-cheval-fiscal', 'regional rate table')} gives start dates, and the ${h.a('comparer-regions', 'region comparison')} works out the full total for each region.</p>

<h2>The saving by horsepower</h2>
<p>The saving grows in step with the horsepower. The second table shows it for four typical rates: Île-de-France, the dearest once the surcharge is added; Provence-Alpes-Côte d’Azur, at the legal cap of ${h.eur2(h.P.regional.plafond_cv)}; Auvergne-Rhône-Alpes, among the cheapest in mainland France; and Mayotte, the cheapest of all.</p>
${h.table(['Horsepower', 'Île-de-France', 'Provence-Alpes-Côte d’Azur', 'Auvergne-Rhône-Alpes', 'Mayotte'], lignesCv(h), `Amount saved on line Y1 once the vehicle passes ${h.num(ans(h))} years.`, ['l', 'r', 'r', 'r', 'r'])}

<h2>Vehicles that gain nothing more</h2>
<h3>Motorbikes, L3e and L4e</h3>
<p>Motorbikes pay half the rate from new, so the ${h.num(ans(h))}-year mark changes nothing: a 4 CV motorbike in Occitanie pays ${h.eur2(moto(h, false))} at five years old and ${h.eur2(moto(h, true))} at twenty. The ${h.a('moto-scooter', 'motorbike and scooter')} page explains how engine size sets the horsepower. Mopeds have a zero rate, while quads and tricycles in categories L5e to L7e follow the car rule: full rate, then half at ${h.num(ans(h))} years.</p>
<h3>Lorries and coaches</h3>
<p>Lorries over 3.5 tonnes, road tractors and coaches also have a permanent half rate, which age does not double.</p>
<h3>Classic cars</h3>
<p>There is no regional tax reduction specific to classic status: a classic pays half the rate like any car over ${h.num(ans(h))} years. It is, however, exempt from the transport vehicle tax, which matters for an old van. Switching a vehicle you already own to a classic certificate triggers no regional tax: you pay ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)}, fixed tax plus postage. See the ${h.a('collection', 'classic car')} page.</p>

<h2>Buying just before or just after the anniversary</h2>
<p>After buying a used car in France you have ${h.num(delai)} month to apply for the new certificate (${h.src('r322_5', 'article R322-5 of the Highway Code')}), or face a fixed fine of ${h.eur(h.P.national.amende_titulaire)}. That window often leaves room to wait for the anniversary. Example: a 7 CV car, box B dated ${h.date(B)}, bought on ${h.date(ACHAT)} in Brittany.</p>
<ul>
<li>Applying on the day of purchase: ${h.eur2(avant.total)}, of which ${h.eur2(avant.y1.y1)} is regional tax.</li>
<li>Applying on ${h.date(ANNIV)}, still within the deadline: ${h.eur2(apres.total)}, of which ${h.eur2(apres.y1.y1)}.</li>
</ul>
<p>Waiting saves ${h.eur2(avant.total - apres.total)}. The calculator counts age in completed years, so on the anniversary the car is ${h.num(ans(h))}. The law speaks of a first registration “ten years or more” earlier; to rule out any doubt, apply a day or two after the anniversary. If the anniversary falls after the deadline, apply on time at the full rate: the fine exceeds the saving on low-powered cars, and a late application can also lead to the vehicle being immobilised.</p>
<p>Sellers can use this too: a car that has reached ${h.num(ans(h))} years is cheaper for the buyer to register, which supports the asking price. The change of keeper itself is covered on the ${h.a('occasion-titulaire', 'used-car transfer')} page; you apply free of charge on the ANTS website, the official registration portal, and only the taxes are due.</p>

<h2>Imported vehicles</h2>
<p>For a car bought abroad, age matters twice. The regional tax is halved if the first registration, in the other country, is ${h.num(ans(h))} years old or more. The malus, due at the first French registration, works differently: a depreciation rate based on age in months, set by ${h.src('l421_7_2', 'article L421-7-2')}, and no malus at all for any car first registered before ${h.date(h.P.decote_import.zero_avant)}. A car imported in ${an(h)} that has just turned ${h.num(ans(h))} dates from ${an(h) - ans(h)}: first registered between ${h.date(h.P.decote_import.zero_avant)} and ${h.date(h.P.malus_co2.premiere_annee_wltp)}, its malus falls under the old NEDC scale, which this site does not compute. An older car, first registered before ${h.date(h.P.decote_import.zero_avant)}, only pays half the regional tax, the fixed tax and the delivery fee. The ${h.a('import-europe', 'import from the EU')} page covers the tax clearance certificate (quitus fiscal) and the documents required.</p>
`;
    },
  },
});
