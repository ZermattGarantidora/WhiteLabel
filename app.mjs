import {parseBR, calculatePortfolio, resolveRate} from './model.mjs';

const $ = id => document.getElementById(id);
const currency = new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'});
const number = new Intl.NumberFormat('pt-BR', {maximumFractionDigits:2});
const amount = new Intl.NumberFormat('pt-BR', {minimumFractionDigits:2,maximumFractionDigits:2});
const pct = value => `${number.format(value)}%`;
let months = 1;
let lastResult;
let announcement;
let tierSequence = 0;
const ids = ['base','rate','share'];
const condoLabel = quantity => `${number.format(quantity)} ${quantity === 1 ? 'condomínio' : 'condomínios'}`;
const parseQuantity = value => /^\d+$/.test(value) ? Number(value) : NaN;
const tierInputs = () => Array.from($('volume-rows').children);
const readTiers = () => tierInputs().map(row => ({minimum:parseQuantity(row.querySelector('.tier-minimum').value), rate:parseBR(row.querySelector('.tier-rate').value)}));

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
  if(!valid) return;
  const result = calculatePortfolio(quantity,base,initialRate,share,months,tiers);
  const rate=result.rate;
  lastResult = {...result,tiers};
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
  announcement = setTimeout(() => { $('live-result').textContent = `Resultado ${months===1?'mensal':'anual'}: receita bruta ${currency.format(result.gross)}. Administradora: ${currency.format(result.admin)}. Receita da Zermatt: ${currency.format(result.remainder)}.`; },450);
}

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
  months=1;
  document.querySelectorAll('[data-months]').forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.months==='1')));
  update();
});
$('export').addEventListener('click',()=>{
  if(!lastResult || $('export').disabled) return;
  const r=lastResult;
  const lines=[
    'ZERMATT GARANTIDORA — WHITE LABEL',
    `Simulação ${r.months===1?'mensal':'anual (12 meses com valores mensais constantes)'}`,
    '',
    `Quantidade de condomínios: ${r.quantity}`,
    `Arrecadação mensal média por condomínio: ${currency.format(r.basePerCondo)}`,
    `Arrecadação mensal total: ${currency.format(r.baseMonthly)}`,
    `Taxa inicial: ${pct(r.initialRate)}`,
    ...r.tiers.slice().sort((a,b)=>a.minimum-b.minimum).map(t=>`Faixa: a partir de ${condoLabel(t.minimum)} — ${pct(t.rate)}`),
    `Taxa aplicada: ${pct(r.rate)} (${r.appliedThreshold?'a partir de '+condoLabel(r.appliedThreshold):'taxa inicial'})`,
    `Preço mensal por condomínio (valor da taxa): ${currency.format(r.quantity===0?0:r.unitPrice)}`,
    `Participação da administradora: ${pct(r.share)}`,
    '',
    `Receita bruta da taxa: ${currency.format(r.gross)}`,
    `Repasse à administradora: ${currency.format(r.admin)}`,
    `Receita da Zermatt: ${currency.format(r.remainder)}`,
    '',
    'A participação da administradora incide sobre a receita bruta da taxa.',
    'Receita da Zermatt = receita bruta da taxa menos o repasse à administradora, antes de outras despesas.',
    'Valores arredondados mensalmente para centavos. Simulação ilustrativa.'
  ];
  const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a'); link.href=url;link.download='zermatt-white-label.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
update();
