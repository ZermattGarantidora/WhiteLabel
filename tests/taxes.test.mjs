import test from 'node:test';
import assert from 'node:assert/strict';
import {TAXES, EXAMPLE_TAX_RATES, parseTaxRate, calculateCommissionTaxes} from '../taxes.mjs';

const config = (rates = EXAMPLE_TAX_RATES, withholding = null) => Object.fromEntries(TAXES.map(tax=>[tax.id,{rate:rates[tax.id]??0, withholdingRate:withholding === null ? null : withholding[tax.id]??0}]));

test('exemplo de R$ 1.200 desconta R$ 195,96 sobre a comissão',()=>{
  const result = calculateCommissionTaxes(1200,config());
  assert.deepEqual(result.rows.map(row=>row.amount),[60,7.8,36,57.6,34.56]);
  assert.equal(result.taxTotal,195.96);
  assert.equal(result.net,1004.04);
  assert.equal(result.grossCommission,1200);
  assert.equal(result.withholdingComplete,false);
  for(const key of ['withheldTotal','payable','taxesToPay','taxCredits']) assert.equal(result[key],null);
});

test('retenção parcial não desconta IRRF e IRPJ em duplicidade',()=>{
  const result = calculateCommissionTaxes(1200,config(EXAMPLE_TAX_RATES,{irpj:1.5}));
  assert.equal(result.withheldTotal,18);
  assert.equal(result.payable,1182);
  assert.equal(result.taxesToPay,177.96);
  assert.equal(result.net,1004.04);
  assert.equal(result.taxCredits,0);
});

test('retenções completas produzem pagamento igual ao líquido',()=>{
  const result = calculateCommissionTaxes(1200,config(EXAMPLE_TAX_RATES,EXAMPLE_TAX_RATES));
  assert.equal(result.withheldTotal,195.96);
  assert.equal(result.payable,1004.04);
  assert.equal(result.taxesToPay,0);
  assert.equal(result.net,1004.04);
});

test('zero explícito nas retenções preserva o pagamento bruto',()=>{
  const result = calculateCommissionTaxes(1200,config(EXAMPLE_TAX_RATES,{}));
  assert.equal(result.payable,1200);
  assert.equal(result.taxesToPay,195.96);
  assert.equal(result.net,1004.04);
  assert.equal(result.withholdingComplete,true);
});

test('retenção excedente é crédito a compensar, sem antecipar dinheiro disponível',()=>{
  const result = calculateCommissionTaxes(1000,config({irpj:1},{irpj:1.5}));
  assert.equal(result.taxTotal,10);
  assert.equal(result.withheldTotal,15);
  assert.equal(result.taxCredits,5);
  assert.equal(result.payable,985);
  assert.equal(result.taxesToPay,0);
  assert.equal(result.net,985);
});

test('crédito em um tributo não extingue automaticamente saldo de outro',()=>{
  const result = calculateCommissionTaxes(1000,config({irpj:1,iss:5},{irpj:1.5}));
  assert.equal(result.taxCredits,5);
  assert.equal(result.taxesToPay,50);
  assert.equal(result.net,935);
});

test('retenções parcialmente preenchidas não são tratadas como zero',()=>{
  const c = config(EXAMPLE_TAX_RATES,{});
  c.iss.withholdingRate=null;
  const result = calculateCommissionTaxes(1200,c);
  assert.equal(result.payable,null);
  assert.equal(result.withholdingComplete,false);
  assert.equal(result.rows[0].withheld,null);
  assert.equal(result.rows[1].withheld,0);
});

test('arredonda cada tributo no mês e soma os 12 meses',()=>{
  const monthly = calculateCommissionTaxes(0.1,config());
  const yearly = calculateCommissionTaxes(0.1,config(),12);
  assert.equal(monthly.taxTotal,0.01);
  assert.equal(monthly.net,0.09);
  assert.equal(yearly.taxTotal,0.12);
  assert.equal(yearly.net,1.08);
  assert.equal(yearly.grossCommission,1.2);
});

