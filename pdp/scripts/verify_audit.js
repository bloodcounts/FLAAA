#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const crypto = require('crypto');
const jws = require('jws');

function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
}

function verifyToken(token, expected, keys) {
  const decoded = typeof token === 'string' ? jws.decode(token) : null;
  const key = decoded && keys.get(decoded.header.kid);
  if (!key || decoded.header.alg !== 'ES256'
      || !jws.verify(token, 'ES256', key) || decoded.payload !== expected) {
    throw new Error('invalid signature, payload, algorithm, or key id');
  }
}

function verifyAudit(entries, checkpoints, keys) {
  if (!entries.length) throw new Error('audit log is empty');
  let previous = '0'.repeat(64);
  entries.forEach((entry, index) => {
    const audit = entry.pdpAudit;
    if (!audit || audit.sequence !== index + 1 || audit.previous_event_hash !== previous) {
      throw new Error(`chain discontinuity at record ${index + 1}`);
    }
    verifyToken(entry.jws, entry.signedPayload, keys);
    if (canonical(JSON.parse(entry.signedPayload)) !== canonical({ pdpAudit: audit })) {
      throw new Error(`signed payload mismatch at record ${index + 1}`);
    }
    const hash = crypto.createHash('sha256').update(canonical({
      pdpAudit: audit, jws: entry.jws, signedPayload: entry.signedPayload,
    })).digest('hex');
    if (hash !== entry.event_hash) throw new Error(`event hash mismatch at record ${index + 1}`);
    previous = hash;
  });
  let lastSequence = 0;
  checkpoints.forEach((checkpoint) => {
    const sequence = checkpoint.checkpoint_sequence;
    const payload = canonical({ checkpoint_sequence: sequence, event_hash: checkpoint.event_hash });
    verifyToken(checkpoint.signature, payload, keys);
    if (!Number.isInteger(sequence) || sequence <= lastSequence
        || entries[sequence - 1]?.event_hash !== checkpoint.event_hash) {
      throw new Error(`checkpoint mismatch or truncation at record ${sequence}`);
    }
    lastSequence = sequence;
  });
  return { ok: true, records: entries.length, checkpoints: checkpoints.length, lastAnchoredSequence: lastSequence };
}

function readJsonl(filename) {
  return fs.readFileSync(filename, 'utf8').split('\n').filter((line) => line.trim()).map(JSON.parse);
}

if (require.main === module) {
  const [auditPath, checkpointPath, ...keyArgs] = process.argv.slice(2);
  if (!auditPath || !checkpointPath || !keyArgs.length) {
    console.error('Usage: node scripts/verify_audit.js <audit.jsonl> <checkpoints.jsonl> <kid=public.pem> [...]');
    process.exitCode = 2;
  } else {
    try {
      const keys = new Map(keyArgs.map((arg) => {
        const separator = arg.indexOf('=');
        if (separator < 1) throw new Error('public keys must use kid=path syntax');
        return [arg.slice(0, separator), fs.readFileSync(arg.slice(separator + 1), 'utf8')];
      }));
      const result = verifyAudit(readJsonl(auditPath), readJsonl(checkpointPath), keys);
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(JSON.stringify({ ok: false, reason: err.message }));
      process.exitCode = 3;
    }
  }
}
module.exports = { verifyAudit };
