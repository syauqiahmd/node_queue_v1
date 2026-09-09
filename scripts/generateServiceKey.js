#!/usr/bin/env node
/* eslint-disable no-console -- CLI script, console output is the interface */
require('dotenv').config();
const crypto = require('crypto');

const serviceName = process.argv[2];

if (!serviceName || !/^[a-zA-Z0-9_-]+$/.test(serviceName)) {
  console.error('Usage: npm run generate:service-key -- <serviceName>');
  console.error('  <serviceName> must contain only letters, numbers, "_" or "-".');
  process.exit(1);
}

const existing = (process.env.SERVICE_API_KEYS || '')
  .split(',')
  .map((pair) => pair.trim())
  .filter(Boolean);

if (existing.some((pair) => pair.split(':')[0] === serviceName)) {
  console.error(
    `"${serviceName}" already has a key in SERVICE_API_KEYS. Remove its entry first if you want to rotate it.`
  );
  process.exit(1);
}

const key = crypto.randomBytes(32).toString('hex');
const combined = [...existing, `${serviceName}:${key}`].join(',');

console.log(
  `\nGive this key to "${serviceName}" (send it out-of-band, e.g. a secrets manager - not git or chat):`
);
console.log(`  ${key}\n`);
console.log('Paste this line into .env:');
console.log(`  SERVICE_API_KEYS=${combined}\n`);
