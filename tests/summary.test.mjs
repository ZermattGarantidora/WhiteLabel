import test from 'node:test';
import assert from 'node:assert/strict';
import {calculatePortfolio} from '../model.mjs';
import {TAXES,EXAMPLE_TAX_RATES,calculateCommissionTaxes} from '../taxes.mjs';
import {createSimulationSummary} from '../summary.mjs';

function scenario({months=1,quantity=1,tiers=[],withholding=null,empty=false,rate=4}={}) {
  const taxConfiguration=Object.fromEntries(TAXES.map(tax=>[tax.id,{rate:empty?null:EXAMPLE_TAX_RATES[tax.id], withholdingRate:withholding === null ? null : withholding[tax.id]??0}]));
  const result=calculatePortfolio(quantity,100000,rate,30,months,tiers);
  const taxEstimate=empty?null:calculateCommissionTaxes(calculatePortfolio(quantity,100000,rate,30,1,tiers).admin,taxConfiguration,months);
  return {...result,tiers,taxConfiguration,taxEstimate,taxScenario:'Exemplo ilustrativo; validar com a contabilidade.'};
}
const normalized = result=>createSimulationSummary(result).replace(/\u00a0/g,' ');

test('exportação inicial não inventa líquido nem considera vazio como isento',()=>{
  const text=normalized(scenario({empty:true}));
  assert.match(text,/Líquido não calculado/);
  assert.match(text,/ISS: total não informado; retenção ISS: não informada/);
  assert.doesNotMatch(text,/Líquido estimado do franqueado: R\$/);
});
test('exporta comissão, tributos e líquido no mês sem confundir com receita total',()=>{
  const text=normalized(scenario());
  assert.match(text,/Participação do parceiro: 30% \(fixa\)/);
  assert.doesNotMatch(text,/Participação da administradora/);
  assert.match(text,/Receita bruta da taxa: R\$ 4\.000,00/);
  assert.match(text,/Comissão bruta.*R\$ 1\.200,00/);
  assert.match(text,/Tributos estimados: R\$ 195,96/);
  assert.match(text,/Líquido estimado.*R\$ 1\.004,04/);
  assert.match(text,/Retenções incompletas: pagamento ainda não estimado/);
  assert.match(text,/Cofins: total 3% = R\$ 36,00/);
  assert.match(text,/IRPJ: total 4,8% = R\$ 57,60; retenção IRRF: não informada/);
});
test('exporta pagamento e tributos remanescentes sem duplicar IRRF',()=>{
  const text=normalized(scenario({withholding:{irpj:1.5}}));
  assert.match(text,/Valor previsto no pagamento: R\$ 1\.182,00/);
  assert.match(text,/Saldo de tributos a recolher pelo franqueado: R\$ 177,96/);
  assert.match(text,/retenção IRRF: 1,5% = R\$ 18,00/);
  assert.match(text,/Créditos por retenção a compensar: R\$ 0,00/);
  assert.match(text,/sem dupla dedução/);
});
test('resumo anual inclui projeção e valores anuais consistentes',()=>{
  const text=normalized(scenario({months:12,withholding:{}}));
  assert.match(text,/anual \(12 meses com valores mensais constantes\)/);
  assert.match(text,/Líquido estimado.*R\$ 12\.048,48/);
  assert.match(text,/Tributos estimados: R\$ 2\.351,52/);
  assert.match(text,/Valor previsto no pagamento: R\$ 14\.400,00/);
});
test('faixas e quantidade alteram também o líquido exportado',()=>{
  const result=scenario({quantity:10,tiers:[{minimum:20,rate:3},{minimum:10,rate:3.5}]});
  const text=normalized(result);
  assert.equal(result.taxEstimate.grossCommission,10500);
  assert.match(text,/Taxa aplicada: 3,5% \(a partir de 10 condomínios\)/);
  assert.match(text,/Líquido estimado.*R\$ 8\.785,35/);
  assert.ok(text.indexOf('a partir de 10 condomínios —')<text.indexOf('a partir de 20 condomínios —'));
});
test('carteira sem condomínios informa zeros, não receita unitária indevida',()=>{
  const text=normalized(scenario({quantity:0,withholding:{}}));
  assert.match(text,/Preço mensal por condomínio \(valor da taxa\): R\$ 0,00/);
  assert.match(text,/Líquido estimado.*R\$ 0,00/);
});
test('preserva precisão das alíquotas no arquivo',()=>{
  const result=scenario();
  result.taxConfiguration.irpj.rate=4.8125;
  result.taxEstimate=calculateCommissionTaxes(1200,result.taxConfiguration);
  assert.match(normalized(result),/IRPJ: total 4,8125%/);
});
