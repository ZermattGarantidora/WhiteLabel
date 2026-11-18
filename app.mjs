import {parseBR, calculatePortfolio, resolveRate} from './model.mjs';
import {TAXES, EXAMPLE_TAX_RATES, parseTaxRate, calculateCommissionTaxes} from './taxes.mjs';
import {createSimulationSummary} from './summary.mjs';
import {BRAZILIAN_STATES, TAX_REFERENCE_DATE, getRegionalTaxReference} from './regional-taxes.mjs';

const $ = id => document.getElementById(id);
const currency = new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'});
const number = new Intl.NumberFormat('pt-BR', {maximumFractionDigits:2});
const amount = new Intl.NumberFormat('pt-BR', {minimumFractionDigits:2,maximumFractionDigits:2});
const pct = value => `${number.format(value)}%`;
let months = 1;
let lastResult;
let announcement;
let tierSequence = 0;
let exampleTaxes = false;
let regionalReference = false;
let customISS = false;
const taxNumber = new Intl.NumberFormat('pt-BR', {maximumFractionDigits:4});
const ids = ['base','rate','share'];
const condoLabel = quantity => `${number.format(quantity)} ${quantity === 1 ? 'condomínio' : 'condomínios'}`;
const parseQuantity = value => /^\d+$/.test(value) ? Number(value) : NaN;
const tierInputs = () => Array.from($('volume-rows').children);
const readTiers = () => tierInputs().map(row => ({minimum:parseQuantity(row.querySelector('.tier-minimum').value), rate:parseBR(row.querySelector('.tier-rate').value)}));
BRAZILIAN_STATES.forEach(state=>{
  const option=document.createElement('option');option.value=state.code;option.textContent=`${state.name} (${state.code})`;
  $('franchisee-state').append(option);
});

function clearTaxResults(message) {
  $('net-value').textContent = message;
  ['tax-total','withheld-total','payment-value','taxes-to-pay','tax-credits'].forEach(id=>$(id).textContent='—');
  TAXES.forEach(tax=>['tax','retained'].forEach(prefix=>$(`${prefix}-${tax.id}-amount`).textContent='—'));
  $('tax-credit-row').hidden = true;
}

