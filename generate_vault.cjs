const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const vaultDir = path.join(__dirname, 'SkyplanVault');

if (fs.existsSync(vaultDir)) {
    fs.rmSync(vaultDir, { recursive: true, force: true });
}
fs.mkdirSync(vaultDir);
fs.mkdirSync(path.join(vaultDir, '.obsidian'));

const filesToProcess = [
    'App.tsx', 'Header.tsx', 'ScheduleGenerator.ts', 'constants.ts', 
    'database.ts', 'regulation.ts', 'types.ts', 'utils.ts'
];

const componentsDir = path.join(__dirname, 'components');
let components = [];
if (fs.existsSync(componentsDir)) {
    components = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
}

const allFiles = [...filesToProcess, ...components.map(c => `components/${c}`)];

let homeContent = `# Skyplan Pro Vault\n\nBem-vindo ao vault de documentação do código.\n\n## Arquivos Principais\n`;
filesToProcess.forEach(f => {
    const base = path.basename(f).replace(/\.tsx?$/, '');
    homeContent += `- [[${base}]]\n`;
});
homeContent += `\n## Componentes\n`;
components.forEach(f => {
    const base = path.basename(f).replace(/\.tsx?$/, '');
    homeContent += `- [[${base}]]\n`;
});

fs.writeFileSync(path.join(vaultDir, 'Home.md'), homeContent);

for (const file of allFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Find imports to create links
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    let links = new Set();
    while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath.startsWith('.')) {
            let baseName = path.basename(importPath).replace(/\.tsx?$/, '');
            if (baseName) {
                links.add(`[[${baseName}]]`);
            }
        }
    }

    const noteName = path.basename(file).replace(/\.tsx?$/, '');
    
    let noteContent = `# ${noteName}\n\n`;
    if (links.size > 0) {
        noteContent += `## Dependências\n${Array.from(links).join(', ')}\n\n`;
    }
    
    noteContent += `## Código Fonte\n\`\`\`typescript\n${content}\n\`\`\`\n`;
    
    fs.writeFileSync(path.join(vaultDir, `${noteName}.md`), noteContent);
}

execSync('zip -r Skyplan_Obsidian_Vault.zip SkyplanVault');
console.log('Vault criado com sucesso!');
