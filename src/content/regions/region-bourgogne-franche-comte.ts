import { defineGuide, type Helpers } from '../../lib/guide-types';
import type { Genre } from '../../lib/engine/carte-grise';

const ID = 'bourgogne-franche-comte';
const ref = (h: Helpers) => h.P.regional.date_releve;

/** Voiture dont les dix ans tombent juste après la date du relevé (exemple choisi). */
const PREMIERE = '2016-11-15';
const APRES = '2026-11-16';
const y1 = (h: Helpers, cv: number, date1re: string, dateOp = ref(h), genre: Genre = 'vp') =>
  h.M.taxeRegionale({ cv, region: ID, date1re, dateOp, energie: 'essence', demarche: 'titulaire', genre }).y1;
const total = (h: Helpers, cv: number, date1re: string, dateOp = ref(h), genre: Genre = 'vp') =>
  h.M.coutCarteGrise({ cv, region: ID, date1re, dateOp, energie: 'essence', demarche: 'titulaire', genre, origine: 'france_occasion', gkm: 0, masseKg: 0, ptacKg: 0 }).total;
const place = (h: Helpers) => {
  const val = (id: string, idfm: boolean) => h.M.tarifRegion(id, ref(h)).cv + (idfm ? h.M.majorationIdfm(ref(h)) : 0);
  const all = h.P.regions.map((r) => val(r.id, r.idfm));
  const moi = val(ID, false);
  return { rang: all.filter((v) => v > moi).length + 1, pareil: all.filter((v) => v === moi).length, n: all.length };
};
const CYL = [125, 500, 900, 1250];