function updateTaxes(result) {
  const configuration = {};
  let valid = true;
  const monthlyCommission=calculatePortfolio(result.quantity,result.basePerCondo,result.initialRate,result.share,1,result.tiers).admin;
  const stateCode=$('franchisee-state').value;
  const state=BRAZILIAN_STATES.find(item=>item.code===stateCode);
  const municipality=$('franchisee-city').value.trim();
  let reference=null;
  let referenceError=null;
  if(regionalReference) {
    try {
      reference=getRegionalTaxReference(stateCode,monthlyCommission);
      TAXES.forEach(tax=>{if(tax.id!=='iss'||!customISS)$(`tax-${tax.id}`).value=taxNumber.format(reference.rates[tax.id]);});
    }catch(error){referenceError=error.message;valid=false;}
  }
  TAXES.forEach(tax=>{
    const entry = {};
    [['tax','rate'],['retained','withholdingRate']].forEach(([prefix,key])=>{
      const input = $(`${prefix}-${tax.id}`);
      const empty = input.value.trim() === '';
      const value = empty ? null : parseTaxRate(input.value);
      const okay = empty || Number.isFinite(value);
      input.setAttribute('aria-invalid',String(!okay));
      valid = valid && okay;
      entry[key] = value;
    });
    configuration[tax.id] = entry;
    if(reference?.monthlyTaxCents[tax.id] !== undefined)entry.monthlyTaxCents=reference.monthlyTaxCents[tax.id];
  });
  const complete = TAXES.every(tax=>configuration[tax.id].rate !== null);
  const taxScenario = reference
    ? `${reference.assumptions} ${customISS?'ISS informado pelo usuário.':'ISS de referência de 5%, sem alíquota municipal confirmada.'} Adicional mensal estimado de IRPJ: ${currency.format(reference.additionalIRPJ)}.${reference.increasedPresumption?' Inclui aumento de presunção na parcela excedente ao limite proporcional trimestral.':''}`
    : exampleTaxes ? 'Exemplo ilustrativo de lucro presumido: ISS de 5%, sem apuração de adicionais ou particularidades.'
      : 'Alíquotas informadas pelo usuário; enquadramento e incidência dependem de validação contábil.';
  $('tax-scenario').textContent = reference||exampleTaxes ? taxScenario : 'Use as alíquotas efetivas da contabilidade; nenhum enquadramento foi presumido.';
  $('tax-limit').textContent = reference
    ? 'Estimativa de lucro presumido; valide regime, nota e retenções com a contabilidade antes de pagar. IRPJ inclui o adicional quando aplicável neste cenário; IRPJ e CSLL incluem a presunção majorada na parcela excedente ao limite proporcional trimestral. Os percentuais efetivos exibidos são aproximados; os valores são apurados diretamente. Não considera outras receitas, ajustes acumulados, benefícios ou créditos. No Simples Nacional, não some o DAS a esses impostos: informe a repartição efetiva validada pela contabilidade.'
    : 'Estimativa para planejamento; valide com a contabilidade antes de emitir a nota e pagar. No Simples, não some o DAS aos tributos que ele já engloba. Adicionais, créditos, outras receitas e regras do período precisam estar refletidos nas alíquotas efetivas. O exemplo não os apura automaticamente.';
  $('regional-caption').textContent = state
    ? `Franqueado: ${municipality?municipality+' · ':''}${state.name} (${state.code}). Pagadora: Zermatt/PR. Referência: ${TAX_REFERENCE_DATE}.`
    : 'Pagadora no Paraná. Selecione o estado do franqueado para carregar a referência.';
  $('regional-disclaimer').textContent = `Os tributos federais deste serviço não mudam só pela UF${state?' ('+state.code+')':''}. Não se acrescenta ICMS de operação interestadual a esta hipótese de comissão de serviço. O ISS e as retenções exigem validação do município, serviço e regime.`;
  $('commission-gross').textContent = currency.format(result.admin);
  $('tax-error').hidden = valid;
  $('tax-error').textContent = referenceError ?? 'Use alíquotas de 0% a 100%, com até quatro casas decimais. Preencha 0 quando não houver incidência.';
  let estimate = null;
  if (valid && complete) {
    try {
      estimate = calculateCommissionTaxes(monthlyCommission,configuration,months);
    } catch (error) {
      valid = false;
      $('tax-error').hidden = false;
      $('tax-error').textContent = error.message;
    }
  }
  let netRange=null;
  $('net-range').hidden=true;
  if(estimate&&reference&&!customISS) {
    const withLowerISS={...configuration,iss:{...configuration.iss,rate:2}};
    const upper=calculateCommissionTaxes(monthlyCommission,withLowerISS,months).net;
    netRange={minimum:estimate.net,maximum:upper};
    $('net-range').textContent=`Com ISS entre 2% e 5%, o líquido neste cenário fica entre ${currency.format(estimate.net)} e ${currency.format(upper)}. O destaque usa 5% como referência; confirme a alíquota municipal.`;
    $('net-range').hidden=false;
  }
  $('tax-status').textContent = !valid ? 'Revise os impostos' : !estimate ? 'Configuração pendente' : reference ? 'Referência estimada por UF' : exampleTaxes ? 'Exemplo ilustrativo' : 'Estimativa configurada';
  $('tax-settings-status').textContent = !valid ? 'Revisar' : !estimate ? 'Alíquotas pendentes' : estimate.withholdingComplete ? 'Totais e retenções' : 'Retenções pendentes';
  $('net-caption').textContent = !estimate
    ? 'Selecione o estado para carregar a referência ou informe todos os tributos sobre a comissão, inclusive 0 quando não houver incidência.'
    : estimate.withholdingComplete
      ? 'Valor disponível após retenções e provisão dos tributos restantes. Créditos a compensar não entram como dinheiro disponível.'
      : 'Após os tributos informados. Retenções pendentes: este valor ainda não é uma previsão do pagamento.';
  $('withholding-status').textContent = estimate?.withholdingComplete
    ? 'Pagamento = comissão bruta menos retenções. O saldo dos tributos fica a cargo do franqueado. Valide as retenções antes de pagar.'
    : 'Informe todas as retenções, inclusive 0, para estimar o pagamento.';
  if (!estimate) clearTaxResults(!valid ? 'Revise as alíquotas' : !state&&TAXES.every(tax=>configuration[tax.id].rate===null) ? 'Selecione o estado' : 'Informe as alíquotas');
  else {
    $('net-value').textContent = currency.format(estimate.net);
    $('tax-total').textContent = currency.format(estimate.taxTotal);
    estimate.rows.forEach(row=>{
      $(`tax-${row.id}-amount`).textContent = currency.format(row.amount);
      $(`retained-${row.id}-amount`).textContent = row.withheld === null ? '—' : currency.format(row.withheld);
    });
    [['withheld-total','withheldTotal'],['payment-value','payable'],['taxes-to-pay','taxesToPay'],['tax-credits','taxCredits']].forEach(([id,key])=>{
      $(id).textContent = estimate[key] === null ? '—' : currency.format(estimate[key]);
    });
    $('tax-credit-row').hidden = !estimate.taxCredits;
  }
  if (!valid) $('tax-settings').open = true;
  $('export').disabled = !valid;
  return {taxConfiguration:configuration, taxEstimate:estimate, taxScenario,
    taxRegion:{payerState:'PR',stateCode:state?.code??null,stateName:state?.name??null,municipality,reviewedAt:TAX_REFERENCE_DATE,automatic:!!reference,customISS,netRange}};
}

