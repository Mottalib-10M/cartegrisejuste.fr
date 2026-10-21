/** Accueil (page pilier) : texte des deux langues. Tous les chiffres viennent de h.P et du moteur h.M. */
import type { Helpers, FAQ } from '../lib/guide-types';
import type { SourceKey } from '../lib/engine/params';
import type { CoutInput } from '../lib/engine/carte-grise';
export interface HomeText { title: string; description: string; h1: string; intro: string; resume: (h: Helpers) => string; faqs: (h: Helpers) => FAQ[]; body: (h: Helpers) => string; sources: SourceKey[] }

/** Jour des exemples : date du relevé des tarifs. */
const jour = (h: Helpers) => h.P.regional.date_releve;
const reg = (h: Helpers, id: string) => h.P.regions.find((r) => r.id === id)!;
const nom = (h: Helpers, id: string) => reg(h, id).nom[h.lang];

/** Coût complet avec des valeurs par défaut : voiture essence d'occasion déjà immatriculée en France. */
const cout = (h: Helpers, o: Partial<CoutInput>) =>
  h.M.coutCarteGrise({ demarche: 'titulaire', region: 'grand-est', origine: 'france_occasion', energie: 'essence', genre: 'vp', cv: 5, date1re: '2022-06-01', dateOp: jour(h), gkm: 0, masseKg: 0, ptacKg: 0, ...o });

/** Tarif par cheval (majoration IDFM comprise) de chaque région au jour du relevé, du moins cher au plus cher. */
const tarifs = (h: Helpers) => {
  const d = jour(h);
  return h.P.regions
    .map((r) => ({ r, total: h.M.tarifRegion(r.id, d).cv + (r.idfm ? h.M.majorationIdfm(d) : 0) }))
    .sort((a, b) => a.total - b.total);
};

/** Tous les cas chiffrés de la page. */
const cas = (h: Helpers) => {
  const d = jour(h);
  const occ = (region: string) => cout(h, { region });
  const neuve = cout(h, { demarche: 'immat', origine: 'france_neuf', region: 'grand-est', cv: 6, gkm: 130, masseKg: 1450, date1re: d });
  const lourde = cout(h, { demarche: 'immat', origine: 'france_neuf', region: 'nouvelle-aquitaine', cv: 8, gkm: 150, masseKg: 1650, date1re: d });
  const evHdf = cout(h, { demarche: 'immat', origine: 'france_neuf', region: 'hauts-de-france', energie: 'electrique', cv: 4, gkm: 0, masseKg: 1800, date1re: d });
  const evPdl = cout(h, { demarche: 'immat', origine: 'france_neuf', region: 'pays-de-la-loire', energie: 'electrique', cv: 4, gkm: 0, masseKg: 1800, date1re: d });
  const vieuxIdf = cout(h, { region: 'ile-de-france', date1re: '2014-03-01' });
  const moto = cout(h, { region: 'occitanie', genre: 'moto', cv: 4 });
  const dup = cout(h, { demarche: 'duplicata', region: 'bretagne' });
  const conj = cout(h, { demarche: 'conjoint', region: 'bretagne' });
  const adr1 = cout(h, { demarche: 'adresse', region: 'bretagne', rangAdresse: 1 });
  const adr4 = cout(h, { demarche: 'adresse', region: 'bretagne', rangAdresse: h.P.national.adresse_gratuits + 1 });
  const idf2027 = h.M.taxeRegionale({ cv: 5, region: 'ile-de-france', date1re: '2022-06-01', dateOp: '2027-02-01', energie: 'essence', demarche: 'titulaire' });
  return {
    idf: occ('ile-de-france'), bre: occ('bretagne'), occ: occ('occitanie'), ara: occ('auvergne-rhone-alpes'),
    neuve, lourde, evHdf, evPdl, vieuxIdf, moto, dup, conj, adr1, adr4, idf2027,
    co2_130_2027: h.M.malusCO2Brut(130, '2027'),
  };
};

const sources: SourceKey[] = ['cibs', 'f19211', 'prixcv', 'idfm', 'l421_62', 'f35950', 'ants'];

