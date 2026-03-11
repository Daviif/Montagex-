const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const projectRoot = path.join(__dirname, '..');

// Aplicar patch Expo para Windows/Node 25
const patchScript = path.join(__dirname, 'patch-expo-node-externals.js');
require(patchScript);

const knownFlags = new Set(['--online', '--tunnel', '--android', '--ios', '--web']);
const passthroughArgs = args.filter((arg) => !knownFlags.has(arg));

const shouldUseTunnel =
  args.includes('--tunnel') ||
  process.env.npm_config_tunnel === 'true' ||
  process.env.npm_config_tunnel === '1';
const shouldUseOffline = !args.includes('--online') && !shouldUseTunnel;
const command = process.platform === 'win32' ? 'cmd.exe' : 'npx';

function buildExpoArgs(useTunnel) {
  const expoArgs = ['expo', 'start', ...passthroughArgs];

  if (useTunnel) {
    expoArgs.push('--tunnel');
  }

  if (args.includes('--android')) expoArgs.push('--android');
  if (args.includes('--ios')) expoArgs.push('--ios');
  if (args.includes('--web')) expoArgs.push('--web');

  return expoArgs;
}

function spawnExpo(useTunnel, canFallbackTunnel) {
  process.env.EXPO_OFFLINE = shouldUseOffline && !useTunnel ? '1' : '0';
  const expoArgs = buildExpoArgs(useTunnel);
  const cliArgs = process.platform === 'win32' ? ['/d', '/s', '/c', 'npx', ...expoArgs] : expoArgs;

  const child = spawn(command, cliArgs, {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  child.on('error', (error) => {
    console.error('[start-expo] Erro:', error.message);
    process.exit(1);
  });

  child.on('close', (code) => {
    if (canFallbackTunnel && code !== 0) {
      console.warn('[start-expo] Tunnel indisponível. Iniciando sem tunnel (LAN/offline)...');
      spawnExpo(false, false);
      return;
    }

    process.exit(code ?? 0);
  });
}

spawnExpo(shouldUseTunnel, shouldUseTunnel);