function addTier() {
  const rows=tierInputs();
  if(rows.length>=20) return;
  const row=document.createElement('div'); row.className='tier-row';
  row.innerHTML='<label class="tier-min-label">A partir de<input class="tier-minimum input-shell" type="number" inputmode="numeric" min="1" max="100000" step="1" aria-describedby="tiers-error"></label><label class="tier-rate-label">Taxa (%)<input class="tier-rate input-shell" type="text" inputmode="decimal" maxlength="6" aria-describedby="tiers-error"></label><button class="remove-tier" type="button" aria-label="Remover faixa">×</button>';
  const minimum=row.querySelector('.tier-minimum');const tierRate=row.querySelector('.tier-rate');
  minimum.id=`tier-minimum-${++tierSequence}`;tierRate.id=`tier-rate-${tierSequence}`;
  const previous=readTiers();
  minimum.value=String(Math.min(100000,Math.max(0,...previous.map(t=>Number.isFinite(t.minimum)?t.minimum:0))+10));
  const initial=parseBR($('rate').value);tierRate.value=number.format(Number.isFinite(initial)?initial:4);
  row.querySelector('.remove-tier').addEventListener('click',()=>{row.remove();update();$('add-tier').focus();});
  [minimum,tierRate].forEach(input=>input.addEventListener('input',update));
  $('volume-rows').append(row);$('volume-settings').open=true;update();minimum.focus();
}

