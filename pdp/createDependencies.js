const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const Luas = require('./xacml/luas');
const DecisionLogger = require('./utils/decisionLogger');
const PolicyInformationPoint = require('./utils/policyInformationPoint');
const DecisionParamsBuilder = require('./utils/decisionParams');

class Container {
  constructor(config = {}) {
    this.port = config.port || Number(process.env.PDP_PORT) || 8080;
    this.policyFiles = config.policyFiles || [path.join(__dirname, './policies/medical.xml')];
    // Bind every decision and audit record to the exact loaded policy bytes.
    // An optional deployment version is human-readable; the digest is the
    // authoritative version identifier used for consistency checks.
    const policyBytes = this.policyFiles.map((file) => fs.readFileSync(file)).join('\n');
    this.policyMetadata = {
      version: process.env.POLICY_VERSION || 'unversioned',
      sha256: crypto.createHash('sha256').update(policyBytes).digest('hex'),
    };

    // Eagerly wire singletons
    this.loggerInstance = new DecisionLogger();
    this.logger = this.loggerInstance.logger;
    this.pip = new PolicyInformationPoint();
    this.decisionParamsBuilder = new DecisionParamsBuilder(this.pip);
  }

  async init() {
    this.luas = await Luas.create(this.policyFiles);
    return this;
  }
}

module.exports = Container;
