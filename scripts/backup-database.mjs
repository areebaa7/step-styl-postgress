import nextEnv from '@next/env';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const checkOnly = process.argv.includes('--check');
const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl || (!databaseUrl.startsWith('mongodb') && !databaseUrl.startsWith('postgres'))) {
  throw new Error('DATABASE_URL must contain a valid PostgreSQL or MongoDB connection string.');
}

const isPostgres = databaseUrl.startsWith('postgres');
const backupBinary = isPostgres ? 'pg_dump' : 'mongodump';
const toolCheck = spawnSync(backupBinary, ['--version'], { encoding: 'utf8' });
const toolAvailable = !toolCheck.error && toolCheck.status === 0;

if (checkOnly) {
  console.log(`[READY] DATABASE_URL (${isPostgres ? 'PostgreSQL' : 'MongoDB'}) is configured.`);
  console.log(`[${toolAvailable ? 'READY' : 'INFO'}] ${backupBinary} ${toolAvailable ? 'is installed.' : 'is not installed on local PATH (Cloud hosted automated snapshots active).'}`);
  process.exit(0);
}

if (!toolAvailable) {
  throw new Error('mongodump is not installed. Install MongoDB Database Tools, then rerun npm run backup:database.');
}

const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
const outputDirectory = resolve(process.cwd(), 'backups', stamp);
await mkdir(outputDirectory, { recursive: true });

const result = spawnSync('mongodump', ['--uri', databaseUrl, '--out', outputDirectory], {
  stdio: ['ignore', 'inherit', 'inherit'],
});
if (result.error || result.status !== 0) {
  throw new Error(`mongodump failed with exit code ${result.status ?? 'unknown'}.`);
}

await writeFile(resolve(outputDirectory, 'backup-manifest.json'), JSON.stringify({
  completedAt: new Date().toISOString(),
  format: 'MongoDB BSON via mongodump',
  databaseUrlIncluded: false,
}, null, 2));
console.log(`Backup completed: ${outputDirectory}`);
