import test from 'node:test';
import assert from 'node:assert/strict';
import {TAX_REFERENCE_DATE,getTaxReference} from '../tax-reference.mjs';
import {TAXES,calculateCommissionTaxes} from '../taxes.mjs';
import {calculatePortfolio} from '../model.mjs';
import {createSimulationSummary} from '../summary.mjs';

const configuration = reference=>Object.fromEntries(TAXES.map(tax=>[tax.id,{
  rate:reference.rates[tax.id],withholdingRate:null,
  ...(reference.monthlyTaxCents[tax.id]===undefined?{}:{monthlyTaxCents:reference.monthlyTaxCents[tax.id]})
}]));

test('referência calcula o líquido sem exigir localização do franqueado',()=>{
  assert.equal(TAX_REFERENCE_DATE,'18/11/2026');
  const reference=getTaxReference(1200);
  const result=calculateCommissionTaxes(1200,configuration(reference));
  assert.equal(Object.hasOwn(reference,'state'),false);
  assert.equal(Object.hasOwn(reference,'payerState'),false);
  assert.equal(reference.rates.iss,5);
  assert.equal(result.taxTotal,195.96);
  assert.equal(result.net,1004.04);
  assert.equal(result.payable,null);
});
test('faixa de ISS municipal continua ajustável sem alterar os tributos federais',()=>{
  const c=configuration(getTaxReference(1200));
  c.iss.rate=2;
  assert.equal(calculateCommissionTaxes(1200,c).net,1040.04);
  c.iss.rate=3;
  assert.equal(calculateCommissionTaxes(1200,c).net,1028.04);
});
test('adicional de IRPJ começa acima da base trimestral de R$ 60 mil',()=>{
  assert.equal(getTaxReference(62500).additionalIRPJ,0);
  const reference=getTaxReference(100000);
  assert.equal(reference.additionalIRPJ,1200);
  assert.equal(reference.rates.irpj,6);
  assert.equal(reference.monthlyTaxCents.irpj,600000);
  assert.equal(reference.monthlyTaxCents.csll,288000);
});
test('regra de 2026 majora a presunção somente no excedente trimestral',()=>{
  const reference=getTaxReference(500000);
  assert.equal(reference.increasedPresumption,true);
  assert.equal(reference.monthlyTaxCents.irpj,3866667);
  assert.equal(reference.monthlyTaxCents.csll,1464000);
  assert.equal(reference.additionalIRPJ,14266.67);
  assert.equal(reference.rates.irpj,7.7333);
  assert.equal(calculateCommissionTaxes(500000,configuration(reference)).net,403443.33);
});
test('precisão do valor apurado não depende das quatro casas do percentual exibido',()=>{
  const reference=getTaxReference(500000);
  const result=calculateCommissionTaxes(500000,configuration(reference));
  assert.equal(result.rows.find(row=>row.id==='irpj').amount,38666.67);
  assert.notEqual(Math.round(500000*reference.rates.irpj)/100,38666.67);
});
test('limite da referência de lucro presumido e carteira zero',()=>{
  const largest=getTaxReference(6500000);
  assert.equal(largest.monthlyTaxCents.irpj,56666667);
  const zero=getTaxReference(0);
  assert.equal(zero.monthlyTaxCents.irpj,0);
  assert.equal(zero.rates.irpj,0);
  assert.equal(zero.additionalIRPJ,0);
  assert.equal(zero.increasedPresumption,false);
});
for(const amount of [-1,NaN,Infinity,6500000.01,'1200']) {
  test(`rejeita valor fora da referência ${amount}`,()=>assert.throws(()=>getTaxReference(amount),RangeError));
}
for(const cents of [-1,Infinity,1.2,120001]) {
  test(`rejeita override mensal inválido ${cents}`,()=>{
    const c=configuration(getTaxReference(1200));c.irpj.monthlyTaxCents=cents;
    assert.throws(()=>calculateCommissionTaxes(1200,c),RangeError);
  });
}
test('resumo preserva vigência e ISS, sem solicitar ou exportar localização',()=>{
  const portfolio=calculatePortfolio(1,100000,4,30);
  const reference=getTaxReference(1200);
  const taxConfiguration=configuration(reference);
  const taxEstimate=calculateCommissionTaxes(1200,taxConfiguration);
  const text=createSimulationSummary({...portfolio,tiers:[],taxConfiguration,taxEstimate,
    taxScenario:reference.assumptions,
    taxReference:{reviewedAt:TAX_REFERENCE_DATE,automatic:true,
      netRange:{minimum:1004.04,maximum:1040.04}}
  }).replace(/\u00a0/g,' ');
  assert.doesNotMatch(text,/Pagadora:|Franqueado:|UF não informada|Município informado|Paraná \(PR\)/);
  assert.match(text,/18\/11\/2026/);
  assert.match(text,/efetivo aproximado; valor apurado diretamente/);
  assert.match(text,/Sensibilidade ao ISS entre 2% e 5%/);
  assert.match(text,/R\$ 1\.004,04 e R\$ 1\.040,04/);
  assert.match(text,/Não considera outras receitas/);
});

test('referência nacional preserva provisão mensal, anual e retenções',()=>{
  const c=configuration(getTaxReference(1200));
  for(const tax of TAXES)c[tax.id].withholdingRate=tax.id==='irpj'?1.5:0;
  const monthly=calculateCommissionTaxes(1200,c);
  const annual=calculateCommissionTaxes(1200,c,12);
  assert.equal(monthly.payable,1182);
  assert.equal(monthly.taxesToPay,177.96);
  assert.equal(monthly.net,1004.04);
  assert.equal(annual.net,12048.48);
});