function update() {
  const values = ids.map(id => parseBR($(id).value));
  let valid = true;
  ids.forEach((id,index) => {
    const limit = id === 'base' ? 1e12 : 100;
    const okay = Number.isFinite(values[index]) && values[index] >= 0 && values[index] <= limit;
    $(id).setAttribute('aria-invalid',String(!okay));
    $(`${id}-error`).hidden = okay;
    if (id !== 'base') {
      $(`${id}-range`).disabled = !okay;
      if(okay) {
        $(`${id}-range`).value = values[index];
        $(`${id}-range`).style.setProperty('--fill',`${values[index]}%`);
      }
    }
    valid = valid && okay;
  });
  const quantity=parseQuantity($('quantity').value);
  const quantityValid=Number.isInteger(quantity) && quantity>=0 && quantity<=100000;
  $('quantity').setAttribute('aria-invalid',String(!quantityValid));$('quantity-error').hidden=quantityValid;
  valid=valid&&quantityValid;
  const tiers=readTiers();
  let tiersValid=true;
  try { resolveRate(0,0,tiers); } catch {tiersValid=false;}
  $('tiers-error').hidden=tiersValid;
  const duplicates=tiers.map(t=>t.minimum);
  tierInputs().forEach((row,index)=>{
    const tier=tiers[index];
    const minimumValid=Number.isInteger(tier.minimum)&&tier.minimum>=1&&tier.minimum<=100000&&duplicates.indexOf(tier.minimum)===duplicates.lastIndexOf(tier.minimum);
    row.querySelector('.tier-minimum').setAttribute('aria-invalid',String(!minimumValid));
    row.querySelector('.tier-rate').setAttribute('aria-invalid',String(!Number.isFinite(tier.rate)||tier.rate<0||tier.rate>100));
  });
  if(!tiersValid)$('volume-settings').open=true;
  $('volume-empty').hidden=tiers.length>0;
  $('volume-count').textContent=tiers.length?`${tiers.length} ${tiers.length===1?'faixa':'faixas'}`:'Configurar faixas';
  $('add-tier').disabled=tiers.length>=20;
  valid=valid&&tiersValid;
  const [base,initialRate,share] = values;
  if(quantityValid && Number.isFinite(base) && Math.round(base*100)*quantity/100>1e12) {
    $('base').setAttribute('aria-invalid','true');$('base-error').hidden=false;
    $('base-error').textContent='A arrecadação total deve ser de até R$ 1 trilhão. Reduza a média por condomínio ou a quantidade.';valid=false;
  }else $('base-error').textContent='Informe um valor entre R$ 0 e R$ 1 trilhão.';
  $('invalid-note').hidden = valid;
  $('export').disabled = !valid;
  if(!valid) {
    clearTimeout(announcement);
    clearTaxResults('Revise o cenário');
    $('net-range').hidden=true;
    $('net-caption').textContent='Revise os campos destacados para recalcular a estimativa.';
    $('tax-status').textContent='Cenário inválido';
    $('commission-gross').textContent='—';
    $('withholding-status').textContent='Pagamento não estimado: revise o cenário.';
    $('live-result').textContent='Cenário inválido. Revise os campos destacados; o líquido não foi calculado.';
    return;
  }
  const result = calculatePortfolio(quantity,base,initialRate,share,months,tiers);
  const rate=result.rate;
  const taxResult = updateTaxes({...result,tiers});
  lastResult = {...result,tiers,...taxResult};
  $('portfolio-caption').textContent=`${condoLabel(quantity)} · ${currency.format(result.baseMonthly)}/mês`;
  $('effective-rate').textContent=pct(rate);
  $('applied-tier').textContent=result.appliedThreshold ? `Faixa a partir de ${condoLabel(result.appliedThreshold)}`:'Taxa inicial';
  $('unit-price').textContent=quantity===0?currency.format(0):currency.format(result.unitPrice);
  $('gross').textContent = currency.format(result.gross);
  $('period-label').textContent = months === 1 ? '/ MÊS' : '/ ANO';
  $('admin-value').textContent = currency.format(result.admin);
  $('remainder-value').textContent = currency.format(result.remainder);
  $('admin-percentage').textContent = pct(share);
  $('remainder-percentage').textContent = pct(100-share);
  $('chart-share').replaceChildren(document.createTextNode(number.format(result.gross > 0 ? share : 0)), Object.assign(document.createElement('span'), {textContent:'%'}));
  const visibleShare = result.gross > 0 ? share : 0;
  $('admin-arc').setAttribute('stroke-dasharray',`${visibleShare} ${100-visibleShare}`);
  $('admin-arc').style.opacity = visibleShare > 0 ? '1' : '0';
  $('remainder-arc').style.opacity = result.gross > 0 ? '1' : '0';
  $('separator-top').style.opacity = visibleShare > 0 && visibleShare < 100 ? '1' : '0';
  $('separator-end').style.opacity = visibleShare > 0 && visibleShare < 100 ? '1' : '0';
  $('separator-end').setAttribute('transform',`rotate(${visibleShare*3.6} 160 160)`);
  $('chart-desc').textContent = result.gross > 0 ? `Administradora: ${pct(share)}, ${currency.format(result.admin)}. Zermatt: ${pct(100-share)}, ${currency.format(result.remainder)}.` : 'Sem receita para distribuir neste cenário.';
  document.querySelector('.center-bottom').textContent = result.gross > 0 ? 'da receita da taxa' : 'sem receita no cenário';
  $('annual-note').hidden = months === 1;
  clearTimeout(announcement);
  announcement = setTimeout(() => { $('live-result').textContent = `Resultado ${months===1?'mensal':'anual'}: receita bruta ${currency.format(result.gross)}. Comissão bruta da administradora: ${currency.format(result.admin)}. Receita da Zermatt: ${currency.format(result.remainder)}. ${taxResult.taxEstimate ? `Líquido estimado: ${currency.format(taxResult.taxEstimate.net)}. ${taxResult.taxEstimate.withholdingComplete ? `Pagamento previsto: ${currency.format(taxResult.taxEstimate.payable)}.` : 'Retenções pendentes; pagamento não estimado.'}` : 'Líquido não calculado. Informe alíquotas válidas para todos os tributos.'}`; },450);
}