// ---------------------------------------------------------------------------------------------
// Français
// ---------------------------------------------------------------------------------------------
const fr: HomeText = {
  title: 'Coût de la carte grise 2026 : calcul exact, ligne par ligne',
  description: 'Coût de la carte grise 2026 : taxe régionale des 18 régions, majoration francilienne, malus CO₂ et au poids, taxe fixe et redevance, le détail de chaque ligne.',
  h1: 'Coût de la carte grise en 2026, calculé ligne par ligne',
  intro: 'Choisissez la démarche, la région et le véhicule : le montant s’affiche aussitôt, avec chaque taxe détaillée et la règle qui la fixe.',
  resume: (h) => {
    const t = tarifs(h);
    const c = cas(h);
    const m26 = h.P.malus_co2.annees['2026'];
    return `Le coût d’une carte grise est la somme de cinq lignes fixées par la loi. La taxe régionale, Y1, est le produit de deux nombres, le tarif d’un cheval fiscal dans votre région de résidence et la puissance inscrite en case P.6 : au ${h.date(jour(h))}, ce tarif va de ${h.eur2(t[0].total)} (${t[0].r.nom.fr}) à ${h.eur2(t[t.length - 1].total)} (${t[t.length - 1].r.nom.fr}), majoration d’Île-de-France Mobilités comprise, et il est divisé par deux quand la première immatriculation remonte à ${h.num(h.P.regional.age_reduction_ans)} ans ou plus. S’ajoutent la taxe sur les véhicules de transport pour les utilitaires, le malus CO₂ dès ${h.num(m26.seuil)} g/km et le malus au poids dès ${h.num(h.P.malus_masse.annees['2026'].tranches[0].min)} kg pour une voiture neuve ou importée, puis ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} commun à presque tous les titres : ${h.eur2(h.P.national.taxe_fixe)} de taxe fixe, plus ${h.eur2(h.P.national.redevance)} pour l’envoi du certificat. Une occasion de 5 CV âgée de moins de ${h.num(h.P.regional.age_reduction_ans)} ans coûte ainsi ${h.eur2(c.ara.total)} en ${nom(h, 'auvergne-rhone-alpes')} et ${h.eur2(c.idf.total)} en ${nom(h, 'ile-de-france')}. La démarche est gratuite sur le site de l’ANTS : vous ne payez que les taxes.`;
  },
  faqs: (h) => {
    const N = h.P.national;
    const c = cas(h);
    return [
      { q: 'Qui paie la carte grise lors d’une vente entre particuliers ?', a: `Les taxes sont dues par la personne au nom de laquelle le nouveau certificat est établi, donc l’acheteur. Le vendeur ne verse rien : il déclare la cession et remet l’ancien titre barré. Rien n’empêche les deux parties de convenir d’une baisse du prix pour compenser la carte grise, mais le paiement aux impôts reste fait par le nouveau titulaire, au moment de sa demande.` },
      { q: 'À quel moment règle-t-on le montant de la carte grise ?', a: `Au moment de la demande en ligne, par carte bancaire, avant que le certificat soit fabriqué. Le tarif retenu pour la taxe régionale est celui en vigueur ce jour-là dans la région du domicile, pas celui du jour de l’achat. Le titre définitif arrive ensuite par courrier, ce que couvre la redevance d’acheminement de ${h.eur2(N.redevance)} incluse dans le total.` },
      { q: 'Le prix d’achat du véhicule change-t-il le coût de la carte grise ?', a: `Non. Aucune ligne ne dépend du prix payé au vendeur. La taxe régionale suit la puissance fiscale, la région et l’âge du véhicule ; les malus suivent les émissions de CO₂ et la masse, seulement lors de la première immatriculation en France. Une citadine chère et une voiture ancienne bon marché de même puissance paient donc la même taxe régionale à âge égal.` },
      { q: 'Quelles erreurs font payer une carte grise plus cher que prévu ?', a: `Les plus fréquentes : saisir une puissance fiscale estimée au lieu de celle de la case P.6, oublier que la réduction de moitié se compte à partir de la date de la case B et non de l’année du modèle, déclarer une ancienne adresse dans une autre région, ou confondre les taxes avec des frais de service facturés par un intermédiaire. Le calculateur affiche chaque ligne pour repérer l’écart.` },
      { q: 'Pourquoi deux estimations de carte grise peuvent-elles différer ?', a: `Le plus souvent à cause de la date retenue : un outil qui n’a pas intégré le tarif voté récemment par une région, ou la majoration d’Île-de-France Mobilités, donne un montant ancien. Les autres causes sont l’arrondi, appliqué à l’euro sur Y1 à Y4 avant d’ajouter la redevance, et un âge mal compté. Les montants de ce site suivent les valeurs du simulateur officiel relevées le ${h.date(jour(h))}.` },
      { q: 'Quel est le plus petit montant possible pour un certificat d’immatriculation ?', a: `Rien du tout pour les ${h.num(N.adresse_gratuits)} premiers changements d’adresse, qui donnent une étiquette à coller sur le titre. Au-delà, un nouveau certificat coûte ${h.eur2(c.adr4.total)}, la seule redevance d’acheminement. Un duplicata ou l’ajout d’un conjoint coûte ${h.eur2(c.dup.total)}, sans taxe régionale. Pour un cyclomoteur acheté d’occasion, la taxe régionale est nulle et l’on paie ce même montant.` },
      { q: 'Combien de temps a-t-on pour faire la carte grise après un achat ?', a: `Le délai est de ${h.num(N.delai_titulaire_mois)} mois à compter de la cession. Passé ce délai, le conducteur s’expose à une contravention de quatrième classe, dont l’amende forfaitaire est de ${h.eur2(N.amende_titulaire)}, et le véhicule peut être immobilisé. Le retard ne change pas le montant des taxes, mais il peut le faire monter si la région augmente son tarif entre l’achat et la demande.` },
    ];
  },
  body: (h) => {
    const d = jour(h);
    const N = h.P.national;
    const R = h.P.regional;
    const t = tarifs(h);
    const c = cas(h);
    const m26 = h.P.malus_co2.annees['2026'];
    const m27 = h.P.malus_co2.annees['2027'];
    const tr = h.P.malus_masse.annees['2026'].tranches;
    const y2 = h.P.y2.bareme;
    const hdf = reg(h, 'hauts-de-france');
    const nb60 = t.filter((x) => x.total === R.plafond_cv).length;
    const ligne = (label: string, x: ReturnType<typeof cout>) => [label, h.eur2(x.y1.y1), h.eur2(x.y2), h.eur2(x.malus.total), h.eur2(x.y4 + x.y5), h.eur2(x.total)];
    const achats = [
      ligne(`Occasion 5 CV de 2022, ${nom(h, 'ile-de-france')}`, c.idf),
      ligne(`Occasion 5 CV de 2022, ${nom(h, 'bretagne')}`, c.bre),
      ligne(`Occasion 5 CV de 2022, ${nom(h, 'occitanie')}`, c.occ),
      ligne(`Occasion 5 CV de 2022, ${nom(h, 'auvergne-rhone-alpes')}`, c.ara),
      ligne(`Occasion 5 CV de 2014, ${nom(h, 'ile-de-france')}`, c.vieuxIdf),
      ligne(`Neuve essence 6 CV, 130 g/km, 1 450 kg, ${nom(h, 'grand-est')}`, c.neuve),
      ligne(`Neuve essence 8 CV, 150 g/km, 1 650 kg, ${nom(h, 'nouvelle-aquitaine')}`, c.lourde),
      ligne(`Neuve électrique 4 CV, ${nom(h, 'hauts-de-france')}`, c.evHdf),
      ligne(`Neuve électrique 4 CV, ${nom(h, 'pays-de-la-loire')}`, c.evPdl),
      ligne(`Moto 4 CV d’occasion, ${nom(h, 'occitanie')}`, c.moto),
    ];
    const sans = [
      ['Changement d’adresse, 1er à ' + h.num(N.adresse_gratuits) + 'e', h.eur2(c.adr1.total), 'étiquette envoyée, pas de nouveau titre'],
      ['Changement d’adresse suivant', h.eur2(c.adr4.total), 'redevance seule'],
      ['Duplicata après perte ou vol', h.eur2(c.dup.total), 'taxe fixe et redevance'],
      ['Ajout ou retrait d’un conjoint', h.eur2(c.conj.total), 'taxe régionale exonérée'],
    ];
    return `
<h2>La formule complète du certificat</h2>
<p>Le montant d’une carte grise ne se négocie pas et ne dépend pas de l’endroit où on la demande : il résulte de cinq lignes, notées Y1 à Y5, que le ${h.src('cibs', 'code des impositions sur les biens et services')} définit une à une. On les retrouve imprimées au bas du certificat. Le total suit une règle d’arrondi précise : les lignes Y1 à Y4 sont additionnées puis arrondies à l’euro, et la redevance Y5 s’ajoute ensuite avec ses centimes. C’est ainsi que procède le simulateur de l’État, et c’est ce que fait le calculateur en haut de page.</p>
${h.table(['Ligne', 'Ce qu’elle taxe', 'Montant en 2026'], [
  ['Y1', 'Taxe régionale (et majoration francilienne)', `${h.eur2(t[0].total)} à ${h.eur2(t[t.length - 1].total)} par cheval fiscal`],
  ['Y2', 'Taxe sur les véhicules de transport', `${h.eur2(y2[0].montant)} à ${h.eur2(y2[y2.length - 1].montant)}, utilitaires seulement`],
  ['Y3', 'Malus CO₂ et malus au poids', `0 sous ${h.num(m26.seuil)} g/km et ${h.num(tr[0].min)} kg, jusqu’à ${h.eur(m26.plafond)}`],
  ['Y4', 'Taxe fixe', h.eur2(N.taxe_fixe)],
  ['Y5', 'Redevance d’acheminement', h.eur2(N.redevance)],
], `Les cinq lignes du certificat d’immatriculation au ${h.date(d)}.`, ['l', 'l', 'l'])}

<h3>Y1 : la taxe régionale, le gros du montant</h3>
<p>On l’obtient en multipliant le prix du cheval fiscal fixé par votre région de domicile par la puissance administrative de la case P.6. Chaque région fixe son tarif dans la limite de ${h.eur2(R.plafond_cv)} par cheval ; ${h.num(nb60)} d’entre elles sont à ce plafond au ${h.date(d)}, et le tarif le plus bas, ${h.eur2(t[0].total)}, est celui de ${t[0].r.nom.fr}. En ${nom(h, 'ile-de-france')}, une majoration au profit d’Île-de-France Mobilités de ${h.eur2(h.P.idfm.periodes[0].cv)} par cheval s’ajoute depuis le ${h.date(h.P.idfm.periodes[0].from)}, en dehors du plafond, ce que prévoit l’${h.src('idfm', 'article L421-54-1 du même code')}. Les valeurs régionales sont celles servies par le ${h.src('prixcv', 'simulateur officiel du prix du cheval fiscal')} ; le ${h.a('tarif-cheval-fiscal', 'tableau des tarifs régionaux')} donne la date d’effet de chacun, avec la mention « non vérifiée » quand la délibération n’a pas pu être lue.</p>
<p>Trois coefficients modifient ce produit. Il est réduit de ${h.pct(R.taux_reduction_age, 0)} quand la première immatriculation, même à l’étranger, date de ${h.num(R.age_reduction_ans)} ans ou plus. Il est réduit de moitié pour une moto, quel que soit son âge, sans cumul avec la règle de l’âge. Il est nul pour un cyclomoteur. La majoration francilienne suit les mêmes réductions. Enfin, aucune taxe régionale n’est due quand le propriétaire ne change pas : changement d’adresse, duplicata, ajout ou retrait d’un conjoint.</p>

<h3>Y2 : la taxe des utilitaires</h3>
<p>Elle ne concerne que les véhicules de transport de marchandises ou de personnes, selon le poids total autorisé en charge : ${h.eur2(y2[0].montant)} jusqu’à ${h.num(y2[0].ptac_max!)} kg, ${h.eur2(y2[1].montant)} jusqu’à ${h.num(y2[1].ptac_max!)} kg, ${h.eur2(y2[2].montant)} jusqu’à ${h.num(y2[2].ptac_max!)} kg et ${h.eur2(y2[3].montant)} au-delà. Une voiture particulière, un camping-car ou un véhicule de collection ne la paient pas. Le détail par catégorie se trouve sur la page ${h.a('utilitaire', 'utilitaire et camionnette')}.</p>

<h3>Y3 : les malus, seulement à la première immatriculation en France</h3>
<p>Une voiture neuve, ou importée et immatriculée pour la première fois en France, paie le malus CO₂ selon le barème de son année de première immatriculation. En 2026 il commence à ${h.eur(h.M.malusCO2Brut(m26.seuil, '2026'))} à ${h.num(m26.seuil)} g/km et atteint ${h.eur(m26.plafond)} à partir de ${h.num(m26.plafond_des)} g/km, selon l’${h.src('l421_62', 'article L421-62')}. Le malus au poids s’y ajoute à partir de ${h.num(tr[0].min)} kg : ${h.eur(tr[0].euro_kg)} par kilo dans la première tranche puis jusqu’à ${h.eur(tr[tr.length - 1].euro_kg)} par kilo au-delà de ${h.num(tr[tr.length - 1].min)} kg, comme l’explique la ${h.src('f35950', 'fiche officielle sur le malus au poids')}. Les deux ensemble ne dépassent pas ${h.eur(m26.plafond)}. Une voiture électrique ou à hydrogène est exonérée des deux. Une voiture d’occasion déjà immatriculée en France ne paie jamais de malus, même si elle en aurait payé un neuve. Les barèmes complets sont sur les pages ${h.a('malus-co2', 'malus CO₂')} et ${h.a('malus-masse', 'malus au poids')}.</p>

<h3>Y4 et Y5 : les deux lignes fixes</h3>
<p>Presque chaque nouveau titre supporte ${h.eur2(N.taxe_fixe)} de taxe fixe, sauf après un changement d’adresse, où elle n’est pas due. L’envoi du document sécurisé par courrier est facturé à part, ${h.eur2(N.redevance)}, sous le nom de redevance d’acheminement : ensemble, ces deux lignes ajoutent ${h.eur2(N.taxe_fixe + N.redevance)}. La ${h.src('f19211', 'fiche F19211 de service-public.gouv.fr')} rappelle ces deux montants, inchangés depuis plusieurs années.</p>

<h2>Exemples calculés au ${h.date(d)}</h2>
<p>Chaque ligne du tableau est produite par le même moteur que le calculateur, avec la date du relevé des tarifs comme date de demande. Les quatre premières montrent l’effet de la seule région sur une même voiture ; la cinquième, celui de l’âge ; les suivantes, celui des malus et de l’énergie.</p>
${h.table(['Véhicule', 'Y1', 'Y2', 'Malus', 'Y4 + Y5', 'Total'], achats, 'Achat ou première immatriculation : taxes dues, en euros.', ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>La première voiture neuve, immatriculée dans le ${nom(h, 'grand-est')}, reste sous le seuil du malus au poids : seul le malus CO₂ de ${h.eur(c.neuve.malus.co2)} s’ajoute à la taxe régionale. Avec ${h.num(1650)} kg et ${h.num(150)} g/km, la seconde voiture neuve paie ${h.eur(c.lourde.malus.co2)} de malus CO₂ et ${h.eur(c.lourde.malus.masse)} de malus au poids, si bien que la taxe régionale n’est plus qu’une petite part du total. Les deux électriques ont le même véhicule et la même puissance : l’écart de ${h.eur2(Math.round((c.evPdl.total - c.evHdf.total) * 100) / 100)} vient de la réduction propre aux ${nom(h, 'hauts-de-france')} et de la différence de tarif.</p>
${h.table(['Démarche', 'Total', 'Pourquoi'], sans, 'Démarches sans changement de propriétaire : aucune taxe régionale.', ['l', 'r', 'l'])}
<p>Pour votre propre cas d’occasion, le module ci-dessous suffit : région, puissance et année de première immatriculation.</p>
<!--mini:titulaire-->

<h2>Les cas où l’on paie moins</h2>
<ul>
<li><strong>Le véhicule a ${h.num(R.age_reduction_ans)} ans ou plus.</strong> La taxe régionale est réduite de moitié : la même voiture de 5 CV passe de ${h.eur2(c.idf.y1.y1)} à ${h.eur2(c.vieuxIdf.y1.y1)} de taxe régionale en ${nom(h, 'ile-de-france')}. L’âge se compte au jour près depuis la date de la case B ; le guide ${h.a('dix-ans', 'acheter avant ou après dix ans')} montre combien attendre quelques semaines peut rapporter.</li>
<li><strong>C’est une moto ou un scooter.</strong> Le demi-tarif s’applique dès la mise en circulation, et la puissance se déduit de la cylindrée. Voir la page ${h.a('moto-scooter', 'moto et scooter')}.</li>
<li><strong>Le changement vient d’un mariage, d’un Pacs, d’un divorce ou d’un décès du conjoint.</strong> Ajouter ou retirer un conjoint ne déclenche pas de taxe régionale ; on paie ${h.eur2(c.conj.total)}. Un héritage reçu par un enfant ou une donation, en revanche, est taxé comme un achat : la page ${h.a('heritage-donation', 'héritage et donation')} fait le calcul.</li>
<li><strong>Vous déménagez.</strong> Les ${h.num(N.adresse_gratuits)} premiers changements d’adresse sont gratuits ; les suivants coûtent la redevance seule. Détails sur la page ${h.a('adresse-duplicata', 'adresse et duplicata')}.</li>
<li><strong>La voiture est électrique et vous habitez les ${hdf.nom.fr}.</strong> La région retire ${h.pct(hdf.propres[1].exo, 0)} de sa taxe depuis le ${h.date(hdf.propres[1].from)}. Partout ailleurs, une électrique paie le tarif plein ; elle échappe seulement aux malus. Voir ${h.a('electrique-hybride', 'voiture électrique ou hybride')}.</li>
<li><strong>Famille d’au moins ${h.num(h.P.malus_co2.famille.enfants_min)} enfants, ou titulaire d’une carte d’invalidité.</strong> Les malus sont réduits de ${h.num(h.P.malus_co2.famille.g_par_enfant)} g/km et ${h.num(h.P.malus_masse.famille.kg_par_enfant)} kg par enfant, par remboursement après coup, ou supprimés pour le titulaire de la carte mobilité inclusion invalidité. Les options du calculateur en tiennent compte.</li>
</ul>
<p>Un véhicule de collection ne bénéficie d’aucune réduction de taxe régionale qui lui soit propre : seule la règle de l’âge joue, ce que détaille la page ${h.a('collection', 'véhicule de collection')}. Pour une voiture achetée hors de France, les malus restent dus avec une décote selon l’âge : les pages ${h.a('import-europe', 'import d’Europe')} et ${h.a('import-hors-europe', 'import hors d’Europe')} donnent aussi les formalités fiscales.</p>

<h2>Ce qui change en 2027</h2>
<p>Au ${h.date(d)}, aucune région n’a voté de hausse pour 2027. Trois changements sont en revanche déjà inscrits dans la loi. La majoration d’Île-de-France Mobilités redescend à ${h.eur2(h.P.idfm.periodes[1].cv)} par cheval au ${h.date(h.P.idfm.periodes[1].from)}, sauf délibération qui peut la porter jusqu’à ${h.eur2(h.P.idfm.plafond_legal)} : à tarif régional inchangé, notre voiture de 5 CV paierait ${h.eur2(c.idf2027.y1)} de taxe régionale au lieu de ${h.eur2(c.idf.y1.y1)}. Le malus CO₂ commence dès ${h.num(m27.seuil)} g/km et plafonne à ${h.eur(m27.plafond)} : la voiture neuve à 130 g/km paierait ${h.eur(c.co2_130_2027)} au lieu de ${h.eur(c.neuve.malus.co2)}. Le barème du malus au poids ne change pas, mais les micro-hybrides perdent leur abattement. Le ${h.a('calendrier-2027', 'calendrier 2027')} indique s’il vaut mieux immatriculer avant ou après le 1er janvier.</p>

<h2>Gratuité de la démarche et frais de service</h2>
<p>La démarche est gratuite sur le site de l’ANTS : vous ne payez que les taxes. On remplit le dossier sur le ${h.src('ants', 'site de l’Agence nationale des titres sécurisés')} et l’on règle par carte en dernière étape. Un garage ou un professionnel habilité peut s’en occuper pour vous ; il facture alors sa prestation en plus, et cette somme ne revient pas à l’État. La page ${h.a('taxes-ou-frais', 'taxes ou frais de service')} sépare les deux sur une facture.</p>

<h2>Vérifier un montant déjà payé</h2>
<p>Prenez le certificat et repérez trois cases : la date de première immatriculation en B, la puissance fiscale en P.6, et les lignes Y.1 à Y.6 en bas du titre, où Y.6 est le total. Refaites ensuite Y1 : tarif de votre région le jour de la demande, multiplié par P.6, divisé par deux si le véhicule avait au moins ${h.num(R.age_reduction_ans)} ans ce jour-là. Si l’écart dépasse quelques centimes, vérifiez d’abord l’adresse déclarée, puis la date de la demande, car un tarif peut avoir changé entre l’achat et le dépôt. Le guide ${h.a('lire-carte-grise', 'lire sa carte grise')} décrit chaque case, et le ${h.a('comparer-regions', 'comparateur des régions')} montre ce que la même voiture aurait coûté ailleurs. Pour préparer un achat, le ${h.a('budget-achat', 'budget d’achat')} ajoute la carte grise aux autres frais, et le ${h.a('calcul-chevaux-fiscaux', 'calcul des chevaux fiscaux')} retrouve la puissance à partir des kilowatts quand la carte grise n’est pas encore entre vos mains.</p>
<p>Les règles appliquées, leurs articles et les points non vérifiés sont rassemblés dans la page ${h.a('method', 'méthode et sources')}. La rédaction de ce site n’a aucun lien avec l’administration ni avec un service de démarches.</p>
`;
  },
  sources,
};

