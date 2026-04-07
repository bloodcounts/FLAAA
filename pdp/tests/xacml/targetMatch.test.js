const { expect } = require('chai');
const sinon = require('sinon');
const TargetMatch = require('../../xacml/targetMatch');
const MatchResult = require('../../xacml/matchResult');
const AttributeFactory = require('../../xacml/attr/attributeFactory');
const FunctionFactory = require('../../xacml/cond/functionFactory');
const AttributeDesignatorFactory = require('../../xacml/attr/attributeDesignatorFactory');
const AttributeSelectorFactory = require('../../xacml/attr/attributeSelectorFactory');
const XACMLConstants = require('../../xacml/XACMLConstants');

describe('TargetMatch', function() {
  let mockAttributeFactory;
  let mockFunctionFactory;
  let mockAttributeDesignatorFactory;
  let mockAttributeSelectorFactory;
  let mockMetaData;
  let mockContext;
  let mockFunction;
  let mockEvals;
  let mockAttrValue;
  let mockResult;

  beforeEach(function() {
    // Clear require cache to reset singleton factories
    delete require.cache[require.resolve('../../xacml/attr/attributeFactory')];
    delete require.cache[require.resolve('../../xacml/cond/functionFactory')];
    delete require.cache[require.resolve('../../xacml/attr/attributeDesignatorFactory')];
    delete require.cache[require.resolve('../../xacml/attr/attributeSelectorFactory')];

    // Mock factories
    mockAttributeFactory = {
      createValue1: sinon.stub().returns({ value: 'test-value' })
    };

    mockFunctionFactory = {
      createFunction: sinon.stub().returns({
        evaluate: sinon.stub().returns({ indeterminate: false, value: true }),
        checkInputsNoBag: sinon.stub().returns(true)
      })
    };

    mockAttributeDesignatorFactory = {
      getAbstractDesignator: sinon.stub().returns({ evaluate: sinon.stub() })
    };

    mockAttributeSelectorFactory = {
      getAbstractSelector: sinon.stub().returns({ evaluate: sinon.stub() })
    };

    // Mock metadata
    mockMetaData = {
      getXACMLVersion: sinon.stub().returns(XACMLConstants.XACML_VERSION_3_0)
    };

    // Mock context
    mockContext = {};

    // Mock function, evals, and attrValue
    mockFunction = {
      evaluate: sinon.stub().returns({ indeterminate: false, value: true }),
      checkInputsNoBag: sinon.stub().returns(true)
    };

    mockEvals = {
      evaluate: sinon.stub().returns({
        indeterminate: false,
        attributeValues: {
          size: sinon.stub().returns(1),
          bag: [{ value: 'test' }]
        }
      })
    };

    mockAttrValue = { value: 'test-attr-value' };

    mockResult = {
      indeterminate: false,
      attributeValues: {
        size: sinon.stub().returns(1),
        bag: [{ value: 'test' }]
      }
    };

    // Stub the factory getters
    sinon.stub(AttributeFactory.prototype, 'getInstance').returns(mockAttributeFactory);
    sinon.stub(FunctionFactory.prototype, 'getTargetInstance').returns(mockFunctionFactory);
    sinon.stub(AttributeDesignatorFactory.prototype, 'getFactory').returns(mockAttributeDesignatorFactory);
    sinon.stub(AttributeSelectorFactory.prototype, 'getFactory').returns(mockAttributeSelectorFactory);
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('Constructor and Initialization', function() {
    it('should create a TargetMatch instance', function() {
      const targetMatch = new TargetMatch();
      expect(targetMatch).to.be.an.instanceOf(TargetMatch);
    });

    it('should initialize with targetMatchInit for valid types', function() {
      const targetMatch = new TargetMatch();
      targetMatch.targetMatchInit(0, mockFunction, mockEvals, mockAttrValue);

      expect(targetMatch.type).to.equal(0);
      expect(targetMatch._function).to.equal(mockFunction);
      expect(targetMatch.evals).to.equal(mockEvals);
      expect(targetMatch.attrValue).to.equal(mockAttrValue);
    });

    it('should throw error for invalid type in targetMatchInit', function() {
      const targetMatch = new TargetMatch();

      expect(() => {
        targetMatch.targetMatchInit(999, mockFunction, mockEvals, mockAttrValue);
      }).to.throw('Unknown TargetMatch type');
    });

    it('should initialize with init method', function() {
      const targetMatch = new TargetMatch();
      targetMatch.init(mockFunction, mockEvals, mockAttrValue);

      expect(targetMatch._function).to.equal(mockFunction);
      expect(targetMatch.evals).to.equal(mockEvals);
      expect(targetMatch.attrValue).to.equal(mockAttrValue);
    });
  });

  describe('Factory Methods', function() {
    it('should create instance with getInstanceWithMetaData', function() {
      const mockRoot = {
        getAttribute: sinon.stub().returns('Subject'),
        childNodes: sinon.stub().returns({
          length: 0,
          *[Symbol.iterator] () {}
        })
      };

      const targetMatch = TargetMatch.prototype.getInstanceWithMetaData(mockRoot, mockMetaData);
      expect(targetMatch).to.be.an.instanceOf(TargetMatch);
    });

    it('should create instance with getInstance', function() {
      const mockRoot = {
        getAttribute: sinon.stub().returns('Subject'),
        childNodes: sinon.stub().returns({
          length: 0,
          *[Symbol.iterator] () {}
        })
      };

      const targetMatch = TargetMatch.prototype.getInstance(mockRoot, 0, mockMetaData);
      expect(targetMatch).to.be.an.instanceOf(TargetMatch);
    });

    it('should handle AttributeDesignator in getInstance', function() {
      const mockRoot = {
        getAttribute: sinon.stub().returns('Subject'),
        childNodes: sinon.stub().returns({
          length: 1,
          *[Symbol.iterator] () {
            yield {
              name: sinon.stub().returns('AttributeDesignator'),
              getAttribute: sinon.stub().returns('test')
            };
          }
        })
      };

      const targetMatch = TargetMatch.prototype.getInstance(mockRoot, 0, mockMetaData);
      expect(targetMatch).to.be.an.instanceOf(TargetMatch);
    });

    it('should handle AttributeSelector in getInstance', function() {
      const mockRoot = {
        getAttribute: sinon.stub().returns('Subject'),
        childNodes: sinon.stub().returns({
          length: 1,
          *[Symbol.iterator] () {
            yield {
              name: sinon.stub().returns('AttributeSelector'),
              getAttribute: sinon.stub().returns('test')
            };
          }
        })
      };

      const targetMatch = TargetMatch.prototype.getInstance(mockRoot, 0, mockMetaData);
      expect(targetMatch).to.be.an.instanceOf(TargetMatch);
    });

    it('should handle AttributeValue in getInstance', function() {
      const mockRoot = {
        getAttribute: sinon.stub().returns('Subject'),
        childNodes: sinon.stub().returns({
          length: 1,
          *[Symbol.iterator] () {
            yield {
              name: sinon.stub().returns('AttributeValue'),
              getAttribute: sinon.stub().returns('test')
            };
          }
        })
      };

      const targetMatch = TargetMatch.prototype.getInstance(mockRoot, 0, mockMetaData);
      expect(targetMatch).to.be.an.instanceOf(TargetMatch);
    });
  });

  describe('Match Evaluation', function() {
    it('should return MATCH when function evaluates to true', function() {
      const targetMatch = new TargetMatch();
      targetMatch.init(mockFunction, mockEvals, mockAttrValue);

      mockEvals.evaluate.returns(mockResult);
      mockFunction.evaluate.returns({ indeterminate: false, value: true });

      const result = targetMatch.match(mockContext);

      expect(result).to.have.property('result');
      expect(result.result).to.equal(MatchResult.prototype.MATCH);
    });

    it('should return NO_MATCH when function evaluates to false', function() {
      const targetMatch = new TargetMatch();
      targetMatch.init(mockFunction, mockEvals, mockAttrValue);

      mockEvals.evaluate.returns(mockResult);
      mockFunction.evaluate.returns({ indeterminate: false, value: false });

      const result = targetMatch.match(mockContext);

      expect(result).to.have.property('result');
      expect(result.result).to.equal(MatchResult.prototype.NO_MATCH);
    });

    it('should return INDETERMINATE when evals returns indeterminate', function() {
      const targetMatch = new TargetMatch();
      targetMatch.init(mockFunction, mockEvals, mockAttrValue);

      mockEvals.evaluate.returns({
        indeterminate: true,
        getStatus: sinon.stub().returns('test-status'),
        attributeValues: { size: sinon.stub().returns(0) }
      });

      const result = targetMatch.match(mockContext);

      expect(result).to.have.property('result');
      expect(result.result).to.equal(MatchResult.prototype.INDETERMINATE);
    });

    it('should return NO_MATCH when no attribute values', function() {
      const targetMatch = new TargetMatch();
      targetMatch.init(mockFunction, mockEvals, mockAttrValue);

      mockEvals.evaluate.returns({
        indeterminate: false,
        attributeValues: { size: sinon.stub().returns(0) }
      });

      const result = targetMatch.match(mockContext);

      expect(result).to.have.property('result');
      expect(result.result).to.equal(MatchResult.prototype.NO_MATCH);
    });

    it('should handle indeterminate result in evaluateMatch', function() {
      const targetMatch = new TargetMatch();
      targetMatch.init(mockFunction, mockEvals, mockAttrValue);

      mockFunction.evaluate.returns({
        indeterminate: true,
        getStatus: sinon.stub().returns('test-status')
      });

      const result = targetMatch.evaluateMatch(mockAttrValue, [{ value: 'test' }], mockContext);

      expect(result).to.be.an.instanceOf(MatchResult);
      expect(result.getResult()).to.equal(MatchResult.prototype.INDETERMINATE);
    });
  });

  describe('Error Handling', function() {
    it('should handle errors in factory creation', function() {
      const mockRoot = {
        getAttribute: sinon.stub().throws(new Error('XML parsing error')),
        childNodes: sinon.stub().returns({
          length: 0,
          *[Symbol.iterator] () {}
        })
      };

      expect(() => {
        TargetMatch.prototype.getInstance(mockRoot, 0, mockMetaData);
      }).to.throw();
    });
  });
});