export default defineGuide({
  id: 'region-bourgogne-franche-comte',
  group: 'regions',
  order: 20,
  tool: 'cout',
  region: ID,
  related: ['dix-ans', 'moto-scooter', 'collection', 'region-grand-est', 'region-centre-val-de-loire', 'comparer-regions'],
  sources: ['prixcv', 'cibs', 'l421_17', 'a18021', 'f19211'],
  fr: {
    slug: 'region/bourgogne-franche-comte',
    nav: 'Bourgogne-Franche-Comté',
    card: 'Tarif au plafond, effet du seuil des dix ans sur une voiture ancienne et prix des motos à Dijon, Besançon ou Auxerre.',
    title: 'Cheval fiscal Bourgogne-Franche-Comté 2026 : 60 € le CV',
    description: 'Cheval fiscal en Bourgogne-Franche-Comté en 2026 : 60 € par CV. Moitié prix à dix ans, motos et scooters, exemples chiffrés pour Dijon, Besançon et la région.',
    h1: 'Ce que coûte une carte grise bourguignonne ou franc-comtoise en 2026',
    intro: 'Le simulateur applique le tarif de Bourgogne-Franche-Comté ; la date de première immatriculation (case B) décide si vous payez le tarif plein ou la moitié.',
    resume: (h) => {
      const t = h.M.tarifRegion(ID, ref(h));
      const p = place(h);
      return `La Bourgogne-Franche-Comté demande ${h.eur2(t.cv)} par cheval fiscal, le plafond légal pour une région. Le chiffre est confirmé par le simulateur officiel de l’État au ${h.date(ref(h))}. Il s’appliquerait depuis le ${h.date(t.from!)}, une entrée en vigueur en milieu d’année rapportée par des sources secondaires, mais la délibération n’a pas été retrouvée et cette date reste non vérifiée. La région figure parmi les ${h.num(p.pareil)} territoires au même tarif, à la ${h.num(p.rang)}e place nationale, derrière la seule Île-de-France. Une voiture de 5 CV de moins de dix ans y paie ${h.eur(y1(h, 5, '2022-01-10'))} de taxe régionale ; dès dix ans révolus après la première immatriculation, la somme tombe à ${h.eur(y1(h, 5, '2012-01-10'))}. Les motos paient la moitié du tarif à tout âge et les cyclomoteurs rien. Aucune réduction n’existe pour les voitures électriques : elles paient comme une voiture à essence. Le certificat complet ajoute ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} de frais nationaux.`;
    },
    faqs: (h) => {
      const avant = y1(h, 6, PREMIERE), apres = y1(h, 6, PREMIERE, APRES);
      const m = h.M.chevauxMoto(900);
      return [
        { q: 'En Bourgogne-Franche-Comté, vaut-il mieux attendre les dix ans d’une voiture pour faire la carte grise ?', a: `Pour un achat, la date qui compte est celle de la demande. Une voiture de 6 CV mise en circulation le ${h.date(PREMIERE)} paie ${h.eur(avant)} de taxe régionale au ${h.date(ref(h))}, puis ${h.eur(apres)} dès le ${h.date(APRES)}. Attention au délai : la carte grise doit être demandée dans un délai de ${h.num(h.P.national.delai_titulaire_mois)} mois après la vente, sous peine d’une amende de ${h.eur(h.P.national.amende_titulaire)}.` },
        { q: 'Combien coûte la carte grise d’une moto de 900 cm³ en Bourgogne-Franche-Comté ?', a: `Une moto de 900 cm³ compte ${h.num(m)} CV d’après le barème des deux-roues. La taxe régionale se calcule à demi-tarif quel que soit l’âge de la moto, soit ${h.eur(y1(h, m, '2023-04-01', ref(h), 'moto'))}, et le titre complet ${h.eur2(total(h, m, '2023-04-01', ref(h), 'moto'))}. Une moto de quinze ans paie la même somme : les deux réductions ne se cumulent pas.` },
        { q: 'Une voiture de collection paie-t-elle moins en Bourgogne-Franche-Comté ?', a: `Pas grâce à son statut. La région ne peut pas voter de tarif propre aux véhicules de collection, et la loi n’en prévoit aucun. Une voiture de collection a forcément plus de dix ans, donc elle paie la moitié du tarif : ${h.eur(y1(h, 8, '1985-05-01'))} pour 8 CV. Le certificat de collection exonère en revanche de la taxe sur les véhicules de transport, qui ne vise que les utilitaires.` },
      ];
    },
    body: (h) => {
      const t = h.M.tarifRegion(ID, ref(h));
      const cvs = [4, 6, 8, 10];
      const rows = cvs.map((cv) => { const a = y1(h, cv, PREMIERE), b = y1(h, cv, PREMIERE, APRES); return [`${cv} CV`, h.eur(a), h.eur(b), h.eur(a - b)]; });
      const motos = CYL.map((c) => { const cv = h.M.chevauxMoto(c); return [`${h.num(c)} cm³`, `${h.num(cv)} CV`, h.eur2(y1(h, cv, '2023-04-01', ref(h), 'moto')), h.eur2(total(h, cv, '2023-04-01', ref(h), 'moto'))]; });
      return `
<h2>Ce que l’on sait du tarif régional</h2>
<p>Le montant de ${h.eur2(t.cv)} par cheval est celui du ${h.src('prixcv', 'simulateur officiel du prix du cheval fiscal')}. Il correspond au maximum autorisé par le ${h.src('cibs', 'code des impositions sur les biens et services')}, si bien que la région ne peut plus l’augmenter. La date du ${h.date(t.from!)} vient de sources secondaires qui la rattachent à un vote du conseil régional au début de la même année ; ni ce vote ni la délibération n’ont pu être consultés. L’historique des tarifs précédents n’est pas reproduit, faute de source officielle lue. Aucune décision pour 2027 n’est connue.</p>

<h2>Le seuil des dix ans, à un mois près</h2>
<p>La réduction de moitié s’applique dès que dix années pleines séparent la première immatriculation, même à l’étranger, de la date de la demande. Exemple : une voiture mise en circulation le ${h.date(PREMIERE)}, vendue le ${h.date(ref(h))} ou après ses dix ans.</p>
${h.table(['Puissance', `Demande au ${h.date(ref(h))}`, `Demande au ${h.date(APRES)}`, 'Économie'], rows, 'Bourgogne-Franche-Comté, taxe régionale d’une voiture d’occasion.', ['l', 'r', 'r', 'r'])}
<p>Le calendrier n’est pas libre pour autant : l’acheteur dispose d’${h.num(h.P.national.delai_titulaire_mois)} mois après la vente pour demander le certificat. L’astuce ne vaut que si la vente elle-même a lieu tout près de la date anniversaire. La page ${h.a('dix-ans', 'acheter avant ou après dix ans')} détaille ce calcul.</p>

<h2>Motos et scooters</h2>
<p>Les deux-roues motorisés de catégorie L3e et L4e paient la moitié du tarif quel que soit leur âge. Leur puissance fiscale suit un barème fondé sur la cylindrée (${h.src('l421_17', 'article L421-17 du code')}) :</p>
${h.table(['Cylindrée', 'Puissance fiscale', 'Taxe régionale', 'Titre complet'], motos, `Bourgogne-Franche-Comté, moto récente au ${h.date(ref(h))}.`, ['l', 'r', 'r', 'r'])}
<p>Un cyclomoteur de 50 cm³ ne paie pas de taxe régionale : seuls ${h.eur2(h.P.national.taxe_fixe)} de taxe fixe et ${h.eur2(h.P.national.redevance)} d’envoi restent dus. Plus de détails sur la page ${h.a('moto-scooter', 'moto et scooter')}.</p>

<h2>Électriques et autres cas</h2>
<p>La Bourgogne-Franche-Comté n’accorde aucune réduction aux véhicules électriques ou à hydrogène, comme l’indique l’${h.src('a18021', 'actualité de service-public.gouv.fr sur les tarifs 2026')}. Un changement d’adresse, un duplicata ou l’ajout du conjoint ne donnent lieu à aucune taxe régionale ; les montants de ces démarches sont listés sur la ${h.src('f19211', 'fiche officielle du coût du certificat')}.</p>
`;
    },
  },
  en: {
    slug: 'region/bourgogne-franche-comte',
    nav: 'Bourgogne-Franche-Comté',
    card: 'A rate at the cap, how the ten-year threshold cuts the bill on an older car, and motorbike costs in Dijon or Besançon.',
    title: 'Bourgogne-Franche-Comté car registration 2026: €60 a CV',
    description: 'Bourgogne-Franche-Comté car registration in 2026: €60 per fiscal horsepower, half price at ten years, motorbike figures and examples for Dijon and Besançon.',
    h1: 'Registering a vehicle in Bourgogne-Franche-Comté in 2026',
    intro: 'The calculator uses the Bourgogne-Franche-Comté rate; the first registration date in box B decides whether you pay the full rate or half.',
    resume: (h) => {
      const t = h.M.tarifRegion(ID, ref(h));
      const p = place(h);
      return `Bourgogne-Franche-Comté, the region of Dijon, Besançon and the Burgundy vineyards, charges ${h.eur2(t.cv)} per fiscal horsepower, the “cheval fiscal” used to work out the regional tax on a French registration certificate (“carte grise”). That is the legal maximum for a region. The State’s official simulator confirms it on ${h.date(ref(h))}. Secondary sources say it has applied since ${h.date(t.from!)}, a mid-year start, but the resolution was not found and the date remains unverified. The region is one of ${h.num(p.pareil)} areas on this rate, joint ${p.rang === 2 ? 'second' : h.num(p.rang)} nationally behind Île-de-France. A 5 CV car under ten years old pays ${h.eur(y1(h, 5, '2022-01-10'))} in regional tax; once ten full years have passed since first registration, it pays ${h.eur(y1(h, 5, '2012-01-10'))}. Motorbikes pay half at any age and mopeds nothing. Electric cars get no discount. The full certificate adds ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} of national charges.`;
    },
    faqs: (h) => {
      const avant = y1(h, 7, PREMIERE), apres = y1(h, 7, PREMIERE, APRES);
      const m = h.M.chevauxMoto(500);
      return [
        { q: 'Can I save by registering a nearly ten-year-old car later in Bourgogne-Franche-Comté?', a: `Only within the legal deadline. A 7 CV car first registered on ${h.date(PREMIERE)} owes ${h.eur(avant)} on ${h.date(ref(h))} and ${h.eur(apres)} from ${h.date(APRES)}. But you must apply within ${h.num(h.P.national.delai_titulaire_mois)} month of the sale, or risk a ${h.eur(h.P.national.amende_titulaire)} fixed fine, so the saving works only when the sale falls close to the anniversary.` },
        { q: 'What does a 500 cc motorbike cost to register in Bourgogne-Franche-Comté?', a: `A 500 cc motorbike is rated ${h.num(m)} CV on the two-wheeler scale. Motorbikes always pay half the regional rate, so the regional tax is ${h.eur(y1(h, m, '2023-04-01', ref(h), 'moto'))} and the full certificate ${h.eur2(total(h, m, '2023-04-01', ref(h), 'moto'))}. An older bike pays exactly the same, because the motorbike half rate and the ten-year half rate do not stack.` },
        { q: 'Do classic cars get a special rate in Bourgogne-Franche-Comté?', a: `No. French law gives regions no separate rate for classic cars. Because any classic is well over ten years old, it pays half the rate anyway: ${h.eur(y1(h, 8, '1985-05-01'))} for an 8 CV car. Classic car status does exempt the vehicle from the transport vehicle tax, but that tax only targets vans and lorries anyway.` },
      ];
    },
    body: (h) => {
      const t = h.M.tarifRegion(ID, ref(h));
      const cvs = [4, 6, 8, 10];
      const rows = cvs.map((cv) => { const a = y1(h, cv, PREMIERE), b = y1(h, cv, PREMIERE, APRES); return [`${cv} CV`, h.eur(a), h.eur(b), h.eur(a - b)]; });
      const motos = CYL.map((c) => { const cv = h.M.chevauxMoto(c); return [`${h.num(c)} cc`, `${h.num(cv)} CV`, h.eur2(y1(h, cv, '2023-04-01', ref(h), 'moto')), h.eur2(total(h, cv, '2023-04-01', ref(h), 'moto'))]; });
      return `
<h2>What is known about the rate</h2>
<p>The ${h.eur2(t.cv)} figure is the one shown by the ${h.src('prixcv', 'official fiscal horsepower price simulator')}. It equals the maximum allowed by the ${h.src('cibs', 'French tax code')}, so the region cannot raise it. The ${h.date(t.from!)} start date comes from secondary sources linking it to a regional council vote earlier that year; neither the vote nor the resolution could be read. Earlier rates are not reproduced because no official source for them was checked. Nothing is known for 2027.</p>

<h2>The ten-year threshold, to the month</h2>
<p>The regional tax is halved once ten full years separate the first registration, even abroad, from the date of the application. Take a car first registered on ${h.date(PREMIERE)}:</p>
${h.table(['Power', `Applying on ${h.date(ref(h))}`, `Applying on ${h.date(APRES)}`, 'Saving'], rows, 'Bourgogne-Franche-Comté, regional tax on a used car.', ['l', 'r', 'r', 'r'])}
<p>The timing is not entirely yours to choose: the buyer has ${h.num(h.P.national.delai_titulaire_mois)} month after the sale to apply. The saving only works when the sale itself takes place close to the anniversary. The ${h.a('dix-ans', 'ten-year rule')} page runs the numbers in detail.</p>

<h2>Motorbikes and scooters</h2>
<p>Category L3e and L4e motorbikes pay half the rate whatever their age. Their fiscal horsepower follows a scale based on engine size (${h.src('l421_17', 'article L421-17 of the tax code')}):</p>
${h.table(['Engine size', 'Fiscal horsepower', 'Regional tax', 'Full certificate'], motos, `Bourgogne-Franche-Comté, recent motorbike on ${h.date(ref(h))}.`, ['l', 'r', 'r', 'r'])}
<p>A 50 cc moped pays no regional tax; only ${h.eur2(h.P.national.taxe_fixe)} of fixed tax and ${h.eur2(h.P.national.redevance)} for posting the certificate remain. See ${h.a('moto-scooter', 'motorbikes and scooters')} for more.</p>

<h2>Electric cars and other procedures</h2>
<p>Bourgogne-Franche-Comté gives no discount to electric or hydrogen vehicles, as the ${h.src('a18021', 'service-public.gouv.fr news item on 2026 rates')} shows. An address change, a duplicate or adding a spouse triggers no regional tax; the cost of each is set out on the ${h.src('f19211', 'official cost page')}.</p>
`;
    },
  },
});
