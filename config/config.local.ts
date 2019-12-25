import { EggAppConfig, PowerPartial } from 'egg';

export default () => {
  const config: PowerPartial<EggAppConfig> = {};
  config.env = {
    // config the import data file directory
    WORKING_DIR: ''
  } as any

  return config;
};
