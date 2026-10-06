#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const jws = require('jws');

function canonicalStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => (
    `${JSON.stringify(key)}:${canonicalStringify(value[key])}`
  )).join(',')}}`;
}

function usage() {
  console.error('Usage: node scripts/verify_checkpoints.js <checkpoints.jsonl> <kid=public.pem> [...]');
  process.exit(2);
}

const [checkpointPath, ...keyArgs] = process.argv.slice(2);
if (!checkpointPath || keyArgs.length === 0 || !fs.existsSync(checkpointPath)) usage();

const keys = new Map();
for (const arg of keyArgs) {
  const separator = arg.indexOf('=');
  if (separator < 1) usage();
  const kid = arg.slice(0, separator);
  const keyPath = arg.slice(separator + 1);
  if (!fs.existsSync(keyPath)) {
    console.error(`Public key not found: ${keyPath}`);
    process.exit(2);
  }
  keys.set(kid, fs.readFileSync(keyPath, 'utf8'));
}

const lines = fs.readFileSync(checkpointPath, 'utf8').split('\n').filter((line) => line.trim());
let previousSequence = 0;
for (let index = 0; index < lines.length; index += 1) {
  let checkpoint;
  try {
    checkpoint = JSON.parse(lines[index]);
  } catch {
    console.log(JSON.stringify({ ok: false, failedAtLine: index + 1, reason: 'json-parse-error' }, null, 2));
    process.exit(3);
  }
  const { checkpoint_sequence: sequence, event_hash: eventHash, signature } = checkpoint;
  const decoded = typeof signature === 'string' ? jws.decode(signature) : null;
  const kid = decoded?.header?.kid;
  const publicKey = keys.get(kid);
  const expectedPayload = canonicalStringify({ checkpoint_sequence: sequence, event_hash: eventHash });
  if (!Number.isInteger(sequence) || sequence <= previousSequence) {
    console.log(JSON.stringify({ ok: false, failedAtLine: index + 1, reason: 'checkpoint-order' }, null, 2));
    process.exit(3);
  }
  if (!decoded || decoded.header.alg !== 'ES256' || !publicKey) {
    console.log(JSON.stringify({ ok: false, failedAtLine: index + 1, reason: 'unknown-key-or-algorithm', kid }, null, 2));
    process.exit(3);
  }
  if (decoded.payload !== expectedPayload || !jws.verify(signature, 'ES256', publicKey)) {
    console.log(JSON.stringify({ ok: false, failedAtLine: index + 1, reason: 'invalid-checkpoint-signature', kid }, null, 2));
    process.exit(3);
  }
  previousSequence = sequence;
}

console.log(JSON.stringify({ ok: true, checkpointRecords: lines.length, keyIds: [...keys.keys()] }, null, 2));
