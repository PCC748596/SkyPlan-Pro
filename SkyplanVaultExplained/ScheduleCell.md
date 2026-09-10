> **Última Atualização:** 12/08/2026 às 06:51:00

# Componente: ScheduleCell (`components/ScheduleCell.tsx`)

## 🎯 O que este componente faz?

O `ScheduleCell.tsx` representa cada célula de dia individual no grid. Ele é responsável por renderizar os blocos de compromissos (voos, folgas, sobreavisos, simulações) e aplicar estilos de cores, alertas visuais de erro e tratamento de eventos de mouse e arrasto.

## 📁 Localização no Repositório
`components/ScheduleCell.tsx`

## 🏷️ Categoria
*Interface Visual (UI / React)*

---

## 🧠 Mapeamento Detalhado de Funções e Métodos

1. **`assignments` (Lista de Atribuições Diárias)**:
   - Renderiza uma coleção de atividades no mesmo dia com estilos de cor dinâmicos provenientes de `ACTIVITY_COLORS`.

2. **`validationIssues` (Map de Erros e Conflitos)**:
   - Mapeia mensagens de erro para cada ID de atividade e renderiza ícones de alerta (`AlertTriangle` / `AlertOctagon`) diretamente no bloco do dia.

3. **`onDragOver` / `onDrop`**:
   - Captura a ação de soltar novas atividades arrastadas da Sidebar ou de outras células do grid.

4. **`onDoubleClick`**:
   - Abre o modal de edição de atribuição quando o usuário clica duas vezes sobre uma célula vazia.
