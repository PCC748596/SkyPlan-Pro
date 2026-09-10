> **Última Atualização:** 12/08/2026 às 06:51:00

# Componente: App (`App.tsx`)

## 🎯 O que este componente faz?

O `App.tsx` é o componente raiz e orquestrador principal de todo o estado global do Skyplan. Ele é responsável pelo controle de sessão do usuário, sincronização com o IndexedDB, controle de modais e roteamento entre visões e abas do sistema.

## 📁 Localização no Repositório
`App.tsx`

## 🏷️ Categoria
*Core do Sistema / Estado Global (React + TypeScript)*

---

## 🧠 Mapeamento Detalhado de Funções e Métodos

1. **`useEffect (loadData)`**:
   - Carrega assincronamente os dados de `schedule`, `crew`, `aircraft`, `fleets`, `flights`, `customBlocks`, `activities` e `qualifications` do IndexedDB via `StorageService`.
   - Executa `syncQualificationsWithSchedule` para atualizar pendências de carteira com base na escala.

2. **`handleAddAssignment(crewId, date, assignment)`**:
   - Adiciona ou atualiza uma atribuição na data informada.
   - Executa `validateAssignmentRules` para checar conflitos com o RBAC 117 e grava o resultado no estado e no IndexedDB.

3. **`handleDeleteAssignment(crewId, date, assignmentId)`**:
   - Remove a atribuição diária do tripulante e recalcula os totais operacionais do mês.

4. **`handleAutoGenerateScale(params)`**:
   - Inicia o fluxo de geração automática em lote utilizando o gerador em stream `generateScheduleStream`.

5. **`handleReviewMonth()`**:
   - Dispara uma auditoria completa no mês selecionado, registrando logs de erro e avisos no `RightSidebar`.

6. **`handleExportBackup()` / `handleImportBackup()`**:
   - Executa a exportação e restauração de dados do sistema em formato JSON.
