const { expect } = require('chai');
const sinon = require('sinon');

describe('AttributeFinder', () => {
  let AttributeFinder;
  let mockBagAttribute;
  let mockLogger;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../../xacml/finder/attributeFinder')];
    AttributeFinder = require('../../../xacml/finder/attributeFinder');

    // Mock dependencies
    mockBagAttribute = {
      isEmpty: sinon.stub(),
      bag: []
    };

    // Mock logger
    mockLogger = {
      error: sinon.stub()
    };

    // Make logger available globally for the module
    global.logger = mockLogger;
  });

  afterEach(() => {
    // Clean up global logger
    delete global.logger;
  });

  describe('constructor', () => {
    it('should create an AttributeFinder instance', () => {
      const finder = new AttributeFinder();
      expect(finder).to.be.an.instanceof(AttributeFinder);
    });
  });

  describe('attributeFinderInit()', () => {
    it('should initialize without error', () => {
      const finder = new AttributeFinder();
      expect(() => finder.attributeFinderInit()).to.not.throw();
    });
  });

  describe('setModules()', () => {
    it('should set modules and categorize them correctly', () => {
      const finder = new AttributeFinder();

      const mockDesignatorModule = {
        isDesignatorSupported: () => true,
        isSelectorSupported: () => false,
        getSupportedIds: () => ['test-id'],
        getSupportedCategories: () => ['test-category']
      };

      const mockSelectorModule = {
        isDesignatorSupported: () => false,
        isSelectorSupported: () => true
      };

      const mockBothModule = {
        isDesignatorSupported: () => true,
        isSelectorSupported: () => true
      };

      const modules = [mockDesignatorModule, mockSelectorModule, mockBothModule];

      finder.setModules(modules);

      expect(finder.allModules).to.equal(modules);
      expect(finder.designatorModules).to.have.lengthOf(2);
      expect(finder.selectorModules).to.have.lengthOf(2);
    });

    it('should handle empty modules array', () => {
      const finder = new AttributeFinder();
      finder.setModules([]);

      expect(finder.allModules).to.be.an('array').that.is.empty;
      expect(finder.designatorModules).to.be.an('array').that.is.empty;
      expect(finder.selectorModules).to.be.an('array').that.is.empty;
    });
  });

  describe('findAttribute()', () => {
    let finder;
    let mockModule;
    let mockContext;

    beforeEach(() => {
      finder = new AttributeFinder();
      mockContext = {};

      mockModule = {
        getSupportedIds: () => ['test-attribute-id'],
        getSupportedCategories: () => ['test-category'],
        findAttribute: sinon.stub()
      };

      finder.designatorModules = [mockModule];
      finder.selectorModules = [];
    });

    it('should return attribute values when module finds them', () => {
      // Create a simple mock attribute that satisfies BagAttribute requirements
      const mockAttribute = {
        isBag: () => false,
        getType: () => 'string'
      };
      const mockBag = { ...mockBagAttribute, isEmpty: () => false, bag: [mockAttribute, mockAttribute] };
      mockModule.findAttribute.returns({
        indeterminate: () => false,
        getAttributeValue: () => mockBag
      });

      const result = finder.findAttribute('string', 'test-attribute-id', null, 'test-category', mockContext);

      expect(result.status).to.be.null;
      expect(result.attributeValues).to.be.an.instanceof(require('../../../xacml/attr/bagAttribute'));
      expect(result.wasInd).to.be.false;
      expect(result.indeterminate).to.be.false;
      expect(result.attributeValues.bag).to.have.lengthOf(2);
    });

    it('should return indeterminate result when module returns indeterminate', () => {
      const mockStatus = { getMessage: () => 'Test error' };
      mockModule.findAttribute.returns({
        indeterminate: () => true,
        getStatus: () => mockStatus
      });

      const result = finder.findAttribute('string', 'test-attribute-id', null, 'test-category', mockContext);

      expect(mockLogger.error.calledOnce).to.be.true;
      expect(result.indeterminate()).to.be.true;
    });

    it('should skip modules that do not support the attribute ID', () => {
      mockModule.getSupportedIds = () => ['different-id'];

      const result = finder.findAttribute('string', 'test-attribute-id', null, 'test-category', mockContext);

      expect(mockModule.findAttribute.notCalled).to.be.true;
      expect(result.attributeValues.bag).to.be.empty;
    });

    it('should skip modules that do not support the category', () => {
      mockModule.getSupportedCategories = () => ['different-category'];

      const result = finder.findAttribute('string', 'test-attribute-id', null, 'test-category', mockContext);

      expect(mockModule.findAttribute.notCalled).to.be.true;
      expect(result.attributeValues.bag).to.be.empty;
    });

    it('should handle modules with null supported IDs and categories', () => {
      mockModule.getSupportedIds = () => null;
      mockModule.getSupportedCategories = () => null;
      mockModule.findAttribute.returns({
        indeterminate: () => false,
        getAttributeValue: () => ({ ...mockBagAttribute, isEmpty: () => true, bag: [] })
      });

      const result = finder.findAttribute('string', 'test-attribute-id', null, 'test-category', mockContext);

      expect(mockModule.findAttribute.calledOnce).to.be.true;
      expect(result.attributeValues.bag).to.be.empty;
    });

    it('should return empty result when no modules find attributes', () => {
      mockModule.findAttribute.returns({
        indeterminate: () => false,
        getAttributeValue: () => ({ ...mockBagAttribute, isEmpty: () => true, bag: [] })
      });

      const result = finder.findAttribute('string', 'test-attribute-id', null, 'test-category', mockContext);

      expect(result.attributeValues.bag).to.be.empty;
    });
  });

  describe('getModules()', () => {
    it('should return all modules', () => {
      const finder = new AttributeFinder();
      const modules = ['module1', 'module2'];
      finder.allModules = modules;

      const result = finder.getModules();

      expect(result).to.equal(modules);
    });
  });
});