const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

exports.getAppConfig = () => {
  const file = fs.readFileSync(path.resolve(__dirname, '../server/api/studio/etc/studio-api.yaml'), 'utf8');
  const appConfig = yaml.load(file);
  return appConfig;
};
