/**
 * Puissance fiscale estimée : voiture d'après les kW (case P.2, formule en vigueur depuis 2021) ou
 * deux-roues d'après la cylindrée (case P.1). La case P.6 du titre fait foi.
 */
import { useEffect, useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import Toggle from '../ui/Toggle';
import { P } from '../../lib/engine/params';
import { chevauxFiscaux, chevauxMoto, taxeRegionale } from '../../lib/engine/carte-grise';
import { readParams, num, str, updateURL } from '../../lib/url-state';
import { Shell, Row2, Head, Rows, Note, MethodLink } from '../calc/kit';
import { T, eur, eurx, regionOptions, regionNom, type L } from './labels';
import { formatNumber } from '../../lib/format';

export default function CvTool({ lang = 'fr', methodHref, id = 'cv' }: { lang?: L; methodHref?: string; id?: string }) {
  const l = lang;
  const [type, setType] = useState('vp');
  const [kw, setKw] = useState(96);
  const [cc, setCc] = useState(650);
  const [reg, setReg] = useState('ile-de-france');
  useEffect(() => { const u = readParams(window.location.search); if (![...u.keys()].length) return; setType(str(u, 't', 'vp')); setKw(num(u, 'kw', 96)); setCc(num(u, 'cc', 650)); setReg(str(u, 'r', 'ile-de-france')); }, []);
  useEffect(() => { updateURL({ t: type, kw, cc, r: reg }); }, [type, kw, cc, reg]);
  const moto = type === 'moto';
  const c = chevauxFiscaux(kw);
  const cv = moto ? chevauxMoto(cc) : c.arrondi;
  const y1 = useMemo(() => taxeRegionale({ cv, region: reg, date1re: __BUILD_DAY__, dateOp: __BUILD_DAY__, energie: 'essence', demarche: 'titulaire', genre: moto ? 'moto' : 'vp' }), [cv, reg, moto]);
  const f = P.puissance_fiscale;
  const x = kw / 100;
  return (
    <Shell id={id} form={<>
      <Toggle id={`${id}-t`} label={T(l, 'Véhicule', 'Vehicle')} value={type} onChange={setType} options={[{ value: 'vp', label: T(l, 'Voiture', 'Car') }, { value: 'moto', label: T(l, 'Moto, scooter', 'Motorbike') }]} />
      <Row2>
        {moto
          ? <NumberField id={`${id}-cc`} label={T(l, 'Cylindrée (case P.1)', 'Engine size (box P.1)')} value={cc} onChange={setCc} unit="cm³" max={3000} lang={l} />
          : <NumberField id={`${id}-kw`} label={T(l, 'Puissance nette maximale (case P.2)', 'Maximum net power (box P.2)')} value={kw} onChange={setKw} unit="kW" max={2000} lang={l} help={T(l, `Soit ${formatNumber(kw * f.ch_par_kw, 0, l)} ch environ`, `About ${formatNumber(kw * f.ch_par_kw, 0, l)} hp`)} />}
        <SelectField id={`${id}-reg`} label={T(l, 'Région, pour la taxe correspondante', 'Region, for the matching tax')} value={reg} onChange={setReg} options={regionOptions(l)} />
      </Row2>
    </>} result={<>
      <Head label={T(l, 'Puissance fiscale estimée', 'Estimated fiscal horsepower')} value={`${cv} CV`} sub={moto ? T(l, 'barème de la cylindrée', 'engine-size scale') : T(l, `formule : ${formatNumber(c.formule, 2, l)}, arrondie à l’unité`, `formula: ${formatNumber(c.formule, 2, l)}, rounded`)} />
      <Rows rows={[
        ...(!moto ? [
          [T(l, `${formatNumber(f.a, 2, l)} × (kW ÷ 100)²`, `${formatNumber(f.a, 2, l)} × (kW ÷ 100)²`), formatNumber(f.a * x * x, 2, l)] as [string, string],
          [T(l, `${formatNumber(f.b, 2, l)} × (kW ÷ 100)`, `${formatNumber(f.b, 2, l)} × (kW ÷ 100)`), formatNumber(f.b * x, 2, l)] as [string, string],
          [T(l, 'Terme fixe', 'Constant'), formatNumber(f.c, 2, l)] as [string, string],
        ] : []),
        [T(l, `Taxe régionale ${regionNom(reg, l)}${moto ? ', moitié pour un deux-roues' : ', moins de 10 ans'}`, `Regional tax ${regionNom(reg, l)}${moto ? ', half for a motorbike' : ', under 10 years'}`), eur(y1.y1, l, 2)],
        [T(l, 'Tarif du cheval fiscal', 'Rate per fiscal horsepower'), eurx(y1.tarif + y1.idfm, l)],
      ]} />
      <Note>{moto
        ? T(l, 'Estimation pour un deux-roues thermique ; la case P.6 du titre fait foi.', 'Estimate for a petrol motorbike; box P.6 of the certificate is what counts.')
        : T(l, 'Formule des voitures immatriculées depuis 2021. Pour une voiture plus ancienne, la valeur de la case P.6 fait foi : c’est elle que l’ANTS retient.', 'Formula for cars registered since 2021. For an older car, the value in box P.6 is what counts, and the one the ANTS uses.')}</Note>
      <MethodLink href={methodHref} lang={l} />
    </>} />
  );
}
