> **Última Atualização:** 12/08/2026 às 06:51:00

# Componente: FatigueChart (`components/FatigueChart.tsx`)

## 🎯 O que este componente faz?

O `FatigueChart.tsx` é o componente responsável pelo desenho do gráfico SVG da variação do nível de fadiga humana ao longo das horas e dias do mês.

## 📁 Localização no Repositório
`components/FatigueChart.tsx`

## 🏷️ Categoria
*Visualização de Dados (SVG / React)*

---

## 🧠 Mapeamento Detalhado de Funções e Métodos

1. **Plotagem da Curva SVG**:
   - Desenha o traçado contínuo do índice de fadiga divididos por faixas de risco: Seguro (verde), Moderado (amarelo), Alto (laranja) e Crítico (vermelho).

2. **Sombreamento WOCL**:
   - Aplica faixas verticais sombreadas para destacar os períodos de janela circadiana baixa.

3. **Tooltip Flutuante**:
   - Exibe a pontuação exata de fadiga e os fatores contribuintes ao passar o cursor sobre qualquer ponto da curva.
