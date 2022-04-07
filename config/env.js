// development | production
let buildEnv = 'development';

exports.setEnv = env => /^development|production$/.test(env) && (buildEnv = env);

exports.getEnv = () => buildEnv;