test('projeção anual escala pagamento, saldo e créditos já arredondados no mês',()=>{
  const result = calculateCommissionTaxes(1000,config({irpj:1,iss:5},{irpj:1.5}),12);
  assert.equal(result.payable,11820);
  assert.equal(result.taxesToPay,600);
  assert.equal(result.taxCredits,60);
  assert.equal(result.net,11220);
  assert.equal(result.rows.find(row=>row.id==='irpj').withheld,180);
});

test('comissão zero e todos os tributos zero são válidos',()=>{
  const result = calculateCommissionTaxes(0,config({},{}));
  assert.equal(result.net,0);
  assert.equal(result.taxTotal,0);
  assert.equal(result.payable,0);
});

test('desconto de 100% produz líquido zero',()=>{
  const result = calculateCommissionTaxes(1200,config({iss:100},{iss:100}));
  assert.equal(result.net,0);
  assert.equal(result.payable,0);
});

test('usa precisão inteira para uma comissão de R$ 1 trilhão',()=>{
  const result = calculateCommissionTaxes(1e12,config({irpj:1.2345},{}));
  assert.equal(result.taxTotal,12345000000);
  assert.equal(result.net,987655000000);
});

test('arredondamento de meio centavo e alíquota de quatro casas',()=>{
  assert.equal(calculateCommissionTaxes(1,config({iss:0.5})).taxTotal,0.01);
  assert.equal(calculateCommissionTaxes(10000,config({iss:0.0003})).taxTotal,0.03);
});

for(const [input,expected] of [['0',0],[' 0,65 ',0.65],['2.88',2.88],['4,8125',4.8125],['100,0000',100]]) {
  test(`interpreta alíquota ${JSON.stringify(input)}`,()=>assert.equal(parseTaxRate(input),expected));
}
for(const input of ['', ' ', '-1', '100,0001', '101', '1,23456', '0x10', '1e1', 'R$ 5', '2%', '1.234,5', 'NaN']) {
  test(`rejeita alíquota ${JSON.stringify(input)}`,()=>assert.ok(Number.isNaN(parseTaxRate(input))));
}
for(const commission of [-1,Infinity,NaN,1e12+1,'1200']) {
  test(`rejeita comissão inválida ${commission}`,()=>assert.throws(()=>calculateCommissionTaxes(commission,config()),RangeError));
}
for(const period of [0,2,13,NaN,'12']) {
  test(`rejeita período inválido ${period}`,()=>assert.throws(()=>calculateCommissionTaxes(1200,config(),period),RangeError));
}
for(const rate of [-1,101,Infinity,NaN,1.23456,null,undefined,'1.5']) {
  test(`rejeita carga tributária inválida ${rate}`,()=>{
    const c=config();c.iss.rate=rate;
    assert.throws(()=>calculateCommissionTaxes(1200,c),RangeError);
  });
}
test('rejeita configuração ausente e tributo ausente',()=>{
  assert.throws(()=>calculateCommissionTaxes(1200),RangeError);
  const c=config();delete c.iss;
  assert.throws(()=>calculateCommissionTaxes(1200,c),RangeError);
});
test('rejeita retenção inválida',()=>{
  const c=config();c.irpj.withholdingRate=-1;
  assert.throws(()=>calculateCommissionTaxes(1200,c),RangeError);
});
test('soma de carga ou retenções acima de 100% é inválida',()=>{
  assert.throws(()=>calculateCommissionTaxes(1200,config({iss:60,irpj:50})),/100%/);
  assert.throws(()=>calculateCommissionTaxes(1200,config({},{iss:60,irpj:50})),/100%/);
  assert.throws(()=>calculateCommissionTaxes(1200,config({iss:60},{irpj:50})),/100%/);
});
test('não permite líquido negativo por soma dos arredondamentos em centavos',()=>{
  assert.throws(()=>calculateCommissionTaxes(0.03,config({iss:20,pis:20,cofins:20,irpj:20,csll:20})),/arredondados/);
});
