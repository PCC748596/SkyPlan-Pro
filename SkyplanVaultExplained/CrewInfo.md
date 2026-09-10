> **Última Atualização:** 12/08/2026 às 06:58:44

# Componente: CrewInfo (`components/CrewInfo.tsx`)

## 🎯 O que este componente faz?

O `CrewInfo.tsx` é o cartão fixo lateral do tripulante no grid da escala. Ele exibe a senioridade, função (`CMTE`/`COP`), nome, tags operacionais e um painel dedicado de estatísticas consolidadas (`HST`, `HS`, `FR`, `FS`, `SA`).

## 📁 Localização no Repositório
`components/CrewInfo.tsx`

## 🏷️ Categoria
*Interface Visual (UI / React)*

---

## 🧠 Mapeamento Detalhado de Funções e Ajustes Recentes

1. **Compactação de Layout e Coluna de Estatísticas**:
   - A altura mínima da linha foi otimizada para **66px (`min-h-[66px]`)**.
   - A coluna de estatísticas (Horas e Folgas: `HST`, `HS`, `FR`, `FS`, `SA`) teve sua altura, paddings e tamanhos de fonte ajustados e compactados para se encaixarem perfeitamente no container de 66px sem qualquer transbordamento.

2. **`cycleTag<T>(current, options, type)`**:
   - Alterna ciclicamente as tags operacionais (`GS`, `EMI`, `AVBL`, `REC`, `OFF`, `REQ`, `AGD`), de instrução (`TRI`, `TRE`) e sintéticas (`SFI`, `SFE`, `BANCA`) ao clicar nos chips do card.

3. **`getTagStyles(tag)`**:
   - Mapeia e aplica dinamicamente as classes Tailwind de estilo e cor para cada tag operacional.

4. **`hasExpiredQualification` / `hasPendingQualification`**:
   - Avalia o estado dos exames e licenças do tripulante (CMA, ICAO, Passaporte) para indicar alertas visuais em vermelho.

5. **Painel Lateral de Estatísticas (`Stats Column`)**:
   - Exibe a contagem mensal/anual de **HST** (Horas Totais Acumuladas), **HS** (Horas de Voo no Mês), **FR** (Folgas Regulamentares com indicador mínimo de 8), **FS** (Folgas Sociais com indicador mínimo de 2) e **SA** (Sobreavisos).
