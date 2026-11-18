# Verificação — líquido estimado da comissão

Data: 18/11/2026. Repositório: `ZermattGarantidora/WhiteLabel`.

## Gates locais

- `node --test`: **106 testes aprovados**, sem falhas ou testes ignorados.
- Gate de cobertura documentado no README: **100% de linhas, 100% de funções e 99,07% de branches** nos módulos novos `taxes.mjs`, `regional-taxes.mjs` e `summary.mjs`. São métricas de V8; não representam cobertura de toda a interface nem do projeto original.
- `node --check` nos cinco módulos de produção e `git diff --check`.
- Revisão do diff completo, incluindo documentação, testes e workflow. Sem achados P0/P1 identificados na revisão local. Revisão local do autor não substitui revisão independente para merge.

## Navegador

Verificação na prévia local com o navegador integrado. Foram executadas 35 asserções explícitas de valores/estados, além da inspeção visual e do arquivo baixado. Não há dependência de browser adicionada ao projeto; essas verificações não são um gate automatizado de CI.

| Critério | Evidência verificada |
| --- | --- |
| Estado inicial e restauração | Sem UF ou alíquotas, não há líquido numérico; restaurar limpa tributos, retenções, município, UF e faixas. |
| Referência por UF | PR, SC e SP na interface; as 27 UFs nos testes. Pagadora permanece no Paraná. Impostos federais não são alterados artificialmente pela UF. |
| Comissão de R$ 1.200 | Tributos de R$ 195,96; líquido de R$ 1.004,04 com ISS de referência de 5%. Sensibilidade até R$ 1.040,04 com ISS de 2%. |
| ISS informado | Alíquota de 3% produz R$ 1.028,04; oculta a faixa de ISS desconhecido e mantém o cálculo federal automático. |
| Alíquota manual | IRPJ de 4,8125% com ISS de 3% produz R$ 1.027,89; não é substituído pela referência automática. |
| Retenções | Vazias deixam pagamento pendente; zeros explícitos preservam o pagamento bruto. Somente IRRF de 1,5%: pagamento de R$ 1.182, saldo tributário de R$ 177,96, sem dupla dedução. |
| Mensal/anual | Líquido de R$ 12.048,48 e pagamento de R$ 14.184 no anual do exemplo com IRRF de 1,5%. |
| Carteira/faixa | Dez condomínios com taxa de 3,5%: comissão de R$ 10.500 e líquido de R$ 8.785,35. |
| Maior volume | Comissão de R$ 120.000: IRPJ de R$ 7.600 e líquido de R$ 98.564. Acima do limite operacional da referência, líquido e exportação são bloqueados. |
| Erros | Valores negativos de imposto e quantidade limpam o líquido e bloqueiam o download. Não exibem um líquido antigo. |
| Download real | Arquivo TXT gerado pela interface conferido com UF SC, município de Florianópolis, referência de 18/11/2026, tributos, retenções e faixa de ISS. Dados de demonstração. |
| Responsividade | Telas de 390 e 360 px, sem rolagem horizontal. Após ajustar a largura dos valores, R$ 195,96 ocupa uma linha a 360 px: altura 17,6 px, igual ao line-height. Caso de regressão: os centavos não devem quebrar isoladamente na linha seguinte. |
| Console | Sem erros capturados ao concluir os fluxos. |

Capturas da prévia foram salvas fora dos arquivos publicados do site. Os valores nelas representam uma simulação, não a confirmação do município, regime ou retenções reais.

## Limites da entrega

A referência tributária é um snapshot de 18/11/2026, conforme [commission-taxes.md](commission-taxes.md). Não consulta legislação municipal, não determina o regime por UF, não emite nota, não efetua pagamento e não promete atualização automática ou apuração fiscal completa. O líquido depende das hipóteses exibidas e deve ser validado pela contabilidade.

O workflow `Tests` prepara o gate para pull requests e pushes. A alteração deve seguir por revisão de PR; esta verificação não é autorização de merge nem comprovação de publicação no site existente.

## Participação fixa do parceiro — 18/11/2026

Critério 13 de `commission-taxes.md`: rótulo **Participação do parceiro**, percentual fixo de **30%**, sem possibilidade de edição.

- **118 testes aprovados**, incluindo rejeição de outros percentuais nas chamadas diretas de cálculo e carteira, comissão mensal/anual, faixas e o novo rótulo no resumo.
- Cobertura de `model.mjs`, `taxes.mjs`, `regional-taxes.mjs` e `summary.mjs`: **100% linhas, 100% funções e 99,34% branches**. O modelo de comissão foi incluído no gate de CI.
- Sintaxe de `app.mjs` e diff sem erros.
- Navegador: elemento `output` com rótulo correto, zero entradas editáveis no bloco, ausência de slider; 10 condomínios geram R$ 12.000 mensais e R$ 144.000 anuais para o parceiro, mantendo 30%. Restaurar mantém 30%. Console sem erros.
- Revisão do diff completo sem achados P0/P1. Captura do campo salva fora dos arquivos publicados.

## Remoção da localização — 18/11/2026

Critérios 5, 7, 9 e 10 atualizados: localização, estado e município removidos; a referência tributária é carregada automaticamente e o ISS continua ajustável como tributo municipal.

- **88 testes aprovados**. Os 32 casos exclusivos do catálogo/validação de UFs foram substituídos por dois casos da referência sem localização e de continuidade mensal/anual. As asserções financeiras, de arredondamento, limites, retenções e adicional de IRPJ foram preservadas. Essa alteração de contagem corresponde à retirada explícita da funcionalidade, não a falhas no gate.
- Cobertura de `model.mjs`, `taxes.mjs`, `tax-reference.mjs` e `summary.mjs`: **100% linhas, 100% funções e 99,32% branches**; sintaxe e diff sem erros.
- Navegador: nenhum campo ou bloco de localização no DOM; estimativa inicial de R$ 1.004,04, recálculo por quantidade e período, ISS ajustável a 3% (R$ 1.028,04), IRRF de 1,5%, bloqueio de entrada inválida, restauração da referência e participação fixa de 30%. Console sem erros.
- Resumo baixado pela interface conferido sem UF ou município, preservando valores, vigência, hipóteses e distinção do ISS municipal. Captura do formulário sem localização salva fora do site.
- Diff completo revisado sem achados P0/P1. Referência e testes renomeados para remover a dependência geográfica; workflow e README atualizados.
