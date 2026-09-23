import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const [, , appName, scenarioName] = process.argv;

if (!appName || !scenarioName) {
  console.error('Usage: node scenario.js <app> <scenarioName>');
  process.exit(1);
}

try {
  process.loadEnvFile();
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

function resolveScenarioUrl() {
  const perAppUrl = new URL(`./apps/${appName}/scenarios/${scenarioName}.js`, import.meta.url);
  if (existsSync(fileURLToPath(perAppUrl))) {
    return perAppUrl;
  }
  return new URL(`./scenarios/${scenarioName}.js`, import.meta.url);
}

const { default: run } = await import(resolveScenarioUrl());
const result = await run();

if (result?.filepath) {
  console.log(`Report saved to ${result.filepath}`);
}
