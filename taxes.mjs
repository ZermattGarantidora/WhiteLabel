export const TAXES = Object.freeze([
  {id:'iss', label:'ISS', withholdingLabel:'ISS'},
  {id:'pis', label:'PIS', withholdingLabel:'PIS'},
  {id:'cofins', label:'Cofins', withholdingLabel:'Cofins'},
  {id:'irpj', label:'IRPJ', withholdingLabel:'IRRF'},
  {id:'csll', label:'CSLL', withholdingLabel:'CSLL'}
].map(Object.freeze));

// An example to opt into, never a presumed tax classification or withholding rule.
export const EXAMPLE_TAX_RATES = Object.freeze({iss:5, pis:0.65, cofins:3, irpj:4.8, csll:2.88});

export function parseTaxRate(value) {
  const raw = String(value).trim();
  if (!/^\d{1,3}(?:[,.]\d{1,4})?$/.test(raw)) return NaN;
  const rate = Number(raw.replace(',', '.'));
  return rate <= 100 ? rate : NaN;
}

function rateUnits(rate) {
  if (!Number.isFinite(rate) || rate < 0 || rate > 100 || Number(rate.toFixed(4)) !== rate) {
    throw new RangeError('Use alíquotas entre 0% e 100%, com até quatro casas decimais.');
  }
  return Math.round(rate * 10000);
}

export function calculateCommissionTaxes(monthlyCommission, configuration, months = 1) {
  if (!Number.isFinite(monthlyCommission) || monthlyCommission < 0 || monthlyCommission > 1e12 || ![1,12].includes(months)) {
    throw new RangeError('Comissão ou período inválido.');
  }
  const baseCents = Math.round(monthlyCommission * 100);
  const monthlyTax = units => Number((BigInt(baseCents) * BigInt(units) + 500000n) / 1000000n);
  const rows = TAXES.map(tax => {
    const entry = configuration?.[tax.id];
    const units = rateUnits(entry?.rate);
    const withholdingUnits = entry?.withholdingRate == null ? null : rateUnits(entry.withholdingRate);
    const taxCents = entry.monthlyTaxCents ?? monthlyTax(units);
    if (!Number.isSafeInteger(taxCents) || taxCents < 0 || taxCents > baseCents) {
      throw new RangeError('Valor mensal do tributo inválido.');
    }
    return {...tax, rate:entry.rate, withholdingRate:entry.withholdingRate ?? null, units, withholdingUnits,
      taxCents, withheldCents:withholdingUnits === null ? null : monthlyTax(withholdingUnits)};
  });
  if (rows.reduce((sum,row) => sum + Math.max(row.units,row.withholdingUnits ?? 0),0) > 1000000) {
    throw new RangeError('A soma dos descontos não pode ultrapassar 100% da comissão.');
  }
  const withholdingComplete = rows.every(row => row.withheldCents !== null);
  const taxCents = rows.reduce((sum,row) => sum + row.taxCents,0);
  const withheldCents = withholdingComplete ? rows.reduce((sum,row) => sum + row.withheldCents,0) : null;
  const outstandingCents = withholdingComplete ? rows.reduce((sum,row) => sum + Math.max(0,row.taxCents-row.withheldCents),0) : null;
  const creditCents = withholdingComplete ? rows.reduce((sum,row) => sum + Math.max(0,row.withheldCents-row.taxCents),0) : null;
  const netCents = withholdingComplete ? baseCents-withheldCents-outstandingCents : baseCents-taxCents;
  if (netCents < 0) throw new RangeError('Os descontos arredondados ultrapassam a comissão. Revise as alíquotas.');
  const money = cents => cents === null ? null : cents * months / 100;
  return {
    months, grossCommission:money(baseCents), taxTotal:money(taxCents), net:money(netCents), withholdingComplete,
    withheldTotal:money(withheldCents), payable:withholdingComplete ? money(baseCents-withheldCents) : null,
    taxesToPay:money(outstandingCents), taxCredits:money(creditCents),
    rows:rows.map(row => ({id:row.id, label:row.label, withholdingLabel:row.withholdingLabel, rate:row.rate,
      withholdingRate:row.withholdingRate, amount:money(row.taxCents), withheld:money(row.withheldCents)}))
  };
}
