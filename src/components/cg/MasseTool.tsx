/** Malus au poids : calcul par tranche, abattements, plafond commun avec le malus CO₂. Moteur : malus(). */
import { useEffect, useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import { P } from '../../lib/engine/params';
import { malus, anneeMasse, type Energie } from '../../lib/engine/carte-grise';
import { readParams, num, str, updateURL } from '../../lib/url-state';
import { Shell, Row2, Head, Rows, Note, MethodLink } from '../calc/kit';
import { T, eur, ENERGIE, ANTS, type L } from './labels';

const EN: Energie[] = ['essence', 'diesel', 'micro_hybride', 'hybride', 'hybride_rechargeable', 'electrique'];

export default function MasseTool({ lang = 'fr', methodHref, id = 'masse' }: { lang?: L; methodHref?: string; id?: string }) {
  const l = lang;
  const [kg, setKg] = useState(1850);
  const [g, setG] = useState(120);
  const [ene, setEne] = useState<Energie>('essence');
  const [enf, setEnf] = useState(0);
  const [auto, setAuto] = useState(60);
  const [day, setDay] = useState(__BUILD_DAY__);
  useEffect(() => {
    setDay(new Date().toISOString().slice(0, 10));
    const u = readParams(window.location.search); if (![...u.keys()].length) return;
    setKg(num(u, 'kg', 1850)); setG(num(u, 'g', 120)); setEne(str(u, 'e', 'essence') as Energie); setEnf(num(u, 'enf', 0)); setAuto(num(u, 'auto', 60));
  }, []);
  useEffect(() => { updateURL({ kg, g, e: ene, enf, auto }); }, [kg, g, ene, enf, auto]);
  const r = useMemo(() => malus({ gkm: g, masseKg: kg, energie: ene, dateOp: day, date1re: day, origine: 'france_neuf', enfants: enf, autonomieKm: auto }), [g, kg, ene, enf, auto, day]);
  const annee = anneeMasse(day) ?? '2026';
  const B = P.malus_masse.annees[annee];
  const tranches = (B?.tranches ?? []).map((t) => {
    const hi = t.max === null ? Infinity : t.max;
    const kgT = r.masseTaxable >= t.min ? Math.min(r.masseTaxable, hi) - t.min + 1 : 0;
    const lab = t.max === null
      ? T(l, `À partir de ${t.min} kg · ${t.euro_kg} € par kg`, `From ${t.min} kg · €${t.euro_kg} per kg`)
      : T(l, `De ${t.min} à ${t.max} kg · ${t.euro_kg} € par kg`, `${t.min} to ${t.max} kg · €${t.euro_kg} per kg`);
    return [lab, eur(kgT * t.euro_kg, l)] as [string, string];
  }).filter(([, v]) => v !== eur(0, l));
  return (
    <Shell id={id} form={<>
      <Row2>
        <NumberField id={`${id}-kg`} label={T(l, 'Masse en ordre de marche (case G)', 'Mass in running order (box G)')} value={kg} onChange={setKg} unit="kg" max={10000} lang={l} />
        <SelectField id={`${id}-e`} label={T(l, 'Énergie', 'Fuel')} value={ene} onChange={(v) => setEne(v as Energie)} options={EN.map((e) => ({ value: e, label: ENERGIE[l][e] }))} />
      </Row2>
      <Row2>
        <NumberField id={`${id}-enf`} label={T(l, 'Enfants à charge', 'Dependent children')} value={enf} onChange={setEnf} max={20} lang={l} />
        {ene === 'hybride_rechargeable'
          ? <NumberField id={`${id}-auto`} label={T(l, 'Autonomie électrique', 'Electric range')} value={auto} onChange={setAuto} unit="km" max={500} lang={l} />
          : <NumberField id={`${id}-g`} label={T(l, 'CO₂ WLTP, pour le plafond', 'CO₂ WLTP, for the cap')} value={g} onChange={setG} unit="g/km" max={1000} lang={l} />}
      </Row2>
    </>} result={<>
      <Head label={T(l, `Malus au poids, voiture neuve en ${day.slice(0, 4)}`, `Weight malus, new car in ${day.slice(0, 4)}`)} value={eur(r.masse, l)} sub={r.notes.includes('masse_exo_energie') ? T(l, 'électrique ou hydrogène : exonéré', 'electric or hydrogen: exempt') : r.notes.includes('masse_exo_phev') ? T(l, 'hybride rechargeable exonéré', 'plug-in hybrid exempt') : T(l, `sur ${r.masseTaxable} kg retenus, seuil ${B?.tranches[0].min ?? '–'} kg`, `on ${r.masseTaxable} kg counted, threshold ${B?.tranches[0].min ?? '–'} kg`)} />
      <Rows rows={[
        ...tranches,
        ...(r.masseAbattementKg > 0 ? [[T(l, 'Abattement de masse appliqué', 'Mass allowance applied'), `${r.masseAbattementKg} kg`] as [string, string]] : []),
        [T(l, 'Malus CO₂ du même véhicule', 'CO₂ malus of the same car'), eur(r.co2, l)],
        [T(l, 'Les deux malus', 'Both maluses'), eur(r.total, l), true],
      ]} />
      {r.notes.includes('plafond_cumul') && <Note>{T(l, `Plafond commun atteint : ${eur(r.plafond, l)}.`, `Shared cap reached: ${eur(r.plafond, l)}.`)}</Note>}
      <Note>{ANTS(l)}</Note>
      <MethodLink href={methodHref} lang={l} />
    </>} />
  );
}
