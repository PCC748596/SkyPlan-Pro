const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const vaultDir = path.join(__dirname, 'SkyplanVaultExplained');

if (fs.existsSync(vaultDir)) {
    fs.rmSync(vaultDir, { recursive: true, force: true });
}
fs.mkdirSync(vaultDir);
fs.mkdirSync(path.join(vaultDir, '.obsidian'));

const filesToProcess = [
    { name: 'App', desc: 'Componente React raiz da aplicação. Gerencia o estado global (tripulantes, voos, data base), coordenando a integração entre os componentes de interface (Sidebar, Grid, Modais) e inicializando a aplicação.' },
    { name: 'Header', desc: 'Descontinuado ou utilizado apenas na raiz de legado. A barra principal encontra-se em components/Header.tsx.' },
    { name: 'ScheduleGenerator', desc: 'Motor principal de geração de escala (Roster). Contém a lógica complexa de alocação de voos, otimização de pareamento de tripulantes, distribuição de folgas (FS) e respeitando regras de fadiga e regulamentação (em conjunto com regulation.ts). Tenta alocar dias off e encaixar os voos sem gerar quebras na lei.' },
    { name: 'constants', desc: 'Armazena variáveis constantes e configurações imutáveis do sistema, como códigos de cores para a UI, limites absolutos de regulamentação padrão (ex: horários limites) e listas de status ou flags para a grid.' },
    { name: 'database', desc: 'Lida com a integração de dados e persistência local, além de providenciar as funções de download e carregamento das programações de banco de dados e arquivos locais (ex: parsing inicial).' },
    { name: 'regulation', desc: 'Módulo supercrítico do sistema responsável por interpretar as regras de jornada e descanso (especialmente o RBAC 117). Faz validações de fadiga, cálculo de pontuação de fadiga, verifica tempo de repouso mínimo obrigatório, jornada máxima diária de trabalho, e limites semanais/mensais de horas e folgas regulamentares.' },
    { name: 'types', desc: 'Define os tipos (TypeScript) estruturais e as tipagens de toda a aplicação: Crew (tripulante), Flight (voos), ScheduleBlock (blocos de jornada), etc. Essencial para consistência e intellisense na base de código.' },
    { name: 'utils', desc: 'Contém funções utilitárias puras, sem estado. Isso inclui formatação de datas e horas, conversões de horários string ("HH:MM") em minutos corridos desde a meia-noite (e vice-versa), cálculos matemáticos de intervalo e sobreposição de horários, e outros facilitadores gerais.' },
];