TAXES.forEach(tax=>['tax','retained'].forEach(prefix=>{
  const input=$(`${prefix}-${tax.id}`);
  input.addEventListener('input',()=>{
    if(prefix==='tax') {exampleTaxes=false;if(tax.id==='iss'&&regionalReference)customISS=true;else regionalReference=false;}
    update();
  });
  input.addEventListener('blur',()=>{const value=parseTaxRate(input.value);if(Number.isFinite(value))input.value=taxNumber.format(value);});
}));
$('configure-taxes').addEventListener('click',()=>{
  $('tax-settings').open=true;
  $('tax-iss').focus();
});
$('tax-example').addEventListener('click',()=>{
  regionalReference=!!$('franchisee-state').value;customISS=false;
  TAXES.forEach(tax=>{$(`tax-${tax.id}`).value=taxNumber.format(EXAMPLE_TAX_RATES[tax.id]);$(`retained-${tax.id}`).value='';});
  exampleTaxes=!regionalReference;update();
});
$('no-withholding').addEventListener('click',()=>{TAXES.forEach(tax=>$(`retained-${tax.id}`).value='0');update();});
$('franchisee-state').addEventListener('change',()=>{
  regionalReference=!!$('franchisee-state').value;customISS=false;exampleTaxes=false;
  $('franchisee-city').value='';
  TAXES.forEach(tax=>['tax','retained'].forEach(prefix=>$(`${prefix}-${tax.id}`).value=''));
  update();
});
$('franchisee-city').addEventListener('input',update);
ids.forEach(id => $(id).addEventListener('input',update));
$('quantity').addEventListener('input',update);
$('add-tier').addEventListener('click',addTier);
['rate','share'].forEach(id => {
  $(`${id}-range`).addEventListener('input', event => { $(id).value = number.format(Number(event.target.value)); update(); });
  $(id).addEventListener('blur', () => { const value = parseBR($(id).value); if(Number.isFinite(value) && value>=0 && value<=100) $(id).value=number.format(value); });
});
$('base').addEventListener('blur',()=>{ const value=parseBR($('base').value); if(Number.isFinite(value) && value>=0 && value<=1e12) $('base').value=amount.format(value); });
$('simulation-form').addEventListener('submit',event=>event.preventDefault());
document.querySelectorAll('[data-months]').forEach(button => button.addEventListener('click',()=>{
  months=Number(button.dataset.months);
  document.querySelectorAll('[data-months]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
  update();
}));
$('reset').addEventListener('click',()=>{
  $('base').value='100.000,00'; $('rate').value='4'; $('share').value='30';
  $('quantity').value='1';$('volume-rows').replaceChildren();$('volume-settings').open=false;
  TAXES.forEach(tax=>['tax','retained'].forEach(prefix=>$(`${prefix}-${tax.id}`).value=''));
  exampleTaxes=false;regionalReference=false;customISS=false;
  $('franchisee-state').value='';$('franchisee-city').value='';$('tax-settings').open=false;
  months=1;
  document.querySelectorAll('[data-months]').forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.months==='1')));
  update();
});
$('export').addEventListener('click',()=>{
  if(!lastResult || $('export').disabled) return;
  const blob=new Blob(['\ufeff'+createSimulationSummary(lastResult)],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a'); link.href=url;link.download='zermatt-white-label.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
update();
