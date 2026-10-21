import { defineGuide, type Helpers } from '../../lib/guide-types';

/** Tarifs en vigueur au jour du relevé, du plus cher au moins cher (majoration IDFM comprise). */
const classement = (h: Helpers) => {
  const d = h.P.regional.date_releve;
  return h.P.regions
    .map((r) => {
      const t = h.M.tarifRegion(r.id, d);
      const idfm = r.idfm ? h.M.majorationIdfm(d) : 0;
      return { r, t, idfm, total: t.cv + idfm };
    })
    .sort((a, b) => b.total - a.total || a.r.nom.fr.localeCompare(b.r.nom.fr));
};
const y1 = (h: Helpers, region: string, cv: number, vieux = false) =>
  h.M.taxeRegionale({ cv, region, date1re: vieux ? '2010-01-01' : h.P.regional.date_releve, dateOp: h.P.regional.date_releve, energie: 'essence', demarche: 'titulaire' }).y1;

export default defineGuide({
  id: 'tarif-cheval-fiscal',
  group: 'outils',
  order: 10,
  tool: 'tarifs',
  related: ['comparer-regions', 'calcul-chevaux-fiscaux', 'region-ile-de-france', 'region-hauts-de-france', 'calendrier-2027'],
  sources: ['prixcv', 'a18021', 'cibs', 'idfm', 'lfi2026'],
  fr: {
    slug: 'tarif-cheval-fiscal-2026',
    nav: 'Prix du cheval fiscal',
    card: 'Le tarif voté par chacune des 18 régions, avec sa date d’effet, recalculé pour votre puissance.',
    title: 'Prix du cheval fiscal 2026 : le tarif des 18 régions',
    description: 'Prix du cheval fiscal 2026 dans les 18 régions, de 30 € à 68,95 € : date d’effet, majoration en Île-de-France, moitié après 10 ans et calcul pour vos CV.',
    h1: 'Prix du cheval fiscal en 2026, région par région',
    intro: 'Le tableau se recalcule pour la puissance de votre véhicule : choisissez vos CV et lisez la taxe régionale de chaque région.',
    resume: (h) => {
      const c = classement(h);
      const haut = c[0], bas = c[c.length - 1];
      const plafond = h.P.regional.plafond_cv;
      const nb60 = c.filter((x) => x.t.cv === plafond).length;
      return `Le cheval fiscal est le montant que chaque région fait payer par unité de puissance administrative, la valeur inscrite en case P.6 de la carte grise. Au ${h.date(h.P.regional.date_releve)}, il va de ${h.eur2(bas.total)} à ${bas.r.nom.fr} à ${h.eur2(haut.total)} en ${haut.r.nom.fr}, où la majoration d’Île-de-France Mobilités de ${h.eur2(haut.idfm)} s’ajoute au tarif régional de ${h.eur2(haut.t.cv)}. ${h.num(nb60)} régions sont au plafond légal de ${h.eur2(plafond)} par cheval. La taxe régionale est égale à ce tarif multiplié par le nombre de chevaux ; elle est réduite de moitié quand la première immatriculation a dix ans ou plus, et pour les motos quel que soit leur âge. C’est la région du domicile du titulaire qui compte, jamais celle du vendeur. Les tarifs ci-dessus ont été relevés dans le simulateur officiel de l’État ; quand la délibération régionale a pu être lue, elle est citée dans la page Méthode.`;
    },
    faqs: (h) => {
      const c = classement(h);
      return [
        { q: 'Pourquoi le cheval fiscal coûte-t-il plus cher en Île-de-France ?', a: `Depuis le ${h.date(h.P.idfm.periodes[0].from)}, une majoration au profit d’Île-de-France Mobilités s’ajoute au tarif régional : ${h.eur2(h.P.idfm.periodes[0].cv)} par cheval jusqu’au 31 décembre 2026, puis ${h.eur2(h.P.idfm.periodes[1].cv)} à partir de 2027 sauf nouvelle décision. Elle n’entre pas dans le plafond de ${h.eur2(h.P.regional.plafond_cv)} et suit les mêmes réductions que la taxe régionale, dont la moitié à dix ans.` },
        { q: 'Une région peut-elle dépasser 60 € par cheval ?', a: `Non pour sa propre taxe : le code des impositions sur les biens et services plafonne le tarif régional à ${h.eur2(h.P.regional.plafond_cv)} par cheval. Seule la majoration francilienne s’ajoute au-delà, ce qui explique le chiffre de ${h.eur2(c[0].total)}. Les régions déjà au plafond ne peuvent plus augmenter ce montant, quelles que soient leurs décisions budgétaires.` },
        { q: 'Quel tarif s’applique si je déménage en cours de démarche ?', a: 'Celui de la région de votre domicile à la date de la demande de certificat. Si vous achetez un véhicule puis déménagez avant de faire la démarche, c’est la nouvelle adresse déclarée qui fixe le tarif. Une société paie celui de la région de l’établissement auquel le véhicule est affecté.' },
        { q: 'Le tarif change-t-il au 1er janvier ?', a: 'Pas forcément. Une région vote son tarif quand elle le souhaite, et la nouvelle valeur s’applique en général le premier jour du deuxième mois qui suit le vote devenu exécutoire. En 2026, les changements ont eu lieu en janvier, février, mars et avril selon les régions, comme le montre la colonne des dates du tableau.' },
      ];
    },
    body: (h) => {
      const c = classement(h);
      const d = h.P.regional.date_releve;
      const rows = c.map((x) => [x.r.nom.fr, h.eur2(x.total), x.t.from ? h.date(x.t.from) : 'non vérifiée', h.eur2(y1(h, x.r.id, 5)), h.eur2(y1(h, x.r.id, 5, true))]);
      const hdf = h.P.regions.find((r) => r.id === 'hauts-de-france')!;
      return `
<h2>Le tableau des 18 régions</h2>
<p>Chaque ligne donne le tarif par cheval en vigueur au ${h.date(d)}, la date depuis laquelle il s’applique, et la taxe régionale d’une voiture de 5 CV de moins de dix ans, puis de dix ans ou plus. Une date « non vérifiée » signifie que la délibération qui a fixé ce tarif n’a pas été lue à la source : le montant, lui, est celui que publie le ${h.src('prixcv', 'simulateur officiel du prix du cheval fiscal')}.</p>
${h.table(['Région', '€ par CV', 'Depuis le', '5 CV, moins de 10 ans', '5 CV, 10 ans ou plus'], rows, `Tarifs au ${h.date(d)}, majoration Île-de-France Mobilités comprise.`, ['l', 'r', 'l', 'r', 'r'])}

<h2>Ce que le tarif ne comprend pas</h2>
<p>Le tarif régional ne fait qu’une ligne du titre, la ligne Y1. Toute région confondue, l’État y ajoute ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)} : ${h.eur2(h.P.national.taxe_fixe)} de taxe fixe (Y4) et ${h.eur2(h.P.national.redevance)} pour l’envoi du titre à domicile (Y5). Une voiture neuve ou importée paie en plus, selon ses émissions et sa masse, deux malus. Pour un total complet, ligne par ligne, utilisez le ${h.a('home', 'calcul complet')}.</p>

<h2>Les véhicules électriques</h2>
<p>Depuis le ${h.date('2025-05-01')}, la loi permet aux régions de réduire de moitié ou de supprimer la taxe pour les véhicules électriques et à hydrogène, et non plus pour le GPL ou le superéthanol. Au ${h.date(d)}, seule la région ${hdf.nom.fr} en fait usage : la moitié du tarif depuis le ${h.date(hdf.propres[1].from)}, après une exonération totale. Partout ailleurs, une voiture électrique paie le même tarif qu’une thermique, ce que confirme l’${h.src('a18021', 'actualité de service-public.gouv.fr')} sur les tarifs 2026.</p>

<h2>Lire le résultat pour votre véhicule</h2>
<p>Saisissez la puissance fiscale de la case P.6 dans l’outil : tout le tableau se recalcule. Le curseur va de 1 à 20 CV ; au-delà, tapez la valeur. La bascule « plus de 10 ans » applique la réduction de moitié prévue quand la première immatriculation, même à l’étranger, remonte à dix ans ou plus. Si vous ne connaissez pas encore la puissance, le ${h.a('calcul-chevaux-fiscaux', 'calcul des chevaux fiscaux')} l’estime à partir des kilowatts. Pour classer les régions sur le coût total plutôt que sur le seul tarif, passez au ${h.a('comparer-regions', 'comparateur des régions')}.</p>
`;
    },
  },
  en: {
    slug: 'fiscal-horsepower-rate',
    nav: 'Fiscal horsepower rates',
    card: 'The rate set by each of the 18 regions, with its start date, recalculated for your horsepower.',
    title: 'Fiscal horsepower rate 2026 in all 18 French regions',
    description: 'Fiscal horsepower rate 2026 in all 18 French regions, from €30 to €68.95: start dates, Île-de-France surcharge, half rate at 10 years and your own CV figure.',
    h1: 'Fiscal horsepower rate in 2026, region by region',
    intro: 'The table recalculates for your vehicle’s horsepower: set your CV and read each region’s regional tax.',
    resume: (h) => {
      const c = classement(h);
      const haut = c[0], bas = c[c.length - 1];
      const plafond = h.P.regional.plafond_cv;
      const nb60 = c.filter((x) => x.t.cv === plafond).length;
      return `The fiscal horsepower rate, or “cheval fiscal”, is the amount each French region charges per unit of administrative power, the figure printed in box P.6 of the registration certificate. On ${h.date(h.P.regional.date_releve)} it ranges from ${h.eur2(bas.total)} in ${bas.r.nom.en} to ${h.eur2(haut.total)} in ${haut.r.nom.en}, where the Île-de-France Mobilités surcharge of ${h.eur2(haut.idfm)} sits on top of the regional rate of ${h.eur2(haut.t.cv)}. ${h.num(nb60)} regions charge the legal maximum of ${h.eur2(plafond)} per horsepower. The regional tax is this rate times the number of CV; it is halved once the first registration is ten years old or more, and for motorbikes whatever their age. The region that counts is where the new keeper lives, never where the seller lives. These rates were read from the State’s official simulator; where the regional resolution could be read, the Method page cites it.`;
    },
    faqs: (h) => {
      const c = classement(h);
      return [
        { q: 'Why is a fiscal horsepower dearer in Île-de-France?', a: `Since ${h.date(h.P.idfm.periodes[0].from)}, a surcharge for Île-de-France Mobilités, the Paris-region transport authority, is added to the regional rate: ${h.eur2(h.P.idfm.periodes[0].cv)} per CV until 31 December 2026, then ${h.eur2(h.P.idfm.periodes[1].cv)} from 2027 unless it decides otherwise. It sits outside the ${h.eur2(h.P.regional.plafond_cv)} cap and follows the same reductions as the regional tax.` },
        { q: 'Can a region charge more than €60 per CV?', a: `Not for its own tax: the French tax code caps the regional rate at ${h.eur2(h.P.regional.plafond_cv)} per CV. Only the Paris-region surcharge comes on top, which is how ${h.eur2(c[0].total)} is reached. Regions already at the cap cannot raise the amount any further, whatever their budget choices, so their rate is frozen until the law changes.` },
        { q: 'Which rate applies if I move house mid-process?', a: 'The rate of the region where you live on the date you apply for the certificate. If you buy a vehicle and move before applying, the new address you declare sets the rate. A company pays the rate of the region of the site the vehicle is assigned to, not that of its head office.' },
        { q: 'Do rates change on 1 January?', a: 'Not necessarily. A region votes its rate whenever it chooses, and the new amount usually applies from the first day of the second month after the vote becomes enforceable. In 2026 changes took effect in January, February, March and April depending on the region, as the date column of the table shows.' },
      ];
    },
    body: (h) => {
      const c = classement(h);
      const d = h.P.regional.date_releve;
      const rows = c.map((x) => [x.r.nom.en, h.eur2(x.total), x.t.from ? h.date(x.t.from) : 'not verified', h.eur2(y1(h, x.r.id, 5)), h.eur2(y1(h, x.r.id, 5, true))]);
      const hdf = h.P.regions.find((r) => r.id === 'hauts-de-france')!;
      return `
<h2>The table of all 18 regions</h2>
<p>Each row gives the rate per CV in force on ${h.date(d)}, the date it has applied since, and the regional tax for a 5 CV car under ten years old, then ten years or older. A “not verified” date means the resolution that set the rate could not be read at the source: the amount itself is the one published by the ${h.src('prixcv', 'official fiscal horsepower price simulator')}.</p>
${h.table(['Region', '€ per CV', 'Since', '5 CV, under 10 years', '5 CV, 10 years or more'], rows, `Rates on ${h.date(d)}, Île-de-France Mobilités surcharge included.`, ['l', 'r', 'l', 'r', 'r'])}

<h2>What the rate leaves out</h2>
<p>The regional rate is only one line of the certificate, line Y1. Whatever the region, the State adds ${h.eur2(h.P.national.taxe_fixe + h.P.national.redevance)}: ${h.eur2(h.P.national.taxe_fixe)} of fixed tax (Y4) and ${h.eur2(h.P.national.redevance)} for posting the certificate to you (Y5). A new or imported car also pays two maluses, based on its emissions and its mass. For a full total, line by line, use the ${h.a('home', 'full calculation')}.</p>

<h2>Electric vehicles</h2>
<p>Since ${h.date('2025-05-01')}, the law lets regions halve or remove the tax for electric and hydrogen vehicles, and no longer for LPG or E85. On ${h.date(d)}, only ${hdf.nom.en} uses this option: half the rate since ${h.date(hdf.propres[1].from)}, after a full exemption. Everywhere else an electric car pays the same rate as a petrol one, as the ${h.src('a18021', 'service-public.gouv.fr news item')} on 2026 rates confirms.</p>

<h2>Reading the result for your vehicle</h2>
<p>Enter the fiscal horsepower from box P.6 in the tool and the whole table recalculates. The slider runs from 1 to 20 CV; above that, type the value. The “over 10 years” switch applies the half rate that the law grants when the first registration, even abroad, goes back ten years or more. If you do not know the horsepower yet, the ${h.a('calcul-chevaux-fiscaux', 'fiscal horsepower calculator')} estimates it from the kilowatts. To rank regions on the total cost rather than on the rate alone, move on to the ${h.a('comparer-regions', 'region comparison')}.</p>
`;
    },
  },
});
