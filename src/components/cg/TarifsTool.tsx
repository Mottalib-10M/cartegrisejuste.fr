/**
 * Tarif du cheval fiscal des 18 régions, avec date d'effet, et taxe régionale recalculée pour la
 * puissance choisie. Moteur : taxeRegionale (lib/engine/carte-grise.ts).
 */
import { useEffect, useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import Toggle from '../ui/Toggle';
import SelectField from '../ui/SelectField';
import { P } from '../../lib/engine/params';
import { taxeRegionale, tarifRegion, exonerationRegionale, majorationIdfm } from '../../lib/engine/carte-grise';
import { readParams, num, str, updateURL } from '../../lib/url-state';
import { MethodLink } from '../calc/kit';
import { T, eur, eurx, sep, ANTS, iso, type L } from './labels';
import { displayDate } from '../../lib/format';

const BUILD_Y = Number(__BUILD_DAY__.slice(0, 4));

export default function TarifsTool({ lang = 'fr', methodHref, id = 'tarifs' }: { lang?: L; methodHref?: string; id?: string }) {
  const l = lang;
  const [cv, setCv] = useState(6);
  const [vieux, setVieux] = useState('0');
  const [ev, setEv] = useState('0');
  const [day, setDay] = useState(__BUILD_DAY__);
  const [an, setAn] = useState(String(BUILD_Y));
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setDay(today);
    const u = readParams(window.location.search);
    setAn(str(u, 'an', String(new Date().getFullYear())));
    if (![...u.keys()].length) return;
    setCv(num(u, 'cv', 6)); setVieux(str(u, 'v', '0')); setEv(str(u, 'ev', '0'));
  }, []);
  useEffect(() => { updateURL({ cv, v: vieux, ev, an }); }, [cv, vieux, ev, an]);
  // Date de référence : aujourd'hui pour l'année en cours, 1er janvier pour une autre année.
  const dateOp = an === day.slice(0, 4) ? day : iso(Number(an), 1, 15);
  const rows = useMemo(() => P.regions.map((r) => {
    const y = taxeRegionale({ cv, region: r.id, date1re: vieux === '1' ? iso(Number(dateOp.slice(0, 4)) - 11, 1, 1) : dateOp, dateOp, energie: ev === '1' ? 'electrique' : 'essence', demarche: 'titulaire' });
    const t = tarifRegion(r.id, dateOp);
    return { r, t, y, exo: exonerationRegionale(r.id, 'electrique', dateOp), idfm: r.idfm ? majorationIdfm(dateOp) : 0 };
  }), [cv, vieux, ev, dateOp]);
  const tx = rows.map((x) => x.y.y1);
  const min = Math.min(...tx), max = Math.max(...tx);
  const fmtD = (d: string | null) => (d ? displayDate(d, l === 'fr' ? 'fr-FR' : 'en-GB') : T(l, 'date inconnue', 'date unknown'));
  const annees = [...new Set(P.regions.flatMap((r) => r.tarifs.map((t) => (t.from ?? '').slice(0, 4))))].filter((y) => Number(y) >= 2026).sort();
  if (!annees.includes(String(BUILD_Y + 1))) annees.push(String(BUILD_Y + 1));
  return (
    <div className="rechner not-prose rounded-xl border border-navy-200 bg-white p-4 sm:p-6" data-chrome data-calc={id}>
      <form onSubmit={(e) => e.preventDefault()} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField id={`${id}-cv`} label={T(l, 'Puissance fiscale', 'Fiscal horsepower')} value={cv} onChange={setCv} unit="CV" max={200} lang={l} />
        <Toggle id={`${id}-v`} label={T(l, 'Plus de 10 ans', 'Over 10 years old')} value={vieux} onChange={setVieux} options={[{ value: '0', label: T(l, 'Non', 'No') }, { value: '1', label: T(l, 'Oui', 'Yes') }]} />
        <Toggle id={`${id}-ev`} label={T(l, 'Électrique', 'Electric')} value={ev} onChange={setEv} options={[{ value: '0', label: T(l, 'Non', 'No') }, { value: '1', label: T(l, 'Oui', 'Yes') }]} />
        <SelectField id={`${id}-an`} label={T(l, 'Tarifs en vigueur en', 'Rates in force in')} value={an} onChange={setAn} options={annees.map((y) => ({ value: y, label: y }))} />
      </form>
      <input type="range" min={1} max={20} step={1} value={Math.min(20, Math.max(1, Math.round(cv)))} onChange={(e) => setCv(Number(e.target.value))} aria-label={T(l, 'Curseur de puissance fiscale, de 1 à 20 CV', 'Fiscal horsepower slider, 1 to 20 CV')} className="mt-4 w-full accent-accent-600" />
      <div data-resultat className="mt-5 rounded-xl border border-accent-200 bg-accent-50/60 p-4">
        <p className="text-sm font-medium text-navy-700">{T(l, `Taxe régionale pour ${Math.round(cv)} CV${sep(l)}de`, `Regional tax for ${Math.round(cv)} CV${sep(l)}from`)}</p>
        <p className="tabular-nums mt-1 text-3xl font-bold text-navy-900">{eur(min, l)} {T(l, 'à', 'to')} {eur(max, l)}</p>
        <p className="mt-1 text-sm text-navy-700">{T(l, `soit ${eur(max - min, l)} d’écart selon la région du domicile`, `a ${eur(max - min, l)} gap depending on the region you live in`)}</p>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="journal w-full text-sm">
          <thead><tr>
            <th scope="col" className="px-2 py-2 text-left">{T(l, 'Région', 'Region')}</th>
            <th scope="col" className="px-2 py-2 text-right">{T(l, '€ par CV', '€ per CV')}</th>
            <th scope="col" className="px-2 py-2 text-left">{T(l, 'Depuis le', 'Since')}</th>
            <th scope="col" className="px-2 py-2 text-right">{T(l, `Y1 pour ${Math.round(cv)} CV`, `Y1 for ${Math.round(cv)} CV`)}</th>
            <th scope="col" className="px-2 py-2 text-left">{T(l, 'Électrique', 'Electric')}</th>
          </tr></thead>
          <tbody>{rows.map(({ r, t, y, exo, idfm }) => (
            <tr key={r.id} className="border-b border-navy-100">
              <th scope="row" className="px-2 py-2 text-left font-normal text-navy-900">{r.nom[l]}</th>
              <td className="tabular-nums px-2 py-2 text-right">{eurx(t.cv + idfm, l)}{idfm > 0 && <span className="block text-xs text-navy-600">{T(l, `dont ${eurx(idfm, l)} IDFM`, `incl. ${eurx(idfm, l)} IDFM`)}</span>}</td>
              <td className="px-2 py-2 text-navy-700">{fmtD(t.from)}{!t.dateVerifiee && <span className="block text-xs text-amber-800">{T(l, 'date non vérifiée', 'date not verified')}</span>}</td>
              <td className="tabular-nums px-2 py-2 text-right font-semibold text-navy-900">{eur(y.y1, l, 2)}</td>
              <td className="px-2 py-2 text-navy-700">{exo >= 1 ? T(l, 'exonéré', 'exempt') : exo > 0 ? T(l, `moitié du tarif`, `half rate`) : T(l, 'tarif plein', 'full rate')}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-navy-700">{T(l, 'Taxe fixe et redevance d’acheminement en plus, partout : ', 'Fixed tax and delivery fee on top, everywhere: ')}{eurx(P.national.taxe_fixe + P.national.redevance, l)}. {ANTS(l)}</p>
      <MethodLink href={methodHref} lang={l} />
    </div>
  );
}
