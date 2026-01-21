"use strict";
const fs = require('fs');
const path = require('path');
// crypto not needed when keys are supplied externally
const XACMLConstants = require("../xacml/XACMLConstants");
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const jws = require('jws');

const LOG_DIR = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const rotateTransport = new DailyRotateFile({
  dirname: LOG_DIR,
  filename: 'pdp-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  zippedArchive: false,
  format: winston.format.json()
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [rotateTransport]
});

// Also keep console output for development
logger.add(new winston.transports.Console({ format: winston.format.simple() }));

// Signing setup
let signingPrivateKeyPem = null;
let signingKid = process.env.SIGNING_KID || 'pdp-signing-key';
let signingAlg = process.env.SIGNING_ALG || 'ES256';

function loadKeyIfAvailable() {
  const keyPath = process.env.SIGNING_KEY_PATH || path.resolve(process.cwd(), 'certs', 'pdp_sign_key.pem');
  if (keyPath && fs.existsSync(keyPath)) {
    try {
      signingPrivateKeyPem = fs.readFileSync(keyPath, 'utf8');
      signingKid = process.env.SIGNING_KID || signingKid;
      logger.info(`Loaded signing key from ${keyPath}`);
    } catch (e) {
      logger.error(`Failed to read signing key at ${keyPath}: ${e && e.stack ? e.stack : e}`);
    }
  } else {
    logger.warn('No signing key found; JWS signing is disabled. Provide SIGNING_KEY_PATH or place key at certs/pdp_sign_key.pem');
  }
}

loadKeyIfAvailable();

function safeGetFirstAttributeValue(attributesSet, category, attrIdMatch) {
  if (!attributesSet || attributesSet.length === 0) return null;
  for (let attributes of attributesSet) {
    try {
      const cat = (attributes.getCategory && attributes.getCategory()) || attributes.category;
      if (cat !== category) continue;
      const attrs = (attributes.getAttributes && attributes.getAttributes()) || attributes.attributes;
      if (!attrs) continue;
      for (let attr of attrs) {
        const id = (attr.getId && attr.getId()) || attr.id || null;
        if (attrIdMatch != null && id !== attrIdMatch) continue;
        const vals = (attr.getValues && attr.getValues()) || (attr.attributeValues) || null;
        if (vals && vals.length > 0) {
          const first = vals[0];
          if (first && typeof first.getValue === 'function') return first.getValue();
          if (first && typeof first.value !== 'undefined') return first.value;
          return first;
        }
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

function policyReferencesToArray(policyReferences) {
  if (!policyReferences || policyReferences.length === 0) return [];
  try {
    return policyReferences.map(pr => (pr.getId ? pr.getId() : pr));
  } catch (e) {
    return policyReferences;
  }
}

function extractBasicFields(evaluationCtx) {
  if (!evaluationCtx || !evaluationCtx.requestCtx) return {};
  const req = evaluationCtx.requestCtx;
  const attributesSet = req.attributesSet;
  const subjectId = safeGetFirstAttributeValue(attributesSet, XACMLConstants.SUBJECT_CATEGORY, 'urn:oasis:names:tc:xacml:1.0:subject:subject-id');
  const resourceId = safeGetFirstAttributeValue(attributesSet, XACMLConstants.RESOURCE_CATEGORY, XACMLConstants.RESOURCE_ID);
  const actionId = safeGetFirstAttributeValue(attributesSet, XACMLConstants.ACTION_CATEGORY, 'urn:oasis:names:tc:xacml:1.0:action:action-id');
  return { subjectId, resourceId, actionId };
}

function signPayloadCompact(payloadStr) {
  if (!signingPrivateKeyPem) return null;
  try {
    const token = jws.sign({
      header: { alg: signingAlg, kid: signingKid },
      payload: payloadStr,
      privateKey: signingPrivateKeyPem
    });
    return token;
  } catch (e) {
    logger.error('Failed to sign payload: ' + (e && e.stack ? e.stack : e));
    return null;
  }
}

function logDecision(decision, evaluationCtx, extras) {
  try {
    const base = extractBasicFields(evaluationCtx || {});
    const policyRefs = evaluationCtx && evaluationCtx.policyReferences ? policyReferencesToArray(evaluationCtx.policyReferences) : [];
    const payloadObj = {
      timestamp: (new Date()).toISOString(),
      decision: decision,
      subject: base.subjectId || null,
      resource: base.resourceId || null,
      action: base.actionId || null,
      policyReferences: policyRefs,
      extras: extras || null
    };
    const payloadStr = JSON.stringify({ pdpAudit: payloadObj });

    // produce signature if configured
    const jwsCompact = signPayloadCompact(payloadStr);

    const logEntry = {
      pdpAudit: payloadObj,
      jws: jwsCompact,
      signedPayload: jwsCompact ? payloadStr : null
    };

    logger.info(logEntry);
  } catch (e) {
    // never throw from logger
    console.error('decisionLogger error:', e && e.stack ? e.stack : e);
  }
}

module.exports = {
  logDecision
};
