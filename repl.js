import repl from 'node:repl';

const [, , appName, envName, authMode] = process.argv;

if (!appName || !envName) {
  console.error('Usage: node repl.js <app> <env> [authMode]');
  process.exit(1);
}

try {
  process.loadEnvFile();
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const { default: getEnvironment } = await import(`./apps/${appName}/config.js`);
const { default: makeApi } = await import(`./apps/${appName}/api.js`);

const env = getEnvironment(envName);
const api = makeApi(env, authMode ? { authMode } : undefined);

const replServer = repl.start({ prompt: `${appName}:${envName}> ` });
replServer.context.api = api;
replServer.context.env = env;
