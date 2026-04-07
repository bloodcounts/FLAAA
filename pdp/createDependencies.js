const path = require('path');
const Luas = require('./xacml/luas');
const DecisionLogger = require('./utils/decisionLogger');
const PolicyInformationPoint = require('./utils/policyInformationPoint');
const DecisionParamsBuilder = require('./utils/decisionParams');

class Container {
  constructor(config = {}) {
    this.port = config.port || Number(process.env.PDP_PORT) || 8080;
    this.policyFiles = config.policyFiles || [path.join(__dirname, './policies/medical.xml')];

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
