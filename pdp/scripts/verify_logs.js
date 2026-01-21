#!/usr/bin/env node
"use strict";
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const jws = require('jws');

function usage() {
  console.log('Usage: node scripts/verify_logs.js <logfile1> [<logfile2> ...]');
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length < 1) usage();

// support: node verify_logs.js <files...>
// or: node verify_logs.js --dir <dir>  (scan dir for *.log)
// or: node verify_logs.js --all (scan ./logs for *.log)
let files = [];
if (args[0] === '--dir' && args[1]) {
  const targetDir = path.resolve(process.cwd(), args[1]);
  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
    console.error('Directory not found:', targetDir);
    process.exit(2);
  }
  files = fs.readdirSync(targetDir).filter(f => f.endsWith('.log')).map(f => path.join(targetDir, f));
} else if (args[0] === '--all') {
  const targetDir = path.resolve(process.cwd(), 'logs');
  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
    console.error('Logs directory not found:', targetDir);
    process.exit(2);
  }
  files = fs.readdirSync(targetDir).filter(f => f.endsWith('.log')).map(f => path.join(targetDir, f));
} else {
  files = args;
}
const pubKeyPath = process.env.SIGNING_PUB_PATH || path.resolve(process.cwd(), 'certs', 'pdp_sign_pub.pem');
let pubKeyPem = null;
if (fs.existsSync(pubKeyPath)) {
  pubKeyPem = fs.readFileSync(pubKeyPath, 'utf8');
  console.log(`Using public key: ${pubKeyPath}`);
} else {
  console.warn(`Public key not found at ${pubKeyPath}; signature verification will fail for signed entries.`);
}

let aggregate = {
  totalLines: 0,
  jsonParseErrors: 0,
  missingPdpAudit: 0,
  schemaInvalid: 0,
  unsigned: 0,
  signedValid: 0,
  signedInvalid: 0
};

function validateSchema(pdpAudit) {
  if (!pdpAudit) return false;
  const required = ['timestamp', 'decision', 'subject', 'resource', 'action', 'policyReferences'];
  for (let k of required) {
    if (!(k in pdpAudit)) return false;
  }
  const t = Date.parse(pdpAudit.timestamp);
  if (isNaN(t)) return false;
  if (!Array.isArray(pdpAudit.policyReferences)) return false;
  return true;
}

function stable(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(stable);
  const keys = Object.keys(obj).sort();
  const out = {};
  for (let k of keys) out[k] = stable(obj[k]);
  return out;
}

function findJws(obj) {
  if (!obj) return null;
  if (typeof obj === 'string') return null;
  if (obj.jws) return obj.jws;
  if (obj.message && typeof obj.message === 'object' && obj.message.jws) return obj.message.jws;
  if (obj.message && typeof obj.message === 'string') {
    try {
      const maybe = JSON.parse(obj.message);
      if (maybe && maybe.jws) return maybe.jws;
    } catch (e) {}
  }
  for (let k of Object.keys(obj)) {
    if (obj[k] && typeof obj[k] === 'object' && obj[k].jws) return obj[k].jws;
  }
  return null;
}

function findSignedPayload(obj) {
  if (!obj) return null;
  if (obj.signedPayload) return obj.signedPayload;
  if (obj.message && typeof obj.message === 'object' && obj.message.signedPayload) return obj.message.signedPayload;
  if (obj.message && typeof obj.message === 'string') {
    try { const m = JSON.parse(obj.message); if (m && m.signedPayload) return m.signedPayload; } catch (e) {}
  }
  for (let k of Object.keys(obj)) {
    if (obj[k] && typeof obj[k] === 'object' && obj[k].signedPayload) return obj[k].signedPayload;
  }
  return null;
}

