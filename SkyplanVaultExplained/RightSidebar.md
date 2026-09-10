> **Última Atualização:** 12/08/2026 às 06:51:00

# Componente: RightSidebar (`components/RightSidebar.tsx`)

## 🎯 O que este componente faz?

O `RightSidebar.tsx` é o painel lateral direito de auditoria e diário de bordo da aplicação. Ele monitora a conformidade regulatória (RBAC 117), exibe avisos de fadiga, conflitos de jornada e resultados da geração automática de escalas.

## 📁 Localização no Repositório
`components/RightSidebar.tsx`

## 🏷️ Categoria
*Interface Visual (UI / React)*

---

## 🧠 Mapeamento Detalhado de Funções e Métodos

1. **`filteredLogs`**:
   - Filtra a lista de mensagens por nível de gravidade: `ALL` (todos), `ERROR` (erros impeditivos), `WARNING` (avisos de jornada/fadiga) e `INFO` (mensagens operacionais).

2. **`onReviewMonth()`**:
   - Dispara uma varredura completa na matriz do mês ativo para detectar inconsistências operacionais ou quebras de repouso mínimo.

3. **`onClearLogs()`**:
   - Limpa a lista de logs de auditoria da sessão atual.

4. **`onToggleCollapse()`**:
   - Alterna o painel lateral entre o modo expandido (320px) e o modo de barra fina recolhida (48px).