const componentDescriptions = {
    'ActivitiesModal': 'Modal para visualização e edição das atividades customizadas e funções da tripulação.',
    'AircraftInfo': 'Painel exibindo as informações detalhadas da aeronave selecionada no sistema.',
    'AircraftSearchModal': 'Modal contendo barra de busca e listagem interativa para procurar por aeronaves na frota.',
    'BasesModal': 'Modal para gerenciar as bases operacionais contratuais dos tripulantes.',
    'ClearScheduleModal': 'Aviso de confirmação e lógica interativa para limpar e resetar a escala gerada ou importada.',
    'CrewDetailsModal': 'Visualização profunda de detalhes de um único tripulante (incluindo documentos, histórico recente, jornada, repousos).',
    'CrewInfo': 'Card ou painel menor que exibe o resumo imediato dos dados de um tripulante.',
    'CrewSearchModal': 'Modal para busca, aplicação de filtros e seleção de tripulantes para ações na escala.',
    'EditAssignmentModal': 'Permite a edição manual de uma designação específica da escala para um dado tripulante e data.',
    'EditFlightModal': 'Edição dos dados (horários, origem, destino, etc) de um voo já cadastrado ou parte da malha.',
    'FatigueChart': 'Componente de gráfico visual avançado que exibe as métricas de fadiga de um tripulante flutuando ao longo do mês.',
    'FatigueModule': 'Interface ou painel completo que agrupa as informações de controle e predição de fadiga.',
    'FatigueSettingsModal': 'Modal de configurações de calibração para os cálculos e parâmetros sensíveis de fadiga (pesos).',
    'FleetTypeModal': 'Interface para cadastrar e gerenciar os tipos de frota (classes de aeronaves) da empresa.',
    'FlightNetworkModal': 'Interface para gerenciar, editar e visualizar a Malha Aérea regular (lista de voos sequenciais / planejamento).',
    'GenerationSettingsModal': 'Configurações avançadas do otimizador algorítmico de escala (regras de alocação de FS, preferências de pernoite, otimização de folgas e restrições).',
    'Header': 'Barra superior global da interface (Header principal) com controles de navegação, status e botões de exportação (PDF, CSV).',
    'ProgrammingCopyModal': 'Modal que permite importar ou copiar programações estruturadas (como CSVs, planilhas e relatórios de outros sistemas).',
    'QualificationModal': 'Painel para gerenciar as qualificações técnicas e exames (ex: CHT, CMA) e os limites de vencimento dos tripulantes.',
    'RightSidebar': 'Barra lateral direita (drawer) que geralmente exibe detalhes rápidos contextuais ao se clicar em um voo ou tripulante.',
    'ScheduleCell': 'Célula individual atômica da Grid de Escala, exibindo de maneira condensada o status de 1 dia de um tripulante (folga, voo, reserva) e lidando com eventos de clique/drag.',
    'ScheduleGrid': 'A matriz complexa e tabela completa (Tripulantes x Dias do Mês). É o coração visual do aplicativo que renderiza centenas de ScheduleCells e processa a lógica de paginação e renderização da escala.',
    'Sidebar': 'Menu lateral esquerdo contendo a navegação principal (Módulos, Configurações, Dashboards) e controles de filtros rápidos.'
};

let homeContent = `# Skyplan Pro Vault - Explicações\n\nBem-vindo ao vault de documentação descritiva do código da aplicação Skyplan Pro.\nEste formato destina-se a explicar a arquitetura do projeto e o que cada componente e módulo faz, ideal para consulta teórica.\n\n## Core e Regras de Negócio\nEstes são os arquivos que definem como o sistema funciona nos bastidores:\n`;
filesToProcess.forEach(f => {
    homeContent += `- [[${f.name}]]\n`;
});

const componentsDir = path.join(__dirname, 'components');
let components = [];
if (fs.existsSync(componentsDir)) {
    components = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
}

homeContent += `\n## Interface e Componentes Visuais\nEstes são os arquivos do \`/components\` responsáveis por montar a parte visual do React:\n`;
components.forEach(f => {
    const base = path.basename(f).replace(/\.tsx?$/, '');
    homeContent += `- [[${base}]]\n`;
});

fs.writeFileSync(path.join(vaultDir, 'Home.md'), homeContent);

// Write Main files
for (const file of filesToProcess) {
    let noteContent = `# Arquivo: ${file.name}.ts(x)\n\n`;
    noteContent += `## O que este arquivo faz?\n\n${file.desc}\n\n`;
    noteContent += `## Categoria\n\n*Core da Aplicação / Regras de Negócio*\n`;
    fs.writeFileSync(path.join(vaultDir, `${file.name}.md`), noteContent);
}

// Write Component files
for (const comp of components) {
    const baseName = path.basename(comp).replace(/\.tsx?$/, '');
    const desc = componentDescriptions[baseName] || `Componente React de interface de usuário encarregado da renderização de ${baseName}.`;
    
    let noteContent = `# Componente: ${baseName}\n\n`;
    noteContent += `## O que este componente faz?\n\n${desc}\n\n`;
    noteContent += `## Localização no Repositório\n\n\`components/${comp}\`\n`;
    noteContent += `\n## Categoria\n\n*Interface Visual (UI / React)*\n`;
    
    fs.writeFileSync(path.join(vaultDir, `${baseName}.md`), noteContent);
}

execSync('python3 -m zipfile -c Skyplan_Obsidian_Explicado.zip SkyplanVaultExplained');
console.log('Vault explicado criado com sucesso!');
