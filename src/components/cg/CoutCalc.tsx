/**
 * Calcul complet du coût de la carte grise, case par case (Y1 à Y5, malus CO₂, malus au poids).
 * Moteur : lib/engine/carte-grise.ts. Premier rendu = valeurs par défaut et jour du build ; le lien
 * partagé et la date du jour ne sont lus qu'après hydratation (RECETTE §17.5).
 */
import { useEffect, useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import Toggle from '../ui/Toggle';
import StackedBar from '../ui/StackedBar';
import { coutCarteGrise, comparerRegions, ENERGIES, DEMARCHES, GENRES, type Demarche, type Energie, type Genre, type Origine } from '../../lib/engine/carte-grise';
import { P } from '../../lib/engine/params';
import { readParams, num, str, updateURL } from '../../lib/url-state';
import { Shell, Row2, Head, Rows, Note, MethodLink } from '../calc/kit';
import { T, eur, eurx, sep, regionNom, regionOptions, DEMARCHE, ENERGIE, GENRE, ORIGINE, moisOptions, iso, ANTS, type L } from './labels';

const ORIGINES: Origine[] = ['france_occasion', 'france_neuf', 'import_occasion', 'import_neuf'];
const BUILD_Y = Number(__BUILD_DAY__.slice(0, 4));
const BUILD_M = Number(__BUILD_DAY__.slice(5, 7));

interface Props {
  lang?: L; methodHref?: string; id?: string;
  /** Région présélectionnée (pages régionales). */
  region?: string;
  /** Réglages de départ propres à une page (jamais par l'adresse). */
  preset?: Partial<{ demarche: Demarche; origine: Origine; energie: Energie; genre: Genre; cv: number; an1: number; co2: number; masse: number }>;
}

export default function CoutCalc({ lang = 'fr', methodHref, id = 'calc', region = 'ile-de-france', preset = {} }: Props) {
  const l = lang;
  const [dem, setDem] = useState<Demarche>(preset.demarche ?? 'titulaire');
  const [reg, setReg] = useState(region);
  const [ori, setOri] = useState<Origine>(preset.origine ?? 'france_occasion');
  const [ene, setEne] = useState<Energie>(preset.energie ?? 'essence');
  const [cv, setCv] = useState(preset.cv ?? 6);
  const [an1, setAn1] = useState(preset.an1 ?? 2019);
  const [mo1, setMo1] = useState('6');
  const [co2, setCo2] = useState(preset.co2 ?? 135);
  const [masse, setMasse] = useState(preset.masse ?? 1450);
  const [genre, setGenre] = useState<Genre>(preset.genre ?? 'vp');
  const [ptac, setPtac] = useState(3500);
  const [enf, setEnf] = useState(0);
  const [hand, setHand] = useState('0');
  const [auto, setAuto] = useState(60);
  const [rang, setRang] = useState(1);
  const [anOp, setAnOp] = useState(BUILD_Y);
  const [moOp, setMoOp] = useState(String(BUILD_M));
  useEffect(() => {
    const now = new Date();
    const u = readParams(window.location.search);
    setAnOp(num(u, 'ay', now.getFullYear())); setMoOp(str(u, 'am', String(now.getMonth() + 1)));
    if (![...u.keys()].length) return;
    const pick = <K extends string>(k: string, list: readonly K[], d: K): K => { const v = u.get(k); return v && (list as readonly string[]).includes(v) ? (v as K) : d; };
    setDem(pick('d', DEMARCHES, dem)); setReg(str(u, 'r', reg)); setOri(pick('o', ORIGINES, ori)); setEne(pick('e', ENERGIES, ene)); setGenre(pick('g', GENRES, genre));
    setCv(num(u, 'cv', cv)); setAn1(num(u, 'y', an1)); setMo1(str(u, 'm', mo1)); setCo2(num(u, 'co2', co2)); setMasse(num(u, 'kg', masse)); setPtac(num(u, 'ptac', ptac)); setEnf(num(u, 'enf', enf));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { updateURL({ d: dem, r: reg, o: ori, e: ene, g: genre, cv, y: an1, m: mo1, co2, kg: masse, ptac, enf, ay: anOp, am: moOp }); }, [dem, reg, ori, ene, genre, cv, an1, mo1, co2, masse, ptac, enf, anOp, moOp]);

  const neuf = ori === 'france_neuf' || ori === 'import_neuf';
  const date1re = neuf ? iso(anOp, Number(moOp), 1) : iso(an1, Number(mo1), 1);
  const dateOp = iso(anOp, Number(moOp), 15);
  const malusVisible = dem === 'immat' && ori !== 'france_occasion' && genre === 'vp';
  const input = { demarche: dem, region: reg, origine: ori, energie: ene, genre, cv, date1re, dateOp, gkm: co2, masseKg: masse, ptacKg: ptac, enfants: enf, handicap: hand === '1', autonomieKm: auto, rangAdresse: rang };
  const r = useMemo(() => coutCarteGrise(input), [JSON.stringify(input)]);
  const cmp = useMemo(() => comparerRegions(input), [JSON.stringify(input)]);
  const moinsCher = cmp[0];
  const y1Label = (() => {
    const d = r.y1;
    if (d.motif === 'adresse') return T(l, 'Y1 taxe régionale · non due pour un changement d’adresse', 'Y1 regional tax · not due on a change of address');
    if (d.motif === 'duplicata') return T(l, 'Y1 taxe régionale · non due pour un duplicata', 'Y1 regional tax · not due on a duplicate');
    if (d.motif === 'conjoint') return T(l, 'Y1 taxe régionale · exonérée entre conjoints ou partenaires', 'Y1 regional tax · exempt between spouses or partners');
    if (d.motif === 'cyclo') return T(l, 'Y1 taxe régionale · nulle pour un cyclomoteur', 'Y1 regional tax · nil for a moped');
    if (d.motif === 'exonere') return T(l, 'Y1 taxe régionale · exonération votée par la région', 'Y1 regional tax · exemption voted by the region');
    const base = `${eurx(d.tarif, l)} × ${d.cv} CV`;
    const half = d.coef < 1 ? (d.motif === 'moto' ? T(l, ', moitié pour un deux-roues', ', half for a motorbike') : T(l, ', moitié à 10 ans', ', half at 10 years')) : '';
    const exo = d.exo > 0 ? T(l, `, ${Math.round(d.exo * 100)} % retirés par la région`, `, ${Math.round(d.exo * 100)}% removed by the region`) : '';
    return `Y1 ${T(l, 'taxe régionale', 'regional tax')} · ${base}${half}${exo}`;
  })();
  const m = r.malus;
  const rows: Array<[string, string] | [string, string, boolean]> = r.etiquette ? [
    [T(l, `Changement d’adresse n° 1 à ${P.national.adresse_gratuits}`, `Change of address no. 1 to ${P.national.adresse_gratuits}`), eur(0, l)],
    [T(l, 'Total des taxes', 'Total taxes'), eur(0, l, 2), true],
  ] : [
    [y1Label, eur(r.y1.regionale, l, 2)],
    ...(r.y1.majoration > 0 ? [[T(l, `Y1 majoration Île-de-France Mobilités · ${eurx(r.y1.idfm, l)} × ${r.y1.cv} CV${r.y1.coef < 1 ? T(l, ' × ½', ' × ½') : ''}`, `Y1 Île-de-France Mobilités surcharge · ${eurx(r.y1.idfm, l)} × ${r.y1.cv} CV${r.y1.coef < 1 ? ' × ½' : ''}`), eur(r.y1.majoration, l, 2)] as [string, string]] : []),
    ...(r.y2 > 0 ? [[T(l, 'Y2 taxe sur les véhicules de transport (PTAC)', 'Y2 transport vehicle tax (gross weight)'), eur(r.y2, l)] as [string, string]] : []),
    ...(m.soumis && m.calcule ? [[T(l, `Y3 malus CO₂ (barème ${m.annee}, ${m.gRetenu} g/km)`, `Y3 CO₂ malus (${m.annee} scale, ${m.gRetenu} g/km)`), eur(m.co2, l)] as [string, string], [T(l, 'Y3 malus au poids', 'Y3 weight malus'), eur(m.masse, l)] as [string, string]] : []),
    [T(l, 'Y4 taxe fixe', 'Y4 fixed tax'), eurx(r.y4, l)],
    [T(l, 'Y5 redevance d’acheminement', 'Y5 delivery fee'), eurx(r.y5, l)],
    [T(l, 'Total des taxes', 'Total taxes'), eur(r.total, l, 2), true],
  ];
  const segs = [
    { label: 'Y1', value: r.y1.y1, color: '#1F5A44' },
    { label: T(l, 'Malus', 'Malus'), value: r.malus.total, color: '#9a3412' },
    { label: 'Y2 + Y4 + Y5', value: r.y2 + r.y4 + r.y5, color: '#94a3b8' },
  ];
  const ecart = r.total - moinsCher.total;
  return (
    <Shell id={id} form={<>
      <SelectField id={`${id}-dem`} label={T(l, 'Démarche', 'Procedure')} value={dem} onChange={(v) => setDem(v as Demarche)} options={DEMARCHES.map((d) => ({ value: d, label: DEMARCHE[l][d] }))} />
      {dem === 'adresse' && <NumberField id={`${id}-rang`} label={T(l, 'Combien de changements d’adresse, celui-ci compris ?', 'How many changes of address, this one included?')} value={rang} onChange={setRang} min={1} max={50} lang={l} />}
      <Row2>
        <SelectField id={`${id}-reg`} label={T(l, 'Région du domicile', 'Region of residence')} value={reg} onChange={setReg} options={regionOptions(l)} />
        <SelectField id={`${id}-ori`} label={T(l, 'Le véhicule', 'The vehicle')} value={ori} onChange={(v) => setOri(v as Origine)} options={ORIGINES.map((o) => ({ value: o, label: ORIGINE[l][o] }))} />
      </Row2>
      <Row2>
        <SelectField id={`${id}-ene`} label={T(l, 'Énergie', 'Fuel')} value={ene} onChange={(v) => setEne(v as Energie)} options={ENERGIES.map((e) => ({ value: e, label: ENERGIE[l][e] }))} />
        <NumberField id={`${id}-cv`} label={T(l, 'Puissance fiscale (case P.6)', 'Fiscal horsepower (box P.6)')} value={cv} onChange={setCv} unit="CV" max={200} lang={l} />
      </Row2>
      {!neuf && <Row2>
        <NumberField id={`${id}-an1`} label={T(l, 'Année de 1re immatriculation (B)', 'Year first registered (B)')} value={an1} onChange={setAn1} max={2100} lang={l} help={T(l, 'Case B du titre, même à l’étranger', 'Box B of the certificate, even abroad')} />
        <SelectField id={`${id}-mo1`} label={T(l, 'Mois', 'Month')} value={mo1} onChange={setMo1} options={moisOptions(l)} />
      </Row2>}
      {malusVisible && <Row2>
        <NumberField id={`${id}-co2`} label={T(l, 'CO₂ WLTP (case V.7)', 'CO₂ WLTP (box V.7)')} value={co2} onChange={setCo2} unit="g/km" max={1000} lang={l} />
        <NumberField id={`${id}-kg`} label={T(l, 'Masse en ordre de marche (G)', 'Mass in running order (G)')} value={masse} onChange={setMasse} unit="kg" max={10000} lang={l} />
      </Row2>}
      <details className="rounded-lg border border-navy-200 px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-navy-800">{T(l, 'Options avancées : type de véhicule, famille, date de la demande', 'Advanced options: vehicle type, family, date of application')}</summary>
        <div className="mt-4 space-y-5">
          <Row2>
            <SelectField id={`${id}-genre`} label={T(l, 'Type de véhicule', 'Vehicle type')} value={genre} onChange={(v) => setGenre(v as Genre)} options={GENRES.map((g) => ({ value: g, label: GENRE[l][g] }))} />
            {genre === 'utilitaire' || genre === 'camping_car'
              ? <NumberField id={`${id}-ptac`} label={T(l, 'PTAC (case F.2)', 'Gross weight (box F.2)')} value={ptac} onChange={setPtac} unit="kg" max={60000} lang={l} />
              : <NumberField id={`${id}-enf`} label={T(l, 'Enfants à charge', 'Dependent children')} value={enf} onChange={setEnf} max={20} lang={l} help={T(l, 'Abattements dès 3 enfants', 'Allowances from 3 children')} />}
          </Row2>
          <Row2>
            <Toggle id={`${id}-hand`} label={T(l, 'Carte mobilité inclusion invalidité', 'Disability mobility card')} value={hand} onChange={setHand} options={[{ value: '0', label: T(l, 'Non', 'No') }, { value: '1', label: T(l, 'Oui', 'Yes') }]} />
            {ene === 'hybride_rechargeable'
              ? <NumberField id={`${id}-auto`} label={T(l, 'Autonomie électrique', 'Electric range')} value={auto} onChange={setAuto} unit="km" max={500} lang={l} />
              : <div />}
          </Row2>
          <Row2>
            <NumberField id={`${id}-ay`} label={T(l, 'Année de la demande', 'Year of application')} value={anOp} onChange={setAnOp} max={2100} lang={l} />
            <SelectField id={`${id}-am`} label={T(l, 'Mois de la demande', 'Month of application')} value={moOp} onChange={setMoOp} options={moisOptions(l)} />
          </Row2>
        </div>
      </details>
    </>} result={<>
      <Head label={T(l, `Carte grise · ${regionNom(reg, l)}`, `Registration · ${regionNom(reg, l)}`)} value={eur(r.total, l, 2)} sub={T(l, 'taxes dues, case par case', 'taxes due, box by box')} />
      <Rows rows={rows} />
      {r.total > 0 && <div className="mt-4"><StackedBar ariaPrefix={T(l, 'Répartition du montant', 'Breakdown')} total={r.total} segments={segs} /></div>}
      <Note>{ecart > 0.5
        ? T(l, `Même véhicule dans la région la moins chère (${regionNom(moinsCher.region, l)})${sep(l)}${eur(moinsCher.total, l, 2)}, soit ${eur(ecart, l)} de moins. La région qui compte est celle de votre domicile.`, `Same vehicle in the cheapest region (${regionNom(moinsCher.region, l)})${sep(l)}${eur(moinsCher.total, l, 2)}, ${eur(ecart, l)} less. What counts is the region where you live.`)
        : T(l, 'Votre région est déjà parmi les moins chères pour ce véhicule.', 'Your region is already among the cheapest for this vehicle.')}</Note>
      {m.notes.includes('plafond_cumul') && <Note>{T(l, `Cumul des deux malus plafonné à ${eur(m.plafond, l)}.`, `Both maluses together are capped at ${eur(m.plafond, l)}.`)}</Note>}
      {m.soumis && m.decote > 0 && <Note>{T(l, `Décote de l’occasion importée retirée des malus${sep(l)}${Math.round(m.decote * 100)} %.`, `Used-import reduction taken off the maluses${sep(l)}${Math.round(m.decote * 100)}%.`)}</Note>}
      {m.notes.includes('avant_2015') && <Note>{T(l, 'Première immatriculation avant le 1er janvier 2015 : aucun malus.', 'First registered before 1 January 2015: no malus.')}</Note>}
      {m.notes.includes('nedc') && <Note>{T(l, 'Véhicule mis en circulation avant 2020 : son malus suit le barème NEDC, que ce calcul n’intègre pas. Le total ci-dessus l’exclut.', 'Vehicle first registered before 2020: its malus follows the NEDC scale, which this calculation leaves out. The total above excludes it.')}</Note>}
      {r.etiquette && <Note>{T(l, `Pas de nouveau titre : vous recevez une étiquette à coller sur la carte grise. Au-delà de ${P.national.adresse_gratuits} changements, un nouveau titre est édité pour ${eurx(P.national.redevance, l)}.`, `No new certificate: you receive a sticker for the existing one. Beyond ${P.national.adresse_gratuits} changes, a new certificate is printed for ${eurx(P.national.redevance, l)}.`)}</Note>}
      <Note>{ANTS(l)}</Note>
      <MethodLink href={methodHref} lang={l} />
    </>} />
  );
}
