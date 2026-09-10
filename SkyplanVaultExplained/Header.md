> **Última Atualização:** 12/08/2026 às 06:51:00

# Componente: Header (`components/Header.tsx`)

## 🎯 O que este componente faz?

O `Header.tsx` é a barra de navegação e comandos no topo da interface. Ele centraliza os botões de alternância de abas (`GRID`, `AERONAVES`, `FADIGA`), seletores de visão (Timeline / Gantt 24h e Modo Coordenação Rapida) e botões de atalho para todos os modais de gestão.

## 📁 Localização no Repositório
`components/Header.tsx`

## 🏷️ Categoria
*Interface Visual (UI / React)*

---

## 🧠 Mapeamento Detalhado de Funções e Métodos

1. **`setActiveTab(tab)`**:
   - Comuta a exibição da tela principal entre a Matriz de Escala, Visão por Aeronave, Módulo de Fadiga ou Modais do Sistema.

2. **`setViewMode(mode)`**:
   - Alterna o modo de agrupamento do grid principal entre `CREW` (por tripulante) e `AIRCRAFT` (por matrícula física).

3. **`onToggleTimelineView()`**:
   - Alterna a exibição das células do grid entre o formato de blocos compactos e a visualização Gantt proporcional de 24 horas.

4. **`onToggleCoordinationMode()`**:
   - Ativa a visualização ultra-compacta para ajuste rápido de malha em salas de controle.

5. **`onLogout()`**:
   - Encerra a sessão ativa do usuário e limpa o estado de autenticação em `localStorage`.