// ---------------------------------------------------------------------------------------------
// English
// ---------------------------------------------------------------------------------------------
const en: HomeText = {
  title: 'Car registration cost 2026: every tax line, worked out',
  description: 'Car registration cost in France for 2026: regional tax in all 18 regions, Paris surcharge, CO₂ and weight malus, fixed tax and delivery fee, every line shown.',
  h1: 'Car registration cost in France for 2026, line by line',
  intro: 'Pick the procedure, your region and the vehicle, and the total appears at once, with each tax broken out and the rule behind it.',
  resume: (h) => {
    const t = tarifs(h);
    const c = cas(h);
    const m26 = h.P.malus_co2.annees['2026'];
    return `In France the cost of a carte grise, the vehicle registration certificate, is the sum of five lines set by law. The regional tax, Y1, is the rate per fiscal horsepower charged by the region you live in, multiplied by the administrative horsepower in box P.6 of the certificate: on ${h.date(jour(h))} that rate runs from ${h.eur2(t[0].total)} in ${t[0].r.nom.en} to ${h.eur2(t[t.length - 1].total)} in ${t[t.length - 1].r.nom.en}, Paris transport surcharge included, and it is halved once the first registration is ${h.num(h.P.regional.age_reduction_ans)} years old or more. On top come a transport tax for commercial vehicles, a CO₂ malus from ${h.num(m26.seuil)} g/km and a weight malus from ${h.num(h.P.malus_masse.annees['2026'].tranches[0].min)} kg for a new or imported car, and finally ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} that almost every certificate carries: ${h.eur2(h.P.national.taxe_fixe)} of fixed tax plus ${h.eur2(h.P.national.redevance)} to post it to you. A used 5 CV car under ${h.num(h.P.regional.age_reduction_ans)} years old therefore costs ${h.eur2(c.ara.total)} in ${nom(h, 'auvergne-rhone-alpes')} and ${h.eur2(c.idf.total)} in ${nom(h, 'ile-de-france')}. Applying on the ANTS website, the State agency for secure documents, is free: you only pay the taxes.`;
  },
  faqs: (h) => {
    const N = h.P.national;
    const c = cas(h);
    return [
      { q: 'Who pays the registration taxes when buying a car from a private seller in France?', a: `The person named on the new certificate, which means the buyer. The seller pays nothing: they declare the sale online and hand over the old certificate, crossed out and signed. Buyer and seller can agree a lower price to offset the cost, but the taxes themselves are always paid by the new keeper when they file the application.` },
      { q: 'When is the carte grise fee actually charged?', a: `When you submit the online application, by bank card, before the certificate is printed. The regional rate used is the one in force that day in the region where you live, not the rate on the day you bought the car. The final certificate is then posted to you, which is what the ${h.eur2(N.redevance)} delivery fee in the total pays for.` },
      { q: 'Does the price paid for a car affect what its French registration costs?', a: `No line of the bill looks at the purchase price. The regional tax depends on fiscal horsepower, region and age; the two maluses depend on CO₂ emissions and weight, and only apply at the first registration in France. An expensive small car and a cheap older car with the same horsepower and age pay exactly the same regional tax.` },
      { q: 'Which mistakes make people overpay for registration in France?', a: `Typing an estimated horsepower instead of the figure in box P.6, counting the age from the model year rather than from the date in box B, declaring an old address in another region, and mistaking a middleman’s service fee for tax. Because the calculator shows each line separately, it is easy to spot which of these explains a gap.` },
      { q: 'Why do two online estimates for the same vehicle sometimes disagree?', a: `Usually because of the date: a tool that has not loaded a region’s latest rate, or the Paris-region surcharge, shows an outdated figure. Rounding is another cause, since lines Y1 to Y4 are rounded to the euro before the delivery fee is added, as is an age counted to the year instead of the day. This site uses the official simulator’s values read on ${h.date(jour(h))}.` },
      { q: 'What is the cheapest registration certificate you can get in 2026?', a: `Nothing at all for the first ${h.num(N.adresse_gratuits)} changes of address, which only produce a sticker for the existing certificate. After that a new certificate costs ${h.eur2(c.adr4.total)}, the delivery fee alone. A duplicate, or adding a spouse, costs ${h.eur2(c.dup.total)} with no regional tax, and a used moped costs the same, since its regional rate is zero.` },
      { q: 'How long does a new owner have to register a car bought in France?', a: `${h.num(N.delai_titulaire_mois)} month from the date of sale. After that the driver risks a fourth-class fine, set at ${h.eur2(N.amende_titulaire)} for the fixed penalty, and the car can be taken off the road. Waiting does not raise the taxes by itself, but it can if the region raises its rate between the purchase and the application.` },
    ];
  },
  body: (h) => {
    const d = jour(h);
    const N = h.P.national;
    const R = h.P.regional;
    const t = tarifs(h);
    const c = cas(h);
    const m26 = h.P.malus_co2.annees['2026'];
    const m27 = h.P.malus_co2.annees['2027'];
    const tr = h.P.malus_masse.annees['2026'].tranches;
    const y2 = h.P.y2.bareme;
    const hdf = reg(h, 'hauts-de-france');
    const nb60 = t.filter((x) => x.total === R.plafond_cv).length;
    const ligne = (label: string, x: ReturnType<typeof cout>) => [label, h.eur2(x.y1.y1), h.eur2(x.y2), h.eur2(x.malus.total), h.eur2(x.y4 + x.y5), h.eur2(x.total)];
    const achats = [
      ligne(`Used 5 CV from 2022, ${nom(h, 'ile-de-france')}`, c.idf),
      ligne(`Used 5 CV from 2022, ${nom(h, 'bretagne')}`, c.bre),
      ligne(`Used 5 CV from 2022, ${nom(h, 'occitanie')}`, c.occ),
      ligne(`Used 5 CV from 2022, ${nom(h, 'auvergne-rhone-alpes')}`, c.ara),
      ligne(`Used 5 CV from 2014, ${nom(h, 'ile-de-france')}`, c.vieuxIdf),
      ligne(`New petrol 6 CV, 130 g/km, 1,450 kg, ${nom(h, 'grand-est')}`, c.neuve),
      ligne(`New petrol 8 CV, 150 g/km, 1,650 kg, ${nom(h, 'nouvelle-aquitaine')}`, c.lourde),
      ligne(`New electric 4 CV, ${nom(h, 'hauts-de-france')}`, c.evHdf),
      ligne(`New electric 4 CV, ${nom(h, 'pays-de-la-loire')}`, c.evPdl),
      ligne(`Used 4 CV motorbike, ${nom(h, 'occitanie')}`, c.moto),
    ];
    const sans = [
      [`Change of address, 1st to ${h.num(N.adresse_gratuits)}rd`, h.eur2(c.adr1.total), 'sticker posted, no new certificate'],
      ['Any later change of address', h.eur2(c.adr4.total), 'delivery fee only'],
      ['Duplicate after loss or theft', h.eur2(c.dup.total), 'fixed tax plus delivery fee'],
      ['Adding or removing a spouse', h.eur2(c.conj.total), 'regional tax waived'],
    ];
    return `
<h2>How the total is built</h2>
<p>A French registration bill is not negotiable and does not depend on who files it. It is made of five lines, Y1 to Y5, each defined in the ${h.src('cibs', 'French tax code on goods and services')}, and you will find them printed along the bottom of the certificate. One detail matters for the last cent: lines Y1 to Y4 are added together and rounded to the nearest euro, then the Y5 delivery fee is added with its cents. That is how the State’s own simulator works, and how the calculator at the top of this page works too.</p>
${h.table(['Line', 'What it covers', 'Amount in 2026'], [
  ['Y1', 'Regional tax (plus the Paris-region surcharge)', `${h.eur2(t[0].total)} to ${h.eur2(t[t.length - 1].total)} per fiscal horsepower`],
  ['Y2', 'Transport vehicle tax', `${h.eur2(y2[0].montant)} to ${h.eur2(y2[y2.length - 1].montant)}, commercial vehicles only`],
  ['Y3', 'CO₂ malus and weight malus', `zero under ${h.num(m26.seuil)} g/km and ${h.num(tr[0].min)} kg, up to ${h.eur(m26.plafond)}`],
  ['Y4', 'Fixed tax', h.eur2(N.taxe_fixe)],
  ['Y5', 'Delivery fee', h.eur2(N.redevance)],
], `The five lines of a French registration certificate on ${h.date(d)}.`, ['l', 'l', 'l'])}

<h3>Y1, the regional tax</h3>
<p>This is usually the biggest line. It equals the rate per “cheval fiscal” (fiscal horsepower, a tax unit rather than an engine output) set by the region where you live, multiplied by the administrative horsepower in box P.6. Regions may charge up to ${h.eur2(R.plafond_cv)} per CV; ${h.num(nb60)} of them sit at that cap on ${h.date(d)}, while the lowest rate, ${h.eur2(t[0].total)}, applies in ${t[0].r.nom.en}. In ${nom(h, 'ile-de-france')}, the Paris region, a surcharge of ${h.eur2(h.P.idfm.periodes[0].cv)} per CV for the transport authority Île-de-France Mobilités has applied since ${h.date(h.P.idfm.periodes[0].from)}, outside the cap, under ${h.src('idfm', 'article L421-54-1 of the same code')}. Regional figures match the ${h.src('prixcv', 'official fiscal horsepower price simulator')}; our ${h.a('tarif-cheval-fiscal', 'table of regional rates')} adds each start date, flagged “not verified” where the regional resolution itself could not be read.</p>
<p>Three adjustments apply. The amount is cut by ${h.pct(R.taux_reduction_age, 0)} when the vehicle was first registered, anywhere in the world, ${h.num(R.age_reduction_ans)} years or more before the application. Motorbikes pay half whatever their age, and the two reductions do not stack. Mopeds pay nothing. The Paris surcharge follows the same reductions. And when ownership does not change (new address, duplicate, adding or removing a spouse) there is no regional tax at all.</p>

<h3>Y2, the tax on commercial vehicles</h3>
<p>Only goods and passenger transport vehicles pay it, banded by gross vehicle weight: ${h.eur2(y2[0].montant)} up to ${h.num(y2[0].ptac_max!)} kg, ${h.eur2(y2[1].montant)} up to ${h.num(y2[1].ptac_max!)} kg, ${h.eur2(y2[2].montant)} up to ${h.num(y2[2].ptac_max!)} kg and ${h.eur2(y2[3].montant)} above. Passenger cars, motorhomes and classic cars are not liable. See ${h.a('utilitaire', 'vans and commercial vehicles')} for the categories.</p>

<h3>Y3, the maluses, charged once</h3>
<p>A new car, or an imported one registered in France for the first time, pays the CO₂ malus from the scale of the year it was first registered. In 2026 that scale starts at ${h.eur(h.M.malusCO2Brut(m26.seuil, '2026'))} at ${h.num(m26.seuil)} g/km and reaches ${h.eur(m26.plafond)} from ${h.num(m26.plafond_des)} g/km, under ${h.src('l421_62', 'article L421-62')}. The weight malus is added from ${h.num(tr[0].min)} kg, at ${h.eur(tr[0].euro_kg)} per kilo in the first band and up to ${h.eur(tr[tr.length - 1].euro_kg)} per kilo above ${h.num(tr[tr.length - 1].min)} kg, as the ${h.src('f35950', 'official page on the weight malus')} explains. Together they never exceed ${h.eur(m26.plafond)}. Electric and hydrogen cars are exempt from both. A used car already registered in France never pays a malus, even if it would have paid one new. Full scales: ${h.a('malus-co2', 'CO₂ malus')} and ${h.a('malus-masse', 'weight malus')}.</p>

<h3>Y4 and Y5, the fixed lines</h3>
<p>Nearly every new certificate carries ${h.eur2(N.taxe_fixe)} of fixed tax, the exception being a change of address. Posting the secure document to your home is billed separately at ${h.eur2(N.redevance)}, so the two lines add ${h.eur2(N.taxe_fixe + N.redevance)} between them. Both are confirmed on ${h.src('f19211', 'page F19211 of service-public.gouv.fr')}, the government information site.</p>

<h2>Worked examples on ${h.date(d)}</h2>
<p>Every row comes from the same engine as the calculator, using the date the rates were read as the application date. The first four rows isolate the effect of region on one car; the fifth shows age; the rest show the maluses and the fuel type.</p>
${h.table(['Vehicle', 'Y1', 'Y2', 'Malus', 'Y4 + Y5', 'Total'], achats, 'Purchase or first registration: taxes due, in euros.', ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>The new car in ${nom(h, 'grand-est')} stays below the weight threshold, so only its ${h.eur(c.neuve.malus.co2)} CO₂ malus is added to the regional tax. At ${h.num(1650)} kg and ${h.num(150)} g/km, the second new car pays ${h.eur(c.lourde.malus.co2)} of CO₂ malus and ${h.eur(c.lourde.malus.masse)} of weight malus, which dwarfs its regional tax. The two electric cars are identical: the ${h.eur2(Math.round((c.evPdl.total - c.evHdf.total) * 100) / 100)} gap comes from the reduction granted in ${nom(h, 'hauts-de-france')} and from the different rates.</p>
${h.table(['Procedure', 'Total', 'Why'], sans, 'Procedures without a change of owner: no regional tax.', ['l', 'r', 'l'])}
<p>For your own used-car purchase, the short calculator below needs only the region, the horsepower and the year of first registration.</p>
<!--mini:titulaire-->

<h2>When the bill is lower</h2>
<ul>
<li><strong>The vehicle is ${h.num(R.age_reduction_ans)} years old or more.</strong> The regional tax is halved: the same 5 CV car drops from ${h.eur2(c.idf.y1.y1)} to ${h.eur2(c.vieuxIdf.y1.y1)} of regional tax in ${nom(h, 'ile-de-france')}. Age runs to the day from the date in box B; the ${h.a('dix-ans', 'ten-year rule guide')} shows what a few weeks’ wait can save.</li>
<li><strong>It is a motorbike or scooter.</strong> Half rate from day one, with horsepower worked out from engine size. See ${h.a('moto-scooter', 'motorbike and scooter')}.</li>
<li><strong>The change follows a marriage, civil partnership (PACS), divorce or a spouse’s death.</strong> No regional tax: you pay ${h.eur2(c.conj.total)}. A car inherited by a child, or received as a gift, is taxed like a purchase; ${h.a('heritage-donation', 'inherited or gifted cars')} works it out.</li>
<li><strong>You move house.</strong> The first ${h.num(N.adresse_gratuits)} address changes are free; later ones cost the delivery fee alone. See ${h.a('adresse-duplicata', 'address change and duplicate')}.</li>
<li><strong>The car is electric and you live in ${hdf.nom.en}.</strong> That region has taken ${h.pct(hdf.propres[1].exo, 0)} off its own tax since ${h.date(hdf.propres[1].from)}. Everywhere else an electric car pays the full rate and only escapes the maluses. See ${h.a('electrique-hybride', 'electric and hybrid cars')}.</li>
<li><strong>A family with ${h.num(h.P.malus_co2.famille.enfants_min)} or more children, or a disability card holder.</strong> The maluses drop by ${h.num(h.P.malus_co2.famille.g_par_enfant)} g/km and ${h.num(h.P.malus_masse.famille.kg_par_enfant)} kg per child, refunded afterwards, or vanish for holders of the disability mobility card (CMI invalidité). The calculator options cover both.</li>
</ul>
<p>Classic cars get no regional discount of their own: only the age rule applies, as the ${h.a('collection', 'classic car')} page explains. A car bought outside France still owes the maluses, reduced by an age-based depreciation; ${h.a('import-europe', 'importing from the EU')} and ${h.a('import-hors-europe', 'importing from outside the EU')} also cover the “quitus fiscal” tax clearance and customs steps.</p>

<h2>What changes in 2027</h2>
<p>As of ${h.date(d)}, no region has voted a rise for 2027, but three changes are already law. The Île-de-France Mobilités surcharge falls to ${h.eur2(h.P.idfm.periodes[1].cv)} per CV on ${h.date(h.P.idfm.periodes[1].from)}, unless the authority votes up to ${h.eur2(h.P.idfm.plafond_legal)}: with an unchanged regional rate, our 5 CV car would pay ${h.eur2(c.idf2027.y1)} of regional tax instead of ${h.eur2(c.idf.y1.y1)}. The CO₂ malus starts at ${h.num(m27.seuil)} g/km and caps at ${h.eur(m27.plafond)}, so the new car at 130 g/km would pay ${h.eur(c.co2_130_2027)} rather than ${h.eur(c.neuve.malus.co2)}. The weight scale is unchanged, but mild hybrids lose their allowance. The ${h.a('calendrier-2027', '2027 changes')} page helps decide whether to register before or after 1 January.</p>

<h2>Free application, optional service fees</h2>
<p>Applying on the ANTS website is free: you only pay the taxes. The form is on the ${h.src('ants', 'ANTS registration portal')} and payment by card comes at the end. A garage or an approved professional can file it for you for a service fee, which is added to the taxes and does not go to the State. The ${h.a('taxes-ou-frais', 'taxes vs service fees')} page shows how to separate the two on an invoice.</p>

<h2>Checking an amount you have already paid</h2>
<p>Take the certificate and find three things: the first registration date in box B, the fiscal horsepower in box P.6, and lines Y.1 to Y.6 at the bottom, where Y.6 is the total. Then redo Y1 yourself: your region’s rate on the application date, times P.6, halved if the vehicle was at least ${h.num(R.age_reduction_ans)} years old that day. If the gap is more than a few cents, check the address you declared first, then the application date, since a rate may have changed between purchase and filing. The ${h.a('lire-carte-grise', 'guide to reading a French registration certificate')} explains every box, and the ${h.a('comparer-regions', 'region comparison')} shows what the same car would have cost elsewhere. When planning a purchase, the ${h.a('budget-achat', 'car purchase budget')} adds registration to the other costs, and the ${h.a('calcul-chevaux-fiscaux', 'fiscal horsepower calculator')} finds the CV figure from kilowatts before you hold the certificate.</p>
<p>The rules used, their legal articles and the points that could not be verified are listed on the ${h.a('method', 'method and sources')} page. This site is independent: it has no link with the French administration or with any registration service.</p>
`;
  },
  sources,
};

export const HOME: Record<'fr' | 'en', HomeText> = { fr, en };
