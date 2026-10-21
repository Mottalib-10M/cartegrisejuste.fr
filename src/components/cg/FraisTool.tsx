/** Taxes dues + frais de service d'un professionnel habilité : ce qu'on paie sur le site de l'ANTS et ailleurs. */
import { useEffect, useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import Toggle from '../ui/Toggle';
import { coutCarteGrise } from '../../lib/engine/carte-grise';
import { readParams, num, str, updateURL } from '../../lib/url-state';
import { Shell, Row2, Head, Rows, Note, MethodLink } from '../calc/kit';
import { T, eur, regionOptions, ANTS, iso, type L } from './labels';

export default function FraisTool({ lang = 'fr', methodHref, id = 'frais' }: { lang?: L; methodHref?: string; id?: string }) {
  const l = lang;
  const [reg, setReg] = useState('auvergne-rhone-alpes');
  const [cv, setCv] = useState(5);
  const [vieux, setVieux] = useState('0');
  const [frais, setFrais] = useState(30);
  const [envoi, setEnvoi] = useState(0);
  const [day, setDay] = useState(__BUILD_DAY__);
  useEffect(() => {
    setDay(new Date().toISOString().slice(0, 10));
    const u = readParams(window.location.search); if (![...u.keys()].length) return;
    setReg(str(u, 'r', 'auvergne-rhone-alpes')); setCv(num(u, 'cv', 5)); setVieux(str(u, 'v', '0')); setFrais(num(u, 'f', 30)); setEnvoi(num(u, 'x', 0));
  }, []);
  useEffect(() => { updateURL({ r: reg, cv, v: vieux, f: frais, x: envoi }); }, [reg, cv, vieux, frais, envoi]);
  const date1re = vieux === '1' ? iso(Number(day.slice(0, 4)) - 11, 1, 1) : day;
  const r = useMemo(() => coutCarteGrise({ demarche: 'titulaire', region: reg, origine: 'france_occasion', energie: 'essence', genre: 'vp', cv, date1re, dateOp: day, gkm: 0, masseKg: 0, ptacKg: 0 }), [reg, cv, date1re, day]);
  const pro = r.total + frais + envoi;
  return (
    <Shell id={id} form={<>
      <Row2>
        <SelectField id={`${id}-r`} label={T(l, 'Région du domicile', 'Region of residence')} value={reg} onChange={setReg} options={regionOptions(l)} />
        <NumberField id={`${id}-cv`} label={T(l, 'Puissance fiscale', 'Fiscal horsepower')} value={cv} onChange={setCv} unit="CV" max={200} lang={l} />
      </Row2>
      <Row2>
        <Toggle id={`${id}-v`} label={T(l, 'Plus de 10 ans', 'Over 10 years old')} value={vieux} onChange={setVieux} options={[{ value: '0', label: T(l, 'Non', 'No') }, { value: '1', label: T(l, 'Oui', 'Yes') }]} />
        <NumberField id={`${id}-f`} label={T(l, 'Frais de service annoncés', 'Service fee quoted')} value={frais} onChange={setFrais} unit="€" max={2000} decimals={2} lang={l} help={T(l, 'Le montant affiché par le professionnel, hors taxes', 'The amount the business shows, excluding taxes')} />
      </Row2>
      <NumberField id={`${id}-x`} label={T(l, 'Options payantes (envoi suivi, plaques…)', 'Paid extras (tracked post, plates…)')} value={envoi} onChange={setEnvoi} unit="€" max={2000} decimals={2} lang={l} />
    </>} result={<>
      <Head label={T(l, 'Sur le site de l’ANTS', 'On the ANTS website')} value={eur(r.total, l, 2)} sub={T(l, 'les taxes seules, aucun frais de démarche', 'taxes only, no processing fee')} />
      <Rows rows={[
        [T(l, 'Taxes dues (Y1 + Y4 + Y5)', 'Taxes due (Y1 + Y4 + Y5)'), eur(r.total, l, 2)],
        [T(l, 'Frais du professionnel', 'Business fee'), eur(frais + envoi, l, 2)],
        [T(l, 'Total chez le professionnel', 'Total with the business'), eur(pro, l, 2), true],
        [T(l, 'Part du total qui n’est pas une taxe', 'Share of the total that is not tax'), pro > 0 ? `${Math.round(((frais + envoi) / pro) * 100)} %` : '0 %'],
      ]} />
      <Note>{ANTS(l)} {T(l, 'Un professionnel habilité peut faire la démarche pour vous : ses frais s’ajoutent aux taxes, jamais à leur place.', 'An approved business can apply for you: its fee comes on top of the taxes, never instead of them.')}</Note>
      <MethodLink href={methodHref} lang={l} />
    </>} />
  );
}
