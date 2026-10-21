/**
 * Malus CO₂ d'une voiture : neuve (barème de l'année d'immatriculation) ou importée d'occasion
 * (barème de l'année de sa première immatriculation, puis décote selon l'âge). Moteur : malus().
 */
import { useEffect, useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import { P } from '../../lib/engine/params';
import { malus, malusCO2Brut, anneeBareme, type MalusYear } from '../../lib/engine/carte-grise';
import { readParams, num, str, updateURL } from '../../lib/url-state';
import { Shell, Row2, Head, Rows, Note, MethodLink } from '../calc/kit';
import { T, eur, sep, ANTS, iso, moisOptions, type L } from './labels';

const NEUFS: MalusYear[] = ['2025', '2026', '2027'];

export default function Co2Tool({ lang = 'fr', methodHref, id = 'co2' }: { lang?: L; methodHref?: string; id?: string }) {
  const l = lang;
  const [g, setG] = useState(150);
  const [enf, setEnf] = useState(0);
  const [an1, setAn1] = useState('neuf');
  const [mo1, setMo1] = useState('6');
  const [day, setDay] = useState(__BUILD_DAY__);
  useEffect(() => {
    setDay(new Date().toISOString().slice(0, 10));
    const u = readParams(window.location.search); if (![...u.keys()].length) return;
    setG(num(u, 'g', 150)); setEnf(num(u, 'enf', 0)); setAn1(str(u, 'y', 'neuf')); setMo1(str(u, 'm', '6'));
  }, []);
  useEffect(() => { updateURL({ g, enf, y: an1, m: mo1 }); }, [g, enf, an1, mo1]);
  const neuf = an1 === 'neuf';
  const date1re = neuf ? day : iso(Number(an1), Number(mo1), 1);
  const r = useMemo(() => malus({ gkm: g, masseKg: 0, energie: 'essence', date1re, dateOp: day, origine: neuf ? 'france_neuf' : 'import_occasion', enfants: enf }), [g, enf, date1re, day, neuf]);
  const F = P.malus_co2.famille;
  const y0 = Number(day.slice(0, 4));
  const annees = Array.from({ length: y0 - 2014 }, (_, i) => String(y0 - i));
  const opts = [{ value: 'neuf', label: T(l, 'Voiture neuve, immatriculée aujourd’hui', 'New car, registered today') }, ...annees.map((y) => ({ value: y, label: T(l, `Importée d’occasion, 1re immatriculation en ${y}`, `Used import, first registered in ${y}`) }))];
  const gr = r.gRetenu;
  const head = r.notes.includes('nedc')
    ? T(l, 'barème NEDC, hors de ce calcul', 'NEDC scale, outside this tool')
    : eur(r.co2, l);
  return (
    <Shell id={id} form={<>
      <Row2>
        <NumberField id={`${id}-g`} label={T(l, 'Émissions de CO₂ (case V.7)', 'CO₂ emissions (box V.7)')} value={g} onChange={setG} unit="g/km" max={1000} lang={l} help={T(l, 'Valeur WLTP du certificat de conformité', 'WLTP value from the certificate of conformity')} />
        <NumberField id={`${id}-enf`} label={T(l, 'Enfants à charge', 'Dependent children')} value={enf} onChange={setEnf} max={20} lang={l} help={T(l, `${F.g_par_enfant} g/km retirés par enfant dès ${F.enfants_min}`, `${F.g_par_enfant} g/km off per child from ${F.enfants_min}`)} />
      </Row2>
      <Row2>
        <SelectField id={`${id}-y`} label={T(l, 'La voiture', 'The car')} value={an1} onChange={setAn1} options={opts} />
        {!neuf ? <SelectField id={`${id}-m`} label={T(l, 'Mois de 1re immatriculation', 'Month first registered')} value={mo1} onChange={setMo1} options={moisOptions(l)} /> : <div />}
      </Row2>
    </>} result={<>
      <Head label={T(l, `Malus CO₂ · barème ${r.annee}`, `CO₂ malus · ${r.annee} scale`)} value={head} sub={T(l, `pour ${gr} g/km retenus`, `for ${gr} g/km counted`)} />
      <Rows rows={[
        ...(!neuf && r.calcule && !r.notes.includes('avant_2015') ? [
          [T(l, `Barème ${r.annee} avant décote`, `${r.annee} scale before reduction`), eur(malusCO2Brut(gr, anneeBareme(date1re)), l)] as [string, string],
          [T(l, 'Décote selon l’âge', 'Age-based reduction'), `${Math.round(r.decote * 100)} %`] as [string, string],
        ] : []),
        ...NEUFS.map((y) => [T(l, `Neuve immatriculée en ${y} (dès ${P.malus_co2.annees[y].seuil} g/km)`, `New, registered in ${y} (from ${P.malus_co2.annees[y].seuil} g/km)`), eur(malusCO2Brut(gr, y), l), neuf && y === r.annee] as [string, string, boolean]),
      ]} />
      {r.notes.includes('avant_2015') && <Note>{T(l, 'Première immatriculation avant le 1er janvier 2015 : aucun malus.', 'First registered before 1 January 2015: no malus.')}</Note>}
      {r.notes.includes('nedc') && <Note>{T(l, `Avant 2020, le malus d’un import suit le barème NEDC${sep(l)}ce simulateur ne l’intègre pas.`, `Before 2020 an import’s malus follows the NEDC scale${sep(l)}this tool does not include it.`)}</Note>}
      <Note>{T(l, 'Le malus au poids s’ajoute, dans la limite d’un plafond commun.', 'The weight malus comes on top, within a shared cap.')} {ANTS(l)}</Note>
      <MethodLink href={methodHref} lang={l} />
    </>} />
  );
}
