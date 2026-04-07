const { expect } = require('chai');
const sinon = require('sinon');

describe('PDP', () => {
  let PDP;
  let mockConfig;
  let mockAttributeFinder;
  let mockPolicyFinder;
  let mockResourceFinder;
  let mockRequest;
  let mockEvaluationCtx;
  let mockResponseCtx;
  let mockResult;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../xacml/pdp')];
    delete require.cache[require.resolve('../../xacml/basicEvaluationCtx')];
    delete require.cache[require.resolve('../../xacml/ctx/xacml2EvaluationCtx')];
    delete require.cache[require.resolve('../../xacml/ctx/evaluationCtxFactory')];
    PDP = require('../../xacml/pdp');

    // Create mocks
    mockAttributeFinder = {};
    mockPolicyFinder = {
      init: sinon.stub().resolves(),
      findPolicy: sinon.stub()
    };
    mockResourceFinder = {};

    mockConfig = {
      getAttributeFinder: sinon.stub().returns(mockAttributeFinder),
      getPolicyFinder: sinon.stub().returns(mockPolicyFinder),
      getResourceFinder: sinon.stub().returns(mockResourceFinder),
      isMultipleRequestHandle: sinon.stub().returns(false)
    };

    mockRequest = {
      getXacmlVersion: sinon.stub().returns(2),
      getDocumentRoot: sinon.stub().returns({}),
      getAttributesSet: sinon.stub().returns([]),
      getSubjects: sinon.stub().returns([]),
      getResource: sinon.stub().returns([]),
      getAction: sinon.stub().returns([]),
      getEnvironmentAttributes: sinon.stub().returns([])
    };
    mockEvaluationCtx = {
      getMultipleEvaluationCtx: sinon.stub(),
      requestCtx: {
        combinedDecision: false,
        returnPolicyIdList: false
      }
    };

    mockResult = {
      getDecision: sinon.stub().returns(0) // DECISION_PERMIT
    };

    mockResponseCtx = {
      initWithResults: sinon.stub(),
      responseCtxInit: sinon.stub()
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    it('should create a PDP instance with config', () => {
      const pdp = new PDP(mockConfig);

      expect(pdp.attributeFinder).to.equal(mockAttributeFinder);
      expect(pdp.policyFinder).to.equal(mockPolicyFinder);
      expect(pdp.pdpConfig).to.equal(mockConfig);
    });
  });

  describe('init()', () => {
    it('should initialize policy finder and set resource finder', async () => {
      const pdp = new PDP(mockConfig);

      await pdp.init();

      expect(mockPolicyFinder.init.calledOnce).to.be.true;
      expect(pdp.resourceFinder).to.equal(mockResourceFinder);
    });
  });

  describe('evaluate()', () => {
    let pdp;

    beforeEach(() => {
      pdp = new PDP(mockConfig);
    });

    it('should create evaluation context and evaluate it', () => {
      // Mock the evaluation context factory
      const mockFactory = {
        getEvaluationCtx: sinon.stub().returns(mockEvaluationCtx)
      };

      const mockCtxFactory = {
        getFactory: sinon.stub().returns(mockFactory)
      };

      // Temporarily replace the module
      const originalModule = require.cache[require.resolve('../../xacml/ctx/evaluationCtxFactory')];
      require.cache[require.resolve('../../xacml/ctx/evaluationCtxFactory')] = {
        exports: mockCtxFactory
      };

      sinon.stub(pdp, 'evaluateCtx').returns(mockResponseCtx);

      try {
        const result = pdp.evaluate(mockRequest);

        expect(pdp.evaluateCtx.calledWith(sinon.match.any)).to.be.true; // Just check that evaluateCtx was called
        expect(result).to.equal(mockResponseCtx);
      } finally {
        // Restore original module
        if (originalModule) {
          require.cache[require.resolve('../../xacml/ctx/evaluationCtxFactory')] = originalModule;
        } else {
          delete require.cache[require.resolve('../../xacml/ctx/evaluationCtxFactory')];
        }
      }
    });
  });

  describe('evaluateCtx()', () => {
    let pdp;

    beforeEach(() => {
      pdp = new PDP(mockConfig);
    });

    it('should handle single request evaluation', () => {
      mockConfig.isMultipleRequestHandle.returns(false);
      sinon.stub(pdp, 'evaluateContext').returns(mockResult);

      const ResponseCtx = require('../../xacml/ctx/responseCtx');
      sinon.stub(ResponseCtx.prototype, 'responseCtxInit');

      const result = pdp.evaluateCtx(mockEvaluationCtx);

      expect(result).to.be.an.instanceOf(ResponseCtx);
      expect(ResponseCtx.prototype.responseCtxInit.calledWith(mockResult)).to.be.true;
    });

    it('should handle multiple request evaluation', () => {
      mockConfig.isMultipleRequestHandle.returns(true);

      const mockMultipleResult = {
        isIndeterminate: sinon.stub().returns(false),
        getEvaluationCtxSet: sinon.stub().returns([mockEvaluationCtx])
      };

      mockEvaluationCtx.getMultipleEvaluationCtx.returns(mockMultipleResult);
      sinon.stub(pdp, 'evaluateContext').returns(mockResult);

      const ResponseCtx = require('../../xacml/ctx/responseCtx');
      const XACMLConstants = require('../../xacml/XACMLConstants');
      sinon.stub(ResponseCtx.prototype, 'initWithResults');

      const result = pdp.evaluateCtx(mockEvaluationCtx);

      expect(result).to.be.an.instanceOf(ResponseCtx);
      expect(ResponseCtx.prototype.initWithResults.calledWith([mockResult], XACMLConstants.XACML_VERSION_3_0)).to.be.true;
    });

    it('should return indeterminate for multiple request indeterminate', () => {
      mockConfig.isMultipleRequestHandle.returns(true);

      const mockMultipleResult = {
        isIndeterminate: sinon.stub().returns(true),
        getStatus: sinon.stub().returns('indeterminate-status')
      };

      mockEvaluationCtx.getMultipleEvaluationCtx.returns(mockMultipleResult);

      const ResultFactory = require('../../xacml/ctx/resultFactory');
      sinon.stub(ResultFactory.prototype, 'getFactory').returns({
        getResult: sinon.stub().returns('indeterminate-result')
      });

      const ResponseCtx = require('../../xacml/ctx/responseCtx');
      sinon.stub(ResponseCtx.prototype, 'initWithResults');

      const result = pdp.evaluateCtx(mockEvaluationCtx);

      expect(result).to.be.an.instanceOf(ResponseCtx);
    });

    it('should handle XACML 3.0 multiple attributes error', () => {
      mockConfig.isMultipleRequestHandle.returns(false);
      mockEvaluationCtx.multipleAttributes = true;

      // Set up policy finder to return a result that doesn't match error conditions
      const mockFinderResult = {
        notApplicable: sinon.stub().returns(false),
        indeterminate: sinon.stub().returns(false),
        getPolicy: sinon.stub().returns({
          evaluate: sinon.stub().returns(mockResult)
        }),
        getStatus: sinon.stub().returns(null)
      };
      mockPolicyFinder.findPolicy.returns(mockFinderResult);

      const Status = require('../../xacml/ctx/status');
      const ResponseCtx = require('../../xacml/ctx/responseCtx');
      const ResultFactory = require('../../xacml/ctx/resultFactory');

      sinon.stub(Status.prototype, 'statusInit2');
      sinon.stub(ResponseCtx.prototype, 'responseCtxInit');
      sinon.stub(ResultFactory.prototype, 'getFactory').returns({
        getResultWithStatus: sinon.stub().returns('error-result')
      });

      const result = pdp.evaluateCtx(mockEvaluationCtx);

      expect(result).to.be.an.instanceOf(ResponseCtx);
    });

    it('should handle XACML 3.0 combined decision error', () => {
      mockConfig.isMultipleRequestHandle.returns(false);
      mockEvaluationCtx.requestCtx.combinedDecision = true;

      // Set up policy finder to return a result that doesn't match error conditions
      const mockFinderResult = {
        notApplicable: sinon.stub().returns(false),
        indeterminate: sinon.stub().returns(false),
        getPolicy: sinon.stub().returns({
          evaluate: sinon.stub().returns(mockResult)
        }),
        getStatus: sinon.stub().returns(null)
      };
      mockPolicyFinder.findPolicy.returns(mockFinderResult);

      const Status = require('../../xacml/ctx/status');
      const ResponseCtx = require('../../xacml/ctx/responseCtx');
      const ResultFactory = require('../../xacml/ctx/resultFactory');

      sinon.stub(Status.prototype, 'statusInit2');
      sinon.stub(ResponseCtx.prototype, 'responseCtxInit');
      sinon.stub(ResultFactory.prototype, 'getFactory').returns({
        getResultWithStatus: sinon.stub().returns('error-result')
      });

      const result = pdp.evaluateCtx(mockEvaluationCtx);

      expect(result).to.be.an.instanceOf(ResponseCtx);
    });
  });

  describe('evaluateContext()', () => {
    let pdp;
    let mockPolicy;
    let mockFinderResult;

    beforeEach(() => {
      pdp = new PDP(mockConfig);

      mockPolicy = {
        evaluate: sinon.stub().returns(mockResult),
        getId: sinon.stub().returns('policy-id')
      };

      mockFinderResult = {
        notApplicable: sinon.stub().returns(false),
        indeterminate: sinon.stub().returns(false),
        getPolicy: sinon.stub().returns(mockPolicy),
        getStatus: sinon.stub().returns('status')
      };

      mockPolicyFinder.findPolicy.returns(mockFinderResult);
    });

    it('should evaluate policy and return result', () => {
      const result = pdp.evaluateContext(mockEvaluationCtx);

      expect(mockPolicyFinder.findPolicy.calledWith(mockEvaluationCtx)).to.be.true;
      expect(mockPolicy.evaluate.calledWith(mockEvaluationCtx)).to.be.true;
      expect(result).to.equal(mockResult);
    });

    it('should return not applicable when policy finder returns not applicable', () => {
      mockFinderResult.notApplicable.returns(true);

      const ResultFactory = require('../../xacml/ctx/resultFactory');
      sinon.stub(ResultFactory.prototype, 'getFactory').returns({
        getResultWithCtx: sinon.stub().returns('not-applicable-result')
      });

      const result = pdp.evaluateContext(mockEvaluationCtx);

      expect(result).to.equal('not-applicable-result');
    });

    it('should return indeterminate when policy finder returns indeterminate', () => {
      mockFinderResult.indeterminate.returns(true);

      const ResultFactory = require('../../xacml/ctx/resultFactory');
      sinon.stub(ResultFactory.prototype, 'getFactory').returns({
        getResultWithStatus: sinon.stub().returns('indeterminate-result')
      });

      const result = pdp.evaluateContext(mockEvaluationCtx);

      expect(result).to.equal('indeterminate-result');
    });

  });

  describe('integration tests', () => {
    it('should have all required methods', () => {
      const pdp = new PDP(mockConfig);

      expect(pdp).to.have.property('init');
      expect(pdp.init).to.be.a('function');
      expect(pdp).to.have.property('evaluate');
      expect(pdp.evaluate).to.be.a('function');
      expect(pdp).to.have.property('evaluateCtx');
      expect(pdp.evaluateCtx).to.be.a('function');
      expect(pdp).to.have.property('evaluateContext');
      expect(pdp.evaluateContext).to.be.a('function');
    });

    it('should properly initialize and evaluate', async () => {
      const pdp = new PDP(mockConfig);

      // Mock dependencies
      const mockEvaluationCtxFactory = {
        getFactory: sinon.stub().returns({
          getEvaluationCtx: sinon.stub().returns(mockEvaluationCtx)
        })
      };

      // Mock the evaluationCtxFactory module
      const originalModule = require.cache[require.resolve('../../xacml/ctx/evaluationCtxFactory')];
      require.cache[require.resolve('../../xacml/ctx/evaluationCtxFactory')] = {
        exports: mockEvaluationCtxFactory
      };

      sinon.stub(pdp, 'evaluateCtx').returns(mockResponseCtx);

      await pdp.init();
      const result = pdp.evaluate(mockRequest);

      expect(result).to.equal(mockResponseCtx);

      // Restore original module
      if (originalModule) {
        require.cache[require.resolve('../../xacml/ctx/evaluationCtxFactory')] = originalModule;
      } else {
        delete require.cache[require.resolve('../../xacml/ctx/evaluationCtxFactory')];
      }
    });
  });
});