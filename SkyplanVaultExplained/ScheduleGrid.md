> **Última Atualização:** 12/08/2026 às 06:55:52

# Componente: ScheduleGrid (`components/ScheduleGrid.tsx`)

## 🎯 O que este componente faz?

O `ScheduleGrid.tsx` é o componente central e mais importante da plataforma. Ele renderiza a matriz de escala (linhas com tripulantes/aeronaves x colunas com dias do mês), suportando arrasto e soltura (Drag & Drop), atalhos de teclado (Copiar/Colar/Deletar) e modo Timeline (Gantt 24h).

## 📁 Localização no Repositório
`components/ScheduleGrid.tsx`

## 🏷️ Categoria
*Interface Visual (UI / React)*

---

## 🧠 Mapeamento Detalhado de Funções e Ajustes Recentes

1. **Compactação de Layout (Altura dos Tripulantes de 66px)**:
   - A altura das linhas dos tripulantes foi reduzida para **66px (`min-h-[66px]`)** (redução acumulada de 30px em relação aos 96px originais), permitindo visualizar significativamente mais tripulantes por página sem rolagem.
   - Na visão Timeline, a altura da linha foi ajustada de 112px (`h-28`) para **97px (`h-[97px]`)**.
   - Na visão por Aeronaves, a altura foi ajustada de 116px (`h-[116px]`) para **101px (`h-[101px]`)**.

2. **`filteredCrew`**:
   - Filtra em tempo real os tripulantes exibidos de acordo com as seleções de Comandante (`showCaptains`) e Copiloto (`showFirstOfficers`).

3. **`handleKeyDown(e)`**:
   - Intercapta as teclas `Ctrl+C`, `Ctrl+V` e `Delete` para manipular programações de dias e células selecionadas.

4. **`getAssignmentPosition(assignment)`**:
   - Calcula os percentuais de início e largura das barras de tempo de 24 horas na visualização Gantt/Timeline.

5. **`onDrop(targetId, date, rawData)`**:
   - Recebe dados arrastados da Sidebar ou de outras células e envia a nova atribuição para o orquestrador `App.tsx`.
