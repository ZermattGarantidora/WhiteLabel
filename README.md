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

## Arquivos

| Arquivo | Função |
| --- | --- |
| `index.html` | Interface e conteúdo |
| `styles.css` | Visual responsivo |
| `app.mjs` | Interações, gráfico e exportação |
| `model.mjs` | Cálculos e regras de volume |
| `assets/` | Logo e favicon oficiais |

Os valores são processados no navegador e não são enviados a um servidor. Recarregar a página restaura o exemplo; baixe o resumo para conservar a simulação.

Marca e assets: [Zermatt Garantidora](https://zermattgarantidora.com.br/). Paleta: azul marinho `#1F2942`, azul `#1D67CD` e azul da logo `#2E4C70`.
