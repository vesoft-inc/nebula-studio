import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAppConfig = () => {
  const file = fs.readFileSync(path.resolve(__dirname, '../server/api/studio/etc/studio-api.yaml'), 'utf8');
  const appConfig = yaml.load(file);
  return appConfig;
};
