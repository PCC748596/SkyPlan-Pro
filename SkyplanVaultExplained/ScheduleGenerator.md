> **Última Atualização:** 12/08/2026 às 06:51:00

# Módulo: Gerador Automático de Escalas (`ScheduleGenerator.md` / `services/autoGenerator.ts`)

## 🎯 O que este módulo faz?

O `ScheduleGenerator.md` documenta a lógica do motor de inteligência e otimização responsável por alocar automaticamente a malha aérea e as folgas regulamentares na escala.

## 📁 Localização no Repositório
`services/autoGenerator.ts`

## 🏷️ Categoria
*Inteligência Operacional e Otimização de Escala*

---

## 🧠 Mapeamento Detalhado de Funções e Métodos

1. **`generateScheduleStream(params, crew, flights, activities, currentSchedule)`**:
   - Função geradora assíncrona que calcula e distribui em tempo real a escala ideal, respeitando o RBAC 117 sem bloquear a interface.
