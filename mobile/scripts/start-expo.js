const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const useOnlineMode = args.includes('--online');
const platformFlags = args.filter((arg) => ['--android', '--ios', '--web'].includes(arg));

const projectRoot = path.join(__dirname, '..');

const patchScript = path.join(__dirname, 'patch-expo-node-externals.js');
require(patchScript);

if (!useOnlineMode) {
  process.env.EXPO_OFFLINE = '1';
}

const expoArgs = ['expo', 'start', ...platformFlags];

const child = spawn('npx', expoArgs, {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error('[start-expo] Erro ao iniciar Expo:', error.message);
  process.exit(1);
});
