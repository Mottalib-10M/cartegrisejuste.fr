/** Un même véhicule dans les 18 régions, trié, avec l'écart en euros. Moteur : comparerRegions. */
import { useEffect, useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import Toggle from '../ui/Toggle';
import { comparerRegions, ENERGIES, type Energie, type Demarche } from '../../lib/engine/carte-grise';
import { readParams, num, str, updateURL } from '../../lib/url-state';
import { MethodLink } from '../calc/kit';
import { T, eur, regionNom, ENERGIE, DEMARCHE, ANTS, iso, type L } from './labels';

const DEM: Demarche[] = ['titulaire', 'immat'];

export default function CompareTool({ lang = 'fr', methodHref, id = 'comparer' }: { lang?: L; methodHref?: string; id?: string }) {
  const l = lang;
  const [cv, setCv] = useState(7);
  const [ene, setEne] = useState<Energie>('electrique');
  const [vieux, setVieux] = useState('0');
  const [dem, setDem] = useState<Demarche>('titulaire');
  const [day, setDay] = useState(__BUILD_DAY__);
  useEffect(() => {
    setDay(new Date().toISOString().slice(0, 10));
    const u = readParams(window.location.search); if (![...u.keys()].length) return;
    setCv(num(u, 'cv', 7)); setEne(str(u, 'e', 'electrique') as Energie); setVieux(str(u, 'v', '0')); setDem(str(u, 'd', 'titulaire') as Demarche);
  }, []);
  useEffect(() => { updateURL({ cv, e: ene, v: vieux, d: dem }); }, [cv, ene, vieux, dem]);
  const date1re = vieux === '1' ? iso(Number(day.slice(0, 4)) - 11, 1, 1) : day;
  const list = useMemo(() => comparerRegions({ demarche: dem, region: 'ile-de-france', origine: dem === 'immat' ? 'france_neuf' : 'france_occasion', energie: ene, genre: 'vp', cv, date1re, dateOp: day, gkm: 0, masseKg: 0, ptacKg: 0 }), [cv, ene, date1re, day, dem]);
  const min = list[0].total, max = list[list.length - 1].total;
  return (
    <div className="rechner not-prose rounded-xl border border-navy-200 bg-white p-4 sm:p-6" data-chrome data-calc={id}>
      <form onSubmit={(e) => e.preventDefault()} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField id={`${id}-cv`} label={T(l, 'Puissance fiscale', 'Fiscal horsepower')} value={cv} onChange={setCv} unit="CV" max={200} lang={l} />
        <SelectField id={`${id}-e`} label={T(l, 'Énergie', 'Fuel')} value={ene} onChange={(v) => setEne(v as Energie)} options={ENERGIES.map((e) => ({ value: e, label: ENERGIE[l][e] }))} />
        <Toggle id={`${id}-v`} label={T(l, 'Plus de 10 ans', 'Over 10 years old')} value={vieux} onChange={setVieux} options={[{ value: '0', label: T(l, 'Non', 'No') }, { value: '1', label: T(l, 'Oui', 'Yes') }]} />
        <SelectField id={`${id}-d`} label={T(l, 'Démarche', 'Procedure')} value={dem} onChange={(v) => setDem(v as Demarche)} options={DEM.map((d) => ({ value: d, label: DEMARCHE[l][d] }))} />
      </form>
      <div data-resultat className="mt-5 rounded-xl border border-accent-200 bg-accent-50/60 p-4">
        <p className="text-sm font-medium text-navy-700">{T(l, 'Différence entre le tarif régional le plus bas et le plus haut', 'Gap between the cheapest and the dearest region')}</p>
        <p className="tabular-nums mt-1 text-3xl font-bold text-navy-900">{eur(max - min, l)}</p>
        <p className="mt-1 text-sm text-navy-700">{T(l, `${regionNom(list[0].region, l)} ${eur(min, l, 2)} · ${regionNom(list[list.length - 1].region, l)} ${eur(max, l, 2)}`, `${regionNom(list[0].region, l)} ${eur(min, l, 2)} · ${regionNom(list[list.length - 1].region, l)} ${eur(max, l, 2)}`)}</p>
      </div>
      <ol className="mt-4 divide-y divide-navy-100 text-sm">
        {list.map((x, i) => {
          const w = max > 0 ? Math.max(2, (x.total / max) * 100) : 0;
          return (
            <li key={x.region} className="grid grid-cols-[1.5rem_minmax(0,1fr)_6.5rem] items-center gap-2 py-1.5">
              <span className="tabular-nums text-navy-500">{i + 1}</span>
              <span className="min-w-0"><span className="block truncate text-navy-900">{regionNom(x.region, l)}</span><span className="mt-1 block h-1.5 rounded bg-accent-600" style={{ width: `${w}%` }} aria-hidden="true" /></span>
              <span className="tabular-nums text-right text-navy-900">{eur(x.total, l, 2)}{x.total - min > 0.5 && <span className="block text-xs text-navy-600">+{eur(x.total - min, l)}</span>}</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm text-navy-700">{T(l, 'Montants totaux (Y1 + Y4 + Y5), sans malus : c’est l’adresse du titulaire qui fixe la région, pas le lieu d’achat.', 'Totals (Y1 + Y4 + Y5), without malus: the holder’s address sets the region, not where the car was bought.')} {ANTS(l)}</p>
      <MethodLink href={methodHref} lang={l} />
    </div>
  );
}
