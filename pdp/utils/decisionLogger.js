const fs = require('fs');
const path = require('path');
const pino = require('pino');
const jws = require('jws');
const XACMLConstants = require('../xacml/XACMLConstants');

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
    this.loadSigningKey();
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
    if (!this.signingPrivateKeyPem) return null;
    try {
      return this.jws.sign({
        header: { alg: this.signingAlg, kid: this.signingKid },
        payload: payloadStr,
        privateKey: this.signingPrivateKeyPem,
      });
    } catch (err) {
      this.logger.error({ err }, 'Failed to sign payload');
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
    try {
      const fields = this.extractFields(evaluationCtx || {});
      const policyRefs = evaluationCtx && evaluationCtx.policyReferences
        ? this.policyRefsToArray(evaluationCtx.policyReferences)
        : [];

      const payloadObj = {
        timestamp: new Date().toISOString(),
        decision,
        subject: fields.subjectId || null,
        resource: fields.resourceId || null,
        action: fields.actionId || null,
        policyReferences: policyRefs,
        extras: extras || null,
      };

      const payloadStr = JSON.stringify({ pdpAudit: payloadObj });
      const jwsCompact = this.signPayload(payloadStr);

      this.logger.info({
        pdpAudit: payloadObj,
        jws: jwsCompact,
        signedPayload: jwsCompact ? payloadStr : null,
      });
    } catch (err) {
      this.logger.error({ err }, 'DecisionLogger.log error');
    }
  }
}

module.exports = DecisionLogger;
