const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(
    __dirname,
    '..',
    'node_modules',
    '@expo',
    'cli',
    'build',
    'src',
    'start',
    'server',
    'metro',
    'externals.js'
  ),
  path.join(
    __dirname,
    '..',
    'node_modules',
    'expo',
    'node_modules',
    '@expo',
    'cli',
    'build',
    'src',
    'start',
    'server',
    'metro',
    'externals.js'
  ),
];

function patchExpoNodeExternals() {
  const existingTargetFile = targetFiles.find((file) => fs.existsSync(file));

  if (!existingTargetFile) {
    console.log('[patch-expo] Arquivo alvo não encontrado; patch não necessário nesta versão do Expo CLI.');
    return;
  }

  const source = fs.readFileSync(existingTargetFile, 'utf8');

  if (source.includes('__MONTAGEX_NODE25_PATCH__')) {
    console.log('[patch-expo] Patch já aplicado.');
    return;
  }

  if (source.includes("const moduleId = moduleName.replace(/^node:/, '');")) {
    console.log('[patch-expo] Patch não necessário: Expo CLI já normaliza prefixo node:.');
    return;
  }

  const needle = 'for (const moduleId of NODE_STDLIB_MODULES){';
  if (!source.includes(needle)) {
    console.log('[patch-expo] Estrutura não reconhecida; patch não aplicado para evitar alteração indevida.');
    return;
  }

  const replacement = `const seenModuleIds = new Set();\n    for (const rawModuleId of NODE_STDLIB_MODULES){\n        const moduleId = rawModuleId.replace(/^node:/, "");\n        if (!moduleId || seenModuleIds.has(moduleId)) {\n            continue;\n        }\n        seenModuleIds.add(moduleId); // __MONTAGEX_NODE25_PATCH__`;

  const updated = source.replace(needle, replacement);
  fs.writeFileSync(existingTargetFile, updated, 'utf8');

  console.log('[patch-expo] Patch aplicado com sucesso em externals.js');
}

patchExpoNodeExternals();
