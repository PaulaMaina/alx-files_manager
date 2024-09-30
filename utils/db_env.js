import { readFileSync, existsSync } from 'fs';

const dbEnvVariables = () => {
  const env = process.env.npm_lifecycle_event || 'dev';
  const envPath = env.includes('test') || env.includes('cover') ? '.env.test' : '.env';

  if (existsSync(envPath)) {
    const data = readFileSync(envPath, 'utf-8').trim().split('\n');

    for (const dt of data) {
      const delimiterPos = dt.indexOf('=');
      const envVariable = dt.substring(0, delimiterPos);
      const value = dt.substring(delimiterPos + 1);

      process.env[envVariable] = value;
    }
  }
};

export default dbEnvVariables;
