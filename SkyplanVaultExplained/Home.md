> **Última Atualização:** 12/08/2026 às 06:51:00

# Skyplan Pro Vault - Explicações Detalhadas do Sistema

Bem-vindo ao vault oficial de documentação descritiva do código da plataforma **Skyplan Pro**.
Esta documentação detalha a arquitetura, as responsabilidades, as interfaces e a lógica de todas as funções e componentes do projeto.

---

## ⚙️ Core e Regras de Negócio (Lógica do Sistema)
- [[App]] - Componente Raiz e Orquestrador de Estado Global
- [[Header]] - Barra de Navegação Superior e Menu de Atalhos
- [[ScheduleGenerator]] - Motor de Geração Automática e Otimização de Escalas
- [[constants]] - Constantes Globais, Mapeamento de Cores e Sementes Inicializadoras
- [[database]] - Camada de Persistência Local Assíncrona via IndexedDB
- [[regulation]] - Motor de Validação Regulatória do RBAC 117 e Análise de Fadiga
- [[types]] - Definição dos Contratos de Dados e Interfaces TypeScript
- [[utils]] - Funções Utilitárias de Formatação e Manipulação de Datas

---

## 🎨 Interface e Componentes Visuais (`/components`)
- [[ActivitiesModal]] - Gerenciamento do Catálogo de Atividades
- [[AircraftInfo]] - Cartão Lateral de Informações e APU de Aeronave
- [[AircraftSearchModal]] - Busca e Cadastro de Aeronaves
- [[BasesModal]] - Cadastro de Bases Operacionais e Pernoites
- [[ClearScheduleModal]] - Confirmação de Limpeza de Escala Mensal
- [[CrewDetailsModal]] - Prontuário Completo e Histórico do Aeronauta
- [[CrewInfo]] - Cartão Lateral do Tripulante (Senioridade, Tags, Estatísticas e Altura Compacta)
- [[CrewSearchModal]] - Busca e Filtro de Tripulação
- [[EditAssignmentModal]] - Edição Individual de Atribuições Diárias
- [[EditFlightModal]] - Cadastro e Edição de Etapas de Voo
- [[FatigueChart]] - Gráfico SVG de Variação de Risco Biológico e WOCL
- [[FatigueModule]] - Painel Geral de Monitoramento de Fadiga Humana (RBAC 117)
- [[FatigueSettingsModal]] - Ajuste de Parâmetros Biomédicos de Fadiga
- [[FleetTypeModal]] - Cadastro de Tipos de Frota e Famílias
- [[FlightNetworkModal]] - Importação e Gestão da Malha Aérea
- [[GenerationSettingsModal]] - Configuração dos Parâmetros da Geração Automática
- [[LoginScreen]] - Autenticação Segura e Seleção de Perfil de Acesso
- [[ProgrammingCopyModal]] - Ferramenta de Replicação em Massa de Programação
- [[QualificationModal]] - Controle de Carteiras, Exames (CMA) e Habilitações ANAC
- [[RightSidebar]] - Diário de Auditoria, Logs e Revisão Mensal
- [[ScheduleCell]] - Célula Diária Interativa (Drag & Drop, Cores e Alertas)
- [[ScheduleGrid]] - Matriz Principal da Escala Mensal (Visão Célula e Gantt 24h)
- [[Sidebar]] - Painel Esquerdo (Navegação Temporal, Atividades e Filtros CMTE/COP)
