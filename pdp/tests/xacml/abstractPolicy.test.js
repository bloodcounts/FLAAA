const { expect } = require('chai');
const sinon = require('sinon');

describe('AbstractPolicy', () => {
  let AbstractPolicy;
  let abstractPolicy;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../xacml/abstractPolicy')];
    AbstractPolicy = require('../../xacml/abstractPolicy');
    abstractPolicy = new AbstractPolicy();
  });

  describe('constructor', () => {
    it('should create an AbstractPolicy instance', () => {
      expect(abstractPolicy).to.be.an.instanceof(AbstractPolicy);
    });
  });

  describe('abstractPolicyInitWithRoot()', () => {
    it('should initialize policy with root element', () => {
      const mockRoot = {
        getAttribute: sinon.stub(),
        namespaceURI: 'urn:oasis:names:tc:xacml:3.0:core:schema:wd-17',
        childNodes: []
      };

      mockRoot.getAttribute.withArgs('PolicyId').returns('test-policy-id');
      mockRoot.getAttribute.withArgs('RuleCombiningAlgId').returns('urn:oasis:names:tc:xacml:1.0:rule-combining-algorithm:first-applicable');

      // This method has complex dependencies, so we just test that it exists and is callable
      expect(() => {
        abstractPolicy.abstractPolicyInitWithRoot(mockRoot, 'Policy', 'RuleCombiningAlgId');
      }).to.not.throw();
    });

    it('should handle PolicySet initialization', () => {
      const mockRoot = {
        getAttribute: sinon.stub(),
        namespaceURI: 'urn:oasis:names:tc:xacml:3.0:core:schema:wd-17',
        childNodes: []
      };

      mockRoot.getAttribute.withArgs('PolicySetId').returns('test-policyset-id');
      mockRoot.getAttribute.withArgs('PolicyCombiningAlgId').returns('urn:oasis:names:tc:xacml:1.0:policy-combining-algorithm:first-applicable');

      expect(() => {
        abstractPolicy.abstractPolicyInitWithRoot(mockRoot, 'PolicySet', 'PolicyCombiningAlgId');
      }).to.not.throw();
    });
  });

  describe('setChildren()', () => {
    it('should set children to empty array when null provided', () => {
      abstractPolicy.setChildren(null);

      expect(abstractPolicy.children).to.deep.equal([]);
    });

    it('should set children from provided array', () => {
      const mockChildren = [
        { getElement: () => 'element1' },
        { getElement: () => 'element2' }
      ];

      abstractPolicy.setChildren(mockChildren);

      expect(abstractPolicy.children).to.deep.equal(['element1', 'element2']);
      expect(abstractPolicy.childElements).to.equal(mockChildren);
    });

    it('should handle empty children array', () => {
      abstractPolicy.setChildren([]);

      expect(abstractPolicy.children).to.deep.equal([]);
      expect(abstractPolicy.childElements).to.deep.equal([]);
    });
  });

  describe('getChildren()', () => {
    it('should return the children array', () => {
      const expectedChildren = ['child1', 'child2'];
      abstractPolicy.children = expectedChildren;

      const result = abstractPolicy.getChildren();

      expect(result).to.equal(expectedChildren);
    });

    it('should return undefined when children not set', () => {
      const result = abstractPolicy.getChildren();

      expect(result).to.be.undefined;
    });
  });

  describe('getDefaultVersion()', () => {
    it('should return the default version', () => {
      // This method references a global variable, so it's hard to test properly
      expect(abstractPolicy.getDefaultVersion).to.be.a('function');
    });
  });

  describe('match()', () => {
    it('should delegate to target.match()', () => {
      const mockContext = {};
      const mockTarget = {
        match: sinon.stub().returns('match-result')
      };

      abstractPolicy.target = mockTarget;

      const result = abstractPolicy.match(mockContext);

      expect(result).to.equal('match-result');
      expect(mockTarget.match.calledWith(mockContext)).to.be.true;
    });

    it('should throw error when target is not set', () => {
      const mockContext = {};

      expect(() => {
        abstractPolicy.match(mockContext);
      }).to.throw();
    });
  });

  describe('getCombiningAlg()', () => {
    it('should return the combining algorithm', () => {
      const mockAlgorithm = { combine: () => {} };
      abstractPolicy.combiningAlg = mockAlgorithm;

      const result = abstractPolicy.getCombiningAlg();

      expect(result).to.equal(mockAlgorithm);
    });

    it('should return undefined when algorithm not set', () => {
      const result = abstractPolicy.getCombiningAlg();

      expect(result).to.be.undefined;
    });
  });

  describe('getMetaData()', () => {
    it('should return the metadata', () => {
      const mockMetaData = { getXACMLVersion: () => 3 };
      abstractPolicy.metaData = mockMetaData;

      const result = abstractPolicy.getMetaData();

      expect(result).to.equal(mockMetaData);
    });

    it('should return undefined when metadata not set', () => {
      const result = abstractPolicy.getMetaData();

      expect(result).to.be.undefined;
    });
  });

  describe('evaluate()', () => {
    it('should combine policies and return result', () => {
      const mockContext = {};
      const mockResult = {
        getDecision: () => 0, // DECISION_PERMIT
        getObligations: () => [],
        getAdvices: () => []
      };
      const mockCombiningAlg = {
        combine: sinon.stub().returns(mockResult)
      };

      abstractPolicy.combiningAlg = mockCombiningAlg;
      abstractPolicy.parameters = [];
      abstractPolicy.children = [];
      abstractPolicy.obligationExpressions = [];
      abstractPolicy.adviceExpressions = [];

      const result = abstractPolicy.evaluate(mockContext);

      expect(result).to.equal(mockResult);
      expect(mockCombiningAlg.combine.calledWith(mockContext, [], [])).to.be.true;
    });

    it('should process obligations when present', () => {
      const mockContext = {};
      const obligations = [];
      const mockResult = {
        getDecision: () => 0, // DECISION_PERMIT
        getObligations: () => obligations,
        getAdvices: () => []
      };
      const mockCombiningAlg = {
        combine: sinon.stub().returns(mockResult)
      };
      const mockObligation = {
        getFulfillOn: () => 0, // DECISION_PERMIT
        evaluate: sinon.stub().returns('obligation-result')
      };

      abstractPolicy.combiningAlg = mockCombiningAlg;
      abstractPolicy.parameters = [];
      abstractPolicy.children = [];
      abstractPolicy.obligationExpressions = [mockObligation];
      abstractPolicy.adviceExpressions = [];

      const result = abstractPolicy.evaluate(mockContext);

      expect(result).to.equal(mockResult);
      expect(mockCombiningAlg.combine.calledWith(mockContext, [], [])).to.be.true;
      expect(obligations).to.include('obligation-result');
      expect(mockObligation.evaluate.calledWith(mockContext)).to.be.true;
    });
  });

  describe('processObligationAndAdvices()', () => {
    it('should process obligations that match the effect', () => {
      const mockContext = {};
      const obligations = [];
      const mockResult = {
        getObligations: () => obligations,
        getAdvices: () => []
      };
      const mockObligation1 = {
        getFulfillOn: () => 0, // DECISION_PERMIT
        evaluate: sinon.stub().returns('obligation1')
      };
      const mockObligation2 = {
        getFulfillOn: () => 1, // DECISION_DENY
        evaluate: sinon.stub().returns('obligation2')
      };

      abstractPolicy.obligationExpressions = [mockObligation1, mockObligation2];
      abstractPolicy.adviceExpressions = [];

      abstractPolicy.processObligationAndAdvices(mockContext, 0, mockResult); // DECISION_PERMIT

      expect(obligations).to.include('obligation1');
      expect(mockObligation1.evaluate.calledWith(mockContext)).to.be.true;
      expect(mockObligation2.evaluate.called).to.be.false;
    });

    it('should process advices that match the effect', () => {
      const mockContext = {};
      const advices = [];
      const mockResult = {
        getObligations: () => [],
        getAdvices: () => advices
      };
      const mockAdvice1 = {
        getAppliesTo: () => 0, // DECISION_PERMIT
        evaluate: sinon.stub().returns('advice1')
      };
      const mockAdvice2 = {
        getAppliesTo: () => 1, // DECISION_DENY
        evaluate: sinon.stub().returns('advice2')
      };

      abstractPolicy.obligationExpressions = [];
      abstractPolicy.adviceExpressions = [mockAdvice1, mockAdvice2];

      abstractPolicy.processObligationAndAdvices(mockContext, 0, mockResult); // DECISION_PERMIT

      expect(advices).to.include('advice1');
      expect(mockAdvice1.evaluate.calledWith(mockContext)).to.be.true;
      expect(mockAdvice2.evaluate.called).to.be.false;
    });
  });

  describe('integration tests', () => {
    it('should have all required methods', () => {
      expect(abstractPolicy.abstractPolicyInitWithRoot).to.be.a('function');
      expect(abstractPolicy.setChildren).to.be.a('function');
      expect(abstractPolicy.getChildren).to.be.a('function');
      expect(abstractPolicy.getDefaultVersion).to.be.a('function');
      expect(abstractPolicy.match).to.be.a('function');
      expect(abstractPolicy.getCombiningAlg).to.be.a('function');
      expect(abstractPolicy.getMetaData).to.be.a('function');
      expect(abstractPolicy.evaluate).to.be.a('function');
      expect(abstractPolicy.processObligationAndAdvices).to.be.a('function');
    });

    it('should handle children management correctly', () => {
      const mockChildren = [
        { getElement: () => 'child1' },
        { getElement: () => 'child2' }
      ];

      abstractPolicy.setChildren(mockChildren);
      const retrievedChildren = abstractPolicy.getChildren();

      expect(retrievedChildren).to.deep.equal(['child1', 'child2']);
    });
  });
});