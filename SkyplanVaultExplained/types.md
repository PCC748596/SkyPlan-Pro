> **Última Atualização:** 12/08/2026 às 06:51:00

# Módulo: Tipos e Interfaces (`types.ts`)

## 🎯 O que este módulo faz?

O `types.ts` estabelece as interfaces TypeScript, enums e tipos fundamentais consumidos por toda a aplicação.

## 📁 Localização no Repositório
`types.ts`

## 🏷️ Categoria
*Contratos de Dados e Tipagem TypeScript*

---

## 🧠 Mapeamento Detalhado de Estruturas

1. **`CrewMember`**:
   - Interface com dados cadastrais, senioridade (`seniority`), função (`role`: `CMTE`/`COP`), base, tags operacionais e estatísticas acumuladas.

2. **`Assignment`**:
   - Representa cada bloco de atividade ou voo atribuído a um dia.

3. **`GlobalSchedule`**:
   - Dicionário chave-valor indexado por ID do membro/aeronave e data ISO (`YYYY-MM-DD`).
