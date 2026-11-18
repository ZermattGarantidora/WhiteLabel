# Estimativa tributária da comissão

## Escopo e critérios de aceitação

Adicionar, abaixo da receita total, o líquido estimado do franqueado, calculado **sobre o repasse bruto ao parceiro**. Preservar as regras de carteira, faixas e receita da Zermatt, com participação do parceiro fixa em 30%, conforme a solicitação de 18/11/2026.

1. Informar separadamente ISS, PIS, Cofins, IRPJ e CSLL, com alíquotas efetivas sobre a comissão, de zero a 100%, com até quatro casas decimais. Campo vazio significa desconhecido, nunca isenção.
2. Exibir comissão bruta, tributos estimados e líquido estimado. Sem todas as alíquotas de carga tributária, não apresentar um líquido numérico.
3. Permitir informar as retenções separadamente. A retenção de renda é IRRF, que pode antecipar o IRPJ: não somar IRRF ao IRPJ como dois custos definitivos. Não presumir que todo tributo é retido pela Zermatt.
4. Com retenções completas, exibir valor previsto no pagamento, saldo de tributos a recolher e eventuais créditos por retenção excedente. O líquido disponível é pagamento menos saldo a recolher; créditos não são dinheiro disponível. Com retenções incompletas, identificar que o líquido considera apenas a carga informada e que o pagamento depende da configuração das retenções.
5. Disponibilizar um exemplo **explicitamente ilustrativo**, acionado pelo usuário: ISS 5%, PIS 0,65%, Cofins 3%, IRPJ efetivo 4,8% e CSLL efetiva 2,88%. Não preencher retenções automaticamente. Esses percentuais não são regra universal nem enquadramento confirmado do franqueado.
6. Arredondar cada tributo e retenção mensalmente em centavos; o anual é a soma de 12 meses iguais, inclusive no resumo baixado. Recalcular após qualquer alteração da carteira, faixa, período ou imposto. Valores inválidos não podem deixar um líquido antigo visível nem permitir exportação.
7. Incluir alíquotas, retenções, hipóteses e limitações no download. Restaurar exemplo limpa a configuração tributária.
8. Funcionar em telas pequenas, com rótulos acessíveis e anúncio do resultado. Manter o processamento exclusivamente no navegador, sem dependências ou serviços novos.
9. Identificar a pagadora como Zermatt/PR e permitir selecionar todas as 27 UFs do franqueado. A seleção ativa um **cenário de referência de lucro presumido**, explicitamente estimado, sem afirmar que é o regime real do franqueado. Mudanças de UF não inventam diferenças nos tributos federais ou ICMS sobre a comissão de serviço.
10. Sem alíquota municipal confirmada, usar ISS de referência de 5% e mostrar também a sensibilidade entre 2% e 5%. Permitir informar município e ISS efetivo. A UF não basta para determinar a legislação municipal nem a retenção. O município é contexto informado, não consulta automática de legislação.
11. Na referência automática, projetar um trimestre com três comissões mensais iguais e sem outras receitas: presunção de 32%, aumento para 35,2% na parcela acima de R$ 1.250.000 no trimestre conforme a LC 224/2025, IRPJ de 15% com adicional de 10% sobre a base trimestral excedente a R$ 60.000 e CSLL de 9%. Usar a regra de CSLL já vigente no trimestre de referência (4º trimestre de 2026). Ratear a estimativa trimestral por três e arredondar para centavos. As alíquotas efetivas exibidas são arredondadas apenas para apresentação; o valor dos impostos é calculado diretamente, sem perder precisão pela exibição.
12. Mostrar referência legislativa de 18/11/2026 e hipótese de serviço de intermediação entre PJs. Não prometer atualização em tempo real ou validade para exercícios futuros. A contabilidade pode substituir as alíquotas; nesse caso, sair da referência automática, exceto ao ajustar somente o ISS. Informar outras receitas, regimes, benefícios, créditos e retenções como limites da estimativa.
13. Exibir o rótulo **Participação do parceiro** e o valor fixo **30%**, sem campo editável ou controle deslizante. O modelo deve rejeitar qualquer participação diferente de 30%, inclusive em chamadas diretas. Resultado, gráfico, estimativa tributária, projeção anual, restauração e resumo baixado devem usar essa mesma participação. Alterações de carteira, taxa e faixas continuam permitidas.

## Hipóteses e limites

O usuário informou a Zermatt no Paraná e franqueados em diferentes estados. O regime, o município, o código do serviço e as alíquotas reais ainda não foram informados. A interface recomenda validação contábil. Na edição manual, as alíquotas são **efetivas sobre a comissão**, não alíquotas nominais sobre lucro, e devem incorporar adicionais, créditos, benefícios e ajustes do período. A referência automática trata os adicionais descritos acima, mas não outras receitas, regimes ou particularidades da empresa.

No Simples Nacional, usar a repartição efetiva validada pela contabilidade ou ajustar a estimativa; não somar DAS aos tributos que ele já engloba. O simulador não calcula enquadramento, DAS ou apuração fiscal trimestral efetiva, não emite nota e não determina retenção legal automaticamente. A projeção anual não prevê alterações legislativas e não deve ser usada como regra tributária para outros exercícios.

## Fundamentação consultada em 18/11/2026

- [Receita Federal — MAFON 2025, código 8045](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/manuais/irrf/mafon-2025.pdf): retenção de renda em comissões e corretagens, conforme enquadramento.
- [IN SRF 459/2004](https://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=15365&visao=compilado): hipóteses de retenção de PIS, Cofins e CSLL; não presumir aplicação a qualquer serviço.
- [Solução de Consulta Cosit 263/2019](https://normas.receita.fazenda.gov.br/sijut2consulta/anexoOutros.action?idArquivoBinario=53909): representação comercial e não retenção das contribuições nos pagamentos tratados na consulta.
- [LC 116/2003](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm): ISS e responsabilidade tributária municipal.
- [IN RFB 1700/2017](https://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=81268) e [Receita Federal — CSLL](https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/tributos/CSLL): bases e apuração, sujeitas ao enquadramento e às regras vigentes.
- [Receita Federal — transição da reforma tributária](https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria-do-consumo/entenda): compensação ou dispensa no teste de IBS/CBS em 2026. Não acrescentar automaticamente 1% ao PIS/Cofins e produzir dupla cobrança.
- [LC 224/2025 — Senado Federal](https://legis.senado.gov.br/norma/41886467/publicacao/41889674): alterações na tributação federal em 2026.
- [Receita Federal — perguntas e respostas sobre redução de benefícios](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/perguntas-e-respostas/beneficios-fiscais/perguntas-e-respostas-reducao-dos-incentivos-e-beneficios-tributarios.pdf): limites, proporcionalidade trimestral e início de aplicação no IRPJ e na CSLL.

## Verificação

Executar `node --test` para regras de cálculo, arredondamento, validação e exportação. Verificar em navegador os estados inicial, configurado, inválido, mensal/anual, download, restauração, faixas e tela estreita. Revisar o diff completo antes de entregar.
