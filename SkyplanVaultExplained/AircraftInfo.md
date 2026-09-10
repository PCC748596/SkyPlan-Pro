> **Última Atualização:** 12/08/2026 às 06:51:00

# Componente: AircraftInfo (`components/AircraftInfo.tsx`)

## 🎯 O que este componente faz?

O `AircraftInfo.tsx` é o cartão lateral fixo das aeronaves, exibido na visão de escala por frota (`AIRCRAFT`). Ele exibe a matrícula, modelo, base principal, acúmulo de horas de voo e o indicador interativo de operabilidade da APU.

## 📁 Localização no Repositório
`components/AircraftInfo.tsx`

## 🏷️ Categoria
*Interface Visual (UI / React)*

---

## 🧠 Mapeamento Detalhado de Funções e Métodos

1. **`onToggleApu(id)`**:
   - Alterna o status da APU da aeronave entre `APU OK` (verde) e `APU INOP` (vermelho), fator crítico para gerenciamento de tempos de solo e infraestrutura de suporte.

2. **Ajuste de Altura (`h-[101px]`)**:
   - Alinhado com a nova altura compactada do grid de aeronaves.

3. **Métricas da Aeronave**:
   - Apresenta a Base Operacional (`base`), Frota (`fleetId`) e Horas Totais de Voo da célula (`totalHours`).
