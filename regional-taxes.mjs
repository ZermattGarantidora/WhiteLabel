// Snapshot reviewed on 2026-11-18. See docs/commission-taxes.md for sources and scope.
// UF alone does not determine municipal ISS or the franchisee's tax regime.
export const TAX_REFERENCE_DATE = '18/11/2026';
export const BRAZILIAN_STATES = Object.freeze([
  ['AC','Acre'],['AL','Alagoas'],['AP','Amapá'],['AM','Amazonas'],['BA','Bahia'],['CE','Ceará'],
  ['DF','Distrito Federal'],['ES','Espírito Santo'],['GO','Goiás'],['MA','Maranhão'],['MT','Mato Grosso'],
  ['MS','Mato Grosso do Sul'],['MG','Minas Gerais'],['PA','Pará'],['PB','Paraíba'],['PR','Paraná'],
  ['PE','Pernambuco'],['PI','Piauí'],['RJ','Rio de Janeiro'],['RN','Rio Grande do Norte'],
  ['RS','Rio Grande do Sul'],['RO','Rondônia'],['RR','Roraima'],['SC','Santa Catarina'],
  ['SP','São Paulo'],['SE','Sergipe'],['TO','Tocantins']
].map(([code,name])=>Object.freeze({code,name})));

export function getRegionalTaxReference(stateCode, monthlyCommission) {
  const state = BRAZILIAN_STATES.find(item=>item.code===stateCode);
  if (!state) throw new RangeError('Selecione um estado válido para o franqueado.');
  if (!Number.isFinite(monthlyCommission) || monthlyCommission < 0 || monthlyCommission > 6500000) {
    throw new RangeError('Referência de lucro presumido limitada a R$ 78 milhões anuais. Para outro enquadramento, informe as alíquotas da contabilidade.');
  }
  const quarterlyRevenue = BigInt(Math.round(monthlyCommission*100))*3n;
  const normalRevenue = quarterlyRevenue > 125000000n ? 125000000n : quarterlyRevenue;
  const excessRevenue = quarterlyRevenue-normalRevenue;
  // Base scaled by 1000: 32% up to R$ 1.25m/quarter; 35.2% on the excess (LC 224/2025).
  const presumedBase = normalRevenue*320n + excessRevenue*352n;
  const additionalBase = presumedBase > 6000000000n ? presumedBase-6000000000n : 0n;
  const incomeTax = presumedBase*15n + additionalBase*10n;
  const socialTax = presumedBase*9n;
  // Monthly provision = a quarter of equal revenues divided by three, rounded in cents.
  const monthlyCents = scaledQuarterlyTax => Number((scaledQuarterlyTax+150000n)/300000n);
  const effectiveRate = tax => quarterlyRevenue === 0n ? 0 : Number((Number(tax)/Number(quarterlyRevenue)/1000).toFixed(4));
  return {
    state, payerState:'PR', reviewedAt:TAX_REFERENCE_DATE,
    rates:{iss:5, pis:0.65, cofins:3, irpj:effectiveRate(incomeTax), csll:effectiveRate(socialTax)},
    monthlyTaxCents:{irpj:monthlyCents(incomeTax), csll:monthlyCents(socialTax)},
    additionalIRPJ:monthlyCents(additionalBase*10n)/100,
    increasedPresumption:excessRevenue > 0n,
    assumptions:'Lucro presumido para serviços de intermediação entre PJs; três meses iguais, somente esta comissão, sem benefícios ou créditos. Referência do 4º trimestre de 2026; regime real não informado.'
  };
}