async function processFile(file) {
  return new Promise((resolve, reject) => {
    const local = {
      totalLines: 0,
      jsonParseErrors: 0,
      missingPdpAudit: 0,
      schemaInvalid: 0,
      unsigned: 0,
      signedValid: 0,
      signedInvalid: 0
    };
    const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
    rl.on('line', line => {
      local.totalLines++;
      if (!line || line.trim().length === 0) return;
      let parsed;
      try {
        parsed = JSON.parse(line);
      } catch (e) {
        local.jsonParseErrors++;
        console.error(`${file}:${local.totalLines} JSON parse error: ${e.message}`);
        return;
      }

      let pdpAudit = null;
      if (parsed.pdpAudit) pdpAudit = parsed.pdpAudit;
      else if (parsed.message && typeof parsed.message === 'object' && parsed.message.pdpAudit) pdpAudit = parsed.message.pdpAudit;
      else if (parsed.message && typeof parsed.message === 'string') {
        try { const m = JSON.parse(parsed.message); if (m && m.pdpAudit) pdpAudit = m.pdpAudit; } catch (e) {}
      }

      if (!pdpAudit) {
        local.missingPdpAudit++;
        return;
      }

      if (!validateSchema(pdpAudit)) {
        local.schemaInvalid++;
        console.error(`${file}:${local.totalLines} schema invalid for pdpAudit`);
      }

      const token = findJws(parsed);
      const signedPayloadFromLog = findSignedPayload(parsed);
      if (!token) {
        local.unsigned++;
        return;
      }

      if (!pubKeyPem) {
        local.signedInvalid++;
        console.error(`${file}:${local.totalLines} token present but no public key available for verification`);
        return;
      }

      try {
        const ok = jws.verify(token, 'ES256', pubKeyPem);
        if (!ok) {
          local.signedInvalid++;
          console.error(`${file}:${local.totalLines} signature verification FAILED`);
        } else {
          const decoded = jws.decode(token);
          let payloadStr = decoded && decoded.payload ? decoded.payload : null;
          if (signedPayloadFromLog) {
            if (payloadStr !== signedPayloadFromLog) {
              local.signedInvalid++;
              console.error(`${file}:${local.totalLines} signature payload mismatch vs signedPayload`);
            } else {
              local.signedValid++;
            }
          } else {
            let payloadObj = null;
            try { payloadObj = JSON.parse(payloadStr); } catch (e) { payloadObj = payloadStr; }
            if (payloadObj && payloadObj.pdpAudit) {
              const a = JSON.stringify(stable(payloadObj.pdpAudit));
              const b = JSON.stringify(stable(pdpAudit));
              if (a !== b) {
                local.signedInvalid++;
                console.error(`${file}:${local.totalLines} signature payload mismatch vs log pdpAudit`);
              } else {
                local.signedValid++;
              }
            } else {
              local.signedInvalid++;
              console.error(`${file}:${local.totalLines} decoded payload missing pdpAudit`);
            }
          }
        }
      } catch (e) {
        local.signedInvalid++;
        console.error(`${file}:${local.totalLines} verification error: ${e && e.message ? e.message : e}`);
      }

    });

    rl.on('close', () => resolve(local));
    rl.on('error', err => reject(err));
  });
}

(async function main() {
  const perFile = {};
  for (let f of files) {
    if (!fs.existsSync(f)) {
      console.error('File not found:', f);
      process.exitCode = 2;
      return;
    }
    const s = await processFile(f);
    perFile[f] = s;
    // merge into aggregate
    for (let k of Object.keys(aggregate)) aggregate[k] += s[k] || 0;
    // print per-file detailed report
    console.log(`--- report for ${f} ---`);
    console.log(JSON.stringify(s, null, 2));
  }

  console.log('=== aggregate report ===');
  console.log(JSON.stringify(aggregate, null, 2));

  if (aggregate.signedInvalid > 0 || aggregate.schemaInvalid > 0 || aggregate.jsonParseErrors > 0) {
    console.error('Verification FAILED');
    process.exitCode = 3;
  } else {
    console.log('Verification OK');
    process.exitCode = 0;
  }
})();
