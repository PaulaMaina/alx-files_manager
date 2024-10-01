#!/usr/bin/yarn dev
import { readFileSync, existsSync } from 'fs';

const dbEnvVariables = () => {
  const env = process.env.npm_lifecycle_event || 'dev';
  const envPath = env.includes('test') || env.includes('cover') ? '.env.test' : '.env';

  if (existsSync(envPath)) {
    const data = readFileSync(envPath, 'utf-8').trim().split('\n');

    for (const dt of data) {
      // Skip empty lines and comments
      if (!dt || dt.startsWith('#')) {
        continue;
      }

      const delimiterPos = dt.indexOf('=');
      if (delimiterPos === -1) {
        continue; // Skip if no '=' found in the line
      }

      const envVariable = dt.substring(0, delimiterPos).trim();
      const value = dt.substring(delimiterPos + 1).trim();

      process.env[envVariable] = value;
    }
  }
};

export default dbEnvVariables;

