> **Última Atualização:** 12/08/2026 às 06:51:00

# Módulo: Módulo de Armazenamento (`database.md` / `services/storage.ts`)

## 🎯 O que este módulo faz?

O `database.md` descreve a camada de persistência local da aplicação baseada em **IndexedDB** (`/services/storage.ts`). Ele substitui o `localStorage` padrão para oferecer capacidade assíncrona ilimitada de armazenamento de dados offline.

## 📁 Localização no Repositório
`services/storage.ts`

## 🏷️ Categoria
*Persistência de Dados e Banco de Dados Local*

---

## 🧠 Mapeamento Detalhado de Funções e Métodos

1. **`WebStorageService.getSchedule()` / `saveSchedule(schedule)`**:
   - Grava e recupera a matriz global da escala no IndexedDB.

2. **`WebStorageService.getCrew()` / `saveCrew(crew)`**:
   - Gerencia a lista e histórico de tripulantes.

3. **`WebStorageService.getAircraft()` / `saveAircraft(aircraft)`**:
   - Gerencia as matrículas e o estado da APU das aeronaves.

4. **`WebStorageService.getFlights()` / `saveFlights(flights)`**:
   - Armazena a malha aérea e etapas de voo.
