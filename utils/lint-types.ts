import chalk from 'chalk';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __root = path.resolve(__dirname, '..');

const lintProcess = spawn('npx tsc', { cwd: __root, shell: true });
lintProcess.stdout.on('data', (data) => console.log(chalk.red(data.toString().slice(0, -1))));
lintProcess.on('close', (code) => code && process.exit(code));
