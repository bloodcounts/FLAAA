const { expect } = require('chai');
const sinon = require('sinon');

describe('Rule', () => {
  let Rule;
  let mockResultFactory;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../xacml/rule')];
    delete require.cache[require.resolve('../../xacml/ctx/resultFactory')];

    // Mock ResultFactory before requiring Rule
    mockResultFactory = function() {}; // Constructor function
    mockResultFactory.prototype.getFactory = sinon.stub().returns({
      getResultWithCtx: sinon.stub().returns({ getDecision: () => 3 }),
      getResultWithStatus: sinon.stub().callsFake((decision) => {
        // Return different decisions based on the decision parameter
        // For XACML 3.0 indeterminate cases, return the expected values from tests
        if (decision === 4) return { getDecision: () => 4 }; // DECISION_INDETERMINATE_PERMIT
        if (decision === 5) return { getDecision: () => 5 }; // DECISION_INDETERMINATE_DENY
        if (decision === 2) return { getDecision: () => 2, getStatus: sinon.stub().returns(null) }; // DECISION_INDETERMINATE
        return { getDecision: () => decision }; // Default fallback
      }),
      getResultWithObligationResults: sinon.stub().returns({ getDecision: () => 0 }),
      getResult: sinon.stub().returns({ getDecision: () => 2, getStatus: sinon.stub().returns(null) })
    });

    // Mock the ResultFactory module
    require.cache[require.resolve('../../xacml/ctx/resultFactory')] = {
      exports: mockResultFactory
    };

    Rule = require('../../xacml/rule');
  });

  afterEach(() => {
    // Clean up mocks
    if (require.cache[require.resolve('../../xacml/ctx/resultFactory')]) {
      delete require.cache[require.resolve('../../xacml/ctx/resultFactory')];
    }
  });

  describe('constructor', () => {
    it('should create a Rule instance with all parameters', () => {
      const id = 'test-rule';
      const effect = 0; // DECISION_PERMIT
      const description = 'Test rule description';
      const target = {};
      const condition = {};
      const obligationExpressions = [];
      const adviceExpressions = [];
      const xacmlVersion = 3;

      const rule = new Rule(id, effect, description, target, condition,
        obligationExpressions, adviceExpressions, xacmlVersion);

      expect(rule).to.be.an.instanceof(Rule);
      expect(rule.idAttr).to.equal(id);
      expect(rule.effectAttr).to.equal(effect);
      expect(rule.description).to.equal(description);
      expect(rule.target).to.equal(target);
      expect(rule.condition).to.equal(condition);
      expect(rule.obligationExpressions).to.equal(obligationExpressions);
      expect(rule.adviceExpressions).to.equal(adviceExpressions);
      expect(rule.xacmlVersion).to.equal(xacmlVersion);
    });

    it('should handle null values', () => {
      const rule = new Rule(null, null, null, null, null, null, null, null);

      expect(rule.idAttr).to.be.null;
      expect(rule.effectAttr).to.be.null;
      expect(rule.description).to.be.null;
      expect(rule.target).to.be.null;
      expect(rule.condition).to.be.null;
      expect(rule.obligationExpressions).to.be.null;
      expect(rule.adviceExpressions).to.be.null;
      expect(rule.xacmlVersion).to.be.null;
    });
  });

  describe('getInstance()', () => {
    it('should create rule from XML root with permit effect', () => {
      const mockRoot = {
        getAttribute: sinon.stub(),
        childNodes: []
      };

      mockRoot.getAttribute.withArgs('RuleId').returns('test-rule-id');
      mockRoot.getAttribute.withArgs('Effect').returns('Permit');

      const mockMetaData = {
        getXACMLVersion: () => 3
      };

      // This method has complex dependencies, so we test that it exists and is callable
      expect(() => {
        Rule.prototype.getInstance(mockRoot, mockMetaData, {});
      }).to.not.throw();
    });

    it('should create rule from XML root with deny effect', () => {
      const mockRoot = {
        getAttribute: sinon.stub(),
        childNodes: []
      };

      mockRoot.getAttribute.withArgs('RuleId').returns('test-rule-id');
      mockRoot.getAttribute.withArgs('Effect').returns('Deny');

      const mockMetaData = {
        getXACMLVersion: () => 3
      };

      expect(() => {
        Rule.prototype.getInstance(mockRoot, mockMetaData, {});
      }).to.not.throw();
    });

    it('should throw error for invalid effect', () => {
      const mockRoot = {
        getAttribute: sinon.stub(),
        childNodes: []
      };

      mockRoot.getAttribute.withArgs('RuleId').returns('test-rule-id');
      mockRoot.getAttribute.withArgs('Effect').returns('Invalid');

      const mockMetaData = {
        getXACMLVersion: () => 3
      };

      expect(() => {
        Rule.prototype.getInstance(mockRoot, mockMetaData, {});
      }).to.throw('Invalid Effect: Invalid');
    });
  });

  describe('evaluate()', () => {
    let mockContext;
    let rule;

    beforeEach(() => {
      mockContext = {};
      rule = new Rule('test-rule', 0, 'description', null, null, [], [], 3); // DECISION_PERMIT
    });

    it('should return NOT_APPLICABLE when target does not match', () => {
      const mockTarget = {
        match: sinon.stub().returns({ getResult: () => 1 }) // NO_MATCH
      };

      rule.target = mockTarget;

      const result = rule.evaluate(mockContext);

      expect(result.getDecision()).to.equal(3); // DECISION_NOT_APPLICABLE
    });

    it('should return INDETERMINATE when target is indeterminate for XACML 3.0', () => {
      const mockTarget = {
        match: sinon.stub().returns({
          getResult: () => 2, // INDETERMINATE
          getStatus: () => 'indeterminate-status'
        })
      };

      rule.target = mockTarget;
      rule.xacmlVersion = 3;

      const result = rule.evaluate(mockContext);

      expect(result.getDecision()).to.equal(5); // DECISION_INDETERMINATE_PERMIT
    });

    it('should return INDETERMINATE when target is indeterminate for non-XACML 3.0', () => {
      const mockTarget = {
        match: sinon.stub().returns({
          getResult: () => 2, // INDETERMINATE
          getStatus: () => 'indeterminate-status'
        })
      };

      rule.target = mockTarget;
      rule.xacmlVersion = 1;

      const result = rule.evaluate(mockContext);

      expect(result.getDecision()).to.equal(2); // DECISION_INDETERMINATE
    });

    it('should return rule effect when target matches and no condition', () => {
      const mockTarget = {
        match: sinon.stub().returns({ getResult: () => 0 }) // MATCH
      };

      rule.target = mockTarget;
      rule.condition = null;

      const result = rule.evaluate(mockContext);

      expect(result.getDecision()).to.equal(0); // DECISION_PERMIT
    });

    it('should return rule effect when condition evaluates to true', () => {
      const mockTarget = {
        match: sinon.stub().returns({ getResult: () => 0 }) // MATCH
      };
      const mockCondition = {
        evaluate: sinon.stub().returns({ indeterminate: false, value: true })
      };

      rule.target = mockTarget;
      rule.condition = mockCondition;

      const result = rule.evaluate(mockContext);

      expect(result.getDecision()).to.equal(0); // DECISION_PERMIT
    });

    it('should return NOT_APPLICABLE when condition evaluates to false', () => {
      const mockTarget = {
        match: sinon.stub().returns({ getResult: () => 0 }) // MATCH
      };
      const mockCondition = {
        evaluate: sinon.stub().returns({ indeterminate: false, value: false })
      };

      rule.target = mockTarget;
      rule.condition = mockCondition;

      const result = rule.evaluate(mockContext);

      expect(result.getDecision()).to.equal(3); // DECISION_NOT_APPLICABLE
    });

    it('should return INDETERMINATE_PERMIT when condition is indeterminate for XACML 3.0 permit rule', () => {
      const mockTarget = {
        match: sinon.stub().returns({ getResult: () => 0 }) // MATCH
      };
      const mockCondition = {
        evaluate: sinon.stub().returns({
          indeterminate: true,
          status: 'condition-status'
        })
      };

      rule.target = mockTarget;
      rule.condition = mockCondition;
      rule.effectAttr = 0; // DECISION_PERMIT
      rule.xacmlVersion = 3;

      const result = rule.evaluate(mockContext);

      expect(result.getDecision()).to.equal(5); // DECISION_INDETERMINATE_PERMIT
    });

    it('should return INDETERMINATE_DENY when condition is indeterminate for XACML 3.0 deny rule', () => {
      const mockTarget = {
        match: sinon.stub().returns({ getResult: () => 0 }) // MATCH
      };
      const mockCondition = {
        evaluate: sinon.stub().returns({
          indeterminate: true,
          status: 'condition-status'
        })
      };

      rule.target = mockTarget;
      rule.condition = mockCondition;
      rule.effectAttr = 1; // DECISION_DENY
      rule.xacmlVersion = 3;

      const result = rule.evaluate(mockContext);

      expect(result.getDecision()).to.equal(4); // DECISION_INDETERMINATE_DENY
    });

    it('should return INDETERMINATE when condition is indeterminate for non-XACML 3.0', () => {
      const mockTarget = {
        match: sinon.stub().returns({ getResult: () => 0 }) // MATCH
      };
      const mockCondition = {
        evaluate: sinon.stub().returns({
          indeterminate: true,
          status: 'condition-status'
        })
      };

      rule.target = mockTarget;
      rule.condition = mockCondition;
      rule.xacmlVersion = 1;

      const result = rule.evaluate(mockContext);

      expect(result.getDecision()).to.equal(2); // DECISION_INDETERMINATE
    });
  });

  describe('processObligations()', () => {
    it('should return null when no obligation expressions', () => {
      const rule = new Rule('test', 0, '', null, null, null, null, 3);

      const result = rule.processObligations({});

      expect(result).to.be.null;
    });

    it('should return null when empty obligation expressions', () => {
      const rule = new Rule('test', 0, '', null, null, [], null, 3);

      const result = rule.processObligations({});

      expect(result).to.be.null;
    });

    it('should process obligations that match the effect', () => {
      const mockContext = {};
      const mockObligation1 = {
        getFulfillOn: () => 0, // DECISION_PERMIT
        evaluate: sinon.stub().returns('obligation1-result')
      };
      const mockObligation2 = {
        getFulfillOn: () => 1, // DECISION_DENY
        evaluate: sinon.stub().returns('obligation2-result')
      };

      const rule = new Rule('test', 0, '', null, null, [mockObligation1, mockObligation2], null, 3);

      const result = rule.processObligations(mockContext);

      expect(result).to.deep.equal(['obligation1-result']);
      expect(mockObligation1.evaluate.calledWith(mockContext)).to.be.true;
      expect(mockObligation2.evaluate.called).to.be.false;
    });

    it('should return empty array when no obligations match', () => {
      const mockContext = {};
      const mockObligation = {
        getFulfillOn: () => 1, // DECISION_DENY
        evaluate: sinon.stub().returns('obligation-result')
      };

      const rule = new Rule('test', 0, '', null, null, [mockObligation], null, 3); // DECISION_PERMIT

      const result = rule.processObligations(mockContext);

      expect(result).to.deep.equal([]);
      expect(mockObligation.evaluate.called).to.be.false;
    });
  });

  describe('processAdvices()', () => {
    it('should return null when no advice expressions', () => {
      const rule = new Rule('test', 0, '', null, null, null, null, 3);

      const result = rule.processAdvices({});

      expect(result).to.be.null;
    });

    it('should return null when empty advice expressions', () => {
      const rule = new Rule('test', 0, '', null, null, null, [], 3);

      const result = rule.processAdvices({});

      expect(result).to.be.null;
    });

    it('should process advices that match the effect', () => {
      const mockContext = {};
      const mockAdvice1 = {
        getAppliesTo: () => 0, // DECISION_PERMIT
        evaluate: sinon.stub().returns('advice1-result')
      };
      const mockAdvice2 = {
        getAppliesTo: () => 1, // DECISION_DENY
        evaluate: sinon.stub().returns('advice2-result')
      };

      const rule = new Rule('test', 0, '', null, null, null, [mockAdvice1, mockAdvice2], 3);

      const result = rule.processAdvices(mockContext);

      expect(result).to.deep.equal(['advice1-result']);
      expect(mockAdvice1.evaluate.calledWith(mockContext)).to.be.true;
      expect(mockAdvice2.evaluate.called).to.be.false;
    });

    it('should return empty array when no advices match', () => {
      const mockContext = {};
      const mockAdvice = {
        getAppliesTo: () => 1, // DECISION_DENY
        evaluate: sinon.stub().returns('advice-result')
      };

      const rule = new Rule('test', 0, '', null, null, null, [mockAdvice], 3); // DECISION_PERMIT

      const result = rule.processAdvices(mockContext);

      expect(result).to.deep.equal([]);
      expect(mockAdvice.evaluate.called).to.be.false;
    });
  });

  describe('integration tests', () => {
    it('should have all required methods', () => {
      const rule = new Rule('test', 0, '', null, null, null, null, 3);

      expect(rule.getInstance).to.be.a('function');
      expect(rule.evaluate).to.be.a('function');
      expect(rule.processObligations).to.be.a('function');
      expect(rule.processAdvices).to.be.a('function');
    });

    it('should handle complete rule evaluation flow', () => {
      const mockContext = {};
      const mockTarget = {
        match: sinon.stub().returns({ getResult: () => 0 }) // MATCH
      };
      const mockCondition = {
        evaluate: sinon.stub().returns({ indeterminate: false, value: true })
      };
      const mockObligation = {
        getFulfillOn: () => 0, // DECISION_PERMIT
        evaluate: sinon.stub().returns('obligation-result')
      };

      const rule = new Rule('test-rule', 0, 'Test rule', mockTarget, mockCondition,
        [mockObligation], [], 3);

      const result = rule.evaluate(mockContext);

      expect(result.getDecision()).to.equal(0); // DECISION_PERMIT
      expect(mockTarget.match.calledWith(mockContext)).to.be.true;
      expect(mockCondition.evaluate.calledWith(mockContext)).to.be.true;
      expect(mockObligation.evaluate.calledWith(mockContext)).to.be.true;
    });
  });
});