> **Última Atualização:** 12/08/2026 às 06:51:00

# Módulo: Motor Regulatório RBAC 117 (`regulation.ts`)

## 🎯 O que este módulo faz?

O `regulation.ts` é o motor matemático e normativo que aplica as regras do **RBAC 117** (jornada, tempo de voo, limites de repouso, janela circadiana e folgas).

## 📁 Localização no Repositório
`regulation.ts`

## 🏷️ Categoria
*Regras de Negócio e Validação Regulatória*

---

## 🧠 Mapeamento Detalhado de Funções e Métodos

1. **`validateAssignmentRules(crew, date, assignment, currentSchedule, config)`**:
   - Valida limites de horas de voo diárias, descanso mínimo pré e pós jornada, cruzamento da WOCL e contagem de folgas.

2. **`calculateFatigueScore(crewId, schedule, activities)`**:
   - Retorna a pontuação numérica de risco de fadiga do tripulante.

3. **`STANDARD_TIMES`**:
   - Tabela normativa de tempos de apresentação, debriefing e repouso mínimo.
