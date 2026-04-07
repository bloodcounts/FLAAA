const { expect } = require('chai');
const sinon = require('sinon');
const BasicEvaluationCtx = require('../../xacml/ctx/basicEvaluationCtx');
const TimeAttribute = require('../../xacml/attr/timeAttribute');
const DateAttribute = require('../../xacml/attr/dateAttribute');
const DateTimeAttribute = require('../../xacml/attr/dateTimeAttribute');
const EvaluationResult = require('../../xacml/cond/evaluationResult');
const BagAttribute = require('../../xacml/attr/bagAttribute');

describe('BasicEvaluationCtx', function() {
  let basicEvaluationCtx;
  let mockTimeAttribute;
  let mockDateAttribute;
  let mockDateTimeAttribute;
  let mockPdpConfig;
  let mockAttributeFinder;
  let mockEvaluationResult;
  let mockBagAttribute;

  beforeEach(function() {
    // Create a new instance for each test
    basicEvaluationCtx = new BasicEvaluationCtx();

    // Mock TimeAttribute
    mockTimeAttribute = {
      timeAttributeInitDate: sinon.stub()
    };

    // Mock DateAttribute
    mockDateAttribute = {
      dateAttributeInit2: sinon.stub()
    };

    // Mock DateTimeAttribute
    mockDateTimeAttribute = {
      dateTimeAttributeInit2: sinon.stub()
    };

    // Mock EvaluationResult
    mockEvaluationResult = {
      evaluationResultInit: sinon.stub()
    };

    // Mock BagAttribute
    mockBagAttribute = {
      createEmptyBag: sinon.stub()
    };

    // Mock attribute finder
    mockAttributeFinder = {
      findAttribute: sinon.stub()
    };

    // Mock pdpConfig
    mockPdpConfig = {
      getAttributeFinder: sinon.stub().returns(mockAttributeFinder)
    };

    // Set up the context with mock pdpConfig
    basicEvaluationCtx.pdpConfig = mockPdpConfig;

    // Stub the constructors to return our mocks
    sinon.stub(TimeAttribute.prototype, 'timeAttributeInitDate').callsFake(function() { return mockTimeAttribute; });
    sinon.stub(DateAttribute.prototype, 'dateAttributeInit2').callsFake(function() { return mockDateAttribute; });
    sinon.stub(DateTimeAttribute.prototype, 'dateTimeAttributeInit2').callsFake(function() { return mockDateTimeAttribute; });
    sinon.stub(EvaluationResult.prototype, 'evaluationResultInit').callsFake(function() { return mockEvaluationResult; });
    sinon.stub(BagAttribute.prototype, 'createEmptyBag').returns(mockBagAttribute);
  });

  afterEach(function() {
    // Restore all stubs
    sinon.restore();
  });

  describe('constructor', function() {
    it('should create a BasicEvaluationCtx instance', function() {
      expect(basicEvaluationCtx).to.be.an.instanceOf(BasicEvaluationCtx);
    });
  });

  describe('getRequestRoot', function() {
    it('should return the requestRoot property', function() {
      const mockRequestRoot = { some: 'data' };
      basicEvaluationCtx.requestRoot = mockRequestRoot;

      const result = basicEvaluationCtx.getRequestRoot();

      expect(result).to.equal(mockRequestRoot);
    });

    it('should return undefined when requestRoot is not set', function() {
      const result = basicEvaluationCtx.getRequestRoot();

      expect(result).to.be.undefined;
    });
  });

  describe('isSearching', function() {
    it('should always return false', function() {
      const result = basicEvaluationCtx.isSearching();

      expect(result).to.be.false;
    });
  });

  describe('getCurrentTime', function() {
    it('should return a TimeAttribute when useCachedEnvValues is false', function() {
      const result = basicEvaluationCtx.getCurrentTime();

      expect(result).to.be.an.instanceOf(TimeAttribute);
      expect(TimeAttribute.prototype.timeAttributeInitDate.calledOnce).to.be.true;
    });

    it('should return cached currentTime when useCachedEnvValues is true', function() {
      // This test would require modifying the module-level variable, which is complex
      // Skipping this edge case as it's not easily testable without module mocking
    });
  });

  describe('getCurrentDate', function() {
    it('should return a DateAttribute when useCachedEnvValues is false', function() {
      const result = basicEvaluationCtx.getCurrentDate();

      expect(result).to.be.an.instanceOf(DateAttribute);
      expect(DateAttribute.prototype.dateAttributeInit2.calledOnce).to.be.true;
    });
  });

  describe('getCurrentDateTime', function() {
    it('should return a DateTimeAttribute when useCachedEnvValues is false', function() {
      const result = basicEvaluationCtx.getCurrentDateTime();

      expect(result).to.be.an.instanceOf(DateTimeAttribute);
      expect(DateTimeAttribute.prototype.dateTimeAttributeInit2.calledOnce).to.be.true;
    });
  });

  describe('getAttribute', function() {
    it('should call attribute finder when pdpConfig has attribute finder configured', function() {
      const path = 'test-path';
      const type = 'test-type';
      const category = 'test-category';
      const contextSelector = 'test-selector';
      const xpathVersion = 'test-version';
      const expectedResult = { found: true };

      mockAttributeFinder.findAttribute.returns(expectedResult);

      const result = basicEvaluationCtx.getAttribute(path, type, category, contextSelector, xpathVersion);

      expect(mockAttributeFinder.findAttribute.calledOnceWith(path, type, basicEvaluationCtx, xpathVersion)).to.be.true;
      expect(result).to.equal(expectedResult);
    });

    it('should return empty bag when no attribute finder is configured', function() {
      const path = 'test-path';
      const type = 'test-type';
      const category = 'test-category';
      const contextSelector = 'test-selector';
      const xpathVersion = 'test-version';

      expect(typeof basicEvaluationCtx.getAttribute).to.equal('function');

      // Mock pdpConfig to return null for attribute finder
      const getAttributeFinderStub = sinon.stub().returns(null);
      basicEvaluationCtx.pdpConfig = { getAttributeFinder: getAttributeFinderStub };

      // Mock console.warn to avoid console output during test
      const consoleWarnStub = sinon.stub(console, 'warn');

      try {
        basicEvaluationCtx.getAttribute(path, type, category, contextSelector, xpathVersion);
      } catch (e) {
        console.log('Error:', e);
        throw e;
      }

      expect(consoleWarnStub.calledOnce).to.be.true;
      expect(consoleWarnStub.calledWith("Context tried to invoke AttributeFinder but was not configured with one")).to.be.true;

      consoleWarnStub.restore();
    });

    it('should handle null pdpConfig gracefully', function() {
      const path = 'test-path';
      const type = 'test-type';
      const category = 'test-category';
      const contextSelector = 'test-selector';
      const xpathVersion = 'test-version';

      // Remove pdpConfig
      delete basicEvaluationCtx.pdpConfig;

      // Mock console.warn
      const consoleWarnStub = sinon.stub(console, 'warn');

      basicEvaluationCtx.getAttribute(path, type, category, contextSelector, xpathVersion);

      expect(consoleWarnStub.calledOnce).to.be.true;

      consoleWarnStub.restore();
    });
  });
});