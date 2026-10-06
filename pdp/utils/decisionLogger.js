const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pino = require('pino');
const jws = require('jws');
const XACMLConstants = require('../xacml/XACMLConstants');

const GENESIS_HASH = '0'.repeat(64);

/**
 * Deterministic canonical JSON (recursively sorted object keys, no
 * whitespace) so the same logical record always hashes/signs to the same
 * bytes regardless of property insertion order.
 */
function canonicalStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  const body = keys.map((k) => `${JSON.stringify(k)}:${canonicalStringify(value[k])}`).join(',');
  return `{${body}}`;
}

function sha256Hex(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

class DecisionLogger {
  constructor(options = {}) {
    // Dependency injection for testing
    this.fs = options.fs || fs;
    this.path = options.path || path;
    this.pino = options.pino || pino;
    this.jws = options.jws || jws;
    this.process = options.process || process;

    const logDir = this.path.resolve(this.process.cwd(), 'logs');
    if (!this.fs.existsSync(logDir)) this.fs.mkdirSync(logDir, { recursive: true });

    // For testing, allow disabling file transport
    if (!options.disableFileTransport) {
      const transport = this.pino.transport({
        targets: [
          {
            target: 'pino-roll',
            options: {
              file: this.path.join(logDir, 'pdp'),
              frequency: 'daily',
              extension: '.log',
              mkdir: true,
            },
            level: this.process.env.LOG_LEVEL || 'info',
          },
          {
            target: 'pino/file',
            options: { destination: 1 }, // stdout
            level: this.process.env.LOG_LEVEL || 'info',
          },
        ],
      });
      this.logger = this.pino({ level: this.process.env.LOG_LEVEL || 'info' }, transport);
    } else {
      // Use simple pino instance for testing
      this.logger = this.pino({ level: this.process.env.LOG_LEVEL || 'info' });
    }

    this.signingPrivateKeyPem = null;
    this.signingKid = this.process.env.SIGNING_KID || 'pdp-signing-key';
    this.signingAlg = this.process.env.SIGNING_ALG || 'ES256';
    this.requireSigning = this.process.env.REQUIRE_ES256_SIGNING === 'true';
    this.auditEnabled = this.process.env.DECISION_AUDIT_ENABLED !== 'false';
    this.auditLogPath = this.process.env.AUDIT_LOG_PATH || null;
    this.auditFailure = null;
    if (this.requireSigning && !this.auditEnabled) {
      throw new Error('Mandatory audit signing requires DECISION_AUDIT_ENABLED=true');
    }
    if (this.signingAlg !== 'ES256') {
      throw new Error('Only ES256 is supported for PDP audit signing');
    }
    this.loadSigningKey();
    if (this.requireSigning && !this.signingPrivateKeyPem) {
      throw new Error('REQUIRE_ES256_SIGNING=true requires a readable SIGNING_KEY_PATH');
    }

    // Hash-chain / checkpoint state for deletion, reordering, and
    // truncation detection). Each record commits to the hash of the previous
    // record via `previous_event_hash`, and both fields are covered by the
    // ES256 signature (they are set on payloadObj before signing). Every
    // `checkpointEvery` records, an independently signed checkpoint is
    // appended to `<AUDIT_LOG_PATH>.checkpoints.jsonl`; a chain that ends
    // before the last exported checkpoint's sequence number is truncated.
    this.sequence = 0;
    this.previousEventHash = GENESIS_HASH;
    this.checkpointEvery = Number(this.process.env.AUDIT_CHECKPOINT_EVERY || '50');
    if (!Number.isInteger(this.checkpointEvery) || this.checkpointEvery < 1) {
      throw new Error('AUDIT_CHECKPOINT_EVERY must be a positive integer');
    }
    this.checkpointLogPath = this.process.env.AUDIT_CHECKPOINT_PATH
      || (this.auditLogPath ? `${this.auditLogPath}.checkpoints.jsonl` : null);
    this.resumeChainState();
  }

  resumeChainState() {
    if (!this.auditLogPath) return;
    try {
      const entries = this.fs.existsSync(this.auditLogPath)
        ? this.fs.readFileSync(this.auditLogPath, 'utf8').split('\n')
          .filter((line) => line.trim()).map((line) => JSON.parse(line))
        : [];
      let previous = GENESIS_HASH;
      entries.forEach((entry, index) => {
        const withoutHash = {
          pdpAudit: entry.pdpAudit, jws: entry.jws, signedPayload: entry.signedPayload,
        };
        if (entry.pdpAudit?.sequence !== index + 1
            || entry.pdpAudit.previous_event_hash !== previous
            || entry.event_hash !== sha256Hex(canonicalStringify(withoutHash))) {
          throw new Error(`invalid audit chain at record ${index + 1}`);
        }
        previous = entry.event_hash;
      });
      if (this.checkpointLogPath && this.fs.existsSync(this.checkpointLogPath)) {
        const checkpoints = this.fs.readFileSync(this.checkpointLogPath, 'utf8')
          .split('\n').filter((line) => line.trim()).map((line) => JSON.parse(line));
        let lastSequence = 0;
        checkpoints.forEach((checkpoint) => {
          const sequence = checkpoint.checkpoint_sequence;
          if (!Number.isInteger(sequence) || sequence <= lastSequence
              || entries[sequence - 1]?.event_hash !== checkpoint.event_hash) {
            throw new Error('audit chain does not match retained checkpoints');
          }
          lastSequence = sequence;
        });
      }
      this.sequence = entries.length;
      this.previousEventHash = previous;
    } catch (err) {
      throw new Error(`Cannot resume audit chain from ${this.auditLogPath}: ${err.message}`);
    }
  }

  loadSigningKey() {
    const keyPath = this.process.env.SIGNING_KEY_PATH
      || this.path.resolve(this.process.cwd(), 'certs', 'pdp_sign_key.pem');

    if (this.fs.existsSync(keyPath)) {
      try {
        this.signingPrivateKeyPem = this.fs.readFileSync(keyPath, 'utf8');
        this.logger.info(`Loaded signing key from ${keyPath}`);
      } catch (err) {
        this.logger.error({ err }, 'Failed to read signing key');
      }
    } else {
      this.logger.warn('No signing key found; JWS signing is disabled. Provide SIGNING_KEY_PATH or place key at certs/pdp_sign_key.pem');
    }
  }

  signPayload(payloadStr) {
    if (!this.signingPrivateKeyPem) {
      if (this.requireSigning) throw new Error('Mandatory ES256 signing key is unavailable');
      return null;
    }
    try {
      return this.jws.sign({
        header: { alg: this.signingAlg, kid: this.signingKid },
        payload: payloadStr,
        privateKey: this.signingPrivateKeyPem,
      });
    } catch (err) {
      this.logger.error({ err }, 'Failed to sign payload');
      if (this.requireSigning) throw err;
      return null;
    }
  }

  getFirstAttributeValue(attributesSet, category, attrId) {
    if (!attributesSet || attributesSet.length === 0) return null;
    for (const attributes of attributesSet) {
      try {
        const cat = (attributes.getCategory && attributes.getCategory()) || attributes.category;
        if (cat !== category) continue;
        const attrs = (attributes.getAttributes && attributes.getAttributes())
          || attributes.attributes;
        if (!attrs) continue;
        for (const attr of attrs) {
          const id = (attr.getId && attr.getId()) || attr.id || null;
          if (attrId != null && id !== attrId) continue;
          const vals = (attr.getValues && attr.getValues()) || attr.attributeValues || null;
          if (vals && vals.length > 0) {
            const first = vals[0];
            if (first && typeof first.getValue === 'function') return first.getValue();
            if (first && typeof first.value !== 'undefined') return first.value;
            return first;
          }
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  extractFields(evaluationCtx) {
    if (!evaluationCtx || !evaluationCtx.requestCtx) return {};
    const attrs = evaluationCtx.requestCtx.attributesSet;
    return {
      subjectId: this.getFirstAttributeValue(attrs, XACMLConstants.SUBJECT_CATEGORY, 'urn:oasis:names:tc:xacml:1.0:subject:subject-id'),
      resourceId: this.getFirstAttributeValue(
        attrs,
        XACMLConstants.RESOURCE_CATEGORY,
        XACMLConstants.RESOURCE_ID,
      ),
      actionId: this.getFirstAttributeValue(attrs, XACMLConstants.ACTION_CATEGORY, 'urn:oasis:names:tc:xacml:1.0:action:action-id'),
    };
  }

  policyRefsToArray(policyReferences) {
    if (!policyReferences || policyReferences.length === 0) return [];
    try {
      return policyReferences.map((pr) => (pr.getId ? pr.getId() : pr));
    } catch {
      return policyReferences;
    }
  }

  log(decision, evaluationCtx, extras) {
    if (!this.auditEnabled) return null;
    if (this.auditFailure) throw new Error(`Audit writer stopped: ${this.auditFailure.message}`);
    try {
      const fields = this.extractFields(evaluationCtx || {});
      const policyRefs = evaluationCtx && evaluationCtx.policyReferences
        ? this.policyRefsToArray(evaluationCtx.policyReferences)
        : [];

      const sequence = this.sequence + 1;
      const payloadObj = {
        timestamp: new Date().toISOString(),
        decision,
        subject: fields.subjectId ?? extras?.node_id ?? null,
        resource: fields.resourceId ?? extras?.task_id ?? null,
        action: fields.actionId ?? extras?.action ?? null,
        policyReferences: policyRefs,
        extras: extras || null,
        sequence,
        previous_event_hash: this.previousEventHash,
      };

      const payloadStr = JSON.stringify({ pdpAudit: payloadObj });
      const jwsCompact = this.signPayload(payloadStr);
      if (this.requireSigning && !jwsCompact) {
        throw new Error('Mandatory ES256 signing produced no JWS');
      }

      const entryWithoutHash = {
        pdpAudit: payloadObj,
        jws: jwsCompact,
        signedPayload: jwsCompact ? payloadStr : null,
      };
      // Hash exactly the representation that is persisted. Runtime decision
      // objects can contain enumerable properties whose value is undefined;
      // JSON.stringify omits those properties, so hashing the live object
      // would produce a digest that an offline verifier cannot reproduce.
      const persistedEntryWithoutHash = JSON.parse(JSON.stringify(entryWithoutHash));
      // The event hash commits to the fully-formed, signed record (including
      // its own sequence number and the previous record's hash), so any
      // single altered, deleted, or reordered record breaks the chain for
      // every subsequent record, not just itself.
      const eventHash = sha256Hex(canonicalStringify(persistedEntryWithoutHash));
      const entry = { ...persistedEntryWithoutHash, event_hash: eventHash };

      this.logger.info(entry);
      // A dedicated JSONL stream makes independent verification deterministic
      // and avoids mixing audit events with operational logs.
      if (this.auditLogPath) {
        this.fs.appendFileSync(this.auditLogPath, `${JSON.stringify(entry)}\n`);
      }
      this.sequence = sequence;
      this.previousEventHash = eventHash;
      if (this.checkpointLogPath && sequence % this.checkpointEvery === 0) {
        const checkpoint = { checkpoint_sequence: sequence, event_hash: eventHash };
        const checkpointSignature = this.signPayload(canonicalStringify(checkpoint));
        this.fs.appendFileSync(
          this.checkpointLogPath,
          `${JSON.stringify({ ...checkpoint, signature: checkpointSignature })}\n`,
        );
      }
      return entry;
    } catch (err) {
      this.logger.error({ err }, 'DecisionLogger.log error');
      if (this.requireSigning) {
        this.auditFailure = err;
        throw err;
      }
      return null;
    }
  }
}

module.exports = DecisionLogger;
