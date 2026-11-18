# White Label | Zermatt Garantidora

Simulador visual de remuneração de parcerias, com a identidade da Zermatt Garantidora.

Informe a quantidade de condomínios, a arrecadação mensal média por condomínio, a taxa e a participação da administradora. O gráfico apresenta o repasse à administradora e a receita da Zermatt, com visualizações mensal e anual e resumo para download.

## Executar

Aplicação estática, sem dependências ou etapa de build. Na pasta do projeto:

```sh
python3 -m http.server 8000
```

Acesse http://localhost:8000. Use um servidor HTTP para carregar os módulos JavaScript.

Os arquivos também podem ser publicados em qualquer hospedagem estática, usando esta pasta como raiz do site.

## Cálculo

- Arrecadação total mensal = quantidade × arrecadação média por condomínio.
- Receita da taxa = arrecadação total × taxa aplicada ÷ 100.
- Repasse à administradora = receita da taxa × participação ÷ 100.
- Receita da Zermatt = receita da taxa − repasse à administradora, antes de outras despesas.

O exemplo inicial usa 1 condomínio, arrecadação de R$ 100.000, taxa de 4% e participação de 30%: R$ 1.200 para a administradora e R$ 2.800 para a Zermatt por mês.

Em **Taxa por quantidade**, as faixas são configuráveis. A maior quantidade mínima atingida determina a taxa aplicada sobre toda a carteira. Sem faixas, vale a taxa inicial. A projeção anual considera 12 meses iguais, com arredondamento mensal em centavos.

## Líquido estimado do franqueado

Selecione o **estado do franqueado**. A pagadora permanece identificada como Zermatt/Paraná. A seleção carrega uma referência **estimada de lucro presumido para serviços de intermediação entre PJs**, revisada em **18/11/2026**; não confirma o regime real do franqueado.

O campo abaixo da receita total mostra o líquido sobre a **comissão da administradora**, com discriminação de ISS, PIS, Cofins, IRPJ e CSLL. Na referência, o IRPJ inclui o adicional quando aplicável. A presunção majorada de 2026 é aplicada ao excedente do limite proporcional trimestral de R$ 1,25 milhão; a provisão usa três meses iguais e somente esta comissão, sem outras receitas ou ajustes acumulados. Valores de IRPJ/CSLL são calculados diretamente, sem usar o arredondamento dos percentuais exibidos. Acima de R$ 78 milhões anuais projetados, a referência é bloqueada; use o enquadramento validado pela contabilidade.

**O ISS é municipal.** Sem a alíquota do município e do serviço, usa-se 5% como referência e mostra-se a sensibilidade do líquido entre ISS de 2% e 5%. Informe o município para registrar o contexto e ajuste o ISS conforme a contabilidade. Não há consulta automática à prefeitura. Mudar de estado, por si só, não muda os impostos federais nem acrescenta ICMS interestadual a esta hipótese de serviço; valores iguais entre UFs são esperados.

Em **Impostos e retenções**, ajuste as alíquotas efetivas e informe separadamente as retenções. Campo vazio significa desconhecido; informe `0` para ausência de incidência ou retenção. Alterar somente o ISS preserva o cálculo federal automático. Alterar outro tributo passa para alíquotas manuais; selecionar outra UF ou carregar a referência novamente restaura os parâmetros e limpa retenções/município quando a UF muda.

- Comissão bruta = repasse à administradora antes dos tributos.
- Valor previsto no pagamento = comissão bruta − retenções informadas.
- Líquido disponível = pagamento − saldo de tributos a recolher pelo franqueado.
- IRRF pode antecipar IRPJ: a parcela retida não é descontada novamente como custo.
- Retenção excedente aparece como crédito a compensar, sem pressupor devolução imediata ou compensação entre tributos.
- Sem todas as retenções, o líquido considera a carga tributária informada e o pagamento permanece pendente.

No exemplo de R$ 1.200 de comissão, ISS de 5%, PIS de 0,65%, Cofins de 3%, IRPJ efetivo de 4,8% e CSLL efetiva de 2,88%, os tributos somam R$ 195,96 e o líquido é R$ 1.004,04. Se apenas IRRF de 1,5% for retido, o pagamento estimado é R$ 1.182 e o saldo tributário é R$ 177,96. **São hipóteses ilustrativas, não uma orientação para efetuar essas retenções.**

O resumo baixado inclui UF, município informado, valores, alíquotas, retenções, faixa de ISS e hipóteses. A referência não calcula Simples Nacional/DAS, lucro real, benefícios, créditos ou outras receitas da empresa. As regras e fontes estão em [docs/commission-taxes.md](docs/commission-taxes.md) e na própria interface. A projeção anual repete os parâmetros de 2026 e não prevê mudanças legais. Valide com a contabilidade antes de emitir a nota ou pagar.

## Testes

Com Node.js 24 ou superior, sem instalar dependências:

```sh
node --test
```

Gate de cobertura dos módulos novos de cálculo e exportação:

```sh
node --test --experimental-test-coverage --test-coverage-include=taxes.mjs --test-coverage-include=regional-taxes.mjs --test-coverage-include=summary.mjs --test-coverage-lines=80 --test-coverage-functions=80 --test-coverage-branches=80
```

O workflow `Tests` executa esse gate e valida a sintaxe dos módulos. As verificações de navegador e seus limites estão documentados em [docs/verification.md](docs/verification.md).

## Arquivos

| Arquivo | Função |
| --- | --- |
| `index.html` | Interface e conteúdo |
| `styles.css` | Visual responsivo |
| `app.mjs` | Interações, gráfico e exportação |
| `model.mjs` | Cálculos e regras de volume |
| `taxes.mjs` | Cálculo tributário, retenções e validação |
| `regional-taxes.mjs` | UFs e referência federal de 2026 |
| `summary.mjs` | Resumo para download |
| `tests/` | Regressões de cálculo e exportação |
| `assets/` | Logo e favicon oficiais |

Os valores são processados no navegador e não são enviados a um servidor. Recarregar a página restaura o exemplo; baixe o resumo para conservar a simulação.

Marca e assets: [Zermatt Garantidora](https://zermattgarantidora.com.br/). Paleta: azul marinho `#1F2942`, azul `#1D67CD` e azul da logo `#2E4C70`.
