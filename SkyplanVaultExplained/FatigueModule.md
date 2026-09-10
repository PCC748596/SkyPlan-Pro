> **Última Atualização:** 12/08/2026 às 06:51:00

# Componente: FatigueModule (`components/FatigueModule.tsx`)

## 🎯 O que este componente faz?

O `FatigueModule.tsx` é a central gráfica de biomodelagem do ritmo circadiano e análise de risco humano dos tripulantes, operando em total consonância com as exigências do RBAC 117.

## 📁 Localização no Repositório
`components/FatigueModule.tsx`

## 🏷️ Categoria
*Módulo de Análise e Inteligência Biológica*

---

## 🧠 Mapeamento Detalhado de Funções e Métodos

1. **`selectedCrewId` / `onSelectCrew(id)`**:
   - Permite alternar o tripulante em análise para visualizar sua curva individual de prontidão e risco biológico.

2. **Identificação da Janela Circadiana (WOCL)**:
   - Identifica cruzamentos de jornada no período das 02:00 às 05:59 (Window of Circadian Low).

3. **Integração com `FatigueChart.tsx`**:
   - Repassa os pontos do modelo de fadiga calculados para renderização gráfica em curva contínua.
