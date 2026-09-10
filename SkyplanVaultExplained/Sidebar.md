> **Última Atualização:** 12/08/2026 às 06:51:00

# Componente: Sidebar (`components/Sidebar.tsx`)

## 🎯 O que este componente faz?

A `Sidebar.tsx` é o painel de controle esquerdo da aplicação. Ela abriga a navegação por mês e ano, os filtros de tripulação por função (`CMTE` e `COP`), a biblioteca de **ATIVIDADES** com arrasto manual (Drag & Drop) e botões para ações de banco de dados e sincronização.

## 📁 Localização no Repositório
`components/Sidebar.tsx`

## 🏷️ Categoria
*Interface Visual (UI / React)*

---

## 🧠 Mapeamento Detalhado de Funções e Métodos

1. **`toggleDarkMode()`**:
   - Alterna a classe `dark` no documento HTML para alternar entre tema Claro e Escuro.

2. **`onToggleCaptains()` / `onToggleFirstOfficers()`**:
   - Alterna o estado dos filtros de Comandante e Copiloto. Renderiza botões estilizados com **badge estilo neon** (verde para ativo e vermelho/slate para inativo).

3. **`handleDragStart(e, activityData)`**:
   - Prepara os dados JSON da atividade selecionada para transferência via Drag & Drop até o grid.

4. **`isActivitiesMinimized` (Estado Interno)**:
   - Controla a expansão/recolhimento do accordion de ATIVIDADES. Inicia **minimizado por padrão** para economizar espaço vertical.

5. **`X` de Exclusão Rápida**:
   - Renderiza um botão `X` ampliado em cada card de atividade favorita, com feedback visual em vermelho ao passar o mouse.

6. **`handleExportBackup()` / `handleImportBackup()`**:
   - Aciona o download do banco de dados em JSON ou carrega um arquivo de backup para restauração.
