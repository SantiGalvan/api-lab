import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function saveReport(name, data, { dir = 'runs' } = {}) {
  await mkdir(dir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filepath = join(dir, `${timestamp}-${name}.json`);

  await writeFile(filepath, JSON.stringify(data, null, 2));

  return filepath;
}
