const fs = require('fs');
const path = require('path');

const targetFile = path.join(
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
);

function patchExpoNodeExternals() {
  if (!fs.existsSync(targetFile)) {
    console.warn('[patch-expo] Arquivo não encontrado, pulando patch:', targetFile);
    return;
  }

  const source = fs.readFileSync(targetFile, 'utf8');

  if (source.includes('__MONTAGEX_NODE25_PATCH__')) {
    console.log('[patch-expo] Patch já aplicado.');
    return;
  }

  const needle = 'for (const moduleId of NODE_STDLIB_MODULES){';
  if (!source.includes(needle)) {
    console.warn('[patch-expo] Trecho esperado não encontrado. Expo CLI pode ter mudado.');
    return;
  }

  const replacement = `const seenModuleIds = new Set();\n    for (const rawModuleId of NODE_STDLIB_MODULES){\n        const moduleId = rawModuleId.replace(/^node:/, "");\n        if (!moduleId || seenModuleIds.has(moduleId)) {\n            continue;\n        }\n        seenModuleIds.add(moduleId); // __MONTAGEX_NODE25_PATCH__`;

  const updated = source.replace(needle, replacement);
  fs.writeFileSync(targetFile, updated, 'utf8');

  console.log('[patch-expo] Patch aplicado com sucesso em externals.js');
}

patchExpoNodeExternals();
