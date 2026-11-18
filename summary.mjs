import {TAXES} from './taxes.mjs';

const currency = new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'});
const number = new Intl.NumberFormat('pt-BR', {maximumFractionDigits:4});
const pct = value => `${number.format(value)}%`;
const condoLabel = quantity => `${number.format(quantity)} ${quantity === 1 ? 'condomínio' : 'condomínios'}`;

export function createSimulationSummary(r) {
  const t = r.taxEstimate;
  return [
    'ZERMATT GARANTIDORA — WHITE LABEL',
    `Simulação ${r.months===1?'mensal':'anual (12 meses com valores mensais constantes)'}`,
    '',
    `Quantidade de condomínios: ${r.quantity}`,
    `Arrecadação mensal média por condomínio: ${currency.format(r.basePerCondo)}`,
    `Arrecadação mensal total: ${currency.format(r.baseMonthly)}`,
    `Taxa inicial: ${pct(r.initialRate)}`,
    ...r.tiers.slice().sort((a,b)=>a.minimum-b.minimum).map(tier=>`Faixa: a partir de ${condoLabel(tier.minimum)} — ${pct(tier.rate)}`),
    `Taxa aplicada: ${pct(r.rate)} (${r.appliedThreshold?'a partir de '+condoLabel(r.appliedThreshold):'taxa inicial'})`,
    `Preço mensal por condomínio (valor da taxa): ${currency.format(r.quantity===0?0:r.unitPrice)}`,
    `Participação do parceiro: ${pct(r.share)} (fixa)`,
    '',
    `Receita bruta da taxa: ${currency.format(r.gross)}`,
    `Comissão bruta do parceiro/franqueado: ${currency.format(r.admin)}`,
    `Receita da Zermatt: ${currency.format(r.remainder)}`,
    '',
    'ESTIMATIVA TRIBUTÁRIA DO FRANQUEADO',
    `Pagadora: Zermatt — Paraná (PR). Franqueado: ${r.taxRegion?.stateName ? r.taxRegion.stateName+' ('+r.taxRegion.stateCode+')' : 'UF não informada'}.`,
    ...(r.taxRegion?.municipality ? [`Município informado: ${r.taxRegion.municipality} (alíquota municipal não consultada automaticamente).`] : []),
    ...(r.taxRegion ? [`Referências legislativas consultadas em ${r.taxRegion.reviewedAt}; cenário de 2026, sem atualização legislativa automática.`] : []),
    r.taxScenario,
    'Base de todos os percentuais: comissão bruta do parceiro, não a receita total da taxa.',
    ...TAXES.map(tax => {
      const entry = r.taxConfiguration[tax.id];
      const row = t?.rows.find(item=>item.id===tax.id);
      const total = entry.rate === null ? 'não informado' : pct(entry.rate);
      const retained = entry.withholdingRate === null ? 'não informada' : pct(entry.withholdingRate);
      const approximate = r.taxRegion?.automatic && ['irpj','csll'].includes(tax.id) ? ' (efetivo aproximado; valor apurado diretamente)' : '';
      return `${tax.label}: total ${total}${approximate}${row?' = '+currency.format(row.amount):''}; retenção ${tax.withholdingLabel}: ${retained}${row?.withheld != null?' = '+currency.format(row.withheld):''}.`;
    }),
    ...(t ? [
      `Tributos estimados: ${currency.format(t.taxTotal)}`,
      `Líquido estimado do franqueado: ${currency.format(t.net)}`,
      ...(t.withholdingComplete ? [
        `Retenções no pagamento: ${currency.format(t.withheldTotal)}`,
        `Valor previsto no pagamento: ${currency.format(t.payable)}`,
        `Saldo de tributos a recolher pelo franqueado: ${currency.format(t.taxesToPay)}`,
        `Créditos por retenção a compensar: ${currency.format(t.taxCredits)}`,
        'Líquido disponível = valor previsto no pagamento menos saldo de tributos a recolher. Créditos não são considerados dinheiro disponível.'
      ] : ['Retenções incompletas: pagamento ainda não estimado. O líquido considera somente a carga tributária informada.'])
    ] : ['Líquido não calculado: informe todas as alíquotas totais, inclusive 0 quando não houver incidência.']),
    ...(r.taxRegion?.netRange ? [`Sensibilidade ao ISS entre 2% e 5%: líquido entre ${currency.format(r.taxRegion.netRange.minimum)} e ${currency.format(r.taxRegion.netRange.maximum)}. Destaque calculado com ISS de referência de 5%, sem alíquota municipal confirmada.`] : []),
    '',
    'A participação fixa de 30% do parceiro incide sobre a receita bruta da taxa.',
    'Receita da Zermatt = receita bruta da taxa menos a comissão bruta do parceiro, antes de outras despesas.',
    'Retenções dependem do regime, do serviço, do município e da nota. IRRF é tratado como antecipação do IRPJ, sem dupla dedução.',
    'A UF sozinha não determina o ISS. Não há acréscimo automático de ICMS interestadual sobre esta hipótese de comissão de serviço.',
    r.taxRegion?.automatic
      ? 'A referência inclui adicional de IRPJ e aumento de presunção quando aplicáveis a três meses iguais desta comissão. Não considera outras receitas, ajustes acumulados, benefícios, créditos ou o regime real da empresa.'
      : 'Alíquotas efetivas devem refletir adicionais, créditos, benefícios, outras receitas e regras do período. O exemplo não apura essas particularidades.',
    'No Simples Nacional, não some o DAS aos tributos que ele já engloba. A projeção anual não prevê mudanças tributárias.',
    'Valores e cada tributo arredondados mensalmente para centavos. Simulação ilustrativa; valide com a contabilidade antes de emitir a nota e pagar.'
  ].join('\r\n');
}
